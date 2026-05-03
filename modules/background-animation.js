/**
 * 背景动画系统 V1.0
 * 
 * 支持的动画类型：
 * - aurora: 极光流动效果
 * - gradientShift: 渐变漂移
 * - starField: 星空闪烁
 * - nebula: 星云效果
 */
const BackgroundAnimation = {
    // 当前状态
    _enabled: false,
    _type: 'none',
    _phase: 0,
    _lastTime: 0,
    
    // 动画参数
    _params: {
        aurora: {
            speed: 0.0005,
            layers: 3,
            opacity: 0.3
        },
        gradientShift: {
            speed: 0.0003,
            angle: 0
        },
        starField: {
            speed: 0.001,
            density: 0.5,
            twinkle: true
        },
        nebula: {
            speed: 0.0002,
            density: 0.4,
            colors: ['#ff66aa', '#aa66ff', '#66ccff']
        }
    },

    /**
     * 初始化
     */
    init() {
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.7;
        `;
        this._ctx = this._canvas.getContext('2d');
        document.body.insertBefore(this._canvas, document.body.firstChild);
        
        window.addEventListener('resize', () => this._resize());
        this._resize();
    },

    /**
     * 调整画布大小
     */
    _resize() {
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
    },

    /**
     * 设置动画类型
     */
    setType(type) {
        this._type = type;
        if (type !== 'none') {
            this.enable();
        } else {
            this.disable();
        }
    },

    /**
     * 启用动画
     */
    enable() {
        this._enabled = true;
        this._canvas.style.display = 'block';
        if (!this._animationId) {
            this._lastTime = performance.now();
            this._animate();
        }
    },

    /**
     * 禁用动画
     */
    disable() {
        this._enabled = false;
        this._canvas.style.display = 'none';
    },

    /**
     * 动画循环
     */
    _animate() {
        if (!this._enabled) {
            this._animationId = null;
            return;
        }

        const now = performance.now();
        const delta = now - this._lastTime;
        this._lastTime = now;
        
        this._phase += delta * 0.001;
        
        // 清空画布
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        
        // 根据类型绘制
        switch (this._type) {
            case 'aurora':
                this._drawAurora();
                break;
            case 'gradientShift':
                this._drawGradientShift();
                break;
            case 'starField':
                this._drawStarField();
                break;
            case 'nebula':
                this._drawNebula();
                break;
        }

        this._animationId = requestAnimationFrame(() => this._animate());
    },

    /**
     * 绘制极光效果
     */
    _drawAurora() {
        const ctx = this._ctx;
        const w = this._canvas.width;
        const h = this._canvas.height;
        const p = this._params.aurora;
        
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        const offset = Math.sin(this._phase * p.speed * 1000) * 0.2;
        
        gradient.addColorStop(0, 'rgba(68, 255, 136, 0)');
        gradient.addColorStop(0.3 + offset, `rgba(68, 255, 136, ${p.opacity * 0.3})`);
        gradient.addColorStop(0.5, `rgba(68, 136, 255, ${p.opacity * 0.4})`);
        gradient.addColorStop(0.7 - offset, `rgba(170, 102, 255, ${p.opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(170, 102, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // 添加波动效果
        for (let i = 0; i < 3; i++) {
            const y = h * 0.2 + i * h * 0.2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            
            for (let x = 0; x <= w; x += 20) {
                const waveY = y + Math.sin(x * 0.01 + this._phase * (1 + i * 0.5)) * 30;
                ctx.lineTo(x, waveY);
            }
            
            ctx.lineTo(w, y + 100);
            ctx.lineTo(0, y + 100);
            ctx.closePath();
            
            const waveGrad = ctx.createLinearGradient(0, y, 0, y + 100);
            waveGrad.addColorStop(0, `rgba(68, 255, 136, ${0.15 - i * 0.03})`);
            waveGrad.addColorStop(1, 'rgba(68, 255, 136, 0)');
            ctx.fillStyle = waveGrad;
            ctx.fill();
        }
    },

    /**
     * 绘制渐变漂移效果
     */
    _drawGradientShift() {
        const ctx = this._ctx;
        const w = this._canvas.width;
        const h = this._canvas.height;
        const p = this._params.gradientShift;
        
        p.angle += p.speed * 16;
        
        const colors = [
            { h: (this._phase * 30) % 360, s: 0.6, l: 0.3 },
            { h: (this._phase * 30 + 120) % 360, s: 0.6, l: 0.3 },
            { h: (this._phase * 30 + 240) % 360, s: 0.6, l: 0.3 }
        ];
        
        // 第一层
        let gradient = ctx.createRadialGradient(
            w * (0.5 + Math.sin(p.angle) * 0.3),
            h * (0.5 + Math.cos(p.angle) * 0.3),
            0,
            w * 0.5, h * 0.5, Math.max(w, h)
        );
        
        gradient.addColorStop(0, `hsla(${colors[0].h}, ${colors[0].s * 100}%, ${colors[0].l * 100}%, 0.4)`);
        gradient.addColorStop(0.5, `hsla(${colors[1].h}, ${colors[1].s * 100}%, ${colors[1].l * 100}%, 0.2)`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // 第二层（偏移）
        gradient = ctx.createRadialGradient(
            w * (0.5 - Math.sin(p.angle * 0.7) * 0.4),
            h * (0.5 - Math.cos(p.angle * 0.7) * 0.4),
            0,
            w * 0.5, h * 0.5, Math.max(w, h) * 0.8
        );
        
        gradient.addColorStop(0, `hsla(${colors[2].h}, ${colors[2].s * 100}%, ${colors[2].l * 100}%, 0.3)`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    },

    /**
     * 绘制星空闪烁效果
     */
    _drawStarField() {
        const ctx = this._ctx;
        const w = this._canvas.width;
        const h = this._canvas.height;
        const p = this._params.starField;
        
        // 生成星星（如果还没有）
        if (!this._stars || this._stars.length === 0) {
            this._stars = [];
            const count = Math.floor(w * h * 0.0002 * p.density);
            for (let i = 0; i < count; i++) {
                this._stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    size: Math.random() * 2 + 0.5,
                    twinkleSpeed: Math.random() * 2 + 1,
                    twinklePhase: Math.random() * Math.PI * 2
                });
            }
        }
        
        // 绘制星星
        this._stars.forEach(star => {
            const alpha = p.twinkle 
                ? 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this._phase * star.twinkleSpeed + star.twinklePhase))
                : 0.5 + Math.random() * 0.3;
            
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
            
            // 添加光晕
            if (star.size > 1.5) {
                const glowGrad = ctx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.size * 3
                );
                glowGrad.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.5})`);
                glowGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = glowGrad;
                ctx.fillRect(star.x - star.size * 3, star.y - star.size * 3, star.size * 6, star.size * 6);
            }
        });
    },

    /**
     * 绘制星云效果
     */
    _drawNebula() {
        const ctx = this._ctx;
        const w = this._canvas.width;
        const h = this._canvas.height;
        const p = this._params.nebula;
        
        // 多层星云
        for (let layer = 0; layer < 3; layer++) {
            const cx = w * (0.3 + layer * 0.2 + Math.sin(this._phase * p.speed * 1000 + layer) * 0.1);
            const cy = h * (0.4 + layer * 0.1 + Math.cos(this._phase * p.speed * 1000 + layer) * 0.1);
            const radius = Math.min(w, h) * (0.3 + layer * 0.1);
            
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            const color = p.colors[layer % p.colors.length];
            
            gradient.addColorStop(0, this._hexToRgba(color, 0.4 - layer * 0.1));
            gradient.addColorStop(0.4, this._hexToRgba(color, 0.2 - layer * 0.05));
            gradient.addColorStop(0.7, this._hexToRgba(color, 0.1));
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }
        
        // 添加粒子
        if (!this._nebulaParticles || this._nebulaParticles.length === 0) {
            this._nebulaParticles = [];
            for (let i = 0; i < 50; i++) {
                this._nebulaParticles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    size: Math.random() * 3 + 1,
                    speed: Math.random() * 0.2 + 0.1,
                    angle: Math.random() * Math.PI * 2,
                    hue: 200 + Math.random() * 100
                });
            }
        }
        
        this._nebulaParticles.forEach(p => {
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, 0.6)`;
            ctx.fill();
        });
    },

    /**
     * HEX转RGBA
     */
    _hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    /**
     * 销毁
     */
    destroy() {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        window.removeEventListener('resize', this._resize);
    }
};

// 导出
window.BackgroundAnimation = BackgroundAnimation;
