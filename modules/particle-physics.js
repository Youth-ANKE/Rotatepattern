/**
 * 粒子物理系统 - Particle Physics System
 * 增强版粒子系统，支持物理交互
 */

class ParticlePhysics {
    constructor() {
        // 物理参数
        this.gravity = 0;
        this.wind = 0;
        this.friction = 0.98;
        this.bounce = 0.7;
        this.turbulence = 0;

        // 场
        this.fields = [];

        // 粒子碰撞
        this.particleCollision = false;
        this.collisionRadius = 5;

        // 轨迹长度
        this.trailLength = 20;

        // 更新回调
        this.onUpdate = null;
    }

    /**
     * 创建物理粒子
     */
    createParticle(x, y, options = {}) {
        return {
            // 位置
            x, y,
            prevX: x,
            prevY: y,

            // 速度
            vx: options.vx || (Math.random() - 0.5) * 4,
            vy: options.vy || (Math.random() - 0.5) * 4,

            // 属性
            radius: options.radius || 2 + Math.random() * 3,
            mass: options.mass || 1,
            life: options.life || 1,
            maxLife: options.maxLife || 1,
            decay: options.decay || 0.001,

            // 视觉
            color: options.color || { h: Math.random() * 360, s: 80, l: 60 },
            alpha: 1,

            // 物理属性
            charge: options.charge || 0, // 电荷 (+/-)
            pinned: options.pinned || false, // 固定不动

            // 轨迹
            trail: [],
            trailEnabled: options.trail !== undefined ? options.trail : true,
            trailLength: options.trailLength || this.trailLength
        };
    }

    /**
     * 添加力场
     */
    addField(type, x, y, strength, radius = 200) {
        this.fields.push({ type, x, y, strength, radius });
    }

    /**
     * 清除力场
     */
    clearFields() {
        this.fields = [];
    }

    /**
     * 应用力到粒子
     */
    applyForces(particle) {
        if (particle.pinned) return;

        // 重力
        particle.vy += this.gravity;

        // 风
        particle.vx += this.wind;

        // 湍流
        if (this.turbulence > 0) {
            particle.vx += (Math.random() - 0.5) * this.turbulence;
            particle.vy += (Math.random() - 0.5) * this.turbulence;
        }

        // 力场
        for (const field of this.fields) {
            const dx = field.x - particle.x;
            const dy = field.y - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < field.radius && dist > 0) {
                const force = field.strength * (1 - dist / field.radius);
                const angle = Math.atan2(dy, dx);

                switch (field.type) {
                    case 'gravity': // 引力
                        particle.vx += Math.cos(angle) * force;
                        particle.vy += Math.sin(angle) * force;
                        break;

                    case 'repulse': // 斥力
                        particle.vx -= Math.cos(angle) * force;
                        particle.vy -= Math.sin(angle) * force;
                        break;

                    case 'spin': // 旋转
                        particle.vx += -Math.sin(angle) * force;
                        particle.vy += Math.cos(angle) * force;
                        break;

                    case 'vortex': // 漩涡
                        const tangentX = -Math.sin(angle);
                        const tangentY = Math.cos(angle);
                        particle.vx += tangentX * force;
                        particle.vy += tangentY * force;
                        // 同时向中心吸引
                        particle.vx += Math.cos(angle) * force * 0.3;
                        particle.vy += Math.sin(angle) * force * 0.3;
                        break;

                    case 'wave': // 波纹
                        const wave = Math.sin(dist / 20 + Date.now() / 500) * force;
                        particle.vx += Math.cos(angle) * wave;
                        particle.vy += Math.sin(angle) * wave;
                        break;
                }
            }
        }

