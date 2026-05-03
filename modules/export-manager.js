/**
 * 导出与分享功能 - Export & Share
 * 支持多种格式导出
 */

class ExportManager {
    constructor() {
        this.formats = ['png', 'jpg', 'gif', 'webm'];
    }

    /**
     * 导出为图片
     */
    exportImage(format = 'png', quality = 0.95) {
        const state = window.StateManager?.state;
        if (!state) {
            console.error('[ExportManager] StateManager not found');
            return null;
        }

        const mainCanvas = document.getElementById('main-canvas');
        const backgroundCanvas = document.getElementById('background-canvas');
        const particleCanvas = document.getElementById('particle-canvas');

        if (!mainCanvas) {
            console.error('[ExportManager] Main canvas not found');
            return null;
        }

        // 创建导出画布
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = state.canvasWidth;
        exportCanvas.height = state.canvasHeight;
        const ctx = exportCanvas.getContext('2d');

        // 绘制背景
        if (backgroundCanvas && state.showBackground) {
            ctx.drawImage(backgroundCanvas, 0, 0);
        } else if (state.backgroundColor !== 'transparent') {
            ctx.fillStyle = state.backgroundColor || '#000';
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        }

        // 绘制主图案
        ctx.drawImage(mainCanvas, 0, 0);

        // 绘制粒子
        if (particleCanvas) {
            ctx.drawImage(particleCanvas, 0, 0);
        }

        // 导出
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const dataUrl = exportCanvas.toDataURL(mimeType, quality);

        return dataUrl;
    }

