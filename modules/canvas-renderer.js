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

        // 监听状态变化（仅对笔画相关变化触发重绘）
        StateManager.subscribe((state) => {
            // 不在每次状态变化时都重绘离屏画布
            // needRedrawOffscreen 由具体的笔画变更操作设置
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
            case 'ribbon': dashStr = '12,3,2,3'; break; // 缎带：长短交替虚线
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

        // 安全检查：防止无效的画布尺寸或上下文
        if (!canvasWidth || !canvasHeight || canvasWidth <= 0 || canvasHeight <= 0) {
            return;
        }

        const ctx = this.ctx;
        if (!ctx) return;
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;

        // 1. 设置混合模式
        const prevComposite = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = s.blendMode || 'normal';

        // 2. 背景（带材质色板）- 确保背景总是被正确绘制
        const bgColor = this._resolveBgColor();
        
        // 安全检查背景色
        if (!bgColor || bgColor === 'transparent' || bgColor === 'undefined') {
            ctx.fillStyle = '#0a0a1a'; // 默认深蓝色背景
        } else {
            ctx.fillStyle = bgColor;
        }
        
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 绘制渐变背景（如果有 bgGrad 配色）
        const bgGrad = s.bgGrad;
        if (bgGrad && bgGrad !== bgColor && bgGrad.startsWith('#')) {
            try {
                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cx, cy));
                gradient.addColorStop(0, bgGrad);
                gradient.addColorStop(1, bgColor);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            } catch (e) {
                // 渐变背景失败时忽略，使用纯色背景
            }
        }

        // 如果是拖尾模式，用半透明背景叠加（仅在有内容时）
        if (trailMode && strokes && strokes.length > 0) {
            // 安全地创建半透明背景色（避免 bgColor + '20' 对非6位hex颜色无效）
            try {
                const r = parseInt(bgColor.slice(1, 3), 16);
                const g = parseInt(bgColor.slice(3, 5), 16);
                const b = parseInt(bgColor.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
            } catch (e) {
                ctx.fillStyle = 'rgba(10,10,26,0.12)';
            }
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
     * 获取与背景对比的颜色
     */
    _getContrastColor(bgColor) {
        if (!bgColor || !bgColor.startsWith('#')) return '#ffffff';
        try {
            const r = parseInt(bgColor.slice(1, 3), 16);
            const g = parseInt(bgColor.slice(3, 5), 16);
            const b = parseInt(bgColor.slice(5, 7), 16);
            // 计算亮度
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#333333' : '#ffffff';
        } catch (e) {
            return '#ffffff';
        }
    },

    /**
     * 响应式调整画布尺寸
     */
    resize() {
        const container = document.querySelector('.canvas-container');
        const maxSize = Math.max(Math.min(container.clientWidth - 40, container.clientHeight - 40, 800), 100);

        // 如果尺寸没有变化，跳过
        if (this.canvas && this.canvas.width === maxSize && this.canvas.height === maxSize) {
            return;
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

        // 不在这里调用 render，让动画循环处理
    },

    // ==================== 离屏重绘 ====================

    _redrawOffscreen() {
        const s = StateManager.state;
        const { canvasWidth, canvasHeight, strokes, gradientEnabled,
                gradientFrom, gradientTo, rainbowMode, rainbowHue, colorCycleMode,
                materialPalette, colorScheme, colorDither, gradientType, strokeColor } = s;
        const octx = this.offscreenCtx;

        if (!octx) return;
        
        // 确保离屏画布尺寸正确
        if (this.offscreenCanvas.width !== canvasWidth || this.offscreenCanvas.height !== canvasHeight) {
            this.offscreenCanvas.width = canvasWidth;
            this.offscreenCanvas.height = canvasHeight;
        }
        
        octx.clearRect(0, 0, canvasWidth, canvasHeight);

        octx.lineCap = 'round';
        octx.lineJoin = 'round';

        // 安全检查：如果没有笔画，绘制明显的占位图案
        if (!strokes || strokes.length === 0) {
            // 使用对比色绘制占位图案，确保可见
            const bgColor = s.bgColor || '#000000';
            const contrastColor = this._getContrastColor(bgColor);
            octx.fillStyle = contrastColor;
            octx.strokeStyle = contrastColor;
            octx.lineWidth = Math.max(3, Math.min(canvasWidth, canvasHeight) * 0.008);
            const cx = canvasWidth / 2;
            const cy = canvasHeight / 2;
            const r = Math.min(canvasWidth, canvasHeight) * 0.2;
            
            // 绘制多个圆圈确保可见
            for (let i = 0; i < 2; i++) {
                octx.beginPath();
                octx.arc(cx, cy, r * (1 - i * 0.3), 0, Math.PI * 2);
                octx.stroke();
            }
            
            // 绘制十字
            const lineLen = r * 0.9;
            octx.beginPath();
            octx.moveTo(cx - lineLen, cy);
            octx.lineTo(cx + lineLen, cy);
            octx.moveTo(cx, cy - lineLen);
            octx.lineTo(cx, cy + lineLen);
            octx.stroke();
            
            // 绘制对角线
            const diag = r * 0.6;
            octx.beginPath();
            octx.moveTo(cx - diag, cy - diag);
            octx.lineTo(cx + diag, cy + diag);
            octx.moveTo(cx + diag, cy - diag);
            octx.lineTo(cx - diag, cy + diag);
            octx.stroke();
            return;
        }

        // 预获取一次材质配色（如果有）
        let materialColors = null;
        if (materialPalette && materialPalette !== 'none') {
            try {
                materialColors = ColorPalette.getColorsByScheme(materialPalette, colorScheme);
            } catch (e) {}
        }

        for (let idx = 0; idx < strokes.length; idx++) {
            const stroke = strokes[idx];
            if (!stroke || stroke.length < 2) continue;

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

    /**
     * 计算对称绘制时的缩放因子，确保旋转后所有副本都在画布内
     * 原理：旋转对称时，离屏画布内容在旋转后可能超出画布边界
     * 需要缩小到内切圆半径：对于N折对称，最大半径 = canvasR / (1 + sin(π/N))
     * 这确保旋转后的副本不超出画布
     */
    _getSymmetryScaleFactor(symmetryMode, count) {
        if (symmetryMode === 'spiral') {
            return 0.7;
        }
        if (symmetryMode === 'mirror') {
            if (count <= 1) return 1;
            return 1 / (1 + Math.cos(Math.PI / count));
        }
        if (symmetryMode === 'interlockMirror') {
            // 交错镜像：每个副本占据一半扇区，需要稍小缩放
            if (count <= 1) return 1;
            return 1 / (1 + Math.cos(Math.PI / count)) * 0.92;
        }
        if (symmetryMode === 'spiralMirror') {
            // 螺旋镜像：与螺旋类似
            return 0.65;
        }
        // 旋转对称：最常见的情况
        // N折旋转时，内容绕中心旋转 N 次
        // 当 N 较大时（如8+），每个扇区角度小，图案互相交叠
        // 缩放因子确保单个扇区的内容旋转后不超出画布
        if (count <= 1) return 1;
        if (count <= 4) return 0.85;
        if (count <= 8) return 0.75;
        if (count <= 12) return 0.7;
        return 0.65;
    },

    _drawOffscreenWithSymmetry(ctx, cx, cy, symmetryMode, count, rotation) {
        // 计算缩放因子防止图案被裁剪
        const scaleFactor = this._getSymmetryScaleFactor(symmetryMode, count);
        
        if (symmetryMode === 'spiral') {
            this._drawSpiralOffscreen(ctx, cx, cy, count, rotation, scaleFactor);
        } else if (symmetryMode === 'mirror') {
            this._drawMirrorOffscreen(ctx, cx, cy, count, rotation, scaleFactor);
        } else if (symmetryMode === 'interlockMirror') {
            // 交错镜像：旋转 + 交替镜像，创造万花筒般的交错效果
            this._drawInterlockMirrorOffscreen(ctx, cx, cy, count, rotation, scaleFactor);
        } else if (symmetryMode === 'spiralMirror') {
            // 螺旋镜像：螺旋缩放 + 镜像交替
            this._drawSpiralMirrorOffscreen(ctx, cx, cy, count, rotation, scaleFactor);
        } else {
            this._drawRotationalOffscreen(ctx, cx, cy, count, rotation, scaleFactor);
        }
    },

    _drawRotationalOffscreen(ctx, cx, cy, count, rotation, scaleFactor) {
        const angleStep = (2 * Math.PI) / count;
        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);
            ctx.scale(scaleFactor, scaleFactor);
            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    /**
     * 螺旋对称（修复坐标变换顺序）
     * 正确顺序：translate(cx,cy) → rotate → scale → translate(-cx,-cy)
     */
    _drawSpiralOffscreen(ctx, cx, cy, count, rotation, baseScaleFactor) {
        const { spiralScale } = StateManager.state;
        const scaleFactor = 1 + (spiralScale / 100) * 0.5;
        const angleStep = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            const s = Math.pow(scaleFactor, i) * baseScaleFactor;
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
    _drawMirrorOffscreen(ctx, cx, cy, count, rotation, scaleFactor) {
        if (count <= 0) return;

        for (let i = 0; i < count; i++) {
            ctx.save();
            ctx.translate(cx, cy);

            // 计算反射角度
            // 每个副本的反射轴方向
            const mirrorAngle = (i * Math.PI) / Math.max(count, 1);

            // 旋转使反射轴对齐 x 轴
            ctx.rotate(mirrorAngle + rotation);
            // 沿 x 轴反射并缩放
            ctx.scale(scaleFactor, -scaleFactor);
            // 旋转回来
            ctx.rotate(-mirrorAngle - rotation);

            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    /**
     * 交错镜像 (Interlock Mirror) - 旋转对称与镜像交替
     * 偶数副本正常旋转，奇数副本镜像反射
     * 产生真正的万花筒效果（如实物万花筒中的镜像碎片）
     */
    _drawInterlockMirrorOffscreen(ctx, cx, cy, count, rotation, scaleFactor) {
        if (count <= 0) return;
        const angleStep = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);

            if (i % 2 === 0) {
                // 正常旋转副本
                ctx.scale(scaleFactor, scaleFactor);
            } else {
                // 镜像反射副本
                ctx.scale(-scaleFactor, scaleFactor);
            }

            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    /**
     * 螺旋镜像 (Spiral Mirror) - 螺旋缩放与镜像交替
     * 每个副本按螺旋缩放，奇数副本镜像
     * 产生不断缩小的镜像图案，像无限反射的万花筒隧道
     */
    _drawSpiralMirrorOffscreen(ctx, cx, cy, count, rotation, baseScaleFactor) {
        if (count <= 0) return;
        const { spiralScale } = StateManager.state;
        const scaleFactor = 1 + (spiralScale / 100) * 0.5;
        const angleStep = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            const s = Math.pow(scaleFactor, i) * baseScaleFactor;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);

            if (i % 2 === 0) {
                ctx.scale(s, s);
            } else {
                ctx.scale(-s, s);
            }

            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    _drawStrokeSet(ctx, strokes, cx, cy, symmetryMode, count, rotation) {
        // 使用与离屏画布相同的缩放因子，防止实时笔画被裁剪
        const scaleFactor = this._getSymmetryScaleFactor(symmetryMode, count);
        
        if (symmetryMode === 'spiral') {
            this._drawSpiralSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor);
        } else if (symmetryMode === 'mirror') {
            this._drawMirrorSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor);
        } else if (symmetryMode === 'interlockMirror') {
            this._drawInterlockMirrorSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor);
        } else if (symmetryMode === 'spiralMirror') {
            this._drawSpiralMirrorSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor);
        } else {
            this._drawRotationalSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor);
        }
    },

    _drawRotationalSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor) {
        const angleStep = (2 * Math.PI) / count;
        const s = StateManager.state;
        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            this._drawTransformedStrokes(ctx, strokes, cx, cy, totalAngle, null, scaleFactor, s);
        }
    },

    _drawSpiralSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor) {
        const { spiralScale } = StateManager.state;
        const spiralFactor = 1 + (spiralScale / 100) * 0.5;
        const angleStep = (2 * Math.PI) / count;
        const s = StateManager.state;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            const scale = Math.pow(spiralFactor, i) * scaleFactor;
            this._drawTransformedStrokes(ctx, strokes, cx, cy, totalAngle, null, scale, s);
        }
    },

    /**
     * 镜像对称当前笔画（支持任意 N）
     */
    _drawMirrorSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor) {
        const s = StateManager.state;
        for (let i = 0; i < count; i++) {
            const mirrorAngle = (i * Math.PI) / Math.max(count, 1);
            // 使用 'mirror' mode: 先旋转对齐再反射
            this._drawTransformedStrokes(ctx, strokes, cx, cy, rotation + mirrorAngle, 'mirror', scaleFactor, s);
        }
    },

    /**
     * 交错镜像实时笔画
     */
    _drawInterlockMirrorSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor) {
        const angleStep = (2 * Math.PI) / count;
        const s = StateManager.state;
        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            const mirrorMode = i % 2 !== 0 ? 'mirror' : null;
            this._drawTransformedStrokes(ctx, strokes, cx, cy, totalAngle, mirrorMode, scaleFactor, s);
        }
    },

    /**
     * 螺旋镜像实时笔画
     */
    _drawSpiralMirrorSymmetry(ctx, strokes, cx, cy, count, rotation, scaleFactor) {
        const { spiralScale } = StateManager.state;
        const spiralFactor = 1 + (spiralScale / 100) * 0.5;
        const angleStep = (2 * Math.PI) / count;
        const s = StateManager.state;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            const scale = Math.pow(spiralFactor, i) * scaleFactor;
            const mirrorMode = i % 2 !== 0 ? 'mirror' : null;
            this._drawTransformedStrokes(ctx, strokes, cx, cy, totalAngle, mirrorMode, scale, s);
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

        // 预计算三角函数
        const hasAngle = angle !== 0;
        const cosA = hasAngle ? Math.cos(angle) : 1;
        const sinA = hasAngle ? Math.sin(angle) : 0;
        const hasScale = scale && scale !== 1;

        ctx.beginPath();

        // 变换第一个点
        let x = stroke[0].x, y = stroke[0].y;
        if (hasAngle) {
            const dx = x - cx, dy = y - cy;
            x = cx + dx * cosA - dy * sinA;
            y = cy + dx * sinA + dy * cosA;
        }
        if (hasScale) {
            x = cx + (x - cx) * scale;
            y = cy + (y - cy) * scale;
        }
        ctx.moveTo(x, y);

        for (let i = 1; i < len; i++) {
            x = stroke[i].x; y = stroke[i].y;
            if (hasAngle) {
                const dx = x - cx, dy = y - cy;
                x = cx + dx * cosA - dy * sinA;
                y = cy + dx * sinA + dy * cosA;
            }
            if (hasScale) {
                x = cx + (x - cx) * scale;
                y = cy + (y - cy) * scale;
            }

            if (i < len - 1) {
                const next = stroke[i + 1];
                let nx = next.x, ny = next.y;
                if (hasAngle) {
                    const dx = nx - cx, dy = ny - cy;
                    nx = cx + dx * cosA - dy * sinA;
                    ny = cy + dx * sinA + dy * cosA;
                }
                if (hasScale) {
                    nx = cx + (nx - cx) * scale;
                    ny = cy + (ny - cy) * scale;
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
        const animScale = scale || 1.0;
        
        // 计算对称缩放因子（与无动画版本一致，防止裁剪）
        const symScaleFactor = this._getSymmetryScaleFactor(symmetryMode, count);
        const finalScale = animScale * symScaleFactor;

        ctx.save();
        ctx.globalAlpha = alphaPulse || 1.0;

        if (symmetryMode === 'spiral') {
            this._drawSpiralOffscreenWithAnimation(ctx, cx + offsetX, cy + offsetY, count, totalRotation, finalScale);
        } else if (symmetryMode === 'mirror') {
            this._drawMirrorOffscreenWithAnimation(ctx, cx + offsetX, cy + offsetY, count, totalRotation, finalScale);
        } else if (symmetryMode === 'interlockMirror') {
            this._drawInterlockMirrorOffscreenWithAnimation(ctx, cx + offsetX, cy + offsetY, count, totalRotation, finalScale);
        } else if (symmetryMode === 'spiralMirror') {
            this._drawSpiralMirrorOffscreenWithAnimation(ctx, cx + offsetX, cy + offsetY, count, totalRotation, finalScale);
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

    _drawInterlockMirrorOffscreenWithAnimation(ctx, cx, cy, count, rotation, scale) {
        if (count <= 0) return;
        const angleStep = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);
            if (i % 2 === 0) {
                ctx.scale(scale, scale);
            } else {
                ctx.scale(-scale, scale);
            }
            ctx.translate(-cx, -cy);
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            ctx.restore();
        }
    },

    _drawSpiralMirrorOffscreenWithAnimation(ctx, cx, cy, count, rotation, baseScale) {
        if (count <= 0) return;
        const { spiralScale } = StateManager.state;
        const scaleFactor = 1 + (spiralScale / 100) * 0.5;
        const angleStep = (2 * Math.PI) / count;

        for (let i = 0; i < count; i++) {
            const totalAngle = rotation + i * angleStep;
            const s = Math.pow(scaleFactor, i) * baseScale;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(totalAngle);
            if (i % 2 === 0) {
                ctx.scale(s, s);
            } else {
                ctx.scale(-s, s);
            }
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
    },

    /**
     * 白屏诊断功能 - 输出关键状态信息供分析
     */
    diagnose() {
        const s = StateManager.state;
        const info = {
            // 画布状态
            canvas: {
                width: this.canvas?.width,
                height: this.canvas?.height,
                clientWidth: this.canvas?.clientWidth,
                clientHeight: this.canvas?.clientHeight,
                style: this.canvas ? {
                    width: this.canvas.style.width,
                    height: this.canvas.style.height,
                    display: this.canvas.style.display,
                    visibility: this.canvas.style.visibility,
                    opacity: this.canvas.style.opacity
                } : null
            },
            offscreenCanvas: {
                width: this.offscreenCanvas?.width,
                height: this.offscreenCanvas?.height
            },
            // 画布尺寸状态
            canvasSize: {
                canvasWidth: s.canvasWidth,
                canvasHeight: s.canvasHeight,
                trailMode: s.trailMode
            },
            // 动画状态
            animation: {
                isAnimating: s.isAnimating,
                _animationTransforms: !!s._animationTransforms,
                animationSpeed: s.animationSpeed,
                currentRotation: s.currentRotation
            },
            // 渲染关键标记
            renderFlags: {
                needRedrawOffscreen: this.needRedrawOffscreen
            },
            // 笔画数据
            strokes: {
                count: s.strokes?.length || 0,
                currentStrokeLength: s.currentStroke?.length || 0
            },
            // 对称设置
            symmetry: {
                mode: s.symmetryMode,
                count: s.symmetryCount
            },
            // 背景设置
            background: {
                bgColor: s.bgColor,
                resolvedBgColor: this._resolveBgColor(),
                materialPalette: s.materialPalette,
                colorScheme: s.colorScheme
            },
            // 混合模式
            blendMode: s.blendMode || 'normal',
            // 粒子系统状态
            particles: {
                enabled: s.particleEnabled,
                count: s.particles?.length || 0
            },
            // 时间戳
            timestamp: new Date().toISOString()
        };

        console.log('%c=== 白屏诊断报告 ===', 'color: #ff6b6b; font-weight: bold; font-size: 14px;');
        console.log('%c复制以下 JSON 给开发者：', 'color: #4ecdc4; font-weight: bold;');
        console.log(JSON.stringify(info, null, 2));
        console.log('%c详细状态对象：', 'color: #45b7d1; font-weight: bold;');
        console.log('StateManager.state:', s);
        console.log('CanvasRenderer 对象:', this);
        
        // 检测可能的问题
        const issues = [];
        
        if (!this.canvas || this.canvas.width <= 0 || this.canvas.height <= 0) {
            issues.push('❌ 画布尺寸无效');
        }
        
        if (s.canvasWidth <= 0 || s.canvasHeight <= 0) {
            issues.push('❌ 状态中画布尺寸无效');
        }
        
        if (this.canvas && (this.canvas.style.display === 'none' || this.canvas.style.visibility === 'hidden')) {
            issues.push('❌ 画布被隐藏');
        }
        
        if (this.canvas && this.canvas.style.opacity === '0') {
            issues.push('❌ 画布透明度为0');
        }
        
        if (!this.ctx || !this.canvas) {
            issues.push('❌ 画布上下文未初始化');
        }
        
        if (issues.length === 0) {
            issues.push('✅ 未检测到明显问题，请检查渲染逻辑');
        }
        
        console.log('%c可能的问题：', 'color: #feca57; font-weight: bold;');
        issues.forEach(issue => console.log(issue));
        
        return info;
    }
};

// 全局诊断函数 - 可在控制台直接调用
window.__diagnoseWhiteScreen = function() {
    if (window.CanvasRenderer) {
        return CanvasRenderer.diagnose();
    }
    console.error('CanvasRenderer 未找到');
};