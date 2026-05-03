/**
 * AI 模板生成器 - AI Template Generator
 * 基于关键词模板的智能图案生成（无需外部API）
 */

class AITemplateGenerator {
    constructor() {
        // 关键词到配置的映射
        this.templates = {
            // 自然主题
            '自然': {
                patterns: ['organic', 'flower', 'tree', 'spiral'],
                colors: ['earth', 'ocean', 'aurora'],
                particles: ['leaf', 'firefly', 'bubble'],
                backgrounds: ['gradient', 'forest'],
                description: '自然的生命力'
            },
            '森林': {
                patterns: ['tree', 'organic', 'flower'],
                colors: ['earth', 'vibrant'],
                particles: ['leaf', 'firefly'],
                backgrounds: ['forest', 'gradient'],
                description: '神秘的森林深处'
            },
            '海洋': {
                patterns: ['wave', 'spiral', 'organic'],
                colors: ['ocean', 'aurora'],
                particles: ['bubble', 'star'],
                backgrounds: ['ocean', 'gradient'],
                description: '深海的蓝色梦境'
            },
            '星空': {
                patterns: ['spiral', 'mandala', 'star'],
                colors: ['cosmic', 'neon'],
                particles: ['star', 'spark'],
                backgrounds: ['nebula', 'stars'],
                description: '璀璨的星空世界'
            },
            '日出': {
                patterns: ['wave', 'spiral', 'mandala'],
                colors: ['sunset', 'vibrant'],
                particles: ['spark', 'rainbow'],
                backgrounds: ['gradient', 'sunrise'],
                description: '黎明的第一缕光'
            },
            '日落': {
                patterns: ['wave', 'geometric', 'mandala'],
                colors: ['sunset', 'cosmic'],
                particles: ['spark', 'firefly'],
                backgrounds: ['gradient', 'sunset'],
                description: '黄昏的绚烂余晖'
            },

            // 艺术主题
            '赛博': {
                patterns: ['geometric', 'spiral', 'mandala'],
                colors: ['neon', 'cosmic'],
                particles: ['spark', 'star'],
                backgrounds: ['dark', 'grid'],
                description: '霓虹闪烁的赛博空间'
            },
            '像素': {
                patterns: ['geometric', 'star'],
                colors: ['neon', 'vibrant'],
                particles: ['spark'],
                backgrounds: ['grid', 'dark'],
                description: '复古像素风格'
            },
            '水彩': {
                patterns: ['organic', 'flower', 'wave'],
                colors: ['pastel', 'sunset'],
                particles: ['bubble', 'firefly'],
                backgrounds: ['gradient'],
                description: '流动的水彩画'
            },
            '水墨': {
                patterns: ['organic', 'wave', 'tree'],
                colors: ['earth', 'cosmic'],
                particles: ['bubble'],
                backgrounds: ['gradient', 'dark'],
                description: '东方水墨意境'
            },

            // 情感主题
            '梦幻': {
                patterns: ['spiral', 'mandala', 'flower'],
                colors: ['pastel', 'aurora', 'cosmic'],
                particles: ['firefly', 'star', 'butterfly'],
                backgrounds: ['gradient', 'nebula'],
                description: '如梦似幻的世界'
            },
            '浪漫': {
                patterns: ['flower', 'spiral', 'mandala'],
                colors: ['pastel', 'sunset', 'vibrant'],
                particles: ['heart', 'spark', 'firefly'],
                backgrounds: ['gradient', 'rose'],
                description: '浪漫的粉色泡泡'
            },
            '神秘': {
                patterns: ['mandala', 'geometric', 'fractal'],
                colors: ['cosmic', 'aurora', 'neon'],
                particles: ['star', 'spark'],
                backgrounds: ['nebula', 'dark'],
                description: '神秘的未知领域'
            },
            '宁静': {
                patterns: ['wave', 'organic', 'spiral'],
                colors: ['ocean', 'pastel', 'earth'],
                particles: ['bubble', 'leaf'],
                backgrounds: ['gradient', 'ocean'],
                description: '平静如水的心境'
            },
            '活力': {
                patterns: ['mandala', 'geometric', 'star'],
                colors: ['vibrant', 'neon', 'sunset'],
                particles: ['spark', 'star', 'rainbow'],
                backgrounds: ['gradient', 'bright'],
                description: '充满活力的能量'
            },
            '优雅': {
                patterns: ['mandala', 'spiral', 'flower'],
                colors: ['pastel', 'aurora', 'earth'],
                particles: ['spark', 'butterfly'],
                backgrounds: ['gradient', 'rose'],
                description: '优雅的曲线之美'
            },

            // 特殊主题
            '火焰': {
                patterns: ['wave', 'spiral', 'fractal'],
                colors: ['sunset', 'vibrant'],
                particles: ['spark', 'firefly'],
                backgrounds: ['fire', 'gradient'],
                description: '燃烧的火焰'
            },
            '冰晶': {
                patterns: ['geometric', 'mandala', 'star'],
                colors: ['ocean', 'cosmic'],
                particles: ['spark', 'star', 'snow'],
                backgrounds: ['ice', 'gradient'],
                description: '晶莹的冰晶世界'
            },
            '音乐': {
                patterns: ['wave', 'spiral', 'mandala'],
                colors: ['neon', 'rainbow', 'cosmic'],
                particles: ['spark', 'star', 'rainbow'],
                backgrounds: ['gradient', 'nebula'],
                description: '跳动的音符'
            },
            '科技': {
                patterns: ['geometric', 'mandala', 'spiral'],
                colors: ['neon', 'cosmic', 'ocean'],
                particles: ['spark', 'star'],
                backgrounds: ['grid', 'dark'],
                description: '未来科技感'
            },
            '复古': {
                patterns: ['mandala', 'flower', 'geometric'],
                colors: ['sunset', 'earth', 'vibrant'],
                particles: ['spark', 'leaf'],
                backgrounds: ['gradient', 'sepia'],
                description: '怀旧的复古风格'
            },
            '极简': {
                patterns: ['geometric', 'spiral', 'mandala'],
                colors: ['earth', 'ocean', 'pastel'],
                particles: ['spark'],
                backgrounds: ['gradient', 'white'],
                description: '简约而不简单'
            },
            '奢华': {
                patterns: ['mandala', 'geometric', 'star'],
                colors: ['cosmic', 'neon', 'aurora'],
                particles: ['spark', 'star', 'rainbow'],
                backgrounds: ['gradient', 'dark'],
                description: '金碧辉煌的奢华'
            },
            '可爱': {
                patterns: ['flower', 'star', 'spiral'],
                colors: ['pastel', 'vibrant', 'sunset'],
                particles: ['heart', 'butterfly', 'spark'],
                backgrounds: ['gradient', 'bright'],
                description: '萌萌哒可爱风'
            },
            '暗黑': {
                patterns: ['mandala', 'geometric', 'fractal'],
                colors: ['cosmic', 'neon', 'sunset'],
                particles: ['spark', 'star'],
                backgrounds: ['dark', 'nebula'],
                description: '神秘的暗黑风格'
            },
            '治愈': {
                patterns: ['wave', 'flower', 'organic'],
                colors: ['pastel', 'aurora', 'ocean'],
                particles: ['bubble', 'leaf', 'butterfly'],
                backgrounds: ['gradient', 'soft'],
                description: '温暖治愈的感觉'
            },
            '抽象': {
                patterns: ['fractal', 'organic', 'wave'],
                colors: ['cosmic', 'aurora', 'neon'],
                particles: ['spark', 'star'],
                backgrounds: ['gradient', 'nebula'],
                description: '抽象的艺术表达'
            },
            '宗教': {
                patterns: ['mandala', 'geometric', 'star'],
                colors: ['earth', 'aurora', 'sunset'],
                particles: ['spark', 'star'],
                backgrounds: ['gradient', 'golden'],
                description: '神圣的宗教符号'
            }
        };

        // 模糊匹配
        this.synonyms = {
            '夜空': '星空',
            '夜晚': '星空',
            '春天': '自然',
            '夏天': '海洋',
            '秋天': '森林',
            '冬天': '冰晶',
            '霓虹': '赛博',
            '电子': '赛博',
            '动漫': '可爱',
            '卡通': '可爱',
            '冥想': '宁静',
            '放松': '治愈',
            '悲伤': '暗黑',
            '哥特': '暗黑',
            '古典': '复古',
            '传统': '复古',
            '未来': '科技',
            '现代': '科技',
            '极简': '极简',
            '简单': '极简'
        };

        // 所有可用标签
        this.allTags = Object.keys(this.templates);
    }

