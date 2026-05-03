/**
 * 颜色调色板与配色系统模块
 * 提供：材质调色板、色彩方案、颜色抖动、高级渐变生成
 * V3.0 新增：HSL 色轮配色系统、20+ 材质色板、色相旋转/饱和度/明度控制
 * 无外部依赖，所有颜色均用 hex 或 hsl 字符串表示
 */
const ColorPalette = {
    // ============ 材质调色板（20+ 套） ============
    // 每种材质包含一组和谐配色 + 背景色 + 发光色
    
    palettes: {
        // ----- 原有 12 套 -----
        aurora: {
            name: '极光', bg: '#0a0a2e', bgGrad: '#1a1a4e',
            colors: ['#00ff88', '#00d4ff', '#7b68ee', '#ff69b4', '#ffd700'],
            stroke: '#00ff88', glow: '#00d4ff', accent: '#7b68ee', mood: 'futuristic'
        },
        lava: {
            name: '熔岩', bg: '#1a0000', bgGrad: '#3a1000',
            colors: ['#ff4500', '#ff6347', '#ffd700', '#ff8c00', '#ff0000'],
            stroke: '#ff4500', glow: '#ff6347', accent: '#ffd700', mood: 'intense'
        },
        deepsea: {
            name: '深海', bg: '#000814', bgGrad: '#001233',
            colors: ['#0066ff', '#00ccff', '#00ffcc', '#6699ff', '#0033cc'],
            stroke: '#00ccff', glow: '#0066ff', accent: '#00ffcc', mood: 'calm'
        },
        rainbowCandy: {
            name: '彩虹糖', bg: '#1a1a2e', bgGrad: '#2a2a4e',
            colors: ['#ff006e', '#ffbe0b', '#3a86ff', '#8338ec', '#fb5607', '#00bbf9'],
            stroke: '#ffbe0b', glow: '#ff006e', accent: '#3a86ff', mood: 'playful'
        },
        starryNight: {
            name: '星空', bg: '#0a0a1a', bgGrad: '#1a1a3a',
            colors: ['#ffffff', '#ffd700', '#00d4ff', '#ff69b4', '#c0c0ff'],
            stroke: '#ffffff', glow: '#ffd700', accent: '#00d4ff', mood: 'dreamy'
        },
        neon: {
            name: '霓虹', bg: '#0a0a0a', bgGrad: '#1a0a1a',
            colors: ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0000'],
            stroke: '#ff00ff', glow: '#00ffff', accent: '#ffff00', mood: 'cyber'
        },
        candy: {
            name: '糖果', bg: '#1a0a1a', bgGrad: '#2a1a2a',
            colors: ['#ff69b4', '#ff1493', '#ffb6c1', '#ffc0cb', '#da70d6'],
            stroke: '#ff69b4', glow: '#ff1493', accent: '#da70d6', mood: 'sweet'
        },
        retro: {
            name: '复古', bg: '#2a1a0a', bgGrad: '#3a2a1a',
            colors: ['#d4a574', '#c08552', '#a0692e', '#8b4513', '#d2b48c'],
            stroke: '#d4a574', glow: '#c08552', accent: '#a0692e', mood: 'vintage'
        },
        cyber: {
            name: '赛博', bg: '#001a1a', bgGrad: '#0a2a2a',
            colors: ['#00ffcc', '#ff00ff', '#00ff00', '#ffff00', '#ff6600'],
            stroke: '#00ffcc', glow: '#ff00ff', accent: '#00ff00', mood: 'cyber'
        },
        ink: {
            name: '水墨', bg: '#f5f0e8', bgGrad: '#e8e0d0',
            colors: ['#2c2c2c', '#4a4a4a', '#6b6b6b', '#8c8c8c', '#1a1a1a'],
            stroke: '#2c2c2c', glow: '#6b6b6b', accent: '#4a4a4a', mood: 'elegant'
        },
        forest: {
            name: '森林', bg: '#0a1a0a', bgGrad: '#1a2a1a',
            colors: ['#2d8a4e', '#45b168', '#7bc96e', '#a8d8a8', '#5a9e6f'],
            stroke: '#45b168', glow: '#2d8a4e', accent: '#7bc96e', mood: 'natural'
        },
        sunset: {
            name: '日落', bg: '#1a0a1a', bgGrad: '#2a1020',
            colors: ['#ff6b35', '#f7c59f', '#efefd0', '#c91e1e', '#ff8c42'],
            stroke: '#ff6b35', glow: '#f7c59f', accent: '#c91e1e', mood: 'warm'
        },

        // ----- 新增 10 套材质色板 -----
        sakura: {
            name: '樱花', bg: '#1a0a14', bgGrad: '#2a1420',
            colors: ['#ffb7c5', '#ff8da1', '#ff6b8a', '#e75480', '#ffc0cb', '#ffe4e1'],
            stroke: '#ff8da1', glow: '#ffb7c5', accent: '#e75480', mood: 'romantic'
        },
        ocean: {
            name: '海洋', bg: '#000a14', bgGrad: '#001a2e',
            colors: ['#0077b6', '#00a8e8', '#48cae4', '#90e0ef', '#caf0f8', '#023e8a'],
            stroke: '#00a8e8', glow: '#48cae4', accent: '#0077b6', mood: 'fresh'
        },
        galaxy: {
            name: '银河', bg: '#050510', bgGrad: '#0f0a2a',
            colors: ['#e066ff', '#7b4dff', '#4d4dff', '#00ccff', '#ff66cc', '#9966ff'],
            stroke: '#e066ff', glow: '#7b4dff', accent: '#00ccff', mood: 'mystical'
        },
        roseGold: {
            name: '玫瑰金', bg: '#1a0f0f', bgGrad: '#2a1a1a',
            colors: ['#e8b4b8', '#d4a0a5', '#c48a8a', '#b76e79', '#9e5a63', '#d4a574'],
            stroke: '#d4a0a5', glow: '#e8b4b8', accent: '#b76e79', mood: 'luxury'
        },
        mint: {
            name: '薄荷', bg: '#051a12', bgGrad: '#0a2a1a',
            colors: ['#98fb98', '#7cda7c', '#3cb371', '#2e8b57', '#66cdaa', '#20b2aa'],
            stroke: '#7cda7c', glow: '#98fb98', accent: '#3cb371', mood: 'refreshing'
        },
        tangerine: {
            name: '柑橘', bg: '#1a0e00', bgGrad: '#2a1a00',
            colors: ['#ff9500', '#ff8c00', '#ffa500', '#ff7f50', '#ff6347', '#ffd700'],
            stroke: '#ff8c00', glow: '#ffa500', accent: '#ff7f50', mood: 'energetic'
        },
        lavender: {
            name: '薰衣草', bg: '#100a1a', bgGrad: '#1a142a',
            colors: ['#b39ddb', '#9575cd', '#7e57c2', '#b388ff', '#d1c4e9', '#ce93d8'],
            stroke: '#9575cd', glow: '#b39ddb', accent: '#7e57c2', mood: 'peaceful'
        },
        midnight: {
            name: '午夜', bg: '#00001a', bgGrad: '#050530',
            colors: ['#1a1a3e', '#2a2a5e', '#3a3a7e', '#4a4a9e', '#6a6abe', '#8a8ade'],
            stroke: '#4a4a9e', glow: '#6a6abe', accent: '#3a3a7e', mood: 'deep'
        },
        coral: {
            name: '珊瑚', bg: '#1a0808', bgGrad: '#2a1212',
            colors: ['#ff7f50', '#ff6347', '#ff6b6b', '#ffa07a', '#e9967a', '#f08080'],
            stroke: '#ff6347', glow: '#ff7f50', accent: '#ff6b6b', mood: 'vibrant'
        },
        emerald: {
            name: '翡翠', bg: '#000a06', bgGrad: '#001a0e',
            colors: ['#50c878', '#00c957', '#2ecc71', '#27ae60', '#1abc9c', '#48c9b0'],
            stroke: '#00c957', glow: '#50c878', accent: '#2ecc71', mood: 'rich'
        },
        plum: {
            name: '李子', bg: '#0a0012', bgGrad: '#1a052a',
            colors: ['#673ab7', '#7b1fa2', '#9c27b0', '#4a148c', '#ab47bc', '#ce93d8'],
            stroke: '#7b1fa2', glow: '#9c27b0', accent: '#673ab7', mood: 'royal'
        },
        autumn: {
            name: '秋叶', bg: '#1a0e00', bgGrad: '#2a1800',
            colors: ['#d2691e', '#cd853f', '#daa520', '#b8860b', '#8b4513', '#a0522d'],
            stroke: '#d2691e', glow: '#daa520', accent: '#cd853f', mood: 'cozy'
        }
    },

    // ============ HSL 色轮核心函数 ============

    /**
     * 将 RGB 转为 HSL
     * @param {number} r - 0~255
     * @param {number} g - 0~255
     * @param {number} b - 0~255
     * @returns {Object} { h: 0~360, s: 0~100, l: 0~100 }
     */
    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    },

    /**
     * 将 HSL 转为 RGB
     * @param {number} h - 0~360
     * @param {number} s - 0~100
     * @param {number} l - 0~100
     * @returns {Object} { r: 0~255, g: 0~255, b: 0~255 }
     */
    hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
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
     * 将 hex 色转为 HSL 对象
     */
    hexToHsl(hex) {
        const { r, g, b } = this._hexToRgb(hex);
        return this.rgbToHsl(r, g, b);
    },

    /**
     * 将 HSL 转为 hex 字符串
     */
    hslToHex(h, s, l) {
        const { r, g, b } = this.hslToRgb(h, s, l);
        return this._rgbToHex(r, g, b);
    },

    /**
     * 获取色相旋转后的颜色
     * @param {string} hex - 原始颜色
     * @param {number} degrees - 旋转角度（-360~360）
     * @returns {string} 新 hex 颜色
     */
    applyHueShift(hex, degrees) {
        const hsl = this.hexToHsl(hex);
        hsl.h = ((hsl.h + degrees) % 360 + 360) % 360;
        return this.hslToHex(hsl.h, hsl.s, hsl.l);
    },

    /**
     * 调整饱和度
     * @param {string} hex - 原始颜色
     * @param {number} delta - 饱和度的变化量（-100~100）
     * @returns {string} 新 hex 颜色
     */
    saturate(hex, delta) {
        const hsl = this.hexToHsl(hex);
        hsl.s = Math.max(0, Math.min(100, hsl.s + delta));
        return this.hslToHex(hsl.h, hsl.s, hsl.l);
    },

    /**
     * 调整明度
     * @param {string} hex - 原始颜色
     * @param {number} delta - 明度的变化量（-100~100）
     * @returns {string} 新 hex 颜色
     */
    lighten(hex, delta) {
        const hsl = this.hexToHsl(hex);
        hsl.l = Math.max(0, Math.min(100, hsl.l + delta));
        return this.hslToHex(hsl.h, hsl.s, hsl.l);
    },

    // ============ HSL 配色方案（基于色轮角度） ============

    /**
     * 基于色轮角度的互补色
     * 取色相 + 180°
     */
    _complementaryColorHSL(hex) {
        const hsl = this.hexToHsl(hex);
        hsl.h = (hsl.h + 180) % 360;
        return this.hslToHex(hsl.h, hsl.s, hsl.l);
    },

    /**
     * 基于色轮角度的三等分配色（间隔 120°）
     */
    _triadicColorsHSL(hex) {
        const hsl = this.hexToHsl(hex);
        const h = hsl.h;
        return [
            hex,
            this.hslToHex((h + 120) % 360, hsl.s, hsl.l),
            this.hslToHex((h + 240) % 360, hsl.s, hsl.l)
        ];
    },

    /**
     * 基于色轮角度的四等分配色（间隔 90°）
     */
    _tetradicColorsHSL(hex) {
        const hsl = this.hexToHsl(hex);
        const h = hsl.h;
        const colors = [];
        for (let i = 0; i < 4; i++) {
            colors.push(this.hslToHex((h + 90 * i) % 360, hsl.s, hsl.l));
        }
        return colors;
    },

    /**
     * 基于色轮角度的邻近色（±30° 内）
     */
    _analogousColorsHSL(hex, count) {
        count = count || 5;
        const hsl = this.hexToHsl(hex);
        const h = hsl.h;
        const colors = [];
        const step = 60 / (count - 1 || 1);
        for (let i = 0; i < count; i++) {
            const offset = -30 + i * step;
            colors.push(this.hslToHex((h + offset + 360) % 360, hsl.s, hsl.l));
        }
        return colors;
    },

    /**
     * 基于色轮角度的分裂互补色（主色 + 补色两侧 ±30°）
     */
    _splitComplementaryHSL(hex) {
        const hsl = this.hexToHsl(hex);
        const complement = (hsl.h + 180) % 360;
        return [
            hex,
            this.hslToHex((complement - 30 + 360) % 360, hsl.s, hsl.l * 0.9),
            this.hslToHex((complement + 30) % 360, hsl.s, hsl.l * 0.9)
        ];
    },

    // ============ 公开 API ============

    /**
     * 获取所有调色板名称列表
     */
    getPaletteNames() {
        return Object.keys(this.palettes);
    },

    /**
     * 获取指定调色板
     */
    getPalette(name) {
        return this.palettes[name] || this.palettes.aurora;
    },

    /**
     * 随机获取一个调色板
     */
    getRandomPalette() {
        const names = Object.keys(this.palettes);
        return this.palettes[names[Math.floor(Math.random() * names.length)]];
    },

    /**
     * 根据配色方案从调色板中提取颜色
     * 使用 HSL 色轮算法（各方案基于色相角度计算）
     * @param {string} paletteName - 调色板名称
     * @param {string} scheme - 配色方案
     * @param {Object} options - 可选参数 { hueShift, saturationShift, lightnessShift }
     * @returns {Array} 颜色 hex 数组
     */
    getColorsByScheme(paletteName, scheme, options) {
        const palette = this.getPalette(paletteName);
        const baseColors = palette.colors;
        const opts = options || {};
        let result;

        switch (scheme) {
            case 'complementary': {
                const primary = baseColors[Math.floor(Math.random() * baseColors.length)];
                result = [primary, this._complementaryColorHSL(primary)];
                break;
            }
            case 'triadic': {
                const primary = baseColors[Math.floor(Math.random() * baseColors.length)];
                result = this._triadicColorsHSL(primary);
                break;
            }
            case 'tetradic': {
                const primary = baseColors[Math.floor(Math.random() * baseColors.length)];
                result = this._tetradicColorsHSL(primary);
                break;
            }
            case 'analogous': {
                const idx = Math.floor(Math.random() * baseColors.length);
                const primary = baseColors[idx];
                result = this._analogousColorsHSL(primary);
                break;
            }
            case 'splitComplementary': {
                const primary = baseColors[Math.floor(Math.random() * baseColors.length)];
                result = this._splitComplementaryHSL(primary);
                break;
            }
            case 'monochromatic': {
                // 单色系：固定色相，变化饱和度和明度
                const primary = baseColors[Math.floor(Math.random() * baseColors.length)];
                const hsl = this.hexToHsl(primary);
                result = [];
                for (let i = 0; i < 5; i++) {
                    const factor = 0.3 + (i / 4) * 0.7;
                    result.push(this.hslToHex(hsl.h, hsl.s * factor, 20 + hsl.l * factor * 0.8));
                }
                break;
            }
            default: {
                // random：从基础色中随机打乱取前 6 个
                const shuffled = [...baseColors].sort(() => Math.random() - 0.5);
                result = shuffled.length >= 1 ? shuffled : ['#ffffff'];
                break;
            }
        }

        // 后处理：色相偏移、饱和度调整、明度调整
        if (opts.hueShift || opts.saturationShift || opts.lightnessShift) {
            result = result.map(c => {
                let hsl = this.hexToHsl(c);
                if (opts.hueShift) hsl.h = ((hsl.h + opts.hueShift) % 360 + 360) % 360;
                if (opts.saturationShift) hsl.s = Math.max(0, Math.min(100, hsl.s + opts.saturationShift));
                if (opts.lightnessShift) hsl.l = Math.max(0, Math.min(100, hsl.l + opts.lightnessShift));
                return this.hslToHex(hsl.h, hsl.s, hsl.l);
            });
        }

        return result;
    },

    /**
     * 获取互补色（公开 API）
     */
    getComplementary(hex) {
        return this._complementaryColorHSL(hex);
    },

    /**
     * 生成渐变色（基于 HSL 插值）
     * @param {string} from - 起始颜色 hex
     * @param {string} to - 终止颜色 hex
     * @param {number} steps - 步数
     * @returns {Array} 渐变色数组
     */
    generateGradient(from, to, steps) {
        const hsl1 = this.hexToHsl(from);
        const hsl2 = this.hexToHsl(to);
        const colors = [];
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1 || 1);
            const h = hsl1.h + (hsl2.h - hsl1.h) * t;
            const s = hsl1.s + (hsl2.s - hsl1.s) * t;
            const l = hsl1.l + (hsl2.l - hsl1.l) * t;
            colors.push(this.hslToHex(h, s, l));
        }
        return colors;
    },

    /**
     * 应用颜色抖动效果
     */
    applyDither(hexColor, amount) {
        if (!amount || amount <= 0) return hexColor;
        try {
            let r = parseInt(hexColor.slice(1, 3), 16);
            let g = parseInt(hexColor.slice(3, 5), 16);
            let b = parseInt(hexColor.slice(5, 7), 16);
            
            const d = Math.floor(amount * 2.55);
            r = Math.max(0, Math.min(255, r + Math.floor((Math.random() - 0.5) * d)));
            g = Math.max(0, Math.min(255, g + Math.floor((Math.random() - 0.5) * d)));
            b = Math.max(0, Math.min(255, b + Math.floor((Math.random() - 0.5) * d)));
            
            return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
        } catch (e) {
            return hexColor;
        }
    },

    /**
     * 应用颜色抖动到一组颜色
     */
    applyDitherToColors(colors, amount) {
        if (!amount || amount <= 0) return colors;
        return colors.map(c => this.applyDither(c, amount));
    },

    // ============ 高级渐变生成 ============

    /**
     * 生成多色渐变节点
     */
    generateGradientStops(style, colors, numStops) {
        if (!colors || colors.length === 0) return [];
        numStops = numStops || colors.length;
        
        const stops = [];
        const actualColors = [];
        
        for (let i = 0; i < numStops; i++) {
            const t = i / (numStops - 1 || 1);
            const colorIdx = t * (colors.length - 1);
            const idx1 = Math.floor(colorIdx);
            const idx2 = Math.min(idx1 + 1, colors.length - 1);
            const frac = colorIdx - idx1;
            
            actualColors.push(this._lerpColor(colors[idx1], colors[idx2], frac));
        }
        
        for (let i = 0; i < numStops; i++) {
            stops.push({
                pos: i / (numStops - 1 || 1),
                color: actualColors[i]
            });
        }
        
        return stops;
    },

    /**
     * 在画布上绘制渐变背景
     */
    applyGradientBackground(ctx, w, h, type, stops, angle) {
        if (!stops || stops.length < 2) return;
        
        let gradient;
        if (type === 'radial') {
            gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.7);
        } else {
            const rad = (angle || 0) * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const len = Math.sqrt(w * w + h * h) / 2;
            const cx = w / 2, cy = h / 2;
            gradient = ctx.createLinearGradient(
                cx - cos * len, cy - sin * len,
                cx + cos * len, cy + sin * len
            );
        }
        
        for (const stop of stops) {
            gradient.addColorStop(stop.pos, stop.color);
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    },

    /**
     * 将 HSL 色轮的配色方案描述转换为可读名称
     */
    getSchemeName(scheme) {
        const names = {
            'random': '随机',
            'complementary': '互补色（180°）',
            'triadic': '三等分（120°）',
            'tetradic': '四等分（90°）',
            'analogous': '邻近色（±30°）',
            'splitComplementary': '分裂互补',
            'monochromatic': '单色系'
        };
        return names[scheme] || scheme;
    },

    // ============ 内部颜色变换方法 ============

    /**
     * 将 hex 转为 {r,g,b}
     */
    _hexToRgb(hex) {
        if (!hex || hex === 'transparent') return {r: 255, g: 255, b: 255};
        const match = hex.replace('#', '');
        if (match.length === 3) {
            return {
                r: parseInt(match[0] + match[0], 16),
                g: parseInt(match[1] + match[1], 16),
                b: parseInt(match[2] + match[2], 16)
            };
        }
        return {
            r: parseInt(match.slice(0, 2), 16),
            g: parseInt(match.slice(2, 4), 16),
            b: parseInt(match.slice(4, 6), 16)
        };
    },

    /**
     * 将 {r,g,b} 转为 hex
     */
    _rgbToHex(r, g, b) {
        return `#${Math.max(0, Math.min(255, Math.round(r))).toString(16).padStart(2, '0')}${Math.max(0, Math.min(255, Math.round(g))).toString(16).padStart(2, '0')}${Math.max(0, Math.min(255, Math.round(b))).toString(16).padStart(2, '0')}`;
    },

    /**
     * 在两个颜色间线性插值
     */
    _lerpColor(c1, c2, t) {
        const rgb1 = this._hexToRgb(c1);
        const rgb2 = this._hexToRgb(c2);
        return this._rgbToHex(
            rgb1.r + (rgb2.r - rgb1.r) * t,
            rgb1.g + (rgb2.g - rgb1.g) * t,
            rgb1.b + (rgb2.b - rgb1.b) * t
        );
    }
};

// 向后兼容保留旧方法名
ColorPalette._complementaryColor = ColorPalette._complementaryColorHSL;
ColorPalette._triadicColors = ColorPalette._triadicColorsHSL;
ColorPalette._tetradicColors = ColorPalette._tetradicColorsHSL;
ColorPalette._analogousColors = ColorPalette._analogousColorsHSL;
ColorPalette._monochromaticColors = ColorPalette._monochromaticColorsHSL;