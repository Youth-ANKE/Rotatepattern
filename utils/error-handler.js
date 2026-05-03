/**
 * 全局错误处理工具
 * 统一错误管理、用户友好提示
 */

const ErrorHandler = {
  _errorHistory: [],
  _maxHistory: 50,
  _listeners: [],

  /**
   * 初始化全局错误监听
   */
  init() {
    // 监听未捕获的 JS 错误
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: Date.now()
      });
    });

    // 监听 Promise  rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'unhandledrejection',
        message: event.reason?.message || String(event.reason),
        reason: event.reason,
        timestamp: Date.now()
      });
    });

    console.log('[ErrorHandler] 已初始化');
  },

  /**
   * 处理错误
   * @param {Object} errorInfo - 错误信息
   */
  handleError(errorInfo) {
    try {
      // 记录历史
      this._errorHistory.unshift(errorInfo);
      if (this._errorHistory.length > this._maxHistory) {
        this._errorHistory.pop();
      }

      // 控制台输出
      console.error('[ErrorHandler]', errorInfo);

      // 通知监听器
      for (const listener of this._listeners) {
        try {
          listener(errorInfo);
        } catch (e) {
          console.error('[ErrorHandler] 监听器错误:', e);
        }
      }

      // 显示用户友好提示 (非侵入式)
      this.showUserMessage(errorInfo);
    } catch (e) {
      console.error('[ErrorHandler] 处理错误时出错:', e);
    }
  },

  /**
   * 显示用户友好提示
   * @param {Object} errorInfo
   */
  showUserMessage(errorInfo) {
    try {
      // 查找 toast 元素或创建
      let toast = document.getElementById('toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff4444;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          z-index: 10000;
          font-family: sans-serif;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          opacity: 0;
          transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
      }

      // 用户友好消息
      const userMsg = this.getUserFriendlyMessage(errorInfo);
      toast.textContent = userMsg;
      toast.style.background = errorInfo.type === 'warning' ? '#ff9800' : '#ff4444';
      toast.style.opacity = '1';

      setTimeout(() => {
        toast.style.opacity = '0';
      }, 4000);
    } catch (e) {
      // 静默失败
    }
  },

  /**
   * 获取用户友好的错误消息
   * @param {Object} errorInfo
   * @returns {string}
   */
  getUserFriendlyMessage(errorInfo) {
    if (errorInfo.type === 'unhandledrejection') {
      return '网络请求失败，请检查网络连接';
    }
    if (errorInfo.message?.includes('quota')) {
      return '存储空间不足，请清理部分数据';
    }
    if (errorInfo.message?.includes('Audio')) {
      return '音频功能暂时不可用';
    }
    return '出现了小问题，但应用仍可继续使用';
  },

  /**
   * 添加错误监听
   * @param {Function} listener
   */
  addListener(listener) {
    this._listeners.push(listener);
  },

  /**
   * 移除错误监听
   * @param {Function} listener
   */
  removeListener(listener) {
    const index = this._listeners.indexOf(listener);
    if (index > -1) {
      this._listeners.splice(index, 1);
    }
  },

  /**
   * 获取错误历史
   */
  getErrorHistory() {
    return [...this._errorHistory];
  },

  /**
   * 手动记录错误
   * @param {Error|string} error
   * @param {string} [context]
   */
  log(error, context) {
    const errorInfo = {
      type: 'manual',
      message: error instanceof Error ? error.message : String(error),
      error: error instanceof Error ? error : null,
      context: context,
      timestamp: Date.now()
    };
    this.handleError(errorInfo);
  },

  /**
   * 包装函数，提供错误边界
   * @param {Function} fn
   * @param {string} [context]
   * @returns {Function}
   */
  wrap(fn, context) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (e) {
        this.log(e, context);
        return null;
      }
    };
  },

  /**
   * 包装 async 函数
   * @param {Function} fn
   * @param {string} [context]
   * @returns {Function}
   */
  wrapAsync(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (e) {
        this.log(e, context);
        return null;
      }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}
