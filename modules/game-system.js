/**
 * 游戏化系统 - Game System
 * 成就、挑战、积分系统
 */

class GameSystem {
    constructor() {
        // 成就定义
        this.achievements = {
            // 基础成就
            first_draw: {
                name: '初次见面',
                description: '完成第一次绘制',
                icon: '🎨',
                condition: (stats) => stats.totalStrokes >= 1,
                reward: 10
            },
            first_random: {
                name: '随机之美',
                description: '使用随机生成功能',
                icon: '🎲',
                condition: (stats) => stats.randomGenerations >= 1,
                reward: 15
            },
            first_evolution: {
                name: '进化论',
                description: '使用进化功能',
                icon: '🧬',
                condition: (stats) => stats.evolutions >= 1,
                reward: 20
            },

            // 进阶成就
            color_master: {
                name: '色彩大师',
                description: '使用了全部8种配色方案',
                icon: '🌈',
                condition: (stats) => stats.uniquePalettes >= 8,
                reward: 50
            },
            symmetry_master: {
                name: '对称之美',
                description: '尝试了所有对称模式',
                icon: '❇️',
                condition: (stats) => stats.uniqueSymmetries >= 6,
                reward: 40
            },
            pattern_explorer: {
                name: '图案探索者',
                description: '解锁了所有图案生成器',
                icon: '🔮',
                condition: (stats) => stats.uniquePatterns >= 15,
                reward: 60
            },

            // 坚持成就
            streak_3: {
                name: '三天打鱼',
                description: '连续使用3天',
                icon: '🐟',
                condition: (stats) => stats.daysStreak >= 3,
                reward: 30
            },
            streak_7: {
                name: '一周坚持',
                description: '连续使用7天',
                icon: '📅',
                condition: (stats) => stats.daysStreak >= 7,
                reward: 70
            },
            streak_30: {
                name: '月度艺术家',
                description: '连续使用30天',
                icon: '🏆',
                condition: (stats) => stats.daysStreak >= 30,
                reward: 200
            },

            // 创作成就
            prolific_artist: {
                name: '多产艺术家',
                description: '创作了100幅作品',
                icon: '🖼️',
                condition: (stats) => stats.totalArtworks >= 100,
                reward: 100
            },
            master_artist: {
                name: '艺术大师',
                description: '创作了1000幅作品',
                icon: '👑',
                condition: (stats) => stats.totalArtworks >= 1000,
                reward: 500
            },

            // 音乐成就
            first_music: {
                name: '音乐启蒙',
                description: '播放第一首背景音乐',
                icon: '🎵',
                condition: (stats) => stats.musicPlays >= 1,
                reward: 15
            },
            music_lover: {
                name: '音乐爱好者',
                description: '播放了所有音乐主题',
                icon: '🎧',
                condition: (stats) => stats.uniqueMusicThemes >= 8,
                reward: 50
            },

            // 特效成就
            glow_master: {
                name: '发光大师',
                description: '使用发光模式创作50次',
                icon: '✨',
                condition: (stats) => stats.glowModeUses >= 50,
                reward: 40
            },
            particle_master: {
                name: '粒子大师',
                description: '使用了全部粒子类型',
                icon: '⭐',
                condition: (stats) => stats.uniqueParticles >= 8,
                reward: 50
            },

            // 社交成就
            first_share: {
                name: '分享达人',
                description: '第一次分享作品',
                icon: '📤',
                condition: (stats) => stats.shares >= 1,
                reward: 30
            },
            popular_artist: {
                name: '人气艺术家',
                description: '分享作品获得10次复制',
                icon: '❤️',
                condition: (stats) => stats.shareCopies >= 10,
                reward: 100
            },

            // 隐藏成就
            hidden_master: {
                name: '???',
                description: '发现所有隐藏成就后解锁',
                icon: '🔒',
                condition: (stats) => stats.hiddenFound >= 5,
                reward: 1000,
                hidden: true
            },
            surprise: {
                name: '???',
                description: '连续点击100次随机按钮',
                icon: '🔮',
                condition: (stats) => stats.randomClicks >= 100,
                reward: 500,
                hidden: true
            }
        };

        // 统计数据
        this.stats = this.loadStats();

        // 已解锁成就
        this.unlockedAchievements = new Set(this.stats.unlocked || []);

        // 事件监听器
        this.listeners = [];

        // 挑战
        this.challenges = this.initializeChallenges();

        // 当前活跃挑战
        this.activeChallenge = null;

        // 积分
        this.points = this.stats.points || 0;

        // 等级
        this.level = this.calculateLevel();
    }