        // 电荷相互作用
        if (this.particleCollision && particle.charge !== 0) {
            // 简化版：只检查附近粒子
            // 完整实现需要空间分区优化
        }
    }

    /**
     * 更新单个粒子
     */
    updateParticle(particle, bounds) {
        if (particle.pinned) return;

        // 保存轨迹
        if (particle.trailEnabled) {
            particle.trail.push({ x: particle.x, y: particle.y });
            if (particle.trail.length > particle.trailLength) {
                particle.trail.shift();
            }
        }

        // 保存当前位置用于碰撞检测
        particle.prevX = particle.x;
        particle.prevY = particle.y;

        // 应用速度
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 边界碰撞
        if (bounds) {
            if (particle.x - particle.radius < 0) {
                particle.x = particle.radius;
                particle.vx *= -this.bounce;
            } else if (particle.x + particle.radius > bounds.width) {
                particle.x = bounds.width - particle.radius;
                particle.vx *= -this.bounce;
            }

            if (particle.y - particle.radius < 0) {
                particle.y = particle.radius;
                particle.vy *= -this.bounce;
            } else if (particle.y + particle.radius > bounds.height) {
                particle.y = bounds.height - particle.radius;
                particle.vy *= -this.bounce;
            }
        }

        // 摩擦力
        particle.vx *= this.friction;
        particle.vy *= this.friction;

        // 生命周期
        particle.life -= particle.decay;
        particle.alpha = particle.life / particle.maxLife;
    }

    /**
     * 粒子间碰撞检测
     */
    checkParticleCollision(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;

        if (dist < minDist && dist > 0) {
            // 碰撞响应
            const nx = dx / dist;
            const ny = dy / dist;

            // 相对速度
            const dvx = p1.vx - p2.vx;
            const dvy = p1.vy - p2.vy;
            const dvn = dvx * nx + dvy * ny;

            // 只处理接近的粒子
            if (dvn > 0) {
                const restitution = this.bounce;
                const impulse = (1 + restitution) * dvn / (1 / p1.mass + 1 / p2.mass);

                if (!p1.pinned) {
                    p1.vx -= impulse * nx / p1.mass;
                    p1.vy -= impulse * ny / p1.mass;
                }

                if (!p2.pinned) {
                    p2.vx += impulse * nx / p2.mass;
                    p2.vy += impulse * ny / p2.mass;
                }

                // 分离粒子
                const overlap = minDist - dist;
                const separation = overlap / 2;

                if (!p1.pinned) {
                    p1.x -= nx * separation;
                    p1.y -= ny * separation;
                }

                if (!p2.pinned) {
                    p2.x += nx * separation;
                    p2.y += ny * separation;
                }

                return true;
            }
        }

        return false;
    }

    /**
     * 绘制粒子
     */
    drawParticle(ctx, particle, type = 'default') {
        if (particle.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = particle.alpha;

        const { h, s, l } = particle.color;
        const colorStr = `hsl(${h}, ${s}%, ${l}%)`;

        switch (type) {
            case 'glow':
                // 发光效果
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.radius * 3
                );
                gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l + 20}%, 1)`);
                gradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, 0.5)`);
                gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'spark':
                // 火花效果
                ctx.strokeStyle = colorStr;
                ctx.lineWidth = 1;
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2 + Date.now() / 100;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(
                        particle.x + Math.cos(angle) * particle.radius * 2,
                        particle.y + Math.sin(angle) * particle.radius * 2
                    );
                    ctx.stroke();
                }
                break;

            case 'bubble':
                // 气泡效果
                ctx.strokeStyle = colorStr;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.stroke();

                // 高光
                ctx.fillStyle = `hsla(${h}, ${s}%, ${l + 40}%, 0.5)`;
                ctx.beginPath();
                ctx.arc(
                    particle.x - particle.radius * 0.3,
                    particle.y - particle.radius * 0.3,
                    particle.radius * 0.3,
                    0, Math.PI * 2
                );
                ctx.fill();
                break;

            case 'trail':
                // 拖尾效果
                if (particle.trail.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(particle.trail[0].x, particle.trail[0].y);

                    for (let i = 1; i < particle.trail.length; i++) {
                        ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                    }
                    ctx.lineTo(particle.x, particle.y);

                    ctx.strokeStyle = colorStr;
                    ctx.lineWidth = particle.radius;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                }
                break;

            case 'neon':
                // 霓虹效果
                ctx.shadowColor = colorStr;
                ctx.shadowBlur = 15;
                ctx.fillStyle = colorStr;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'star':
                // 星星效果
                this.drawStar(ctx, particle.x, particle.y, particle.radius, colorStr);
                break;

            default:
                // 默认圆形
                ctx.fillStyle = colorStr;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();
    }

    /**
     * 绘制星星
     */
    drawStar(ctx, cx, cy, radius, color) {
        const spikes = 4;
        const outerRadius = radius;
        const innerRadius = radius * 0.4;

        ctx.fillStyle = color;
        ctx.beginPath();

        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
    }

    /**
     * 创建预设物理场景
     */
    createScene(sceneName, bounds) {
        this.clearFields();
        this.particles = this.particles || [];

        switch (sceneName) {
            case 'gravity':
                this.gravity = 0.15;
                this.friction = 0.99;
                break;

            case 'space':
                this.gravity = 0;
                this.friction = 0.995;
                // 添加中心引力
                this.addField('gravity', bounds.width / 2, bounds.height / 2, 0.1, 300);
                break;

            case 'vortex':
                this.gravity = 0;
                this.friction = 0.98;
                // 添加漩涡场
                this.addField('vortex', bounds.width / 2, bounds.height / 2, 0.3, 400);
                break;

            case 'magnetic':
                this.gravity = 0;
                this.friction = 0.99;
                // 添加正负电荷场
                this.addField('gravity', bounds.width * 0.3, bounds.height / 2, 0.15, 200);
                this.addField('repulse', bounds.width * 0.7, bounds.height / 2, 0.15, 200);
                break;

            case 'turbulence':
                this.gravity = 0;
                this.friction = 0.98;
                this.turbulence = 0.5;
                break;

            case 'bounce':
                this.gravity = 0.1;
                this.friction = 0.95;
                this.bounce = 0.9;
                break;

            case 'wave':
                this.gravity = 0;
                this.friction = 0.99;
                this.addField('wave', bounds.width / 2, bounds.height / 2, 0.2, 300);
                break;

            case 'normal':
            default:
                this.gravity = 0;
                this.wind = 0;
                this.friction = 0.98;
                this.turbulence = 0;
                break;
        }
    }

    /**
     * 创建爆炸效果
     */
    createExplosion(x, y, count = 50, options = {}) {
        const particles = [];

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const speed = options.speed || (5 + Math.random() * 10);

            particles.push(this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: options.radius || (2 + Math.random() * 4),
                mass: options.mass || (0.5 + Math.random()),
                life: options.life || 1,
                maxLife: options.maxLife || 1,
                decay: options.decay || 0.02,
                color: options.color || { h: Math.random() * 360, s: 90, l: 60 },
                trail: options.trail !== false,
                trailLength: options.trailLength || 15
            }));
        }

        return particles;
    }

    /**
     * 创建星系效果
     */
    createGalaxy(x, y, count = 100, arms = 3) {
        const particles = [];

        for (let i = 0; i < count; i++) {
            const arm = i % arms;
            const baseAngle = (arm / arms) * Math.PI * 2;
            const dist = Math.random() * 150 + 20;
            const spread = (Math.random() - 0.5) * 0.5;

            const angle = baseAngle + dist / 150 * 2 + spread;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;

            // 切向速度（形成旋转）
            const speed = 0.5 + Math.random() * 0.5;
            const tangentAngle = angle + Math.PI / 2;

            particles.push(this.createParticle(px, py, {
                vx: Math.cos(tangentAngle) * speed,
                vy: Math.sin(tangentAngle) * speed,
                radius: 1 + Math.random() * 2,
                mass: 0.5,
                life: 1,
                maxLife: 1,
                decay: 0,
                color: { h: 200 + Math.random() * 60, s: 70, l: 60 + Math.random() * 20 },
                trail: true,
                trailLength: 20
            }));
        }

        return particles;
    }
}

// 导出
window.ParticlePhysics = ParticlePhysics;
