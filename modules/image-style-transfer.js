/**
 * 图像风格迁移 - Image Style Transfer
 * 将图像转换为万花筒风格
 */

class ImageStyleTransfer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * 处理图像
     */
    async processImage(imageSource, options = {}) {
        const {
            symmetryCount = 8,
            style = 'mirror', // mirror, radial, spiral, kaleidoscope
            brightness = 1,
            saturation = 1,
            blur = 0,
            cropToCircle = false
        } = options;

        return new Promise((resolve, reject) => {
            try {
                // 获取图像源
                const img = this.loadImage(imageSource);
                if (!img) {
                    reject(new Error('Failed to load image'));
                    return;
                }

                img.onload = () => {
                    // 设置画布大小
                    const size = Math.max(img.width, img.height);
                    this.canvas.width = size;
                    this.canvas.height = size;

                    // 绘制原图
                    this.ctx.clearRect(0, 0, size, size);
                    this.ctx.drawImage(img, 0, 0, size, size);

                    // 应用处理
                    this.applyStyle(style, symmetryCount);
                    this.applyAdjustments(brightness, saturation, blur);
                    this.applyCrop(cropToCircle);

                    resolve(this.canvas.toDataURL());
                };

                img.onerror = () => reject(new Error('Image load error'));
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * 加载图像
     */
    loadImage(source) {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        if (typeof source === 'string') {
            img.src = source;
        } else if (source instanceof File) {
            img.src = URL.createObjectURL(source);
        } else if (source instanceof HTMLImageElement) {
            return source;
        }

        return img;
    }

    /**
     * 应用风格
     */
    applyStyle(style, symmetryCount) {
        const size = this.canvas.width;
        const cx = size / 2;
        const cy = size / 2;

        // 获取原始图像数据
        const imageData = this.ctx.getImageData(0, 0, size, size);
        const processedData = this.ctx.createImageData(size, size);
        const data = imageData.data;
        const outData = processedData.data;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;

                // 转换为极坐标
                const dx = x - cx;
                const dy = y - cy;
                const radius = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                // 根据风格计算映射位置
                let srcX, srcY;

                switch (style) {
                    case 'mirror':
                        // 镜像效果
                        const mirrorAngle = (angle % (Math.PI * 2 / symmetryCount));
                        const mirroredAngle = Math.abs(mirrorAngle - Math.PI / symmetryCount);
                        srcX = cx + Math.cos(mirroredAngle) * radius;
                        srcY = cy + Math.sin(mirroredAngle) * radius;
                        break;

                    case 'radial':
                        // 径向对称
                        const sectorAngle = (Math.PI * 2 / symmetryCount);
                        const normalizedAngle = ((angle % sectorAngle) + sectorAngle) % sectorAngle;
                        const reflectX = normalizedAngle > sectorAngle / 2;
                        const adjustedAngle = reflectX ? sectorAngle - normalizedAngle : normalizedAngle;
                        srcX = cx + Math.cos(adjustedAngle) * radius;
                        srcY = cy + Math.sin(adjustedAngle) * radius;
                        break;

                    case 'spiral':
                        // 螺旋效果
                        const spiralAngle = angle + radius / 20;
                        srcX = cx + Math.cos(spiralAngle) * radius;
                        srcY = cy + Math.sin(spiralAngle) * radius;
                        break;

                    case 'kaleidoscope':
                    default:
                        // 完整万花筒
                        const kAngle = angle * symmetryCount / (2 * Math.PI);
                        const kSector = (Math.PI * 2 / symmetryCount);
                        const kNormalized = ((kAngle % 1) + 1) % 1;
                        const kReflected = kNormalized > 0.5 ? 1 - kNormalized : kNormalized;
                        const finalAngle = kReflected * kSector;
                        srcX = cx + Math.cos(finalAngle) * radius;
                        srcY = cy + Math.sin(finalAngle) * radius;
                        break;
                }

                // 双线性插值采样
                const sx = Math.floor(srcX);
                const sy = Math.floor(srcY);

                if (sx >= 0 && sx < size - 1 && sy >= 0 && sy < size - 1) {
                    const fx = srcX - sx;
                    const fy = srcY - sy;

                    const p1 = (sy * size + sx) * 4;
                    const p2 = (sy * size + sx + 1) * 4;
                    const p3 = ((sy + 1) * size + sx) * 4;
                    const p4 = ((sy + 1) * size + sx + 1) * 4;

                    outData[idx] = this.bilerp(data[p1], data[p2], data[p3], data[p4], fx, fy, 0);
                    outData[idx + 1] = this.bilerp(data[p1 + 1], data[p2 + 1], data[p3 + 1], data[p4 + 1], fx, fy, 1);
                    outData[idx + 2] = this.bilerp(data[p1 + 2], data[p2 + 2], data[p3 + 2], data[p4 + 2], fx, fy, 2);
                    outData[idx + 3] = 255;
                } else {
                    outData[idx] = 0;
                    outData[idx + 1] = 0;
                    outData[idx + 2] = 0;
                    outData[idx + 3] = 255;
                }
            }
        }

        this.ctx.putImageData(processedData, 0, 0);
    }

    /**
     * 双线性插值
     */
    bilerp(v1, v2, v3, v4, fx, fy, channel) {
        const top = v1 + (v2 - v1) * fx;
        const bottom = v3 + (v4 - v3) * fx;
        return top + (bottom - top) * fy;
    }

    /**
     * 应用调整
     */
    applyAdjustments(brightness, saturation, blur) {
        if (brightness !== 1 || saturation !== 1) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                // 亮度
                data[i] = Math.min(255, data[i] * brightness);
                data[i + 1] = Math.min(255, data[i + 1] * brightness);
                data[i + 2] = Math.min(255, data[i + 2] * brightness);

                // 饱和度
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = Math.min(255, gray + (data[i] - gray) * saturation);
                data[i + 1] = Math.min(255, gray + (data[i + 1] - gray) * saturation);
                data[i + 2] = Math.min(255, gray + (data[i + 2] - gray) * saturation);
            }

            this.ctx.putImageData(imageData, 0, 0);
        }

        if (blur > 0) {
            this.ctx.filter = `blur(${blur}px)`;
            this.ctx.drawImage(this.canvas, 0, 0);
            this.ctx.filter = 'none';
        }
    }

    /**
     * 应用裁剪
     */
    applyCrop(cropToCircle) {
        if (!cropToCircle) return;

        const size = this.canvas.width;
        const cx = size / 2;
        const cy = size / 2;
        const radius = size / 2;

        // 创建圆形裁剪
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.beginPath();
        tempCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        tempCtx.clip();

        tempCtx.drawImage(this.canvas, 0, 0);

        // 填充背景
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, size, size);
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    /**
     * 从文件输入处理
     */
    async processFromFile(file, options = {}) {
        return this.processImage(file, options);
    }

    /**
     * 从 URL 处理
     */
    async processFromURL(url, options = {}) {
        return this.processImage(url, options);
    }

    /**
     * 实时摄像头处理
     */
    setupCamera(videoElement, targetCanvas, options = {}) {
        const {
            symmetryCount = 8,
            style = 'kaleidoscope',
            fps = 30
        } = options;

        let stream = null;
        let processing = false;

        const start = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: 640, height: 480 }
                });
                videoElement.srcObject = stream;
                await videoElement.play();

                const processFrame = async () => {
                    if (!processing) return;

                    // 绘制视频帧
                    this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);

                    // 应用风格
                    this.applyStyle(style, symmetryCount);

                    // 绘制到目标画布
                    targetCanvas.width = this.canvas.width;
                    targetCanvas.height = this.canvas.height;
                    targetCanvas.getContext('2d').drawImage(this.canvas, 0, 0);

                    setTimeout(() => requestAnimationFrame(processFrame), 1000 / fps);
                };

                processing = true;
                processFrame();
            } catch (e) {
                console.error('[ImageStyleTransfer] Camera error:', e);
            }
        };

        const stop = () => {
            processing = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };

        return { start, stop };
    }

    /**
     * 提取图像颜色
     */
    extractColors(imageSource, count = 5) {
        return new Promise((resolve) => {
            const img = this.loadImage(imageSource);
            img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 100;
                tempCanvas.height = 100;
                const tempCtx = tempCanvas.getContext('2d');

                tempCtx.drawImage(img, 0, 0, 100, 100);
                const imageData = tempCtx.getImageData(0, 0, 100, 100);
                const data = imageData.data;

                // 简单颜色量化
                const colorCounts = {};

                for (let i = 0; i < data.length; i += 4) {
                    const r = Math.round(data[i] / 32) * 32;
                    const g = Math.round(data[i + 1] / 32) * 32;
                    const b = Math.round(data[i + 2] / 32) * 32;
                    const key = `${r},${g},${b}`;
                    colorCounts[key] = (colorCounts[key] || 0) + 1;
                }

                // 排序并取前几个
                const sorted = Object.entries(colorCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, count)
                    .map(([key]) => {
                        const [r, g, b] = key.split(',').map(Number);
                        return `rgb(${r},${g},${b})`;
                    });

                resolve(sorted);
            };
        });
    }
}

// 导出
window.ImageStyleTransfer = ImageStyleTransfer;