    /**
     * 初始化挑战
     */
    initializeChallenges() {
        return [
            {
                id: 'speed_artist',
                name: '速度艺术家',
                description: '在30秒内完成一幅作品',
                icon: '⚡',
                target: 30000, // 30秒
                reward: 50,
                completed: false
            },
            {
                id: 'minimalist',
                name: '极简主义',
                description: '用不超过10笔画完成作品',
                icon: '➖',
                target: 10,
                reward: 40,
                completed: false
            },
            {
                id: 'color_harmony',
                name: '色彩和谐',
                description: '使用5种不同配色创作',
                icon: '🎨',
                target: 5,
                reward: 60,
                completed: false
            },
            {
                id: 'symmetry_expert',
                name: '对称专家',
                description: '尝试所有对称模式',
                icon: '❇️',
                target: 6,
                reward: 50,
                completed: false
            },
            {
                id: 'evolution_master',
                name: '进化大师',
                description: '连续进化10次',
                icon: '🧬',
                target: 10,
                reward: 80,
                completed: false
            },
            {
                id: 'music_flow',
                name: '音乐流',
                description: '在音乐播放时完成作品',
                icon: '🎵',
                target: 1,
                reward: 45,
                completed: false
            }
        ];
    }

    /**
     * 加载统计
     */
    loadStats() {
        try {
            const saved = localStorage.getItem('kaleidoscope_stats');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('[Game] Failed to load stats:', e);
        }

        return {
            totalStrokes: 0,
            randomGenerations: 0,
            evolutions: 0,
            uniquePalettes: new Set(),
            uniqueSymmetries: new Set(),
            uniquePatterns: new Set(),
            daysStreak: 0,
            totalArtworks: 0,
            musicPlays: 0,
            uniqueMusicThemes: new Set(),
            glowModeUses: 0,
            uniqueParticles: new Set(),
            shares: 0,
            shareCopies: 0,
            hiddenFound: 0,
            randomClicks: 0,
            unlocked: [],
            points: 0,
            lastVisit: null
        };
    }

    /**
     * 保存统计
     */
    saveStats() {
        try {
            const data = {
                ...this.stats,
                uniquePalettes: Array.from(this.stats.uniquePalettes || []),
                uniqueSymmetries: Array.from(this.stats.uniqueSymmetries || []),
                uniquePatterns: Array.from(this.stats.uniquePatterns || []),
                uniqueMusicThemes: Array.from(this.stats.uniqueMusicThemes || []),
                uniqueParticles: Array.from(this.stats.uniqueParticles || []),
                unlocked: Array.from(this.unlockedAchievements)
            };
            localStorage.setItem('kaleidoscope_stats', JSON.stringify(data));
        } catch (e) {
            console.error('[Game] Failed to save stats:', e);
        }
    }

    /**
     * 记录事件
     */
    trackEvent(event, value = 1) {
        const updateStats = {
            'stroke': () => { this.stats.totalStrokes += value; },
            'random': () => { this.stats.randomGenerations += value; },
            'evolution': () => { this.stats.evolutions += value; },
            'palette': () => { this.stats.uniquePalettes.add(value); },
            'symmetry': () => { this.stats.uniqueSymmetries.add(value); },
            'pattern': () => { this.stats.uniquePatterns.add(value); },
            'artwork': () => { this.stats.totalArtworks += value; },
            'music_play': () => { this.stats.musicPlays += value; },
            'music_theme': () => { this.stats.uniqueMusicThemes.add(value); },
            'glow_use': () => { this.stats.glowModeUses += value; },
            'particle': () => { this.stats.uniqueParticles.add(value); },
            'share': () => { this.stats.shares += value; },
            'share_copy': () => { this.stats.shareCopies += value; },
            'hidden_found': () => { this.stats.hiddenFound += value; },
            'random_click': () => { this.stats.randomClicks += value; }
        };

        if (updateStats[event]) {
            updateStats[event]();
            this.checkAchievements();
            this.checkChallenges();
            this.saveStats();
        }
    }

    /**
     * 检查成就解锁
     */
    checkAchievements() {
        const newlyUnlocked = [];

        for (const [id, achievement] of Object.entries(this.achievements)) {
            if (!this.unlockedAchievements.has(id) && achievement.condition(this.stats)) {
                this.unlockedAchievements.add(id);
                this.points += achievement.reward;
                this.stats.points = this.points;
                newlyUnlocked.push({ id, achievement });
                this.level = this.calculateLevel();

                this.emit('achievement', { id, achievement });
            }
        }

        if (newlyUnlocked.length > 0) {
            console.log('[Game] New achievements:', newlyUnlocked.map(a => a.achievement.name));
        }
    }

    /**
     * 检查挑战进度
     */
    checkChallenges() {
        if (!this.activeChallenge) return;

        const progress = this.getChallengeProgress(this.activeChallenge);
        if (progress >= this.activeChallenge.target && !this.activeChallenge.completed) {
            this.completeChallenge(this.activeChallenge);
        }
    }