    /**
     * 搜索匹配的模板
     */
    search(keyword) {
        // 精确匹配
        if (this.templates[keyword]) {
            return { keyword, template: this.templates[keyword], score: 1 };
        }

        // 同义词匹配
        const normalized = this.synonyms[keyword] || keyword;
        if (this.templates[normalized]) {
            return { keyword, template: this.templates[normalized], score: 0.9 };
        }

        // 模糊匹配
        const keywordLower = keyword.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        for (const [tag, template] of Object.entries(this.templates)) {
            // 标签包含关键词
            if (tag.includes(keywordLower)) {
                const score = keywordLower.length / tag.length;
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { keyword, template, score };
                }
            }

            // 描述包含关键词
            if (template.description.includes(keyword)) {
                if (0.7 > bestScore) {
                    bestScore = 0.7;
                    bestMatch = { keyword, template, score: 0.7 };
                }
            }
        }

        return bestMatch || null;
    }

    /**
     * 从文本描述生成配置
     */
    generateFromText(text) {
        // 分词
        const words = text.split(/[,，、\s]+/).filter(w => w.length > 0);

        // 搜索匹配
        const matches = [];
        for (const word of words) {
            const match = this.search(word);
            if (match) {
                matches.push(match);
            }
        }

        // 如果没有匹配，使用随机或默认
        if (matches.length === 0) {
            const randomTag = this.allTags[Math.floor(Math.random() * this.allTags.length)];
            matches.push({ keyword: randomTag, template: this.templates[randomTag], score: 0.3 });
        }

        // 合并匹配结果
        return this.mergeTemplates(matches);
    }

    /**
     * 合并多个模板
     */
    mergeTemplates(matches) {
        if (matches.length === 1) {
            return this.templateToConfig(matches[0].template);
        }

        // 加权随机选择
        const pick = (arr) => {
            const totalScore = matches.reduce((sum, m) => sum + m.score, 0);
            let random = Math.random() * totalScore;

            for (let i = 0; i < arr.length; i++) {
                random -= matches[i].score;
                if (random <= 0) {
                    return arr[i];
                }
            }
            return arr[Math.floor(Math.random() * arr.length)];
        };

        const result = {
            pattern: pick(matches.map(m => m.template.patterns)),
            color: pick(matches.map(m => m.template.colors)),
            particle: pick(matches.map(m => m.template.particles)),
            background: pick(matches.map(m => m.template.backgrounds)),
            description: matches.map(m => m.keyword).join(' + ')
        };

        return result;
    }

    /**
     * 将模板转换为完整配置
     */
    templateToConfig(template) {
        return {
            pattern: template.patterns[Math.floor(Math.random() * template.patterns.length)],
            color: template.colors[Math.floor(Math.random() * template.colors.length)],
            particle: template.particles[Math.floor(Math.random() * template.particles.length)],
            background: template.backgrounds[Math.floor(Math.random() * template.backgrounds.length)],
            description: template.description
        };
    }

    /**
     * 应用配置到状态
     */
    applyConfig(config) {
        const state = window.StateManager?.state;
        if (!state) return false;

        // 颜色映射
        const colorMap = {
            vibrant: 0,
            pastel: 1,
            neon: 2,
            earth: 3,
            ocean: 4,
            sunset: 5,
            aurora: 6,
            cosmic: 7
        };

        const configMap = {
            pattern: (v) => {
                if (window.RandomGenerator) {
                    window.RandomGenerator.setPatternGenerator(v);
                }
            },
            color: (v) => {
                if (window.StateManager) {
                    window.StateManager.setState({ paletteIndex: colorMap[v] || 0 });
                }
            },
            particle: (v) => {
                if (window.ParticleSystem) {
                    window.ParticleSystem.setParticleType(v);
                }
            }
        };

        // 应用配置
        for (const [key, value] of Object.entries(config)) {
            if (configMap[key]) {
                configMap[key](value);
            }
        }

        return true;
    }

    /**
     * 获取所有可用标签
     */
    getAllTags() {
        return this.allTags;
    }

    /**
     * 获取标签分类
     */
    getTagCategories() {
        return {
            '自然': ['自然', '森林', '海洋', '星空', '日出', '日落'],
            '艺术': ['艺术', '赛博', '像素', '水彩', '水墨'],
            '情感': ['梦幻', '浪漫', '神秘', '宁静', '活力', '优雅'],
            '特殊': ['火焰', '冰晶', '音乐', '科技', '复古', '极简', '奢华', '可爱', '暗黑', '治愈', '抽象', '宗教']
        };
    }

    /**
     * 智能建议
     */
    suggest(input) {
        if (!input) {
            // 返回随机建议
            const tags = this.allTags;
            const suggestions = [];
            for (let i = 0; i < 5; i++) {
                const tag = tags[Math.floor(Math.random() * tags.length)];
                suggestions.push({
                    tag,
                    template: this.templates[tag],
                    score: 0.5 + Math.random() * 0.5
                });
            }
            return suggestions;
        }

        // 搜索匹配
        const words = input.split(/[,，、\s]+/);
        const suggestions = [];

        for (const word of words) {
            const match = this.search(word);
            if (match) {
                suggestions.push(match);
            }
        }

        return suggestions.slice(0, 5);
    }
}

// 导出
window.AITemplateGenerator = AITemplateGenerator;
