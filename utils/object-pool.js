/**
 * 对象池 - 用于频繁创建销毁对象的性能优化
 * 特别适合粒子系统、笔画点等
 */

class ObjectPool {
  /**
   * @param {Function} createFn - 创建新对象的函数
   * @param {Function} resetFn - 重置对象的函数
   * @param {number} [initialSize=20] - 初始大小
   * @param {number} [maxSize=500] - 最大大小
   */
  constructor(createFn, resetFn, initialSize = 20, maxSize = 500) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this.pool = [];
    this.stats = {
      created: 0,
      reused: 0,
      recycled: 0
    };
    
    // 预填充
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
      this.stats.created++;
    }
  }
  
  /**
   * 从池获取一个对象
   * @returns {*} 对象
   */
  acquire() {
    if (this.pool.length > 0) {
      this.stats.reused++;
      const obj = this.pool.pop();
      this.resetFn(obj);
      return obj;
    }
    
    this.stats.created++;
    return this.createFn();
  }
  
  /**
   * 将对象归还到池
   * @param {*} obj - 要回收的对象
   */
  release(obj) {
    if (!obj) return;
    
    if (this.pool.length < this.maxSize) {
      this.stats.recycled++;
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }
  
  /**
   * 批量归还对象
   * @param {Array} objs - 对象数组
   */
  releaseAll(objs) {
    for (const obj of objs) {
      this.release(obj);
    }
  }
  
  /**
   * 清空池
   */
  clear() {
    this.pool = [];
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return { ...this.stats, poolSize: this.pool.length };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ObjectPool;
}
