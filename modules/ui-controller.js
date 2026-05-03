/**
 * UI控制模块
 * 管理所有用户界面交互：工具栏控制、导出功能、画廊等
 */
const UIController = {
    /**
     * 初始化UI控制
     */
    init() {
        this._bindControls();
        this._bindExportButtons();
        this._bindGallery();
        this._bindAISettings();
    },

    /**
     * AI 设置绑定
     */
    _bindAISettings() {
        // 加载保存的设置
        AIConfig.loadSettings();

        // 获取元素
        const apiKeyInput = document.getElementById('ai-api-key');
        const modelSelect = document.getElementById('ai-model-select');
        const toggleBtn = document.getElementById('ai-toggle-btn');
        const statusEl = document.getElementById('ai-status');
        const saveBtn = document.getElementById('ai-save-btn');

        // 更新状态显示
        const updateStatus = () => {
            if (statusEl) {
                statusEl.textContent = AIConfig.getStatusText();
                // 根据状态设置颜色
                if (AIConfig.status === 'ready') {
                    statusEl.style.color = AIConfig.aiEnabled ? '#4ade80' : '#888';
                } else if (AIConfig.status === 'error') {
                    statusEl.style.color = '#f87171';
                } else {
                    statusEl.style.color = '#fbbf24';
                }
            }
            if (toggleBtn) {
                if (AIConfig.isConfigured() && AIConfig.status === 'ready') {
                    toggleBtn.disabled = false;
                    toggleBtn.classList.toggle('active', AIConfig.aiEnabled);
                    toggleBtn.textContent = AIConfig.aiEnabled ? '🤖 AI 随机（开）' : '🤖 AI 随机（关）';
                } else {
                    toggleBtn.disabled = true;
                    toggleBtn.textContent = '🤖 AI 随机（请先配置）';
                }
            }
        };

        // 填充已保存的值
        if (apiKeyInput && AIConfig.apiKey) {
            apiKeyInput.value = AIConfig.apiKey;
        }
        if (modelSelect) {
            modelSelect.value = AIConfig.model;
        }
        updateStatus();

        // 保存并测试按钮
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const key = document.getElementById('ai-api-key').value.trim();
                const model = document.getElementById('ai-model-select').value;

                AIConfig.setApiKey(key);
                AIConfig.setModel(model);

                if (!key) {
                    UIController._showMessage('⚠️ 请输入 API Key');
                    updateStatus();
                    return;
                }

                // 测试连接
                saveBtn.textContent = '🔄 测试中...';
                saveBtn.disabled = true;

                const result = await AIConfig.testConnection();

                if (result.success) {
                    AIConfig.saveSettings();
                    UIController._showMessage('✅ ' + result.message);
                } else {
                    UIController._showMessage('❌ ' + result.message);
                }

                updateStatus();
                saveBtn.textContent = '💾 保存并测试';
                saveBtn.disabled = false;
            });
        }

        // 切换按钮
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                if (!AIConfig.isConfigured()) {
                    UIController._showMessage('⚠️ 请先配置并测试 API Key');
                    return;
                }
                const enabled = AIConfig.toggle();
                updateStatus();
                UIController._showMessage(enabled ? '✨ AI 智能生成已启用' : '🎲 已切换为传统随机');
            });
        }
    },

    _showMessage(msg) {
        if (typeof KeyboardHandler?._showToast === 'function') {
            KeyboardHandler._showToast(msg);
        } else {
            alert(msg);
        }
    },

    /**
     * 绑定所有控件事件
     */
    _bindControls() {
        // === 画笔控制 ===
        const strokeColor = document.getElementById('stroke-color');
        if (strokeColor) {
            strokeColor.addEventListener('input', (e) => {
                StateManager.setState({ strokeColor: e.target.value });
            });
        }

        const strokeWidth = document.getElementById('stroke-width');
        if (strokeWidth) {
            strokeWidth.addEventListener('input', (e) => {
                StateManager.setState({ strokeWidth: parseInt(e.target.value) });
            });
        }

        const glowColor = document.getElementById('glow-color');
        if (glowColor) {
            glowColor.addEventListener('input', (e) => {
                StateManager.setState({ glowColor: e.target.value });
            });
        }

        const glowBlur = document.getElementById('glow-blur');
        if (glowBlur) {
            glowBlur.addEventListener('input', (e) => {
                StateManager.setState({ glowBlur: parseInt(e.target.value) });
            });
        }

        // === 渐变控制 ===
        const gradientFrom = document.getElementById('gradient-from');
        if (gradientFrom) {
            gradientFrom.addEventListener('input', (e) => {
                StateManager.setState({ gradientFrom: e.target.value });
            });
        }

        const gradientTo = document.getElementById('gradient-to');
        if (gradientTo) {
            gradientTo.addEventListener('input', (e) => {
                StateManager.setState({ gradientTo: e.target.value });
            });
        }

        // === 背景色 ===
        const bgColor = document.getElementById('bg-color');
        if (bgColor) {
            bgColor.addEventListener('input', (e) => {
                StateManager.setState({ bgColor: e.target.value });
            });
        }

        // === 对称控制 ===
        const symmetryCount = document.getElementById('symmetry-count');
        if (symmetryCount) {
            symmetryCount.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                StateManager.setState({ symmetryCount: val });
                const label = document.getElementById('symmetry-count-label');
                if (label) label.textContent = val;
            });
        }

        const symmetryMode = document.getElementById('symmetry-mode');
        if (symmetryMode) {
            symmetryMode.addEventListener('change', (e) => {
                StateManager.setState({ symmetryMode: e.target.value });
                // 显示/隐藏螺旋缩放控制
                const spiralGroup = document.getElementById('spiral-scale-group');
                if (spiralGroup) {
                    spiralGroup.style.display = e.target.value === 'spiral' ? 'block' : 'none';
                }
            });
            // 初始隐藏螺旋缩放
            if (symmetryMode.value !== 'spiral') {
                const spiralGroup = document.getElementById('spiral-scale-group');
                if (spiralGroup) spiralGroup.style.display = 'none';
            }
        }

        const spiralScale = document.getElementById('spiral-scale');
        if (spiralScale) {
            spiralScale.addEventListener('input', (e) => {
                StateManager.setState({ spiralScale: parseInt(e.target.value) });
            });
        }

        // === 旋转控制 ===
        const rotationSpeed = document.getElementById('rotation-speed');
        if (rotationSpeed) {
            rotationSpeed.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                StateManager.setState({ rotationSpeed: val });
                const label = document.getElementById('rotation-speed-label');
                if (label) label.textContent = val;
            });
        }

        // === 画笔类型 ===
        const brushType = document.getElementById('brush-type');
        if (brushType) {
            brushType.addEventListener('change', (e) => {
                StateManager.setState({ brushType: e.target.value });
            });
        }

        // === 粒子类型 ===
        const particleType = document.getElementById('particle-type');
        if (particleType) {
            particleType.addEventListener('change', (e) => {
                StateManager.setState({ particleType: e.target.value });
                ParticleSystem.clear();
            });
        }

        // === 音乐主题 ===
        const musicTheme = document.getElementById('music-theme');
        if (musicTheme) {
            musicTheme.addEventListener('change', (e) => {
                AudioEngine.setMusicTheme(e.target.value);
            });
        }

        // === 音乐生成音量 ===
        const musicGenVolume = document.getElementById('music-gen-volume');
        if (musicGenVolume) {
            musicGenVolume.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value) / 100;
                StateManager.setState({ musicGenVolume: vol });
            });
        }

        // === Toggle 按钮 ===
        this._bindToggle('trail-toggle', 'trailMode', 'trail-toggle');
        this._bindToggle('glow-toggle', 'glowEnabled', 'glow-toggle');
        this._bindToggle('rainbow-toggle', 'rainbowMode', 'rainbow-toggle');
        this._bindToggle('gradient-toggle', 'gradientEnabled', 'gradient-toggle');
        this._bindToggle('particle-toggle', 'particleEnabled', 'particle-toggle');
        this._bindToggle('tick-toggle', 'tickEnabled', 'tick-toggle');
        this._bindToggle('music-gen-toggle', 'musicGenEnabled', 'music-gen-toggle');

        // === 音乐播放按钮 ===
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                AudioEngine.init();
                const newState = !StateManager.state.musicEnabled;
                AudioEngine.toggleMusic(newState);
                musicToggle.classList.toggle('active', newState);
                musicToggle.textContent = newState ? '⏹ 停止音乐' : '🎵 背景音乐';
            });
        }

        // === 音乐音量 ===
        const musicVolume = document.getElementById('music-volume');
        if (musicVolume) {
            musicVolume.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value) / 100;
                AudioEngine.setMusicVolume(vol);
            });
        }

        const tickVolume = document.getElementById('tick-volume');
        if (tickVolume) {
            tickVolume.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value) / 100;
                AudioEngine.setTickVolume(vol);
            });
        }

        // === 在线音乐控制 ===
        const onlineMusicToggle = document.getElementById('online-music-toggle');
        if (onlineMusicToggle) {
            onlineMusicToggle.addEventListener('click', async () => {
                const enabled = !StateManager.state.onlineMusicEnabled;
                StateManager.setState({ onlineMusicEnabled: enabled });
                onlineMusicToggle.classList.toggle('active', enabled);
                onlineMusicToggle.textContent = enabled ? '⏹ 停止在线' : '🌐 在线音乐';

                if (enabled) {
                    if (StateManager.state.musicEnabled) {
                        AudioEngine.toggleMusic(false);
                        const musicBtn = document.getElementById('music-toggle');
                        if (musicBtn) {
                            musicBtn.classList.remove('active');
                            musicBtn.textContent = '🎵 背景音乐';
                        }
                    }
                    const success = await AudioEngine.toggleOnlineMusic(true);
                    if (success && AudioEngine.onlineMusicData) {
                        const infoDiv = document.getElementById('online-music-info');
                        const titleSpan = document.getElementById('online-music-title');
                        const statusSpan = document.getElementById('online-music-status');
                        if (infoDiv && titleSpan) {
                            infoDiv.style.display = 'block';
                            titleSpan.textContent = `🎵 ${AudioEngine.onlineMusicData.title || '脑波音乐'}`;
                        }
                        if (statusSpan) {
                            statusSpan.textContent = '▶ 播放中';
                        }
                        StateManager.setState({ 
                            onlineMusicTitle: AudioEngine.onlineMusicData.title || '',
                            onlineMusicCover: AudioEngine.onlineMusicData.cover || ''
                        });
                    } else {
                        const statusSpan = document.getElementById('online-music-status');
                        if (statusSpan) {
                            statusSpan.textContent = '❌ 加载失败';
                        }
                        setTimeout(() => {
                            StateManager.setState({ onlineMusicEnabled: false });
                            onlineMusicToggle.classList.remove('active');
                            onlineMusicToggle.textContent = '🌐 在线音乐';
                            const infoDiv = document.getElementById('online-music-info');
                            if (infoDiv) infoDiv.style.display = 'none';
                        }, 2000);
                    }
                } else {
                    AudioEngine.toggleOnlineMusic(false);
                    const infoDiv = document.getElementById('online-music-info');
                    if (infoDiv) infoDiv.style.display = 'none';
                }
            });
        }

        // === 在线音乐音量 ===
        const onlineMusicVolume = document.getElementById('online-music-volume');
        if (onlineMusicVolume) {
            onlineMusicVolume.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value) / 100;
                AudioEngine.setOnlineMusicVolume(vol);
            });
        }

        // === 播放列表控制 ===
        const prevTrackBtn = document.getElementById('prev-track-btn');
        if (prevTrackBtn) {
            prevTrackBtn.addEventListener('click', async () => {
                await AudioEngine.prevTrack();
                this._updateOnlineMusicInfo();
            });
        }

        const nextTrackBtn = document.getElementById('next-track-btn');
        if (nextTrackBtn) {
            nextTrackBtn.addEventListener('click', async () => {
                await AudioEngine.nextTrack();
                this._updateOnlineMusicInfo();
            });
        }

        // === 播放模式切换 ===
        const playModeSelect = document.getElementById('play-mode-select');
        if (playModeSelect) {
            playModeSelect.addEventListener('change', async (e) => {
                const mode = e.target.value;
                StateManager.setState({ playlistMode: mode });
                await AudioEngine.setPlayMode(mode);
            });
        }

        // === 音效试听面板 ===
        this._loadSoundEffects();

        // === 定期更新在线音乐状态 ===
        setInterval(() => {
            const statusSpan = document.getElementById('online-music-status');
            if (!statusSpan) return;
            if (StateManager.state.onlineMusicEnabled) {
                if (AudioEngine.onlineMusicLoading) {
                    statusSpan.textContent = '⏳ 加载中...';
                } else if (AudioEngine.onlineMusicPlaying) {
                    statusSpan.textContent = '▶ 播放中';
                } else if (AudioEngine.onlineMusicError) {
                    statusSpan.textContent = '❌ ' + AudioEngine.onlineMusicError;
                }
            }
        }, 1000);

        // === 高级设置面板切换（侧边抽屉） ===
        const settingsToggle = document.getElementById('settings-toggle');
        const advancedSettings = document.getElementById('advanced-settings');
        const settingsOverlay = document.getElementById('settings-overlay');
        const spClose = document.getElementById('sp-close');

        function openSettings() {
            if (advancedSettings) advancedSettings.classList.add('show');
            if (settingsOverlay) settingsOverlay.classList.add('show');
            if (settingsToggle) settingsToggle.classList.add('active');
        }
        function closeSettings() {
            if (advancedSettings) advancedSettings.classList.remove('show');
            if (settingsOverlay) settingsOverlay.classList.remove('show');
            if (settingsToggle) settingsToggle.classList.remove('active');
        }

        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => {
                if (advancedSettings && advancedSettings.classList.contains('show')) {
                    closeSettings();
                } else {
                    openSettings();
                }
            });
        }
        if (spClose) spClose.addEventListener('click', closeSettings);
        if (settingsOverlay) settingsOverlay.addEventListener('click', closeSettings);

        // === 分区折叠 ===
        document.querySelectorAll('.sp-section-head[data-toggle]').forEach(head => {
            head.addEventListener('click', () => {
                const targetId = head.getAttribute('data-toggle');
                const body = document.getElementById(targetId);
                if (body) {
                    head.classList.toggle('collapsed');
                    body.classList.toggle('collapsed');
                }
            });
        });

        // === 混合模式 ===
        const blendMode = document.getElementById('blend-mode');
        if (blendMode) {
            blendMode.addEventListener('change', (e) => {
                StateManager.setState({ blendMode: e.target.value });
            });
        }

        // === 材质色板 ===
        const materialPalette = document.getElementById('material-palette');
        if (materialPalette) {
            materialPalette.addEventListener('change', (e) => {
                StateManager.setState({ materialPalette: e.target.value });
            });
        }

        // === 颜色抖动 ===
        const colorDither = document.getElementById('color-dither');
        if (colorDither) {
            colorDither.addEventListener('input', (e) => {
                StateManager.setState({ colorDither: parseInt(e.target.value) });
            });
        }

        // === 动画模式 ===
        const animationMode = document.getElementById('animation-mode');
        if (animationMode) {
            animationMode.addEventListener('change', (e) => {
                StateManager.setState({ animationMode: e.target.value });
            });
        }

        // === 动画速度 ===
        const animationSpeed = document.getElementById('animation-speed');
        if (animationSpeed) {
            animationSpeed.addEventListener('input', (e) => {
                StateManager.setState({ animationSpeed: parseFloat(e.target.value) });
            });
        }

        // === 密度滑块 ===
        const densitySlider = document.getElementById('density-slider');
        if (densitySlider) {
            densitySlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                StateManager.setState({ density: val });
                const label = document.getElementById('density-value');
                if (label) label.textContent = val.toFixed(1);
            });
        }

        // === 重置噪声种子 ===
        const resetNoiseSeed = document.getElementById('reset-noise-seed');
        if (resetNoiseSeed) {
            resetNoiseSeed.addEventListener('click', () => {
                StateManager.setState({ noiseSeed: Math.floor(Math.random() * 100000) });
            });
        }

        // === 随机生成 ===
        const randomBtn = document.getElementById('random-generate');
        if (randomBtn) {
            randomBtn.addEventListener('click', () => {
                RandomGenerator.applyRandom();
            });
        }

        // === 清空画布 ===
        const clearBtn = document.getElementById('clear-canvas');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (StateManager.state.strokes.length === 0) return;
                StateManager.clearStrokes();
                ParticleSystem.clear();
            });
        }

        // === 撤销/重做 ===
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => StateManager.undo());
        }
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => StateManager.redo());
        }

        // === 自动旋转 ===
        const autoRotateToggle = document.getElementById('auto-rotate-toggle');
        if (autoRotateToggle) {
            autoRotateToggle.addEventListener('click', () => {
                autoRotateToggle.classList.toggle('active');
            });
        }

        // === 动画控制 ===
        const animationToggle = document.getElementById('animation-toggle');
        if (animationToggle) {
            animationToggle.addEventListener('click', () => {
                const isActive = !animationToggle.classList.contains('active');
                animationToggle.classList.toggle('active', isActive);
                animationToggle.textContent = isActive ? '⏸ 动画' : '▶ 动画';
                AnimationController.setEnabled(isActive);
            });
        }

        // === 动画预设 ===
        const presetBreathing = document.getElementById('preset-breathing');
        if (presetBreathing) {
            presetBreathing.addEventListener('click', () => {
                AnimationController.presetBreathing();
                this._syncAnimationSliders();
            });
        }
        const presetFloating = document.getElementById('preset-floating');
        if (presetFloating) {
            presetFloating.addEventListener('click', () => {
                AnimationController.presetFloating();
                this._syncAnimationSliders();
            });
        }
        const presetSwirl = document.getElementById('preset-swirl');
        if (presetSwirl) {
            presetSwirl.addEventListener('click', () => {
                AnimationController.presetSwirl();
                this._syncAnimationSliders();
            });
        }
        const presetPsychedelic = document.getElementById('preset-psychedelic');
        if (presetPsychedelic) {
            presetPsychedelic.addEventListener('click', () => {
                AnimationController.presetPsychedelic();
                this._syncAnimationSliders();
            });
        }
        const randomAnimation = document.getElementById('random-animation');
        if (randomAnimation) {
            randomAnimation.addEventListener('click', () => {
                AnimationController.randomize();
                this._syncAnimationSliders();
            });
        }

        // === 动画滑块 ===
        this._bindAnimationSliders();
    },

    /**
     * 绑定动画滑块
     */
    _bindAnimationSliders() {
        const animScaleSpeed = document.getElementById('anim-scale-speed');
        const animScaleAmp = document.getElementById('anim-scale-amp');
        const animColorSpeed = document.getElementById('anim-color-speed');
        const animColorAmp = document.getElementById('anim-color-amp');
        const animDriftSpeed = document.getElementById('anim-drift-speed');
        const animDriftAmp = document.getElementById('anim-drift-amp');
        const animRotSpeed = document.getElementById('anim-rot-speed');

        const updateFromSliders = () => {
            AnimationController.breathingScale.speed = parseFloat(animScaleSpeed.value);
            AnimationController.breathingScale.amplitude = parseFloat(animScaleAmp.value);
            AnimationController.colorFlow.speed = parseFloat(animColorSpeed.value);
            AnimationController.colorFlow.hueRange = parseFloat(animColorAmp.value);
            AnimationController.centerDrift.speed = parseFloat(animDriftSpeed.value);
            AnimationController.centerDrift.amplitude = parseFloat(animDriftAmp.value);
            AnimationController.rotationDrift.speed = parseFloat(animRotSpeed.value);
        };

        if (animScaleSpeed) animScaleSpeed.addEventListener('input', updateFromSliders);
        if (animScaleAmp) animScaleAmp.addEventListener('input', updateFromSliders);
        if (animColorSpeed) animColorSpeed.addEventListener('input', updateFromSliders);
        if (animColorAmp) animColorAmp.addEventListener('input', updateFromSliders);
        if (animDriftSpeed) animDriftSpeed.addEventListener('input', updateFromSliders);
        if (animDriftAmp) animDriftAmp.addEventListener('input', updateFromSliders);
        if (animRotSpeed) animRotSpeed.addEventListener('input', updateFromSliders);
    },

    /**
     * 同步动画滑块到当前参数
     */
    _syncAnimationSliders() {
        const animScaleSpeed = document.getElementById('anim-scale-speed');
        const animScaleAmp = document.getElementById('anim-scale-amp');
        const animColorSpeed = document.getElementById('anim-color-speed');
        const animColorAmp = document.getElementById('anim-color-amp');
        const animDriftSpeed = document.getElementById('anim-drift-speed');
        const animDriftAmp = document.getElementById('anim-drift-amp');
        const animRotSpeed = document.getElementById('anim-rot-speed');

        if (animScaleSpeed) animScaleSpeed.value = AnimationController.breathingScale.speed;
        if (animScaleAmp) animScaleAmp.value = AnimationController.breathingScale.amplitude;
        if (animColorSpeed) animColorSpeed.value = AnimationController.colorFlow.speed;
        if (animColorAmp) animColorAmp.value = AnimationController.colorFlow.hueRange;
        if (animDriftSpeed) animDriftSpeed.value = AnimationController.centerDrift.speed;
        if (animDriftAmp) animDriftAmp.value = AnimationController.centerDrift.amplitude;
        if (animRotSpeed) animRotSpeed.value = AnimationController.rotationDrift.speed;
    },

    /**
     * 绑定切换按钮
     */
    _bindToggle(elementId, stateKey, toggleClass) {
        const btn = document.getElementById(elementId);
        if (!btn) return;
        btn.addEventListener('click', () => {
            const newVal = !StateManager.state[stateKey];
            StateManager.setState({ [stateKey]: newVal });
            btn.classList.toggle('active', newVal);
        });
    },

    /**
     * 绑定导出功能
     */
    _bindExportButtons() {
        const savePng = document.getElementById('save-png');
        if (savePng) {
            savePng.addEventListener('click', () => {
                this._exportImage('png');
            });
        }

        const saveJpg = document.getElementById('save-jpg');
        if (saveJpg) {
            saveJpg.addEventListener('click', () => {
                this._exportImage('jpeg');
            });
        }

        const saveSvg = document.getElementById('save-svg');
        if (saveSvg) {
            saveSvg.addEventListener('click', () => {
                this._exportSVG();
            });
        }

        const saveProject = document.getElementById('save-project');
        if (saveProject) {
            saveProject.addEventListener('click', () => {
                this._saveProject();
            });
        }

        const loadProject = document.getElementById('load-project');
        if (loadProject) {
            loadProject.addEventListener('change', (e) => {
                this._loadProject(e.target.files[0]);
                e.target.value = '';
            });
        }

        const screenshotBtn = document.getElementById('screenshot-btn');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => {
                this._takeScreenshot();
            });
        }
    },

    /**
     * 导出为图片
     */
    _exportImage(format) {
        const canvas = CanvasRenderer.canvas;
        if (!canvas) return;
        
        const ctx = CanvasRenderer.ctx;
        const { canvasWidth, canvasHeight, bgColor } = StateManager.state;
        
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvasWidth;
        exportCanvas.height = canvasHeight;
        const ectx = exportCanvas.getContext('2d');
        
        ectx.fillStyle = bgColor;
        ectx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        const { symmetryMode, symmetryCount, currentRotation } = StateManager.state;
        const tempOffscreen = CanvasRenderer.offscreenCanvas;
        
        if (symmetryMode === 'rotational') {
            const angleStep = (2 * Math.PI) / symmetryCount;
            for (let i = 0; i < symmetryCount; i++) {
                const totalAngle = currentRotation + i * angleStep;
                ectx.save();
                ectx.translate(cx, cy);
                ectx.rotate(totalAngle);
                ectx.translate(-cx, -cy);
                ectx.drawImage(tempOffscreen, 0, 0);
                ectx.restore();
            }
        } else if (symmetryMode === 'spiral') {
            const scaleFactor = 1 + (StateManager.state.spiralScale / 100) * 0.5;
            const angleStep = (2 * Math.PI) / symmetryCount;
            for (let i = 0; i < symmetryCount; i++) {
                const totalAngle = currentRotation + i * angleStep;
                const s = Math.pow(scaleFactor, i);
                ectx.save();
                ectx.translate(cx, cy);
                ectx.rotate(totalAngle);
                ectx.translate(-cx, -cy);
                ectx.translate(cx, cy);
                ectx.scale(s, s);
                ectx.translate(-cx, -cy);
                ectx.drawImage(tempOffscreen, 0, 0);
                ectx.restore();
            }
        } else {
            CanvasRenderer._drawMirrorOffscreen(ectx, cx, cy, symmetryCount, currentRotation);
        }

        const link = document.createElement('a');
        link.download = `kaleidoscope-${Date.now()}.${format}`;
        link.href = exportCanvas.toDataURL(`image/${format}`);
        link.click();
    },

    /**
     * HTML 转义，防止 SVG/HTML 注入
     * 使用 DOM API 避免依赖源码中的实体字符
     */
    _escapeHtml(str) {
        const el = document.createElement('textarea');
        el.textContent = str;
        return el.innerHTML;
    },

    /**
     * 导出SVG（已修复 XSS 漏洞）
     */
    _exportSVG() {
        const { canvasWidth, canvasHeight, bgColor, strokes } = StateManager.state;
        
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <rect width="${canvasWidth}" height="${canvasHeight}" fill="${this._escapeHtml(bgColor)}"/>
`;
        strokes.forEach(stroke => {
            if (stroke.length < 2) return;
            const color = this._escapeHtml(stroke._color || StateManager.state.strokeColor);
            svgContent += `  <path d="M`;
            stroke.forEach((p, i) => {
                if (i === 0) {
                    svgContent += `${p.x},${p.y}`;
                } else {
                    svgContent += ` L${p.x},${p.y}`;
                }
            });
            svgContent += `" fill="none" stroke="${color}" stroke-width="${StateManager.state.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
        });

        svgContent += '</svg>';

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.download = `kaleidoscope-${Date.now()}.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    },

    /**
     * 保存项目文件（JSON格式）
     */
    _saveProject() {
        const project = {
            version: 2,
            timestamp: Date.now(),
            strokes: StateManager.state.strokes,
            settings: {
                strokeColor: StateManager.state.strokeColor,
                bgColor: StateManager.state.bgColor,
                strokeWidth: StateManager.state.strokeWidth,
                symmetryCount: StateManager.state.symmetryCount,
                symmetryMode: StateManager.state.symmetryMode,
                rotationSpeed: StateManager.state.rotationSpeed,
                brushType: StateManager.state.brushType,
                glowEnabled: StateManager.state.glowEnabled,
                glowColor: StateManager.state.glowColor,
                glowBlur: StateManager.state.glowBlur,
                gradientEnabled: StateManager.state.gradientEnabled,
                gradientFrom: StateManager.state.gradientFrom,
                gradientTo: StateManager.state.gradientTo,
                rainbowMode: StateManager.state.rainbowMode,
                trailMode: StateManager.state.trailMode,
                spiralScale: StateManager.state.spiralScale
            }
        };

        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `kaleidoscope-project-${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    },

    /**
     * 导入项目文件（已加固：schema 校验 + 类型检查 + 文件大小限制）
     */
    _loadProject(file) {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            alert('项目文件过大（>10MB）');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target.result);
                
                if (!project || typeof project !== 'object' ||
                    !Array.isArray(project.strokes) ||
                    !project.settings || typeof project.settings !== 'object') {
                    alert('无效的项目文件：缺少 strokes 或 settings');
                    return;
                }

                const validStrokes = project.strokes.filter(stroke => {
                    if (!Array.isArray(stroke)) return false;
                    if (stroke.length < 2 && stroke.length > 0) return false;
                    return stroke.every(p =>
                        p && typeof p === 'object' &&
                        typeof p.x === 'number' && Number.isFinite(p.x) &&
                        typeof p.y === 'number' && Number.isFinite(p.y)
                    );
                });
                if (validStrokes.length === 0 && project.strokes.length > 0) {
                    alert('项目文件中没有有效的笔画数据');
                    return;
                }

                StateManager.replaceStrokes(validStrokes);

                const settings = project.settings;
                const updates = {};
                const expectedTypes = {
                    strokeColor: 'string', bgColor: 'string', strokeWidth: 'number',
                    symmetryCount: 'number', symmetryMode: 'string', rotationSpeed: 'number',
                    brushType: 'string', glowEnabled: 'boolean', glowColor: 'string',
                    glowBlur: 'number', gradientEnabled: 'boolean', gradientFrom: 'string',
                    gradientTo: 'string', rainbowMode: 'boolean', trailMode: 'boolean',
                    spiralScale: 'number'
                };
                Object.keys(settings).forEach(key => {
                    if (StateManager.state.hasOwnProperty(key) && expectedTypes.hasOwnProperty(key)) {
                        const val = settings[key];
                        const expectedType = expectedTypes[key];
                        if (typeof val === expectedType || 
                            (expectedType === 'number' && typeof val === 'number' && Number.isFinite(val))) {
                            updates[key] = val;
                        }
                    }
                });
                StateManager.setState(updates);

                for (const [key, value] of Object.entries(updates)) {
                    const id = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                    const el = document.getElementById(id);
                    if (el) {
                        if (typeof value === 'boolean') {
                            el.classList.toggle('active', value);
                        } else {
                            el.value = value;
                        }
                    }
                }

            } catch (err) {
                alert('项目文件解析失败：' + err.message);
            }
        };
        reader.readAsText(file);
    },

    /**
     * 截图并加入画廊
     */
    _takeScreenshot() {
        const exportCanvas = document.createElement('canvas');
        const { canvasWidth, canvasHeight, bgColor } = StateManager.state;
        exportCanvas.width = canvasWidth;
        exportCanvas.height = canvasHeight;
        const ectx = exportCanvas.getContext('2d');
        
        ectx.fillStyle = bgColor;
        ectx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        const { symmetryMode, symmetryCount, currentRotation } = StateManager.state;
        const tempOffscreen = CanvasRenderer.offscreenCanvas;
        
        const angleStep = (2 * Math.PI) / symmetryCount;
        for (let i = 0; i < symmetryCount; i++) {
            const totalAngle = currentRotation + i * angleStep;
            ectx.save();
            ectx.translate(cx, cy);
            ectx.rotate(totalAngle);
            ectx.translate(-cx, -cy);
            ectx.drawImage(tempOffscreen, 0, 0);
            ectx.restore();
        }

        const dataUrl = exportCanvas.toDataURL('image/png');
        StateManager.addGalleryImage(dataUrl);
    },

    /**
     * 绑定画廊相关事件
     */
    _bindGallery() {
        StateManager.subscribe((state) => {
            if (state.galleryImages) {
                this._renderGallery(state.galleryImages);
            }
        });

        const clearGallery = document.getElementById('clear-gallery');
        if (clearGallery) {
            clearGallery.addEventListener('click', () => {
                StateManager.clearGallery();
            });
        }
    },

    /**
     * 加载音效试听面板
     */
    async _loadSoundEffects() {
        try {
            const container = document.getElementById('sound-effects-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            const effects = await AudioEngine.fetchSoundEffects();
            
            effects.forEach(effect => {
                const btn = document.createElement('button');
                btn.className = 'sound-effect-btn small-btn';
                btn.textContent = effect.name;
                btn.title = effect.name;
                btn.addEventListener('click', () => {
                    AudioEngine.playSoundEffect(effect);
                    btn.style.transform = 'scale(0.9)';
                    setTimeout(() => { btn.style.transform = ''; }, 150);
                });
                container.appendChild(btn);
            });
            
            console.log(`[UIController] 加载了 ${effects.length} 个音效按钮`);
        } catch (e) {
            console.warn('[UIController] 加载音效列表失败:', e.message);
        }
    },

    /**
     * 更新在线音乐信息显示
     */
    _updateOnlineMusicInfo() {
        const infoDiv = document.getElementById('online-music-info');
        const titleSpan = document.getElementById('online-music-title');
        const statusSpan = document.getElementById('online-music-status');
        
        if (infoDiv && titleSpan && AudioEngine.onlineMusicData) {
            infoDiv.style.display = 'block';
            titleSpan.textContent = `🎵 ${AudioEngine.onlineMusicData.title || '音乐'}`;
        }
        if (statusSpan) {
            statusSpan.textContent = AudioEngine.onlineMusicPlaying ? '▶ 播放中' : '⏸ 已暂停';
        }
    },

    /**
     * 渲染画廊
     */
    _renderGallery(images) {
        const container = document.getElementById('gallery-container');
        if (!container) return;

        if (images.length === 0) {
            container.innerHTML = '<div class="gallery-empty">暂无截图，按 📷 按钮截图</div>';
            return;
        }

        container.innerHTML = images.map((img, index) => `
            <div class="gallery-item" data-index="${index}">
                <img src="${img.dataUrl}" alt="画廊图片 ${index + 1}" />
                <div class="gallery-item-actions">
                    <button class="gallery-download" data-index="${index}">⬇ 下载</button>
                    <button class="gallery-delete" data-index="${index}">✕ 删除</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.gallery-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const imgData = images[idx];
                if (imgData) {
                    const link = document.createElement('a');
                    link.download = `kaleidoscope-gallery-${idx + 1}.png`;
                    link.href = imgData.dataUrl;
                    link.click();
                }
            });
        });

        container.querySelectorAll('.gallery-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const img = images[idx];
                if (img && img.id) {
                    StateManager.removeGalleryImage(img.id);
                }
            });
        });
    }
};