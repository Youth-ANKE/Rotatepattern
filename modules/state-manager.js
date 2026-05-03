/**
 * 状态管理器模块 - 增强版
 * 集中管理应用状态、历史记录（撤销/重做）、本地存储和状态通知
 * 优化：使用 StorageUtils 安全存储，更完善的历史管理，错误处理
 */
const StateManager = {
  // 笔画上限，防止 OOM
  _maxStrokes: 2000,
  
  // 存储键名
  _storageKeys: {
    settings: 'kaleidoscope-settings',
    gallery: 'kaleidoscope-gallery',
    presets: 'kaleidoscope-presets'
  },

  // 状态撤销快照（支持状态变更的撤销）
  _stateHistory: [],        // 存储状态快照对象
  _stateHistoryIndex: -1,
  _maxStateHistory: 30,
  _stateSnapshotTimer: null,
  
  // 状态变更监听器
  _listeners: new Map(),    // 使用Map替代数组，支持优先级
  _listenerId: 0,           // 监听器唯一ID生成器

    state: {
        // 画布状态
        canvasWidth: 800,
        canvasHeight: 800,
        bgColor: '#0a0a1a',
        currentRotation: 0,
        isDrawing: false,
        strokes: [],
        currentStroke: [],

        // 画笔设置
        strokeColor: '#ffffff',
        strokeWidth: 2,
        brushType: 'solid',  // solid, dashed, dotted, spray

        // 对称设置
        symmetryMode: 'rotational',  // rotational, mirror, spiral
        symmetryCount: 6,
        spiralScale: 0,

        // 旋转设置
        rotationSpeed: 5,

        // 特效
        glowEnabled: false,
        glowColor: '#ffffff',
        glowBlur: 10,
        gradientEnabled: false,
        gradientFrom: '#ff6b6b',
        gradientTo: '#6bcbff',
        rainbowMode: false,
        rainbowHue: 0,
        trailMode: false,

        // 混合模式
        blendMode: 'normal',           // normal, multiply, screen, overlay, soft-light, hard-light, color-dodge, color-burn, difference, exclusion, lighter

        // 自动换色
        colorCycleMode: false,
        colorCycleIndex: 0,
        colorPalette: ['#ff6b6b', '#ffd93d', '#6bcbff', '#a66cff', '#ff8fe5'],

        // 粒子
        particleEnabled: true,
        particleType: 'firefly',  // firefly, star, sparkle

        // 音乐
        musicEnabled: false,
        musicGenEnabled: false,
        musicGenVolume: 0.5,
        onlineMusicEnabled: false,
        onlineMusicTitle: '',
        onlineMusicCover: '',
        onlineMusicVolume: 0.5,
        playlistMode: 'normal',

        // 音量
        musicVolume: 0.5,
        tickVolume: 0.3,

        // 音效
        tickEnabled: false,
        musicTheme: 'aurora',
        drawMusicEnabled: true,

        // 画廊
        galleryImages: [],

        // ============ 新增增强功能状态 ============
        
        // 配色系统
        colorScheme: 'random',          // random, complementary, triadic, tetradic, analogous, monochromatic
        materialPalette: 'none',        // none, aurora, lava, deepsea, rainbowCandy, starryNight, neon, candy, retro, cyber, ink
        colorDither: 0,                // 颜色抖动 0~50
        
        // 高级渐变
        gradientType: 'none',          // none, linear, radial, multiStop
        gradientStops: [],             // [{pos, color}] 多色渐变节点
        
        // 多层系统
        layers: null,                  // null 或 [{generator, colors, opacity, blendMode, strokeWidth, enabled}...]
        
        // 动画系统
        animationMode: 'none',         // none, breathing, colorShift, rotate, drift, pulse
        animationSpeed: 1.0,
        animationPhase: 0,
        
        // 进化算法
        evolutionIterations: 0,
        evolutionPopulation: [],
        
        // 噪声种子（用于流体/地形）
        noiseSeed: Math.floor(Math.random() * 100000),
        
        // 密度控制
        density: 0.5,
        
        // 生成器元数据（用于识别当前图案）
        activeGeneratorName: 'unknown',
        generatorConfig: {}
    },

    // 增量历史：_history 存储每次新增的笔画（单笔画数组），而非完整深拷贝
    _history: [],       // 每个元素是 [strokeObj]（一笔画）
    _historyIndex: -1,  // 当前在历史中的位置（实际指向的是基于 base 累加后的索引）
    _maxHistory: 100,   // 增加历史长度

    // 性能优化：requestAnimationFrame 节流
    _pendingUpdate: null,
    _debounceTimer: null,
    _autoSaveTimer: null,

    /**
     * 初始化：加载本地存储和监听卸载事件
     */
    init() {
        try {
            this._loadFromStorage();
            this._loadGallery();
            this._loadPresets();
            
            window.addEventListener('beforeunload', () => this.destroy());
            window.addEventListener('pagehide', () => this._saveToStorage());
            
            // 定期自动保存设置（30秒）
            this._autoSaveTimer = setInterval(() => {
                this._saveToStorage();
            }, 30000);
            
            console.log('[StateManager] 初始化完成');
        } catch (e) {
            console.error('[StateManager] 初始化失败:', e);
        }
    },

    /**
     * 订阅状态变化
     * @param {Function} callback - 回调函数
     * @param {number} [priority=0] - 优先级，数字越小越先执行
     * @returns {number} 监听器ID，用于取消订阅
     */
    subscribe(callback, priority = 0) {
        const id = ++this._listenerId;
        this._listeners.set(id, { callback, priority });
        return id;
    },
    
    /**
     * 取消订阅
     * @param {number} id - 监听器ID
     */
    unsubscribe(id) {
        this._listeners.delete(id);
    },

    /**
     * 通知所有订阅者（按优先级排序）
     */
    notify() {
        const state = this.state;
        const listeners = Array.from(this._listeners.values())
            .sort((a, b) => a.priority - b.priority);
        
        for (const { callback } of listeners) {
            try {
                callback(state);
            } catch (e) {
                console.error('[StateManager] 监听器错误:', e);
            }
        }
    },

    /**
     * 更新状态，使用 requestAnimationFrame 节流通知
     * @param {Object} updates
     */
    setState(updates) {
        if (!updates || typeof updates !== 'object') {
            console.warn('[StateManager] 无效的状态更新');
            return;
        }
        
        Object.assign(this.state, updates);

        // 节流：合并同一帧内的多次 setState 为一次通知
        if (this._pendingUpdate) {
            cancelAnimationFrame(this._pendingUpdate);
        }
        this._pendingUpdate = requestAnimationFrame(() => {
            this._pendingUpdate = null;
            this.notify();
        });
    },

    /**
     * 添加一笔画到状态，并自动压入历史
     * 统一入口，确保状态一致性和历史追踪
     * @param {Object} stroke - 笔画点数组（带 _color 属性）
     */
    addStroke(stroke) {
        if (!stroke || stroke.length < 2) return;

        // 笔画上限保护：淘汰最旧的笔画
        while (this.state.strokes.length >= this._maxStrokes) {
            this.state.strokes.shift();
        }

        this.state.strokes.push(stroke);
        this.pushHistory(stroke);
        this.notify();
    },

    /**
     * 压入增量历史快照（每次笔画完成时调用）
     * 只存储新增的笔画对象，不做深拷贝，大幅降低大笔画量下的卡顿
     * @param {Object} stroke - 新增的笔画对象
     */
    pushHistory(stroke) {
        // 如果当前不在历史末尾，丢弃后面的历史
        if (this._historyIndex < this._history.length - 1) {
            this._history = this._history.slice(0, this._historyIndex + 1);
        }

        // 存储的是对 stroke 的引用（撤销时通过重建方式维护正确状态）
        this._history.push(stroke);
        if (this._history.length > this._maxHistory) {
            this._history.shift();
            // 同步从 state.strokes 移除最旧笔画以保持一致性
            if (this.state.strokes.length > 0) {
                this.state.strokes.shift();
            }
        }
        this._historyIndex = this._history.length - 1;
    },

    /**
     * 根据增量历史重建 strokes 数组
     */
    _rebuildStrokes() {
        this.state.strokes = this._history.slice(0, this._historyIndex + 1);
    },

    /**
     * 撤销
     */
    undo() {
        if (this._historyIndex <= 0) return;
        this._historyIndex--;
        this._rebuildStrokes();
        this.notify();
    },

    /**
     * 重做
     */
    redo() {
        if (this._historyIndex >= this._history.length - 1) return;
        this._historyIndex++;
        this._rebuildStrokes();
        this.notify();
    },

    /**
     * 批量替换所有笔画（用于加载项目、随机生成等场景）
     * 重建完整的历史记录
     * @param {Array} strokes - 笔画数组
     */
    replaceStrokes(strokes) {
        if (!Array.isArray(strokes)) return;
        this.state.strokes = strokes.slice(); // 浅拷贝
        this._history = strokes.filter(s => Array.isArray(s) && s.length >= 2).map(s => s);
        this._historyIndex = this._history.length - 1;
        // 历史上限保护
        if (this._history.length > this._maxHistory) {
            const start = this._history.length - this._maxHistory;
            this._history = this._history.slice(start);
            this._historyIndex = this._history.length - 1;
            this.state.strokes = this._history.slice();
        }
        this.notify();
    },

    /**
     * 清空笔画
     */
    clearStrokes() {
        this.state.strokes = [];
        this._history = [];
        this._historyIndex = -1;
        this.notify();
    },

    /**
     * 添加截图到画廊（带压缩和数量限制）
     * @param {string} dataUrl
     */
    addGalleryImage(dataUrl) {
        try {
            const image = {
                dataUrl: dataUrl,
                timestamp: Date.now(),
                id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            this.state.galleryImages.unshift(image);
            
            // 只保留最近20张
            if (this.state.galleryImages.length > 20) {
                this.state.galleryImages = this.state.galleryImages.slice(0, 20);
            }
            
            this._saveGallery();
            this.notify();
        } catch (e) {
            console.error('[StateManager] 添加画廊图片失败:', e);
        }
    },
    
    /**
     * 从画廊删除图片
     * @param {string} id - 图片ID
     */
    removeGalleryImage(id) {
        this.state.galleryImages = this.state.galleryImages.filter(img => img.id !== id);
        this._saveGallery();
        this.notify();
    },

    /**
     * 清空画廊
     */
    clearGallery() {
        this.state.galleryImages = [];
        if (typeof StorageUtils !== 'undefined') {
            StorageUtils.removeItem(this._storageKeys.gallery);
        } else {
            localStorage.removeItem('kaleidoscope_gallery');
        }
        this.notify();
    },
    
    /**
     * 保存自定义预设
     * @param {string} name - 预设名称
     * @param {Object} config - 预设配置
     */
    savePreset(name, config) {
        try {
            const presets = this._getPresets();
            presets[name] = { ...config, savedAt: Date.now() };
            this._savePresets(presets);
        } catch (e) {
            console.error('[StateManager] 保存预设失败:', e);
        }
    },
    
    /**
     * 获取所有预设
     * @returns {Object} 预设对象
     */
    getPresets() {
        return this._getPresets();
    },
    
    /**
     * 删除预设
     * @param {string} name - 预设名称
     */
    deletePreset(name) {
        try {
            const presets = this._getPresets();
            delete presets[name];
            this._savePresets(presets);
        } catch (e) {
            console.error('[StateManager] 删除预设失败:', e);
        }
    },
    
    _getPresets() {
        if (typeof StorageUtils !== 'undefined') {
            return StorageUtils.getItem(this._storageKeys.presets, {});
        }
        try {
            const raw = localStorage.getItem('kaleidoscope_presets');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    },
    
    _loadPresets() {
        // 预设加载，按需使用
    },
    
    _savePresets(presets) {
        if (typeof StorageUtils !== 'undefined') {
            StorageUtils.setItem(this._storageKeys.presets, presets);
        } else {
            localStorage.setItem('kaleidoscope_presets', JSON.stringify(presets));
        }
    },

    /**
     * 将关键状态保存到 localStorage
     */
    _saveToStorage() {
        try {
            const data = {
                strokeColor: this.state.strokeColor,
                bgColor: this.state.bgColor,
                strokeWidth: this.state.strokeWidth,
                symmetryCount: this.state.symmetryCount,
                symmetryMode: this.state.symmetryMode,
                rotationSpeed: this.state.rotationSpeed,
                brushType: this.state.brushType,
                glowEnabled: this.state.glowEnabled,
                glowColor: this.state.glowColor,
                glowBlur: this.state.glowBlur,
                gradientEnabled: this.state.gradientEnabled,
                gradientFrom: this.state.gradientFrom,
                gradientTo: this.state.gradientTo,
                rainbowMode: this.state.rainbowMode,
                trailMode: this.state.trailMode,
                spiralScale: this.state.spiralScale,
                particleEnabled: this.state.particleEnabled,
                particleType: this.state.particleType,
                colorCycleMode: this.state.colorCycleMode,
                colorCycleIndex: this.state.colorCycleIndex,
                musicEnabled: this.state.musicEnabled,
                musicGenEnabled: this.state.musicGenEnabled,
                musicGenVolume: this.state.musicGenVolume,
                blendMode: this.state.blendMode,
                materialPalette: this.state.materialPalette,
                animationMode: this.state.animationMode,
                animationSpeed: this.state.animationSpeed,
                density: this.state.density
            };
            
            if (typeof StorageUtils !== 'undefined') {
                StorageUtils.setItem(this._storageKeys.settings, data);
            } else {
                localStorage.setItem(this._storageKeys.settings, JSON.stringify(data));
            }
        } catch (e) {
            console.warn('[StateManager] 保存失败:', e);
        }
    },

    /**
     * 从 localStorage 恢复状态
     */
    _loadFromStorage() {
        try {
            let data;
            if (typeof StorageUtils !== 'undefined') {
                data = StorageUtils.getItem(this._storageKeys.settings, null);
            } else {
                const raw = localStorage.getItem(this._storageKeys.settings);
                data = raw ? JSON.parse(raw) : null;
            }
            
            if (data) {
                Object.assign(this.state, data);
            }
        } catch (e) {
            console.warn('[StateManager] 加载失败:', e);
        }
    },
    
    /**
     * 保存画廊
     */
    _saveGallery() {
        try {
            // 只保留关键信息，避免存储过大
            const imagesToSave = this.state.galleryImages.map(img => ({
                dataUrl: img.dataUrl,
                timestamp: img.timestamp,
                id: img.id
            }));
            
            if (typeof StorageUtils !== 'undefined') {
                StorageUtils.setItem(this._storageKeys.gallery, imagesToSave);
            } else {
                localStorage.setItem(this._storageKeys.gallery, JSON.stringify(imagesToSave));
            }
        } catch (e) {
            console.warn('[StateManager] 画廊保存失败:', e);
        }
    },
    
    /**
     * 加载画廊
     */
    _loadGallery() {
        try {
            let images;
            if (typeof StorageUtils !== 'undefined') {
                images = StorageUtils.getItem(this._storageKeys.gallery, []);
            } else {
                const raw = localStorage.getItem(this._storageKeys.gallery);
                images = raw ? JSON.parse(raw) : [];
            }
            
            if (Array.isArray(images)) {
                this.state.galleryImages = images;
            }
        } catch (e) {
            console.warn('[StateManager] 画廊加载失败:', e);
            this.state.galleryImages = [];
        }
    },

    /**
     * 清理状态管理器（移除事件监听、重置内部状态）
     */
    destroy() {
        try {
            this._saveToStorage();
            
            this._listeners.clear();
            this._history = [];
            this._historyIndex = -1;
            this._stateHistory = [];
            this._stateHistoryIndex = -1;
            
            if (this._stateSnapshotTimer) {
                clearTimeout(this._stateSnapshotTimer);
                this._stateSnapshotTimer = null;
            }
            if (this._pendingUpdate) {
                cancelAnimationFrame(this._pendingUpdate);
                this._pendingUpdate = null;
            }
            if (this._autoSaveTimer) {
                clearInterval(this._autoSaveTimer);
                this._autoSaveTimer = null;
            }
            
            console.log('[StateManager] 已清理');
        } catch (e) {
            console.error('[StateManager] 清理失败:', e);
        }
    },

    // ==================== 状态级撤销/重做 ====================

    /**
     * 保存当前状态快照（用于状态变更撤销）
     * 提取不影响笔画的关键状态字段
     */
    _takeStateSnapshot() {
        const s = this.state;
        const snapshot = {
            strokeColor: s.strokeColor,
            strokeWidth: s.strokeWidth,
            brushType: s.brushType,
            symmetryMode: s.symmetryMode,
            symmetryCount: s.symmetryCount,
            spiralScale: s.spiralScale,
            rotationSpeed: s.rotationSpeed,
            glowEnabled: s.glowEnabled,
            glowColor: s.glowColor,
            glowBlur: s.glowBlur,
            gradientEnabled: s.gradientEnabled,
            gradientFrom: s.gradientFrom,
            gradientTo: s.gradientTo,
            rainbowMode: s.rainbowMode,
            trailMode: s.trailMode,
            blendMode: s.blendMode,
            colorCycleMode: s.colorCycleMode,
            colorCycleIndex: s.colorCycleIndex,
            colorPalette: s.colorPalette,
            materialPalette: s.materialPalette,
            colorScheme: s.colorScheme,
            colorDither: s.colorDither,
            animationMode: s.animationMode,
            animationSpeed: s.animationSpeed,
            density: s.density,
            bgColor: s.bgColor
        };
        return snapshot;
    },

    /**
     * 将当前状态快照压入历史（每次重要状态变更时调用）
     */
    pushStateSnapshot() {
        // 如果不在历史末尾，丢弃后面的快照
        if (this._stateHistoryIndex < this._stateHistory.length - 1) {
            this._stateHistory = this._stateHistory.slice(0, this._stateHistoryIndex + 1);
        }

        const snapshot = this._takeStateSnapshot();
        this._stateHistory.push(snapshot);
        if (this._stateHistory.length > this._maxStateHistory) {
            this._stateHistory.shift();
        }
        this._stateHistoryIndex = this._stateHistory.length - 1;
    },

    /**
     * 状态级撤销（还原上一次关键状态配置）
     */
    undoState() {
        if (this._stateHistory.length === 0) return;
        if (this._stateHistoryIndex <= 0) return;
        this._stateHistoryIndex--;
        const snapshot = this._stateHistory[this._stateHistoryIndex];
        if (!snapshot) return;
        // 恢复快照中的字段，但不覆盖笔画
        Object.assign(this.state, snapshot);
        this.notify();
    },

    /**
     * 状态级重做
     */
    redoState() {
        if (this._stateHistory.length === 0) return;
        if (this._stateHistoryIndex >= this._stateHistory.length - 1) return;
        this._stateHistoryIndex++;
        const snapshot = this._stateHistory[this._stateHistoryIndex];
        if (!snapshot) return;
        Object.assign(this.state, snapshot);
        this.notify();
    },

    // ==================== 边界保护 ====================

    /**
     * 安全获取颜色调色板（防止空数组导致 %0）
     * @returns {Array} 颜色数组，至少包含一个默认颜色
     */
    getSafeColorPalette() {
        const pal = this.state.colorPalette;
        if (!pal || pal.length === 0) {
            return ['#ffffff'];
        }
        return pal;
    },

    /**
     * 安全获取色板索引（防止空数组 %0 导致 undefined）
     * @param {number} index - 期望索引
     * @returns {number} 安全取模后的索引
     */
    getSafeColorIndex(index) {
        const pal = this.getSafeColorPalette();
        if (pal.length === 0) return 0;
        return (index < 0 ? 0 : index) % pal.length;
    },

    /**
     * 保存画廊到 localStorage
     */
    _saveGallery() {
        try {
            // 只保留最近的 20 张截图以防止超限
            const images = this.state.galleryImages.slice(-20);
            localStorage.setItem('kaleidoscope_gallery', JSON.stringify(images));
        } catch (e) {
            console.warn('[StateManager] 画廊保存失败:', e.message);
        }
    },

    /**
     * 从 localStorage 加载画廊
     */
    _loadGallery() {
        try {
            const raw = localStorage.getItem('kaleidoscope_gallery');
            if (!raw) return;
            const images = JSON.parse(raw);
            if (Array.isArray(images)) {
                this.state.galleryImages = images;
            }
        } catch (e) {
            console.warn('[StateManager] 画廊加载失败:', e.message);
        }
    }
};