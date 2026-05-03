/**
 * AI 配置管理
 */
const AIConfig = {
    // DeepSeek API 配置
    baseUrl: 'https://api.deepseek.com',
    apiKey: '', // 用户需要填入自己的 API Key
    model: 'deepseek-v4-flash',

    // 是否启用 AI 增强（用户可开关）
    aiEnabled: false,

    // AI 状态
    status: 'not_configured', // not_configured | ready | testing | error

    // 可用模型列表
    models: {
        'deepseek-v4-flash': 'DeepSeek V4 Flash（快速）',
        'deepseek-v4-pro': 'DeepSeek V4 Pro（高质量）'
    },

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('ai_api_key', key);
        // 重置状态
        this.status = this.apiKey ? 'not_configured' : 'not_configured';
    },

    loadApiKey() {
        this.apiKey = localStorage.getItem('ai_api_key') || '';
        return this.apiKey;
    },

    setModel(model) {
        this.model = model;
        localStorage.setItem('ai_model', model);
    },

    loadSettings() {
        this.loadApiKey();
        this.model = localStorage.getItem('ai_model') || 'deepseek-v4-flash';
        this.aiEnabled = localStorage.getItem('ai_enabled') === 'true';
        // 根据配置更新状态
        this.status = this.isConfigured() ? 'ready' : 'not_configured';
    },

    saveSettings() {
        localStorage.setItem('ai_model', this.model);
        localStorage.setItem('ai_enabled', this.aiEnabled);
    },

    toggle() {
        if (!this.isConfigured()) {
            return false; // 无法开启
        }
        this.aiEnabled = !this.aiEnabled;
        this.saveSettings();
        return this.aiEnabled;
    },

    isConfigured() {
        return this.apiKey && this.apiKey.length > 0;
    },

    /**
     * 获取状态描述
     */
    getStatusText() {
        switch (this.status) {
            case 'not_configured':
                return '⚠️ 未配置 API Key';
            case 'ready':
                return this.aiEnabled ? '✅ AI 已就绪' : '⏸️ AI 待开启';
            case 'testing':
                return '🔄 测试连接中...';
            case 'error':
                return '❌ 连接失败';
            default:
                return '❓ 未知状态';
        }
    },

    /**
     * 测试 API 连接
     */
    async testConnection() {
        if (!this.isConfigured()) {
            this.status = 'not_configured';
            return { success: false, message: '请先配置 API Key' };
        }

        this.status = 'testing';

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 5
                })
            });

            if (response.ok) {
                this.status = 'ready';
                return { success: true, message: '连接成功！' };
            } else {
                const error = await response.json().catch(() => ({}));
                this.status = 'error';
                return { 
                    success: false, 
                    message: error.error?.message || `错误码: ${response.status}` 
                };
            }
        } catch (error) {
            this.status = 'error';
            return { success: false, message: error.message };
        }
    }
};
