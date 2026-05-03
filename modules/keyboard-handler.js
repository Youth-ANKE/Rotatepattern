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
        this.initShortcuts();
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

            // === Ctrl+S 保存 ===
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this._saveImage();
                } else if (typeof FractalGenerator !== 'undefined') {
                    e.preventDefault();
                    this._showFractalPanel();
                }
                break;

            // === 功能快捷键（无Ctrl组合） ===
            case 'c':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._clearCanvas();
                    this._showToast('🗑 画布已清空');
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
            case 'r':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._randomConfigAI();
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
                    CreativeExtensions.evolve();
                    this._showToast('🧬 图案进化中...');
                }
                break;

            // === H 图案杂交 ===
            case 'h':
                if (!e.ctrlKey && typeof CreativeExtensions !== 'undefined') {
                    e.preventDefault();
                    CreativeExtensions.hybridize();
                    this._showToast('🔀 图案杂交中...');
                }
                break;

            // === V 音频可视化 ===
            case 'v':
                if (!e.ctrlKey && typeof CreativeExtensions !== 'undefined') {
                    e.preventDefault();
                    if (CreativeExtensions._visualizationEnabled) {
                        CreativeExtensions._visualizationEnabled = false;
                        this._showToast('🎵 音频可视化：关');
                    } else {
                        CreativeExtensions._visualizationEnabled = true;
                        CreativeExtensions.updateAudioVisualization();
                        this._showToast('🎵 音频可视化：开');
                    }
                }
                break;

            // === B 主题故事 ===
            case 'b':
                if (!e.ctrlKey && typeof CreativeExtensions !== 'undefined') {
                    e.preventDefault();
                    CreativeExtensions.startRandomStory();
                    this._showToast('📖 主题故事生成中...');
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

            // === D 隐藏/显示侧边栏 ===
            case 'd':
                if (!e.ctrlKey) {
                    e.preventDefault();
                    this._toggleSidebar();
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
        if (typeof StateManager?.undo === 'function' && StateManager.undo()) {
            this._showToast('↩ 撤销');
        }
    },

    _redo() {
        if (typeof StateManager?.redo === 'function' && StateManager.redo()) {
            this._showToast('↪ 重做');
        }
    },

    _clearCanvas() {
        const btn = document.getElementById('clear-canvas');
        if (btn) btn.click();
    },

    _toggleTrail() {
        if (typeof StateManager?.setState === 'function') {
            StateManager.setState({ trailMode: !StateManager.state.trailMode });
        }
        const btn = document.getElementById('trail-toggle');
        if (btn) btn.classList.toggle('active');
        this._showToast(StateManager?.state?.trailMode ? '🌊 拖尾：开' : '🌊 拖尾：关');
    },

    _toggleMusic() {
        const btn = document.getElementById('music-toggle');
        if (btn) {
            btn.click();
            // 点击后按钮文字变为 '⏹ 停止音乐' 表示开启，'🎵 背景音乐' 表示关闭
            setTimeout(() => {
                const isPlaying = btn.classList.contains('active');
                this._showToast(isPlaying ? '🎵 音乐开' : '🎵 音乐关');
            }, 10);
        }
    },

    _toggleSidebar() {
        const sidebar = document.getElementById('settings-panel');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            this._showToast(isCollapsed ? '📋 侧边栏已隐藏' : '📋 侧边栏已显示');
        }
    },

    _saveImage() {
        const btn = document.getElementById('save-png');
        if (btn) btn.click();
    },

    _randomConfig() {
        if (typeof RandomGenerator?.applyRandom === 'function') {
            RandomGenerator.applyRandom();
        }
        this._showToast('🎲 随机生成配置！');
    },

    /**
     * AI 智能随机生成
     */
    async _randomConfigAI() {
        const config = await AISmartGenerator.generate();
        if (config && typeof RandomGenerator?.applyRandom === 'function') {
            RandomGenerator.applyRandom(config);
        } else {
            // 降级到传统随机
            this._randomConfig();
        }
    },

    _adjustSymmetry(delta) {
        if (!StateManager?.state) return;
        let count = StateManager.state.symmetryCount + delta;
        count = Math.max(2, Math.min(24, count));
        if (typeof StateManager?.setState === 'function') {
            StateManager.setState({ symmetryCount: count });
        }
        const label = document.getElementById('symmetry-count-label');
        if (label) label.textContent = count;
        const slider = document.getElementById('symmetry-count');
        if (slider) slider.value = count;
    },

    _adjustSpeed(delta) {
        if (!StateManager?.state) return;
        let speed = StateManager.state.rotationSpeed + delta;
        speed = Math.max(0, Math.min(100, speed));
        if (typeof StateManager?.setState === 'function') {
            StateManager.setState({ rotationSpeed: speed });
        }
        const slider = document.getElementById('rotation-speed');
        if (slider) slider.value = speed;
        const label = document.getElementById('rotation-speed-label');
        if (label) label.textContent = speed;
    },

    _toggleAutoRotate() {
        const btn = document.getElementById('auto-rotate-toggle');
        if (btn) {
            btn.click();
            const isActive = btn.classList.contains('active');
            this._showToast(isActive ? '▶ 旋转：开' : '⏸ 旋转：暂停');
        }
    },

    _setBrush(type) {
        if (typeof StateManager?.setState === 'function') {
            StateManager.setState({ brushType: type });
        }
        const select = document.getElementById('brush-type');
        if (select) select.value = type;
        this._showToast(`✏️ 画笔：${this._brushName(type)}`);
    },

    _toggleGlow() {
        if (typeof StateManager?.setState === 'function') {
            StateManager.setState({ glowEnabled: !StateManager.state.glowEnabled });
        }
        const btn = document.getElementById('glow-toggle');
        if (btn) btn.classList.toggle('active');
        this._showToast(StateManager?.state?.glowEnabled ? '✨ 发光：开' : '✨ 发光：关');
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
    },

    // === 快捷键提示功能 ===

    /**
     * 默认快捷键配置
     */
    defaultShortcuts: {
        // 绘图控制
        symmetryUp: 'ArrowUp',
        symmetryDown: 'ArrowDown',
        speedLeft: 'ArrowLeft',
        speedRight: 'ArrowRight',
        pause: ' ',
        clear: 'c',
        brush1: '1',
        brush2: '2',
        brush3: '3',
        brush4: '4',
        // 效果切换
        trail: 't',
        glow: 'g',
        music: 'm',
        animation: 'a',
        random: 'r',
        // 功能面板
        evolve: 'e',
        hybridize: 'h',
        genetic: 'l',
        physics: 'p',
        fractal: 's',
        // 其他功能
        fullscreen: 'f',
        visualization: 'v',
        story: 'b',
        export: 'x',
        image: 'i',
        ai: 'k',
        sidebar: 'd',
        // 系统操作
        undo: { key: 'z', ctrl: true },
        redo: { key: 'y', ctrl: true },
        save: { key: 's', ctrl: true }
    },

    /**
     * 用户自定义快捷键
     */
    customShortcuts: {},

    /**
     * 初始化快捷键功能
     */
    initShortcuts() {
        // 加载自定义快捷键
        const saved = localStorage.getItem('kaleidoscope_shortcuts');
        if (saved) {
            try {
                this.customShortcuts = JSON.parse(saved);
            } catch (e) {
                this.customShortcuts = {};
            }
        }

        // 绑定快捷键查看按钮
        const shortcutsBtn = document.getElementById('shortcuts-toggle');
        if (shortcutsBtn) {
            shortcutsBtn.addEventListener('click', () => this.showShortcutsPanel());
        }

        // 绑定自定义快捷键按钮
        const customBtn = document.getElementById('custom-shortcuts-btn');
        if (customBtn) {
            customBtn.addEventListener('click', () => this.showCustomShortcutsModal());
        }

        // 绑定 ? 键打开快捷键面板
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.showShortcutsPanel();
                }
            }
        });
    },

    /**
     * 获取实际快捷键（优先使用自定义）
     */
    getShortcut(key) {
        return this.customShortcuts[key] || this.defaultShortcuts[key];
    },

    /**
     * 显示快捷键面板
     */
    showShortcutsPanel() {
        const settingsPanel = document.getElementById('advanced-settings');
        const settingsOverlay = document.getElementById('settings-overlay');
        if (settingsPanel) {
            settingsPanel.classList.add('show');
            settingsOverlay.style.display = 'block';
        }
        // 展开快捷键区域
        setTimeout(() => {
            const shortcutsSection = document.getElementById('sec-shortcuts');
            if (shortcutsSection) {
                shortcutsSection.classList.remove('collapsed');
                shortcutsSection.style.maxHeight = '';
            }
        }, 100);
        this._showToast('⌨️ 快捷键提示');
    },

    /**
     * 显示自定义快捷键弹窗
     */
    showCustomShortcutsModal() {
        // 移除已存在的弹窗
        const existing = document.querySelector('.shortcut-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'shortcut-modal';
        modal.innerHTML = `
            <div class="shortcut-modal-content">
                <div class="shortcut-modal-header">
                    <h3>⚙️ 自定义快捷键</h3>
                    <button class="shortcut-modal-close">✕</button>
                </div>
                <div class="shortcut-modal-body">
                    <div class="cs-group">
                        <div class="cs-group-title">绘图控制</div>
                        ${this._createShortcutItem('symmetryUp', '↑ 对称增加')}
                        ${this._createShortcutItem('symmetryDown', '↓ 对称减少')}
                        ${this._createShortcutItem('speedLeft', '← 速度减少')}
                        ${this._createShortcutItem('speedRight', '→ 速度增加')}
                        ${this._createShortcutItem('pause', 'Space 暂停')}
                        ${this._createShortcutItem('clear', 'C 清空')}
                        ${this._createShortcutItem('brush1', '1 实线画笔')}
                        ${this._createShortcutItem('brush2', '2 虚线画笔')}
                        ${this._createShortcutItem('brush3', '3 点线画笔')}
                        ${this._createShortcutItem('brush4', '4 喷枪画笔')}
                    </div>
                    <div class="cs-group">
                        <div class="cs-group-title">效果切换</div>
                        ${this._createShortcutItem('trail', 'T 拖尾')}
                        ${this._createShortcutItem('glow', 'G 发光')}
                        ${this._createShortcutItem('music', 'M 音乐')}
                        ${this._createShortcutItem('animation', 'A 动画')}
                        ${this._createShortcutItem('random', 'R 随机')}
                    </div>
                    <div class="cs-group">
                        <div class="cs-group-title">功能面板</div>
                        ${this._createShortcutItem('evolve', 'E 进化')}
                        ${this._createShortcutItem('hybridize', 'H 杂交')}
                        ${this._createShortcutItem('genetic', 'L 遗传')}
                        ${this._createShortcutItem('physics', 'P 物理')}
                        ${this._createShortcutItem('fractal', 'S 分形')}
                    </div>
                    <div class="cs-group">
                        <div class="cs-group-title">其他功能</div>
                        ${this._createShortcutItem('fullscreen', 'F 全屏')}
                        ${this._createShortcutItem('visualization', 'V 可视化')}
                        ${this._createShortcutItem('story', 'B 故事')}
                        ${this._createShortcutItem('export', 'X 导出')}
                        ${this._createShortcutItem('image', 'I 图片')}
                        ${this._createShortcutItem('ai', 'K AI')}
                        ${this._createShortcutItem('sidebar', 'D 侧边栏')}
                    </div>
                    <div style="text-align:center;margin-top:16px;">
                        <button class="preset-btn cs-reset-all" style="background:rgba(255,69,69,0.1);border-color:rgba(255,69,69,0.3);color:#ff6b6b;">🔄 恢复默认</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        // 绑定关闭事件
        modal.querySelector('.shortcut-modal-close').onclick = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 250);
        };
        modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };

        // 绑定快捷键输入
        modal.querySelectorAll('.cs-item-key input').forEach(input => {
            const key = input.dataset.key;
            input.value = this._formatShortcutKey(this.getShortcut(key));

            input.addEventListener('focus', () => {
                input.classList.add('recording');
                input.value = '按下快捷键...';
            });

            input.addEventListener('blur', () => {
                input.classList.remove('recording');
                input.value = this._formatShortcutKey(this.getShortcut(key));
            });

            input.addEventListener('keydown', (e) => {
                e.preventDefault();
                e.stopPropagation();

                let shortcut = null;
                if (e.key === 'Escape') {
                    input.blur();
                    return;
                }

                if (e.key === 'Backspace' || e.key === 'Delete') {
                    shortcut = null;
                } else if (e.ctrlKey || e.metaKey) {
                    shortcut = { key: e.key.toLowerCase(), ctrl: true };
                } else if (e.key.length === 1 || e.key.startsWith('Arrow')) {
                    shortcut = e.key;
                }

                if (shortcut !== undefined) {
                    this.customShortcuts[key] = shortcut;
                    localStorage.setItem('kaleidoscope_shortcuts', JSON.stringify(this.customShortcuts));
                    input.value = this._formatShortcutKey(shortcut);
                    input.classList.remove('recording');
                    this._showToast(`已设置快捷键: ${this._formatShortcutKey(shortcut)}`);
                }
            });
        });

        // 恢复默认按钮
        modal.querySelector('.cs-reset-all').onclick = () => {
            if (confirm('确定要恢复所有快捷键为默认设置吗？')) {
                this.customShortcuts = {};
                localStorage.removeItem('kaleidoscope_shortcuts');
                modal.querySelectorAll('.cs-item-key input').forEach(input => {
                    input.value = this._formatShortcutKey(this.defaultShortcuts[input.dataset.key]);
                });
                this._showToast('已恢复默认快捷键');
            }
        };
    },

    /**
     * 创建快捷键配置项
     */
    _createShortcutItem(key, label) {
        return `
            <div class="cs-item">
                <span class="cs-item-label">${label}</span>
                <div class="cs-item-key">
                    <input type="text" data-key="${key}" readonly>
                </div>
            </div>
        `;
    },

    /**
     * 格式化快捷键显示
     */
    _formatShortcutKey(shortcut) {
        if (!shortcut) return '未设置';
        if (typeof shortcut === 'object') {
            const ctrl = shortcut.ctrl ? 'Ctrl+' : '';
            return ctrl + shortcut.key.toUpperCase();
        }
        const specialKeys = {
            ' ': 'Space',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→'
        };
        return specialKeys[shortcut] || shortcut.toUpperCase();
    }
};