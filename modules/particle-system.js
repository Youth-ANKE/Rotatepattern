/**
 * 粒子特效系统模块 V2.0
 * 优化：对象池复用、自适应质量降级、激进的淘汰机制、风力/湍流效果
 */
const ParticleSystem = {
    particles: [],
    
    // 对象池（预分配粒子对象，避免GC）
    _pool: [],
    _poolSize: 100,

    // 自适应质量
    _maxParticles: 800,       // 性能较好时的上限
    _lowPerfMax: 150,         // 低性能时的上限
    _lastFpsTime: 0,
    _fps: 60,
    _frameCount: 0,
    _fpsCheckInterval: 30,    // 每30帧检查一次FPS
    _isLowPerformance: false,
    _spawnRateScale: 1,       // 生成率缩放（低性能时降低）

    // 全局漂移/风力
    _windX: 0,
    _windY: 0,
    _windTimer: 0,

    // 每个粒子类型的排放上限（帧）
    _emitBudgetPerFrame: {
        'firefly': 20,
        'spark': 15,
        'star': 12,
        'rainbow': 10,
        'butterfly': 8,
        'bubble': 6,
        'snow': 10,
    },

    /**
     * 初始化粒子系统
     */
    init() {
        this.particles = [];
        this._pool = [];
        this._preAllocPool(this._poolSize);
        this._lastFpsTime = performance.now();
        this._windX = 0;
        this._windY = 0;
    },

    /**
     * 预分配对象池
     */
    _preAllocPool(count) {
        for (let i = 0; i < count; i++) {
            this._pool.push(this._createPooledObject());
        }
    },

    /**
     * 创建池化对象模板
     */
    _createPooledObject() {
        return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '', size: 0, type: '', alpha: 0, active: false };
    },

    /**
     * 从对象池获取一个粒子
     */
    _acquire() {
        let obj;
        if (this._pool.length > 0) {
            obj = this._pool.pop();
        } else {
            obj = this._createPooledObject();
        }
        obj.active = true;
        return obj;
    },

    /**
     * 将粒子归还对象池
     */
    _release(p) {
        p.active = false;
        if (this._pool.length < this._poolSize * 5) {
            this._pool.push(p);
        }
    },

    /**
     * 检查性能并自适应调整
     */
    _checkPerformance() {
        this._frameCount++;
        if (this._frameCount >= this._fpsCheckInterval) {
            const now = performance.now();
            const elapsed = now - this._lastFpsTime;
            this._fps = (this._frameCount / elapsed) * 1000;
            this._lastFpsTime = now;
            this._frameCount = 0;

            // 动态调整：FPS < 30 进入低性能模式
            const wasLow = this._isLowPerformance;
            this._isLowPerformance = this._fps < 30;
            
            if (this._isLowPerformance) {
                this._spawnRateScale = Math.max(0.1, this._fps / 60);
            } else {
                this._spawnRateScale = Math.min(1, this._spawnRateScale + 0.1);
            }

            // 如果刚刚进入低性能模式，立即裁剪一半粒子
            if (this._isLowPerformance && !wasLow) {
                this._cullToCount(Math.floor(this.particles.length / 2));
            }
        }
    },

    /**
     * 裁减粒子到指定数量（淘汰最旧的）
     */
    _cullToCount(maxCount) {
        if (this.particles.length <= maxCount) return;
        const removeCount = this.particles.length - maxCount;
        const removed = this.particles.splice(0, removeCount);
        for (const p of removed) {
            this._release(p);
        }
    },

    /**
     * 在指定位置生成粒子（带排放预算控制）
     * @param {number} x - 粒子源x坐标
     * @param {number} y - 粒子源y坐标
     * @param {number} count - 希望生成的粒子数量
     */
    emit(x, y, count) {
        if (!StateManager.state.particleEnabled) return;

        // 自适应：低性能时降低生成量
        count = Math.ceil(count * this._spawnRateScale);
        if (count < 1) return;

        const type = StateManager.state.particleType;

        // 按类型排放预算限制
        const budget = this._emitBudgetPerFrame[type] || 20;
        if (count > budget) count = budget;

        // 粒子总数保护：已达上限则不再生成
        const maxAllowed = this._isLowPerformance ? this._lowPerfMax : this._maxParticles;
        if (this.particles.length >= maxAllowed) return;

        // 确保不超过上限
        if (this.particles.length + count > maxAllowed) {
            count = maxAllowed - this.particles.length;
            if (count <= 0) return;
        }

        for (let i = 0; i < count; i++) {
            this._createParticle(x, y, type);
        }
    },

    /**
     * 创建单个粒子（使用对象池）
     */
    _createParticle(x, y, type) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 1 + Math.random() * 4;
        const maxLife = 30 + Math.floor(Math.random() * 50);

        const p = this._acquire();
        p.x = x;
        p.y = y;
        p.life = 0;
        p.maxLife = maxLife;
        p.type = type;
        p.alpha = 1;

        switch (type) {
            case 'spark':
                p.vx = Math.cos(angle) * speed * 1.5;
                p.vy = Math.sin(angle) * speed * 1.5 - 1;
                p.color = Math.random() > 0.5 ? '#ff6b35' : '#ffd700';
                p.size = 2 + Math.random() * 3;
                break;

            case 'star':
                p.vx = Math.cos(angle) * speed * 0.8;
                p.vy = Math.sin(angle) * speed * 0.8;
                p.color = `hsl(${Math.random() * 60 + 180}, 100%, 80%)`;
                p.size = 1 + Math.random() * 2;
                break;

            case 'rainbow':
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                p.color = `hsl(${Math.random() * 360}, 100%, 65%)`;
                p.size = 3 + Math.random() * 4;
                break;

            case 'butterfly':
                p.vx = Math.cos(angle) * speed * 0.5;
                p.vy = Math.sin(angle) * speed * 0.5 - 0.5;
                p.color = `hsl(${Math.random() * 360}, 80%, 70%)`;
                p.size = 2 + Math.random() * 2;
                break;

            case 'bubble':
                p.vx = Math.cos(angle) * speed * 0.4;
                p.vy = Math.sin(angle) * speed * 0.4 - 1.5;
                p.color = `hsla(${200 + Math.random() * 80}, 60%, 80%, 0.5)`;
                p.size = 4 + Math.random() * 8;
                break;

            case 'snow':
                p.vx = Math.cos(angle) * speed * 0.3;
                p.vy = Math.sin(angle) * speed * 0.3 + 0.5;
                p.color = `rgba(255, 255, 255, ${0.6 + Math.random() * 0.4})`;
                p.size = 1 + Math.random() * 3;
                break;

            default: // firefly
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                p.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
                p.size = 2 + Math.random() * 3;
        }

        this.particles.push(p);
    },

    /**
     * 更新所有粒子的位置和状态
     * 优化：使用 while 循环代替 for...splice（避免索引偏移）
     */
    update() {
        this._checkPerformance();
        this._updateWind();

        const { canvasWidth, canvasHeight } = StateManager.state;
        const margin = 50; // 淘汰边界外扩

        // 使用双指针法批量淘汰
        let writeIdx = 0;
        for (let readIdx = 0; readIdx < this.particles.length; readIdx++) {
            const p = this.particles[readIdx];
            p.life++;

            // 淘汰条件：生命周期结束 || 超出边界 || 标记为不可见
            const expired = p.life >= p.maxLife;
            const outOfBounds = p.x < -margin || p.x > canvasWidth + margin ||
                                p.y < -margin || p.y > canvasHeight + margin;

            if (expired || outOfBounds) {
                this._release(p);
                continue;
            }

            // 更新位置（加上全局风力）
            p.x += p.vx + this._windX;
            p.y += p.vy + this._windY;

            // 轻微减速
            p.vx *= 0.97;
            p.vy *= 0.97;

            // 重力效果
            if (p.type === 'spark' || p.type === 'butterfly') {
                p.vy += 0.05;
            }

            // 泡泡：轻微左右摆动
            if (p.type === 'bubble') {
                p.vx += Math.sin(p.life * 0.1) * 0.02;
            }

            // 雪花：随机湍流
            if (p.type === 'snow') {
                p.vx += (Math.random() - 0.5) * 0.1;
            }

            // 透明度
            p.alpha = 1 - (p.life / p.maxLife);

            // 写入有效粒子
            this.particles[writeIdx] = p;
            writeIdx++;
        }

        // 截断数组
        if (writeIdx < this.particles.length) {
            this.particles.length = writeIdx;
        }

        // 低性能模式：如果依然太多，强制裁剪
        if (this._isLowPerformance && this.particles.length > this._lowPerfMax) {
            this._cullToCount(this._lowPerfMax);
        }
    },

    /**
     * 更新全局风力/漂移
     * 产生自然的流动效果
     */
    _updateWind() {
        const { canvasWidth } = StateManager.state;
        this._windTimer++;
        
        // 每60帧重新计算风向
        if (this._windTimer >= 60) {
            this._windTimer = 0;
            // 缓慢平滑变化
            this._windX += (Math.random() - 0.5) * 0.05;
            this._windY += (Math.random() - 0.5) * 0.03;
            // 限制范围
            this._windX = Math.max(-0.3, Math.min(0.3, this._windX));
            this._windY = Math.max(-0.2, Math.min(0.2, this._windY));
        }
    },

    /**
     * 绘制所有粒子到画布
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        if (this.particles.length === 0) return;

        const { symmetryMode, symmetryCount, currentRotation } = StateManager.state;

        ctx.save();

        // 批量设置，减少状态切换
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!p || !p.active) continue;

            const alpha = p.alpha * 0.8;

            // 蝴蝶类型在旋转模式下绘制对称对
            if (p.type === 'butterfly' && symmetryMode === 'rotational') {
                const cx = StateManager.state.canvasWidth / 2;
                const cy = StateManager.state.canvasHeight / 2;
                const p1 = MathUtils.rotatePoint(p.x, p.y, cx, cy, currentRotation);
                const p2 = MathUtils.rotatePoint(p.x, p.y, cx, cy, currentRotation + Math.PI);

                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p2.x, p2.y, p.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
                continue;
            }

            // 普通粒子
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
            ctx.fill();

            // 星星光晕
            if (p.type === 'star') {
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        ctx.restore();
    },

    /**
     * 清空所有粒子（快速释放到对象池）
     */
    clear() {
        for (const p of this.particles) {
            this._release(p);
        }
        this.particles = [];
    }
};