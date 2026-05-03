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

    // 点赞状态
    likeCount: 0,
    isLiked: false,
    likeHistory: [], // 点赞历史记录

    /**
     * 初始化全屏控制器
     */
    init() {
        this._loadSavedState();
        this._bindEvents();
        this._syncFullscreenControls();
        this._bindActionButtons();
        this._bindPanelEvents();
        this._updateUI();
    },

    /**
     * 加载保存的状态
     */
    _loadSavedState() {
        // 加载点赞状态
        const savedLikes = JSON.parse(localStorage.getItem('kaleidoscope_likes') || '{}');
        this.likeCount = savedLikes.count || 0;
        this.isLiked = savedLikes.isLiked || false;
        this.likeHistory = JSON.parse(localStorage.getItem('kaleidoscope_like_history') || '[]');
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
            // 全屏模式下的快捷键
            if (this.isFullscreen && !e.ctrlKey && !e.metaKey) {
                if (e.key === 'l' || e.key === 'L') {
                    e.preventDefault();
                    this.handleLike();
                } else if (e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    this.handleScreenshot();
                } else if (e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    this.handleFavorite();
                }
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

        // 清除全屏模式下的内联样式，恢复画布居中
        const canvas = document.getElementById('kaleidoscope-canvas');
        if (canvas) {
            canvas.style.transform = '';
            canvas.style.position = '';
            canvas.style.left = '';
            canvas.style.top = '';
            canvas.style.transition = '';
        }

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

        // 随机生成按钮
        const fsRandom = document.getElementById('fs-random-btn');
        if (fsRandom) {
            fsRandom.addEventListener('click', () => {
                RandomGenerator.applyRandom();
            });
        }

        // 重做按钮同步
        const fsRedo = document.getElementById('fs-redo-btn');
        const mainRedo = document.getElementById('redo-btn');
        if (fsRedo && mainRedo) {
            fsRedo.addEventListener('click', () => StateManager.redo());
            const redoObserver = new MutationObserver(() => {
                fsRedo.disabled = mainRedo.disabled;
            });
            redoObserver.observe(mainRedo, { attributes: true, attributeFilter: ['disabled'] });
        }
    },

    /**
     * 绑定操作按钮事件
     */
    _bindActionButtons() {
        // 点赞按钮 - 左键点赞
        const likeBtn = document.getElementById('fs-like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.handleLike());
        }

        // 收藏按钮 - 左键收藏（双击取消）
        const favBtn = document.getElementById('fs-favorite-btn');
        if (favBtn) {
            let clickTimer = null;
            favBtn.addEventListener('click', () => {
                if (clickTimer) {
                    // 双击
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    this.handleFavorite(true);
                } else {
                    // 单击，延迟等待第二次点击
                    clickTimer = setTimeout(() => {
                        clickTimer = null;
                        this.handleFavorite(false);
                    }, 300);
                }
            });
        }

        // 分享按钮
        const shareBtn = document.getElementById('fs-share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.handleShare());
        }

        // 截图按钮
        const screenshotBtn = document.getElementById('fs-screenshot-btn');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => this.handleScreenshot());
        }
    },

    /**
     * 绑定面板事件
     */
    _bindPanelEvents() {
        // 收藏夹面板
        const favOverlay = document.getElementById('favorites-overlay');
        const favClose = document.getElementById('fp-close');
        if (favOverlay) favOverlay.addEventListener('click', () => this.closeFavoritesPanel());
        if (favClose) favClose.addEventListener('click', () => this.closeFavoritesPanel());

        // 侧边栏点赞历史切换
        const likesBtn = document.getElementById('sidebar-likes-btn');
        const likesList = document.getElementById('likes-history-list');
        if (likesBtn && likesList) {
            likesBtn.addEventListener('click', () => {
                const isHidden = likesList.style.display === 'none';
                likesList.style.display = isHidden ? 'block' : 'none';
                likesBtn.textContent = isHidden ? '收起' : '查看记录';
            });
        }

        // 侧边栏收藏切换
        const favBtn = document.getElementById('sidebar-fav-btn');
        const favList = document.getElementById('favorites-history-list');
        if (favBtn && favList) {
            favBtn.addEventListener('click', () => {
                const isHidden = favList.style.display === 'none';
                favList.style.display = isHidden ? 'block' : 'none';
                favBtn.textContent = isHidden ? '收起' : '查看收藏';
                if (isHidden) this._renderFavoritesHistoryInSidebar();
            });
        }
    },

    /**
     * 更新UI状态
     */
    _updateUI() {
        const likeBtn = document.getElementById('fs-like-btn');
        const favBtn = document.getElementById('fs-favorite-btn');
        const favorites = this._getFavorites();

        if (likeBtn) {
            if (this.isLiked) {
                likeBtn.classList.add('liked');
                likeBtn.innerHTML = this.likeCount > 0 ? `❤️ ${this.likeCount}` : '❤️ 已赞';
            } else {
                likeBtn.classList.remove('liked');
                likeBtn.innerHTML = this.likeCount > 0 ? `🤍 ${this.likeCount}` : '❤️ 点赞';
            }
        }

        if (favBtn) {
            if (favorites.length > 0) {
                favBtn.classList.add('favorited');
                favBtn.innerHTML = `⭐ ${favorites.length}`;
            } else {
                favBtn.classList.remove('favorited');
                favBtn.innerHTML = '⭐ 收藏';
            }
        }

        // 更新侧边栏点赞计数
        const sidebarLikes = document.getElementById('sidebar-likes-count');
        if (sidebarLikes) sidebarLikes.textContent = `${this.likeCount} 赞`;

        // 更新侧边栏收藏计数
        const sidebarFav = document.getElementById('sidebar-fav-count');
        if (sidebarFav) sidebarFav.textContent = `${favorites.length} 收藏`;

        // 更新收藏夹计数
        const favCount = document.getElementById('favorites-count');
        if (favCount) favCount.textContent = `${favorites.length} 个收藏`;

        // 更新点赞历史列表
        this._renderLikesHistoryInSidebar();
    },

    /**
     * 点赞功能
     */
    handleLike() {
        const likeBtn = document.getElementById('fs-like-btn');

        if (this.isLiked) {
            // 取消点赞
            this.likeCount = Math.max(0, this.likeCount - 1);
            this.isLiked = false;
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = this.likeCount > 0 ? `🤍 ${this.likeCount}` : '❤️ 点赞';
            this._showToast(`取消点赞，当前 ${this.likeCount} 个赞`);

            // 添加到历史记录（带截图）
            this._addLikeRecord('取消点赞');
        } else {
            // 点赞
            this.likeCount++;
            this.isLiked = true;
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = `❤️ ${this.likeCount}`;
            this._createLikeParticle();
            this._showToast(`✨ 感谢点赞！ +1 (共 ${this.likeCount} 个赞)`);

            // 添加到历史记录（带截图）
            this._addLikeRecord('点赞 +1');
        }

        this._saveLikeState();
        this._updateUI();
    },

    /**
     * 添加点赞记录
     */
    _addLikeRecord(action) {
        const canvas = document.getElementById('kaleidoscope-canvas');
        const dataUrl = canvas ? canvas.toDataURL('image/png') : null;
        const config = this._getCurrentConfig();

        const record = {
            id: Date.now(),
            action: action,
            dataUrl: dataUrl,
            config: config,
            timestamp: new Date().toLocaleString('zh-CN')
        };
        this.likeHistory.unshift(record);
        // 最多保存50条记录
        if (this.likeHistory.length > 50) this.likeHistory.pop();
        localStorage.setItem('kaleidoscope_like_history', JSON.stringify(this.likeHistory));
        this._renderLikesHistoryInSidebar();
    },

    /**
     * 渲染点赞历史到侧边栏
     */
    _renderLikesHistoryInSidebar() {
        const list = document.getElementById('likes-history-list');
        if (!list) return;

        if (this.likeHistory.length === 0) {
            list.innerHTML = '<div class="lh-empty">暂无点赞记录</div>';
            return;
        }

        list.innerHTML = `
            <button class="lh-clear-all lh-action-btn" data-action="clearLikes">🗑 清空全部</button>
            ${this.likeHistory.slice(0, 20).map(record => `
                <div class="lh-item" data-id="${record.id}">
                    ${record.dataUrl ? `<img class="lh-thumb lh-action-btn" data-action="applyLike" data-id="${record.id}" src="${record.dataUrl}" alt="缩略图" title="点击应用此图案">` : ''}
                    <div class="lh-info">
                        <span class="lh-icon">${record.action.includes('取消') ? '💔' : '❤️'}</span>
                        <span class="lh-text">${record.action}</span>
                        <span class="lh-time">${record.timestamp.split(' ')[1] || ''}</span>
                    </div>
                    <button class="lh-delete lh-action-btn" data-action="deleteLike" data-id="${record.id}" title="删除">×</button>
                </div>
            `).join('')}
        `;

        // 绑定事件（事件委托）
        list.querySelectorAll('.lh-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this._handleLikeListAction(e, btn));
        });
    },

    /**
     * 处理点赞列表操作
     */
    _handleLikeListAction(e, btn) {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        switch (action) {
            case 'clearLikes': this.clearAllLikes(); break;
            case 'deleteLike': this.deleteLikeRecord(id); break;
            case 'applyLike': this.applyLikeRecord(id); break;
        }
    },

    /**
     * 删除单条点赞记录
     */
    deleteLikeRecord(id) {
        this.likeHistory = this.likeHistory.filter(r => r.id !== id);
        localStorage.setItem('kaleidoscope_like_history', JSON.stringify(this.likeHistory));
        this._renderLikesHistoryInSidebar();
        this._updateUI();
    },

    /**
     * 清空所有点赞记录
     */
    clearAllLikes() {
        if (confirm('确定要清空所有点赞记录吗？')) {
            this.likeHistory = [];
            localStorage.setItem('kaleidoscope_like_history', JSON.stringify(this.likeHistory));
            this._renderLikesHistoryInSidebar();
            this._updateUI();
            this._showToast('已清空所有点赞记录');
        }
    },

    /**
     * 应用点赞记录中的图案
     */
    applyLikeRecord(id) {
        const record = this.likeHistory.find(r => r.id === id);
        if (record && record.config) {
            if (typeof StateManager !== 'undefined' && StateManager.setState) {
                StateManager.setState(record.config);
            }
            this._showToast('已应用图案配置');
        }
    },

    /**
     * 创建点赞飘心动画
     */
    _createLikeParticle() {
        const particles = ['❤️', '💖', '💗', '💕', '✨', '🎉'];
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'like-particle';
                particle.textContent = particles[Math.floor(Math.random() * particles.length)];
                particle.style.left = `${30 + Math.random() * 40}%`;
                particle.style.top = `${30 + Math.random() * 40}%`;
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 1200);
            }, i * 80);
        }
    },

    /**
     * 渲染收藏历史到侧边栏
     */
    _renderFavoritesHistoryInSidebar() {
        const list = document.getElementById('favorites-history-list');
        if (!list) return;

        const favorites = this._getFavorites();
        if (favorites.length === 0) {
            list.innerHTML = '<div class="lh-empty">暂无收藏记录</div>';
            return;
        }

        list.innerHTML = `
            <button class="lh-clear-all lh-action-btn" data-action="clearFavs">🗑 清空全部</button>
            ${favorites.slice(0, 12).map(fav => `
                <div class="lh-item" data-id="${fav.id}">
                    <img class="lh-thumb lh-action-btn" data-action="loadFav" data-id="${fav.id}" src="${fav.thumbnail || fav.dataUrl}" alt="缩略图" title="点击应用">
                    <div class="lh-info">
                        <span class="lh-icon">⭐</span>
                        <span class="lh-text">${fav.name || '收藏'}</span>
                    </div>
                    <button class="lh-delete lh-action-btn" data-action="deleteFav" data-id="${fav.id}" title="删除">×</button>
                </div>
            `).join('')}
        `;

        // 绑定事件（事件委托）
        list.querySelectorAll('.lh-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this._handleFavListAction(e, btn));
        });
    },

    /**
     * 处理收藏列表操作
     */
    _handleFavListAction(e, btn) {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        switch (action) {
            case 'clearFavs': this.clearAllFavorites(); break;
            case 'deleteFav': this.deleteFavorite(id); break;
            case 'loadFav': this.loadFavorite(id); break;
        }
    },

    /**
     * 收藏功能
     * @param {boolean} isDoubleClick - true: 取消收藏, false: 添加收藏
     */
    handleFavorite(isDoubleClick) {
        const favBtn = document.getElementById('fs-favorite-btn');
        const favorites = this._getFavorites();
        const config = this._getCurrentConfig();

        if (isDoubleClick) {
            // 双击：取消收藏（移除最新的一个）
            if (favorites.length > 0) {
                favorites.pop();
                this._saveFavorites(favorites);
                favBtn.classList.remove('favorited');
                favBtn.innerHTML = favorites.length > 0 ? `⭐ ${favorites.length}` : '⭐ 收藏';
                this._showToast('⭐ 已取消收藏');
            }
        } else {
            // 单击：添加收藏
            const canvas = document.getElementById('kaleidoscope-canvas');
            const dataUrl = canvas.toDataURL('image/png');

            const id = Date.now();
            favorites.push({
                id,
                ...config,
                dataUrl,
                thumbnail: dataUrl,
                timestamp: id,
                name: `收藏 ${favorites.length + 1}`
            });
            this._saveFavorites(favorites);

            favBtn.classList.add('favorited');
            favBtn.innerHTML = `⭐ ${favorites.length}`;
            this._showToast(`⭐ 已收藏！共 ${favorites.length} 个收藏`);
        }
        this._updateUI();
        this._renderFavorites();
    },

    /**
     * 打开收藏夹面板
     */
    openFavoritesPanel() {
        let favOverlay = document.getElementById('favorites-overlay');
        let favPanel = document.getElementById('favorites-panel');
        
        // 如果面板不存在，则动态创建
        if (!favOverlay || !favPanel) {
            favOverlay = document.createElement('div');
            favOverlay.id = 'favorites-overlay';
            favOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:1990;';
            favOverlay.onclick = () => this.closeFavoritesPanel();
            
            favPanel = document.createElement('div');
            favPanel.id = 'favorites-panel';
            favPanel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.9);width:500px;max-width:90vw;max-height:80vh;background:rgba(14,14,32,0.98);border:1px solid rgba(255,215,0,0.3);border-radius:14px;z-index:1991;display:flex;flex-direction:column;box-shadow:0 16px 64px rgba(0,0,0,0.6);opacity:0;pointer-events:none;transition:all 0.35s;';
            
            favPanel.innerHTML = `
                <div class="fp-header" style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(255,215,0,0.15);flex-shrink:0;">
                    <span style="font-size:16px;font-weight:700;color:#ffd700;">⭐ 收藏夹</span>
                    <span id="favorites-count" style="font-size:12px;color:#8899aa;margin-left:auto;">0 个收藏</span>
                    <button id="favorites-clear-btn" style="display:none;padding:4px 10px;font-size:11px;background:rgba(255,69,69,0.1);border:1px solid rgba(255,69,69,0.3);border-radius:4px;color:#ff6b6b;cursor:pointer;">🗑 清空</button>
                    <button id="fp-close" style="background:transparent;border:none;color:#8899aa;font-size:18px;cursor:pointer;padding:2px 6px;">✕</button>
                </div>
                <div id="favorites-list" style="flex:1;overflow-y:auto;padding:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;min-height:200px;">
                    <div style="grid-column:1/-1;text-align:center;color:#8899aa;font-size:13px;padding:40px 20px;line-height:1.6;">暂无收藏<br>在全屏模式下点击 ⭐ 添加收藏</div>
                </div>
            `;
            
            document.body.appendChild(favOverlay);
            document.body.appendChild(favPanel);
            
            // 使用 addEventListener 绑定事件
            const closeBtn = document.getElementById('fp-close');
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeFavoritesPanel());
            
            const clearBtn = document.getElementById('favorites-clear-btn');
            if (clearBtn) clearBtn.addEventListener('click', () => this.clearAllFavorites());
        }
        
        this._renderFavorites();
        favOverlay.classList.add('show');
        favPanel.classList.add('show');
    },

    /**
     * 关闭收藏夹面板
     */
    closeFavoritesPanel() {
        const favOverlay = document.getElementById('favorites-overlay');
        const favPanel = document.getElementById('favorites-panel');
        if (favOverlay) favOverlay.classList.remove('show');
        if (favPanel) favPanel.classList.remove('show');
    },

    /**
     * 渲染收藏列表
     */
    _renderFavorites() {
        const list = document.getElementById('favorites-list');
        const count = document.getElementById('favorites-count');
        const clearBtn = document.getElementById('favorites-clear-btn');
        // 如果收藏面板元素不存在，尝试创建
        if (!list) {
            this._createFavoritesPanel();
            return;
        }

        const favorites = this._getFavorites();
        if (count) count.textContent = `${favorites.length} 个收藏`;
        if (clearBtn) clearBtn.style.display = favorites.length > 0 ? 'inline-block' : 'none';

        if (favorites.length === 0) {
            list.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#8899aa;font-size:13px;padding:40px 20px;line-height:1.6;">暂无收藏<br>在全屏模式下点击 ⭐ 添加收藏</div>';
            return;
        }

        list.innerHTML = favorites.map(fav => `
            <div class="favorite-item" data-id="${fav.id}" style="position:relative;border-radius:8px;overflow:hidden;border:2px solid rgba(255,215,0,0.2);background:rgba(0,0,0,0.3);transition:all 0.25s;cursor:pointer;">
                <img src="${fav.thumbnail || fav.dataUrl}" alt="收藏预览" style="width:100%;aspect-ratio:1;object-fit:cover;display:block;">
                <div style="padding:8px;font-size:11px;color:#8899aa;">${fav.name || '收藏 ' + fav.id}</div>
                <div style="display:flex;gap:4px;padding:6px 8px;background:rgba(0,0,0,0.8);">
                    <button class="fav-load-btn" data-id="${fav.id}" style="flex:1;font-size:10px;padding:4px 6px;border-radius:4px;background:rgba(0,210,255,0.1);border:1px solid rgba(0,210,255,0.3);color:#00d2ff;cursor:pointer;">应用</button>
                    <button class="fav-delete-btn" data-id="${fav.id}" style="flex:1;font-size:10px;padding:4px 6px;border-radius:4px;background:rgba(255,69,69,0.1);border:1px solid rgba(255,69,69,0.3);color:#ff6b6b;cursor:pointer;">删除</button>
                </div>
            </div>
        `).join('');

        // 绑定按钮事件（使用事件委托）
        list.querySelectorAll('.fav-load-btn').forEach(btn => {
            btn.addEventListener('click', () => this.loadFavorite(parseInt(btn.dataset.id)));
        });
        list.querySelectorAll('.fav-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteFavorite(parseInt(btn.dataset.id)));
        });
    },

    /**
     * 创建收藏面板
     */
    _createFavoritesPanel() {
        const existing = document.getElementById('favorites-overlay');
        if (existing) return;
        
        const favOverlay = document.createElement('div');
        favOverlay.id = 'favorites-overlay';
        favOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:1990;';
        favOverlay.addEventListener('click', () => this.closeFavoritesPanel());
        
        const favPanel = document.createElement('div');
        favPanel.id = 'favorites-panel';
        favPanel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.9);width:500px;max-width:90vw;max-height:80vh;background:rgba(14,14,32,0.98);border:1px solid rgba(255,215,0,0.3);border-radius:14px;z-index:1991;display:flex;flex-direction:column;box-shadow:0 16px 64px rgba(0,0,0,0.6);opacity:0;pointer-events:none;transition:all 0.35s;';
        
        favPanel.innerHTML = `
            <div class="fp-header" style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(255,215,0,0.15);flex-shrink:0;">
                <span style="font-size:16px;font-weight:700;color:#ffd700;">⭐ 收藏夹</span>
                <span id="favorites-count" style="font-size:12px;color:#8899aa;margin-left:auto;">0 个收藏</span>
                <button id="favorites-clear-btn" style="display:none;padding:4px 10px;font-size:11px;background:rgba(255,69,69,0.1);border:1px solid rgba(255,69,69,0.3);border-radius:4px;color:#ff6b6b;cursor:pointer;">🗑 清空</button>
                <button id="fp-close" style="background:transparent;border:none;color:#8899aa;font-size:18px;cursor:pointer;padding:2px 6px;">✕</button>
            </div>
            <div id="favorites-list" style="flex:1;overflow-y:auto;padding:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;min-height:200px;">
                <div style="grid-column:1/-1;text-align:center;color:#8899aa;font-size:13px;padding:40px 20px;line-height:1.6;">暂无收藏<br>在全屏模式下点击 ⭐ 添加收藏</div>
            </div>
        `;
        
        document.body.appendChild(favOverlay);
        document.body.appendChild(favPanel);
        
        // 使用 addEventListener 绑定事件
        const closeBtn = document.getElementById('fp-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeFavoritesPanel());
        
        const clearBtn = document.getElementById('favorites-clear-btn');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearAllFavorites());
        
        // 显示面板
        favOverlay.classList.add('show');
        favPanel.classList.add('show');
    },

    /**
     * 加载收藏配置
     */
    loadFavorite(id) {
        const favorites = this._getFavorites();
        const fav = favorites.find(f => f.id === id);
        if (!fav) return;

        // 应用配置
        const config = { ...fav };
        delete config.id;
        delete config.dataUrl;
        delete config.thumbnail;
        delete config.timestamp;
        delete config.name;

        StateManager.setState(config);
        this._showToast('✅ 已应用收藏配置');
        this.closeFavoritesPanel();
    },

    /**
     * 删除收藏
     */
    deleteFavorite(id) {
        let favorites = this._getFavorites();
        favorites = favorites.filter(f => f.id !== id);
        this._saveFavorites(favorites);
        this._showToast('🗑 已删除收藏');
        this._updateUI();
        this._renderFavorites();
        this._renderFavoritesHistoryInSidebar();
    },

    /**
     * 清空所有收藏
     */
    clearAllFavorites() {
        if (!confirm('确定要清空所有收藏吗？此操作不可撤销。')) return;
        this._saveFavorites([]);
        this._showToast('🗑 已清空所有收藏');
        this._updateUI();
        this._renderFavorites();
        this._renderFavoritesHistoryInSidebar();
    },

    /**
     * 将 Data URL 转换为 Blob
     */
    _dataURLtoBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    },

    /**
     * 分享功能
     */
    async handleShare() {
        try {
            const canvas = document.getElementById('kaleidoscope-canvas');
            const dataUrl = canvas.toDataURL('image/png');

            // 创建分享链接（使用 base64 数据）
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(dataUrl)}`;

            // 复制到剪贴板
            try {
                await navigator.clipboard.writeText(shareUrl);
                this._showToast('🔗 分享链接已复制到剪贴板！');
            } catch {
                // 剪贴板不可用，下载图片
            }

            // 下载图片
            const link = document.createElement('a');
            link.download = `万花筒_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

            // 尝试 Web Share API
            if (navigator.share) {
                try {
                    const blob = this._dataURLtoBlob(dataUrl);
                    const file = new File([blob], 'kaleidoscope.png', { type: 'image/png' });

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: '我的万花筒作品',
                            text: '快来看看我的创意万花筒作品！✨',
                            files: [file]
                        });
                    }
                } catch (e) {
                    // Web Share API 不可用或用户取消，不提示
                }
            }

            // 显示分享面板
            this._showSharePanel(shareUrl, dataUrl);
        } catch (err) {
            console.warn('分享失败:', err);
            this._showToast('⚠️ 分享失败，请重试');
        }
    },

    /**
     * 显示分享面板
     */
    _showSharePanel(shareUrl, dataUrl) {
        // 移除旧面板
        const oldPanel = document.getElementById('share-temp-panel');
        if (oldPanel) oldPanel.remove();
        const oldOverlay = document.getElementById('share-overlay-temp');
        if (oldOverlay) oldOverlay.remove();

        // 创建分享面板
        const panel = document.createElement('div');
        panel.id = 'share-temp-panel';
        panel.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(14, 14, 32, 0.98); border: 1px solid rgba(0, 210, 255, 0.3);
            border-radius: 14px; padding: 20px; width: 380px; max-width: 90vw; z-index: 10000;
            box-shadow: 0 16px 64px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 12px;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 15px; font-weight: 700; color: #00d2ff;">📤 分享作品</span>
                <button id="share-close-btn" style="background: transparent; border: none; color: #8899aa; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            <img src="${dataUrl}" style="width: 100%; border-radius: 8px; aspect-ratio: 1; object-fit: cover;">
            <div class="share-link-container" style="margin: 0;">
                <input type="text" value="${shareUrl.substring(0, 60)}..." readonly id="share-url-input">
                <button id="copy-url-btn">复制</button>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="share-cancel-btn" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e8ecf1; cursor: pointer;">关闭</button>
            </div>
        `;

        // 添加遮罩
        const overlay = document.createElement('div');
        overlay.id = 'share-overlay-temp';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999;';

        // 绑定事件
        const closePanel = () => { panel.remove(); overlay.remove(); };
        panel.querySelector('#share-close-btn').addEventListener('click', closePanel);
        panel.querySelector('#share-cancel-btn').addEventListener('click', closePanel);
        overlay.addEventListener('click', closePanel);

        panel.querySelector('#copy-url-btn').addEventListener('click', function() {
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.textContent = '已复制!';
                this.classList.add('copied');
                setTimeout(() => {
                    this.textContent = '复制';
                    this.classList.remove('copied');
                }, 2000);
            });
        });

        document.body.appendChild(overlay);
        document.body.appendChild(panel);
    },

    /**
     * 截图功能
     */
    handleScreenshot() {
        const canvas = document.getElementById('kaleidoscope-canvas');
        const dataUrl = canvas.toDataURL('image/png');

        // 保存到画廊
        const gallery = JSON.parse(localStorage.getItem('kaleidoscope_gallery') || '[]');
        gallery.unshift({ id: Date.now(), dataUrl, timestamp: Date.now() });
        // 最多保存20张
        if (gallery.length > 20) gallery.pop();
        localStorage.setItem('kaleidoscope_gallery', JSON.stringify(gallery));

        // 触发画廊更新
        window.dispatchEvent(new CustomEvent('gallery-updated'));

        this._showToast('📷 截图已保存到画廊！');
    },

    /**
     * 获取当前配置
     */
    _getCurrentConfig() {
        const state = StateManager.state;
        return {
            strokeColor: state.strokeColor,
            strokeWidth: state.strokeWidth,
            symmetryCount: state.symmetryCount,
            symmetryMode: state.symmetryMode,
            bgColor: state.bgColor,
            glowEnabled: state.glowEnabled,
            glowColor: state.glowColor,
            glowBlur: state.glowBlur,
            rainbowMode: state.rainbowMode,
            gradientMode: state.gradientMode,
            gradientFrom: state.gradientFrom,
            gradientTo: state.gradientTo,
            blendMode: state.blendMode,
            brushType: state.brushType,
            trailsEnabled: state.trailsEnabled,
            trailsOpacity: state.trailsOpacity
        };
    },

    /**
     * 获取收藏列表
     */
    _getFavorites() {
        return JSON.parse(localStorage.getItem('kaleidoscope_favorites') || '[]');
    },

    /**
     * 保存收藏列表
     */
    _saveFavorites(favorites) {
        try {
            localStorage.setItem('kaleidoscope_favorites', JSON.stringify(favorites));
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                this._showToast('⚠️ 收藏已满，请删除一些旧收藏后再试');
                console.warn('[FullscreenController] localStorage quota exceeded');
            } else {
                throw e;
            }
        }
    },

    /**
     * 保存点赞状态
     */
    _saveLikeState() {
        try {
            localStorage.setItem('kaleidoscope_likes', JSON.stringify({
                count: this.likeCount,
                isLiked: this.isLiked
            }));
        } catch (e) {
            if (e.name !== 'QuotaExceededError' && e.code !== 22) {
                throw e;
            }
        }
    },

    /**
     * 显示 Toast 提示
     */
    _showToast(message, duration = 2500) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), duration);
        }
    }
};

// 暴露到全局，供 inline onclick 使用
window.FullscreenController = FullscreenController;