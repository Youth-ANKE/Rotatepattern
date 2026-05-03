/**
 * 键盘快捷键处理模块
 * 提供全面的键盘快捷键支持
 */
const KeyboardHandler = {
    /**
     * 初始化键盘事件监听
     */
    init() {
        document.addEventListener('keydown', (e) => this._handleKeydown(e));
    },

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} e
     */
    _handleKeydown(e) {
        // 不要在处理输入框时触发快捷键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key.toLowerCase()) {
            // === 撤销/重做 ===
            case 'z':
                if (e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    this._undo();
                }
                break;
            case 'y':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this._redo();
                }
                break;

            // === 功能快捷键（无Ctrl组合） ===
            case 'c':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._clearCanvas();
                }
                break;
            case 't':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._toggleTrail();
                }
                break;
            case 'm':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._toggleMusic();
                }
                break;
            case 's':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._saveImage();
                }
                break;
            case 'r':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._randomConfig();
                }
                break;

            // === 方向键 ===
            case 'arrowup':
                e.preventDefault();
                this._adjustSymmetry(1);
                break;
            case 'arrowdown':
                e.preventDefault();
                this._adjustSymmetry(-1);
                break;
            case 'arrowleft':
                e.preventDefault();
                this._adjustSpeed(-5);
                break;
            case 'arrowright':
                e.preventDefault();
                this._adjustSpeed(5);
                break;

            // === 空格 ===
            case ' ':
                e.preventDefault();
                this._toggleAutoRotate();
                break;

            // === 数字键切换画笔 ===
            case '1':
                e.preventDefault();
                this._setBrush('solid');
                break;
            case '2':
                e.preventDefault();
                this._setBrush('dashed');
                break;
            case '3':
                e.preventDefault();
                this._setBrush('dotted');
                break;
            case '4':
                e.preventDefault();
                this._setBrush('spray');
                break;

            // === G 切换发光 ===
            case 'g':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._toggleGlow();
                }
                break;
            // === A 切换动态动画 ===
            case 'a':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._toggleAnimation();
                }
                break;
        }
    },

    _undo() {
        if (StateManager.undo()) {
            this._showToast('↩ 撤销');
        }
    },

    _redo() {
        if (StateManager.redo()) {
            this._showToast('↪ 重做');
        }
    },

    _clearCanvas() {
        const btn = document.getElementById('clear-canvas');
        if (btn) btn.click();
    },

    _toggleTrail() {
        StateManager.setState({ trailMode: !StateManager.state.trailMode });
        const btn = document.getElementById('trail-toggle');
        if (btn) btn.classList.toggle('active');
        this._showToast(StateManager.state.trailMode ? '🌊 拖尾：开' : '🌊 拖尾：关');
    },

    _toggleMusic() {
        const btn = document.getElementById('music-toggle');
        if (btn) btn.click();
    },

    _saveImage() {
        const btn = document.getElementById('save-png');
        if (btn) btn.click();
    },

    _randomConfig() {
        RandomGenerator.applyRandom();
        this._showToast('🎲 随机生成配置！');
    },

    _adjustSymmetry(delta) {
        let count = StateManager.state.symmetryCount + delta;
        count = Math.max(2, Math.min(24, count));
        StateManager.setState({ symmetryCount: count });
        const label = document.getElementById('symmetry-count-label');
        if (label) label.textContent = count;
        const slider = document.getElementById('symmetry-count');
        if (slider) slider.value = count;
    },

    _adjustSpeed(delta) {
        let speed = StateManager.state.rotationSpeed + delta;
        speed = Math.max(0, Math.min(100, speed));
        StateManager.setState({ rotationSpeed: speed });
        const slider = document.getElementById('rotation-speed');
        if (slider) slider.value = speed;
        const label = document.getElementById('rotation-speed-label');
        if (label) label.textContent = speed;
    },

    _toggleAutoRotate() {
        const btn = document.getElementById('auto-rotate-toggle');
        if (btn) btn.click();
    },

    _setBrush(type) {
        StateManager.setState({ brushType: type });
        const select = document.getElementById('brush-type');
        if (select) select.value = type;
        this._showToast(`✏️ 画笔：${this._brushName(type)}`);
    },

    _toggleGlow() {
        StateManager.setState({ glowEnabled: !StateManager.state.glowEnabled });
        const btn = document.getElementById('glow-toggle');
        if (btn) btn.classList.toggle('active');
        this._showToast(StateManager.state.glowEnabled ? '✨ 发光：开' : '✨ 发光：关');
    },

    _toggleAnimation() {
        const btn = document.getElementById('animation-toggle');
        if (btn) btn.click();
        const isActive = btn ? btn.classList.contains('active') : false;
        this._showToast(isActive ? '✨ 动画：开' : '✨ 动画：关');
    },

    _brushName(type) {
        const names = { solid: '实线', dashed: '虚线', dotted: '点线', spray: '喷枪' };
        return names[type] || type;
    },

    _showToast(msg) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = msg;
            toast.classList.add('show');
            clearTimeout(toast._hideTimer);
            toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 1200);
        }
    }
};