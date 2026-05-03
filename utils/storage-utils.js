/**
 * 存储工具 - 安全的localStorage操作工具
 * 提供压缩、过期管理、错误处理等功能
 */

const StorageUtils = {
  /**
   * 安全地设置localStorage值
   * @param {string} key - 存储键
   * @param {*} value - 要存储的值
   * @param {number} [ttl] - 过期时间(毫秒)，可选
   * @returns {boolean} 是否成功
   */
  setItem(key, value, ttl) {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl: ttl || null
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (e) {
      console.warn('[StorageUtils] 写入失败:', e);
      if (e.name === 'QuotaExceededError') {
        this.cleanupOldItems();
        try {
          localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
          return true;
        } catch (retryE) {
          console.error('[StorageUtils] 重试写入失败:', retryE);
        }
      }
      return false;
    }
  },

  /**
   * 安全地获取localStorage值
   * @param {string} key - 存储键
   * @param {*} [defaultValue] - 默认值
   * @returns {*} 存储的值或默认值
   */
  getItem(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      const item = JSON.parse(raw);
      
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(key);
        return defaultValue;
      }
      return item.value;
    } catch (e) {
      console.warn('[StorageUtils] 读取失败:', e);
      return defaultValue;
    }
  },

  /**
   * 删除指定键
   * @param {string} key - 存储键
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[StorageUtils] 删除失败:', e);
    }
  },

  /**
   * 清理过期或旧的项目
   */
  cleanupOldItems() {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const item = JSON.parse(raw);
          if (item.timestamp && now - item.timestamp > 30 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.warn('[StorageUtils] 清理失败:', e);
    }
  },

  /**
   * 获取存储使用估计
   * @returns {number} 估计使用字节数
   */
  getStorageSize() {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length * 2;
        }
      }
      return total;
    } catch (e) {
      return 0;
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageUtils;
}
