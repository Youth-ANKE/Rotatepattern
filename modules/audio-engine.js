/**
 * 音频引擎模块
 * 处理旋转滴答声、背景音乐播放和绘图互动音乐生成
 * 支持8种音乐主题，多种音阶和乐器风格
 * 支持12首在线音乐播放列表、14种可合成音效、3种播放模式、节拍同步
 * 采用稳健的自初始化模式，确保在任何交互下都能正常工作
 * V2.0 优化：资源泄漏清理、事件监听生命周期管理、节点跟踪回收
 */
const AudioEngine = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    tickGain: null,
    musicInterval: null,
    musicNoteIndex: 0,

    // 音乐主题定义（8种）
    themes: {
        aurora: { name: '极光', bpm: 60, noteInterval: 500, notes: [261.63, 329.63, 392.00, 523.25, 587.33, 659.25, 783.99], waveform: 'sine', gain: 0.5, filterFreq: 800, filterType: 'lowpass', reverb: 0.4, octave: 1 },
        cyber: { name: '赛博', bpm: 120, noteInterval: 250, notes: [311.13, 369.99, 440.00, 523.25, 622.25, 739.99, 880.00], waveform: 'square', gain: 0.3, filterFreq: 1200, filterType: 'bandpass', reverb: 0.15, octave: 1 },
        forest: { name: '森林', bpm: 90, noteInterval: 333, notes: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33], waveform: 'triangle', gain: 0.4, filterFreq: 600, filterType: 'lowpass', reverb: 0.3, octave: 1 },
        dream: { name: '梦境', bpm: 70, noteInterval: 429, notes: [293.66, 329.63, 369.99, 440.00, 493.88, 554.37, 622.25], waveform: 'sine', gain: 0.35, filterFreq: 2000, filterType: 'lowpass', reverb: 0.5, octave: 1 },
        temple: { name: '古风', bpm: 65, noteInterval: 462, notes: [262, 294, 330, 392, 440, 524, 588], waveform: 'sine', gain: 0.35, filterFreq: 400, filterType: 'lowpass', reverb: 0.6, octave: 1 },
        space: { name: '太空', bpm: 50, noteInterval: 600, notes: [130.81, 164.81, 196.00, 261.63, 329.63, 392.00, 523.25], waveform: 'sawtooth', gain: 0.2, filterFreq: 300, filterType: 'lowpass', reverb: 0.8, octave: 1 },
        jazz: { name: '爵士', bpm: 110, noteInterval: 273, notes: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 587.33], waveform: 'sawtooth', gain: 0.25, filterFreq: 1500, filterType: 'bandpass', reverb: 0.2, octave: 1 },
        ocean: { name: '海洋', bpm: 55, noteInterval: 545, notes: [196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00], waveform: 'triangle', gain: 0.3, filterFreq: 500, filterType: 'lowpass', reverb: 0.7, octave: 1 }
    },

    scales: {
        major: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99],
        pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66],
        blues: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 587.33, 622.25, 698.46, 783.99, 880.00, 932.33],
        minor: [261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 622.25, 698.46, 783.99],
        wholeTone: [261.63, 293.66, 329.63, 369.99, 415.30, 466.16, 523.25, 587.33, 659.25, 739.99, 830.61, 932.33],
        chinese: [262, 294, 330, 392, 440, 524, 588, 660, 784, 880, 1048, 1176],
        ambient: [130.81, 164.81, 196.00, 261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98],
    },

    drawNoteScales: { aurora: 'major', cyber: 'blues', forest: 'pentatonic', dream: 'wholeTone', temple: 'chinese', space: 'ambient', jazz: 'blues', ocean: 'pentatonic' },
    lastDrawNoteTime: 0,

    // 在线音乐
    onlineMusicData: null,
    onlineMusicAudio: null,
    onlineMusicSource: null,
    onlineMusicGain: null,
    onlineMusicPlaying: false,
    onlineMusicLoading: false,
    onlineMusicError: null,
    _onlineMusicAbortController: null, // 管理事件监听生命周期

    // 播放列表
    playlist: [],
    playlistIndex: 0,
    playlistMode: 'random',
    playlistTotal: 0,

    // 音效
    soundGain: null,
    _scheduledNodes: new Set(), // 跟踪所有已调度节点，定期清理
    _cleanupTimer: null,
    _cleanupInterval: 30000, // 每30秒清理一次
    _maxTrackedNodes: 400,

    // 节拍同步
    beatBPM: 60,
    beatInterval: 1000,
    lastBeatTime: 0,
    beatCallback: null,

    // ==================== 资源泄漏防护 ====================

    /**
     * 安全断开音频节点连接
     */
    _safeDisconnect(...nodes) {
        for (const node of nodes) {
            if (node && typeof node.disconnect === 'function') {
                try { node.disconnect(); } catch (e) { /* ignore */ }
            }
        }
    },

    /**
     * 跟踪已调度的音频节点（防止大量一次性音效泄漏）
     */
    _trackNode(osc, gain, filter) {
        this._schedulePeriodicCleanup();
        this._scheduledNodes.add({ source: { osc, gain, filter }, time: performance.now() });
        if (this._scheduledNodes.size > 500) {
            const entries = [...this._scheduledNodes].sort((a, b) => a.time - b.time);
            const toRemove = entries.slice(0, entries.length - this._maxTrackedNodes);
            for (const entry of toRemove) this._scheduledNodes.delete(entry);
        }
    },

    /**
     * 启动定期清理定时器
     */
    _schedulePeriodicCleanup() {
        if (this._cleanupTimer) return;
        this._cleanupTimer = setInterval(() => {
            const now = performance.now();
            for (const entry of this._scheduledNodes) {
                if (now - entry.time > 60000) {
                    try {
                        const { osc, gain, filter } = entry.source;
                        this._safeDisconnect(osc, gain, filter);
                    } catch (e) { /* ignore */ }
                    this._scheduledNodes.delete(entry);
                }
            }
            if (this._scheduledNodes.size === 0 && this._cleanupTimer) {
                clearInterval(this._cleanupTimer);
                this._cleanupTimer = null;
            }
        }, this._cleanupInterval);
    },

    /**
     * 安全清理 Audio 元素（移除事件监听+释放资源）
     */
    _cleanupAudioElement(audio) {
        if (!audio) return;
        audio.onended = null;
        audio.onerror = null;
        audio.oncanplay = null;
        audio.onloadedmetadata = null;
        try { audio.pause(); } catch (e) { /* ignore */ }
        try { audio.src = ''; } catch (e) { /* ignore */ }
        try { audio.load(); } catch (e) { /* ignore */ }
    },

    // ==================== 播放列表管理 ====================

    _getBuiltinPlaylist() {
        return [
            { title: '舒缓旋律 - 轻钢琴', artist: 'SoundHelix', url: '/public/music/song-1.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
            { title: '海洋冥想 - 浪涛声', artist: 'SoundHelix', url: '/public/music/song-2.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
            { title: '创意灵感 - 律动', artist: 'SoundHelix', url: '/public/music/song-3.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
            { title: '日出 - 温暖氛围', artist: 'SoundHelix', url: '/public/music/song-4.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
            { title: '月夜 - 静谧旋律', artist: 'SoundHelix', url: '/public/music/song-5.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
            { title: '森林漫步 - 自然', artist: 'SoundHelix', url: '/public/music/song-6.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
            { title: '星空 - 梦幻电子', artist: 'SoundHelix', url: '/public/music/song-7.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
            { title: '花舞 - 轻快活泼', artist: 'SoundHelix', url: '/public/music/song-8.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
            { title: '山巅 - 空灵悠远', artist: 'SoundHelix', url: '/public/music/song-9.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
            { title: '潮汐 - 循环波纹', artist: 'SoundHelix', url: '/public/music/song-10.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
            { title: '微风 - 清新怡人', artist: 'SoundHelix', url: '/public/music/song-11.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
            { title: '庆典 - 欢乐氛围', artist: 'SoundHelix', url: '/public/music/song-12.mp3', source: 'local', duration: 300, onlineUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' }
        ];
    },

    async fetchPlaylist(mode) {
        try {
            const baseUrl = window.location.origin;
            const resp = await fetch(`${baseUrl}/api/online-music/playlist?mode=${mode || 'random'}`);
            const data = await resp.json();
            if (data.success) {
                this.playlist = data.playlist;
                this.playlistTotal = data.total;
                this.playlistMode = data.mode;
                return this.playlist;
            }
        } catch (e) {
            console.warn('[AudioEngine] 后端获取播放列表失败，使用内置:', e.message);
        }
        this.playlist = this._getBuiltinPlaylist();
        this.playlistTotal = this.playlist.length;
        this.playlistMode = mode || 'random';
        return this.playlist;
    },

    async setPlayMode(mode) {
        this.playlistMode = mode;
        await this.fetchPlaylist(mode);
        if (this.onlineMusicPlaying) {
            this.stopOnlineMusic();
            return await this.playOnlineMusic();
        }
        return true;
    },

    async nextTrack() {
        if (!this.playlist.length) return false;
        if (this.playlistMode === 'loop') return false;
        this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
        this.stopOnlineMusic();
        return await this.playOnlineMusic();
    },

    async prevTrack() {
        if (!this.playlist.length) return false;
        if (this.playlistMode === 'loop') return false;
        this.playlistIndex = (this.playlistIndex - 1 + this.playlist.length) % this.playlist.length;
        this.stopOnlineMusic();
        return await this.playOnlineMusic();
    },

    clearPlaylist() {
        this.playlist = [];
        this.playlistIndex = 0;
        this.playlistTotal = 0;
    },

    // ==================== 在线音乐 ====================

    async fetchOnlineMusic() {
        try {
            const baseUrl = window.location.origin;
            const resp = await fetch(`${baseUrl}/api/online-music/list`);
            const data = await resp.json();
            if (data.success && data.url) {
                this.onlineMusicData = data;
                return data;
            }
            throw new Error(data.message || '获取失败');
        } catch (e) {
            console.error('[AudioEngine] 获取在线音乐失败:', e.message);
            this.onlineMusicError = e.message;
            return null;
        }
    },

    async playOnlineMusic() {
        try {
            if (!this.ensureInit()) return false;
            if (this.onlineMusicPlaying) return true;
            if (this.onlineMusicLoading) return false;
            if (!this.playlist.length) {
                this.onlineMusicLoading = true;
                await this.fetchPlaylist(this.playlistMode);
                this.onlineMusicLoading = false;
            }
            const track = this.playlist[this.playlistIndex];
            if (!track) {
                this.onlineMusicLoading = true;
                const data = await this.fetchOnlineMusic();
                this.onlineMusicLoading = false;
                if (!data) return false;
                return await this._playSingleTrack(data);
            }
            return await this._playSingleTrack(track);
        } catch (e) {
            console.error('[AudioEngine] playOnlineMusic 错误:', e.message);
            this.onlineMusicError = e.message;
            this.onlineMusicPlaying = false;
            return false;
        }
    },

    async _playSingleTrack(track, _isRetry) {
        const musicUrl = track.url;
        if (!musicUrl) { this.onlineMusicError = '曲目URL为空'; return false; }

        // 本地文件直接播放，在线文件通过代理
        let audioSrc;
        const isLocalUrl = musicUrl.startsWith('/public/') || musicUrl.startsWith('/music/');
        if (isLocalUrl) {
            // 本地内置音乐文件，直接使用 URL（无需代理，express.static 已提供）
            audioSrc = musicUrl;
        } else {
            // 在线音乐，通过服务端代理播放
            audioSrc = `${window.location.origin}/api/online-music/stream?url=${encodeURIComponent(musicUrl)}`;
        }

        // 完全清理旧 audio 元素（包括事件监听）
        if (this.onlineMusicAudio) {
            this._cleanupAudioElement(this.onlineMusicAudio);
            this.onlineMusicAudio = null;
        }
        if (this._onlineMusicAbortController) {
            try { this._onlineMusicAbortController.abort(); } catch (e) { /* ignore */ }
            this._onlineMusicAbortController = null;
        }

        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = audioSrc;
        audio.loop = this.playlistMode === 'loop';
        audio.preload = 'auto';
        audio.volume = StateManager.state.onlineMusicVolume || 0.5;

        const abortController = new AbortController();
        const signal = abortController.signal;
        this.onlineMusicAudio = audio;
        this._onlineMusicAbortController = abortController;

        try {
            await audio.play();
            this.onlineMusicPlaying = true;
            this.onlineMusicError = null;
            this.onlineMusicData = track;
            console.log(`[AudioEngine] 开始播放: ${track.title} (${this.playlistIndex + 1}/${this.playlist.length}) [${isLocalUrl ? '本地' : '在线'}]`);

            // 连接音频源到可视化分析器
            if (typeof CreativeExtensions !== 'undefined' && CreativeExtensions._visualizerEnabled) {
                CreativeExtensions.connectAudioSource(audio);
            }

            // 本地文件加载失败时，回退到在线 URL
            audio.addEventListener('error', () => {
                if (signal.aborted) return;
                // 本地文件失败且未重试过，回退到在线 URL
                if (isLocalUrl && !_isRetry && track.onlineUrl) {
                    console.warn(`[AudioEngine] 本地文件失败，回退在线: ${track.title}`);
                    this.onlineMusicPlaying = false;
                    this._cleanupAudioElement(audio);
                    if (this.onlineMusicAudio === audio) this.onlineMusicAudio = null;
                    const retryTrack = { ...track, url: track.onlineUrl };
                    this._playSingleTrack(retryTrack, true);
                    return;
                }
                console.error('[AudioEngine] 播放错误:', audio.error?.message);
                this.onlineMusicError = audio.error?.message || '播放错误';
                this.onlineMusicPlaying = false;
                this._cleanupAudioElement(audio);
                if (this.onlineMusicAudio === audio) this.onlineMusicAudio = null;
            }, { signal });

            audio.addEventListener('ended', () => {
                if (signal.aborted) return;
                this.onlineMusicPlaying = false;
                this._cleanupAudioElement(audio);
                if (this.onlineMusicAudio === audio) this.onlineMusicAudio = null;
                if (this.playlistMode === 'sequential' || this.playlistMode === 'random') {
                    this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
                    this._playSingleTrack(this.playlist[this.playlistIndex]);
                }
            }, { signal });

            return true;
        } catch (playErr) {
            this._cleanupAudioElement(audio);
            if (this.onlineMusicAudio === audio) this.onlineMusicAudio = null;
            console.warn('[AudioEngine] 播放被阻止:', playErr.message);
            throw playErr;
        }
    },

    stopOnlineMusic() {
        try {
            if (this._onlineMusicAbortController) {
                try { this._onlineMusicAbortController.abort(); } catch (e) { /* ignore */ }
                this._onlineMusicAbortController = null;
            }
            if (this.onlineMusicAudio) {
                this._cleanupAudioElement(this.onlineMusicAudio);
                this.onlineMusicAudio = null;
            }
            this.onlineMusicSource = null;
            this.onlineMusicGain = null;
            this.onlineMusicPlaying = false;
        } catch (e) { console.error('[AudioEngine] stopOnlineMusic 错误:', e.message); }
    },

    setOnlineMusicVolume(vol) {
        StateManager.setState({ onlineMusicVolume: vol });
        if (this.onlineMusicAudio) this.onlineMusicAudio.volume = vol;
    },

    async toggleOnlineMusic(enabled) {
        if (enabled) return await this.playOnlineMusic();
        else { this.stopOnlineMusic(); return true; }
    },

    // ==================== 音效合成 ====================

    _getBuiltinSoundEffects() {
        return [
            { id: 'rain', name: '🌧️ 细雨', type: 'whiteNoise', params: { duration: 2.0, highpass: 2000, gain: 0.3 } },
            { id: 'ocean', name: '🌊 海浪', type: 'brownNoise', params: { duration: 3.0, lowpass: 600, gain: 0.25 } },
            { id: 'wind', name: '💨 风声', type: 'pinkNoise', params: { duration: 2.5, bandpass: { freq: 400, Q: 0.5 }, gain: 0.2 } },
            { id: 'drip', name: '💧 水滴', type: 'tone', params: { freq: 800, decay: 0.15, gain: 0.4 } },
            { id: 'chime', name: '🔔 风铃', type: 'harmonic', params: { baseFreq: 440, harmonics: [1, 2.5, 4.2], decay: 0.8, gain: 0.3 } },
            { id: 'click', name: '🖱️ 咔嗒', type: 'noiseClick', params: { duration: 0.03, gain: 0.5 } },
            { id: 'swoosh', name: '🌀 嗖嗖', type: 'sweep', params: { freqStart: 200, freqEnd: 2000, duration: 0.4, gain: 0.3 } },
            { id: 'bubble', name: '🫧 泡泡', type: 'tone', params: { freq: 1200, decay: 0.08, gain: 0.35 } },
            { id: 'heartbeat', name: '💓 心跳', type: 'pulse', params: { freq: 60, decay: 0.2, gain: 0.5, interval: 0.8 } },
            { id: 'crackle', name: '🔥 噼啪', type: 'crackle', params: { density: 0.3, duration: 1.0, gain: 0.4 } },
            { id: 'harp', name: '🎵 竖琴拨弦', type: 'tone', params: { freq: 523, decay: 0.6, gain: 0.3 } },
            { id: 'bell', name: '🔔 钟声', type: 'harmonic', params: { baseFreq: 660, harmonics: [1, 3, 5], decay: 1.5, gain: 0.25 } },
            { id: 'rainforest', name: '🌴 雨林', type: 'complex', params: { layers: ['rain', 'chime'], gain: 0.3 } },
            { id: 'sparkle', name: '✨ 闪耀', type: 'sparkle', params: { count: 6, freqRange: [2000, 5000], decay: 0.3, gain: 0.2 } }
        ];
    },

    async fetchSoundEffects() {
        try {
            const baseUrl = window.location.origin;
            const resp = await fetch(`${baseUrl}/api/sound-effects/list`);
            const data = await resp.json();
            if (data.success) return data.effects;
        } catch (e) { /* 使用内置 */ }
        return this._getBuiltinSoundEffects();
    },

    playSoundEffect(effect) {
        if (!effect || !this.ensureInit()) return;
        if (!this.soundGain) {
            this.soundGain = this.ctx.createGain();
            this.soundGain.gain.value = 1;
            this.soundGain.connect(this.masterGain || this.ctx.destination);
        }
        try {
            switch (effect.type) {
                case 'whiteNoise': this._synthWhiteNoise(effect.params); break;
                case 'brownNoise': this._synthBrownNoise(effect.params); break;
                case 'pinkNoise': this._synthPinkNoise(effect.params); break;
                case 'tone': this._synthTone(effect.params); break;
                case 'harmonic': this._synthHarmonic(effect.params); break;
                case 'noiseClick': this._synthNoiseClick(effect.params); break;
                case 'sweep': this._synthSweep(effect.params); break;
                case 'pulse': this._synthPulse(effect.params); break;
                case 'crackle': this._synthCrackle(effect.params); break;
                case 'sparkle': this._synthSparkle(effect.params); break;
                default: this._synthTone(effect.params); break;
            }
        } catch (e) { console.warn('[AudioEngine] 音效合成失败:', e.message); }
    },

    // ========== 音效合成器（全部加入_trackNode跟踪） ==========

    _synthWhiteNoise(p) {
        const dur = p.duration || 2, sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, sr * dur, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < sr * dur; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = p.highpass || 2000;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(p.gain || 0.3, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        src.connect(f); f.connect(g); g.connect(this.soundGain);
        src.start(); src.stop(this.ctx.currentTime + dur + 0.1);
        this._trackNode(null, g, f);
    },

    _synthBrownNoise(p) {
        const dur = p.duration || 3, sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, sr * dur, sr);
        const d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < sr * dur; i++) { last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02; d[i] = last * 3.5; }
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = p.lowpass || 600;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(p.gain || 0.25, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        src.connect(f); f.connect(g); g.connect(this.soundGain);
        src.start(); src.stop(this.ctx.currentTime + dur + 0.1);
        this._trackNode(null, g, f);
    },

    _synthPinkNoise(p) {
        const dur = p.duration || 2.5, sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, sr * dur, sr);
        const d = buf.getChannelData(0);
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for (let i = 0; i < sr * dur; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
            b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
            b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
            d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6 = w*0.115926;
        }
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(p.gain || 0.2, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        if (p.bandpass) {
            const f = this.ctx.createBiquadFilter();
            f.type = 'bandpass'; f.frequency.value = p.bandpass.freq || 400; f.Q.value = p.bandpass.Q || 0.5;
            src.connect(f); f.connect(g);
            this._trackNode(null, g, f);
        } else { this._trackNode(null, g, null); }
        g.connect(this.soundGain); src.start(); src.stop(this.ctx.currentTime + dur + 0.1);
    },

    _synthTone(p) {
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.frequency.value = p.freq || 800; o.type = 'sine';
        const now = this.ctx.currentTime, decay = p.decay || 0.15;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(p.gain || 0.4, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, now + decay);
        o.connect(g); g.connect(this.soundGain); o.start(); o.stop(now + decay + 0.1);
        this._trackNode(o, g, null);
    },

    _synthHarmonic(p) {
        const base = p.baseFreq || 440, harms = p.harmonics || [1, 2.5, 4.2];
        const decay = p.decay || 0.8, gv = p.gain || 0.3, now = this.ctx.currentTime;
        harms.forEach((h, i) => {
            const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
            o.frequency.value = base * h; o.type = 'sine';
            g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gv * (1 - i * 0.2), now + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, now + decay);
            o.connect(g); g.connect(this.soundGain); o.start(); o.stop(now + decay + 0.1);
            this._trackNode(o, g, null);
        });
    },

    _synthNoiseClick(p) {
        const dur = p.duration || 0.03, gv = p.gain || 0.5, sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, sr * dur, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < sr * dur; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * dur * 0.1));
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const g = this.ctx.createGain(); g.gain.value = gv;
        src.connect(g); g.connect(this.soundGain); src.start();
        this._trackNode(null, g, null);
    },

    _synthSweep(p) {
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.frequency.setValueAtTime(p.freqStart || 200, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(p.freqEnd || 2000, this.ctx.currentTime + (p.duration || 0.4));
        o.type = 'sine';
        const now = this.ctx.currentTime, dur = p.duration || 0.4;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(p.gain || 0.3, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        o.connect(g); g.connect(this.soundGain); o.start(); o.stop(now + dur + 0.1);
        this._trackNode(o, g, null);
    },

    _synthPulse(p) {
        const freq = p.freq || 60, decay = p.decay || 0.2, gv = p.gain || 0.5, intv = p.interval || 0.8, now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
            o.frequency.value = freq + (i === 1 ? 20 : 0); o.type = 'sine';
            const t = now + i * intv;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gv, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, t + decay);
            o.connect(g); g.connect(this.soundGain); o.start(t); o.stop(t + decay + 0.1);
            this._trackNode(o, g, null);
        }
    },

    _synthCrackle(p) {
        const dur = p.duration || 1.0, density = p.density || 0.3, gv = p.gain || 0.4, now = this.ctx.currentTime;
        const count = Math.floor(dur * density * 30);
        for (let i = 0; i < count; i++) {
            const t = now + Math.random() * dur, freq = 800 + Math.random() * 3000, d = 0.02 + Math.random() * 0.06, vol = gv * (0.3 + Math.random() * 0.7);
            const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
            o.frequency.value = freq; o.type = 'sine';
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.001);
            g.gain.exponentialRampToValueAtTime(0.001, t + d);
            o.connect(g); g.connect(this.soundGain); o.start(t); o.stop(t + d + 0.01);
            this._trackNode(o, g, null);
        }
    },

    _synthSparkle(p) {
        const count = p.count || 6, freqRange = p.freqRange || [2000, 5000], decay = p.decay || 0.3, gv = p.gain || 0.2, now = this.ctx.currentTime;
        for (let i = 0; i < count; i++) {
            const t = now + Math.random() * 0.2, freq = freqRange[0] + Math.random() * (freqRange[1] - freqRange[0]), vol = gv * (0.5 + Math.random() * 0.5);
            const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
            o.frequency.value = freq; o.type = 'sine';
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.002);
            g.gain.exponentialRampToValueAtTime(0.001, t + decay);
            o.connect(g); g.connect(this.soundGain); o.start(t); o.stop(t + decay + 0.05);
            this._trackNode(o, g, null);
        }
    },

    // ==================== 节拍同步 ====================

    async fetchBeatSync(rotationSpeed) {
        try {
            const baseUrl = window.location.origin;
            const resp = await fetch(`${baseUrl}/api/beat/sync?speed=${rotationSpeed}`);
            const data = await resp.json();
            if (data.success) { this.beatBPM = data.bpm; this.beatInterval = data.beatInterval; return data; }
        } catch (e) { /* 本地计算 */ }
        const bpm = 40 + (rotationSpeed / 100) * 160;
        this.beatBPM = Math.round(bpm);
        this.beatInterval = Math.round(60000 / bpm);
        return { bpm: this.beatBPM, beatInterval: this.beatInterval };
    },

    startBeatSync(callback) { this.beatCallback = callback; this._beatLoop(); },

    _beatLoop() {
        if (!this.beatCallback) return;
        const now = Date.now();
        if (now - this.lastBeatTime >= this.beatInterval) {
            this.lastBeatTime = now;
            this.beatCallback({ bpm: this.beatBPM, interval: this.beatInterval, timestamp: now });
        }
        requestAnimationFrame(() => this._beatLoop());
    },

    stopBeatSync() { this.beatCallback = null; },

    // ==================== 原有功能 ====================

    ensureInit() {
        try {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 1;
                this.masterGain.connect(this.ctx.destination);
                this.tickGain = this.ctx.createGain();
                this.tickGain.gain.value = StateManager.state.tickVolume || 0.3;
                this.tickGain.connect(this.masterGain);
                this.musicGain = this.ctx.createGain();
                this.musicGain.gain.value = StateManager.state.musicVolume || 0.5;
                this.musicGain.connect(this.masterGain);
            }
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return true;
        } catch (e) { console.error('[AudioEngine] 初始化失败:', e); return false; }
    },

    init() { return this.ensureInit(); },

    playTick() {
        try {
            const { tickEnabled, rotationSpeed } = StateManager.state;
            const tickVolume = StateManager.state.tickVolume || 0.3;
            if (!tickEnabled) return;
            if (!this.ensureInit()) return;
            if (rotationSpeed > 60) this._playNoiseClick(0.04, tickVolume * 0.5);
            else if (rotationSpeed > 30) this._playTickWood(tickVolume);
            else this._playTickBell(tickVolume);
        } catch (e) { console.error('[AudioEngine] playTick 错误:', e); }
    },

    _playTickWood(vol) {
        const sf = StateManager.state.rotationSpeed / 100;
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.frequency.value = 800 + sf * 400; o.type = 'triangle';
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(vol * 0.8, this.ctx.currentTime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        o.connect(g); g.connect(this.tickGain); o.start(); o.stop(this.ctx.currentTime + 0.1);
        this._trackNode(o, g, null);
    },

    _playTickBell(vol) {
        const sf = StateManager.state.rotationSpeed / 100;
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.frequency.value = (800 + sf * 600) * 1.5; o.type = 'sine';
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(vol * 0.6, this.ctx.currentTime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        o.connect(g); g.connect(this.tickGain); o.start(); o.stop(this.ctx.currentTime + 0.2);
        this._trackNode(o, g, null);
    },

    _playNoiseClick(duration, vol) {
        const sr = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, sr * duration, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < sr * duration; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * duration * 0.1));
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const g = this.ctx.createGain(); g.gain.value = vol;
        src.connect(g); g.connect(this.tickGain); src.start();
        this._trackNode(null, g, null);
    },

    // 内置背景音乐 Audio 元素
    _builtinMusicAudio: null,
    _builtinMusicIndex: 0,

    /**
     * 获取内置音乐播放列表（本地文件优先）
     */
    _getBuiltinMusicList() {
        const titles = [
            '舒缓旋律 - 轻钢琴', '海洋冥想 - 浪涛声', '创意灵感 - 律动',
            '日出 - 温暖氛围', '月夜 - 静谧旋律', '森林漫步 - 自然',
            '星空 - 梦幻电子', '花舞 - 轻快活泼', '山巅 - 空灵悠远',
            '潮汐 - 循环波纹', '微风 - 清新怡人', '庆典 - 欢乐氛围'
        ];
        return titles.map((title, i) => ({
            title,
            artist: 'SoundHelix',
            localUrl: `/public/music/song-${i + 1}.mp3`,
            onlineUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`,
            index: i
        }));
    },

    toggleMusic(enabled) {
        try {
            if (!this.ensureInit()) return;
            if (enabled === StateManager.state.musicEnabled) return;
            if (enabled) {
                // 播放内置 mp3 音乐
                this._playBuiltinMusic();
            } else {
                // 停止内置音乐
                this._stopBuiltinMusic();
                // 同时停止旧的合成音符（兼容）
                if (this.musicInterval) { clearTimeout(this.musicInterval); this.musicInterval = null; }
            }
            StateManager.setState({ musicEnabled: enabled });
        } catch (e) { console.error('[AudioEngine] toggleMusic 错误:', e); }
    },

    async _playBuiltinMusic() {
        try {
            // 停止旧的
            this._stopBuiltinMusic();

            const list = this._getBuiltinMusicList();
            const track = list[this._builtinMusicIndex % list.length];

            const audio = new Audio();
            // 尝试本地文件
            audio.src = track.localUrl;
            audio.loop = true; // 内置音乐默认循环
            audio.volume = StateManager.state.musicVolume || 0.5;
            audio.preload = 'auto';

            try {
                await audio.play();
                this._builtinMusicAudio = audio;
                console.log(`[AudioEngine] 内置音乐播放: ${track.title} [本地]`);
            } catch (playErr) {
                // 本地文件播放失败，回退到在线 URL
                console.warn(`[AudioEngine] 本地音乐播放失败，回退在线: ${track.title}`);
                this._cleanupAudioElement(audio);

                try {
                    const fallbackAudio = new Audio();
                    fallbackAudio.src = `${window.location.origin}/api/online-music/stream?url=${encodeURIComponent(track.onlineUrl)}`;
                    fallbackAudio.loop = true;
                    fallbackAudio.volume = StateManager.state.musicVolume || 0.5;
                    await fallbackAudio.play();
                    this._builtinMusicAudio = fallbackAudio;
                    console.log(`[AudioEngine] 内置音乐播放: ${track.title} [在线]`);
                } catch (onlineErr) {
                    console.warn('[AudioEngine] 在线也失败，回退合成音符:', onlineErr.message);
                    // 回退到合成音符
                    this.musicNoteIndex = 0;
                    this._scheduleNextNote();
                }
            }
        } catch (e) {
            console.warn('[AudioEngine] 内置音乐异常，回退合成音符:', e.message);
            this.musicNoteIndex = 0;
            this._scheduleNextNote();
        }
    },

    _stopBuiltinMusic() {
        if (this._builtinMusicAudio) {
            this._cleanupAudioElement(this._builtinMusicAudio);
            this._builtinMusicAudio = null;
        }
    },

    _scheduleNextNote() {
        try {
            if (!StateManager.state.musicEnabled || !this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const theme = this.themes[StateManager.state.musicTheme] || this.themes.aurora;
            this._playThemeNote(theme);
            this.musicInterval = setTimeout(() => this._scheduleNextNote(), theme.noteInterval);
        } catch (e) { console.error('[AudioEngine] _scheduleNextNote 错误:', e); }
    },

    _playThemeNote(theme) {
        try {
            if (!this.ctx) return;
            const filter = this.ctx.createBiquadFilter();
            filter.type = theme.filterType || 'lowpass';
            filter.frequency.value = theme.filterFreq || 1000;
            filter.Q.value = 2;
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
            const octave = theme.octave || 1;
            osc.frequency.value = theme.notes[this.musicNoteIndex] * octave;
            osc.type = theme.waveform || 'sine';
            const noteGain = theme.gain * StateManager.state.musicVolume;
            const noteDuration = theme.noteInterval / 1000 * 0.8;
            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(noteGain * 0.7, now + 0.05);
            gain.gain.linearRampToValueAtTime(noteGain * 0.5, now + noteDuration * 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration);
            osc.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
            osc.start(); osc.stop(now + noteDuration + 0.1);
            this._playThemeHarmonics(theme, now, noteDuration, noteGain);
            this.musicNoteIndex = (this.musicNoteIndex + 1) % theme.notes.length;
            this._trackNode(osc, gain, filter);
        } catch (e) { console.error('[AudioEngine] _playThemeNote 错误:', e); }
    },

    _playThemeHarmonics(theme, now, duration, noteGain) {
        try {
            const currentFreq = theme.notes[this.musicNoteIndex];
            const tn = StateManager.state.musicTheme;
            switch (tn) {
                case 'aurora': case 'dream':
                    this._playHarmonic(currentFreq / 2, noteGain * 0.3, 'sine', duration);
                    this._playHarmonic(currentFreq * 1.5, noteGain * 0.15, 'sine', duration * 0.7); break;
                case 'forest': this._playHarmonic(currentFreq * 2.5, noteGain * 0.15, 'sine', duration * 0.4); break;
                case 'temple': this._playHarmonic(currentFreq * 1.5, noteGain * 0.2, 'sine', duration * 1.2); break;
                case 'space': this._playHarmonic(currentFreq / 4, noteGain * 0.2, 'sawtooth', duration * 2); break;
                case 'jazz':
                    this._playHarmonic(currentFreq * 1.75, noteGain * 0.12, 'sine', duration * 0.5);
                    if (this.musicNoteIndex % 2 === 0) this._playHarmonic(currentFreq * 1.25, noteGain * 0.08, 'triangle', duration * 0.3); break;
                case 'ocean':
                    this._playHarmonic(currentFreq / 3, noteGain * 0.15, 'sine', duration * 1.5);
                    this._playHarmonic(currentFreq * 1.01, noteGain * 0.1, 'sine', duration * 1.2); break;
            }
        } catch (e) { /* 忽略 */ }
    },

    _playHarmonic(freq, gainVal, type, duration) {
        if (!this.ctx || isNaN(freq) || freq <= 0) return;
        try {
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
            osc.frequency.value = freq; osc.type = type;
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(gainVal, this.ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain); gain.connect(this.musicGain);
            osc.start(); osc.stop(this.ctx.currentTime + duration + 0.1);
            this._trackNode(osc, gain, null);
        } catch (e) { /* 忽略 */ }
    },

    setMusicTheme(theme) {
        if (this.themes[theme]) {
            StateManager.setState({ musicTheme: theme });
            this.musicNoteIndex = 0;
            if (StateManager.state.musicEnabled) {
                // 如果正在播放内置 mp3，切换到对应主题的曲目
                if (this._builtinMusicAudio) {
                    const themeNames = ['aurora', 'cyber', 'forest', 'dream', 'temple', 'space', 'jazz', 'ocean'];
                    const idx = themeNames.indexOf(theme);
                    if (idx >= 0) {
                        this._builtinMusicIndex = idx % this._getBuiltinMusicList().length;
                        this._playBuiltinMusic();
                        return;
                    }
                }
                // 否则重新调度合成音符
                if (this.musicInterval) clearTimeout(this.musicInterval);
                this._scheduleNextNote();
            }
        }
    },

    getMusicVolume() { return StateManager.state.musicVolume; },

    playDrawNote(symmetryCount, rawAngle, pressure, dist) {
        try {
            if (!this.ensureInit()) return;
            const now = Date.now();
            if (now - this.lastDrawNoteTime < 5) return;
            this.lastDrawNoteTime = now;
            const { drawMusicEnabled, musicVolume: mv } = StateManager.state;
            if (!drawMusicEnabled) return;
            const theme = this.themes[StateManager.state.musicTheme] || this.themes.aurora;
            const scaleName = this.drawNoteScales[StateManager.state.musicTheme] || 'major';
            const scale = this.scales[scaleName] || this.scales.major;
            const noteIndex = Math.floor(Math.abs(rawAngle) / (Math.PI * 2) * scale.length) % scale.length;
            const freq = scale[noteIndex] * (theme.octave || 1);
            const maxDist = Math.max(window.innerWidth, window.innerHeight) / 2;
            const distFactor = 0.3 + 0.7 * (1 - dist / maxDist);
            const musicGenVolume = mv * 0.4;
            const chordLayers = Math.min(Math.floor(symmetryCount / 4) + 1, 4);
            const waveforms = [theme.waveform || 'sine', 'triangle', 'sine', 'sawtooth'];
            for (let layer = 0; layer < chordLayers; layer++) {
                const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
                osc.type = waveforms[layer % waveforms.length];
                const intervals = [1, 1.5, 2, 1.25];
                osc.frequency.value = freq * intervals[layer % intervals.length];
                const layerVol = musicGenVolume * distFactor * (1 - layer * 0.2);
                const nowTime = this.ctx.currentTime;
                gain.gain.setValueAtTime(0, nowTime);
                gain.gain.linearRampToValueAtTime(layerVol * 0.8, nowTime + 0.01);
                const decayTime = ['古风', '太空', '海洋'].includes(theme.name) ? 0.5 : 0.3;
                gain.gain.exponentialRampToValueAtTime(0.001, nowTime + decayTime + layer * 0.1);
                osc.connect(gain); gain.connect(this.musicGain);
                osc.start(); osc.stop(nowTime + 0.5);
                this._trackNode(osc, gain, null);
            }
            if (['古风', '太空'].includes(theme.name)) {
                const bassOsc = this.ctx.createOscillator(); const bassGain = this.ctx.createGain();
                bassOsc.frequency.value = freq / 2; bassOsc.type = 'sine';
                bassGain.gain.setValueAtTime(0, this.ctx.currentTime);
                bassGain.gain.linearRampToValueAtTime(musicGenVolume * distFactor * 0.3, this.ctx.currentTime + 0.02);
                bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
                bassOsc.connect(bassGain); bassGain.connect(this.musicGain);
                bassOsc.start(); bassOsc.stop(this.ctx.currentTime + 0.6);
                this._trackNode(bassOsc, bassGain, null);
            }
        } catch (e) { console.error('[AudioEngine] playDrawNote 错误:', e); }
    },

    setTickVolume(vol) {
        StateManager.setState({ tickVolume: vol });
        if (this.tickGain) this.tickGain.gain.value = vol;
    },

    setMusicVolume(vol) {
        StateManager.setState({ musicVolume: vol });
        if (this.musicGain) this.musicGain.gain.value = vol;
        if (this._builtinMusicAudio) this._builtinMusicAudio.volume = vol;
    }
};