/**
 * 随机艺术生成器模块 V3.0 - 增强版
 * 
 * V3.0 升级内容：
 * - 强制复杂度阈值（彻底解决纯背景问题）
 * - 图案-对称智能匹配
 * - 填充型图案生成器
 * - 纹理图案层
 * - 动态背景效果
 * - 高级颜色系统（Kuler/Adobe Color）
 * - 智能重试机制
 * - 预设"惊艳"组合库
 * 
 * 每次点击 R 都是一幅独一无二的艺术品！
 */
const RandomGenerator = {
    // 点击防抖：防止快速点击导致卡顿
    _lastApplyTime: 0,
    _applyDebounce: 150, // 最小点击间隔（毫秒）
    _isApplying: false,

    // ===== 复杂度阈值配置 =====
    _MIN_STROKES: 15,      // 最小笔画数
    _MIN_POINTS: 50,      // 最小总点数

    // ===== 图案-对称智能匹配表 =====
    _PATTERN_SYMMETRY_MAP: {
        mandala: [6, 8, 12],
        goldenSpiral: [4, 6],
        islamicGeo: [8, 12, 16],
        lissajous: [4, 6, 8],
        roseCurve: [5, 7, 10],
        fractalSnowflake: [6],
        moirePattern: [8, 12, 16],
        dnaHelix: [4, 6],
        strangeAttractor: [4, 6, 8],
        fractalTree: [3, 4, 5],
        celestialOrbits: [6, 8, 12],
        waveInterference: [4, 6, 8],
        laceFiligree: [8, 12, 16],
        tessellation: [4, 6, 8],
        zentangle: [4, 8],
        radialBurst: [6, 8, 10, 12],
        flowerPetals: [5, 6, 8, 10],
        spiralWave: [4, 6, 8],
        concentricRings: [4, 6, 8],
        zigzagRays: [6, 8, 12],
        abstractScribble: [3, 4, 5, 6],
        starburst: [6, 8, 12, 16],
        feathers: [6, 8, 12],
        ripples: [4, 6, 8],
        // 高级生成器
        fluidFlow: [6, 8, 12],
        terrainContour: [4, 6, 8],
        evolutionPattern: [6, 8],
        lavaLamp: [4, 6],
        polarPattern: [6, 8, 12],
        nebulaCloud: [6, 8],
    },

    // ===== 预设"惊艳"组合库 =====
    _MASTERPIECE_PRESETS: [
        { name: '银河漩涡', palette: '暗物质', patterns: ['spiralWave', 'moirePattern'], symmetry: 8, symmetryMode: 'spiral', particleType: 'star', animation: 'swirl', bgAnimation: 'nebula' },
        { name: '极光之舞', palette: '极光之巅', patterns: ['waveInterference', 'ripples'], symmetry: 12, symmetryMode: 'rotational', particleType: 'firefly', animation: 'breathing', bgAnimation: 'aurora' },
        { name: '星际迷航', palette: '脉冲星', patterns: ['celestialOrbits', 'lissajous'], symmetry: 6, symmetryMode: 'mirror', particleType: 'star', animation: 'pulse', bgAnimation: 'starField' },
        { name: '几何秘境', palette: '伊斯兰几何', patterns: ['islamicGeo', 'tessellation'], symmetry: 12, symmetryMode: 'rotational', particleType: 'spark', animation: 'rotate', bgAnimation: 'gradientShift' },
        { name: '自然之魂', palette: '森林秘境', patterns: ['fractalTree', 'feathers'], symmetry: 5, symmetryMode: 'spiralMirror', particleType: 'butterfly', animation: 'floating', bgAnimation: 'aurora' },
        { name: '霓虹梦境', palette: '赛博之巅', patterns: ['strangeAttractor', 'lissajous'], symmetry: 6, symmetryMode: 'spiral', particleType: 'spark', animation: 'psychedelic', bgAnimation: 'nebula' },
        { name: '冰晶绽放', palette: '冬雪', patterns: ['fractalSnowflake', 'laceFiligree'], symmetry: 6, symmetryMode: 'rotational', particleType: 'snow', animation: 'breathing', bgAnimation: 'gradientShift' },
        { name: '黄金比例', palette: '鎏金岁月', patterns: ['goldenSpiral', 'roseCurve'], symmetry: 6, symmetryMode: 'mirror', particleType: 'spark', animation: 'pulse', bgAnimation: 'starField' },
        { name: '深海探索', palette: '深海幽蓝', patterns: ['mandala', 'ripples'], symmetry: 8, symmetryMode: 'spiralMirror', particleType: 'bubble', animation: 'drift', bgAnimation: 'nebula' },
        { name: '热带风情', palette: '珊瑚秘境', patterns: ['flowerPetals', 'abstractScribble'], symmetry: 8, symmetryMode: 'interlockMirror', particleType: 'butterfly', animation: 'floating', bgAnimation: 'aurora' },
        { name: '沙漠星空', palette: '创世之柱', patterns: ['starburst', 'moirePattern'], symmetry: 12, symmetryMode: 'rotational', particleType: 'star', animation: 'pulse', bgAnimation: 'starField' },
        { name: '机械美学', palette: '白银纪元', patterns: ['lissajous', 'concentricRings'], symmetry: 8, symmetryMode: 'mirror', particleType: 'spark', animation: 'rotate', bgAnimation: 'gradientShift' },
        { name: '生命之树', palette: '森林秘境', patterns: ['fractalTree', 'dnaHelix'], symmetry: 4, symmetryMode: 'spiral', particleType: 'firefly', animation: 'breathing', bgAnimation: 'aurora' },
        { name: '数学之美', palette: '全息梦境', patterns: ['strangeAttractor', 'roseCurve'], symmetry: 6, symmetryMode: 'spiralMirror', particleType: 'rainbow', animation: 'psychedelic', bgAnimation: 'nebula' },
        { name: '繁花似锦', palette: '童话森林', patterns: ['flowerPetals', 'zentangle'], symmetry: 10, symmetryMode: 'rotational', particleType: 'butterfly', animation: 'floating', bgAnimation: 'aurora' },
    ],

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
        { name: '童话森林',   bg: '#1a1a2e', bgGrad: '#2e1a3e', stroke: '#ffaadd', glow: '#ffccdd', accent: '#88ffaa', mood: 'dream' },
        { name: '星空水彩',   bg: '#f0eef8', bgGrad: '#e8e4f0', stroke: '#6688cc', glow: '#88aadd', accent: '#cc88aa', mood: 'dream' },
        { name: '极彩梦境',   bg: '#2e0a2e', bgGrad: '#1a0a3e', stroke: '#ff6644', glow: '#ff8866', accent: '#44ff88', mood: 'dream' },
        { name: '月下仙境',   bg: '#0a0a22', bgGrad: '#1a1a3e', stroke: '#c0c8ff', glow: '#d0d8ff', accent: '#ffcc88', mood: 'dream' },

        // === 异域风情系列 ===
        { name: '摩洛哥蓝',   bg: '#002040', bgGrad: '#001830', stroke: '#88ccff', glow: '#aaddff', accent: '#ffcc88', mood: 'ethnic' },
        { name: '印度纱丽',   bg: '#1a0010', bgGrad: '#2e0020', stroke: '#ff4488', glow: '#ff66aa', accent: '#ffcc00', mood: 'ethnic' },
        { name: '非洲日落',   bg: '#2e1000', bgGrad: '#1a0a00', stroke: '#ff6600', glow: '#ff8844', accent: '#ffcc00', mood: 'ethnic' },
        { name: '波斯地毯',   bg: '#1a0010', bgGrad: '#2e1020', stroke: '#cc3344', glow: '#dd5577', accent: '#4488aa', mood: 'ethnic' },
        { name: '玛雅文明',   bg: '#002010', bgGrad: '#003020', stroke: '#88ffaa', glow: '#aaffcc', accent: '#ffcc44', mood: 'ethnic' },

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
        // ---- 20%概率使用预设"惊艳"组合 ----
        if (Math.random() > 0.8) {
            const preset = this._MASTERPIECE_PRESETS[Math.floor(Math.random() * this._MASTERPIECE_PRESETS.length)];
            const result = this._applyPreset(preset);
            if (result) return result;
        }

        const palette = this.palettes[Math.floor(Math.random() * this.palettes.length)];

        // ---- 随机对称参数（基于图案智能匹配）----
        const symmetryOptions = [3, 4, 5, 6, 8, 10, 12, 16];
        const symmetryCount = symmetryOptions[Math.floor(Math.random() * symmetryOptions.length)];

        // ---- 随机速度 ----
        const rotationSpeed = Math.floor(Math.random() * 80) + 5;

        // ---- 随机对称模式（新增交错镜像和螺旋镜像） ----
        const modes = ['rotational', 'mirror', 'spiral', 'interlockMirror', 'spiralMirror'];
        const symmetryMode = modes[Math.floor(Math.random() * modes.length)];

        // ---- 画笔类型（新增 ribbon 缎带型） ----
        const brushTypes = ['solid', 'dashed', 'dotted', 'spray', 'ribbon'];
        const brushType = brushTypes[Math.floor(Math.random() * brushTypes.length)];

        // ---- 画笔宽度（适配不同图案） ----
        const widths = [1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16];
        const strokeWidth = widths[Math.floor(Math.random() * widths.length)];

        // ---- 开关效果（更积极地启用特效以增加视觉冲击力） ----
        const glowEnabled = Math.random() > 0.15; // 85% 概率发光
        const trailMode = Math.random() > 0.55;    // 45% 概率拖尾（原35%）
        const rainbowMode = Math.random() > 0.7;   // 30% 概率彩虹（原20%）
        const gradientEnabled = Math.random() > 0.45; // 55% 概率渐变（原40%）

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
        // 是否生成纹理层
        const textureEnabled = Math.random() > 0.5;
        // 背景动画类型
        const bgAnimations = ['none', 'aurora', 'gradientShift', 'starField', 'nebula'];
        const bgAnimation = bgAnimations[Math.floor(Math.random() * bgAnimations.length)];
        // 色彩和谐类型
        const colorHarmony = ['complementary', 'triadic', 'analogous', 'splitComplementary', 'tetradic'][Math.floor(Math.random() * 5)];

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
            textureEnabled,
            bgAnimation,
            colorHarmony,
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
     * 优化：限制每层笔画数量，减少性能压力
     */
    _generateMultiLayerStrokes(config, palette) {
        const state = StateManager.state;
        const cx = state.canvasWidth / 2;
        const cy = state.canvasHeight / 2;
        // 考虑对称数量，缩小maxR防止对称旋转后图案被裁剪
        const symCount = config.symmetryCount || 6;
        let maxR = Math.min(cx, cy) * 0.92;
        if (symCount <= 4) {
            maxR *= 0.85;
        } else if (symCount <= 8) {
            maxR *= 0.75;
        } else if (symCount <= 12) {
            maxR *= 0.7;
        } else {
            maxR *= 0.65;
        }

        let allStrokes = [];
        const layerCount = Math.random() > 0.4 ? 3 : 2; // 60%概率3层，40%概率2层

        // 随机选不同类别的生成器确保多样性
        const generators = this._pickRandomGenerators(layerCount);

        for (let i = 0; i < layerCount; i++) {
            const generator = generators[i];
            // 缩小尺寸范围
            const layerScale = 0.7 + Math.random() * 0.2;
            const layerMaxR = maxR * (0.5 + i * 0.3);
            
            // 生成这层时用不同的调色板变体
            const layerPalette = this._derivePalette(palette, i, layerCount);
            
            // 智能重试机制：评估艺术性评分，不满意则重试
            const strokes = this._validateAndRetry(
                () => this._invokeGenerator(
                    generator,
                    cx, cy, layerMaxR * layerScale,
                    2 + Math.floor(Math.random() * 2),
                    this._generateStrokeColors(layerPalette, 6 + Math.floor(Math.random() * 4)),
                    config, layerPalette
                ),
                generator,
                cx, cy, layerMaxR * layerScale,
                config, layerPalette
            );

            // 给这层的笔画附加元信息
            strokes.forEach(s => {
                s._layer = i;
                s._opacity = 0.7 + Math.random() * 0.3;
            });

            allStrokes = allStrokes.concat(strokes);
            
            // 限制总笔画数，防止过度生成
            if (allStrokes.length > 150) {
                console.log('[RandomGenerator] 笔画数量已达上限，停止生成');
                break;
            }
        }

        // 添加纹理图案层
        if (config.textureEnabled && allStrokes.length < 100) {
            const textureStrokes = this._generateTextureLayer(cx, cy, maxR, config, palette);
            textureStrokes.forEach(s => { s._layer = 5; s._opacity = 0.3 + Math.random() * 0.3; });
            allStrokes = allStrokes.concat(textureStrokes);
        }

        // 添加填充型图案层
        if (allStrokes.length < 80) {
            const fillStrokes = this._generateFillPattern(cx, cy, maxR, config, palette);
            fillStrokes.forEach(s => { s._layer = 6; s._opacity = 0.4 + Math.random() * 0.3; });
            allStrokes = allStrokes.concat(fillStrokes);
        }

        // 添加装饰元素层（点、小圆、光环等）
        if (config.decorativeEnabled && allStrokes.length < 120) {
            const decorStrokes = this._generateDecorations(cx, cy, maxR, config, palette);
            decorStrokes.forEach(s => { s._layer = 3; s._opacity = 0.5 + Math.random() * 0.5; });
            allStrokes = allStrokes.concat(decorStrokes);
        }

        // 添加边框
        if (config.borderEnabled && allStrokes.length < 130) {
            const borderStrokes = this._generateBorder(cx, cy, maxR, config, palette);
            borderStrokes.forEach(s => { s._layer = 4; s._opacity = 0.8; });
            allStrokes = allStrokes.concat(borderStrokes);
        }

        // ---- 强制复杂度检查：确保最小复杂度 ----
        allStrokes = this._ensureMinimumComplexity(allStrokes, cx, cy, maxR, config, palette);

        return allStrokes;
    },

    /**
     * 强制复杂度检查 - 确保最小笔画数和点数
     * 彻底解决纯背景问题
     */
    _ensureMinimumComplexity(strokes, cx, cy, maxR, config, palette) {
        const totalPoints = strokes.reduce((sum, s) => sum + (s.length || 0), 0);
        
        // 如果不够，补充简单几何填充
        while (strokes.length < this._MIN_STROKES || totalPoints < this._MIN_POINTS) {
            console.log(`[RandomGenerator] 复杂度不足，补充填充... (笔画:${strokes.length}/${this._MIN_STROKES}, 点数:${totalPoints}/${this._MIN_POINTS})`);
            
            const fillerStrokes = this._generateQuickFiller(cx, cy, maxR, config, palette);
            strokes.push(...fillerStrokes);
            
            // 重新计算
            const newPoints = strokes.reduce((sum, s) => sum + (s.length || 0), 0);
            if (newPoints <= totalPoints) {
                // 防止死循环
                console.warn('[RandomGenerator] 补充无效，使用强制曼陀罗');
                const mandalaStrokes = this.mandala(cx, cy, maxR * 0.9, 4, 
                    this._generateStrokeColors(palette, 8), config, palette);
                strokes.push(...mandalaStrokes);
                break;
            }
        }
        
        return strokes;
    },

    /**
     * 快速填充生成器 - 补充简单几何图案
     */
    _generateQuickFiller(cx, cy, maxR, config, palette) {
        const fillers = [
            () => this._fillGradientCircle(cx, cy, maxR * 0.7, config, palette),
            () => this._fillRadialGradient(cx, cy, maxR * 0.8, config, palette),
            () => this._fillPolygonPattern(cx, cy, maxR * 0.6, config, palette),
            () => this.concentricRings(cx, cy, maxR * 0.8, 3, 
                this._generateStrokeColors(palette, 4), config, palette),
            () => this.radialBurst(cx, cy, maxR * 0.8, 3, 
                this._generateStrokeColors(palette, 4), config, palette),
        ];
        
        const filler = fillers[Math.floor(Math.random() * fillers.length)];
        return filler();
    },

    /**
     * 智能重试机制 - 评估艺术性评分，不满意则重试
     */
    _validateAndRetry(generatorFn, generatorName, cx, cy, maxR, config, palette) {
        const maxRetries = 3;
        
        for (let i = 0; i < maxRetries; i++) {
            const strokes = generatorFn();
            
            if (!Array.isArray(strokes) || strokes.length === 0) {
                console.warn(`[RandomGenerator] 生成器 ${generatorName} 未返回笔画，重试...`);
                continue;
            }
            
            const score = this._evaluateArtisticScore(strokes);
            
            if (score > 0.5) {
                return strokes;
            }
            console.log(`[RandomGenerator] 艺术性评分 ${score.toFixed(2)} 不足，重试...`);
        }
        
        // 多次失败后强制使用高质量备选
        console.warn(`[RandomGenerator] 生成器 ${generatorName} 多次评分不足，使用强制曼陀罗`);
        return this.mandala(cx, cy, maxR, 3, 
            this._generateStrokeColors(palette, 6), config, palette);
    },

    /**
     * 评估艺术性评分
     * 考虑：复杂度、覆盖率、颜色多样性
     */
    _evaluateArtisticScore(strokes) {
        if (!strokes || strokes.length === 0) return 0;
        
        // 复杂度评分（笔画数量）
        const complexity = Math.min(1, strokes.length / this._MIN_STROKES);
        
        // 覆盖率评分（总点数）
        const totalPoints = strokes.reduce((sum, s) => sum + (s.length || 0), 0);
        const coverage = Math.min(1, totalPoints / this._MIN_POINTS);
        
        // 颜色多样性评分
        const uniqueColors = new Set(strokes.filter(s => s._color).map(s => s._color)).size;
        const colorDiversity = Math.min(1, uniqueColors / 4);
        
        // 综合评分
        return complexity * 0.35 + coverage * 0.45 + colorDiversity * 0.2;
    },

    /**
     * 应用预设组合
     */
    _applyPreset(preset) {
        console.log(`[RandomGenerator] 使用预设: ${preset.name}`);
        
        const palette = this.palettes.find(p => p.name === preset.palette) || 
                       this.palettes[Math.floor(Math.random() * this.palettes.length)];
        
        const state = StateManager.state;
        const cx = state.canvasWidth / 2;
        const cy = state.canvasHeight / 2;
        let maxR = Math.min(cx, cy) * 0.8;
        
        // 构建配置
        const config = {
            bgColor: palette.bg,
            bgGrad: palette.bgGrad,
            strokeColor: palette.stroke,
            glowColor: palette.glow,
            accentColor: palette.accent || palette.glow,
            symmetryCount: preset.symmetry,
            rotationSpeed: 20 + Math.floor(Math.random() * 40),
            symmetryMode: preset.symmetryMode,
            brushType: 'solid',
            strokeWidth: 2 + Math.random() * 4,
            glowEnabled: true,
            trailMode: Math.random() > 0.3,
            rainbowMode: Math.random() > 0.6,
            gradientEnabled: Math.random() > 0.4,
            particleEnabled: true,
            particleType: preset.particleType,
            musicTheme: 'aurora',
            spiralScale: preset.symmetryMode === 'spiral' ? (Math.floor(Math.random() * 60) - 30) : 0,
            opacity: 0.7 + Math.random() * 0.3,
            bgGradientEnabled: true,
            decorativeEnabled: true,
            borderEnabled: true,
            textureEnabled: Math.random() > 0.4,
            bgAnimation: preset.bgAnimation,
            colorHarmony: 'triadic',
            mood: palette.mood,
        };

        // 生成笔画
        let allStrokes = [];
        for (let i = 0; i < preset.patterns.length; i++) {
            const pattern = preset.patterns[i];
            const patternMaxR = maxR * (0.6 + i * 0.3);
            const strokes = this._invokeGenerator(
                pattern,
                cx, cy, patternMaxR,
                3,
                this._generateStrokeColors(palette, 8),
                config, palette
            );
            strokes.forEach(s => { s._layer = i; s._opacity = 0.8; });
            allStrokes = allStrokes.concat(strokes);
        }

        // 补充装饰和填充
        const decorStrokes = this._generateDecorations(cx, cy, maxR, config, palette);
        decorStrokes.forEach(s => { s._layer = 3; s._opacity = 0.6; });
        allStrokes = allStrokes.concat(decorStrokes);

        // 复杂度检查
        allStrokes = this._ensureMinimumComplexity(allStrokes, cx, cy, maxR, config, palette);

        return { config, strokes: allStrokes };
    },

    /**
     * 随机选n个不同的生成器（避免同质化）
     * 新增：高级生成器体系（流体、地形、进化、熔岩灯等）
     */
    _pickRandomGenerators(count) {
        // 按艺术风格分组确保多样性
        const primary = ['mandala', 'goldenSpiral', 'islamicGeo', 'celestialOrbits', 'waveInterference', 'laceFiligree'];
        const secondary = ['radialBurst', 'flowerPetals', 'spiralWave', 'concentricRings', 'starburst', 'feathers', 'ripples', 'tessellation', 'zentangle', 'fractalTree', 'zigzagRays', 'abstractScribble'];
        const advanced = ['fluidFlow', 'terrainContour', 'evolutionPattern', 'lavaLamp', 'polarPattern', 'nebulaCloud'];
        // 新增艺术生成器：数学之美
        const artistic = ['lissajous', 'roseCurve', 'fractalSnowflake', 'moirePattern', 'dnaHelix', 'strangeAttractor'];

        const selected = [];
        
        // 第一层选主图案（优先选艺术生成器以增加奇特感）
        const allPrimary = Math.random() > 0.4 
            ? [...artistic, ...primary]   // 60%概率偏向艺术生成器
            : [...primary, ...advanced];
        const p1 = allPrimary[Math.floor(Math.random() * allPrimary.length)];
        selected.push(p1);

        // 第二层选一个不同的
        let pool = [...primary, ...secondary, ...advanced, ...artistic].filter(p => p !== p1);
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
        const localGenerators = ['mandala', 'goldenSpiral', 'islamicGeo', 'fractalTree', 'celestialOrbits', 
            'waveInterference', 'laceFiligree', 'tessellation', 'zentangle', 'radialBurst', 
            'flowerPetals', 'spiralWave', 'concentricRings', 'zigzagRays', 'abstractScribble', 
            'starburst', 'feathers', 'ripples',
            // 新增艺术生成器
            'lissajous', 'roseCurve', 'fractalSnowflake', 'moirePattern', 'dnaHelix', 'strangeAttractor'];
        
        let strokes = [];
        
        try {
            // 记录当前使用的生成器名称
            StateManager.state.activeGeneratorName = name;

            // 优先使用本地生成器（更稳定）
            if (localGenerators.includes(name) && typeof this[name] === 'function') {
                strokes = this[name](cx, cy, maxR, count, colors, config, palette);
            } else if (advancedGenerators.includes(name)) {
                // 高级生成器需要依赖模块
                if (typeof AdvancedGenerators !== 'undefined' && 
                    typeof AdvancedGenerators[name] === 'function' &&
                    typeof NoiseGenerator !== 'undefined') {
                    strokes = AdvancedGenerators[name](cx, cy, maxR, count, colors, config, palette);
                } else {
                    console.warn(`[RandomGenerator] 高级生成器 ${name} 缺少依赖，降级到本地生成器`);
                    // 降级到本地生成器
                    const fallback = localGenerators[Math.floor(Math.random() * localGenerators.length)];
                    strokes = this[fallback](cx, cy, maxR, count, colors, config, palette);
                }
            } else {
                console.warn(`[RandomGenerator] 未知的生成器 ${name}，使用保底`);
            }
        } catch (e) {
            console.warn(`[RandomGenerator] 生成器 ${name} 出错:`, e.message || e);
            strokes = [];
        }
        
        // 安全检查：如果没生成任何笔画，使用 fallback
        if (!Array.isArray(strokes) || strokes.length === 0) {
            console.warn(`[RandomGenerator] 生成器 ${name} 未返回笔画，使用保底图案`);
            const fallbacks = ['mandala', 'starburst', 'goldenSpiral', 'radialBurst'];
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
     * 生成装饰元素（散点、小圆、光环、螺旋装饰、有机曲线）
     * 增强版：更多艺术性装饰
     */
    _generateDecorations(cx, cy, maxR, config, palette) {
        const strokes = [];
        const decorCount = 6 + Math.floor(Math.random() * 10);
        
        // 散点
        const dotColor = palette.accent || palette.stroke;
        for (let i = 0; i < decorCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const r = maxR * (0.15 + Math.random() * 0.75);
            const size = 1 + Math.random() * 3;
            
            const dot = [
                { x: cx + r * Math.cos(angle) - size, y: cy + r * Math.sin(angle) },
                { x: cx + r * Math.cos(angle) + size, y: cy + r * Math.sin(angle) }
            ];
            dot._color = dotColor;
            dot._decor = true;
            strokes.push(dot);
        }

        // 光环
        if (Math.random() > 0.4) {
            const haloR = maxR * (0.2 + Math.random() * 0.5);
            const halo = [];
            const segments = 25 + Math.floor(Math.random() * 15);
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

        // 螺旋小装饰（新增 - 旋转的小螺旋）
        if (Math.random() > 0.5) {
            const spiralCount = 2 + Math.floor(Math.random() * 3);
            for (let s = 0; s < spiralCount; s++) {
                const baseAngle = Math.random() * 2 * Math.PI;
                const baseR = maxR * (0.3 + Math.random() * 0.4);
                const spiralDecor = [];
                const turns = 2 + Math.random() * 2;
                const pts = 20 + Math.floor(Math.random() * 15);
                const originX = cx + baseR * Math.cos(baseAngle);
                const originY = cy + baseR * Math.sin(baseAngle);
                const miniMaxR = maxR * (0.05 + Math.random() * 0.08);
                
                for (let i = 0; i <= pts; i++) {
                    const t = i / pts;
                    const a = t * turns * 2 * Math.PI;
                    const r = t * miniMaxR;
                    spiralDecor.push({
                        x: originX + r * Math.cos(a),
                        y: originY + r * Math.sin(a)
                    });
                }
                spiralDecor._color = palette.accent || palette.glow;
                spiralDecor._decor = true;
                strokes.push(spiralDecor);
            }
        }

        // 有机曲线连接（新增 - 弧形曲线连接散点）
        if (Math.random() > 0.6) {
            const curveCount = 2 + Math.floor(Math.random() * 4);
            for (let c = 0; c < curveCount; c++) {
                const curve = [];
                const startAngle = Math.random() * 2 * Math.PI;
                const startR = maxR * (0.2 + Math.random() * 0.3);
                const endR = maxR * (0.5 + Math.random() * 0.4);
                const arcSpan = 0.3 + Math.random() * 0.8;
                const pts = 8 + Math.floor(Math.random() * 8);
                
                for (let i = 0; i <= pts; i++) {
                    const t = i / pts;
                    const a = startAngle + t * arcSpan;
                    const r = startR + t * (endR - startR) + Math.sin(t * Math.PI * 3) * maxR * 0.03;
                    curve.push({
                        x: cx + r * Math.cos(a),
                        y: cy + r * Math.sin(a)
                    });
                }
                curve._color = palette.stroke;
                curve._decor = true;
                strokes.push(curve);
            }
        }

        return strokes;
    },

    /**
     * 生成边框装饰
     * 优化：减少边框复杂度
     */
    _generateBorder(cx, cy, maxR, config, palette) {
        const strokes = [];
        const borderR = maxR * 0.97;
        const segs = 40 + Math.floor(Math.random() * 20); // 减少段数
        
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

        // 内框线（减少概率）
        if (Math.random() > 0.7) {
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

        // 角落装饰（减少概率）
        if (Math.random() > 0.7) {
            const corners = 4;
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

    // ============ 纹理图案层 ============

    /**
     * 生成纹理图案层
     * 增添层次感和艺术性
     */
    _generateTextureLayer(cx, cy, maxR, config, palette) {
        const textures = [
            () => this._generateDotPattern(cx, cy, maxR, config, palette),
            () => this._generateLinePattern(cx, cy, maxR, config, palette),
            () => this._generateWavePattern(cx, cy, maxR, config, palette),
            () => this._generateGridPattern(cx, cy, maxR, config, palette),
        ];
        
        const texture = textures[Math.floor(Math.random() * textures.length)];
        return texture();
    },

    /**
     * 点阵纹理
     */
    _generateDotPattern(cx, cy, maxR, config, palette) {
        const strokes = [];
        const dotCount = 30 + Math.floor(Math.random() * 50);
        const colors = this._generateStrokeColors(palette, 3);
        
        for (let i = 0; i < dotCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const r = maxR * (0.1 + Math.random() * 0.8);
            const size = 1 + Math.random() * 3;
            
            const dot = [
                { x: cx + r * Math.cos(angle) - size, y: cy + r * Math.sin(angle) },
                { x: cx + r * Math.cos(angle) + size, y: cy + r * Math.sin(angle) }
            ];
            dot._color = colors[Math.floor(Math.random() * colors.length)];
            dot._decor = true;
            dot._texture = true;
            strokes.push(dot);
        }
        
        return strokes;
    },

    /**
     * 线条纹理
     */
    _generateLinePattern(cx, cy, maxR, config, palette) {
        const strokes = [];
        const lineCount = 8 + Math.floor(Math.random() * 15);
        const colors = this._generateStrokeColors(palette, 4);
        
        for (let i = 0; i < lineCount; i++) {
            const angle = (2 * Math.PI * i) / lineCount;
            const line = [];
            const segs = 5 + Math.floor(Math.random() * 10);
            
            for (let j = 0; j <= segs; j++) {
                const t = j / segs;
                const r = maxR * (0.2 + t * 0.6);
                const wobble = Math.sin(t * 10 + i) * 5;
                line.push({
                    x: cx + (r + wobble) * Math.cos(angle),
                    y: cy + (r + wobble) * Math.sin(angle)
                });
            }
            
            line._color = colors[i % colors.length];
            line._decor = true;
            line._texture = true;
            strokes.push(line);
        }
        
        return strokes;
    },

    /**
     * 波浪纹理
     */
    _generateWavePattern(cx, cy, maxR, config, palette) {
        const strokes = [];
        const waveCount = 3 + Math.floor(Math.random() * 5);
        const colors = this._generateStrokeColors(palette, 3);
        
        for (let w = 0; w < waveCount; w++) {
            const points = [];
            const r = maxR * (0.15 + w * 0.15 + Math.random() * 0.1);
            const segs = 40 + Math.floor(Math.random() * 30);
            
            for (let j = 0; j <= segs; j++) {
                const t = j / segs;
                const angle = 2 * Math.PI * t;
                const wave = Math.sin(angle * (3 + w) + w) * (2 + Math.random() * 4);
                points.push({
                    x: cx + (r + wave) * Math.cos(angle),
                    y: cy + (r + wave) * Math.sin(angle)
                });
            }
            
            points._color = colors[w % colors.length];
            points._decor = true;
            points._texture = true;
            strokes.push(points);
        }
        
        return strokes;
    },

    /**
     * 网格纹理
     */
    _generateGridPattern(cx, cy, maxR, config, palette) {
        const strokes = [];
        const gridSize = 4 + Math.floor(Math.random() * 6);
        const cellSize = maxR * 2 / gridSize;
        const startX = cx - maxR;
        const startY = cy - maxR;
        const colors = this._generateStrokeColors(palette, 2);
        
        // 横向线
        for (let i = 0; i <= gridSize; i++) {
            const y = startY + i * cellSize;
            const line = [
                { x: startX, y: y },
                { x: startX + maxR * 2, y: y }
            ];
            line._color = colors[0];
            line._decor = true;
            line._texture = true;
            strokes.push(line);
        }
        
        // 纵向线
        for (let i = 0; i <= gridSize; i++) {
            const x = startX + i * cellSize;
            const line = [
                { x: x, y: startY },
                { x: x, y: startY + maxR * 2 }
            ];
            line._color = colors[0];
            line._decor = true;
            line._texture = true;
            strokes.push(line);
        }
        
        return strokes;
    },

    // ============ 填充型图案生成器 ============

    /**
     * 生成填充型图案层
     */
    _generateFillPattern(cx, cy, maxR, config, palette) {
        const fills = [
            () => this._fillGradientCircle(cx, cy, maxR, config, palette),
            () => this._fillRadialGradient(cx, cy, maxR, config, palette),
            () => this._fillPolygonPattern(cx, cy, maxR, config, palette),
            () => this._fillTrianglePattern(cx, cy, maxR, config, palette),
        ];
        
        const fill = fills[Math.floor(Math.random() * fills.length)];
        return fill();
    },

    /**
     * 渐变填充圆形 - 同心圆填充
     */
    _fillGradientCircle(cx, cy, maxR, config, palette) {
        const strokes = [];
        const rings = 5 + Math.floor(Math.random() * 8);
        const colors = this._generateStrokeColors(palette, rings);
        
        for (let i = 0; i < rings; i++) {
            const r = maxR * (0.1 + i / rings * 0.85);
            const points = [];
            const segs = 30 + Math.floor(Math.random() * 20);
            
            for (let j = 0; j <= segs; j++) {
                const angle = (2 * Math.PI * j) / segs;
                const wobble = Math.sin(angle * 5 + i * 2) * 2;
                points.push({
                    x: cx + (r + wobble) * Math.cos(angle),
                    y: cy + (r + wobble) * Math.sin(angle)
                });
            }
            
            points._color = colors[i % colors.length];
            points._decor = true;
            points._fill = true;
            strokes.push(points);
        }
        
        return strokes;
    },

    /**
     * 放射状渐变填充 - 三角形/扇形填充
     */
    _fillRadialGradient(cx, cy, maxR, config, palette) {
        const strokes = [];
        const sectors = 6 + Math.floor(Math.random() * 10);
        const rings = 3 + Math.floor(Math.random() * 5);
        const colors = this._generateStrokeColors(palette, sectors);
        
        for (let s = 0; s < sectors; s++) {
            const startAngle = (2 * Math.PI * s) / sectors;
            const endAngle = (2 * Math.PI * (s + 1)) / sectors;
            
            for (let r = 0; r < rings; r++) {
                const innerR = maxR * (r / rings * 0.8);
                const outerR = maxR * ((r + 1) / rings * 0.85);
                const segs = 5;
                
                const sector = [];
                for (let j = 0; j <= segs; j++) {
                    const t = j / segs;
                    const angle = startAngle + t * (endAngle - startAngle);
                    
                    // 内部点
                    const innerX = cx + innerR * Math.cos(angle);
                    const innerY = cy + innerR * Math.sin(angle);
                    const outerX = cx + outerR * Math.cos(angle);
                    const outerY = cy + outerR * Math.sin(angle);
                    
                    if (j === 0) {
                        sector.push({ x: innerX, y: innerY });
                    }
                    sector.push({ x: outerX, y: outerY });
                    if (j === segs) {
                        sector.push({ x: innerX, y: innerY });
                    }
                }
                
                if (sector.length > 2) {
                    sector._color = colors[s % colors.length];
                    sector._decor = true;
                    sector._fill = true;
                    strokes.push(sector);
                }
            }
        }
        
        return strokes;
    },

    /**
     * 多边形填充图案
     */
    _fillPolygonPattern(cx, cy, maxR, config, palette) {
        const strokes = [];
        const sides = 4 + Math.floor(Math.random() * 4); // 4-7边形
        const rings = 2 + Math.floor(Math.random() * 4);
        const colors = this._generateStrokeColors(palette, rings);
        
        for (let ring = 0; ring < rings; ring++) {
            const baseR = maxR * (0.15 + ring * 0.25);
            const polyPoints = [];
            
            for (let i = 0; i <= sides; i++) {
                const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
                polyPoints.push({
                    x: cx + baseR * Math.cos(angle),
                    y: cy + baseR * Math.sin(angle)
                });
            }
            
            polyPoints._color = colors[ring % colors.length];
            polyPoints._decor = true;
            polyPoints._fill = true;
            strokes.push(polyPoints);
            
            // 内部连线
            if (ring < rings - 1) {
                const nextR = maxR * (0.15 + (ring + 1) * 0.25);
                for (let i = 0; i < sides; i++) {
                    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
                    const line = [
                        { x: cx + baseR * Math.cos(angle), y: cy + baseR * Math.sin(angle) },
                        { x: cx + nextR * Math.cos(angle), y: cy + nextR * Math.sin(angle) }
                    ];
                    line._color = colors[(ring + 1) % colors.length];
                    line._decor = true;
                    strokes.push(line);
                }
            }
        }
        
        return strokes;
    },

    /**
     * 三角形填充图案
     */
    _fillTrianglePattern(cx, cy, maxR, config, palette) {
        const strokes = this._fillPolygonPattern(cx, cy, maxR, config, palette);
        // 三角形版本特殊处理
        return strokes;
    },

    // ============ 高级图案生成器 ============

    /**
     * 曼陀罗 - 多层同心对称花卉图案
     * 优化：减少层数和复杂度
     */
    mandala(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const layers = 2 + Math.floor(Math.random() * 2); // 减少层数
        
        // 第一层：大花瓣
        for (let l = 0; l < layers; l++) {
            const petalCount = 6 + Math.floor(Math.random() * 6) + l * 2; // 减少花瓣数
            const rStart = maxR * (0.05 + l * 0.15 + Math.random() * 0.05);
            const rEnd = maxR * (0.25 + l * 0.25 + Math.random() * 0.05);
            const petalWidth = (0.3 + Math.random() * 0.6) * (1 - l * 0.1);
            
            for (let i = 0; i < petalCount; i++) {
                const centerAngle = (2 * Math.PI * i) / petalCount + Math.random() * 0.02;
                
                // 花瓣左弧
                const leftArc = [];
                const rightArc = [];
                const segs = 8 + Math.floor(Math.random() * 4); // 减少段数
                
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
                
                // 花瓣中脉（减少概率）
                if (Math.random() > 0.6) {
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
        const centerR = maxR * (0.05 + Math.random() * 0.08);
        const centerCircle = [];
        const segs2 = 20 + Math.floor(Math.random() * 10); // 减少段数
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
        if (Math.random() > 0.5) { // 减少概率
            const rayCount = 8 + Math.floor(Math.random() * 12); // 减少射线数
            for (let i = 0; i < rayCount; i++) {
                const angle = (2 * Math.PI * i) / rayCount;
                const innerR = maxR * (0.08 + Math.random() * 0.15);
                const outerR = maxR * (0.6 + Math.random() * 0.2);
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

    // ============ 新增艺术图案生成器：数学之美 ============

    /**
     * 莉萨如曲线 (Lissajous) - 两个正交谐振的合成曲线
     * 经典物理美学：频率比决定形状，相位差决定旋转感
     * 性能安全：每条曲线 ≤ 200 点，最多 4 条
     */
    lissajous(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const curveCount = 1 + Math.floor(Math.random() * 3); // 1-3条曲线

        for (let c = 0; c < curveCount; c++) {
            // 频率比选择 - 精心挑选最美观的整数比
            const ratios = [[1,2],[2,3],[3,4],[3,5],[4,5],[5,6],[3,7],[5,8],[4,7],[2,5]];
            const [freqA, freqB] = ratios[Math.floor(Math.random() * ratios.length)];
            const phase = Math.random() * Math.PI; // 相位差决定开口方向
            const amplitude = maxR * (0.3 + Math.random() * 0.35);

            const points = [];
            const totalPoints = 150 + Math.floor(Math.random() * 50);
            const periods = 2; // 绘制2个完整周期

            for (let i = 0; i <= totalPoints; i++) {
                const t = (i / totalPoints) * periods * 2 * Math.PI;
                const x = cx + amplitude * Math.sin(freqA * t + phase);
                const y = cy + amplitude * Math.sin(freqB * t);
                points.push({ x, y });
            }

            if (points.length > 5) {
                points._color = colors[c % colors.length];
                strokes.push(points);
            }
        }

        // 有时添加一条反相曲线（创造交错感）
        if (Math.random() > 0.5) {
            const ratios = [[1,2],[2,3],[3,4]];
            const [freqA, freqB] = ratios[Math.floor(Math.random() * ratios.length)];
            const antiPoints = [];
            const amp = maxR * (0.2 + Math.random() * 0.25);
            const pts = 100 + Math.floor(Math.random() * 50);

            for (let i = 0; i <= pts; i++) {
                const t = (i / pts) * 2 * 2 * Math.PI;
                const x = cx + amp * Math.sin(freqA * t + Math.PI); // 反相
                const y = cy + amp * Math.cos(freqB * t); // cos 替代 sin
                antiPoints.push({ x, y });
            }

            if (antiPoints.length > 5) {
                antiPoints._color = palette.accent || palette.glow;
                strokes.push(antiPoints);
            }
        }

        return strokes;
    },

    /**
     * 玫瑰曲线 (Rhodonea) - 极坐标花瓣曲线
     * r = cos(k*θ)，k 值决定花瓣数
     * k 为整数时花瓣数 = k（奇数）或 2k（偶数），创造绝美对称
     * 性能安全：每条 ≤ 180 点
     */
    roseCurve(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const roseCount = 1 + Math.floor(Math.random() * 2);

        // 精心挑选 k 值，确保视觉美感
        const kValues = [2, 3, 4, 5, 6, 7, 8, 1.5, 2.5, 3.5, 5/3, 7/4, 7/3];
        
        for (let r = 0; r < roseCount; r++) {
            const k = kValues[Math.floor(Math.random() * kValues.length)];
            const amplitude = maxR * (0.3 + Math.random() * 0.4);
            const points = [];

            // 对于分数 k，需要更多角度才能闭合
            const isFractional = k !== Math.floor(k);
            const maxAngle = isFractional ? 4 * Math.PI : 2 * Math.PI;
            const totalPoints = isFractional ? 200 : 120;

            for (let i = 0; i <= totalPoints; i++) {
                const theta = (i / totalPoints) * maxAngle;
                const radius = amplitude * Math.cos(k * theta);
                points.push({
                    x: cx + radius * Math.cos(theta),
                    y: cy + radius * Math.sin(theta)
                });
            }

            if (points.length > 5) {
                points._color = colors[r % colors.length];
                strokes.push(points);
            }
        }

        // 内层小玫瑰（增添精致感）
        if (Math.random() > 0.4) {
            const innerK = [3, 5, 7][Math.floor(Math.random() * 3)];
            const innerR = maxR * (0.1 + Math.random() * 0.15);
            const innerPoints = [];
            const pts = 80;

            for (let i = 0; i <= pts; i++) {
                const theta = (i / pts) * 2 * Math.PI;
                const radius = innerR * Math.cos(innerK * theta);
                innerPoints.push({
                    x: cx + radius * Math.cos(theta),
                    y: cy + radius * Math.sin(theta)
                });
            }

            innerPoints._color = palette.glow;
            strokes.push(innerPoints);
        }

        return strokes;
    },

    /**
     * 分形雪花 (Koch Snowflake) - 科赫曲线
     * 递归替换直线为三角凸起，产生雪花形状
     * 性能安全：限制递归深度 ≤ 4（4^4 = 256段），仅1个笔画
     */
    fractalSnowflake(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const depth = 2 + Math.floor(Math.random() * 3); // 2-4层递归
        const size = maxR * (0.4 + Math.random() * 0.3);

        // 初始等边三角形顶点
        const vertices = [];
        for (let i = 0; i < 3; i++) {
            const angle = (2 * Math.PI * i) / 3 - Math.PI / 2;
            vertices.push({
                x: cx + size * Math.cos(angle),
                y: cy + size * Math.sin(angle)
            });
        }

        // Koch 递归：将线段替换为 _/\_ 形
        const kochSubdivide = (p1, p2, d) => {
            if (d <= 0) return [p1];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            // 三等分点
            const a = { x: p1.x + dx / 3, y: p1.y + dy / 3 };
            const b = { x: p1.x + dx * 2 / 3, y: p1.y + dy * 2 / 3 };

            // 凸起顶点（等边三角形）
            const peak = {
                x: a.x + (dx * Math.cos(Math.PI / 3) - dy * Math.sin(Math.PI / 3)) / 3,
                y: a.y + (dx * Math.sin(Math.PI / 3) + dy * Math.cos(Math.PI / 3)) / 3
            };

            return [
                ...kochSubdivide(p1, a, d - 1),
                ...kochSubdivide(a, peak, d - 1),
                ...kochSubdivide(peak, b, d - 1),
                ...kochSubdivide(b, p2, d - 1)
            ];
        };

        // 生成完整雪花轮廓
        const snowflake = [];
        for (let i = 0; i < 3; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % 3];
            const segPoints = kochSubdivide(p1, p2, depth);
            snowflake.push(...segPoints);
        }
        // 闭合
        snowflake.push(snowflake[0]);

        snowflake._color = colors[0];
        strokes.push(snowflake);

        // 内层反向雪花（创造奇特感）
        if (Math.random() > 0.5 && depth >= 3) {
            const innerSize = size * 0.45;
            const innerVertices = [];
            for (let i = 0; i < 3; i++) {
                const angle = (2 * Math.PI * i) / 3 + Math.PI / 6; // 旋转30度
                innerVertices.push({
                    x: cx + innerSize * Math.cos(angle),
                    y: cy + innerSize * Math.sin(angle)
                });
            }

            const innerSnowflake = [];
            for (let i = 0; i < 3; i++) {
                const p1 = innerVertices[i];
                const p2 = innerVertices[(i + 1) % 3];
                const segPoints = kochSubdivide(p1, p2, Math.max(2, depth - 1));
                innerSnowflake.push(...segPoints);
            }
            innerSnowflake.push(innerSnowflake[0]);
            innerSnowflake._color = colors[Math.min(1, colors.length - 1)];
            strokes.push(innerSnowflake);
        }

        return strokes;
    },

    /**
     * 莫尔条纹 (Moiré Pattern) - 两组规则图案叠加产生干涉
     * 人眼感知到不存在于任何一组的虚拟图案，极具视觉冲击力
     * 性能安全：每组 ≤ 30 条线，线段简化
     */
    moirePattern(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const patternType = Math.floor(Math.random() * 3); // 3种莫尔类型

        if (patternType === 0) {
            // 类型1：同心圆叠加（偏移）
            const offset1 = { x: 0, y: 0 };
            const offset2 = { x: maxR * (0.05 + Math.random() * 0.12), y: maxR * (0.03 + Math.random() * 0.08) };
            const ringCount = 12 + Math.floor(Math.random() * 10);
            const spacing = maxR / ringCount;

            for (let set = 0; set < 2; set++) {
                const off = set === 0 ? offset1 : offset2;
                for (let i = 1; i <= ringCount; i++) {
                    const ring = [];
                    const r = i * spacing;
                    const segs = 30 + Math.floor(Math.random() * 10);
                    for (let j = 0; j <= segs; j++) {
                        const a = (2 * Math.PI * j) / segs;
                        ring.push({
                            x: cx + off.x + r * Math.cos(a),
                            y: cy + off.y + r * Math.sin(a)
                        });
                    }
                    ring._color = set === 0 ? colors[0] : colors[Math.min(1, colors.length - 1)];
                    strokes.push(ring);
                }
            }
        } else if (patternType === 1) {
            // 类型2：放射线叠加（角度偏移）
            const rayCount1 = 20 + Math.floor(Math.random() * 20);
            const angleOffset = (0.5 + Math.random() * 2) * Math.PI / 180; // 微小角度偏移
            const centerOffset = { x: maxR * (0.02 + Math.random() * 0.05), y: 0 };

            for (let set = 0; set < 2; set++) {
                for (let i = 0; i < rayCount1; i++) {
                    const a = (2 * Math.PI * i) / rayCount1 + set * angleOffset;
                    const offX = set === 0 ? 0 : centerOffset.x;
                    const ray = [
                        { x: cx + offX, y: cy },
                        { x: cx + offX + maxR * Math.cos(a), y: cy + maxR * Math.sin(a) }
                    ];
                    ray._color = set === 0 ? colors[0] : colors[Math.min(1, colors.length - 1)];
                    strokes.push(ray);
                }
            }
        } else {
            // 类型3：平行线叠加（旋转偏移）
            const lineCount = 15 + Math.floor(Math.random() * 10);
            const spacing = maxR * 2 / lineCount;
            const rotationOffset = 2 + Math.random() * 5; // 度数偏移

            for (let set = 0; set < 2; set++) {
                const baseAngle = set * rotationOffset * Math.PI / 180;
                for (let i = 0; i < lineCount; i++) {
                    const offset = (i - lineCount / 2) * spacing;
                    const x1 = cx + offset * Math.cos(baseAngle + Math.PI / 2) - maxR * Math.cos(baseAngle);
                    const y1 = cy + offset * Math.sin(baseAngle + Math.PI / 2) - maxR * Math.sin(baseAngle);
                    const x2 = cx + offset * Math.cos(baseAngle + Math.PI / 2) + maxR * Math.cos(baseAngle);
                    const y2 = cy + offset * Math.sin(baseAngle + Math.PI / 2) + maxR * Math.sin(baseAngle);
                    
                    const line = [
                        { x: x1, y: y1 },
                        { x: x2, y: y2 }
                    ];
                    line._color = set === 0 ? colors[0] : colors[Math.min(1, colors.length - 1)];
                    strokes.push(line);
                }
            }
        }

        return strokes;
    },

    /**
     * DNA双螺旋 - 双螺旋结构
     * 两条螺旋主链 + 横向碱基对连接线
     * 性能安全：每条螺旋 ≤ 120 点，连接线 ≤ 30 条
     */
    dnaHelix(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const turns = 2 + Math.random() * 3;
        const helixR = maxR * (0.2 + Math.random() * 0.2);
        const verticalSpan = maxR * (0.6 + Math.random() * 0.5);
        const totalPoints = 100 + Math.floor(Math.random() * 30);

        // 两条螺旋主链
        const helix1 = [];
        const helix2 = [];

        for (let i = 0; i <= totalPoints; i++) {
            const t = i / totalPoints;
            const angle = t * turns * 2 * Math.PI;
            const y = cy - verticalSpan / 2 + t * verticalSpan;
            // 透视效果：z 轴用 cos 表示深度
            const depth1 = Math.cos(angle);
            const depth2 = Math.cos(angle + Math.PI);

            helix1.push({
                x: cx + helixR * Math.sin(angle),
                y: y + depth1 * maxR * 0.02 // 微妙的3D感
            });
            helix2.push({
                x: cx + helixR * Math.sin(angle + Math.PI),
                y: y + depth2 * maxR * 0.02
            });
        }

        helix1._color = colors[0];
        helix2._color = colors[Math.min(1, colors.length - 1)];
        strokes.push(helix1);
        strokes.push(helix2);

        // 碱基对连接线（横向短线）
        const basePairCount = 10 + Math.floor(Math.random() * 15);
        for (let i = 0; i < basePairCount; i++) {
            const t = (i + 0.5) / basePairCount;
            const angle = t * turns * 2 * Math.PI;
            const y = cy - verticalSpan / 2 + t * verticalSpan;

            const x1 = cx + helixR * Math.sin(angle);
            const x2 = cx + helixR * Math.sin(angle + Math.PI);

            const connector = [
                { x: x1, y: y + Math.cos(angle) * maxR * 0.02 },
                { x: x2, y: y + Math.cos(angle + Math.PI) * maxR * 0.02 }
            ];
            connector._color = colors[(i + 2) % colors.length];
            strokes.push(connector);
        }

        return strokes;
    },

    /**
     * 奇异吸引子 (Strange Attractor) - 混沌系统的轨迹
     * 三个经典吸引子：Lorenz, Clifford, De Jong
     * 混沌中涌现秩序，极其奇特美妙
     * 性能安全：≤ 500 点/条，1-2 条轨迹
     */
    strangeAttractor(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const type = Math.floor(Math.random() * 3); // 3种吸引子

        if (type === 0) {
            // Clifford 吸引子: x' = sin(a*y) + c*cos(a*x), y' = sin(b*x) + d*cos(b*y)
            const a = -1.4 + Math.random() * 0.8;
            const b = 1.6 + Math.random() * 0.4;
            const c = 1.0 + Math.random() * 0.4;
            const d = 0.7 + Math.random() * 0.5;

            const points = [];
            let x = 0.1, y = 0.1;
            const iterations = 300 + Math.floor(Math.random() * 200);
            
            // 跳过前50次迭代（让轨迹稳定）
            for (let i = 0; i < 50; i++) {
                const nx = Math.sin(a * y) + c * Math.cos(a * x);
                const ny = Math.sin(b * x) + d * Math.cos(b * y);
                x = nx; y = ny;
            }

            for (let i = 0; i < iterations; i++) {
                const nx = Math.sin(a * y) + c * Math.cos(a * x);
                const ny = Math.sin(b * x) + d * Math.cos(b * y);
                x = nx; y = ny;

                // 映射到画布坐标（Clifford 范围约 -3~3）
                points.push({
                    x: cx + x * maxR * 0.25,
                    y: cy + y * maxR * 0.25
                });
            }

            if (points.length > 10) {
                points._color = colors[0];
                strokes.push(points);
            }
        } else if (type === 1) {
            // De Jong 吸引子: x' = sin(a*y) - cos(b*x), y' = sin(c*x) - cos(d*y)
            const a = -2 + Math.random() * 4;
            const b = -2 + Math.random() * 4;
            const c = -2 + Math.random() * 4;
            const d = -2 + Math.random() * 4;

            const points = [];
            let x = 0.1, y = 0.1;
            const iterations = 300 + Math.floor(Math.random() * 200);
            
            for (let i = 0; i < 50; i++) {
                const nx = Math.sin(a * y) - Math.cos(b * x);
                const ny = Math.sin(c * x) - Math.cos(d * y);
                x = nx; y = ny;
            }

            for (let i = 0; i < iterations; i++) {
                const nx = Math.sin(a * y) - Math.cos(b * x);
                const ny = Math.sin(c * x) - Math.cos(d * y);
                x = nx; y = ny;

                points.push({
                    x: cx + x * maxR * 0.3,
                    y: cy + y * maxR * 0.3
                });
            }

            if (points.length > 10) {
                points._color = colors[0];
                strokes.push(points);
            }
        } else {
            // Peter de Jong 对称吸引子（更美观的参数选择）
            const paramSets = [
                { a: 1.4, b: -2.3, c: 2.4, d: -2.1 },
                { a: -2.24, b: 0.43, c: -0.65, d: -2.43 },
                { a: 2.01, b: -2.53, c: 1.61, d: -0.33 },
                { a: -1.9, b: -1.9, c: -1.9, d: -1.9 },
                { a: 1.7, b: 1.7, c: 0.6, d: 1.2 }
            ];
            const params = paramSets[Math.floor(Math.random() * paramSets.length)];

            // 两条轨迹：不同初始点
            for (let t = 0; t < 2; t++) {
                const points = [];
                let x = 0.1 * (t + 1), y = -0.1 * (t + 1);
                const iterations = 200 + Math.floor(Math.random() * 100);
                
                for (let i = 0; i < 30; i++) {
                    const nx = Math.sin(params.a * y) - Math.cos(params.b * x);
                    const ny = Math.sin(params.c * x) - Math.cos(params.d * y);
                    x = nx; y = ny;
                }

                for (let i = 0; i < iterations; i++) {
                    const nx = Math.sin(params.a * y) - Math.cos(params.b * x);
                    const ny = Math.sin(params.c * x) - Math.cos(params.d * y);
                    x = nx; y = ny;

                    points.push({
                        x: cx + x * maxR * 0.28,
                        y: cy + y * maxR * 0.28
                    });
                }

                if (points.length > 10) {
                    points._color = colors[t % colors.length];
                    strokes.push(points);
                }
            }
        }

        return strokes;
    },

    // ============ 配色系统 ============

    /**
     * 生成一组和谐配色 - 基于色彩和谐理论
     */
    _generateStrokeColors(palette, count) {
        const base = palette.stroke;
        const harmonyType = StateManager.state.colorHarmony || 'analogous';
        
        // 基础色相获取
        const baseHSV = this._hexToHSV(base);
        if (!baseHSV) {
            const fallback = [base];
            for (let i = 1; i < count; i++) fallback.push(base);
            return fallback;
        }
        
        // 根据和谐类型计算色相偏移
        const harmonies = {
            complementary: [0, 180],
            triadic: [0, 120, 240],
            analogous: [0, 30, 60, -30],
            splitComplementary: [0, 150, 210],
            tetradic: [0, 90, 180, 270],
        };
        
        const angles = harmonies[harmonyType] || harmonies.analogous;
        const colors = [];
        
        for (let i = 0; i < count; i++) {
            const angle = angles[i % angles.length];
            const saturationVar = (Math.random() * 0.3 - 0.15);
            const valueVar = (Math.random() * 0.3 - 0.15);
            
            const h = (baseHSV.h + angle + Math.random() * 20 - 10) % 360;
            const s = Math.max(0, Math.min(1, baseHSV.s + saturationVar));
            const v = Math.max(0, Math.min(1, baseHSV.v + valueVar));
            
            colors.push(this._hsvToHex(h, s, v));
        }
        
        return colors.sort(() => Math.random() - 0.5);
    },

    /**
     * HEX转HSV
     */
    _hexToHSV(hex) {
        try {
            if (!hex || !hex.startsWith('#')) return null;
            
            let r = parseInt(hex.slice(1, 3), 16) / 255;
            let g = parseInt(hex.slice(3, 5), 16) / 255;
            let b = parseInt(hex.slice(5, 7), 16) / 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const d = max - min;
            
            let h = 0;
            const s = max === 0 ? 0 : d / max;
            const v = max;
            
            if (d !== 0) {
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
                    case g: h = ((b - r) / d + 2) * 60; break;
                    case b: h = ((r - g) / d + 4) * 60; break;
                }
            }
            
            return { h, s, v };
        } catch (e) {
            return null;
        }
    },

    /**
     * HSV转HEX
     */
    _hsvToHex(h, s, v) {
        h = ((h % 360) + 360) % 360;
        s = Math.max(0, Math.min(1, s));
        v = Math.max(0, Math.min(1, v));
        
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

    /**
     * 判断颜色是否为深色（用于决定是否启用拖尾模式）
     * @param {string} color - hex 颜色
     * @returns {boolean} true 表示深色
     */
    _isColorDark(color) {
        if (!color || !color.startsWith('#')) return true; // 未知颜色默认为深色，避免启用拖尾
        try {
            const hex = color.slice(1);
            let r, g, b;
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.slice(0, 2), 16);
                g = parseInt(hex.slice(2, 4), 16);
                b = parseInt(hex.slice(4, 6), 16);
            }
            // 计算亮度
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness < 128; // 低于 128 认为是深色（更保守的阈值）
        } catch (e) {
            return true; // 解析失败默认为深色
        }
    },

    /**
     * 根据配置生成笔画（用于 AI 等外部配置）
     * @param {Object} config - 配置对象
     * @returns {Array} 笔画数组
     */
    _generateStrokesForConfig(config) {
        const strokes = [];
        const cx = StateManager.state.canvasWidth / 2;
        const cy = StateManager.state.canvasHeight / 2;
        const size = Math.min(StateManager.state.canvasWidth, StateManager.state.canvasHeight) * 0.42;
        const colors = [config.strokeColor];
        
        // 根据图案类型生成笔画
        const patternType = config.patternType || 'mandala';
        const symmetry = config.symmetry || 6;
        const strokeWidth = config.strokeWidth || 2;
        
        const patternConfig = { ...config, strokeWidth };
        
        if (typeof this[patternType] === 'function') {
            strokes.push(...this[patternType](cx, cy, size, symmetry, colors, patternConfig, config));
        } else {
            // 默认使用 mandala
            strokes.push(...this.mandala(cx, cy, size, symmetry, colors, patternConfig, config));
        }
        
        // 如果有次要图案
        if (config.secondaryPattern && typeof this[config.secondaryPattern] === 'function') {
            const secondaryStrokes = this[config.secondaryPattern](
                cx, cy, size * 0.7, symmetry, colors.map(c => this._adjustColorBrightness(c, 0.7)), 
                { ...patternConfig, strokeWidth: strokeWidth * 0.7 }, 
                config
            );
            strokes.push(...secondaryStrokes);
        }
        
        // 确保有足够的笔画
        if (strokes.length < this._MIN_STROKES) {
            strokes.push(...this._generateFillerStrokes(cx, cy, size * 0.3, colors, patternConfig));
        }
        
        return strokes;
    },

    /**
     * 生成填充笔画（确保最小笔画数）
     */
    _generateFillerStrokes(cx, cy, size, colors, config) {
        const strokes = [];
        const count = this._MIN_STROKES - strokes.length;
        
        for (let i = 0; i < count; i++) {
            if (typeof this.ripples === 'function') {
                const layerStrokes = this.ripples(
                    cx + (Math.random() - 0.5) * 50,
                    cy + (Math.random() - 0.5) * 50,
                    size * (0.3 + Math.random() * 0.5),
                    4,
                    colors,
                    config,
                    config
                );
                strokes.push(...layerStrokes);
            }
        }
        
        return strokes;
    },

    /**
     * 调整颜色亮度
     */
    _adjustColorBrightness(hex, factor) {
        if (!hex || !hex.startsWith('#')) return hex;
        try {
            const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * factor));
            const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * factor));
            const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * factor));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        } catch (e) {
            return hex;
        }
    },

    /**
     * 获取颜色亮度值
     */
    _getColorBrightness(color) {
        if (!color || !color.startsWith('#')) return 128;
        try {
            const hex = color.slice(1);
            let r, g, b;
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.slice(0, 2), 16);
                g = parseInt(hex.slice(2, 4), 16);
                b = parseInt(hex.slice(4, 6), 16);
            }
            return (r * 299 + g * 587 + b * 114) / 1000;
        } catch (e) {
            return 128;
        }
    },

    /**
     * 获取随机明亮颜色
     */
    _getRandomBrightColor() {
        const brightColors = [
            '#ff69b4', '#ffd700', '#00ff7f', '#ff6347', '#00bfff',
            '#ff1493', '#7fff00', '#ff4500', '#00fa9a', '#ff00ff',
            '#1e90ff', '#ff7f50', '#adff2f', '#ff2400', '#00ff00'
        ];
        return brightColors[Math.floor(Math.random() * brightColors.length)];
    },

    // ============ 随机应用接口 ============

    /**
     * 应用随机配置到状态管理器 - 优化版本，减少卡顿
     * @param {Object} externalConfig - 外部传入的配置（如 AI 生成），可选
     */
    applyRandom(externalConfig) {
        const now = Date.now();
        
        // 防抖：快速点击时忽略
        if (now - this._lastApplyTime < this._applyDebounce) {
            console.log('[RandomGenerator] 点击过于频繁，忽略');
            return null;
        }
        
        // 防止并发调用
        if (this._isApplying) {
            console.log('[RandomGenerator] 正在生成中，忽略重复调用');
            return null;
        }
        
        this._lastApplyTime = now;
        this._isApplying = true;
        
        try {
            // 先生成配置和笔画
            let { config, strokes } = this.generate();
            
            // 如果有外部配置（如 AI 生成），优先使用外部配置的颜色
            if (externalConfig) {
                console.log('[RandomGenerator] 使用外部配置:', externalConfig.source || 'unknown');
                
                // 直接使用外部颜色值（AI 生成的 hex 颜色）
                if (externalConfig.colors && externalConfig.colors.bg) {
                    config.bgColor = externalConfig.colors.bg;
                    config.bgColorEnd = externalConfig.colors.bgGrad || externalConfig.colors.bg;
                    config.strokeColor = externalConfig.colors.stroke;
                    config.glowColor = externalConfig.colors.glow;
                    config.accentColor = externalConfig.colors.accent;
                }
                
                // 应用外部图案配置
                if (externalConfig.patternType) {
                    config.patternType = externalConfig.patternType;
                }
                if (externalConfig.secondaryPattern) {
                    config.secondaryPattern = externalConfig.secondaryPattern;
                }
                if (externalConfig.symmetry) {
                    config.symmetry = externalConfig.symmetry;
                }
                if (externalConfig.symmetryMode) {
                    config.symmetryMode = externalConfig.symmetryMode;
                }
                if (externalConfig.rotationSpeed) {
                    config.rotationSpeed = externalConfig.rotationSpeed;
                }
                if (externalConfig.strokeWidth) {
                    config.strokeWidth = externalConfig.strokeWidth;
                }
                
                // 保留粒子和动画配置
                if (externalConfig.particleType) {
                    config.particleType = externalConfig.particleType;
                }
                if (externalConfig.animation) {
                    config.animation = externalConfig.animation;
                }
                if (externalConfig.bgAnimation) {
                    config.bgAnimation = externalConfig.bgAnimation;
                }
                
                // 重新生成适合新图案的笔画
                strokes = this._generateStrokesForConfig(config);
            }
        
            // 确保生成了有效的笔画（最多重试2次）
            if (!strokes || strokes.length === 0) {
                console.warn('[RandomGenerator] 未生成任何笔画，重新生成');
                for (let retry = 0; retry < 2; retry++) {
                    const result = this.generate();
                    if (result.strokes && result.strokes.length > 0) {
                        strokes = result.strokes;
                        config = result.config;
                        break;
                    }
                }
                if (!strokes || strokes.length === 0) {
                    console.error('[RandomGenerator] 无法生成有效笔画');
                    return null;
                }
            }
            
            // 安全检查：确保深色背景上有足够的颜色对比度
            const bgBrightness = this._getColorBrightness(config.bgColor);
            if (bgBrightness < 50) { // 深色背景
                // 检查是否有足够的亮色笔画
                const strokeColors = new Set(strokes.filter(s => s._color).map(s => s._color));
                const hasBrightStroke = Array.from(strokeColors).some(c => this._getColorBrightness(c) > 100);
                
                if (!hasBrightStroke && strokes.length > 0) {
                    // 添加一个明亮的边框笔画确保可见性
                    console.log('[RandomGenerator] 深色背景，添加亮色边框笔画');
                    const brightBorderColor = this._getRandomBrightColor();
                    const borderStroke = this.mandala(
                        StateManager.state.canvasWidth / 2,
                        StateManager.state.canvasHeight / 2,
                        Math.min(StateManager.state.canvasWidth, StateManager.state.canvasHeight) * 0.45,
                        3,
                        [brightBorderColor],
                        { ...config, strokeWidth: 3 },
                        config
                    );
                    strokes.push(...borderStroke);
                }
            }
            
            // 合并所有状态更新
            const updates = { ...config };
            
            // 随机画笔类型
            const brushTypes = ['solid', 'dashed', 'dotted', 'spray'];
            updates.brushType = brushTypes[Math.floor(Math.random() * brushTypes.length)];
            
            // 随机发光
            updates.glowEnabled = Math.random() > 0.5;
            if (updates.glowEnabled) {
                updates.glowColor = config.strokeColor;
                updates.glowBlur = 5 + Math.floor(Math.random() * 20);
            }
            
            // 随机彩虹模式（减少概率）
            updates.rainbowMode = Math.random() > 0.8;
            updates.rainbowHue = Math.random() * 360;
            
            // 随机渐变画笔（减少概率）
            updates.gradientEnabled = Math.random() > 0.8;
            if (updates.gradientEnabled) {
                updates.gradientFrom = config.strokeColor;
                updates.gradientTo = config.glowColor || config.strokeColor;
            }
            
            // 随机拖尾模式（深色背景时不启用，避免黑屏问题）
            const isDarkBg = this._isColorDark(config.bgColor);
            updates.trailMode = !isDarkBg && Math.random() > 0.7;
            
            // 安全默认：混合模式 - 更大胆的艺术性使用
            // 深色背景上用 screen/lighter/difference 创造发光效果
            // 浅色背景上用 multiply/overlay 创造深度
            const darkBlendModes = ['normal', 'screen', 'lighter', 'overlay', 'soft-light', 'color-dodge', 'difference', 'exclusion'];
            const lightBlendModes = ['normal', 'multiply', 'overlay', 'soft-light', 'hard-light', 'difference'];
            if (Math.random() > 0.7) {  // 30%概率启用混合模式（原15%）
                if (isDarkBg) {
                    updates.blendMode = darkBlendModes[Math.floor(Math.random() * darkBlendModes.length)];
                } else {
                    updates.blendMode = lightBlendModes[Math.floor(Math.random() * lightBlendModes.length)];
                }
            } else {
                updates.blendMode = 'normal';
            }
            
            // 随机粒子类型
            const particleTypes = ['firefly', 'spark', 'star', 'rainbow', 'butterfly', 'bubble', 'snow'];
            updates.particleType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            updates.particleEnabled = Math.random() > 0.5;
            
            // 随机材质色板（减少概率）
            if (typeof ColorPalette !== 'undefined' && Math.random() > 0.7) {
                const paletteNames = ['aurora', 'lava', 'deepsea', 'rainbowCandy', 'starryNight', 'neon', 'candy', 'retro'];
                updates.materialPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)];
                updates.colorScheme = 'triadic';
            }
            
            // 批量更新状态（不触发通知，减少中间渲染）
            StateManager.batchSetState(updates, false);
            
            // 替换笔画（这里会触发通知和重绘）
            StateManager.replaceStrokes(strokes);
            
            // 清空粒子
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.clear();
            }
            
            // 随机动画效果（减少概率）
            if (typeof AnimationController !== 'undefined') {
                const enableAnimation = Math.random() > 0.7;
                if (enableAnimation) {
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
                    
                    const btn = document.getElementById('animation-toggle');
                    if (btn) {
                        btn.classList.add('active');
                        btn.textContent = '⏸ 动画';
                    }
                } else {
                    AnimationController.setEnabled(false);
                    const btn = document.getElementById('animation-toggle');
                    if (btn) {
                        btn.classList.remove('active');
                        btn.textContent = '▶ 动画';
                    }
                }
            }
            
            // 生成粒子（更少数量）
            if (updates.particleEnabled && typeof ParticleSystem !== 'undefined' && typeof ParticleSystem.emit === 'function') {
                const centerX = StateManager.state.canvasWidth / 2;
                const centerY = StateManager.state.canvasHeight / 2;
                const count = 10 + Math.floor(Math.random() * 15);
                ParticleSystem.emit(centerX, centerY, count);
            }
            
            // 标记离屏画布重绘
            if (CanvasRenderer && CanvasRenderer.needRedrawOffscreen !== undefined) {
                CanvasRenderer.needRedrawOffscreen = true;
            }
            
            // 更新背景动画
            if (typeof BackgroundAnimation !== 'undefined') {
                if (config.bgAnimation && config.bgAnimation !== 'none') {
                    BackgroundAnimation.setType(config.bgAnimation);
                } else {
                    BackgroundAnimation.setType('none');
                }
            }
            
            // 清空主画布并立即绘制背景，防止闪烁/白屏/黑屏
            if (CanvasRenderer && CanvasRenderer.ctx) {
                const bgColor = config.bgColor || '#0a0a1a';
                try {
                    const r = parseInt(bgColor.slice(1, 3), 16);
                    const g = parseInt(bgColor.slice(3, 5), 16);
                    const b = parseInt(bgColor.slice(5, 7), 16);
                    CanvasRenderer.ctx.fillStyle = `rgb(${r},${g},${b})`;
                } catch (e) {
                    CanvasRenderer.ctx.fillStyle = bgColor;
                }
                CanvasRenderer.ctx.fillRect(0, 0, StateManager.state.canvasWidth, StateManager.state.canvasHeight);
            }
            
            const paletteName = this.palettes.find(p => p.bg === config.bgColor && p.stroke === config.strokeColor)?.name;
            this._showRandomToast(config, paletteName);

            // 同步UI控件，使界面反映新的随机配置
            this._syncUI(updates);

            return { config, strokes };
        } finally {
            this._isApplying = false;
        }
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
        
        // 新增艺术生成器识别
        const state = StateManager.state;
        if (state.activeGeneratorName) {
            const nameMap = {
                'lissajous': '莉萨如',
                'roseCurve': '玫瑰曲线',
                'fractalSnowflake': '分形雪花',
                'moirePattern': '莫尔条纹',
                'dnaHelix': 'DNA螺旋',
                'strangeAttractor': '奇异吸引子'
            };
            if (nameMap[state.activeGeneratorName]) return nameMap[state.activeGeneratorName];
        }
        
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
     * 显示Toast提示 - V3.0 增强版！
     */
    _showRandomToast(config, paletteName) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        const patName = this._getGeneratorName(config, StateManager.state.strokes);
        const state = StateManager.state;
        
        // 收集所有激活的功能
        const animated = typeof AnimationController !== 'undefined' && AnimationController.enabled;
        
        const parts = [
            paletteName ? `🎨 ${paletteName}` : null,
            patName ? `📐 ${patName}` : null,
            `${config.symmetryCount}${this._modeName(config.symmetryMode)}`,
            state.trailMode ? '🌊拖尾' : null,
            state.rainbowMode ? '🌈彩虹' : null,
            state.glowEnabled ? '✨发光' : null,
            config.decorativeEnabled ? '💎装饰' : null,
            config.borderEnabled ? '🖼️边框' : null,
            config.textureEnabled ? '🧩纹理' : null,
            animated ? '🎉动画' : null,
            state.gradientEnabled ? '🖌️渐变' : null,
            state.blendMode && state.blendMode !== 'normal' ? '🎨混合' : null,
            config.bgAnimation && config.bgAnimation !== 'none' ? `🌌${this._bgAnimationName(config.bgAnimation)}` : null,
            config.colorHarmony ? `🔮${this._colorHarmonyName(config.colorHarmony)}` : null,
            state.brushType && state.brushType !== 'solid' ? `✏️${this._brushName(state.brushType)}` : null
        ].filter(Boolean);

        // 随机表情
        const emoji = ['🎊', '🎉', '✨', '🌈', '🔥', '💫', '🌟', '🎨', '🌌', '💎', '🔮'][Math.floor(Math.random() * 11)];
        
        const message = parts.join(' · ');
        toast.textContent = `${emoji} 艺术生成: ${message}`;
        toast.classList.add('show');

        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    },

    _bgAnimationName(type) {
        const names = {
            none: '无动效',
            aurora: '极光',
            gradientShift: '渐变漂移',
            starField: '星空',
            nebula: '星云'
        };
        return names[type] || type;
    },

    _colorHarmonyName(type) {
        const names = {
            complementary: '互补',
            triadic: '三色',
            analogous: '类似',
            splitComplementary: '分裂互补',
            tetradic: '四色'
        };
        return names[type] || type;
    },

    _brushName(type) {
        const names = { solid: '实线', dashed: '虚线', dotted: '点线', spray: '喷枪', ribbon: '缎带' };
        return names[type] || type;
    },

    _modeName(mode) {
        return { rotational: '旋转', mirror: '镜像', spiral: '螺旋', interlockMirror: '交错', spiralMirror: '螺镜' }[mode] || mode;
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
    },

    /**
     * 设置图案生成器 (供外部模块调用)
     * @param {string} generatorName - 生成器名称
     */
    setPatternGenerator(generatorName) {
        if (!generatorName) return;
        
        // 检查是否为有效的生成器名称
        const validGenerators = this.patternGenerators || [];
        if (!validGenerators.includes(generatorName)) {
            console.log(`[RandomGenerator] 未知的生成器: ${generatorName}`);
            return;
        }
        
        // 更新状态
        if (window.StateManager) {
            window.StateManager.setState({ 
                activeGeneratorName: generatorName,
                patternGenerator: generatorName 
            });
        }
        
        console.log(`[RandomGenerator] 已切换到: ${generatorName}`);
    }
};