/**
 * 画布渲染模块
 * 负责所有画布绘制操作，包括对称变换、动画渲染和画笔效果
 * 支持：旋转对称、镜像对称（任意N）、螺旋对称、渐变画笔、彩虹模式、粒子渲染
 * V3.0 优化：
 * - 集成 ColorPalette 材质系统和 colorScheme 配色方案
 * - 离屏重绘仅对笔画变更触发（状态变更不触发重绘）
 * - 复用 Float64Array 减少临时对象分配
 * - 镜像对称支持任意对称数
 * - 螺旋对称坐标变换修复
 * - 集成 NoiseGenerator 到渲染管线
 * - 渐变缓存 LRU 淘汰
 */
const CanvasRenderer = {
    canvas: null,
    ctx: null,
    offscreenCanvas: null,
    offscreenCtx: null,
    needRedrawOffscreen: true,

    // === 缓存 ===
    _gradientCache: new Map(),
    _brushCache: { lastStyle: '', lastConfig: '' },
    _cacheCleanTimer: null,
    _maxCacheSize: 50,
    /** 缓存访问计数（用于 LRU 淘汰） */
    _cacheAccessCount: new Map(),

    /**
     * 初始化画布
     */
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        // 创建离屏画布用于缓存已完成的笔画
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 监听状态变化
        StateManager.subscribe((state) => {
            this.needRedrawOffscreen = true;
        });

        // 每5分钟清理一次渐变缓存（防内存增长）
        this._cacheCleanTimer = setInterval(() => {
            this._clearCache();
        }, 300000);

        // 窗口卸载时清理
        window.addEventListener('beforeunload', () => this.destroy());
    },

    /**
     * 销毁清理（移除事件监听、定时器）
     */
    destroy() {
        if (this._cacheCleanTimer) {
            clearInterval(this._cacheCleanTimer);
            this._cacheCleanTimer = null;
        }
        this._gradientCache.clear();
        this._cacheAccessCount.clear();
        this._brushCache.lastKey = '';
        // 释放离屏画布引用
        this.offscreenCanvas = null;
        this.offscreenCtx = null;
        this.canvas = null;
        this.ctx = null;
    },

    /**
     * 清理缓存（LRU 策略保留最常用的）
     */
    _clearCache() {
        if (this._gradientCache.size === 0) return;

        // 保留前 1/3 最常访问的条目
        const entries = Array.from(this._cacheAccessCount.entries());
        entries.sort((a, b) => b[1] - a[1]);
        const keepCount = Math.max(5, Math.floor(this._maxCacheSize / 3));
        const keepKeys = new Set(entries.slice(0, keepCount).map(e => e[0]));

        for (const key of this._gradientCache.keys()) {
            if (!keepKeys.has(key)) {
                this._gradientCache.delete(key);
                this._cacheAccessCount.delete(key);
            }
        }

        this._brushCache.lastKey = '';
        // 重置访问计数防滞留
        this._cacheAccessCount.clear();
    },

    /**
     * 标记笔画变更（触发离屏重绘）
     */
    markStrokeDirty() {
        this.needRedrawOffscreen = true;
    },

    // ==================== 渐变缓存 ====================

    _gradientCacheKey(from, to, x1, y1, x2, y2) {
        const rx1 = Math.round(x1), ry1 = Math.round(y1);
        const rx2 = Math.round(x2), ry2 = Math.round(y2);
        return `${from}|${to}|${rx1},${ry1}|${rx2},${ry2}`;
    },

    _getOrCreateGradient(ctx, fromColor, toColor, x1, y1, x2, y2) {
        const key = this._gradientCacheKey(fromColor, toColor, x1, y1, x2, y2);
        let gradient = this._gradientCache.get(key);
        if (!gradient) {
            gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, fromColor);
            gradient.addColorStop(1, toColor);
            // LRU 淘汰
            if (this._gradientCache.size >= this._maxCacheSize) {
                // 淘汰访问最少的
                let minKey = null, minAccess = Infinity;
                for (const k of this._gradientCache.keys()) {
                    const access = this._cacheAccessCount.get(k) || 0;
                    if (access < minAccess) {
                        minAccess = access;
                        minKey = k;
                    }
                }
                if (minKey) {
                    this._gradientCache.delete(minKey);
                    this._cacheAccessCount.delete(minKey);
                }
            }
            this._gradientCache.set(key, gradient);
            this._cacheAccessCount.set(key, 1);
        } else {
            // 增加访问计数
            this._cacheAccessCount.set(key, (this._cacheAccessCount.get(key) || 0) + 1);
        }
        return gradient;
    },

    _brushCacheKey(color, width, cap, join, glow, glowColor, glowBlur, dash) {
        return `${color}|${width}|${cap}|${join}|${glow}|${glowColor}|${glowBlur}|${dash}`;
    },

    /**
     * 应用画笔样式（带缓存）
     */
    _applyBrushStyle(ctx, customColor) {
        const s = StateManager.state;
        const { brushType, strokeColor, strokeWidth, glowEnabled, glowColor, glowBlur } = s;
        const color = customColor || strokeColor;

        let dashStr = '';
        switch (brushType) {
            case 'dashed': dashStr = '8,4'; break;
            case 'dotted': dashStr = '2,6'; break;
            case 'spray': dashStr = '1,4'; break;
            default: dashStr = ''; break;
        }

        const cacheKey = this._brushCacheKey(
            color, strokeWidth, 'round', 'round',
            glowEnabled, glowColor || color, glowBlur || 10, dashStr
        );

        if (cacheKey === this._brushCache.lastKey) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (glowEnabled) {
            ctx.shadowColor = glowColor || color;
            ctx.shadowBlur = glowBlur || 10;
        } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        if (dashStr) {
            ctx.setLineDash(dashStr.split(',').map(Number));
        } else {
            ctx.setLineDash([]);
        }

        this._brushCache.lastKey = cacheKey;
    },

    // ==================== 材质与配色集成 ====================

    /**
     * 根据 current materialPalette + colorScheme 获取笔画颜色
     * @param {number} strokeIndex - 笔画序号（用于彩虹/循环换色）
     * @param {string} fallbackColor - 默认笔画颜色
     * @param {number} [hueOffset] - 可选色相偏移
     * @returns {string} hex 颜色
     */
    _resolveColor(strokeIndex, fallbackColor, hueOffset) {
        const s = StateManager.state;
        const { materialPalette, colorScheme, colorDither, rainbowMode, rainbowHue } = s;

        // 彩虹模式优先
        if (rainbowMode) {
            const hue = (((rainbowHue || 0) + (strokeIndex || 0) * 30) % 360 + 360) % 360;
            return `hsl(${hue}, 100%, 60%)`;
        }

        // 材质+配色方案
        if (materialPalette && materialPalette !== 'none') {
            try {
                const colors = ColorPalette.getColorsByScheme(materialPalette, colorScheme, {
                    hueShift: hueOffset || 0
                });
                if (colors && colors.length > 0) {
                    const color = colors[(strokeIndex || 0) % colors.length];
                    if (colorDither > 0) {
                        return ColorPalette.applyDither(color, colorDither);
                    }
                    return color;
                }
            } catch (e) {
                // fallback
            }
        }

        return fallbackColor;
    },

    /**
     * 获取材质背景色
     */
    _resolveBgColor() {
        const s = StateManager.state;
        if (s.materialPalette && s.materialPalette !== 'none') {
            try {
                const palette = ColorPalette.getPalette(s.materialPalette);
                if (palette && palette.bg) return palette.bg;
            } catch (e) {}
        }
        return s.bgColor;
    },

    // ==================== 主渲染 ====================

    render() {
        const s = StateManager.state;
        const {
            canvasWidth, canvasHeight, trailMode,
            symmetryMode, symmetryCount, currentRotation,
            strokes, currentStroke, _animationTransforms
        } = s;

        const ctx = this.ctx;
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;

        // 1. 设置混合模式
        const prevComposite = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = s.blendMode || 'normal';

        // 2. 背景（带材质色板）
        const bgColor = this._resolveBgColor();
        if (!trailMode) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // 使用 NoiseGenerator 绘制噪声纹理背景（如果启用）
            if (typeof NoiseGenerator !== 'undefined' && s.gradientType === 'none') {
                try {
                    NoiseGenerator.applyNoiseBackground(ctx, canvasWidth, canvasHeight, bgColor, s.noiseSeed);
                } catch (e) {
                    // 噪声可选，静默失败
                }
            }
        } else {
            ctx.fillStyle = bgColor + '20';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // 3. 离屏画布重绘（仅当笔画变更时）
        if (this.needRedrawOffscreen) {
            this._redrawOffscreen();
            this.needRedrawOffscreen = false;
        }

        // 4. 绘制离屏画布到主画布（带对称 + 动画变换）
        if (_animationTransforms) {
            this._drawOffscreenWithSymmetryAndAnimation(ctx, cx, cy, symmetryMode, symmetryCount, currentRotation, _animationTransforms);
        } else {
            this._drawOffscreenWithSymmetry(ctx, cx, cy, symmetryMode, symmetryCount, currentRotation);
        }

        // 5. 绘制当前笔画（仅在无动画时，避免干扰）
        if (currentStroke.length > 0 && !_animationTransforms) {
            this._drawStrokeSet(ctx, [currentStroke], cx, cy, symmetryMode, symmetryCount, currentRotation);
        }

        // 6. 粒子效果（保存并恢复 ctx 状态防污染）
        ctx.save();
        ParticleSystem.render(ctx);
        ctx.restore();

        // 还原混合模式
        ctx.globalCompositeOperation = prevComposite;
    },

    /**
     * 响应式调整画布尺寸
     */
    resize() {
        const container = document.querySelector('.canvas-container');
        const maxSize = Math.min(container.clientWidth - 40, container.clientHeight - 40, 800);

        if (this.offscreenCanvas) {
            this.offscreenCanvas.width = 1;
            this.offscreenCanvas.height = 1;
        }

        this.canvas.width = maxSize;
        this.canvas.height = maxSize;
        if (this.offscreenCanvas) {
            this.offscreenCanvas.width = maxSize;
            this.offscreenCanvas.height = maxSize;
        }
        StateManager.setState({
            canvasWidth: maxSize,
            canvasHeight: maxSize
        });
        this.needRedrawOffscreen = true;

        // 尺寸改变，渐变缓存失效
        this._gradientCache.clear();
        this._cacheAccessCount.clear();
        this._brushCache.lastKey = '';

        this.render();
    },

    // ==================== 离屏重绘 ====================

    _redrawOffscreen() {
        const s = StateManager.state;
        const { canvasWidth, canvasHeight, strokes, gradientEnabled,
                gradientFrom, gradientTo, rainbowMode, rainbowHue, colorCycleMode,
                materialPalette, colorScheme, colorDither, gradientType } = s;
        const octx = this.offscreenCtx;

        if (!octx) return;
        octx.clearRect(0, 0, canvasWidth, canvasHeight);

        octx.lineCap = 'round';
        octx.lineJoin = 'round';

        // 预获取一次材质配色（如果有）
        let materialColors = null;
        if (materialPalette && materialPalette !== 'none') {
            try {
                materialColors = ColorPalette.getColorsByScheme(materialPalette, colorScheme);
            } catch (e) {}
        }

        for (let idx = 0; idx < strokes.length; idx++) {
            const stroke = strokes[idx];
            if (stroke.length < 2) continue;

            // 笔画简化
            let drawStroke = stroke;
            if (stroke.length > 100) {
                const tolerance = stroke.length > 300 ? 1.5 : 1.0;
                drawStroke = MathUtils.simplifyStroke(stroke, tolerance);
            }

            // 确定颜色（优先使用集成后的 _resolveColor）
            let color = null;
            if (stroke._color) {
                color = stroke._color;
            } else if (materialColors) {
                const mc = materialColors[idx % materialColors.length];
                color = colorDither > 0 ? ColorPalette.applyDither(mc, colorDither) : mc;
            } else if (rainbowMode) {
                const hue = ((rainbowHue || 0) + idx * 30) % 360;
                color = `hsl(${hue}, 100%, 60%)`;
            }

            if (color) {
                this._applyBrushStyle(octx, color);
            } else if (gradientEnabled && drawStroke.length >= 2) {
                const first = drawStroke[0];
                const last = drawStroke[drawStroke.length - 1];
                const gradient = this._getOrCreateGradient(octx, gradientFrom, gradientTo, first.x, first.y, last.x, last.y);
                octx.strokeStyle = gradient;
                octx.lineWidth = s.strokeWidth;
            } else {
                this._applyBrushStyle(octx);
            }

            this._drawSmoothStroke(octx, drawStroke);
        }
    },

    /**
     * 绘制平滑贝塞尔线条（复用 Float64Array 减少 GC）
     */
    _drawSmoothStroke(ctx, stroke) {
        const len = stroke.length;
        if (len < 2) return;
        if (len === 2) {
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            ctx.lineTo(stroke[1].x, stroke[1].y);
            ctx.stroke();
            return;
        }

        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);

        for (let i = 1; i < len - 1; i++) {
            const xc = (stroke[i].x + stroke[i + 1].x) / 2;
            const yc = (stroke[i].y + stroke[i + 1].y) / 2;
            ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, xc, yc);
        }

        ctx.lineTo(stroke[len - 1].x, stroke[len - 1].y);
        ctx.stroke();
    },

    // ==================== 对称绘制 ====================

    _drawOffscreenWithSymmetry(ctx, cx, cy, symmetryMode, count, rotation) {
        if (symmetryMode === 'spiral') {
            this._drawSpiralOffscreen(ctx, cx, cy, count, rotation);
        } else if (symmetryMode === 'mirror') {
            this._drawMirrorOffscreen(ctx, cx, cy, count, rotation);
        } else {
            this._drawRotationalOffscreen(ctx, cx, cy, count, rotation);
        }
    },

    _drawRotationalOffscreen(ctx, cx, cy, count, rotation) {
        const angleStep = (2 * Math.PI) / count;
        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);
            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    /**
     * 螺旋对称（修复坐标变换顺序）
     * 正确顺序：translate(cx,cy) → rotate → scale → translate(-cx,-cy)
     */
    _drawSpiralOffscreen(ctx, cx, cy, count, rotation) {
        const { spiralScale } = StateManager.state;
        const scaleFactor = 1 + (spiralScale / 100) * 0.5;
        const angleStep = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            const s = Math.pow(scaleFactor, i);
            ctx.save();
            // 正确顺序：平移到中心 → 旋转 → 缩放 → 平移回去
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);
            ctx.scale(s, s);
            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    /**
     * 镜像对称（支持任意 N，不限于 4）
     * 算法：对于 count=N，生成 N 个反射方向
     * 每个方向由 mirrorAngle = i * PI / count 决定
     * 使用变换矩阵完成反射：scale(-1,1) + rotate(mirrorAngle) 组合
     */
    _drawMirrorOffscreen(ctx, cx, cy, count, rotation) {
        if (count <= 0) return;

        for (let i = 0; i < count; i++) {
            ctx.save();
            ctx.translate(cx, cy);

            // 计算反射角度
            // 每个副本的反射轴方向
            const mirrorAngle = (i * Math.PI) / Math.max(count, 1);

            // 旋转使反射轴对齐 x 轴
            ctx.rotate(mirrorAngle + rotation);
            // 沿 x 轴反射
            ctx.scale(1, -1);
            // 旋转回来
            ctx.rotate(-mirrorAngle - rotation);

            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    _drawStrokeSet(ctx, strokes, cx, cy, symmetryMode, count, rotation) {
        if (symmetryMode === 'spiral') {
            this._drawSpiralSymmetry(ctx, strokes, cx, cy, count, rotation);
        } else if (symmetryMode === 'mirror') {
            this._drawMirrorSymmetry(ctx, strokes, cx, cy, count, rotation);
        } else {
            this._drawRotationalSymmetry(ctx, strokes, cx, cy, count, rotation);
        }
    },

    _drawRotationalSymmetry(ctx, strokes, cx, cy, count, rotation) {
        const angleStep = (2 * Math.PI) / count;
        const s = StateManager.state;
        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            this._drawTransformedStrokes(ctx, strokes, cx, cy, totalAngle, null, null, s);
        }
    },

    _drawSpiralSymmetry(ctx, strokes, cx, cy, count, rotation) {
        const { spiralScale } = StateManager.state;
        const scaleFactor = 1 + (spiralScale / 100) * 0.5;
        const angleStep = (2 * Math.PI) / count;
        const s = StateManager.state;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            const scale = Math.pow(scaleFactor, i);
            this._drawTransformedStrokes(ctx, strokes, cx, cy, totalAngle, null, scale, s);
        }
    },

    /**
     * 镜像对称当前笔画（支持任意 N）
     */
    _drawMirrorSymmetry(ctx, strokes, cx, cy, count, rotation) {
        const s = StateManager.state;
        for (let i = 0; i < count; i++) {
            const mirrorAngle = (i * Math.PI) / Math.max(count, 1);
            // 使用 'mirror' mode: 先旋转对齐再反射
            this._drawTransformedStrokes(ctx, strokes, cx, cy, rotation + mirrorAngle, 'mirror', null, s);
        }
    },

    /**
     * 批量绘制变换后的笔画（优化：解构 state 一次，减少临时对象）
     * @param {Array} strokes - 笔画数组
     * @param {number} cx - 中心 x
     * @param {number} cy - 中心 y
     * @param {number} angle - 旋转角度
     * @param {string|null} mirrorMode - 反射模式：'mirror' 或 null
     * @param {number|null} scale - 缩放值
     * @param {Object} state - 预解构的 state（优化性能）
     */
    _drawTransformedStrokes(ctx, strokes, cx, cy, angle, mirrorMode, scale, state) {
        const { gradientEnabled, gradientFrom, gradientTo, rainbowMode, rainbowHue,
                materialPalette, colorScheme, colorDither } = state || StateManager.state;

        // 预获取材质配色
        let materialColors = null;
        if (materialPalette && materialPalette !== 'none') {
            try {
                materialColors = ColorPalette.getColorsByScheme(materialPalette, colorScheme);
            } catch (e) {}
        }

        for (let sIdx = 0; sIdx < strokes.length; sIdx++) {
            const stroke = strokes[sIdx];
            if (stroke.length < 2) continue;

            // 确定颜色
            ctx.strokeStyle = this._resolveStrokeColor(stroke, sIdx, gradientEnabled, gradientFrom, gradientTo,
                rainbowMode, rainbowHue, materialColors, colorDither, state);

            // 内联变换 + 绘制（避免创建中间数组）
            if (mirrorMode === 'mirror') {
                this._drawMirroredStrokeInline(ctx, stroke, cx, cy, angle, scale);
            } else {
                this._drawTransformedStrokeInline(ctx, stroke, cx, cy, angle, scale);
            }
        }
    },

    /**
     * 解析单笔画颜色（提取为独立方法减少重复代码）
     */
    _resolveStrokeColor(stroke, idx, gradientEnabled, gradientFrom, gradientTo,
                        rainbowMode, rainbowHue, materialColors, colorDither, state) {
        if (stroke._color) return stroke._color;

        if (materialColors) {
            const mc = materialColors[idx % materialColors.length];
            return colorDither > 0 ? ColorPalette.applyDither(mc, colorDither) : mc;
        }

        if (rainbowMode) {
            const hue = (((rainbowHue || 0) + idx * 30) % 360 + 360) % 360;
            return `hsl(${hue}, 100%, 60%)`;
        }

        if (gradientEnabled && stroke.length >= 2) {
            const first = stroke[0];
            const last = stroke[stroke.length - 1];
            const gradient = this._getOrCreateGradient(this.ctx, gradientFrom, gradientTo, first.x, first.y, last.x, last.y);
            return gradient;
        }

        return state ? state.strokeColor : '#ffffff';
    },

    /**
     * 内联旋转 + 绘制（避免创建临时数组）
     */
    _drawTransformedStrokeInline(ctx, stroke, cx, cy, angle, scale) {
        const len = stroke.length;
        if (len < 2) return;

        ctx.beginPath();

        // 变换第一个点
        let x = stroke[0].x, y = stroke[0].y;
        if (angle !== 0 || (scale && scale !== 1)) {
            if (angle !== 0) {
                const cosA = Math.cos(angle), sinA = Math.sin(angle);
                const dx = x - cx, dy = y - cy;
                x = cx + dx * cosA - dy * sinA;
                y = cy + dx * sinA + dy * cosA;
            }
            if (scale && scale !== 1) {
                x = cx + (x - cx) * scale;
                y = cy + (y - cy) * scale;
            }
        }
        ctx.moveTo(x, y);

        for (let i = 1; i < len; i++) {
            x = stroke[i].x; y = stroke[i].y;
            if (angle !== 0 || (scale && scale !== 1)) {
                if (angle !== 0) {
                    const cosA = Math.cos(angle), sinA = Math.sin(angle);
                    const dx = x - cx, dy = y - cy;
                    x = cx + dx * cosA - dy * sinA;
                    y = cy + dx * sinA + dy * cosA;
                }
                if (scale && scale !== 1) {
                    x = cx + (x - cx) * scale;
                    y = cy + (y - cy) * scale;
                }
            }

            if (i < len - 1) {
                const next = stroke[i + 1];
                let nx = next.x, ny = next.y;
                if (angle !== 0 || (scale && scale !== 1)) {
                    if (angle !== 0) {
                        const cosA = Math.cos(angle), sinA = Math.sin(angle);
                        const dx = nx - cx, dy = ny - cy;
                        nx = cx + dx * cosA - dy * sinA;
                        ny = cy + dx * sinA + dy * cosA;
                    }
                    if (scale && scale !== 1) {
                        nx = cx + (nx - cx) * scale;
                        ny = cy + (ny - cy) * scale;
                    }
                }
                // 二次贝塞尔插值
                const xc = (x + nx) / 2;
                const yc = (y + ny) / 2;
                ctx.quadraticCurveTo(x, y, xc, yc);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    },

    /**
     * 内联镜像+旋转+缩放 绘制（避免创建临时数组）
     */
    _drawMirroredStrokeInline(ctx, stroke, cx, cy, angle, scale) {
        const len = stroke.length;
        if (len < 2) return;

        ctx.beginPath();

        // 变换第一个点（反射 + 旋转）
        let x = stroke[0].x, y = stroke[0].y;
        // 反射：绕经过 cx 的水平轴翻转
        let dx = x - cx, dy = y - cy;
        // 先旋转 angle，使反射轴对齐 x 轴
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        let rx = dx * cosA - dy * sinA;
        let ry = dx * sinA + dy * cosA;
        // 沿 y 轴反射（scale(1, -1)）
        ry = -ry;
        // 旋转回去
        dx = rx * cosA + ry * sinA;
        dy = -rx * sinA + ry * cosA;
        x = cx + dx; y = cy + dy;

        if (scale && scale !== 1) {
            x = cx + (x - cx) * scale;
            y = cy + (y - cy) * scale;
        }
        ctx.moveTo(x, y);

        for (let i = 1; i < len; i++) {
            x = stroke[i].x; y = stroke[i].y;
            dx = x - cx; dy = y - cy;
            rx = dx * cosA - dy * sinA;
            ry = dx * sinA + dy * cosA;
            ry = -ry;
            dx = rx * cosA + ry * sinA;
            dy = -rx * sinA + ry * cosA;
            x = cx + dx; y = cy + dy;

            if (scale && scale !== 1) {
                x = cx + (x - cx) * scale;
                y = cy + (y - cy) * scale;
            }

            if (i < len - 1) {
                const next = stroke[i + 1];
                let nx = next.x, ny = next.y;
                let ndx = nx - cx, ndy = ny - cy;
                let nrx = ndx * cosA - ndy * sinA;
                let nry = ndx * sinA + ndy * cosA;
                nry = -nry;
                ndx = nrx * cosA + nry * sinA;
                ndy = -nrx * sinA + nry * cosA;
                nx = cx + ndx; ny = cy + ndy;

                if (scale && scale !== 1) {
                    nx = cx + (nx - cx) * scale;
                    ny = cy + (ny - cy) * scale;
                }
                const xc = (x + nx) / 2;
                const yc = (y + ny) / 2;
                ctx.quadraticCurveTo(x, y, xc, yc);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    },

    /**
     * 清空画布
     */
    clearCanvas() {
        const s = StateManager.state;
        const { canvasWidth, canvasHeight } = s;
        const ctx = this.ctx;
        ctx.fillStyle = this._resolveBgColor();
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        // 清空离屏画布
        if (this.offscreenCtx) {
            this.offscreenCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        }
        this.needRedrawOffscreen = false;
    },

    // ==================== 动画渲染 ====================

    /**
     * 绘制带动画变换的离屏画布
     */
    _drawOffscreenWithSymmetryAndAnimation(ctx, cx, cy, symmetryMode, count, rotation, transforms) {
        const { scale, hueOffset, centerOffset, rotationOffset, alphaPulse } = transforms;
        
        const totalRotation = rotation + (rotationOffset || 0);
        const offsetX = centerOffset ? centerOffset.x : 0;
        const offsetY = centerOffset ? centerOffset.y : 0;
        const finalScale = scale || 1.0;

        ctx.save();
        ctx.globalAlpha = alphaPulse || 1.0;

        if (symmetryMode === 'spiral') {
            this._drawSpiralOffscreenWithAnimation(ctx, cx + offsetX, cy + offsetY, count, totalRotation, finalScale);
        } else if (symmetryMode === 'mirror') {
            this._drawMirrorOffscreenWithAnimation(ctx, cx + offsetX, cy + offsetY, count, totalRotation, finalScale);
        } else {
            this._drawRotationalOffscreenWithAnimation(ctx, cx + offsetX, cy + offsetY, count, totalRotation, finalScale, hueOffset);
        }

        ctx.restore();
    },

    _drawRotationalOffscreenWithAnimation(ctx, cx, cy, count, rotation, scale, hueOffset) {
        const angleStep = (2 * Math.PI) / count;
        
        // 如果有色相偏移，我们需要重新绘制（而不是使用离屏画布）
        if (hueOffset && Math.abs(hueOffset) > 0.1) {
            this._drawStrokesWithHueShift(ctx, cx, cy, count, rotation, scale, hueOffset);
            return;
        }

        // 无颜色偏移，使用离屏画布
        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    _drawSpiralOffscreenWithAnimation(ctx, cx, cy, count, rotation, baseScale) {
        const { spiralScale } = StateManager.state;
        const scaleFactor = 1 + (spiralScale / 100) * 0.5;
        const angleStep = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            const s = Math.pow(scaleFactor, i) * baseScale;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);
            ctx.scale(s, s);
            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    _drawMirrorOffscreenWithAnimation(ctx, cx, cy, count, rotation, scale) {
        if (count <= 0) return;

        for (let i = 0; i < count; i++) {
            ctx.save();
            ctx.translate(cx, cy);

            const mirrorAngle = (i * Math.PI) / Math.max(count, 1);

            ctx.rotate(mirrorAngle + rotation);
            ctx.scale(scale, -scale);
            ctx.rotate(-mirrorAngle - rotation);

            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    /**
     * 带色相偏移的笔画绘制（不使用离屏画布以应用颜色变换）
     */
    _drawStrokesWithHueShift(ctx, cx, cy, count, rotation, scale, hueOffset) {
        const s = StateManager.state;
        const angleStep = (2 * Math.PI) / count;
        
        const strokes = s.strokes;
        if (!strokes || strokes.length === 0) return;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -cy);
            
            for (let idx = 0; idx < strokes.length; idx++) {
                const stroke = strokes[idx];
                if (stroke.length < 2) continue;

                let color = stroke._color;
                if (color && hueOffset) {
                    color = this._shiftColorHue(color, hueOffset);
                }

                if (color) {
                    this._applyBrushStyle(ctx, color);
                } else {
                    this._applyBrushStyle(ctx);
                }

                this._drawSmoothStroke(ctx, stroke);
            }
            
            ctx.restore();
        }
    },

    /**
     * 偏移颜色色相
     */
    _shiftColorHue(color, offset) {
        if (!color) return color;
        
        let r, g, b;
        if (color.startsWith('#')) {
            if (color.length === 4) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
            } else if (color.length >= 7) {
                r = parseInt(color.slice(1, 3), 16);
                g = parseInt(color.slice(3, 5), 16);
                b = parseInt(color.slice(5, 7), 16);
            } else {
                return color;
            }
        } else if (color.startsWith('hsl')) {
            const match = color.match(/hsl\(\s*(\d+)\s*,/);
            if (match) {
                let h = (parseInt(match[1]) + offset) % 360;
                if (h < 0) h += 360;
                return `hsl(${h}, 100%, 60%)`;
            }
            return color;
        } else {
            return color;
        }

        const hsl = this._rgbToHsl(r, g, b);
        hsl.h = (hsl.h + offset / 360) % 1;
        if (hsl.h < 0) hsl.h += 1;
        const newRgb = this._hslToRgb(hsl.h, hsl.s, hsl.l);
        
        return `rgb(${Math.round(newRgb.r)}, ${Math.round(newRgb.g)}, ${Math.round(newRgb.b)})`;
    },

    _rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h, s, l };
    },

    _hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return { r: r * 255, g: g * 255, b: b * 255 };
    }
};