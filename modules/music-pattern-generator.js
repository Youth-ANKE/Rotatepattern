/**
 * 音乐图案生成器 - Music Pattern Generator
 * 将音乐实时转换为视觉图案
 */

class MusicPatternGenerator {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isEnabled = false;

        // 频段
        this.bassRange = { start: 0, end: 10 };      // 低音
        this.midRange = { start: 10, end: 50 };     // 中音
        this.highRange = { start: 50, end: 100 };   // 高音

        // 节拍检测
        this.beatThreshold = 0.7;
        this.lastBeatTime = 0;
        this.beatCooldown = 150; // ms
        this.history = [];
        this.historyLength = 43;

        // 模式
        this.mode = 'radial'; // radial, waveform, spectrum, spiral
    }

    /**
     * 初始化音频分析
     */
    initialize(audioElement) {
        if (!audioElement) return false;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            const source = this.audioContext.createMediaElementSource(audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            console.log('[MusicPattern] Audio analyzer initialized');
            return true;
        } catch (e) {
            console.error('[MusicPattern] Failed to initialize:', e);
            return false;
        }
    }

    /**
     * 获取音频数据
     */
    getAudioData() {
        if (!this.analyser || !this.dataArray) return null;

        this.analyser.getByteFrequencyData(this.dataArray);

        // 计算各频段能量
        const bass = this.getRangeEnergy(this.bassRange.start, this.bassRange.end);
        const mid = this.getRangeEnergy(this.midRange.start, this.midRange.end);
        const high = this.getRangeEnergy(this.highRange.start, this.highRange.end);
        const overall = this.getOverallEnergy();

        // 检测节拍
        const isBeat = this.detectBeat(overall);

        return {
            bass,
            mid,
            high,
            overall,
            isBeat,
            raw: this.dataArray,
            timestamp: Date.now()
        };
    }

    /**
     * 获取频段能量
     */
    getRangeEnergy(start, end) {
        if (!this.dataArray) return 0;

        let sum = 0;
        for (let i = start; i < end && i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / ((end - start) * 255);
    }

    /**
     * 获取整体能量
     */
    getOverallEnergy() {
        if (!this.dataArray) return 0;

        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / (this.dataArray.length * 255);
    }

    /**
     * 节拍检测
     */
    detectBeat(energy) {
        const now = Date.now();

        // 添加到历史
        this.history.push(energy);
        if (this.history.length > this.historyLength) {
            this.history.shift();
        }

        // 需要足够的历史数据
        if (this.history.length < this.historyLength) return false;

        // 计算历史平均值和标准差
        const avg = this.history.reduce((a, b) => a + b, 0) / this.history.length;
        const variance = this.history.reduce((a, b) => a + (b - avg) ** 2, 0) / this.history.length;
        const std = Math.sqrt(variance);

        // 检测峰值
        const threshold = avg + std * 1.5;
        const isPeak = energy > threshold && energy > this.beatThreshold;

        // 节拍冷却
        if (isPeak && now - this.lastBeatTime > this.beatCooldown) {
            this.lastBeatTime = now;
            return true;
        }

        return false;
    }

    /**
     * 生成音乐驱动的图案
     */
    generatePattern(ctx, width, height, audioData) {
        if (!audioData) return;

        const cx = width / 2;
        const cy = height / 2;

        ctx.save();

        switch (this.mode) {
            case 'radial':
                this.drawRadialPattern(ctx, cx, cy, width, height, audioData);
                break;
            case 'waveform':
                this.drawWaveformPattern(ctx, width, height, audioData);
                break;
            case 'spectrum':
                this.drawSpectrumPattern(ctx, width, height, audioData);
                break;
            case 'spiral':
                this.drawSpiralPattern(ctx, cx, cy, width, audioData);
                break;
        }

        ctx.restore();
    }

    /**
     * 径向音乐图案
     */
    drawRadialPattern(ctx, cx, cy, width, height, audio) {
        const maxRadius = Math.min(width, height) * 0.4;
        const bars = 64;

        for (let i = 0; i < bars; i++) {
            const angle = (i / bars) * Math.PI * 2;
            const freqIndex = Math.floor(i * this.dataArray.length / bars);
            const value = this.dataArray[freqIndex] / 255;

            const innerRadius = maxRadius * 0.3;
            const outerRadius = innerRadius + value * maxRadius * 0.7;

            const x1 = cx + Math.cos(angle) * innerRadius;
            const y1 = cy + Math.sin(angle) * innerRadius;
            const x2 = cx + Math.cos(angle) * outerRadius;
            const y2 = cy + Math.sin(angle) * outerRadius;

            // 颜色根据频率变化
            const hue = (i / bars) * 360 + audio.bass * 100;
            const saturation = 70 + audio.high * 30;
            const lightness = 40 + value * 40;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            ctx.lineWidth = 2 + value * 4;
            ctx.lineCap = 'round';
            ctx.stroke();

            // 节拍时添加圆环
            if (audio.isBeat && value > 0.5) {
                ctx.beginPath();
                ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${value * 0.5})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    /**
     * 波形图案
     */
    drawWaveformPattern(ctx, width, height, audio) {
        const samples = 128;
        const sliceWidth = width / samples;
        const centerY = height / 2;
        const amplitude = height * 0.3 * audio.overall;

        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i < samples; i++) {
            const freqIndex = Math.floor(i * this.dataArray.length / samples);
            const v = this.dataArray[freqIndex] / 255;
            const y = centerY + (v - 0.5) * amplitude * 2;

            ctx.lineTo(i * sliceWidth, y);
        }

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, `hsl(${180 + audio.bass * 60}, 90%, 60%)`);
        gradient.addColorStop(0.5, `hsl(${270 + audio.mid * 60}, 90%, 60%)`);
        gradient.addColorStop(1, `hsl(${360 + audio.high * 60}, 90%, 60%)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + audio.overall * 3;
        ctx.stroke();

        // 镜像波形
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let i = 0; i < samples; i++) {
            const freqIndex = Math.floor(i * this.dataArray.length / samples);
            const v = this.dataArray[freqIndex] / 255;
            const y = centerY - (v - 0.5) * amplitude * 2;

            ctx.lineTo(i * sliceWidth, y);
        }
        ctx.stroke();
    }

    /**
     * 频谱图案
     */
    drawSpectrumPattern(ctx, width, height, audio) {
        const barCount = 64;
        const barWidth = width / barCount;
        const maxHeight = height * 0.8;

        for (let i = 0; i < barCount; i++) {
            const freqIndex = Math.floor(i * this.dataArray.length / barCount);
            const value = this.dataArray[freqIndex] / 255;
            const barHeight = value * maxHeight;

            const x = i * barWidth;
            const y = height - barHeight;

            // 渐变颜色
            const hue = (i / barCount) * 240; // 蓝到红
            const gradient = ctx.createLinearGradient(x, y, x, height);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.9)`);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 40%, 0.3)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
    }

    /**
     * 螺旋图案
     */
    drawSpiralPattern(ctx, cx, cy, size, audio) {
        const maxRadius = size * 0.4;
        const turns = 4;
        const points = 200;

        ctx.beginPath();

        for (let i = 0; i < points; i++) {
            const t = i / points;
            const angle = t * Math.PI * 2 * turns;
            const freqIndex = Math.floor(t * this.dataArray.length);
            const value = this.dataArray[freqIndex] / 255;

            const radius = t * maxRadius * (0.5 + value + audio.overall * 0.5);
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        const hue = (Date.now() / 50) % 360;
        ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.lineWidth = 1 + audio.overall * 3;
        ctx.stroke();

        // 节拍时添加同心圆
        if (audio.isBeat) {
            const pulseRadius = maxRadius * audio.overall;

            ctx.beginPath();
            ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${hue + 60}, 100%, 70%, 0.5)`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    /**
     * 启用/禁用
     */
    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }

    /**
     * 设置模式
     */
    setMode(mode) {
        this.mode = mode;
    }

    /**
     * 获取可用模式
     */
    getModes() {
        return ['radial', 'waveform', 'spectrum', 'spiral'];
    }

    /**
     * 清理
     */
    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
    }
}

// 导出
window.MusicPatternGenerator = MusicPatternGenerator;
