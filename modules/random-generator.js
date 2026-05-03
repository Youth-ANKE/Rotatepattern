/**
 * 随机艺术生成器模块 V2.0
 * 
 * 升级内容：
 * - 45套高级配色方案（含渐变背景、金属质感、霓虹光效）
 * - 18种图案生成器（新增黄金螺旋、曼陀罗、伊斯兰几何、分形树等）
 * - 多层叠加生成（每次生成2~3层互补图层）
 * - 装饰元素系统（边框、角花、散点、光环）
 * - 智能参数组合（色相偏移、明度变化、透明度层次）
 * 
 * 每次点击 R 都是一幅独一无二的艺术品！
 */
const RandomGenerator = {
    // ===== 45套高端配色方案 =====
    palettes: [
        // === 经典系列 ===
        { name: '梵高星夜',   bg: '#0d0d2b', bgGrad: '#1a1a4e', stroke: '#f0c040', glow: '#ffdd77', accent: '#4d8fff', mood: 'classic' },
        { name: '莫奈睡莲',   bg: '#1a2e1a', bgGrad: '#0a1a2e', stroke: '#88bbcc', glow: '#aaddff', accent: '#cc88aa', mood: 'classic' },
        { name: '浮世绘浪',   bg: '#0a1a2e', bgGrad: '#1a2e4e', stroke: '#eeeeff', glow: '#88ccff', accent: '#ff6644', mood: 'classic' },
        { name: '敦煌飞天',   bg: '#1a0a0a', bgGrad: '#2e1a0a', stroke: '#ffcc44', glow: '#ffdd66', accent: '#66cc88', mood: 'classic' },
        { name: '水墨丹青',   bg: '#f5f0e8', bgGrad: '#e8e0d0', stroke: '#2a2a2a', glow: '#888888', accent: '#cc4444', mood: 'classic' },

        // === 霓虹赛博系列 ===
        { name: '赛博之巅',   bg: '#05001a', bgGrad: '#1a0033', stroke: '#ff00ff', glow: '#ff66ff', accent: '#00ffff', mood: 'neon' },
        { name: '霓虹东京',   bg: '#0a001a', bgGrad: '#1a0033', stroke: '#ff3366', glow: '#ff6699', accent: '#33ccff', mood: 'neon' },
        { name: '量子极光',   bg: '#000a1a', bgGrad: '#001a33', stroke: '#00ff88', glow: '#66ffaa', accent: '#aa66ff', mood: 'neon' },
        { name: '脉冲星河',   bg: '#0a0010', bgGrad: '#1a0020', stroke: '#ff6600', glow: '#ff9900', accent: '#ff00aa', mood: 'neon' },
        { name: '全息梦境',   bg: '#0a0a1a', bgGrad: '#1a0a2e', stroke: '#ff4488', glow: '#ff66aa', accent: '#44ffaa', mood: 'neon' },

        // === 自然系列 ===
        { name: '极光之巅',   bg: '#0a140a', bgGrad: '#0a0a2e', stroke: '#44ff88', glow: '#88ffcc', accent: '#4488ff', mood: 'nature' },
        { name: '深海幽蓝',   bg: '#000a1a', bgGrad: '#001a33', stroke: '#4488ff', glow: '#66aaff', accent: '#00ffaa', mood: 'nature' },
        { name: '森林秘境',   bg: '#0a1a0a', bgGrad: '#1a2e1a', stroke: '#66cc44', glow: '#88ff66', accent: '#ffcc44', mood: 'nature' },
        { name: '火山熔岩',   bg: '#1a0500', bgGrad: '#2e0a00', stroke: '#ff4400', glow: '#ff6600', accent: '#ffdd44', mood: 'nature' },
        { name: '珊瑚秘境',   bg: '#1a0a1a', bgGrad: '#2e1a2e', stroke: '#ff6688', glow: '#ff88aa', accent: '#ffaa44', mood: 'nature' },

        // === 豪华金属系列 ===
        { name: '鎏金岁月',   bg: '#1a1400', bgGrad: '#2e2810', stroke: '#ffd700', glow: '#ffed4a', accent: '#ff8c00', mood: 'luxury' },
        { name: '白银纪元',   bg: '#1a1a22', bgGrad: '#2e2e3e', stroke: '#c0c0d0', glow: '#e0e0f0', accent: '#8888cc', mood: 'luxury' },
        { name: '玫瑰金典',   bg: '#1a1018', bgGrad: '#2e1a28', stroke: '#e8a0b0', glow: '#f0b8c8', accent: '#ffd700', mood: 'luxury' },
        { name: '青铜古韵',   bg: '#1a1410', bgGrad: '#2e2218', stroke: '#cd7f32', glow: '#e8a050', accent: '#88aa44', mood: 'luxury' },
        { name: '铂金极简',   bg: '#f8f8fa', bgGrad: '#eeecf0', stroke: '#2a2a3a', glow: '#8888aa', accent: '#c0a060', mood: 'luxury' },

        // === 梦幻系列 ===
        { name: '银河星云',   bg: '#05001a', bgGrad: '#1a0033', stroke: '#ff66aa', glow: '#aa66ff', accent: '#66ccff', mood: 'dream' },
        { name: '童话森林',   bg: '#1a1a2e', bgGrad: '#2e1a3e', stroke: '#ff88cc', glow: '#ffaadd', accent: '#88ffaa', mood: 'dream' },
        { name: '星空水彩',   bg: '#f0eef8', bgGrad: '#e8e4f0', stroke: '#6688cc', glow: '#88aadd', accent: '#cc88aa', mood: 'dream' },
        { name: '极彩梦境',   bg: '#2e0a2e', bgGrad: '#1a0a3e', stroke: '#ff6644', glow: '#ff8866', accent: '#44ff88', mood: 'dream' },
        { name: '月下仙境',   bg: '#0a0a22', bgGrad: '#1a1a3e', stroke: '#c0c8ff', glow: '#d0d8ff', accent: '#ffcc88', mood: 'dream' },

        // === 异域风情系列 ===
        { name: '摩洛哥蓝',   bg: '#002040', bgGrad: '#001830', stroke: '#4488bb', glow: '#66aadd', accent: '#cc8844', mood: 'ethnic' },
        { name: '印度纱丽',   bg: '#1a0010', bgGrad: '#2e0020', stroke: '#ff4488', glow: '#ff66aa', accent: '#ffcc00', mood: 'ethnic' },
        { name: '非洲日落',   bg: '#2e1000', bgGrad: '#1a0a00', stroke: '#ff6600', glow: '#ff8844', accent: '#ffcc00', mood: 'ethnic' },
        { name: '波斯地毯',   bg: '#1a0010', bgGrad: '#2e1020', stroke: '#cc3344', glow: '#dd5577', accent: '#4488aa', mood: 'ethnic' },
        { name: '玛雅文明',   bg: '#002010', bgGrad: '#003020', stroke: '#44aa66', glow: '#66cc88', accent: '#cc8844', mood: 'ethnic' },

        // === 极简现代系列 ===
        { name: '黑白几何',   bg: '#f8f8f8', bgGrad: '#ececec', stroke: '#1a1a1a', glow: '#888888', accent: '#ff4444', mood: 'modern' },
        { name: '北欧极简',   bg: '#f0f4f0', bgGrad: '#e8ece8', stroke: '#334455', glow: '#667788', accent: '#88aa77', mood: 'modern' },
        { name: '性冷淡风',   bg: '#f5f0ec', bgGrad: '#ece8e4', stroke: '#8a7a6a', glow: '#aaa090', accent: '#c05040', mood: 'modern' },
        { name: '孟菲斯派',   bg: '#f0e8e0', bgGrad: '#e8e0d8', stroke: '#ff4488', glow: '#ff66aa', accent: '#44ccff', mood: 'modern' },
        { name: '波普艺术',   bg: '#f0f0f0', bgGrad: '#e8e8e8', stroke: '#ff0044', glow: '#ff2266', accent: '#00ccff', mood: 'modern' },

        // === 星河宇宙系列 ===
        { name: '创世之柱',   bg: '#000010', bgGrad: '#0a0020', stroke: '#ff8844', glow: '#ffaa66', accent: '#44aaff', mood: 'cosmic' },
        { name: '超新星爆',   bg: '#0a0018', bgGrad: '#1a0028', stroke: '#00ffff', glow: '#88ffff', accent: '#ff4488', mood: 'cosmic' },
        { name: '暗物质',     bg: '#080810', bgGrad: '#101020', stroke: '#8844ff', glow: '#aa66ff', accent: '#00ff88', mood: 'cosmic' },
        { name: '脉冲星',     bg: '#000018', bgGrad: '#0a0028', stroke: '#44ffcc', glow: '#66ffdd', accent: '#ff4488', mood: 'cosmic' },
        { name: '虫洞裂隙',   bg: '#000820', bgGrad: '#001040', stroke: '#ff66ff', glow: '#ff88ff', accent: '#66ffff', mood: 'cosmic' },

        // === 季节系列 ===
        { name: '春樱',       bg: '#f8e8f0', bgGrad: '#f0dce8', stroke: '#ff88aa', glow: '#ffaacc', accent: '#88cc66', mood: 'season' },
        { name: '夏荷',       bg: '#e8f4e8', bgGrad: '#d8ecd8', stroke: '#44aa88', glow: '#66ccaa', accent: '#ff88aa', mood: 'season' },
        { name: '秋枫',       bg: '#2e1808', bgGrad: '#1a1008', stroke: '#ff6633', glow: '#ff8844', accent: '#ffcc44', mood: 'season' },
        { name: '冬雪',       bg: '#e8f0f8', bgGrad: '#dce8f4', stroke: '#6688bb', glow: '#88aadd', accent: '#cc4466', mood: 'season' },
        { name: '极夜',       bg: '#000818', bgGrad: '#0a1028', stroke: '#4488ff', glow: '#66aaff', accent: '#88ff66', mood: 'season' },
    ],

    // ===== 18种图案生成器 =====
    patternGenerators: [
        'mandala',          // 曼陀罗 - 多层同心对称花卉图案
        'goldenSpiral',     // 黄金螺旋 - 基于斐波那契数列的螺旋
        'islamicGeo',       // 伊斯兰几何 - 星形多边形镶嵌
        'fractalTree',      // 分形树 - 递归分形树枝
        'celestialOrbits',  // 天体轨道 - 行星轨道与光环
        'waveInterference', // 波干涉 - 物理波干涉图案
        'laceFiligree',     // 蕾丝花边 - 精致镂空花纹
        'tessellation',     // 镶嵌 - 规则多边形镶嵌
        'zentangle',        // 禅绕画 - 重复线条禅绕
        'radialBurst',      // 辐射爆裂 - 从中心向外辐射
        'flowerPetals',     // 花瓣 - 优美的弧形花瓣
        'spiralWave',       // 螺旋波 - 旋转前进的螺旋线
        'concentricRings',  // 同心环 - 从内到外的圆圈
        'zigzagRays',       // 锯齿射线 - 折线风格的放射线
        'abstractScribble', // 抽象涂鸦 - 随机平滑曲线
        'starburst',        // 星爆 - 星星状爆裂
        'feathers',         // 羽毛 - 飘逸的羽毛状线条
        'ripples',          // 涟漪 - 水波涟漪效果
    ],

    // ============ 主生成入口 ============

    /**
     * 生成随机配置和图案笔画（多层叠加）
     * @returns {Object} { config, strokes }
     */
    generate() {
        const palette = this.palettes[Math.floor(Math.random() * this.palettes.length)];

        // ---- 随机对称参数 ----
        const evens = [4, 6, 8, 10, 12, 16, 20, 24, 32];
        const symmetryCount = evens[Math.floor(Math.random() * evens.length)];

        // ---- 随机速度 ----
        const rotationSpeed = Math.floor(Math.random() * 80) + 5;

        // ---- 随机对称模式 ----
        const modes = ['rotational', 'mirror', 'spiral'];
        const symmetryMode = modes[Math.floor(Math.random() * modes.length)];

        // ---- 画笔类型 ----
        const brushTypes = ['solid', 'dashed', 'dotted', 'spray'];
        const brushType = brushTypes[Math.floor(Math.random() * brushTypes.length)];

        // ---- 画笔宽度（适配不同图案） ----
        const widths = [1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16];
        const strokeWidth = widths[Math.floor(Math.random() * widths.length)];

        // ---- 开关效果 ----
        const glowEnabled = Math.random() > 0.25;
        const trailMode = Math.random() > 0.65;
        const rainbowMode = Math.random() > 0.8;
        const gradientEnabled = Math.random() > 0.6;

        // ---- 粒子类型 ----
        const particleTypes = ['spark', 'star', 'rainbow', 'butterfly', 'bubble', 'snow'];
        const particleType = particleTypes[Math.floor(Math.random() * particleTypes.length)];

        // ---- 音乐主题 ----
        const themes = ['aurora', 'cyber', 'forest', 'dream', 'temple', 'space', 'jazz', 'ocean'];
        const musicTheme = themes[Math.floor(Math.random() * themes.length)];

        // ---- 螺旋缩放 ----
        const spiralScale = symmetryMode === 'spiral' ? (Math.floor(Math.random() * 80) - 40) : 0;

        // ---- 高级参数 ----
        // 图层透明度
        const opacity = 0.6 + Math.random() * 0.4;
        // 是否生成装饰元素
        const decorativeEnabled = Math.random() > 0.3;
        // 是否使用渐变背景
        const bgGradientEnabled = Math.random() > 0.4;
        // 是否生成边框
        const borderEnabled = Math.random() > 0.5;

        // ---- 主配置 ----
        const config = {
            bgColor: palette.bg,
            bgGrad: palette.bgGrad,
            strokeColor: palette.stroke,
            glowColor: palette.glow,
            accentColor: palette.accent || palette.glow,
            symmetryCount,
            rotationSpeed,
            symmetryMode,
            brushType,
            strokeWidth,
            glowEnabled: glowEnabled || rainbowMode,
            trailMode,
            rainbowMode,
            gradientEnabled,
            particleEnabled: true,
            particleType,
            musicTheme,
            spiralScale,
            opacity,
            bgGradientEnabled,
            decorativeEnabled,
            borderEnabled,
            mood: palette.mood,
        };

        // 浅色背景自动拖尾+发光
        if (['#ffffff', '#ffeedd', '#e8f5e9', '#f8f8f8', '#f0f4f0', '#f5f0ec', '#f8e8f0', '#e8f4e8', '#e8f0f8', '#f0e8e0', '#f0f0f0', '#f0eef8', '#f5f0e8'].includes(palette.bg)) {
            config.trailMode = true;
            config.glowEnabled = true;
        }

        // ---- 生成多层笔画 ----
        const strokes = this._generateMultiLayerStrokes(config, palette);

        return { config, strokes };
    },

    // ============ 多层笔画生成系统 ============

    /**
     * 生成多层叠加笔画（2~3层）
     */
    _generateMultiLayerStrokes(config, palette) {
        const { canvasWidth, canvasHeight } = StateManager.state;
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        const maxR = Math.min(cx, cy) * 0.92;

        let allStrokes = [];
        const layerCount = 2 + Math.floor(Math.random() * 2); // 2~3层

        // 随机选2~3个不同的生成器
        const generators = this._pickRandomGenerators(layerCount);

        for (let i = 0; i < layerCount; i++) {
            const generator = generators[i];
            // 每层不同的密度和尺寸
            const layerScale = 0.6 + Math.random() * 0.4;
            const layerMaxR = maxR * (0.5 + i * 0.25);
            
            // 生成这层时用不同的调色板变体
            const layerPalette = this._derivePalette(palette, i, layerCount);
            
            const strokes = this._invokeGenerator(
                generator,
                cx, cy, layerMaxR * layerScale,
                2 + Math.floor(Math.random() * 3), // 每层笔画数
                this._generateStrokeColors(layerPalette, 8 + Math.floor(Math.random() * 8)),
                config, layerPalette
            );

            // 给这层的笔画附加元信息
            strokes.forEach(s => {
                s._layer = i;
                s._opacity = 0.7 + Math.random() * 0.3;
            });

            allStrokes = allStrokes.concat(strokes);
        }

        // 添加装饰元素层（点、小圆、光环等）
        if (config.decorativeEnabled) {
            const decorStrokes = this._generateDecorations(cx, cy, maxR, config, palette);
            decorStrokes.forEach(s => { s._layer = 3; s._opacity = 0.5 + Math.random() * 0.5; });
            allStrokes = allStrokes.concat(decorStrokes);
        }

        // 添加边框
        if (config.borderEnabled) {
            const borderStrokes = this._generateBorder(cx, cy, maxR, config, palette);
            borderStrokes.forEach(s => { s._layer = 4; s._opacity = 0.8; });
            allStrokes = allStrokes.concat(borderStrokes);
        }

        // 最终安全检查：如果没有任何笔画，强制生成保底图案
        if (allStrokes.length === 0) {
            console.warn('[RandomGenerator] 所有层都没有生成笔画，使用保底图案');
            const fallbackStrokes = this.mandala(cx, cy, maxR, 3, colors, config, palette);
            fallbackStrokes.forEach((s, i) => { s._layer = i; s._opacity = 0.9; });
            allStrokes = fallbackStrokes;
        }

        return allStrokes;
    },

    /**
     * 随机选n个不同的生成器（避免同质化）
     * 新增：高级生成器体系（流体、地形、进化、熔岩灯等）
     */
    _pickRandomGenerators(count) {
        // 按类别分组确保多样性
        const primary = ['mandala', 'goldenSpiral', 'islamicGeo', 'celestialOrbits', 'waveInterference', 'laceFiligree'];
        const secondary = ['radialBurst', 'flowerPetals', 'spiralWave', 'concentricRings', 'starburst', 'feathers', 'ripples', 'tessellation', 'zentangle', 'fractalTree', 'zigzagRays', 'abstractScribble'];
        const advanced = ['fluidFlow', 'terrainContour', 'evolutionPattern', 'lavaLamp', 'polarPattern', 'nebulaCloud'];

        const selected = [];
        
        // 第一层选主图案（有时也选高级生成器）
        const allPrimary = [...primary, ...advanced];
        const p1 = allPrimary[Math.floor(Math.random() * allPrimary.length)];
        selected.push(p1);

        // 第二层选一个不同的
        let pool = [...primary, ...secondary, ...advanced].filter(p => p !== p1);
        if (count >= 2) {
            const p2 = pool[Math.floor(Math.random() * pool.length)];
            selected.push(p2);
            pool = pool.filter(p => p !== p2);
        }

        // 第三层从所有剩余选
        if (count >= 3) {
            const p3 = pool[Math.floor(Math.random() * pool.length)];
            selected.push(p3);
        }

        return selected;
    },

    /**
     * 统一生成器调用调度
     * 如果是高级生成器（AdvancedGenerators 模块），委托调用
     * 否则调用本地方法
     */
    _invokeGenerator(name, cx, cy, maxR, count, colors, config, palette) {
        const advancedGenerators = ['fluidFlow', 'terrainContour', 'evolutionPattern', 'lavaLamp', 'polarPattern', 'nebulaCloud'];
        
        let strokes = [];
        
        try {
            if (advancedGenerators.includes(name)) {
                // 确保 AdvancedGenerators 和依赖已加载
                if (typeof AdvancedGenerators !== 'undefined' && typeof AdvancedGenerators[name] === 'function') {
                    strokes = AdvancedGenerators[name](cx, cy, maxR, count, colors, config, palette);
                }
            } else if (typeof this[name] === 'function') {
                // 调用本地生成器
                strokes = this[name](cx, cy, maxR, count, colors, config, palette);
            }
        } catch (e) {
            console.warn(`[RandomGenerator] 生成器 ${name} 出错:`, e);
            strokes = [];
        }
        
        // 安全检查：如果没生成任何笔画，使用 fallback
        if (!Array.isArray(strokes) || strokes.length === 0) {
            console.warn(`[RandomGenerator] 生成器 ${name} 未返回笔画，使用 fallback`);
            const fallbacks = ['mandala', 'starburst', 'goldenSpiral'];
            const fallbackName = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            strokes = this[fallbackName](cx, cy, maxR, Math.max(2, count), colors, config, palette);
        }
        
        return strokes;
    },

    /**
     * 从基础调色板派生出层次变体
     */
    _derivePalette(palette, layerIndex, totalLayers) {
        const hueShift = (layerIndex * 30 + Math.floor(Math.random() * 20)) % 360;
        const lightShift = layerIndex * 10 - 10;
        
        const shiftColor = (hex, hueOffset, lightOffset) => {
            if (!hex || hex === 'transparent') return hex;
            try {
                let r = parseInt(hex.slice(1, 3), 16);
                let g = parseInt(hex.slice(3, 5), 16);
                let b = parseInt(hex.slice(5, 7), 16);
                
                // 轻微HSV偏移
                r = Math.max(0, Math.min(255, r + Math.floor(Math.random() * 30 - 15 + lightOffset)));
                g = Math.max(0, Math.min(255, g + Math.floor(Math.random() * 30 - 15 + lightOffset)));
                b = Math.max(0, Math.min(255, b + Math.floor(Math.random() * 30 - 15 + lightOffset)));
                
                return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
            } catch (e) {
                return hex;
            }
        };

        return {
            name: palette.name + `_L${layerIndex}`,
            bg: palette.bg,
            bgGrad: palette.bgGrad,
            stroke: shiftColor(palette.stroke, hueShift, lightShift),
            glow: shiftColor(palette.glow, hueShift, lightShift),
            accent: shiftColor(palette.accent || palette.glow, hueShift + 15, lightShift),
            mood: palette.mood
        };
    },

    /**
     * 生成装饰元素（散点、小圆、光环）
     */
    _generateDecorations(cx, cy, maxR, config, palette) {
        const strokes = [];
        const decorCount = 10 + Math.floor(Math.random() * 30);
        
        // 散点
        const dotColor = palette.accent || palette.stroke;
        for (let i = 0; i < decorCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const r = maxR * (0.15 + Math.random() * 0.75);
            const size = 1 + Math.random() * 4;
            
            // 小圆点用两个点表示（短线）
            const dot = [
                { x: cx + r * Math.cos(angle) - size, y: cy + r * Math.sin(angle) },
                { x: cx + r * Math.cos(angle) + size, y: cy + r * Math.sin(angle) }
            ];
            dot._color = dotColor;
            dot._decor = true;
            strokes.push(dot);
        }

        // 有时加光环
        if (Math.random() > 0.5) {
            const haloR = maxR * (0.2 + Math.random() * 0.5);
            const halo = [];
            const segments = 60 + Math.floor(Math.random() * 40);
            for (let i = 0; i <= segments; i++) {
                const angle = (2 * Math.PI * i) / segments;
                const wobble = Math.sin(angle * 5 + Math.random() * 3) * 2;
                halo.push({
                    x: cx + (haloR + wobble) * Math.cos(angle),
                    y: cy + (haloR + wobble) * Math.sin(angle)
                });
            }
            halo._color = palette.glow;
            halo._decor = true;
            strokes.push(halo);
        }

        return strokes;
    },

    /**
     * 生成边框装饰
     */
    _generateBorder(cx, cy, maxR, config, palette) {
        const strokes = [];
        const borderR = maxR * 0.97;
        const segs = 80 + Math.floor(Math.random() * 40);
        
        // 外边框
        const border = [];
        for (let i = 0; i <= segs; i++) {
            const angle = (2 * Math.PI * i) / segs;
            const wobble = Math.sin(angle * 8 + config.symmetryCount) * 2;
            border.push({
                x: cx + (borderR + wobble) * Math.cos(angle),
                y: cy + (borderR + wobble) * Math.sin(angle)
            });
        }
        border._color = palette.accent || palette.stroke;
        strokes.push(border);

        // 内框线（有时）
        if (Math.random() > 0.5) {
            const innerR = borderR * 0.92;
            const inner = [];
            for (let i = 0; i <= segs; i++) {
                const angle = (2 * Math.PI * i) / segs;
                inner.push({
                    x: cx + innerR * Math.cos(angle),
                    y: cy + innerR * Math.sin(angle)
                });
            }
            inner._color = palette.stroke;
            strokes.push(inner);
        }

        // 角落装饰
        if (Math.random() > 0.4) {
            const corners = 4 + Math.floor(Math.random() * 4);
            for (let i = 0; i < corners; i++) {
                const angle = (2 * Math.PI * i) / corners + Math.random() * 0.1;
                const r1 = borderR * 0.93;
                const r2 = borderR;
                const cornerPoints = [
                    { x: cx + r1 * Math.cos(angle - 0.05), y: cy + r1 * Math.sin(angle - 0.05) },
                    { x: cx + r2 * Math.cos(angle), y: cy + r2 * Math.sin(angle) },
                    { x: cx + r1 * Math.cos(angle + 0.05), y: cy + r1 * Math.sin(angle + 0.05) }
                ];
                cornerPoints._color = palette.glow;
                strokes.push(cornerPoints);
            }
        }

        return strokes;
    },

    // ============ 高级图案生成器 ============

    /**
     * 曼陀罗 - 多层同心对称花卉图案
     * 复杂的对称花瓣、多层叠加、精细装饰
     */
    mandala(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const layers = 3 + Math.floor(Math.random() * 5);
        
        // 第一层：大花瓣
        for (let l = 0; l < layers; l++) {
            const petalCount = 4 + Math.floor(Math.random() * 12) + l * 2;
            const rStart = maxR * (0.05 + l * 0.12 + Math.random() * 0.05);
            const rEnd = maxR * (0.25 + l * 0.2 + Math.random() * 0.05);
            const petalWidth = (0.3 + Math.random() * 0.8) * (1 - l * 0.08);
            
            for (let i = 0; i < petalCount; i++) {
                const centerAngle = (2 * Math.PI * i) / petalCount + Math.random() * 0.02;
                
                // 花瓣左弧
                const leftArc = [];
                const rightArc = [];
                const segs = 10 + Math.floor(Math.random() * 8);
                
                for (let j = 0; j <= segs; j++) {
                    const t = j / segs;
                    const r = rStart + t * (rEnd - rStart);
                    const spread = petalWidth * Math.sin(t * Math.PI) * r * 0.25;
                    
                    const aL = centerAngle - spread * 0.008;
                    const aR = centerAngle + spread * 0.008;
                    leftArc.push({ x: cx + r * Math.cos(aL), y: cy + r * Math.sin(aL) });
                    rightArc.push({ x: cx + r * Math.cos(aR), y: cy + r * Math.sin(aR) });
                }
                
                leftArc._color = colors[(i + l * 3) % colors.length];
                rightArc._color = colors[(i + l * 3 + 2) % colors.length];
                strokes.push(leftArc);
                strokes.push(rightArc);
                
                // 花瓣中脉
                if (Math.random() > 0.4) {
                    const midR = rStart + 0.5 * (rEnd - rStart);
                    const midStroke = [
                        { x: cx + rStart * Math.cos(centerAngle), y: cy + rStart * Math.sin(centerAngle) },
                        { x: cx + (rEnd + maxR * 0.05) * Math.cos(centerAngle), y: cy + (rEnd + maxR * 0.05) * Math.sin(centerAngle) }
                    ];
                    midStroke._color = palette.glow;
                    strokes.push(midStroke);
                }
            }
        }
        
        // 第二层：中心装饰
        const centerR = maxR * (0.05 + Math.random() * 0.1);
        const centerCircle = [];
        const segs2 = 30 + Math.floor(Math.random() * 20);
        for (let i = 0; i <= segs2; i++) {
            const angle = (2 * Math.PI * i) / segs2;
            const wobble = Math.sin(angle * 6 + Math.random() * 5) * 2;
            centerCircle.push({
                x: cx + (centerR + wobble) * Math.cos(angle),
                y: cy + (centerR + wobble) * Math.sin(angle)
            });
        }
        centerCircle._color = palette.stroke;
        strokes.push(centerCircle);
        
        // 第三层：放射细线（经线）
        if (Math.random() > 0.3) {
            const rayCount = 12 + Math.floor(Math.random() * 24);
            for (let i = 0; i < rayCount; i++) {
                const angle = (2 * Math.PI * i) / rayCount;
                const innerR = maxR * (0.08 + Math.random() * 0.15);
                const outerR = maxR * (0.7 + Math.random() * 0.25);
                const ray = [
                    { x: cx + innerR * Math.cos(angle), y: cy + innerR * Math.sin(angle) },
                    { x: cx + outerR * Math.cos(angle), y: cy + outerR * Math.sin(angle) }
                ];
                ray._color = colors[(i + 5) % colors.length];
                strokes.push(ray);
            }
        }
        
        return strokes;
    },

    /**
     * 黄金螺旋 - 基于斐波那契数列的完美螺旋
     * 自然界最美的数学曲线
     */
    goldenSpiral(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const spirals = 1 + Math.floor(Math.random() * 4);
        const phi = (1 + Math.sqrt(5)) / 2; // 黄金比例
        
        for (let s = 0; s < spirals; s++) {
            const points = [];
            const startAngle = s * Math.PI * 2 / spirals + Math.random() * 0.5;
            const turns = 3 + Math.floor(Math.random() * 5);
            const totalPoints = 100 + Math.floor(Math.random() * 150);
            
            // 黄金螺旋：半径按phi等比增长
            const rMin = maxR * (0.02 + Math.random() * 0.05);
            const rMax = maxR * (0.6 + Math.random() * 0.35);
            const growthFactor = Math.pow(phi, 2 / (2 * Math.PI)); // 每弧度增长
            
            for (let i = 0; i <= totalPoints; i++) {
                const t = i / totalPoints;
                const angle = startAngle + t * turns * 2 * Math.PI;
                const r = rMin * Math.pow(growthFactor, t * turns * 2 * Math.PI);
                
                if (r > rMax) break;
                
                // 添加微小扰动，更自然
                const wobble = Math.sin(angle * 3 + s) * (1 + r / rMax * 2);
                const a = angle + wobble * 0.003;
                points.push({
                    x: cx + r * Math.cos(a),
                    y: cy + r * Math.sin(a)
                });
            }
            
            if (points.length > 5) {
                points._color = colors[s % colors.length];
                strokes.push(points);
            }
        }
        
        // 有时添加反向螺旋
        if (Math.random() > 0.6) {
            for (let s = 0; s < 2; s++) {
                const reversePoints = [];
                const startAngle = Math.random() * 2 * Math.PI;
                const rMin2 = maxR * (0.3 + Math.random() * 0.2);
                const rMax2 = maxR * (0.7 + Math.random() * 0.2);
                
                for (let i = 0; i <= 60; i++) {
                    const t = i / 60;
                    const angle = startAngle - t * 2 * Math.PI * 2;
                    const r = rMin2 + t * (rMax2 - rMin2);
                    const wobble = Math.sin(angle * 4) * 3;
                    reversePoints.push({
                        x: cx + (r + wobble) * Math.cos(angle),
                        y: cy + (r + wobble) * Math.sin(angle)
                    });
                }
                reversePoints._color = colors[(s + 3) % colors.length];
                strokes.push(reversePoints);
            }
        }
        
        return strokes;
    },

    /**
     * 伊斯兰几何 - 星形多边形镶嵌图案
     * 基于正多边形的星形几何
     */
    islamicGeo(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const starPoints = 8 + Math.floor(Math.random() * 8) * 2; // 8, 12, 16, 20, 24
        const innerR = maxR * (0.2 + Math.random() * 0.2);
        const outerR = maxR * (0.5 + Math.random() * 0.35);
        
        // 主星形
        const star = [];
        for (let i = 0; i <= starPoints * 2; i++) {
            const t = i / (starPoints * 2);
            const angle = t * 2 * Math.PI - Math.PI / 2;
            const isOuter = i % 2 === 0;
            const r = isOuter ? outerR : innerR;
            star.push({
                x: cx + r * Math.cos(angle),
                y: cy + r * Math.sin(angle)
            });
        }
        star._color = colors[0];
        strokes.push(star);
        
        // 外接圆环
        const ring = [];
        const ringSegs = 40 + Math.floor(Math.random() * 20);
        for (let i = 0; i <= ringSegs; i++) {
            const angle = (2 * Math.PI * i) / ringSegs;
            ring.push({
                x: cx + outerR * 1.1 * Math.cos(angle),
                y: cy + outerR * 1.1 * Math.sin(angle)
            });
        }
        ring._color = colors[1 % colors.length];
        strokes.push(ring);
        
        // 内部连接线（形成伊斯兰几何图案）
        const connectors = Math.floor(starPoints / 2);
        for (let i = 0; i < connectors; i++) {
            const a1 = (2 * Math.PI * i) / starPoints;
            const a2 = (2 * Math.PI * (i + 2)) / starPoints;
            const conn = [
                { x: cx + innerR * 0.5 * Math.cos(a1), y: cy + innerR * 0.5 * Math.sin(a1) },
                { x: cx + outerR * Math.cos(a2), y: cy + outerR * Math.sin(a2) }
            ];
            conn._color = colors[(i + 2) % colors.length];
            strokes.push(conn);
            
            // 交叉连接
            const a3 = (2 * Math.PI * (i + connectors)) / starPoints;
            const conn2 = [
                { x: cx + outerR * Math.cos(a1), y: cy + outerR * Math.sin(a1) },
                { x: cx + innerR * 0.5 * Math.cos(a3), y: cy + innerR * 0.5 * Math.sin(a3) }
            ];
            conn2._color = colors[(i + 4) % colors.length];
            strokes.push(conn2);
        }
        
        // 中心装饰
        const centerSegs = 20 + Math.floor(Math.random() * 10);
        const centerPoints = [];
        for (let i = 0; i <= centerSegs; i++) {
            const angle = (2 * Math.PI * i) / centerSegs;
            centerPoints.push({
                x: cx + innerR * 0.35 * Math.cos(angle),
                y: cy + innerR * 0.35 * Math.sin(angle)
            });
        }
        centerPoints._color = palette.glow;
        strokes.push(centerPoints);
        
        return strokes;
    },

    /**
     * 分形树 - 递归分形树枝结构
     */
    fractalTree(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const branches = 2 + Math.floor(Math.random() * 4);
        const depth = 3 + Math.floor(Math.random() * 4);
        const startAngle = -Math.PI / 2;
        const angleSpread = 0.3 + Math.random() * 0.5;
        const shrinkFactor = 0.55 + Math.random() * 0.2;
        const baseLen = maxR * (0.2 + Math.random() * 0.2);
        
        let strokeCount = 0;
        
        const drawBranch = (x, y, angle, length, depth, colorIdx) => {
            if (depth <= 0 || length < 2) return;
            
            const endX = x + length * Math.cos(angle);
            const endY = y + length * Math.sin(angle);
            
            const branch = [
                { x, y },
                { x: endX, y: endY }
            ];
            branch._color = colors[colorIdx % colors.length];
            strokes.push(branch);
            strokeCount++;
            
            // 递归分支
            const childCount = branches - Math.floor(Math.random() * 2);
            for (let i = 0; i < childCount; i++) {
                const spread = angleSpread * (0.6 + Math.random() * 0.4);
                const childAngle = angle - spread + (i * 2 * spread) / (childCount - 1 || 1) + (Math.random() - 0.5) * 0.1;
                const childLen = length * shrinkFactor * (0.8 + Math.random() * 0.4);
                drawBranch(endX, endY, childAngle, childLen, depth - 1, colorIdx + i + 1);
            }
        };
        
        // 主树干
        drawBranch(cx, cy + maxR * 0.3, startAngle, baseLen, depth, 0);
        
        // 有时生成多棵树
        if (Math.random() > 0.5 && depth > 3) {
            const secondX = cx + (Math.random() - 0.5) * maxR * 0.3;
            drawBranch(secondX, cy + maxR * 0.3, startAngle + (Math.random() - 0.5) * 0.3, baseLen * 0.7, depth - 1, 5);
        }
        
        return strokes;
    },

    /**
     * 天体轨道 - 行星轨道与光环
     */
    celestialOrbits(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const orbits = 3 + Math.floor(Math.random() * 5);
        
        // 轨道
        for (let i = 0; i < orbits; i++) {
            const orbitR = maxR * (0.2 + i * 0.15 + Math.random() * 0.03);
            const orbitPoints = [];
            const segs = 40 + Math.floor(Math.random() * 20);
            
            for (let j = 0; j <= segs; j++) {
                const angle = (2 * Math.PI * j) / segs;
                const wobble = Math.sin(angle * 3 + i * 2) * 2;
                orbitPoints.push({
                    x: cx + (orbitR + wobble) * Math.cos(angle),
                    y: cy + (orbitR + wobble) * Math.sin(angle)
                });
            }
            
            orbitPoints._color = colors[i % colors.length];
            strokes.push(orbitPoints);
        }
        
        // 行星（小圆点）
        for (let i = 0; i < orbits; i++) {
            const orbitR = maxR * (0.2 + i * 0.15);
            const planetAngle = Math.random() * 2 * Math.PI;
            const planetSize = 2 + Math.random() * 4;
            
            const planet = [
                { x: cx + (orbitR - planetSize) * Math.cos(planetAngle), y: cy + (orbitR - planetSize) * Math.sin(planetAngle) },
                { x: cx + (orbitR + planetSize) * Math.cos(planetAngle), y: cy + (orbitR + planetSize) * Math.sin(planetAngle) }
            ];
            planet._color = palette.glow;
            strokes.push(planet);
            
            // 有时加光环
            if (Math.random() > 0.5) {
                const ringPoints = [];
                const ringR = planetSize * 3;
                const ringSegs = 16;
                for (let j = 0; j <= ringSegs; j++) {
                    const a = (2 * Math.PI * j) / ringSegs + planetAngle;
                    ringPoints.push({
                        x: cx + orbitR * Math.cos(planetAngle) + ringR * Math.cos(a),
                        y: cy + orbitR * Math.sin(planetAngle) + ringR * Math.sin(a) * 0.3
                    });
                }
                ringPoints._color = palette.accent || palette.glow;
                strokes.push(ringPoints);
            }
        }
        
        // 中心发光体
        const centerGlow = [];
        const glowSegs = 30;
        for (let i = 0; i <= glowSegs; i++) {
            const angle = (2 * Math.PI * i) / glowSegs;
            const wobble = Math.sin(angle * 5) * 3;
            centerGlow.push({
                x: cx + (maxR * 0.05 + wobble) * Math.cos(angle),
                y: cy + (maxR * 0.05 + wobble) * Math.sin(angle)
            });
        }
        centerGlow._color = palette.stroke;
        strokes.push(centerGlow);
        
        return strokes;
    },

    /**
     * 波干涉 - 物理波干涉图案
     * 多个波源干涉产生的复杂花纹
     */
    waveInterference(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const waveCount = 3 + Math.floor(Math.random() * 5);
        const resolution = 40 + Math.floor(Math.random() * 30);
        
        // 用一组等高线表示波
        for (let w = 0; w < waveCount; w++) {
            const wavePoints = [];
            const phase = Math.random() * 2 * Math.PI;
            
            for (let i = 0; i <= resolution; i++) {
                const t = i / resolution;
                const angle = t * 2 * Math.PI;
                const r = maxR * (0.1 + t * 0.75);
                
                // 多个波源干涉
                let sum = 0;
                const sources = [
                    { x: cx - maxR * 0.2, y: cy - maxR * 0.1 },
                    { x: cx + maxR * 0.2, y: cy + maxR * 0.1 },
                    { x: cx, y: cy - maxR * 0.2 },
                    { x: cx + maxR * 0.15, y: cy - maxR * 0.15 }
                ];
                
                for (const src of sources) {
                    const dx = (cx + r * Math.cos(angle)) - src.x;
                    const dy = (cy + r * Math.sin(angle)) - src.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    sum += Math.sin(dist * 0.05 + phase + w * 0.5);
                }
                
                // 等高线：sum ≈ 0 时绘图
                const normalizedR = r + sum * 5;
                if (normalizedR > 0 && normalizedR < maxR) {
                    wavePoints.push({
                        x: cx + normalizedR * Math.cos(angle),
                        y: cy + normalizedR * Math.sin(angle)
                    });
                }
            }
            
            if (wavePoints.length > 10) {
                wavePoints._color = colors[w % colors.length];
                strokes.push(wavePoints);
            }
        }
        
        return strokes;
    },

    /**
     * 蕾丝花边 - 精致镂空花纹
     */
    laceFiligree(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const rings = 3 + Math.floor(Math.random() * 5);
        const segments = 12 + Math.floor(Math.random() * 16);
        
        // 同心蕾丝环
        for (let ring = 0; ring < rings; ring++) {
            const baseR = maxR * (0.1 + ring * 0.2 + Math.random() * 0.05);
            
            // 环上的花纹
            for (let i = 0; i < segments; i++) {
                const startAngle = (2 * Math.PI * i) / segments;
                const endAngle = (2 * Math.PI * (i + 1)) / segments;
                
                // 弧形
                const arcPoints = [];
                const arcSegs = 6 + Math.floor(Math.random() * 4);
                for (let j = 0; j <= arcSegs; j++) {
                    const t = j / arcSegs;
                    const angle = startAngle + t * (endAngle - startAngle);
                    const r = baseR + Math.sin(t * Math.PI) * maxR * 0.04;
                    arcPoints.push({
                        x: cx + r * Math.cos(angle),
                        y: cy + r * Math.sin(angle)
                    });
                }
                arcPoints._color = colors[(ring * segments + i) % colors.length];
                strokes.push(arcPoints);
                
                // 环间连接
                if (ring < rings - 1 && i % 2 === 0) {
                    const nextR = maxR * (0.1 + (ring + 1) * 0.2);
                    const midAngle = (startAngle + endAngle) / 2;
                    const connector = [
                        { x: cx + baseR * Math.cos(midAngle), y: cy + baseR * Math.sin(midAngle) },
                        { x: cx + nextR * Math.cos(midAngle), y: cy + nextR * Math.sin(midAngle) }
                    ];
                    connector._color = palette.accent || colors[(ring * segments + i + 2) % colors.length];
                    strokes.push(connector);
                }
            }
        }
        
        // 中心小圆
        const center = [];
        const centerSegs = 16;
        for (let i = 0; i <= centerSegs; i++) {
            const angle = (2 * Math.PI * i) / centerSegs;
            center.push({
                x: cx + maxR * 0.04 * Math.cos(angle),
                y: cy + maxR * 0.04 * Math.sin(angle)
            });
        }
        center._color = palette.stroke;
        strokes.push(center);
        
        return strokes;
    },

    /**
     * 镶嵌 - 规则多边形镶嵌
     */
    tessellation(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const sides = 3 + Math.floor(Math.random() * 4); // 3~6边形
        const rings = 2 + Math.floor(Math.random() * 4);
        const angleOffset = Math.random() * 2 * Math.PI;
        
        for (let ring = 0; ring < rings; ring++) {
            const n = 6 + ring * 6;
            const baseR = maxR * (0.15 + ring * 0.18);
            
            for (let i = 0; i < n; i++) {
                const angle = (2 * Math.PI * i) / n + angleOffset + ring * 0.1;
                const centerDist = baseR;
                const centerX = cx + centerDist * Math.cos(angle);
                const centerY = cy + centerDist * Math.sin(angle);
                const polyR = maxR * (0.06 + Math.random() * 0.04);
                
                // 绘制多边形
                const polyPoints = [];
                for (let j = 0; j <= sides; j++) {
                    const a = (2 * Math.PI * j) / sides + Math.random() * 0.02;
                    polyPoints.push({
                        x: centerX + polyR * Math.cos(a),
                        y: centerY + polyR * Math.sin(a)
                    });
                }
                polyPoints._color = colors[(ring * n + i) % colors.length];
                strokes.push(polyPoints);
            }
        }
        
        return strokes;
    },

    /**
     * 禅绕画 - 重复线条禅绕
     */
    zentangle(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const cellSize = maxR * (0.08 + Math.random() * 0.06);
        const cols = Math.floor(maxR * 2 / cellSize);
        const rows = Math.floor(maxR * 2 / cellSize);
        const startX = cx - cols * cellSize / 2;
        const startY = cy - rows * cellSize / 2;
        
        const patterns = ['hatch', 'crosshatch', 'dots', 'waves', 'spiral', 'zigzag'];
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * cellSize;
                const y = startY + r * cellSize;
                const pattern = patterns[Math.floor(Math.random() * patterns.length)];
                const cellStroke = [];
                
                // 确保在画布范围内
                if (Math.abs(x - cx) > maxR || Math.abs(y - cy) > maxR) continue;
                
                switch (pattern) {
                    case 'hatch':
                        for (let l = 0; l < 3 + Math.floor(Math.random() * 3); l++) {
                            const t = l / 4;
                            cellStroke.push(
                                { x: x + t * cellSize, y: y },
                                { x: x + t * cellSize + cellSize * 0.1, y: y + cellSize }
                            );
                        }
                        break;
                    case 'crosshatch':
                        for (let l = 0; l < 3; l++) {
                            const t = l / 4;
                            cellStroke.push(
                                { x: x + t * cellSize, y: y, x2: x + t * cellSize, y2: y + cellSize },
                                { x: x, y: y + t * cellSize, x2: x + cellSize, y2: y + t * cellSize }
                            );
                        }
                        break;
                    case 'waves':
                        for (let l = 0; l <= 8; l++) {
                            const t = l / 8;
                            cellStroke.push({
                                x: x + t * cellSize,
                                y: y + cellSize / 2 + Math.sin(t * Math.PI * 3) * cellSize * 0.3
                            });
                        }
                        break;
                    default:
                        continue;
                }
                
                if (cellStroke.length > 1) {
                    cellStroke._color = colors[(r * cols + c) % colors.length];
                    strokes.push(cellStroke);
                }
            }
        }
        
        return strokes;
    },

    // ============ 原有经典图案生成器（保留并增强） ============

    /**
     * 辐射爆裂
     */
    radialBurst(cx, cy, maxR, count, colors) {
        const strokes = [];
        const rays = 6 + Math.floor(Math.random() * 16);
        const startR = maxR * (0.1 + Math.random() * 0.2);
        
        for (let i = 0; i < rays; i++) {
            const angle = (2 * Math.PI * i) / rays + (Math.random() - 0.5) * 0.05;
            const points = [];
            const segs = 8 + Math.floor(Math.random() * 8);
            
            for (let j = 0; j <= segs; j++) {
                const t = j / segs;
                const r = startR + t * (maxR - startR);
                const curve = Math.sin(t * Math.PI * 3 + i) * 6 * (Math.random() * 0.5 + 0.5);
                const a = angle + curve * 0.005;
                points.push({
                    x: cx + r * Math.cos(a),
                    y: cy + r * Math.sin(a)
                });
            }
            
            points._color = colors[i % colors.length];
            strokes.push(points);
        }
        return strokes;
    },

    /**
     * 花瓣
     */
    flowerPetals(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const petals = 5 + Math.floor(Math.random() * 10);
        const petalWidth = 0.2 + Math.random() * 0.7;
        
        for (let i = 0; i < petals; i++) {
            const centerAngle = (2 * Math.PI * i) / petals;
            const r1 = maxR * (0.15 + Math.random() * 0.35);
            const r2 = maxR * (0.5 + Math.random() * 0.4);
            
            const leftPoints = [];
            const rightPoints = [];
            const segs = 10 + Math.floor(Math.random() * 8);
            
            for (let j = 0; j <= segs; j++) {
                const t = j / segs;
                const r = r1 + t * (r2 - r1);
                const spread = petalWidth * Math.sin(t * Math.PI) * r * 0.3;
                
                const aL = centerAngle - spread * 0.008;
                const aR = centerAngle + spread * 0.008;
                leftPoints.push({ x: cx + r * Math.cos(aL), y: cy + r * Math.sin(aL) });
                rightPoints.push({ x: cx + r * Math.cos(aR), y: cy + r * Math.sin(aR) });
                
                if (j === Math.floor(segs / 2)) {
                    const midR = r1 + 0.5 * (r2 - r1);
                    const extraLen = maxR * 0.1 * Math.random();
                    const aM = centerAngle;
                    const midPoints = [
                        { x: cx + (r1 + 0.2*(r2-r1)) * Math.cos(aM), y: cy + (r1 + 0.2*(r2-r1)) * Math.sin(aM) },
                        { x: cx + (r2 + extraLen) * Math.cos(aM), y: cy + (r2 + extraLen) * Math.sin(aM) }
                    ];
                    midPoints._color = colors[(i + 1) % colors.length];
                    strokes.push(midPoints);
                }
            }
            
            leftPoints._color = colors[i % colors.length];
            rightPoints._color = colors[(i + 2) % colors.length];
            strokes.push(leftPoints);
            strokes.push(rightPoints);
        }
        return strokes;
    },

    /**
     * 螺旋波（增强版）
     */
    spiralWave(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const spirals = 1 + Math.floor(Math.random() * 4);
        
        for (let s = 0; s < spirals; s++) {
            const points = [];
            const startAngle = Math.random() * 2 * Math.PI;
            const totalAngle = 2 * Math.PI * (2 + Math.random() * 5);
            const turns = 100 + Math.floor(Math.random() * 150);
            
            for (let i = 0; i <= turns; i++) {
                const t = i / turns;
                const r = maxR * t * (0.3 + 0.7 * Math.random());
                if (r > maxR) break;
                const angle = startAngle + t * totalAngle;
                const wave = Math.sin(t * Math.PI * 8 + s * 2) * (5 + Math.random() * 12) * t;
                const a = angle + wave * 0.005;
                points.push({
                    x: cx + r * Math.cos(a),
                    y: cy + r * Math.sin(a)
                });
            }
            
            if (points.length > 10) {
                points._color = colors[s % colors.length];
                strokes.push(points);
            }
        }
        return strokes;
    },

    /**
     * 同心环（增强版）
     */
    concentricRings(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const rings = 4 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < rings; i++) {
            const t = (i + 1) / (rings + 1);
            const radius = maxR * t;
            
            const points = [];
            const segments = 30 + Math.floor(Math.random() * 40);
            
            for (let j = 0; j <= segments; j++) {
                const angle = (2 * Math.PI * j) / segments;
                const wobble = Math.sin(angle * (4 + i) + i * 2) * (2 + i * 0.5);
                const r = radius + wobble;
                points.push({
                    x: cx + r * Math.cos(angle),
                    y: cy + r * Math.sin(angle)
                });
            }
            
            points._color = colors[i % colors.length];
            strokes.push(points);
            
            // 环间连接线
            if (i > 0 && Math.random() > 0.6) {
                const connectors = 4 + Math.floor(Math.random() * 10);
                const prevRadius = maxR * i / (rings + 1);
                for (let c = 0; c < connectors; c++) {
                    const a = (2 * Math.PI * c) / connectors + Math.random() * 0.2;
                    const line = [
                        { x: cx + prevRadius * Math.cos(a), y: cy + prevRadius * Math.sin(a) },
                        { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }
                    ];
                    line._color = colors[(i + c) % colors.length];
                    strokes.push(line);
                }
            }
        }
        return strokes;
    },

    /**
     * 锯齿射线
     */
    zigzagRays(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const rays = 6 + Math.floor(Math.random() * 16);
        
        for (let i = 0; i < rays; i++) {
            const baseAngle = (2 * Math.PI * i) / rays;
            const points = [];
            const zigzags = 5 + Math.floor(Math.random() * 12);
            const step = maxR / zigzags;
            
            for (let j = 0; j <= zigzags; j++) {
                const r = j * step;
                const zig = (j % 2 === 0 ? 1 : -1) * (10 + Math.random() * 25) * (1 - j / zigzags * 0.5);
                const a = baseAngle + zig * 0.008 + Math.sin(j * 0.5 + i) * 0.02;
                points.push({
                    x: cx + r * Math.cos(a),
                    y: cy + r * Math.sin(a)
                });
            }
            
            points._color = colors[i % colors.length];
            strokes.push(points);
        }
        return strokes;
    },

    /**
     * 抽象涂鸦
     */
    abstractScribble(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const lines = 2 + Math.floor(Math.random() * 6);
        
        for (let l = 0; l < lines; l++) {
            const points = [];
            const pointCount = 8 + Math.floor(Math.random() * 18);
            const startR = maxR * (0.2 + Math.random() * 0.6);
            const startAngle = Math.random() * 2 * Math.PI;
            
            let x = cx + startR * Math.cos(startAngle);
            let y = cy + startR * Math.sin(startAngle);
            
            for (let i = 0; i < pointCount; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const dist = 5 + Math.random() * maxR * 0.35;
                x += Math.cos(angle) * dist;
                y += Math.sin(angle) * dist;
                
                const dx = x - cx;
                const dy = y - cy;
                const distFromCenter = Math.sqrt(dx * dx + dy * dy);
                if (distFromCenter > maxR) {
                    x = cx + (dx / distFromCenter) * maxR;
                    y = cy + (dy / distFromCenter) * maxR;
                }
                
                points.push({ x, y });
            }
            
            points._color = colors[l % colors.length];
            strokes.push(points);
        }
        return strokes;
    },

    /**
     * 星爆
     */
    starburst(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const spikes = 8 + Math.floor(Math.random() * 18);
        const innerR = maxR * (0.08 + Math.random() * 0.15);
        
        for (let i = 0; i < spikes; i++) {
            const angle = (2 * Math.PI * i) / spikes;
            const midR = maxR * (0.6 + Math.random() * 0.4);
            
            const points = [];
            const segs = 3 + Math.floor(Math.random() * 5);
            for (let j = 0; j <= segs; j++) {
                const t = j / segs;
                const r = innerR + t * (midR - innerR);
                const a = angle + (Math.random() - 0.5) * 0.02 + Math.sin(t * Math.PI * 2) * 0.03;
                points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
            }
            points._color = colors[i % colors.length];
            strokes.push(points);
        }
        
        if (Math.random() > 0.4) {
            const arcs = 2 + Math.floor(Math.random() * 5);
            for (let a = 0; a < arcs; a++) {
                const arcPoints = [];
                const startAngle = Math.random() * 2 * Math.PI;
                const arcRange = Math.PI * (0.5 + Math.random());
                const arcR = maxR * (0.4 + Math.random() * 0.5);
                const segs2 = 15 + Math.floor(Math.random() * 15);
                
                for (let j = 0; j <= segs2; j++) {
                    const t = j / segs2;
                    const angle = startAngle + t * arcRange;
                    arcPoints.push({
                        x: cx + arcR * Math.cos(angle),
                        y: cy + arcR * Math.sin(angle)
                    });
                }
                arcPoints._color = colors[(a + spikes) % colors.length];
                strokes.push(arcPoints);
            }
        }
        
        return strokes;
    },

    /**
     * 羽毛（增强版）
     */
    feathers(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const featherCount = 6 + Math.floor(Math.random() * 14);
        
        for (let i = 0; i < featherCount; i++) {
            const angle = (2 * Math.PI * i) / featherCount + (Math.random() - 0.5) * 0.08;
            const rStart = maxR * (0.1 + Math.random() * 0.25);
            const rEnd = maxR * (0.7 + Math.random() * 0.28);
            
            // 主杆
            const stem = [];
            const segs = 8 + Math.floor(Math.random() * 8);
            for (let j = 0; j <= segs; j++) {
                const t = j / segs;
                const r = rStart + t * (rEnd - rStart);
                const curve = Math.sin(t * Math.PI * 4 + i) * 5 * t;
                const a = angle + curve * 0.005;
                stem.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
            }
            stem._color = colors[i % colors.length];
            strokes.push(stem);
            
            // 侧羽
            if (Math.random() > 0.25) {
                const branches = 2 + Math.floor(Math.random() * 5);
                for (let b = 0; b < branches; b++) {
                    const t = 0.15 + b * 0.18;
                    const br = rStart + t * (rEnd - rStart);
                    const side = Math.random() > 0.5 ? 1 : -1;
                    const branchLen = maxR * (0.1 + Math.random() * 0.2);
                    
                    const branchPoints = [
                        { x: cx + br * Math.cos(angle), y: cy + br * Math.sin(angle) },
                        { x: cx + (br + branchLen) * Math.cos(angle + side * (0.12 + Math.random() * 0.1)), y: cy + (br + branchLen) * Math.sin(angle + side * (0.12 + Math.random() * 0.1)) }
                    ];
                    branchPoints._color = colors[(i + b + 2) % colors.length];
                    strokes.push(branchPoints);
                }
            }
        }
        return strokes;
    },

    /**
     * 涟漪（增强版）
     */
    ripples(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const waveCount = 2 + Math.floor(Math.random() * 6);
        
        for (let w = 0; w < waveCount; w++) {
            const baseR = maxR * (0.15 + w * 0.16 + Math.random() * 0.04);
            
            const points = [];
            const segs = 30 + Math.floor(Math.random() * 40);
            
            for (let j = 0; j <= segs; j++) {
                const t = j / segs;
                const angle = 2 * Math.PI * t;
                const wave = Math.sin(angle * (3 + Math.floor(Math.random() * 6)) + w * 2) * (3 + Math.random() * 8);
                const r = baseR + wave;
                points.push({
                    x: cx + r * Math.cos(angle),
                    y: cy + r * Math.sin(angle)
                });
            }
            
            points._color = colors[w % colors.length];
            strokes.push(points);
        }
        
        if (Math.random() > 0.5) {
            const rays = 4 + Math.floor(Math.random() * 14);
            for (let i = 0; i < rays; i++) {
                const angle = (2 * Math.PI * i) / rays;
                const rayPoints = [];
                const segs2 = 5 + Math.floor(Math.random() * 5);
                for (let j = 0; j <= segs2; j++) {
                    const t = j / segs2;
                    const r = t * maxR * 0.9;
                    rayPoints.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
                }
                rayPoints._color = colors[(i + waveCount) % colors.length];
                strokes.push(rayPoints);
            }
        }
        
        return strokes;
    },

    // ============ 配色系统 ============

    /**
     * 生成一组和谐配色
     */
    _generateStrokeColors(palette, count) {
        const base = palette.stroke;
        const colors = [base];
        
        for (let i = 1; i < count; i++) {
            const color = this._shiftColor(base, palette.accent || palette.glow);
            if (color) colors.push(color);
            else {
                colors.push(base);
            }
        }
        
        // 随机色彩分布
        return colors.sort(() => Math.random() - 0.5);
    },

    /**
     * 在两个颜色之间做混合
     */
    _shiftColor(color1, color2) {
        try {
            if (!color1 || !color2) return color1;
            const r1 = parseInt(color1.slice(1, 3), 16);
            const g1 = parseInt(color1.slice(3, 5), 16);
            const b1 = parseInt(color1.slice(5, 7), 16);
            const r2 = parseInt(color2.slice(1, 3), 16);
            const g2 = parseInt(color2.slice(3, 5), 16);
            const b2 = parseInt(color2.slice(5, 7), 16);
            
            const mix = Math.random() * 0.6 + 0.2;
            const nr = Math.round(r1 * (1 - mix) + r2 * mix);
            const ng = Math.round(g1 * (1 - mix) + g2 * mix);
            const nb = Math.round(b1 * (1 - mix) + b2 * mix);
            
            return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
        } catch (e) {
            return color1;
        }
    },

    // ============ 随机应用接口 ============

    /**
     * 应用随机配置到状态管理器 - 大和谐大综合大随机版本！
     */
    applyRandom() {
        const { config, strokes } = this.generate();
        
        StateManager.setState(config);
        this._syncUI(config);
        StateManager.replaceStrokes(strokes);
        
        if (StateManager.state.musicEnabled) {
            AudioEngine.setMusicTheme(config.musicTheme);
        }
        
        ParticleSystem.clear();
        
        // =========================
        // 🎉 大和谐：随机调用所有功能！
        // =========================
        
        // 🎨 随机画笔类型！
        const brushTypes = ['solid', 'dashed', 'dotted', 'spray'];
        const randomBrush = brushTypes[Math.floor(Math.random() * brushTypes.length)];
        StateManager.setState({ brushType: randomBrush });
        
        // ✨ 随机发光！50% 概率启用！
        const glowEnabled = Math.random() > 0.5;
        if (glowEnabled) {
            const glowColor = config.strokeColor;
            const glowBlur = 5 + Math.floor(Math.random() * 30);
            StateManager.setState({
                glowEnabled: true,
                glowColor: glowColor,
                glowBlur: glowBlur
            });
        } else {
            StateManager.setState({ glowEnabled: false });
        }
        
        // 🌈 随机彩虹模式！30% 概率！
        const rainbowEnabled = Math.random() > 0.7;
        StateManager.setState({ 
            rainbowMode: rainbowEnabled,
            rainbowHue: Math.random() * 360 
        });
        
        // 🎨 随机渐变画笔！35% 概率！
        const gradientEnabled = Math.random() > 0.65;
        if (gradientEnabled) {
            StateManager.setState({
                gradientEnabled: true,
                gradientFrom: config.strokeColor,
                gradientTo: config.glowColor || config.strokeColor
            });
        } else {
            StateManager.setState({ gradientEnabled: false });
        }
        
        // 🌊 随机拖尾模式！25% 概率！
        const trailEnabled = Math.random() > 0.75;
        StateManager.setState({ trailMode: trailEnabled });
        
        // 🎨 随机混合模式！
        const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'lighter'];
        if (Math.random() > 0.6) {
            const randomBlend = blendModes[Math.floor(Math.random() * blendModes.length)];
            StateManager.setState({ blendMode: randomBlend });
        }
        
        // 🎭 随机粒子特效！30% 概率（降低以优化性能）！
        if (Math.random() > 0.7 && typeof ParticleSystem !== 'undefined' && typeof ParticleSystem.emit === 'function') {
            ParticleSystem.clear();
            // 使用正确的粒子类型
            const particleTypes = ['firefly', 'spark', 'star', 'rainbow', 'butterfly', 'bubble', 'snow'];
            const randomParticleType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            
            // 设置粒子类型到状态
            StateManager.setState({ 
                particleType: randomParticleType,
                particleEnabled: true 
            });
            
            // 使用 emit 方法生成粒子（减少数量优化性能）
            const centerX = StateManager.state.canvasWidth / 2;
            const centerY = StateManager.state.canvasHeight / 2;
            const count = 20 + Math.floor(Math.random() * 30); // 减少粒子数量
            
            ParticleSystem.emit(centerX, centerY, count);
        }
        
        // ✨ 随机动画效果！40% 概率（降低以优化性能）！
        if (typeof AnimationController !== 'undefined') {
            const enableAnimation = Math.random() > 0.6;
            if (enableAnimation) {
                // 随机选择预设！
                const presets = ['breathing', 'floating', 'swirl', 'psychedelic', 'random'];
                const chosen = presets[Math.floor(Math.random() * presets.length)];
                
                if (chosen === 'breathing') {
                    AnimationController.presetBreathing();
                } else if (chosen === 'floating') {
                    AnimationController.presetFloating();
                } else if (chosen === 'swirl') {
                    AnimationController.presetSwirl();
                } else if (chosen === 'psychedelic') {
                    AnimationController.presetPsychedelic();
                } else {
                    AnimationController.randomize();
                }
                
                AnimationController.setEnabled(true);
                
                // 更新UI按钮状态！
                const btn = document.getElementById('animation-toggle');
                if (btn) {
                    btn.classList.add('active');
                    btn.textContent = '⏸ 动画';
                }
            } else {
                // 关闭动画！
                AnimationController.setEnabled(false);
                const btn = document.getElementById('animation-toggle');
                if (btn) {
                    btn.classList.remove('active');
                    btn.textContent = '▶ 动画';
                }
            }
        }
        
        // 🎵 随机音乐主题！30% 概率！
        if (Math.random() > 0.7 && typeof AudioEngine !== 'undefined') {
            const musicThemes = ['aurora', 'cyberpunk', 'forest', 'dreamscape'];
            const randomMusicTheme = musicThemes[Math.floor(Math.random() * musicThemes.length)];
            AudioEngine.setMusicTheme(randomMusicTheme);
            if (Math.random() > 0.5) {
                AudioEngine.toggleMusic(true);
            }
        }
        
        // 🎨 随机材质色板！50% 概率！
        if (typeof ColorPalette !== 'undefined' && Math.random() > 0.5) {
            const paletteNames = ['aurora', 'lava', 'deepsea', 'rainbowCandy', 'starryNight', 'neon', 'candy', 'retro'];
            const randomPaletteName = paletteNames[Math.floor(Math.random() * paletteNames.length)];
            StateManager.setState({ 
                materialPalette: randomPaletteName,
                colorScheme: 'triadic'
            });
        }
        
        // 📐 随机噪点背景！40% 概率！
        if (typeof NoiseGenerator !== 'undefined' && Math.random() > 0.6) {
            StateManager.setState({
                noiseSeed: Math.floor(Math.random() * 100000)
            });
        }
        
        const renderer = CanvasRenderer;
        if (renderer) {
            renderer.needRedrawOffscreen = true;
            renderer.render();
        }
        
        const paletteName = this.palettes.find(p => p.bg === config.bgColor && p.stroke === config.strokeColor)?.name;
        this._showRandomToast(config, paletteName);

        return { config, strokes };
    },

    /**
     * 获取当前使用的图案生成器名称
     */
    _getGeneratorName(config, strokes) {
        if (!strokes || strokes.length === 0) return '空白';
        
        const totalPoints = strokes.reduce((s, st) => s + st.length, 0);
        const avgPoints = totalPoints / strokes.length;
        const maxLen = Math.max(...strokes.map(s => s.length));
        const hasDecor = strokes.some(s => s._decor);
        const layerCount = new Set(strokes.filter(s => s._layer !== undefined).map(s => s._layer)).size;
        
        if (hasDecor) return layerCount > 2 ? '多层华彩' : '装饰艺术';
        if (strokes.length > 30) return '曼陀罗';
        if (strokes.some(s => s.length > 80)) return '黄金螺旋';
        if (strokes.length > 20 && avgPoints > 15) return '伊斯兰几何';
        if (strokes.length > 15 && strokes.some(s => s.length === 2)) return '分形树';
        if (strokes.length > 12 && avgPoints > 10) return '星轨';
        if (strokes.some(s => s.length > 50) && avgPoints > 25) return '波干涉';
        if (strokes.length > 25 && avgPoints < 5) return '镶嵌';
        if (strokes.length > 15) return '辐射爆裂';
        if (strokes.length > 10 && avgPoints < 8) return '星爆';
        if (strokes.length > 8 && avgPoints > 20) return '羽毛';
        if (maxLen > 40) return '螺旋波';
        if (maxLen > 20 && strokes.length < 6) return '涟漪';
        if (strokes.length > 6 && avgPoints < 6) return '锯齿射线';
        if (strokes.some(s => s.length === 2)) return '蕾丝';
        return '抽象艺术';
    },

    /**
     * 显示Toast提示 - 大和谐大综合版本！
     */
    _showRandomToast(config, paletteName) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        const patName = this._getGeneratorName(config, StateManager.state.strokes);
        const state = StateManager.state;
        
        // 收集所有激活的大和谐功能！
        const animated = typeof AnimationController !== 'undefined' && AnimationController.enabled;
        const hasParticles = state.strokes.length > 0;
        
        const parts = [
            paletteName ? `🎨 ${paletteName}` : null,
            patName ? `📐 ${patName}` : null,
            `${config.symmetryCount}${this._modeName(config.symmetryMode)}`,
            state.trailMode ? '🌊拖尾' : null,
            state.rainbowMode ? '🌈彩虹' : null,
            state.glowEnabled ? '✨发光' : null,
            config.decorativeEnabled ? '💎装饰' : null,
            config.borderEnabled ? '🖼️边框' : null,
            animated ? '🎉动画' : null,
            state.gradientEnabled ? '🖌️渐变' : null,
            state.materialPalette && state.materialPalette !== 'none' ? '🎭色板' : null,
            state.blendMode && state.blendMode !== 'normal' ? '🎨混合' : null,
            state.brushType && state.brushType !== 'solid' ? `✏️${this._brushName(state.brushType)}` : null
        ].filter(Boolean);

        // 随机表情！让每次都有惊喜！
        const emoji = ['🎊', '🎉', '✨', '🌈', '🔥', '💫', '🌟', '🎨'][Math.floor(Math.random() * 8)];
        
        const message = parts.join(' · ');
        toast.textContent = `${emoji} 大和谐: ${message}`;
        toast.classList.add('show');

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    },

    _brushName(type) {
        const names = { solid: '实线', dashed: '虚线', dotted: '点线', spray: '喷枪' };
        return names[type] || type;
    },

    _modeName(mode) {
        return { rotational: '旋转', mirror: '镜像', spiral: '螺旋' }[mode] || mode;
    },

    /**
     * 同步UI控件
     */
    _syncUI(config) {
        const syncMap = {
            'stroke-color': config.strokeColor,
            'stroke-width': config.strokeWidth,
            'bg-color': config.bgColor,
            'symmetry-count': config.symmetryCount,
            'rotation-speed': config.rotationSpeed,
            'symmetry-mode': config.symmetryMode,
            'brush-type': config.brushType,
            'glow-color': config.glowColor,
            'glow-blur': config.glowEnabled ? 12 : 5,
            'spiral-scale': config.spiralScale || 0,
            'music-theme': config.musicTheme,
            'particle-type': config.particleType
        };

        for (const [id, value] of Object.entries(syncMap)) {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') el.checked = value;
                else el.value = value;
            }
        }

        const label = document.getElementById('symmetry-count-label');
        if (label) label.textContent = config.symmetryCount;

        this._syncToggle('trail-toggle', config.trailMode);
        this._syncToggle('glow-toggle', config.glowEnabled);
        this._syncToggle('rainbow-toggle', config.rainbowMode);
        this._syncToggle('gradient-toggle', config.gradientEnabled);
        this._syncToggle('particle-toggle', config.particleEnabled);
    },

    _syncToggle(id, active) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', active);
    }
};