    /**
     * 获取挑战进度
     */
    getChallengeProgress(challenge) {
        switch (challenge.id) {
            case 'speed_artist':
                return challenge.startTime ? Date.now() - challenge.startTime : 0;
            case 'minimalist':
                return this.stats.totalStrokes;
            case 'color_harmony':
                return this.stats.uniquePalettes.size;
            case 'symmetry_expert':
                return this.stats.uniqueSymmetries.size;
            case 'evolution_master':
                return this.stats.evolutions;
            case 'music_flow':
                return this.stats.musicPlays > 0 && this.stats.totalArtworks > 0 ? 1 : 0;
            default:
                return 0;
        }
    }

    /**
     * 开始挑战
     */
    startChallenge(challengeId) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        if (!challenge || challenge.completed) return false;

        this.activeChallenge = { ...challenge, startTime: Date.now() };

        if (challengeId === 'speed_artist') {
            this.activeChallenge.startTime = Date.now();
        }

        this.emit('challenge_start', this.activeChallenge);
        return true;
    }

    /**
     * 完成挑战
     */
    completeChallenge(challenge) {
        challenge.completed = true;
        this.points += challenge.reward;
        this.activeChallenge = null;
        this.emit('challenge_complete', challenge);
    }

    /**
     * 计算等级
     */
    calculateLevel() {
        const levels = [
            { min: 0, name: '初学者', icon: '🌱' },
            { min: 50, name: '学徒', icon: '🎨' },
            { min: 150, name: '新手', icon: '🖌️' },
            { min: 300, name: '创作者', icon: '✨' },
            { min: 500, name: '艺术家', icon: '🎭' },
            { min: 800, name: '大师', icon: '👑' },
            { min: 1200, name: '传奇', icon: '🌟' },
            { min: 2000, name: '神话', icon: '🔮' }
        ];

        let currentLevel = levels[0];
        for (const level of levels) {
            if (this.points >= level.min) {
                currentLevel = level;
            } else {
                break;
            }
        }

        return currentLevel;
    }

    /**
     * 获取进度条
     */
    getProgressToNextLevel() {
        const levels = [
            { min: 0, max: 50 },
            { min: 50, max: 150 },
            { min: 150, max: 300 },
            { min: 300, max: 500 },
            { min: 500, max: 800 },
            { min: 800, max: 1200 },
            { min: 1200, max: 2000 },
            { min: 2000, max: Infinity }
        ];

        const currentRange = levels.find(l => this.points >= l.min && this.points < l.max);
        if (!currentRange) return 1;

        return (this.points - currentRange.min) / (currentRange.max - currentRange.min);
    }

    /**
     * 获取所有成就
     */
    getAllAchievements() {
        return Object.entries(this.achievements).map(([id, achievement]) => ({
            id,
            ...achievement,
            unlocked: this.unlockedAchievements.has(id)
        }));
    }

    /**
     * 获取已解锁成就
     */
    getUnlockedAchievements() {
        return this.getAllAchievements().filter(a => a.unlocked);
    }

    /**
     * 获取所有挑战
     */
    getAllChallenges() {
        return this.challenges.map(c => ({
            ...c,
            progress: this.getChallengeProgress(c),
            active: this.activeChallenge?.id === c.id
        }));
    }

    /**
     * 获取用户信息
     */
    getUserInfo() {
        return {
            level: this.level,
            points: this.points,
            progress: this.getProgressToNextLevel(),
            achievementsCount: this.unlockedAchievements.size,
            totalAchievements: Object.keys(this.achievements).length,
            challengesCompleted: this.challenges.filter(c => c.completed).length,
            totalChallenges: this.challenges.length
        };
    }

    /**
     * 重置进度
     */
    reset() {
        this.stats = {
            totalStrokes: 0,
            randomGenerations: 0,
            evolutions: 0,
            uniquePalettes: new Set(),
            uniqueSymmetries: new Set(),
            uniquePatterns: new Set(),
            daysStreak: 0,
            totalArtworks: 0,
            musicPlays: 0,
            uniqueMusicThemes: new Set(),
            glowModeUses: 0,
            uniqueParticles: new Set(),
            shares: 0,
            shareCopies: 0,
            hiddenFound: 0,
            randomClicks: 0,
            unlocked: [],
            points: 0,
            lastVisit: null
        };
        this.unlockedAchievements = new Set();
        this.points = 0;
        this.level = this.calculateLevel();
        this.challenges.forEach(c => c.completed = false);
        this.activeChallenge = null;
        this.saveStats();
        this.emit('reset');
    }

    // 事件系统
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    off(event, callback) {
        this.listeners = this.listeners.filter(l => l.event !== event || l.callback !== callback);
    }

    emit(event, data) {
        this.listeners.filter(l => l.event === event).forEach(l => l.callback(data));
    }
}

// 导出
window.GameSystem = GameSystem;
