/**
 * 分形生成器 - Fractal Generator
 * 多种数学分形图案生成
 */

class FractalGenerator {
    constructor() {
        // 分形类型
        this.types = {
            mandelbrot: '曼德博集合',
            julia: '朱丽叶集合',
            tree: '分形树',
            sierpinski: '谢尔宾斯基三角',
            koch: '科赫雪花',
            dragon: '龙形曲线',
            snowflake: '分形雪花',
            spiral: '斐波那契螺旋'
        };
    }

    /**
     * 生成所有分形图案的预览数据
     */
    generateAllPreviews(canvasWidth, canvasHeight) {
        const previews = {};
        const size = Math.min(canvasWidth, canvasHeight) * 0.8;

        for (const [type, name] of Object.entries(this.types)) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            this.generate(type, ctx, size, size);

            previews[type] = {
                name,
                dataUrl: canvas.toDataURL()
            };
        }

        return previews;
    }

    /**
     * 根据类型生成图案
     */
    generate(type, ctx, width, height, params = {}) {
        switch (type) {
            case 'mandelbrot':
                return this.drawMandelbrot(ctx, width, height, params);
            case 'julia':
                return this.drawJulia(ctx, width, height, params);
            case 'tree':
                return this.drawFractalTree(ctx, width, height, params);
            case 'sierpinski':
                return this.drawSierpinski(ctx, width, height, params);
            case 'koch':
                return this.drawKoch(ctx, width, height, params);
            case 'dragon':
                return this.drawDragon(ctx, width, height, params);
            case 'snowflake':
                return this.drawFractalSnowflake(ctx, width, height, params);
            case 'spiral':
                return this.drawFibonacciSpiral(ctx, width, height, params);
            default:
                return this.drawMandelbrot(ctx, width, height, params);
        }
    }

    /**
     * 曼德博集合
     */
    drawMandelbrot(ctx, width, height, params = {}) {
        const {
            maxIter = 100,
            zoom = 1,
            centerX = -0.5,
            centerY = 0,
            colorScheme = 'cosine'
        } = params;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const x0 = (px - width / 2) * 3.5 / (width * zoom) + centerX;
                const y0 = (py - height / 2) * 3.5 / (height * zoom) + centerY;

                let x = 0, y = 0, iter = 0;

                while (x * x + y * y <= 4 && iter < maxIter) {
                    const xtemp = x * x - y * y + x0;
                    y = 2 * x * y + y0;
                    x = xtemp;
                    iter++;
                }

                const idx = (py * width + px) * 4;
                const color = this.getColor(iter, maxIter, colorScheme);
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * 朱丽叶集合
     */
    drawJulia(ctx, width, height, params = {}) {
        const {
            maxIter = 100,
            zoom = 1,
            cReal = -0.7,
            cImag = 0.27015,
            colorScheme = 'fire'
        } = params;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                let x = (px - width / 2) * 3 / (width * zoom);
                let y = (py - height / 2) * 3 / (height * zoom);

                let iter = 0;
                while (x * x + y * y < 4 && iter < maxIter) {
                    const xtemp = x * x - y * y + cReal;
                    y = 2 * x * y + cImag;
                    x = xtemp;
                    iter++;
                }

                const idx = (py * width + px) * 4;
                const color = this.getColor(iter, maxIter, colorScheme);
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * 分形树
     */
    drawFractalTree(ctx, width, height, params = {}) {
        const {
            depth = 10,
            angle = 25,
            lengthRatio = 0.7,
            baseLength = height * 0.3,
            trunkColor = { r: 139, g: 90, b: 43 },
            leafColor = { r: 34, g: 139, b: 34 }
        } = params;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        const drawBranch = (x, y, length, angle, currentDepth) => {
            if (currentDepth === 0 || length < 2) return;

            const endX = x + length * Math.sin(angle * Math.PI / 180);
            const endY = y - length * Math.cos(angle * Math.PI / 180);

            // 颜色从树干色渐变到叶绿色
            const t = currentDepth / depth;
            const r = Math.round(trunkColor.r + (leafColor.r - trunkColor.r) * (1 - t));
            const g = Math.round(trunkColor.g + (leafColor.g - trunkColor.g) * (1 - t));
            const b = Math.round(trunkColor.b + (leafColor.b - trunkColor.b) * (1 - t));

            ctx.beginPath();
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = Math.max(1, currentDepth / 2);
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // 递归绘制左右分支
            const newLength = length * lengthRatio;
            drawBranch(endX, endY, newLength, angle - (90 - angle), currentDepth - 1);
            drawBranch(endX, endY, newLength, angle + (90 - angle), currentDepth - 1);
        };

        // 从底部中心开始
        drawBranch(width / 2, height * 0.9, baseLength, 0, depth);
    }

    /**
     * 谢尔宾斯基三角
     */
    drawSierpinski(ctx, width, height, params = {}) {
        const { depth = 8, color = '#00ff88' } = params;

        const drawTriangle = (x1, y1, x2, y2, x3, y3, currentDepth) => {
            if (currentDepth === 0) {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.closePath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.stroke();
                return;
            }

            // 计算各边中点
            const mx1 = (x1 + x2) / 2;
            const my1 = (y1 + y2) / 2;
            const mx2 = (x2 + x3) / 2;
            const my2 = (y2 + y3) / 2;
            const mx3 = (x3 + x1) / 2;
            const my3 = (y3 + y1) / 2;

            // 递归绘制三个子三角形
            drawTriangle(x1, y1, mx1, my1, mx3, my3, currentDepth - 1);
            drawTriangle(mx1, my1, x2, y2, mx2, my2, currentDepth - 1);
            drawTriangle(mx3, my3, mx2, my2, x3, y3, currentDepth - 1);
        };

        // 等边三角形顶点
        const topX = width / 2;
        const topY = height * 0.1;
        const bottomY = height * 0.9;
        const side = Math.min(width * 0.8, (bottomY - topY) * 1.732);

        drawTriangle(
            topX, topY,
            topX - side / 2, bottomY,
            topX + side / 2, bottomY,
            depth
        );
    }

    /**
     * 科赫曲线
     */
    drawKoch(ctx, width, height, params = {}) {
        const { depth = 5, color = '#00ffff' } = params;

        const drawKochLine = (x1, y1, x2, y2, currentDepth) => {
            if (currentDepth === 0) {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                return;
            }

            const dx = x2 - x1;
            const dy = y2 - y1;

            // 分点
            const x3 = x1 + dx / 3;
            const y3 = y1 + dy / 3;
            const x5 = x1 + dx * 2 / 3;
            const y5 = y1 + dy * 2 / 3;

            // 顶点
            const angle = Math.atan2(dy, dx) - Math.PI / 3;
            const len = Math.sqrt(dx * dx + dy * dy) / 3;
            const x4 = x3 + len * Math.cos(angle);
            const y4 = y3 + len * Math.sin(angle);

            // 递归
            drawKochLine(x1, y1, x3, y3, currentDepth - 1);
            drawKochLine(x3, y3, x4, y4, currentDepth - 1);
            drawKochLine(x4, y4, x5, y5, currentDepth - 1);
            drawKochLine(x5, y5, x2, y2, currentDepth - 1);
        };

        // 绘制科赫曲线形成三角形
        const centerX = width / 2;
        const centerY = height * 0.55;
        const size = Math.min(width, height) * 0.7;

        const points = [];
        for (let i = 0; i < 3; i++) {
            const angle = -Math.PI / 2 + (i * 2 * Math.PI / 3);
            points.push({
                x: centerX + size * Math.cos(angle) / 2,
                y: centerY + size * Math.sin(angle) / 2
            });
        }

        for (let i = 0; i < 3; i++) {
            drawKochLine(
                points[i].x, points[i].y,
                points[(i + 1) % 3].x, points[(i + 1) % 3].y,
                depth
            );
        }
    }

    /**
     * 龙形曲线
     */
    drawDragon(ctx, width, height, params = {}) {
        const { iterations = 15, color = '#ff6600' } = params;

        // 生成龙形曲线序列
        const sequence = [0]; // 0 = 左, 1 = 右
        for (let i = 0; i < iterations; i++) {
            const newSeq = [...sequence, 1];
            for (let j = sequence.length - 1; j >= 0; j--) {
                newSeq.push(1 - sequence[j]);
            }
            sequence.length = 0;
            sequence.push(...newSeq);
        }

        // 计算需要的空间
        const scale = Math.min(width, height) * 0.8 / (iterations + 2);

        let x = width / 2;
        let y = height / 2;
        let dir = 0; // 0 = 右, 1 = 上, 2 = 左, 3 = 下
        const dx = [1, 0, -1, 0];
        const dy = [0, -1, 0, 1];

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(x, y);

        // 采样绘制（避免点太多）
        const step = Math.max(1, Math.floor(sequence.length / 2000));
        for (let i = 0; i < sequence.length; i += step) {
            dir = (dir + sequence[i]) % 4;
            x += dx[dir] * scale;
            y += dy[dir] * scale;
            ctx.lineTo(x, y);
        }

        ctx.stroke();
    }

    /**
     * 分形雪花
     */
    drawFractalSnowflake(ctx, width, height, params = {}) {
        const { depth = 4, color = '#ffffff' } = params;

        const drawKochLine = (x1, y1, x2, y2, currentDepth) => {
            if (currentDepth === 0) {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = Math.max(0.5, 2 - currentDepth * 0.3);
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                return;
            }

            const dx = x2 - x1;
            const dy = y2 - y1;

            const x3 = x1 + dx / 3;
            const y3 = y1 + dy / 3;
            const x5 = x1 + dx * 2 / 3;
            const y5 = y1 + dy * 2 / 3;

            const angle = Math.atan2(dy, dx) - Math.PI / 3;
            const len = Math.sqrt(dx * dx + dy * dy) / 3;
            const x4 = x3 + len * Math.cos(angle);
            const y4 = y3 + len * Math.sin(angle);

            drawKochLine(x1, y1, x3, y3, currentDepth - 1);
            drawKochLine(x3, y3, x4, y4, currentDepth - 1);
            drawKochLine(x4, y4, x5, y5, currentDepth - 1);
            drawKochLine(x5, y5, x2, y2, currentDepth - 1);
        };

        const centerX = width / 2;
        const centerY = height / 2;
        const size = Math.min(width, height) * 0.35;

        // 六角雪花
        for (let i = 0; i < 6; i++) {
            const angle1 = i * Math.PI / 3;
            const angle2 = (i + 1) * Math.PI / 3;

            const x1 = centerX + size * Math.cos(angle1);
            const y1 = centerY + size * Math.sin(angle1);
            const x2 = centerX + size * Math.cos(angle2);
            const y2 = centerY + size * Math.sin(angle2);

            drawKochLine(x1, y1, x2, y2, depth);
        }
    }

    /**
     * 斐波那契螺旋
     */
    drawFibonacciSpiral(ctx, width, height, params = {}) {
        const {
            count = 10,
            baseSize = 10,
            rotation = 0,
            hue = 200,
            lineWidth = 2
        } = params;

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(rotation * Math.PI / 180);

        let a = baseSize;
        let b = baseSize;

        for (let i = 0; i < count; i++) {
            // 绘制四分之一圆弧
            ctx.beginPath();
            const radius = Math.sqrt(a * a + b * b);
            ctx.arc(0, 0, radius, 0, Math.PI / 2);
            ctx.strokeStyle = `hsl(${hue + i * 20}, 80%, 60%)`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            // 旋转画布准备下一个弧
            ctx.translate(a, b);
            ctx.rotate(-Math.PI / 2);

            // 计算下一个斐波那契数
            const next = a + b;
            a = b;
            b = next;
        }

        ctx.restore();
    }

    /**
     * 获取分形颜色
     */
    getColor(iter, maxIter, scheme = 'cosine') {
        if (iter === maxIter) {
            return { r: 0, g: 0, b: 0 }; // 黑色表示在集合内
        }

        const t = iter / maxIter;

        switch (scheme) {
            case 'fire':
                return {
                    r: Math.round(255 * Math.min(1, t * 3)),
                    g: Math.round(255 * Math.max(0, Math.min(1, (t - 0.33) * 3))),
                    b: Math.round(255 * Math.max(0, (t - 0.67) * 3))
                };

            case 'ocean':
                return {
                    r: Math.round(50 * (1 - t)),
                    g: Math.round(100 + 100 * t),
                    b: Math.round(200 + 55 * t)
                };

            case 'cosine':
            default:
                const p = 0.5 * Math.cos(t * Math.PI * 6) + 0.5;
                return {
                    r: Math.round(9 * Math.cos(t * Math.PI * 6 + 0) + 8 * Math.cos(t * Math.PI * 4) + 9),
                    g: Math.round(3 * Math.cos(t * Math.PI * 6 + 2) + 5 * Math.cos(t * Math.PI * 4 + 2) + 5),
                    b: Math.round(9 * Math.cos(t * Math.PI * 6 + 4) + 8 * Math.cos(t * Math.PI * 4 + 4) + 9)
                };
        }
    }

    /**
     * 生成随机分形参数
     */
    generateRandomParams(type) {
        const baseParams = {
            maxIter: 50 + Math.floor(Math.random() * 100),
            colorScheme: ['cosine', 'fire', 'ocean'][Math.floor(Math.random() * 3)]
        };

        switch (type) {
            case 'mandelbrot':
                return {
                    ...baseParams,
                    zoom: 0.5 + Math.random() * 2,
                    centerX: -0.5 + (Math.random() - 0.5) * 0.5,
                    centerY: (Math.random() - 0.5) * 0.5
                };
            case 'julia':
                return {
                    ...baseParams,
                    zoom: 0.5 + Math.random() * 1.5,
                    cReal: -1 + Math.random() * 2,
                    cImag: -1 + Math.random() * 2
                };
            case 'tree':
                return {
                    depth: 7 + Math.floor(Math.random() * 6),
                    angle: 15 + Math.floor(Math.random() * 35),
                    lengthRatio: 0.6 + Math.random() * 0.3,
                    trunkColor: this.randomRGB(),
                    leafColor: this.randomGreenRGB()
                };
            case 'sierpinski':
                return {
                    depth: 5 + Math.floor(Math.random() * 6),
                    color: this.randomHueColor(120, 30) // 绿色系
                };
            case 'koch':
                return {
                    depth: 3 + Math.floor(Math.random() * 4),
                    color: this.randomHueColor(180, 40) // 青色系
                };
            case 'dragon':
                return {
                    iterations: 12 + Math.floor(Math.random() * 6),
                    color: this.randomHueColor(30, 30) // 橙黄色系
                };
            case 'snowflake':
                return {
                    depth: 3 + Math.floor(Math.random() * 3),
                    color: `hsl(${200 + Math.random() * 60}, 80%, ${70 + Math.random() * 30}%)`
                };
            case 'spiral':
                return {
                    count: 8 + Math.floor(Math.random() * 5),
                    baseSize: 5 + Math.random() * 15,
                    rotation: Math.random() * 360,
                    hue: Math.random() * 360,
                    lineWidth: 1 + Math.random() * 3
                };
            default:
                return baseParams;
        }
    }

    randomRGB() {
        return {
            r: Math.floor(Math.random() * 100 + 100),
            g: Math.floor(Math.random() * 80 + 50),
            b: Math.floor(Math.random() * 50 + 20)
        };
    }

    randomGreenRGB() {
        return {
            r: Math.floor(Math.random() * 50),
            g: Math.floor(Math.random() * 100 + 100),
            b: Math.floor(Math.random() * 50)
        };
    }

    randomHueColor(hue, hueRange) {
        return `hsl(${hue - hueRange + Math.random() * hueRange * 2}, ${60 + Math.random() * 40}%, ${50 + Math.random() * 30}%)`;
    }
}

// 导出
window.FractalGenerator = FractalGenerator;
