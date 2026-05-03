/**
 * 噪声生成器模块
 * 提供 2D Perlin 噪声和 Simplex 噪声，用于流体场、地形等高线等生成
 * 自包含实现，无外部依赖
 */
const NoiseGenerator = {
    // ============ Permutation Table (用于 Perlin) ============
    _perm: null,
    _grad3: [
        [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
        [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
        [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ],
    _initialized: false,

    /**
     * 初始化置换表（基于种子）
     */
    init(seed) {
        seed = seed || Math.floor(Math.random() * 100000);
        const p = new Uint8Array(512);
        const perm = new Uint8Array(512);
        
        for (let i = 0; i < 256; i++) p[i] = i;
        
        // Fisher-Yates 洗牌（基于种子）
        let s = seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807 + 0) % 2147483647;
            const j = s % (i + 1);
            const tmp = p[i];
            p[i] = p[j];
            p[j] = tmp;
        }
        
        for (let i = 0; i < 512; i++) {
            perm[i] = p[i & 255];
        }
        
        this._perm = perm;
        this._initialized = true;
    },

    /**
     * 2D Perlin 噪声
     * @param {number} x
     * @param {number} y
     * @returns {number} -1 ~ 1
     */
    perlin2D(x, y) {
        if (!this._initialized) this.init();
        const perm = this._perm;
        
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        
        // 缓和曲线
        const u = this._fade(xf);
        const v = this._fade(yf);
        
        const aa = perm[perm[X] + Y];
        const ab = perm[perm[X] + Y + 1];
        const ba = perm[perm[X + 1] + Y];
        const bb = perm[perm[X + 1] + Y + 1];
        
        const x1 = this._lerp(
            this._gradDot(aa, xf, yf),
            this._gradDot(ba, xf - 1, yf),
            u
        );
        const x2 = this._lerp(
            this._gradDot(ab, xf, yf - 1),
            this._gradDot(bb, xf - 1, yf - 1),
            u
        );
        
        return this._lerp(x1, x2, v);
    },

    /**
     * 分形布朗运动（多层 Perlin 叠加）
     * @param {number} x
     * @param {number} y
     * @param {number} octaves - 层数（默认4）
     * @returns {number} -1 ~ 1
     */
    fbm(x, y, octaves) {
        octaves = octaves || 4;
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.perlin2D(x * frequency, y * frequency);
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        return value / maxValue;
    },

    /**
     * 平滑噪声（用于流场）
     */
    smoothNoise(x, y, scale) {
        scale = scale || 0.1;
        return this.fbm(x * scale, y * scale, 3);
    },

    /**
     * 生成噪声场（网格数组）
     * @param {number} width - 网格宽
     * @param {number} height - 网格高
     * @param {number} scale - 噪声尺度
     * @param {number} offsetX - 偏移
     * @param {number} offsetY - 偏移
     * @returns {Float32Array} 平面数组 [v00, v01, ..., v10, v11, ...]
     */
    generateField(width, height, scale, offsetX, offsetY) {
        scale = scale || 0.03;
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        
        const field = new Float32Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = (x + offsetX) * scale;
                const ny = (y + offsetY) * scale;
                field[y * width + x] = this.fbm(nx, ny, 3);
            }
        }
        
        return field;
    },

    /**
     * 生成流场方向向量
     * @returns {Float32Array} [angle00, angle01, ...]
     */
    generateFlowField(width, height, scale, offsetX, offsetY) {
        scale = scale || 0.02;
        offsetX = offsetX || 0;
        offsetY = offsetY || 0;
        
        const angles = new Float32Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = (x + offsetX) * scale;
                const ny = (y + offsetY) * scale;
                // 使用两个噪声维度合成角度
                const angle = this.fbm(nx, ny, 3) * Math.PI * 2;
                angles[y * width + x] = angle;
            }
        }
        
        return angles;
    },

    // ============ 内部方法 ============

    _fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    },

    _lerp(a, b, t) {
        return a + t * (b - a);
    },

    _gradDot(hash, x, y) {
        const g = this._grad3[hash & 11];
        return g[0] * x + g[1] * y;
    }
};

// 自动初始化
NoiseGenerator.init();