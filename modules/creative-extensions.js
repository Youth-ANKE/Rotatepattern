/**
 * 创意扩展模块 V1.0
 * 
 * 功能：
 * 1. 交互式随机进化 - E键增量变异，H键图案杂交
 * 2. 音频可视化联动 - 图案随音乐律动
 * 3. 主题故事模式 - 沉浸式主题体验
 */
const CreativeExtensions = {
    // ============ 1. 交互式随机进化 ============
    
    // 当前进化种群（用于杂交）
    _evolutionPopulation: [],
    _lastEvolutionTime: 0,
    _evolutionCooldown: 300,
    
    /**
     * E键：增量变异
     * 在当前配置基础上做小幅随机调整，保留核心风格
     */
    evolve() {
        const now = Date.now();
        if (now - this._lastEvolutionTime < this._evolutionCooldown) {
            console.log('[CreativeExtensions] 进化冷却中...');
            return;
        }
        this._lastEvolutionTime = now;
        
        const state = StateManager.state;
        console.log('[CreativeExtensions] 启动进化变异！');
        
        // 保存当前配置到种群
        this._saveToPopulation();
        
        // 随机选择变异类型
        const mutationTypes = [
            '_mutateColors',      // 颜色变异
            '_mutateStructure',   // 结构变异
            '_mutateEffects',     // 特效变异
            '_mutateMotion'       // 动态变异
        ];
        
        const mutation = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
        console.log(`[CreativeExtensions] 变异类型: ${mutation}`);
        
        // 执行变异
        this[mutation]();
        
        // 应用变异后的配置
        this._applyMutatedConfig();
        
        if (KeyboardHandler?._showToast) KeyboardHandler._showToast('🧬 进化变异！');
    },
    
    /**
     * 保存当前配置到进化种群
     */
    _saveToPopulation() {
        const state = StateManager.state;
        const config = {
            timestamp: Date.now(),
            symmetryCount: state.symmetryCount,
            symmetryMode: state.symmetryMode,
            strokeWidth: state.strokeWidth,
            brushType: state.brushType,
            glowEnabled: state.glowEnabled,
            glowBlur: state.glowBlur,
            gradientEnabled: state.gradientEnabled,
            rainbowMode: state.rainbowMode,
            trailMode: state.trailMode,
            particleType: state.particleType,
            animationMode: state.animationMode,
            animationSpeed: state.animationSpeed,
            strokeColor: state.strokeColor,
            glowColor: state.glowColor,
            gradientFrom: state.gradientFrom,
            gradientTo: state.gradientTo,
            activeGeneratorName: state.activeGeneratorName || 'unknown'
        };
        
        this._evolutionPopulation.push(config);
        
        // 保持种群数量限制
        if (this._evolutionPopulation.length > 10) {
            this._evolutionPopulation.shift();
        }
    },
    
    /**
     * 颜色变异
     */
    _mutateColors() {
        const state = StateManager.state;
        
        // HSV色彩空间变异
        const mutateColor = (hex, hueRange, satRange, valRange) => {
            if (!hex || hex === 'transparent') return hex;
            try {
                // 简单RGB偏移
                let r = parseInt(hex.slice(1, 3), 16);
                let g = parseInt(hex.slice(3, 5), 16);
                let b = parseInt(hex.slice(5, 7), 16);
                
                r = Math.max(0, Math.min(255, r + Math.floor(Math.random() * hueRange * 2 - hueRange)));
                g = Math.max(0, Math.min(255, g + Math.floor(Math.random() * satRange * 2 - satRange)));
                b = Math.max(0, Math.min(255, b + Math.floor(Math.random() * valRange * 2 - valRange)));
                
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            } catch (e) {
                return hex;
            }
        };
        
        // 更新颜色配置
        state.strokeColor = mutateColor(state.strokeColor, 40, 30, 20);
        state.glowColor = mutateColor(state.glowColor, 60, 40, 30);
        state.gradientFrom = mutateColor(state.gradientFrom, 50, 35, 25);
        state.gradientTo = mutateColor(state.gradientTo, 50, 35, 25);
        
        // 30%概率切换彩虹模式
        if (Math.random() > 0.7) {
            state.rainbowMode = !state.rainbowMode;
        }
    },
    
    /**
     * 结构变异
     */
    _mutateStructure() {
        const state = StateManager.state;
        
        // 对称数量微调
        const symOptions = [3, 4, 5, 6, 8, 10, 12, 16];
        const currentIdx = symOptions.indexOf(state.symmetryCount);
        if (currentIdx >= 0) {
            const offset = Math.random() > 0.5 ? 1 : -1;
            const newIdx = Math.max(0, Math.min(symOptions.length - 1, currentIdx + offset));
            state.symmetryCount = symOptions[newIdx];
        }
        
        // 对称模式切换
        const modes = ['rotational', 'mirror', 'spiral', 'interlockMirror', 'spiralMirror'];
        const currentMode = modes.indexOf(state.symmetryMode);
        if (currentMode >= 0 && Math.random() > 0.6) {
            const newModeIdx = (currentMode + (Math.random() > 0.5 ? 1 : -1) + modes.length) % modes.length;
            state.symmetryMode = modes[newModeIdx];
        }
        
        // 画笔宽度调整
        state.strokeWidth = Math.max(1, Math.min(20, state.strokeWidth + Math.floor(Math.random() * 4 - 2)));
        
        // 画笔类型切换
        const brushes = ['solid', 'dashed', 'dotted', 'spray', 'ribbon'];
        if (Math.random() > 0.7) {
            state.brushType = brushes[Math.floor(Math.random() * brushes.length)];
        }
    },
    
    /**
     * 特效变异
     */
    _mutateEffects() {
        const state = StateManager.state;
        
        // 发光效果
        state.glowEnabled = Math.random() > 0.3;
        if (state.glowEnabled) {
            state.glowBlur = Math.max(2, Math.min(30, state.glowBlur + Math.floor(Math.random() * 10 - 5)));
        }
        
        // 渐变效果
        state.gradientEnabled = Math.random() > 0.4;
        
        // 拖尾效果
        state.trailMode = Math.random() > 0.5;
        
        // 粒子类型
        const particles = ['spark', 'star', 'rainbow', 'butterfly', 'bubble', 'snow', 'firefly'];
        state.particleType = particles[Math.floor(Math.random() * particles.length)];
    },
    
    /**
     * 动态变异
     */
    _mutateMotion() {
        const state = StateManager.state;
        
        // 动画模式
        const animModes = ['none', 'breathing', 'colorShift', 'rotate', 'drift', 'pulse'];
        if (Math.random() > 0.4) {
            state.animationMode = animModes[Math.floor(Math.random() * animModes.length)];
            state.animationSpeed = 0.5 + Math.random() * 2;
        }
        
        // 旋转速度
        state.rotationSpeed = Math.max(0, Math.min(100, state.rotationSpeed + Math.floor(Math.random() * 30 - 15)));
    },
    
    /**
     * 应用变异后的配置到UI和状态
     */
    _applyMutatedConfig() {
        const state = StateManager.state;
        
        // 更新UI控件
        this._updateUIControl('stroke-color', state.strokeColor);
        this._updateUIControl('glow-color', state.glowColor);
        this._updateUIControl('gradient-from', state.gradientFrom);
        this._updateUIControl('gradient-to', state.gradientTo);
        this._updateUIControl('stroke-width', state.strokeWidth);
        this._updateUIControl('symmetry-count', state.symmetryCount);
        this._updateUIControl('symmetry-mode', state.symmetryMode);
        this._updateUIControl('brush-type', state.brushType);
        this._updateUIControl('particle-type', state.particleType);
        this._updateUIControl('animation-mode', state.animationMode);
        
        // 更新标签
        this._updateLabel('symmetry-count-label', state.symmetryCount);
        this._updateLabel('rotation-speed-label', state.rotationSpeed);
        
        // 更新按钮状态
        this._toggleButton('glow-toggle', state.glowEnabled);
        this._toggleButton('trail-toggle', state.trailMode);
        this._toggleButton('animation-toggle', state.animationMode !== 'none');
    },
    
    _updateUIControl(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    },
    
    _updateLabel(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },
    
    _toggleButton(id, active) {
        const btn = document.getElementById(id);
        if (btn) {
            if (active) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    },
    
    /**
     * H键：图案杂交
     * 从种群中选择两个不同配置进行混合
     */
    hybridize() {
        if (this._evolutionPopulation.length < 1) {
            console.log('[CreativeExtensions] 种群不足，先进行几次变异后再尝试杂交');
            if (KeyboardHandler?._showToast) KeyboardHandler._showToast('📈 变异几次后再杂交！');
            return;
        }
        
        console.log('[CreativeExtensions] 启动图案杂交！');
        
        // 选择父代
        const pop = this._evolutionPopulation;
        const parentA = pop[Math.floor(Math.random() * pop.length)];
        let parentB = pop[Math.floor(Math.random() * pop.length)];
        while (parentB === parentA && pop.length > 1) {
            parentB = pop[Math.floor(Math.random() * pop.length)];
        }
        
        console.log('[CreativeExtensions] 父代A:', parentA.activeGeneratorName);
        console.log('[CreativeExtensions] 父代B:', parentB.activeGeneratorName);
        
        // 基因重组
        const state = StateManager.state;
        
        // 结构基因来自父代A
        state.symmetryCount = parentA.symmetryCount;
        state.symmetryMode = parentA.symmetryMode;
        state.strokeWidth = parentA.strokeWidth;
        state.brushType = parentA.brushType;
        
        // 颜色基因来自父代B
        state.strokeColor = parentB.strokeColor;
        state.glowColor = parentB.glowColor;
        state.gradientFrom = parentB.gradientFrom;
        state.gradientTo = parentB.gradientTo;
        
        // 特效基因随机选择
        state.glowEnabled = Math.random() > 0.5 ? parentA.glowEnabled : parentB.glowEnabled;
        state.glowBlur = Math.random() > 0.5 ? parentA.glowBlur : parentB.glowBlur;
        state.gradientEnabled = Math.random() > 0.5 ? parentA.gradientEnabled : parentB.gradientEnabled;
        state.rainbowMode = Math.random() > 0.5 ? parentA.rainbowMode : parentB.rainbowMode;
        state.trailMode = Math.random() > 0.5 ? parentA.trailMode : parentB.trailMode;
        
        // 动态基因来自父代A
        state.animationMode = parentA.animationMode;
        state.animationSpeed = parentA.animationSpeed;
        
        // 粒子基因来自父代B
        state.particleType = parentB.particleType;
        
        // 应用杂交结果
        this._applyMutatedConfig();
        
        // 生成新的图案层
        this._generateHybridLayers(parentA, parentB);
        
        if (KeyboardHandler?._showToast) KeyboardHandler._showToast('🧬 杂交完成！新图案诞生');
    },
    
    /**
     * 生成杂交图案层
     */
    _generateHybridLayers(parentA, parentB) {
        const state = StateManager.state;
        const cx = state.canvasWidth / 2;
        const cy = state.canvasHeight / 2;
        const maxR = Math.min(cx, cy) * 0.7;
        
        // 清空现有笔画
        StateManager.setState({ strokes: [] });
        
        // 生成父代A的基础图案
        const genA = parentA.activeGeneratorName || 'mandala';
        const genB = parentB.activeGeneratorName || 'radialBurst';
        
        // 生成两层叠加
        const colorsA = this._generateColorsFromHex(parentA.strokeColor, 4);
        const colorsB = this._generateColorsFromHex(parentB.strokeColor, 4);
        
        // 父代A的图案
        const strokesA = RandomGenerator._invokeGenerator(
            genA, cx, cy, maxR * 0.8, 2, colorsA, 
            { ...parentA, symmetryCount: state.symmetryCount }, 
            { stroke: parentA.strokeColor, glow: parentA.glowColor, bg: state.bgColor }
        );
        
        // 父代B的图案（缩小叠加）
        const strokesB = RandomGenerator._invokeGenerator(
            genB, cx, cy, maxR * 0.5, 2, colorsB,
            { ...parentB, symmetryCount: state.symmetryCount },
            { stroke: parentB.strokeColor, glow: parentB.glowColor, bg: state.bgColor }
        );
        
        // 添加笔画
        strokesA.forEach(s => { s._layer = 0; s._opacity = 0.7; StateManager.addStroke(s); });
        strokesB.forEach(s => { s._layer = 1; s._opacity = 0.5; StateManager.addStroke(s); });
        
        console.log('[CreativeExtensions] 杂交图案生成完成');
    },
    
    /**
     * 从单个颜色生成调色板
     */
    _generateColorsFromHex(hex, count) {
        const colors = [];
        if (!hex || hex === 'transparent') {
            return ['#ffffff', '#ff6666', '#66ff66', '#6666ff'];
        }
        
        try {
            let r = parseInt(hex.slice(1, 3), 16);
            let g = parseInt(hex.slice(3, 5), 16);
            let b = parseInt(hex.slice(5, 7), 16);
            
            for (let i = 0; i < count; i++) {
                const offset = (i - count / 2) * 30;
                colors.push(`#${Math.max(0, Math.min(255, r + offset)).toString(16).padStart(2, '0')}${
                    Math.max(0, Math.min(255, g + offset)).toString(16).padStart(2, '0')}${
                    Math.max(0, Math.min(255, b + offset)).toString(16).padStart(2, '0')}`);
            }
        } catch (e) {
            colors.push('#ffffff', '#ff6666', '#66ff66', '#6666ff');
        }
        
        return colors;
    },
    
    // ============ 2. 音频可视化联动 ============
    
    // 音频分析器
    _analyser: null,
    _audioContext: null,
    _dataArray: null,
    _frequencyData: null,
    _visualizerEnabled: false,
    _lastVisualizerUpdate: 0,
    _visualizerInterval: 50, // ms
    
    // 可视化参数
    _visualParams: {
        bassLevel: 0,      // 低频 (0-1)
        midLevel: 0,       // 中频 (0-1)
        trebleLevel: 0,    // 高频 (0-1)
        overallLevel: 0,   // 整体电平 (0-1)
        beatDetected: false, // 节拍检测
        beatIntensity: 0   // 节拍强度 (0-1)
    },
    
    // 节拍检测参数
    _beatThreshold: 0.7,
    _beatMinInterval: 200,
    _lastBeatTime: 0,
    _energyHistory: [],
    _energyHistorySize: 43,
    
    /**
     * 初始化音频分析器
     */
    initAudioVisualizer() {
        if (this._analyser) return;
        
        try {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this._analyser = this._audioContext.createAnalyser();
            this._analyser.fftSize = 256;
            
            const bufferLength = this._analyser.frequencyBinCount;
            this._dataArray = new Uint8Array(bufferLength);
            this._frequencyData = new Uint8Array(bufferLength);
            
            console.log('[CreativeExtensions] 音频分析器初始化完成');
        } catch (e) {
            console.error('[CreativeExtensions] 音频分析器初始化失败:', e);
        }
    },
    
    /**
     * 连接音频源到分析器
     */
    connectAudioSource(audioElement) {
        if (!this._analyser || !audioElement) return;
        
        try {
            // 如果已有连接，先断开
            if (this._sourceNode) {
                this._sourceNode.disconnect();
            }
            
            this._sourceNode = this._audioContext.createMediaElementSource(audioElement);
            this._sourceNode.connect(this._analyser);
            this._analyser.connect(this._audioContext.destination);
            
            console.log('[CreativeExtensions] 音频源已连接到分析器');
        } catch (e) {
            console.error('[CreativeExtensions] 音频源连接失败:', e);
        }
    },
    
    /**
     * 启用/禁用音频可视化
     */
    toggleAudioVisualizer(enabled) {
        this._visualizerEnabled = enabled;
        
        if (enabled) {
            this.initAudioVisualizer();
            console.log('[CreativeExtensions] 音频可视化已启用');
            if (KeyboardHandler?._showToast) KeyboardHandler._showToast('🎵 音频可视化：开');
        } else {
            console.log('[CreativeExtensions] 音频可视化已禁用');
            if (KeyboardHandler?._showToast) KeyboardHandler._showToast('🎵 音频可视化：关');
        }
    },
    
    /**
     * 更新音频可视化参数
     * 应在动画循环中调用
     */
    updateAudioVisualization() {
        if (!this._visualizerEnabled || !this._analyser) return;
        
        const now = Date.now();
        if (now - this._lastVisualizerUpdate < this._visualizerInterval) return;
        this._lastVisualizerUpdate = now;
        
        try {
            // 获取频率数据
            this._analyser.getByteFrequencyData(this._dataArray);
            
            const bufferLength = this._dataArray.length;
            
            // 分离频段
            const bassEnd = Math.floor(bufferLength * 0.1);      // 0-10% 低频
            const midEnd = Math.floor(bufferLength * 0.5);       // 10-50% 中频
            
            let bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const value = this._dataArray[i] / 255;
                totalSum += value;
                
                if (i < bassEnd) {
                    bassSum += value;
                } else if (i < midEnd) {
                    midSum += value;
                } else {
                    trebleSum += value;
                }
            }
            
            // 计算各频段电平（归一化）
            this._visualParams.bassLevel = bassSum / bassEnd;
            this._visualParams.midLevel = midSum / (midEnd - bassEnd);
            this._visualParams.trebleLevel = trebleSum / (bufferLength - midEnd);
            this._visualParams.overallLevel = totalSum / bufferLength;
            
            // 节拍检测
            this._detectBeat();
            
        } catch (e) {
            console.warn('[CreativeExtensions] 音频分析错误:', e);
        }
    },
    
    /**
     * 简单节拍检测
     */
    _detectBeat() {
        const bass = this._visualParams.bassLevel;
        const now = Date.now();
        
        // 记录能量历史
        this._energyHistory.push(bass);
        if (this._energyHistory.length > this._energyHistorySize) {
            this._energyHistory.shift();
        }
        
        // 计算平均能量
        const avgEnergy = this._energyHistory.reduce((a, b) => a + b, 0) / this._energyHistory.length;
        
        // 节拍检测：当前能量超过平均值 + 阈值，且距上次节拍足够时间
        const threshold = avgEnergy + (1 - avgEnergy) * this._beatThreshold;
        
        if (bass > threshold && now - this._lastBeatTime > this._beatMinInterval) {
            this._visualParams.beatDetected = true;
            this._visualParams.beatIntensity = Math.min(1, (bass - avgEnergy) / 0.3);
            this._lastBeatTime = now;
        } else {
            this._visualParams.beatDetected = false;
            this._visualParams.beatIntensity *= 0.9; // 衰减
        }
    },
    
    /**
     * 应用音频可视化效果到图案
     * 应在渲染循环中调用
     */
    applyAudioVisualization() {
        if (!this._visualizerEnabled) return;
        
        const v = this._visualParams;
        const state = StateManager.state;
        
        // 低频 → 画笔粗细脉动
        if (v.bassLevel > 0.3) {
            const widthBoost = 1 + v.bassLevel * 0.5;
            state._visualStrokeWidth = state.strokeWidth * widthBoost;
        } else {
            state._visualStrokeWidth = state.strokeWidth;
        }
        
        // 中频 → 发光强度
        if (v.midLevel > 0.2) {
            state._visualGlowBlur = state.glowBlur * (1 + v.midLevel * 0.5);
        } else {
            state._visualGlowBlur = state.glowBlur;
        }
        
        // 高频 → 色彩饱和度/亮度
        if (v.trebleLevel > 0.2) {
            state._visualColorBoost = 1 + v.trebleLevel * 0.3;
        } else {
            state._visualColorBoost = 1;
        }
        
        // 节拍 → 粒子爆发
        if (v.beatDetected && v.beatIntensity > 0.5) {
            this._emitBeatParticles(v.beatIntensity);
        }
        
        // 整体电平 → 图案整体缩放（微妙）
        state._visualScale = 1 + (v.overallLevel - 0.3) * 0.1;
    },
    
    /**
     * 节拍触发粒子爆发
     */
    _emitBeatParticles(intensity) {
        const state = StateManager.state;
        const cx = state.canvasWidth / 2;
        const cy = state.canvasHeight / 2;
        
        // 在随机位置发射粒子
        const count = Math.floor(intensity * 20);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * Math.min(cx, cy) * 0.3;
            ParticleSystem.emit(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 3);
        }
    },
    
    /**
     * 获取当前可视化参数（供外部使用）
     */
    getVisualParams() {
        return { ...this._visualParams };
    },
    
    // ============ 3. 主题故事模式 ============
    
    // 主题故事定义
    _storyThemes: {
        cyberpunkRuins: {
            name: '赛博废墟',
            description: '霓虹闪烁的废弃都市，数字幽灵游荡其中',
            palette: { bg: '#0a0010', bgGrad: '#1a0020', stroke: '#ff00ff', glow: '#ff66ff', accent: '#00ffff', mood: 'neon' },
            patterns: ['strangeAttractor', 'lissajous'],
            symmetry: 6,
            symmetryMode: 'spiral',
            particleType: 'spark',
            animation: 'psychedelic',
            bgAnimation: 'nebula',
            musicTheme: 'cyber',
            effects: { glowEnabled: true, rainbowMode: false, trailMode: true, gradientEnabled: true },
            extra: 'glitch' // 额外效果：故障艺术
        },
        ancientForest: {
            name: '古老森林',
            description: '神秘的生命之源，发光蘑菇照亮幽暗小径',
            palette: { bg: '#0a1a0a', bgGrad: '#0a2a0a', stroke: '#88ff44', glow: '#aaff66', accent: '#ffcc44', mood: 'nature' },
            patterns: ['fractalTree', 'zentangle'],
            symmetry: 5,
            symmetryMode: 'mirror',
            particleType: 'firefly',
            animation: 'breathing',
            bgAnimation: 'aurora',
            musicTheme: 'forest',
            effects: { glowEnabled: true, rainbowMode: false, trailMode: false, gradientEnabled: true }
        },
        deepSpace: {
            name: '深空探索',
            description: '穿越虫洞，探索未知星域',
            palette: { bg: '#000010', bgGrad: '#000020', stroke: '#4488ff', glow: '#66aaff', accent: '#ff8844', mood: 'cosmic' },
            patterns: ['celestialOrbits', 'moirePattern'],
            symmetry: 8,
            symmetryMode: 'rotational',
            particleType: 'star',
            animation: 'pulse',
            bgAnimation: 'starField',
            musicTheme: 'space',
            effects: { glowEnabled: true, rainbowMode: false, trailMode: true, gradientEnabled: false }
        },
        magicalGarden: {
            name: '魔法花园',
            description: '会跳舞的花朵，歌唱的喷泉，精灵在花瓣间嬉戏',
            palette: { bg: '#1a0a2a', bgGrad: '#2a1a3a', stroke: '#ff88cc', glow: '#ffaadd', accent: '#88ffaa', mood: 'dream' },
            patterns: ['flowerPetals', 'laceFiligree'],
            symmetry: 10,
            symmetryMode: 'rotational',
            particleType: 'butterfly',
            animation: 'floating',
            bgAnimation: 'aurora',
            musicTheme: 'dream',
            effects: { glowEnabled: true, rainbowMode: true, trailMode: false, gradientEnabled: true }
        },
        volcanicCore: {
            name: '火山之心',
            description: '地球的脉搏，岩浆与火焰的交响',
            palette: { bg: '#1a0500', bgGrad: '#2e0a00', stroke: '#ff4400', glow: '#ff6600', accent: '#ffdd00', mood: 'nature' },
            patterns: ['lavaLamp', 'fractalTree'],
            symmetry: 6,
            symmetryMode: 'spiralMirror',
            particleType: 'firefly',
            animation: 'drift',
            bgAnimation: 'gradientShift',
            musicTheme: 'temple',
            effects: { glowEnabled: true, rainbowMode: false, trailMode: true, gradientEnabled: true }
        },
        oceanDepths: {
            name: '深海幽境',
            description: '发光水母漂浮，神秘生物游弋',
            palette: { bg: '#000820', bgGrad: '#001040', stroke: '#44aaff', glow: '#66ccff', accent: '#ff66ff', mood: 'nature' },
            patterns: ['ripples', 'mandala'],
            symmetry: 8,
            symmetryMode: 'interlockMirror',
            particleType: 'bubble',
            animation: 'breathing',
            bgAnimation: 'nebula',
            musicTheme: 'ocean',
            effects: { glowEnabled: true, rainbowMode: false, trailMode: false, gradientEnabled: true }
        },
        etherealDreams: {
            name: '飘渺梦境',
            description: '云端之上，星光织成的枕边故事',
            palette: { bg: '#0a0a22', bgGrad: '#1a1a3e', stroke: '#c0c8ff', glow: '#d0d8ff', accent: '#ffcc88', mood: 'dream' },
            patterns: ['nebulaCloud', 'fluidFlow'],
            symmetry: 12,
            symmetryMode: 'spiral',
            particleType: 'star',
            animation: 'floating',
            bgAnimation: 'aurora',
            musicTheme: 'dream',
            effects: { glowEnabled: true, rainbowMode: true, trailMode: false, gradientEnabled: true }
        },
        geometricTemple: {
            name: '几何神庙',
            description: '古老文明的数学密码，永恒的几何之美',
            palette: { bg: '#1a1400', bgGrad: '#2e2800', stroke: '#ffd700', glow: '#ffed4a', accent: '#88aa44', mood: 'luxury' },
            patterns: ['islamicGeo', 'tessellation'],
            symmetry: 12,
            symmetryMode: 'rotational',
            particleType: 'spark',
            animation: 'rotate',
            bgAnimation: 'gradientShift',
            musicTheme: 'temple',
            effects: { glowEnabled: true, rainbowMode: false, trailMode: false, gradientEnabled: true }
        },
        neonCity: {
            name: '霓虹都市',
            description: '永不熄灭的霓虹招牌，人潮涌动的夜',
            palette: { bg: '#0a001a', bgGrad: '#1a0033', stroke: '#ff3366', glow: '#ff6699', accent: '#33ccff', mood: 'neon' },
            patterns: ['lissajous', 'waveInterference'],
            symmetry: 6,
            symmetryMode: 'mirror',
            particleType: 'spark',
            animation: 'psychedelic',
            bgAnimation: 'nebula',
            musicTheme: 'cyber',
            effects: { glowEnabled: true, rainbowMode: true, trailMode: true, gradientEnabled: true }
        },
        frozenWonderland: {
            name: '冰晶奇境',
            description: '极光映照下的冰晶宫殿，纯净而神秘',
            palette: { bg: '#0a1a2a', bgGrad: '#1a2a3a', stroke: '#88ddff', glow: '#aaeeff', accent: '#ff88aa', mood: 'season' },
            patterns: ['fractalSnowflake', 'laceFiligree'],
            symmetry: 6,
            symmetryMode: 'rotational',
            particleType: 'snow',
            animation: 'breathing',
            bgAnimation: 'aurora',
            musicTheme: 'ocean',
            effects: { glowEnabled: true, rainbowMode: false, trailMode: false, gradientEnabled: true }
        }
    },
    
    /**
     * 启动随机主题故事
     */
    startRandomStory() {
        const themes = Object.keys(this._storyThemes);
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        this.applyStoryTheme(randomTheme);
    },
    
    /**
     * 应用指定主题
     */
    applyStoryTheme(themeId) {
        const theme = this._storyThemes[themeId];
        if (!theme) {
            console.error('[CreativeExtensions] 未知主题:', themeId);
            return;
        }
        
        console.log('[CreativeExtensions] 应用主题:', theme.name);
        console.log('[CreativeExtensions] 描述:', theme.description);
        
        // 更新状态
        const state = StateManager.state;
        
        // 配色
        state.bgColor = theme.palette.bg;
        state.bgGrad = theme.palette.bgGrad;
        state.strokeColor = theme.palette.stroke;
        state.glowColor = theme.palette.glow;
        
        // 结构
        state.symmetryCount = theme.symmetry;
        state.symmetryMode = theme.symmetryMode;
        
        // 特效
        state.glowEnabled = theme.effects.glowEnabled;
        state.rainbowMode = theme.effects.rainbowMode;
        state.trailMode = theme.effects.trailMode;
        state.gradientEnabled = theme.effects.gradientEnabled;
        
        // 动画
        state.animationMode = theme.animation;
        state.animationSpeed = 1.0;
        
        // 粒子
        state.particleType = theme.particleType;
        
        // 背景动画
        BackgroundAnimation.setType(theme.bgAnimation);
        
        // 更新UI
        this._updateUIControl('bg-color', theme.palette.bg);
        this._updateUIControl('stroke-color', theme.palette.stroke);
        this._updateUIControl('glow-color', theme.palette.glow);
        this._updateUIControl('symmetry-count', theme.symmetry);
        this._updateUIControl('symmetry-mode', theme.symmetryMode);
        this._updateUIControl('animation-mode', theme.animation);
        this._updateUIControl('particle-type', theme.particleType);
        
        this._toggleButton('glow-toggle', theme.effects.glowEnabled);
        this._toggleButton('trail-toggle', theme.effects.trailMode);
        this._toggleButton('animation-toggle', theme.animation !== 'none');
        
        // 清空画布并生成主题图案
        StateManager.setState({ strokes: [] });
        setTimeout(() => {
            this._generateStoryPattern(theme);
        }, 100);
        
        // 显示主题介绍
        if (KeyboardHandler?._showToast) KeyboardHandler._showToast(`📖 ${theme.name}: ${theme.description}`);
    },
    
    /**
     * 生成主题图案
     */
    _generateStoryPattern(theme) {
        const state = StateManager.state;
        const cx = state.canvasWidth / 2;
        const cy = state.canvasHeight / 2;
        const maxR = Math.min(cx, cy) * 0.75;
        
        // 生成主题调色板
        const palette = {
            bg: theme.palette.bg,
            bgGrad: theme.palette.bgGrad,
            stroke: theme.palette.stroke,
            glow: theme.palette.glow,
            accent: theme.palette.accent,
            mood: theme.palette.mood
        };
        
        const colors = this._generateColorsFromHex(theme.palette.stroke, 6);
        
        // 配置
        const config = {
            symmetryCount: theme.symmetry,
            symmetryMode: theme.symmetryMode,
            glowEnabled: theme.effects.glowEnabled,
            rainbowMode: theme.effects.rainbowMode,
            gradientEnabled: theme.effects.gradientEnabled,
            trailMode: theme.effects.trailMode,
            strokeWidth: 3,
            brushType: 'solid',
            particleEnabled: true,
            particleType: theme.particleType
        };
        
        // 生成主图案
        const pattern1 = theme.patterns[0];
        const strokes1 = RandomGenerator._invokeGenerator(
            pattern1, cx, cy, maxR, 3, colors, config, palette
        );
        
        strokes1.forEach(s => {
            s._layer = 0;
            s._opacity = 0.8;
            StateManager.addStroke(s);
        });
        
        // 生成次图案
        if (theme.patterns[1]) {
            const pattern2 = theme.patterns[1];
            const colors2 = this._generateColorsFromHex(theme.palette.accent, 4);
            const strokes2 = RandomGenerator._invokeGenerator(
                pattern2, cx, cy, maxR * 0.5, 2, colors2, config, palette
            );
            
            strokes2.forEach(s => {
                s._layer = 1;
                s._opacity = 0.6;
                StateManager.addStroke(s);
            });
        }
        
        console.log('[CreativeExtensions] 主题图案生成完成');
    },
    
    /**
     * 获取所有主题列表
     */
    getStoryThemes() {
        return Object.entries(this._storyThemes).map(([id, theme]) => ({
            id,
            name: theme.name,
            description: theme.description
        }));
    },
    
    // ============ 初始化 ============
    
    init() {
        console.log('[CreativeExtensions] 创意扩展模块初始化');
        
        // 绑定快捷键
        this._bindExtensionKeys();
        
        // 创建可视化开关按钮
        this._createVisualizerToggle();
    },
    
    /**
     * 绑定扩展快捷键
     */
    _bindExtensionKeys() {
        // 原有键盘处理器已处理部分快捷键
        // 这里添加扩展快捷键的处理
        
        const originalHandler = KeyboardHandler._handleKeydown;
        KeyboardHandler._handleKeydown = function(e) {
            // 调用原始处理器
            originalHandler.call(KeyboardHandler, e);
            
            // 扩展快捷键（在处理输入框时也生效）
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key.toLowerCase()) {
                case 'e':
                    if (!e.ctrlKey) {
                        e.preventDefault();
                        CreativeExtensions.evolve();
                    }
                    break;
                case 'h':
                    if (!e.ctrlKey) {
                        e.preventDefault();
                        CreativeExtensions.hybridize();
                    }
                    break;
                case 'v':
                    if (!e.ctrlKey) {
                        e.preventDefault();
                        CreativeExtensions.toggleAudioVisualizer(!CreativeExtensions._visualizerEnabled);
                    }
                    break;
                case 'b':
                    if (!e.ctrlKey) {
                        e.preventDefault();
                        CreativeExtensions.startRandomStory();
                    }
                    break;
            }
        };
    },
    
    /**
     * 创建音频可视化开关
     */
    _createVisualizerToggle() {
        // 延迟创建，等待 DOM 加载完成
        setTimeout(() => {
            // 检查是否已存在
            if (document.getElementById('visualizer-toggle')) return;
            
            // 在工具栏添加按钮
            const toolbar = document.getElementById('main-toolbar');
            if (!toolbar) return;
            
            const btn = document.createElement('button');
            btn.id = 'visualizer-toggle';
            btn.title = '音频可视化 (V)';
            btn.textContent = '🎵';
            btn.addEventListener('click', () => {
                this.toggleAudioVisualizer(!this._visualizerEnabled);
            });
            
            // 插入到音乐按钮旁边
            const actionsGroup = toolbar.querySelector('.toolbar-group:last-child');
            if (actionsGroup) {
                actionsGroup.insertBefore(btn, actionsGroup.firstChild);
            }
        }, 1000);
    }
};

// 页面加载后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CreativeExtensions.init());
} else {
    CreativeExtensions.init();
}
