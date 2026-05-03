/**
 * 输入处理模块
 * 处理鼠标和触摸事件，将用户输入转换为笔画数据
 * 特性：笔画端点、粒子发射、绘图音符、笔画简化
 */
const InputHandler = {
    canvas: null,
    isDown: false,
    currentStroke: [],
    // 笔画点采样限制
    lastPointTime: 0,
    minPointInterval: 8, // ms

    /**
     * 初始化事件监听
     * @param {string} canvasId - 画布元素ID
     */
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this._startStroke(e.clientX, e.clientY, e));
        window.addEventListener('mousemove', (e) => this._moveStroke(e.clientX, e.clientY, e));
        window.addEventListener('mouseup', (e) => this._endStroke(e));
        this.canvas.addEventListener('mouseleave', (e) => {
            if (this.isDown) this._endStroke(e);
        });

        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._startStroke(touch.clientX, touch.clientY, e);
        }, { passive: false });
        window.addEventListener('touchmove', (e) => {
            if (!this.isDown) return;
            e.preventDefault();
            const touch = e.touches[0];
            this._moveStroke(touch.clientX, touch.clientY, e);
        }, { passive: false });
        window.addEventListener('touchend', (e) => {
            if (this.isDown) this._endStroke(e);
        });
    },

    /**
     * 获取画布相对坐标
     */
    _getCanvasPos(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: Math.round((clientX - rect.left) * (this.canvas.width / rect.width)),
            y: Math.round((clientY - rect.top) * (this.canvas.height / rect.height))
        };
    },

    /**
     * 获取当前自动换色下的颜色
     */
    _getNextColor() {
        const { colorCycleMode, strokeColor } = StateManager.state;
        if (!colorCycleMode) return strokeColor;
        const safeIndex = StateManager.getSafeColorIndex(StateManager.state.colorCycleIndex);
        return StateManager.getSafeColorPalette()[safeIndex];
    },

    /**
     * 开始绘制笔画
     */
    _startStroke(clientX, clientY, event) {
        AudioEngine.init(); // 延迟初始化（用户交互触发）
        
        const pos = this._getCanvasPos(clientX, clientY);
        this.isDown = true;
        
        // 为本次笔画分配一个自动换色的颜色
        const strokeColor = this._getNextColor();
        this.currentStroke = [pos];
        // 将颜色标记存储在笔画上
        this.currentStroke._color = strokeColor;
        
        // 在笔画完成之前就显示颜色选择器变化（UI反馈）
        document.getElementById('stroke-color').value = strokeColor;
        
        StateManager.setState({
            isDrawing: true,
            currentStroke: this.currentStroke,
            strokeColor: strokeColor
        });

        // 起始点也触发音符和粒子
        const { symmetryCount, canvasWidth, canvasHeight } = StateManager.state;
        const cx = canvasWidth / 2, cy = canvasHeight / 2;
        const rawAngle = Math.atan2(pos.y - cy, pos.x - cx);
        const dist = Math.sqrt((pos.x - cx) ** 2 + (pos.y - cy) ** 2);
        AudioEngine.playDrawNote(symmetryCount, rawAngle, 0.5, dist);
        ParticleSystem.emit(pos.x, pos.y, 5);
    },

    /**
     * 移动绘制中
     */
    _moveStroke(clientX, clientY, event) {
        if (!this.isDown) return;

        const now = Date.now();
        if (now - this.lastPointTime < this.minPointInterval) return;
        this.lastPointTime = now;

        const pos = this._getCanvasPos(clientX, clientY);
        this.currentStroke.push(pos);
        StateManager.setState({ currentStroke: this.currentStroke });

        // 绘制过程中触发音乐和粒子
        const { symmetryCount, canvasWidth, canvasHeight } = StateManager.state;
        const cx = canvasWidth / 2, cy = canvasHeight / 2;
        const rawAngle = Math.atan2(pos.y - cy, pos.x - cx);
        const dist = Math.sqrt((pos.x - cx) ** 2 + (pos.y - cy) ** 2);
        AudioEngine.playDrawNote(symmetryCount, rawAngle, 0.5, dist);
        ParticleSystem.emit(pos.x, pos.y, 3);
    },

    /**
     * 结束绘制，将笔画保存到历史
     */
    _endStroke(event) {
        if (!this.isDown) return;
        this.isDown = false;
        StateManager.setState({ isDrawing: false });

        if (this.currentStroke.length >= 2) {
            // 笔画简化，减少冗余点
            const simplified = MathUtils.simplifyStroke(this.currentStroke, 1);
            
            // 将笔画颜色存储在 stroke 上供 CanvasRenderer 使用
            simplified._color = this.currentStroke._color || StateManager.state.strokeColor;
            
            // 通过统一 API 添加笔画，自动处理历史追踪和上限保护
            StateManager.addStroke(simplified);
            
            // 推进颜色循环索引（每次笔画自动换色）
            if (StateManager.state.colorCycleMode) {
                const newIndex = (StateManager.state.colorCycleIndex + 1) % StateManager.state.colorPalette.length;
                StateManager.setState({ colorCycleIndex: newIndex });
            }
        }

        // 清空当前笔画并通知
        this.currentStroke = [];
        StateManager.setState({ currentStroke: [] });
    },

    /**
     * 获取当前是否正在绘制
     */
    isDrawing() {
        return this.isDown;
    }
};