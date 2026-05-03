/**
 * 键盘快捷键处理模块
 * 提供全面的键盘快捷键支持
 */
const KeyboardHandler = {
    /**
     * 初始化键盘事件监听
     */
    init() {
        document.addEventListener('keydown', (e) => this._handleKeydown(e));
    },

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} e
     */
    _handleKeydown(e) {
        // 不要在处理输入框时触发快捷键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key.toLowerCase()) {
            // === 撤销/重做 ===
            case 'z':
                if (e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    this._undo();
                }
                break;
            case 'y':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this._redo();
                }
                break;

            // === 功能快捷键（无Ctrl组合） ===
            case 'c':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._clearCanvas();
                }
                break;
            case 't':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._toggleTrail();
                }
                break;
            case 'm':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._toggleMusic();
                }
                break;
            case 's':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._saveImage();
                }
                break;
            case 'r':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._randomConfig();
                }
                break;

            // === 方向键 ===
            case 'arrowup':
                e.preventDefault();
                this._adjustSymmetry(1);
                break;
            case 'arrowdown':
                e.preventDefault();
                this._adjustSymmetry(-1);
                break;
            case 'arrowleft':
                e.preventDefault();
                this._adjustSpeed(-5);
                break;
            case 'arrowright':
                e.preventDefault();
                this._adjustSpeed(5);
                break;

            // === 空格 ===
            case ' ':
                e.preventDefault();
                this._toggleAutoRotate();
                break;

            // === 数字键切换画笔 ===
            case '1':
                e.preventDefault();
                this._setBrush('solid');
                break;
            case '2':
                e.preventDefault();
                this._setBrush('dashed');
                break;
            case '3':
                e.preventDefault();
                this._setBrush('dotted');
                break;
            case '4':
                e.preventDefault();
                this._setBrush('spray');
                break;

            // === G 切换发光 ===
            case 'g':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._toggleGlow();
                }
                break;
            // === A 切换动态动画 ===
            case 'a':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._toggleAnimation();
                }
                break;

            // === E 进化变异 ===
            case 'e':
                if (!e.ctrlKey && typeof CreativeExtensions !== 'undefined') {
                    e.preventDefault();
                    CreativeExtensions.evolvePattern();
                }
                break;

            // === H 图案杂交 ===
            case 'h':
                if (!e.ctrlKey && typeof CreativeExtensions !== 'undefined') {
                    e.preventDefault();
                    CreativeExtensions.hybridizePattern();
                }
                break;

            // === V 音频可视化 ===
            case 'v':
                if (!e.ctrlKey && typeof CreativeExtensions !== 'undefined') {
                    e.preventDefault();
                    CreativeExtensions.toggleVisualization();
                }
                break;

            // === B 主题故事 ===
            case 'b':
                if (!e.ctrlKey && typeof CreativeExtensions !== 'undefined') {
                    e.preventDefault();
                    CreativeExtensions.applyRandomStory();
                }
                break;

            // === X 导出菜单 ===
            case 'x':
                if (!e.ctrlKey && typeof ExportManager !== 'undefined') {
                    e.preventDefault();
                    this._showExportMenu();
                }
                break;

            // === L 遗传算法 ===
            case 'l':
                if (!e.ctrlKey && typeof GeneticAlgorithm !== 'undefined') {
                    e.preventDefault();
                    this._showGeneticPanel();
                }
                break;

            // === P 粒子物理 ===
            case 'p':
                if (!e.ctrlKey && typeof ParticlePhysics !== 'undefined') {
                    e.preventDefault();
                    this._togglePhysics();
                }
                break;

            // === S 分形生成 ===
            case 's':
                if (!e.ctrlKey && typeof FractalGenerator !== 'undefined') {
                    e.preventDefault();
                    this._showFractalPanel();
                }
                break;

            // === I 图片导入 ===
            case 'i':
                if (!e.ctrlKey && typeof ImageStyleTransfer !== 'undefined') {
                    e.preventDefault();
                    this._showImageImport();
                }
                break;

            // === K AI模板 ===
            case 'k':
                if (!e.ctrlKey && typeof AITemplateGenerator !== 'undefined') {
                    e.preventDefault();
                    this._showAITemplate();
                }
                break;
        }
    },

    _undo() {
        if (StateManager.undo()) {
            this._showToast('↩ 撤销');
        }
    },

    _redo() {
        if (StateManager.redo()) {
            this._showToast('↪ 重做');
        }
    },

    _clearCanvas() {
        const btn = document.getElementById('clear-canvas');
        if (btn) btn.click();
    },

    _toggleTrail() {
        StateManager.setState({ trailMode: !StateManager.state.trailMode });
        const btn = document.getElementById('trail-toggle');
        if (btn) btn.classList.toggle('active');
        this._showToast(StateManager.state.trailMode ? '🌊 拖尾：开' : '🌊 拖尾：关');
    },

    _toggleMusic() {
        const btn = document.getElementById('music-toggle');
        if (btn) btn.click();
    },

    _saveImage() {
        const btn = document.getElementById('save-png');
        if (btn) btn.click();
    },

    _randomConfig() {
        RandomGenerator.applyRandom();
        this._showToast('🎲 随机生成配置！');
    },

    _adjustSymmetry(delta) {
        let count = StateManager.state.symmetryCount + delta;
        count = Math.max(2, Math.min(24, count));
        StateManager.setState({ symmetryCount: count });
        const label = document.getElementById('symmetry-count-label');
        if (label) label.textContent = count;
        const slider = document.getElementById('symmetry-count');
        if (slider) slider.value = count;
    },

    _adjustSpeed(delta) {
        let speed = StateManager.state.rotationSpeed + delta;
        speed = Math.max(0, Math.min(100, speed));
        StateManager.setState({ rotationSpeed: speed });
        const slider = document.getElementById('rotation-speed');
        if (slider) slider.value = speed;
        const label = document.getElementById('rotation-speed-label');
        if (label) label.textContent = speed;
    },

    _toggleAutoRotate() {
        const btn = document.getElementById('auto-rotate-toggle');
        if (btn) btn.click();
    },

    _setBrush(type) {
        StateManager.setState({ brushType: type });
        const select = document.getElementById('brush-type');
        if (select) select.value = type;
        this._showToast(`✏️ 画笔：${this._brushName(type)}`);
    },

    _toggleGlow() {
        StateManager.setState({ glowEnabled: !StateManager.state.glowEnabled });
        const btn = document.getElementById('glow-toggle');
        if (btn) btn.classList.toggle('active');
        this._showToast(StateManager.state.glowEnabled ? '✨ 发光：开' : '✨ 发光：关');
    },

    _toggleAnimation() {
        const btn = document.getElementById('animation-toggle');
        if (btn) btn.click();
        const isActive = btn ? btn.classList.contains('active') : false;
        this._showToast(isActive ? '✨ 动画：开' : '✨ 动画：关');
    },

    _brushName(type) {
        const names = { solid: '实线', dashed: '虚线', dotted: '点线', spray: '喷枪' };
        return names[type] || type;
    },

    _showToast(msg) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = msg;
            toast.classList.add('show');
            clearTimeout(toast._hideTimer);
            toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 1200);
        }
    },

    // === 新功能方法 ===

    _showExportMenu() {
        const menu = document.getElementById('export-menu');
        if (menu) {
            menu.classList.toggle('show');
            this._showToast('📤 导出菜单');
        } else {
            // 快速导出PNG
            if (typeof ExportManager !== 'undefined') {
                ExportManager.downloadImage('png');
                this._showToast('📷 已保存PNG');
            }
        }
    },

    _showGeneticPanel() {
        // 初始化遗传算法
        if (!window._geneticAlgorithm) {
            window._geneticAlgorithm = new GeneticAlgorithm();
            window._geneticAlgorithm.initialize();
        }
        // 生成预览
        const previews = window._geneticAlgorithm.generatePreviews();
        this._showPreviewModal('🧬 遗传进化', previews, (index) => {
            const chrom = window._geneticAlgorithm.population[index];
            window._geneticAlgorithm.applyChromosome(chrom);
            this._showToast(`🧬 应用: ${chrom.structure} + ${chrom.color}`);
        });
    },

    _togglePhysics() {
        if (!window._particlePhysics) {
            window._particlePhysics = new ParticlePhysics();
        }

        const scenes = ['normal', 'gravity', 'space', 'vortex', 'magnetic', 'turbulence'];
        const state = StateManager.state;
        const currentIndex = (window._physicsIndex || 0);
        const nextIndex = (currentIndex + 1) % scenes.length;
        window._physicsIndex = nextIndex;

        const bounds = { width: state.canvasWidth, height: state.canvasHeight };
        window._particlePhysics.createScene(scenes[nextIndex], bounds);

        const names = {
            normal: '普通',
            gravity: '重力',
            space: '太空',
            vortex: '漩涡',
            magnetic: '磁力',
            turbulence: '湍流'
        };
        this._showToast(`🔬 物理: ${names[scenes[nextIndex]]}`);
    },

    _showFractalPanel() {
        if (!window._fractalGenerator) {
            window._fractalGenerator = new FractalGenerator();
        }

        const state = StateManager.state;
        const previews = [];

        for (const [type, name] of Object.entries(window._fractalGenerator.types)) {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            const params = window._fractalGenerator.generateRandomParams(type);
            window._fractalGenerator.generate(type, ctx, 100, 100, params);

            previews.push({
                id: type,
                name,
                dataUrl: canvas.toDataURL()
            });
        }

        this._showPreviewModal('🔮 分形生成器', previews, (index) => {
            const type = previews[index].id;
            const params = window._fractalGenerator.generateRandomParams(type);

            // 应用到当前状态
            if (window.RandomGenerator) {
                window.RandomGenerator.setPatternGenerator('fractal');
            }

            this._showToast(`🔮 分形: ${previews[index].name}`);
        });
    },

    _showImageImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this._showToast('🖼️ 处理中...');

            try {
                const transfer = new ImageStyleTransfer();
                const result = await transfer.processFromFile(file, {
                    symmetryCount: StateManager.state.symmetryCount,
                    style: 'kaleidoscope'
                });

                // 创建图片并添加到画布
                const img = new Image();
                img.onload = () => {
                    CanvasRenderer.offscreenCtx.drawImage(img, 0, 0);
                    this._showToast('🖼️ 图片已转换为万花筒！');
                };
                img.src = result;
            } catch (err) {
                this._showToast('❌ 图片处理失败');
            }
        };
        input.click();
    },

    _showAITemplate() {
        if (!window._aiGenerator) {
            window._aiGenerator = new AITemplateGenerator();
        }

        const tags = window._aiGenerator.allTags.slice(0, 20);
        const html = tags.map(tag => {
            const template = window._aiGenerator.templates[tag];
            return `<button class="ai-tag-btn" data-tag="${tag}">${tag}<span class="desc">${template.description}</span></button>`;
        }).join('');

        const modal = this._createModal('🤖 AI 智能生成', `
            <div class="ai-template-content">
                <p>选择或输入关键词来智能生成配置：</p>
                <input type="text" id="ai-keyword" placeholder="输入关键词，如：星空、赛博、梦幻..." class="ai-input">
                <div class="ai-tags">${html}</div>
            </div>
        `);

        // 绑定事件
        modal.querySelectorAll('.ai-tag-btn').forEach(btn => {
            btn.onclick = () => {
                const tag = btn.dataset.tag;
                const config = window._aiGenerator.generateFromText(tag);
                window._aiGenerator.applyConfig(config);
                this._showToast(`🤖 ${config.description || tag}`);
                modal.close();
            };
        });

        const input = modal.querySelector('#ai-keyword');
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                const config = window._aiGenerator.generateFromText(input.value.trim());
                window._aiGenerator.applyConfig(config);
                this._showToast(`🤖 ${config.description || input.value}`);
                modal.close();
            }
        };
    },

    _showPreviewModal(title, previews, onSelect) {
        const grid = previews.map((p, i) => `
            <div class="preview-item" data-index="${i}">
                <img src="${p.dataUrl}" alt="${p.name}">
                <span>${p.name}</span>
            </div>
        `).join('');

        const modal = this._createModal(title, `<div class="preview-grid">${grid}</div>`);

        modal.querySelectorAll('.preview-item').forEach((item, i) => {
            item.onclick = () => {
                onSelect(i);
                modal.close();
            };
        });
    },

    _createModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <div class="modal-body">${content}</div>
                <button class="modal-close">关闭</button>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('.modal-close').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const close = () => overlay.remove();
        overlay.close = close;

        return overlay;
    }
};