/**
 * Canvas 渲染缓存工具
 * 用于缓存对称图案、复杂图形等，减少重复计算
 */

const CanvasCache = {
  _cache: new Map(),
  _maxCacheSize: 50,
  _stats: {
    hits: 0,
    misses: 0,
    total: 0
  },

  /**
   * 生成缓存键
   * @param {Object} params - 缓存参数
   * @returns {string} 缓存键
   */
  _getKey(params) {
    try {
      return JSON.stringify(params, Object.keys(params).sort());
    } catch {
      return Math.random().toString(36);
    }
  },

  /**
   * 获取或创建缓存的 canvas
   * @param {Object} params - 标识参数
   * @param {Function} createFn - 未命中时的创建函数 (width, height) => canvas
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   * @returns {HTMLCanvasElement} 缓存的画布
   */
  getOrCreate(params, createFn, width, height) {
    const key = this._getKey(params);
    this._stats.total++;
    
    if (this._cache.has(key)) {
      this._stats.hits++;
      return this._cache.get(key);
    }
    
    this._stats.misses++;
    const canvas = createFn(width, height);
    
    // 缓存管理
    this._cache.set(key, canvas);
    if (this._cache.size > this._maxCacheSize) {
      // 删除最旧的项
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }
    
    return canvas;
  },

  /**
   * 清除指定缓存
   * @param {Object} params - 标识参数
   */
  invalidate(params) {
    const key = this._getKey(params);
    this._cache.delete(key);
  },

  /**
   * 清除所有缓存
   */
  clear() {
    this._cache.clear();
    this._stats.hits = 0;
    this._stats.misses = 0;
    this._stats.total = 0;
  },

  /**
   * 获取统计信息
   */
  getStats() {
    return { ...this._stats, cacheSize: this._cache.size };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasCache;
}
