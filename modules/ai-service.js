/**
 * AI 智能服务 - DeepSeek API
 */
const AIService = {
    _abortController: null,

    /**
     * 调用 DeepSeek API
     */
    async call(prompt, systemPrompt = '') {
        if (!AIConfig.isConfigured()) {
            throw new Error('请先配置 API Key');
        }

        // 取消之前的请求
        if (this._abortController) {
            this._abortController.abort();
        }
        this._abortController = new AbortController();

        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        try {
            const response = await fetch(`${AIConfig.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AIConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: AIConfig.model,
                    messages: messages,
                    temperature: 0.8,
                    max_tokens: 500
                }),
                signal: this._abortController.signal
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            if (error.name === 'AbortError') {
                return null; // 请求被取消
            }
            throw error;
        }
    },

    /**
     * 生成智能随机配置 - 增强版
     * 让 AI 直接生成颜色值，不依赖预设
     */
    async generateSmartConfig() {
        const systemPrompt = `你是一个艺术图案设计专家。你的任务是生成独特的艺术图案配置参数。

请直接生成一个JSON配置，包含实际的颜色值（使用 #RRGGBB 格式）和参数：

{
    "name": "方案名称（2-4字）",
    "colors": {
        "bg": "#深色背景色，如 #0a0a1a",
        "bgGrad": "#渐变背景色，如 #1a0a2e",
        "stroke": "#主要线条色，如 #ff66aa",
        "glow": "#发光色，如 #ff88cc",
        "accent": "#点缀色，如 #66ccff"
    },
    "patterns": ["图案1", "图案2"],
    "symmetry": 对称数（4-16）,
    "symmetryMode": "mirror|rotational|spiral|interlockMirror|spiralMirror",
    "particleType": "star|spark|firefly|bubble|snow|butterfly|rainbow",
    "animation": "pulse|breathing|swirl|rotate|drift|floating|psychodelic",
    "bgAnimation": "nebula|aurora|starField|gradientShift",
    "rotationSpeed": 旋转速度（10-60）,
    "strokeWidth": 线条宽度（1-6）
}

颜色要求：
- bg/bgGrad：深色背景，建议 #000000 到 #1a1a3a
- stroke：鲜艳的主色，如 #ff66aa, #44ff88, #88ccff, #ffd700
- glow：比stroke稍亮的颜色
- accent：对比色或互补色

图案类型：mandala, islamicGeo, spiralWave, roseCurve, celestialOrbits, fractalSnowflake, lissajous, moirePattern, flowerPetals, zentangle, starburst, ripples, goldenSpiral, fractalTree, waveInterference, laceFiligree, tessellation, radialBurst, concentricRings, zigzagRays, feathers, abstractScribble

直接输出JSON，不要其他内容。`;

        try {
            const response = await this.call(
                '生成一个随机艺术图案配置，要求色彩和谐、图案独特、风格现代。',
                systemPrompt
            );

            // 增强的 JSON 解析
            const config = this._parseJSON(response);
            if (config) {
                // 验证颜色值
                if (this._validateColors(config.colors)) {
                    return config;
                } else {
                    console.warn('AI 颜色验证失败，尝试修复...');
                    config.colors = this._fixColors(config.colors);
                    return config;
                }
            }
        } catch (e) {
            console.error('AI 配置生成失败:', e);
        }
        return null;
    },

    /**
     * 增强的 JSON 解析 - 多种格式容错
     */
    _parseJSON(response) {
        if (!response) return null;

        // 方法1: 标准 JSON 提取
        let jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                // 继续尝试其他方法
            }
        }

        // 方法2: 修复常见的 JSON 错误
        try {
            // 移除单引号改为双引号
            let fixed = response.replace(/'/g, '"');
            // 移除尾部逗号
            fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
            // 移除注释
            fixed = fixed.replace(/\/\/.*$/gm, '');
            fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
            // 提取 JSON
            jsonMatch = fixed.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            // 继续
        }

        // 方法3: 逐行解析
        try {
            const lines = response.split('\n');
            let jsonLines = [];
            let inJson = false;
            let braceCount = 0;

            for (const line of lines) {
                if (line.includes('{')) {
                    inJson = true;
                    braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
                } else if (line.includes('}')) {
                    braceCount -= (line.match(/}/g) || []).length;
                }

                if (inJson) {
                    jsonLines.push(line);
                    if (braceCount <= 0 && jsonLines.length > 1) {
                        break;
                    }
                }
            }

            if (jsonLines.length > 1) {
                const jsonStr = jsonLines.join('\n');
                const match = jsonStr.match(/\{[\s\S]*\}/);
                if (match) {
                    return JSON.parse(match[0]);
                }
            }
        } catch (e) {
            // 解析失败
        }

        return null;
    },

    /**
     * 验证颜色值是否有效
     */
    _validateColors(colors) {
        if (!colors) return false;
        const hexPattern = /^#[0-9a-fA-F]{6}$/;
        return (
            hexPattern.test(colors.bg) &&
            hexPattern.test(colors.bgGrad) &&
            hexPattern.test(colors.stroke) &&
            hexPattern.test(colors.glow) &&
            hexPattern.test(colors.accent)
        );
    },

    /**
     * 修复无效颜色值
     */
    _fixColors(colors) {
        const defaultColors = {
            bg: '#0a0a1a',
            bgGrad: '#1a0a2e',
            stroke: '#ff66aa',
            glow: '#ff88cc',
            accent: '#66ccff'
        };

        const hexPattern = /^#[0-9a-fA-F]{6}$/;

        // 修复每个无效颜色
        for (const key of ['bg', 'bgGrad', 'stroke', 'glow', 'accent']) {
            if (!hexPattern.test(colors[key])) {
                // 尝试提取有效的十六进制部分
                const match = colors[key]?.match(/#?[0-9a-fA-F]{6}/);
                if (match) {
                    colors[key] = match[0].startsWith('#') ? match[0] : '#' + match[0];
                } else {
                    colors[key] = defaultColors[key];
                }
            }
        }

        return colors;
    },

    /**
     * 评估图案美感并给出优化建议
     */
    async evaluatePattern(config) {
        const systemPrompt = `你是艺术图案美感评估专家。请评估以下配置参数的美感分数，并给出优化建议。

配置信息：
${JSON.stringify(config, null, 2)}

请生成JSON格式的评估结果：
{
    "score": 0-100 的美感分数,
    "strengths": ["优点1", "优点2"],
    "suggestions": ["建议1", "建议2"]
}

直接输出JSON，不要其他内容。`;

        const response = await this.call(
            `评估这个图案配置的美感: ${JSON.stringify(config)}`,
            systemPrompt
        );

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error('AI 评估解析失败:', e);
            }
        }
        return null;
    }
};