    /**
     * 下载图片
     */
    downloadImage(format = 'png', quality = 0.95) {
        const dataUrl = this.exportImage(format, quality);
        if (!dataUrl) return false;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `kaleidoscope-${timestamp}.${format}`;

        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`[ExportManager] Downloaded: ${filename}`);
        return true;
    }

    /**
     * 导出为 SVG
     */
    exportSVG() {
        const state = window.StateManager?.state;
        if (!state) return null;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('width', state.canvasWidth);
        svg.setAttribute('height', state.canvasHeight);
        svg.setAttribute('viewBox', `0 0 ${state.canvasWidth} ${state.canvasHeight}`);

        // 添加背景
        if (state.backgroundColor && state.backgroundColor !== 'transparent') {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', '100%');
            rect.setAttribute('height', '100%');
            rect.setAttribute('fill', state.backgroundColor);
            svg.appendChild(rect);
        }

        // 添加图案信息注释
        const comment = document.createComment(
            `Kaleidoscope Pattern - Generated at ${new Date().toISOString()}\n` +
            `Symmetry: ${state.symmetryCount} | Brush: ${state.brushType || 'default'}`
        );
        svg.appendChild(comment);

        return new XMLSerializer().serializeToString(svg);
    }

    /**
     * 下载 SVG
     */
    downloadSVG() {
        const svgString = this.exportSVG();
        if (!svgString) return false;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `kaleidoscope-${timestamp}.svg`;

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        console.log(`[ExportManager] Downloaded: ${filename}`);
        return true;
    }

    /**
     * 生成种子码（配置参数编码）
     */
    generateSeedCode() {
        const state = window.StateManager?.state;
        if (!state) return null;

        const config = {
            s: state.symmetryCount || 8,
            r: state.rotationSpeed || 0,
            b: state.brushType || 'default',
            w: state.brushWidth || 10,
            c: state.paletteIndex || 0,
            t: state.trailMode ? 1 : 0,
            g: state.glowMode ? 1 : 0,
            p: state.particleEnabled ? 1 : 0,
            a: state.animationMode || 'none'
        };

        // 简化为 base64
        const json = JSON.stringify(config);
        const encoded = btoa(json);

        return `KP-${encoded.slice(0, 16)}`;
    }

    /**
     * 从种子码恢复配置
     */
    loadFromSeedCode(seedCode) {
        try {
            const encoded = seedCode.replace('KP-', '');
            const json = atob(encoded);
            const config = JSON.parse(json);

            const state = window.StateManager;
            if (!state) return false;

            // 应用配置
            state.setState({
                symmetryCount: config.s || 8,
                rotationSpeed: config.r || 0,
                brushType: config.b || 'default',
                brushWidth: config.w || 10,
                paletteIndex: config.c || 0,
                trailMode: config.t === 1,
                glowMode: config.g === 1,
                particleEnabled: config.p === 1,
                animationMode: config.a || 'none'
            });

            console.log('[ExportManager] Loaded from seed:', seedCode);
            return true;
        } catch (e) {
            console.error('[ExportManager] Invalid seed code:', e);
            return false;
        }
    }

    /**
     * 复制种子码到剪贴板
     */
    async copySeedCode() {
        const seed = this.generateSeedCode();
        if (!seed) return false;

        try {
            await navigator.clipboard.writeText(seed);
            console.log('[ExportManager] Copied seed:', seed);
            return true;
        } catch (e) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = seed;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    }

    /**
     * 分享到 URL
     */
    generateShareURL() {
        const seed = this.generateSeedCode();
        if (!seed) return null;

        const url = new URL(window.location.href);
        url.searchParams.set('seed', seed);

        return url.toString();
    }

    /**
     * 从 URL 加载配置
     */
    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const seed = params.get('seed');

        if (seed) {
            return this.loadFromSeedCode(seed);
        }
        return false;
    }

    /**
     * 开始 GIF 录制
     */
    startGifRecording(duration = 5000, fps = 20) {
        if (this._isRecording) {
            console.warn('[ExportManager] Already recording');
            return false;
        }

        const state = window.StateManager?.state;
        if (!state) return false;

        this._isRecording = true;
        this._recordingFrames = [];
        this._recordingFps = fps;
        this._recordingDuration = duration;
        this._recordingStartTime = Date.now();

        const frameInterval = 1000 / fps;
        const maxFrames = Math.floor(duration / frameInterval);

        const captureFrame = () => {
            if (!this._isRecording) return;

            const mainCanvas = document.getElementById('main-canvas');
            if (mainCanvas) {
                // 创建缩略帧
                const thumb = document.createElement('canvas');
                const scale = 0.5; // 降低分辨率加快处理
                thumb.width = state.canvasWidth * scale;
                thumb.height = state.canvasHeight * scale;
                const ctx = thumb.getContext('2d');
                ctx.drawImage(mainCanvas, 0, 0, thumb.width, thumb.height);

                this._recordingFrames.push(thumb);
            }

            if (this._recordingFrames.length >= maxFrames ||
                Date.now() - this._recordingStartTime >= duration) {
                this.stopGifRecording();
            } else {
                setTimeout(captureFrame, frameInterval);
            }
        };

        captureFrame();
        console.log('[ExportManager] Recording started:', duration, 'ms');
        return true;
    }

    /**
     * 停止 GIF 录制并下载
     */
    async stopGifRecording() {
        if (!this._isRecording) return;

        this._isRecording = false;
        const frames = this._recordingFrames;

        if (frames.length < 2) {
            console.warn('[ExportManager] Not enough frames');
            return;
        }

        console.log('[ExportManager] Processing GIF with', frames.length, 'frames...');

        // 使用 gif.js 如果可用，否则下载最后一帧
        if (window.GIF) {
            try {
                const gif = new GIF({
                    workers: 2,
                    quality: 10,
                    width: frames[0].width,
                    height: frames[0].height,
                    workerScript: 'lib/gif.worker.js'
                });

                frames.forEach(frame => {
                    gif.addFrame(frame, { delay: 1000 / this._recordingFps });
                });

                gif.on('finished', (blob) => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `kaleidoscope-${Date.now()}.gif`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                    console.log('[ExportManager] GIF downloaded');
                });

                gif.render();
            } catch (e) {
                console.error('[ExportManager] GIF error:', e);
            }
        } else {
            // 降级：下载最后一帧
            console.log('[ExportManager] gif.js not found, downloading last frame');
            this.downloadImage('png');
        }

        this._recordingFrames = [];
    }

    /**
     * 分享到社交媒体
     */
    shareToTwitter() {
        const text = encodeURIComponent('我用万花筒绘图工具创作了一幅图案！✨🎨');
        const url = encodeURIComponent(this.generateShareURL() || window.location.href);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

        window.open(twitterUrl, '_blank', 'width=550,height=450');
    }

    /**
     * 分享到微信（显示二维码）
     */
    showWechatShare() {
        const url = this.generateShareURL() || window.location.href;

        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <h3>分享链接</h3>
                <p>复制以下链接分享你的创作：</p>
                <input type="text" readonly value="${url}" class="share-url-input">
                <button class="btn-copy">复制链接</button>
                <button class="btn-close">关闭</button>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定事件
        modal.querySelector('.btn-copy').onclick = async () => {
            await this.copySeedCode();
            alert('已复制到剪贴板！');
        };
        modal.querySelector('.btn-close').onclick = () => {
            document.body.removeChild(modal);
        };
        modal.onclick = (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        };
    }
}

// 导出 - 实例化以便调用实例方法
window.ExportManager = new ExportManager();
