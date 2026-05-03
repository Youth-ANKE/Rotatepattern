/**
 * 数学工具模块
 * 提供旋转、镜像等几何变换函数
 */
const MathUtils = {
    /**
     * 绕指定中心旋转点
     * @param {number} x - 点的x坐标
     * @param {number} y - 点的y坐标
     * @param {number} cx - 旋转中心x
     * @param {number} cy - 旋转中心y
     * @param {number} angle - 旋转角度（弧度）
     * @returns {{x: number, y: number}} 旋转后的点坐标
     */
    rotatePoint(x, y, cx, cy, angle) {
        // 守卫：防止 NaN 传播
        if (!isFinite(x) || !isFinite(y) || !isFinite(cx) || !isFinite(cy) || !isFinite(angle)) {
            return { x, y };
        }
        const dx = x - cx;
        const dy = y - cy;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos
        };
    },

    /**
     * 镜像点
     * @param {number} x - 点的x坐标
     * @param {number} y - 点的y坐标
     * @param {number} cx - 中心x
     * @param {number} cy - 中心y
     * @param {string} mode - 镜像模式: 'horizontal' | 'vertical' | 'both'
     * @returns {{x: number, y: number}} 镜像后的点坐标
     */
    mirrorPoint(x, y, cx, cy, mode) {
        // 守卫：防止 NaN 传播
        if (!isFinite(x) || !isFinite(y) || !isFinite(cx) || !isFinite(cy)) {
            return { x, y };
        }
        let mx = x, my = y;
        if (mode === 'horizontal' || mode === 'both') {
            mx = cx + (cx - x);
        }
        if (mode === 'vertical' || mode === 'both') {
            my = cy + (cy - y);
        }
        return { x: mx, y: my };
    },

    /**
     * 计算两点之间的距离
     * @param {number} x1 - 起点x
     * @param {number} y1 - 起点y
     * @param {number} x2 - 终点x
     * @param {number} y2 - 终点y
     * @returns {number} 距离
     */
    distance(x1, y1, x2, y2) {
        // 守卫：防止 NaN
        if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
            return Infinity;
        }
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    /**
     * 将角度归一化到 0-2PI
     */
    normalizeAngle(angle) {
        while (angle < 0) angle += 2 * Math.PI;
        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
        return angle;
    },

    /**
     * 道格拉斯-普克算法简化笔画（减少点数量，提高性能）
     * @param {Array} points - 点数组 [{x, y}]
     * @param {number} tolerance - 简化容差（像素）
     * @returns {Array} 简化后的点数组
     */
    simplifyStroke(points, tolerance = 1) {
        if (points.length <= 3) return points;
        
        const first = points[0];
        const last = points[points.length - 1];
        
        let maxDist = 0;
        let maxIndex = 0;
        
        for (let i = 1; i < points.length - 1; i++) {
            const dist = this._pointToLineDistance(points[i], first, last);
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }
        
        if (maxDist > tolerance) {
            const left = this.simplifyStroke(points.slice(0, maxIndex + 1), tolerance);
            const right = this.simplifyStroke(points.slice(maxIndex), tolerance);
            return [...left.slice(0, -1), ...right];
        }
        
        return [first, last];
    },

    /**
     * 点到线段的距离（内部）
     */
    _pointToLineDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const lengthSq = dx * dx + dy * dy;
        
        if (lengthSq === 0) {
            return this.distance(point.x, point.y, lineStart.x, lineStart.y);
        }
        
        let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));
        
        const projX = lineStart.x + t * dx;
        const projY = lineStart.y + t * dy;
        
        return this.distance(point.x, point.y, projX, projY);
    }
};