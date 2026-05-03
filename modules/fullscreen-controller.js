/**
 * 全屏控制模块
 * 管理画布全屏模式：进入/退出、拖动平移（含惯性滑动+弹性边界）、全屏工具栏同步
 * V2.0 新增：惯性滑动效果、弹性边界回弹、阻力系统
 */
const FullscreenController = {
    isFullscreen: false,
    canvasX: 0,          // 拖拽平移偏移量 X
    canvasY: 0,          // 拖拽平移偏移量 Y
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragCanvasStartX: 0,
    dragCanvasStartY: 0,
    dragPrevTime: 0,     // 上一帧时间戳（用于计算速度）
    dragPrevX: 0,         // 上一帧位置 X
    dragPrevY: 0,         // 上一帧位置 Y

    // 惯性系统
    velocityX: 0,         // X 方向速度 (px/ms)
    velocityY: 0,         // Y 方向速度 (px/ms)
    inertiaAnimId: null,  // 惯性动画帧 ID
    friction: 0.92,       // 摩擦系数（每帧衰减）
    minVelocity: 0.1,     // 最小速度阈值（低于此值停止惯性动画）

    cachedCanvasSize: 0, // 进入全屏时的画布尺寸快照

    /**
     * 初始化全屏控制器
     */
    init() {
        this._bindEvents();
        this._syncFullscreenControls();
    },

    /**
     * 绑定所有全屏相关事件
     */
    _bindEvents() {
        const fsBtn = document.getElementById('fullscreen-toggle');
        const exitBtn = document.getElementById('fs-exit-btn');
        const canvas = document.getElementById('kaleidoscope-canvas');

        // 进入全屏
        if (fsBtn) {
            fsBtn.addEventListener('click', () => this.enterFullscreen());
        }

        // 退出全屏
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exitFullscreen());
        }

        // 快捷键 F 切换全屏
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    if (this.isFullscreen) {
                        this.exitFullscreen();
                    } else {
                        this.enterFullscreen();
                    }
                }
            }
            // Esc 退出全屏
            if (e.key === 'Escape' && this.isFullscreen) {
                this.exitFullscreen();
            }
        });

        // === 画布拖拽平移（全屏模式下） ===
        if (canvas) {
            // 鼠标拖拽
            canvas.addEventListener('mousedown', (e) => this._startDrag(e.clientX, e.clientY));
            document.addEventListener('mousemove', (e) => this._onDrag(e.clientX, e.clientY));
            document.addEventListener('mouseup', () => this._endDrag());

            // 触屏拖拽
            canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    this._startDrag(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });
            document.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1 && this.isDragging) {
                    this._onDrag(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });
            document.addEventListener('touchend', () => this._endDrag());
        }

        // 窗口变化时重新计算全屏画布位置
        window.addEventListener('resize', () => {
            if (this.isFullscreen) {
                this._updateCanvasPosition();
            }
        });
    },

    /**
     * 计算弹性边界偏移量（带阻力渐增）
     * @param {number} offset - 原始偏移
     * @param {number} maxOffset - 最大允许偏移（硬边界）
     * @returns {number} 经过弹性阻尼后的偏移
     */
    _elasticBound(offset, maxOffset) {
        const abs = Math.abs(offset);
        if (abs <= maxOffset) return offset;
        // 超出部分施加平方阻力：越界 1 -> 0.5, 越界 2 -> 0.25 ...
        const over = abs - maxOffset;
        const damped = maxOffset + over / (1 + over * 0.08);
        return Math.sign(offset) * damped;
    },

    /**
     * 获取边界最大值
     */
    _getMaxOffset() {
        const canvas = document.getElementById('kaleidoscope-canvas');
        if (!canvas) return 100;
        const canvasSize = canvas.width || StateManager.state.canvasWidth;
        return Math.max(canvasSize * 0.3, 100);
    },

    /**
     * 进入全屏模式
     */
    enterFullscreen() {
        if (this.isFullscreen) return;

        // 停止任何正在进行的惯性动画
        this._stopInertia();

        // 保存当前画布尺寸快照
        this.cachedCanvasSize = StateManager.state.canvasWidth;

        this.isFullscreen = true;
        this.canvasX = 0;
        this.canvasY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        document.body.classList.add('fullscreen-mode');

        // 调整画布尺寸适应全屏
        this._resizeCanvasForFullscreen();

        // 更新按钮状态
        const fsBtn = document.getElementById('fullscreen-toggle');
        if (fsBtn) {
            fsBtn.textContent = '⛶ 退出全屏';
            fsBtn.classList.add('active');
        }

        // 显示 Toast 提示
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = '⛶ 全屏模式 — 拖动画布平移（惯性滑动），按 F 或 Esc 退出';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }
    },

    /**
     * 退出全屏模式
     */
    exitFullscreen() {
        if (!this.isFullscreen) return;

        // 停止惯性动画
        this._stopInertia();

        this.isFullscreen = false;
        this.canvasX = 0;
        this.canvasY = 0;
        this.isDragging = false;
        this.velocityX = 0;
        this.velocityY = 0;
        document.body.classList.remove('fullscreen-mode');

        // 恢复画布到正常尺寸
        CanvasRenderer.resize();

        // 更新按钮状态
        const fsBtn = document.getElementById('fullscreen-toggle');
        if (fsBtn) {
            fsBtn.textContent = '⛶ 全屏';
            fsBtn.classList.remove('active');
        }
    },

    /**
     * 全屏模式下调整画布尺寸
     * 画布保持正方形，缩放至适应屏幕，居中显示
     */
    _resizeCanvasForFullscreen() {
        const canvas = document.getElementById('kaleidoscope-canvas');
        if (!canvas) return;

        const ww = window.innerWidth;
        const wh = window.innerHeight;

        // 保持正方形，取宽高的较小值
        const size = Math.min(ww, wh);

        canvas.width = size;
        canvas.height = size;

        // 同步离屏画布
        CanvasRenderer.offscreenCanvas.width = size;
        CanvasRenderer.offscreenCanvas.height = size;

        StateManager.setState({
            canvasWidth: size,
            canvasHeight: size
        });
        CanvasRenderer.needRedrawOffscreen = true;

        // 重置偏移
        this.canvasX = 0;
        this.canvasY = 0;
        this._updateCanvasPosition();
    },

    /**
     * 更新画布CSS位置（居中对齐 + 拖拽偏移 + 弹性边界）
     */
    _updateCanvasPosition() {
        const canvas = document.getElementById('kaleidoscope-canvas');
        if (!canvas) return;

        const maxOffset = this._getMaxOffset();
        const ex = this._elasticBound(this.canvasX, maxOffset);
        const ey = this._elasticBound(this.canvasY, maxOffset);

        canvas.style.transform = `translate(calc(-50% + ${ex}px), calc(-50% + ${ey}px))`;
    },

    /**
     * 获取当前弹性边界下的实际偏移（用于更新内部值）
     */
    _applyElasticBound() {
        const maxOffset = this._getMaxOffset();

        // 如果超出弹性边界，拉回一些（弹性回弹准备）
        const absX = Math.abs(this.canvasX);
        const absY = Math.abs(this.canvasY);

        if (absX > maxOffset) {
            this.velocityX *= 0.5; // 碰撞到弹性边界时速度减半
        }
        if (absY > maxOffset) {
            this.velocityY *= 0.5;
        }
    },

    // ==================== 惯性滑动系统 ====================

    /**
     * 停止惯性动画
     */
    _stopInertia() {
        if (this.inertiaAnimId !== null) {
            cancelAnimationFrame(this.inertiaAnimId);
            this.inertiaAnimId = null;
        }
        this.velocityX = 0;
        this.velocityY = 0;
    },

    /**
     * 启动惯性滑动
     */
    _startInertia() {
        this._stopInertia();

        // 如果速度太小，不启动惯性
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed < this.minVelocity) return;

        this._inertiaStep();
    },

    /**
     * 惯性动画帧
     */
    _inertiaStep() {
        // 衰减速度
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        // 应用速度（带弹性边界影响）
        this.canvasX += this.velocityX;
        this.canvasY += this.velocityY;

        // 弹性边界回弹力（将内部值向边界内拉）
        const maxOffset = this._getMaxOffset();
        const absX = Math.abs(this.canvasX);
        const absY = Math.abs(this.canvasY);

        if (absX > maxOffset) {
            // 弹性回弹力：超出越多，回弹力越大
            const reboundX = (absX - maxOffset) * 0.15;
            this.canvasX -= Math.sign(this.canvasX) * reboundX;
            this.velocityX *= 0.85;
        }
        if (absY > maxOffset) {
            const reboundY = (absY - maxOffset) * 0.15;
            this.canvasY -= Math.sign(this.canvasY) * reboundY;
            this.velocityY *= 0.85;
        }

        this._updateCanvasPosition();

        // 检查是否继续
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > this.minVelocity) {
            this.inertiaAnimId = requestAnimationFrame(() => this._inertiaStep());
        } else {
            this.velocityX = 0;
            this.velocityY = 0;
            this._snapToBound(); // 最终归位
            this.inertiaAnimId = null;
        }
    },

    /**
     * 恢复到边界内（如果还在弹性区外）
     */
    _snapToBound() {
        const maxOffset = this._getMaxOffset();
        const absX = Math.abs(this.canvasX);
        const absY = Math.abs(this.canvasY);
        let needsUpdate = false;

        if (absX > maxOffset) {
            this.canvasX = Math.sign(this.canvasX) * maxOffset;
            needsUpdate = true;
        }
        if (absY > maxOffset) {
            this.canvasY = Math.sign(this.canvasY) * maxOffset;
            needsUpdate = true;
        }

        if (needsUpdate) {
            this._updateCanvasPosition();
        }
    },

    // ==================== 拖拽事件 ====================

    /**
     * 开始拖拽
     */
    _startDrag(clientX, clientY) {
        if (!this.isFullscreen) return;

        // 停止惯性动画
        this._stopInertia();

        this.isDragging = true;
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.dragCanvasStartX = this.canvasX;
        this.dragCanvasStartY = this.canvasY;
        this.dragPrevX = clientX;
        this.dragPrevY = clientY;
        this.dragPrevTime = performance.now();

        const canvas = document.getElementById('kaleidoscope-canvas');
        if (canvas) canvas.classList.add('dragging');
    },

    /**
     * 拖拽进行中（带边界限制 + 速度计算）
     */
    _onDrag(clientX, clientY) {
        if (!this.isDragging || !this.isFullscreen) return;

        const canvas = document.getElementById('kaleidoscope-canvas');
        if (!canvas) return;

        const now = performance.now();

        // 计算当前帧速度 (px/ms)
        const dt = Math.max(now - this.dragPrevTime, 1);
        this.velocityX = (clientX - this.dragPrevX) / dt * 16.67; // 归一化到约 60fps
        this.velocityY = (clientY - this.dragPrevY) / dt * 16.67;

        // 限速防止溢出
        const maxVelocity = 80;
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > maxVelocity) {
            const scale = maxVelocity / speed;
            this.velocityX *= scale;
            this.velocityY *= scale;
        }

        // 更新前一帧数据
        this.dragPrevX = clientX;
        this.dragPrevY = clientY;
        this.dragPrevTime = now;

        // 计算偏移（应用弹性边界）
        const dx = clientX - this.dragStartX;
        const dy = clientY - this.dragStartY;

        this.canvasX = this.dragCanvasStartX + dx;
        this.canvasY = this.dragCanvasStartY + dy;

        this._updateCanvasPosition();
    },

    /**
     * 结束拖拽 → 启动惯性滑动
     */
    _endDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;

        const canvas = document.getElementById('kaleidoscope-canvas');
        if (canvas) canvas.classList.remove('dragging');

        // 启动惯性滑动
        this._applyElasticBound();
        this._startInertia();
    },

    /**
     * 同步全屏工具栏控件与主工具栏
     */
    _syncFullscreenControls() {
        // 颜色同步
        const fsColor = document.getElementById('fs-stroke-color');
        const mainColor = document.getElementById('stroke-color');
        if (fsColor && mainColor) {
            // 主工具栏 -> 全屏
            mainColor.addEventListener('input', () => {
                fsColor.value = mainColor.value;
            });
            // 全屏 -> 主工具栏
            fsColor.addEventListener('input', () => {
                mainColor.value = fsColor.value;
                StateManager.setState({ strokeColor: fsColor.value });
            });
        }

        // 宽度同步
        const fsWidth = document.getElementById('fs-stroke-width');
        const mainWidth = document.getElementById('stroke-width');
        if (fsWidth && mainWidth) {
            mainWidth.addEventListener('input', () => {
                fsWidth.value = mainWidth.value;
            });
            fsWidth.addEventListener('input', () => {
                mainWidth.value = fsWidth.value;
                StateManager.setState({ strokeWidth: parseInt(fsWidth.value) });
            });
        }

        // 撤销按钮
        const fsUndo = document.getElementById('fs-undo-btn');
        const mainUndo = document.getElementById('undo-btn');
        if (fsUndo && mainUndo) {
            fsUndo.addEventListener('click', () => StateManager.undo());
            // 监听撤销按钮状态变化
            const observer = new MutationObserver(() => {
                fsUndo.disabled = mainUndo.disabled;
            });
            observer.observe(mainUndo, { attributes: true, attributeFilter: ['disabled'] });
        }

        // 清空按钮
        const fsClear = document.getElementById('fs-clear-btn');
        if (fsClear) {
            fsClear.addEventListener('click', () => {
                if (StateManager.state.strokes.length === 0) return;
                StateManager.clearStrokes();
                ParticleSystem.clear();
            });
        }
    }
};