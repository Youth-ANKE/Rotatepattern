/**
 * AI 智能随机生成器 - 增强版
 * 按 R 键时优先使用 AI 生成配置
 * 
 * 改进：
 * 1. 直接使用 AI 生成的颜色值，不强制依赖预设
 * 2. 保留 AI 生成的创意参数
 * 3. 只在必要时回退到预设
 */
const AISmartGenerator = {
    _isGenerating: false,
    _lastConfig: null,
    _lastAIColors: null, // 保留上次 AI 生成的颜色

    /**
     * 生成 AI 配置（带降级处理）
     */
    async generate() {
        if (this._isGenerating) return null;
        
        this._isGenerating = true;
        KeyboardHandler._showToast('🤖 AI 构思中...');

        try {
            // 如果 AI 未启用或未配置，使用传统随机
            if (!AIConfig.aiEnabled || !AIConfig.isConfigured()) {
                return this._generateFallback();
            }

            // 调用 AI 生成
            const aiConfig = await AIService.generateSmartConfig();
            
            if (aiConfig) {
                KeyboardHandler._showToast('✨ AI 创作');
                this._lastConfig = aiConfig;
                this._lastAIColors = aiConfig.colors; // 保存 AI 颜色
                return this._applyAIConfig(aiConfig);
            } else {
                // AI 失败，尝试使用上次保存的 AI 颜色
                if (this._lastAIColors) {
                    KeyboardHandler._showToast('🎨 保留上次配色...');
                    return this._applyWithSavedColors();
                }
                return this._generateFallback();
            }
        } catch (error) {
            console.error('AI 生成失败:', error);
            KeyboardHandler._showToast('⚠️ AI 生成失败，使用传统随机');
            return this._generateFallback();
        } finally {
            this._isGenerating = false;
        }
    },

    /**
     * 应用 AI 配置到画布 - 增强版
     * 优先使用 AI 直接生成的值，只在必要时补充
     */
    _applyAIConfig(aiConfig) {
        // 获取预设列表用于参数补充
        const presets = RandomGenerator._MASTERPIECE_PRESETS;
        
        // 如果 AI 提供了完整的 colors（带 hex 值），直接使用
        if (aiConfig.colors && aiConfig.colors.bg) {
            return {
                colors: aiConfig.colors,
                patternType: aiConfig.patterns?.[0] || this._getRandomPattern(),
                secondaryPattern: aiConfig.patterns?.[1] || null,
                symmetry: this._validateSymmetry(aiConfig.symmetry),
                symmetryMode: aiConfig.symmetryMode || this._getRandomMode(),
                particleType: aiConfig.particleType || this._getRandomParticle(),
                animation: aiConfig.animation || this._getRandomAnimation(),
                bgAnimation: aiConfig.bgAnimation || this._getRandomBgAnimation(),
                rotationSpeed: aiConfig.rotationSpeed || this._getRandomSpeed(),
                strokeWidth: aiConfig.strokeWidth || 2,
                source: 'ai-generated' // 标记为 AI 生成
            };
        }

        // 旧格式：AI 只提供 palette 名称，尝试匹配预设
        let preset = presets.find(p => 
            p.palette === aiConfig.palette || 
            p.name === aiConfig.name ||
            (aiConfig.patterns && p.patterns[0] === aiConfig.patterns[0])
        );

        if (!preset) {
            // 找不到完全匹配？随机选一个但保留 AI 的配色偏好
            preset = this._findSimilarPreset(aiConfig);
        }

        if (preset) {
            const palette = RandomGenerator.palettes.find(p => p.name === preset.palette);
            if (palette) {
                return {
                    colors: palette,
                    patternType: preset.patterns[0],
                    secondaryPattern: preset.patterns[1] || null,
                    symmetry: preset.symmetry,
                    symmetryMode: preset.symmetryMode,
                    particleType: preset.particleType,
                    animation: preset.animation,
                    bgAnimation: preset.bgAnimation,
                    source: 'ai-matched-preset'
                };
            }
        }

        // 最后手段：使用传统随机
        return this._generateFallback();
    },

    /**
     * 使用上次保存的 AI 颜色生成新图案
     */
    _applyWithSavedColors() {
        const patternType = this._getRandomPattern();
        const presets = RandomGenerator._MASTERPIECE_PRESETS;
        const preset = presets[Math.floor(Math.random() * presets.length)];

        return {
            colors: this._lastAIColors,
            patternType: patternType,
            secondaryPattern: preset.patterns[1] || null,
            symmetry: this._validateSymmetry(preset.symmetry),
            symmetryMode: preset.symmetryMode,
            particleType: preset.particleType,
            animation: preset.animation,
            bgAnimation: preset.bgAnimation,
            source: 'ai-preserved-colors'
        };
    },

    /**
     * 查找相似的预设（用于参数补充）
     */
    _findSimilarPreset(aiConfig) {
        const presets = RandomGenerator._MASTERPIECE_PRESETS;
        
        // 按图案类型匹配
        if (aiConfig.patterns?.[0]) {
            const match = presets.find(p => p.patterns.includes(aiConfig.patterns[0]));
            if (match) return match;
        }

        // 随机选一个
        return presets[Math.floor(Math.random() * presets.length)];
    },

    /**
     * 验证并修正对称数
     */
    _validateSymmetry(symmetry) {
        const validOptions = [3, 4, 5, 6, 8, 10, 12, 16];
        const num = parseInt(symmetry);
        return validOptions.includes(num) ? num : 6;
    },

    /**
     * 随机获取参数
     */
    _getRandomPattern() {
        const patterns = RandomGenerator.patternGenerators;
        return patterns[Math.floor(Math.random() * patterns.length)];
    },

    _getRandomMode() {
        const modes = ['rotational', 'mirror', 'spiral', 'interlockMirror', 'spiralMirror'];
        return modes[Math.floor(Math.random() * modes.length)];
    },

    _getRandomParticle() {
        const particles = ['star', 'spark', 'firefly', 'bubble', 'snow', 'butterfly', 'rainbow'];
        return particles[Math.floor(Math.random() * particles.length)];
    },

    _getRandomAnimation() {
        const animations = ['pulse', 'breathing', 'swirl', 'rotate', 'drift', 'floating', 'psychodelic'];
        return animations[Math.floor(Math.random() * animations.length)];
    },

    _getRandomBgAnimation() {
        const bgAnims = ['nebula', 'aurora', 'starField', 'gradientShift'];
        return bgAnims[Math.floor(Math.random() * bgAnims.length)];
    },

    _getRandomSpeed() {
        return Math.floor(Math.random() * 50) + 10;
    },

    /**
     * 降级：使用传统随机
     */
    _generateFallback() {
        KeyboardHandler._showToast('🎲 随机生成中...');
        RandomGenerator.applyRandom();
        return null;
    }
};
