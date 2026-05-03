/**
 * 动态动画控制器模块
 * 为万花筒添加呼吸缩放、颜色流动、中心漂移等艺术效果
 * 注意：不使用独立的 requestAnimationFrame 循环，由 main.js 统一驱动 update()
 */
const AnimationController = {
    enabled: false,
    startTime: null,

    // === 动画参数 ===
    breathingScale: {
        enabled: true,
        speed: 0.5,
        amplitude: 0.1,
        baseScale: 1.0
    },

    colorFlow: {
        enabled: true,
        speed: 0.3,
        hueRange: 30
    },

    centerDrift: {
        enabled: false,
        speed: 0.2,
        amplitude: 20
    },

    layerBlend: {
        enabled: false,
        speed: 0.4
    },

    rotationDrift: {
        enabled: false,
        speed: 0.1
    },

    /**
     * 初始化动画控制器
     */
    init() {
        this.startTime = Date.now();
        console.log('[AnimationController] 动画控制器初始化完成');
    },

    /**
     * 启用/禁用动画（不再启动独立 rAF 循环，由 main.js 统一驱动）
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) {
            // 计算当前变换并标记重绘
            const transforms = this.getCurrentTransforms();
            StateManager.setState({ _animationTransforms: transforms });
            CanvasRenderer.needRedrawOffscreen = true;
        } else {
            StateManager.setState({ _animationTransforms: null });
        }
    },

    /**
     * 每帧更新（由 main.js 动画循环调用，避免双重渲染）
     */
    update() {
        if (!this.enabled) return;

        const transforms = this.getCurrentTransforms();
        StateManager.setState({ _animationTransforms: transforms });
        CanvasRenderer.needRedrawOffscreen = true;
    },

    /**
     * 获取当前动画时间（秒）
     */
    getTime() {
        return (Date.now() - this.startTime) / 1000;
    },

    /**
     * 获取当前所有动画变换
     */
    getCurrentTransforms() {
        const t = this.getTime();
        return {
            scale: this._getBreathingScale(t),
            hueOffset: this._getHueOffset(t),
            centerOffset: this._getCenterOffset(t),
            rotationOffset: this._getRotationOffset(t),
            alphaPulse: this._getAlphaPulse(t)
        };
    },

    /**
     * 呼吸缩放效果
     */
    _getBreathingScale(t) {
        if (!this.breathingScale.enabled) return 1.0;
        const { speed, amplitude, baseScale } = this.breathingScale;
        return baseScale + Math.sin(t * speed * Math.PI * 2) * amplitude;
    },

    /**
     * 颜色色相流动效果
     */
    _getHueOffset(t) {
        if (!this.colorFlow.enabled) return 0;
        const { speed, hueRange } = this.colorFlow;
        return (Math.sin(t * speed * Math.PI * 2) * hueRange);
    },

    /**
     * 中心偏移漂移效果
     */
    _getCenterOffset(t) {
        if (!this.centerDrift.enabled) return { x: 0, y: 0 };
        const { speed, amplitude } = this.centerDrift;
        return {
            x: Math.sin(t * speed * Math.PI * 2) * amplitude,
            y: Math.cos(t * speed * Math.PI * 1.7 + 0.5) * amplitude
        };
    },

    /**
     * 旋转偏移漂移
     */
    _getRotationOffset(t) {
        if (!this.rotationDrift.enabled) return 0;
        return t * this.rotationDrift.speed;
    },

    /**
     * 透明度脉冲
     */
    _getAlphaPulse(t) {
        return 0.7 + Math.sin(t * 0.8) * 0.3;
    },

    /**
     * 设置呼吸效果参数
     */
    setBreathing(enabled, speed = 0.5, amplitude = 0.1) {
        this.breathingScale = { enabled, speed, amplitude, baseScale: 1.0 };
    },

    /**
     * 设置颜色流动参数
     */
    setColorFlow(enabled, speed = 0.3, hueRange = 30) {
        this.colorFlow = { enabled, speed, hueRange };
    },

    /**
     * 设置中心漂移参数
     */
    setCenterDrift(enabled, speed = 0.2, amplitude = 20) {
        this.centerDrift = { enabled, speed, amplitude };
    },

    /**
     * 设置旋转漂移
     */
    setRotationDrift(enabled, speed = 0.1) {
        this.rotationDrift = { enabled, speed };
    },

    /**
     * 设置图层混合动画
     */
    setLayerBlend(enabled, speed = 0.4) {
        this.layerBlend = { enabled, speed };
    },

    /**
     * 随机化所有动画参数
     */
    randomize() {
        this.breathingScale.enabled = Math.random() > 0.3;
        this.breathingScale.speed = 0.2 + Math.random() * 0.8;
        this.breathingScale.amplitude = 0.05 + Math.random() * 0.15;
        
        this.colorFlow.enabled = Math.random() > 0.2;
        this.colorFlow.speed = 0.1 + Math.random() * 0.5;
        this.colorFlow.hueRange = 15 + Math.random() * 45;
        
        this.centerDrift.enabled = Math.random() > 0.6;
        this.centerDrift.speed = 0.1 + Math.random() * 0.3;
        this.centerDrift.amplitude = 10 + Math.random() * 30;
        
        this.rotationDrift.enabled = Math.random() > 0.7;
        this.rotationDrift.speed = (Math.random() - 0.5) * 0.2;
        
        console.log('[AnimationController] 参数已随机化');
    },

    /**
     * 快速预设：呼吸
     */
    presetBreathing() {
        this.breathingScale = { enabled: true, speed: 0.4, amplitude: 0.08, baseScale: 1.0 };
        this.colorFlow = { enabled: true, speed: 0.2, hueRange: 20 };
        this.centerDrift.enabled = false;
        this.rotationDrift.enabled = false;
    },

    /**
     * 快速预设：漂浮
     */
    presetFloating() {
        this.breathingScale = { enabled: true, speed: 0.25, amplitude: 0.05, baseScale: 1.0 };
        this.colorFlow = { enabled: true, speed: 0.15, hueRange: 40 };
        this.centerDrift = { enabled: true, speed: 0.15, amplitude: 25 };
        this.rotationDrift.enabled = false;
    },

    /**
     * 快速预设：漩涡
     */
    presetSwirl() {
        this.breathingScale = { enabled: true, speed: 0.6, amplitude: 0.12, baseScale: 1.0 };
        this.colorFlow = { enabled: true, speed: 0.4, hueRange: 60 };
        this.centerDrift.enabled = false;
        this.rotationDrift = { enabled: true, speed: 0.08 };
    },

    /**
     * 快速预设：迷幻
     */
    presetPsychedelic() {
        this.breathingScale = { enabled: true, speed: 0.8, amplitude: 0.15, baseScale: 1.0 };
        this.colorFlow = { enabled: true, speed: 0.6, hueRange: 90 };
        this.centerDrift = { enabled: true, speed: 0.3, amplitude: 35 };
        this.rotationDrift = { enabled: true, speed: 0.12 };
    }
};
