/**
 * 高级图案生成器模块
 * 提供：流体流线、地形等高线、进化算法图案、熔岩灯等全新生成器
 * 依赖：NoiseGenerator, ColorPalette
 */
const AdvancedGenerators = {
    // ============ 流体流线 ============
    // 基于 Perlin 噪声场生成流线型图案

    /**
     * 流体流线生成
     * 从多个种子点沿噪声场方向跟踪，产生水波纹/流体图案
     * @param {number} cx - 中心 x
     * @param {number} cy - 中心 y
     * @param {number} maxR - 最大半径
     * @param {number} count - 种子点数量
     * @param {Array} colors - 颜色数组
     * @param {Object} config - 生成配置
     * @param {Object} palette - 调色板
     * @returns {Array} strokes
     */
    fluidFlow(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const numStreams = 8 + Math.floor(Math.random() * 12);
        const stepLength = 3 + Math.random() * 4;
        const maxSteps = 80 + Math.floor(Math.random() * 60);
        const noiseScale = 0.005 + Math.random() * 0.008;
        
        // 获取噪声种子
        const seed = StateManager.state.noiseSeed || Math.floor(Math.random() * 100000);
        NoiseGenerator.init(seed);
        
        // 从圆周均匀分布的种子点出发
        for (let i = 0; i < numStreams; i++) {
            const angle = (2 * Math.PI * i) / numStreams + (Math.random() - 0.5) * 0.1;
            const startR = maxR * (0.1 + Math.random() * 0.8);
            
            let x = cx + startR * Math.cos(angle);
            let y = cy + startR * Math.sin(angle);
            
            const points = [];
            let alive = true;
            
            for (let step = 0; step < maxSteps && alive; step++) {
                points.push({ x, y });
                
                // 采样噪声场方向
                const nx = x * noiseScale;
                const ny = y * noiseScale;
                const noiseAngle = NoiseGenerator.fbm(nx, ny, 3) * Math.PI * 2;
                
                // 加上向心力和随机抖动
                const dx = cx - x;
                const dy = cy - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const centripetal = Math.atan2(dy, dx) + (dist < maxR * 0.3 ? Math.PI : 0);
                
                const finalAngle = noiseAngle * 0.6 + centripetal * 0.2 + (Math.random() - 0.5) * 0.1;
                
                x += Math.cos(finalAngle) * stepLength;
                y += Math.sin(finalAngle) * stepLength;
                
                // 边界检测
                const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                if (d > maxR || d < 5 || x < 0 || y < 0 || x > StateManager.state.canvasWidth || y > StateManager.state.canvasHeight) {
                    alive = false;
                }
            }
            
            if (points.length > 10) {
                points._color = colors[i % colors.length];
                strokes.push(points);
            }
        }
        
        // 添加一些短流线（增加密度）
        if (Math.random() > 0.4) {
            const extraCount = 5 + Math.floor(Math.random() * 8);
            for (let i = 0; i < extraCount; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const startR = maxR * (0.2 + Math.random() * 0.6);
                let x = cx + startR * Math.cos(angle);
                let y = cy + startR * Math.sin(angle);
                const points = [];
                
                for (let step = 0; step < 30; step++) {
                    points.push({ x, y });
                    const nx = x * noiseScale;
                    const ny = y * noiseScale;
                    const noiseAngle = NoiseGenerator.fbm(nx + seed, ny + seed, 3) * Math.PI * 2;
                    x += Math.cos(noiseAngle) * stepLength * 0.7;
                    y += Math.sin(noiseAngle) * stepLength * 0.7;
                    
                    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    if (d > maxR || d < 5) break;
                }
                
                if (points.length > 5) {
                    points._color = colors[(i + numStreams) % colors.length];
                    strokes.push(points);
                }
            }
        }
        
        return strokes;
    },

    // ============ 地形等高线 ============

    /**
     * 地形等高线生成
     * 用 Perlin 噪声生成地形高度场后绘制等高线
     */
    terrainContour(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const gridSize = 80;
        const halfG = gridSize / 2;
        const scale = 0.02 + Math.random() * 0.03;
        const numLevels = 4 + Math.floor(Math.random() * 6);
        const seed = StateManager.state.noiseSeed || Math.floor(Math.random() * 100000);
        
        NoiseGenerator.init(seed);
        
        // 生成高度场
        const fieldSize = Math.ceil(maxR / halfG * 2);
        const field = new Float32Array(fieldSize * fieldSize);
        
        for (let y = 0; y < fieldSize; y++) {
            for (let x = 0; x < fieldSize; x++) {
                const wx = (x - fieldSize / 2) * halfG + cx;
                const wy = (y - fieldSize / 2) * halfG + cy;
                field[y * fieldSize + x] = NoiseGenerator.fbm(wx * scale, wy * scale, 4);
            }
        }
        
        // 找到高度范围
        let minH = Infinity, maxH = -Infinity;
        for (const v of field) {
            if (v < minH) minH = v;
            if (v > maxH) maxH = v;
        }
        const range = maxH - minH || 1;
        
        // 为每个等高线级别生成轮廓
        for (let level = 0; level < numLevels; level++) {
            const threshold = minH + (range * (level + 1)) / (numLevels + 1);
            const contourPoints = [];
            
            // 使用 marching squares 简化版：扫描网格查找等值线
            for (let y = 0; y < fieldSize - 1; y++) {
                for (let x = 0; x < fieldSize - 1; x++) {
                    const v00 = field[y * fieldSize + x];
                    const v10 = field[y * fieldSize + x + 1];
                    const v01 = field[(y + 1) * fieldSize + x];
                    const v11 = field[(y + 1) * fieldSize + x + 1];
                    
                    // 检查是否跨等值线
                    const corners = [v00, v10, v11, v01];
                    let crosses = 0;
                    for (let c = 0; c < 4; c++) {
                        const next = (c + 1) % 4;
                        if ((corners[c] < threshold) !== (corners[next] < threshold)) {
                            crosses++;
                        }
                    }
                    if (crosses === 0) continue;
                    
                    // 线性插值求等值点
                    const wx = (x - fieldSize / 2) * halfG + cx;
                    const wy = (y - fieldSize / 2) * halfG + cy;
                    
                    // 简化为在单元格中心画点
                    const d = Math.sqrt((wx - cx) ** 2 + (wy - cy) ** 2);
                    if (d < maxR) {
                        contourPoints.push({ x: wx, y: wy });
                    }
                }
            }
            
            // 如果点太多，按角度排序后连接成曲线
            if (contourPoints.length > 5) {
                contourPoints.sort((a, b) => {
                    const angleA = Math.atan2(a.y - cy, a.x - cx);
                    const angleB = Math.atan2(b.y - cy, b.x - cx);
                    return angleA - angleB;
                });
                
                // 分段连接避免跨跳过远
                const segments = [];
                let current = [];
                for (let i = 0; i < contourPoints.length; i++) {
                    const p = contourPoints[i];
                    if (current.length > 0) {
                        const last = current[current.length - 1];
                        const dist = Math.sqrt((p.x - last.x) ** 2 + (p.y - last.y) ** 2);
                        if (dist > halfG * 2) {
                            if (current.length > 3) segments.push(current);
                            current = [p];
                            continue;
                        }
                    }
                    current.push(p);
                }
                if (current.length > 3) segments.push(current);
                
                for (const seg of segments) {
                    seg._color = colors[(level + 2) % colors.length];
                    strokes.push(seg);
                }
            }
        }
        
        // 安全保障：如果没有生成等高线，添加保底的简单同心圆
        if (strokes.length === 0) {
            console.warn('[terrainContour] 未生成等高线，使用保底同心圆');
            for (let i = 0; i < count + 2; i++) {
                const r = maxR * (0.2 + (i / (count + 2)) * 0.7);
                const circle = [];
                const steps = 32;
                for (let j = 0; j <= steps; j++) {
                    const angle = (j / steps) * Math.PI * 2;
                    circle.push({
                        x: cx + Math.cos(angle) * r,
                        y: cy + Math.sin(angle) * r
                    });
                }
                circle._color = colors[i % colors.length];
                strokes.push(circle);
            }
        }
        
        return strokes;
    },

    // ============ 进化算法图案 ============
    // 从随机起点开始迭代优化

    /**
     * 进化算法图案生成
     * 使用遗传算法迭代生成最优图案
     */
    evolutionPattern(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const populationSize = 10;
        const iterations = 20 + Math.floor(Math.random() * 30);
        
        // 更新迭代计数
        StateManager.setState({ evolutionIterations: iterations });
        
        // 初始化种群：随机参数
        let population = [];
        for (let i = 0; i < populationSize; i++) {
            population.push({
                segments: 3 + Math.floor(Math.random() * 12),
                layers: 1 + Math.floor(Math.random() * 4),
                twist: Math.random() * 2 - 1,
                scale: 0.5 + Math.random() * 0.5,
                noise: Math.random(),
                fitness: 0
            });
        }
        
        const evaluateFitness = (params) => {
            // 基于复杂度和多样性评分
            const complexity = params.segments * params.layers * (1 + Math.abs(params.twist));
            const variety = params.noise * params.scale;
            return complexity * variety;
        };
        
        const mutate = (params) => {
            const mutated = { ...params, fitness: 0 }; // 确保 fitness 存在
            if (Math.random() > 0.5) mutated.segments = Math.max(3, params.segments + Math.floor((Math.random() - 0.5) * 4));
            if (Math.random() > 0.5) mutated.layers = Math.max(1, Math.min(6, params.layers + Math.floor((Math.random() - 0.5) * 2)));
            if (Math.random() > 0.5) mutated.twist = Math.max(-1, Math.min(1, params.twist + (Math.random() - 0.5) * 0.3));
            if (Math.random() > 0.5) mutated.scale = Math.max(0.3, Math.min(1.0, params.scale + (Math.random() - 0.5) * 0.2));
            if (Math.random() > 0.5) mutated.noise = Math.max(0, Math.min(1, params.noise + (Math.random() - 0.5) * 0.2));
            return mutated;
        };
        
        // ---- 增强进化：加入交叉算子 ---- 
        const crossover = (parentA, parentB) => {
            const child = {};
            // 均匀交叉：每个基因有 50% 概率取自父本A，50%取自父本B
            const keys = ['segments', 'layers', 'twist', 'scale', 'noise'];
            for (const key of keys) {
                child[key] = Math.random() > 0.5 ? parentA[key] : parentB[key];
            }
            child.fitness = 0; // 确保有 fitness 属性
            // 10% 的额外突变扰动
            if (Math.random() < 0.1) {
                child.twist = Math.max(-1, Math.min(1, child.twist + (Math.random() - 0.5) * 0.2));
                child.scale = Math.max(0.3, Math.min(1.0, child.scale + (Math.random() - 0.5) * 0.15));
                child.noise = Math.max(0, Math.min(1, child.noise + (Math.random() - 0.5) * 0.15));
            }
            return child;
        };
        
        // ---- 引入多样性奖励的适应度函数 ----
        let history = []; // 记录已选个体的基因，鼓励多样性
        const evaluateFitness2 = (params, history) => {
            const complexity = params.segments * params.layers * (1 + Math.abs(params.twist));
            const variety = params.noise * params.scale;
            const baseFitness = complexity * variety;
            
            // 多样性惩罚：与历史个体的基因差异越小，惩罚越大
            let diversityBonus = 0;
            for (const h of history) {
                const diff = Math.abs(params.segments - h.segments) / 10 +
                             Math.abs(params.layers - h.layers) / 4 +
                             Math.abs(params.twist - h.twist) * 0.5 +
                             Math.abs(params.scale - h.scale) * 0.5 +
                             Math.abs(params.noise - h.noise);
                diversityBonus += diff * 2;
            }
            
            return baseFitness + diversityBonus;
        };

        // 迭代
        for (let gen = 0; gen < iterations; gen++) {
            // 使用增强适应度评估
            for (const p of population) {
                p.fitness = evaluateFitness2(p, history);
            }
            
            // 排序
            population.sort((a, b) => b.fitness - a.fitness);
            
            // 保留前 30% 作为精英
            const keepCount = Math.max(2, Math.floor(populationSize * 0.3));
            const elites = population.slice(0, keepCount);
            
            // 将精英加入历史记录（用于多样性惩罚）
            for (const e of elites) {
                history.push({ segments: e.segments, layers: e.layers, twist: e.twist, scale: e.scale, noise: e.noise });
                if (history.length > 20) history.shift();
            }
            
            // 用精英繁衍新种群（同时使用变异和交叉）
            const newPopulation = [...elites];
            while (newPopulation.length < populationSize) {
                if (Math.random() > 0.4 && elites.length >= 2) {
                    // 交叉繁殖（40%概率）
                    const pA = elites[Math.floor(Math.random() * elites.length)];
                    const pB = elites[Math.floor(Math.random() * elites.length)];
                    const child = crossover(pA, pB);
                    newPopulation.push(child);
                } else {
                    // 变异繁殖
                    const parent = elites[Math.floor(Math.random() * elites.length)];
                    const child = mutate(parent);
                    newPopulation.push(child);
                }
            }
            
            population = newPopulation;
        }
        
        // 使用最优个体生成笔画
        const best = population[0];
        const twist = best.twist;
        const segs = best.segments;
        const layers = best.layers;
        const noise = best.noise;
        const scale = best.scale;
        
        for (let l = 0; l < layers; l++) {
            const rScale = 0.3 + (l / layers) * 0.7;
            const layerR = maxR * scale * rScale;
            
            const points = [];
            const pointCount = 30 + segs * 10;
            
            for (let i = 0; i <= pointCount; i++) {
                const t = i / pointCount;
                const angle = t * 2 * Math.PI * (segs / 2) + twist * t * Math.PI;
                const rRatio = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * segs * Math.PI + noise * 10));
                const r = layerR * rRatio + Math.sin(t * Math.PI * 8) * noise * 15;
                
                // 加上 Perlin 噪声扰动
                const nx = t * 10 + l * 5;
                const ny = noise * 20;
                const disturb = NoiseGenerator.smoothNoise(nx, ny, 0.1) * noise * 20;
                
                points.push({
                    x: cx + (r + disturb) * Math.cos(angle + disturb * 0.002),
                    y: cy + (r + disturb) * Math.sin(angle + disturb * 0.002)
                });
            }
            
            if (points.length > 5) {
                points._color = colors[l % colors.length];
                strokes.push(points);
            }
        }
        
        // 保存最优参数用于状态展示
        StateManager.setState({
            evolutionPopulation: population.slice(0, 5).map(p => ({
                segments: p.segments,
                layers: p.layers,
                fitness: (p.fitness || 0).toFixed(1),
                diversity: (history.length > 0) ? ((evaluateFitness2(p, history) || 0).toFixed(1)) : '0'
            }))
        });
        
        return strokes;
    },

    // ============ 熔岩灯 ============
    // 模拟流体对流分层效果

    lavaLamp(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const blobs = 5 + Math.floor(Math.random() * 8);
        const seed = StateManager.state.noiseSeed || Math.floor(Math.random() * 100000);
        NoiseGenerator.init(seed);
        
        // 为每个 blob 生成随机的运动轨迹
        const blobData = [];
        for (let i = 0; i < blobs; i++) {
            blobData.push({
                angle: Math.random() * 2 * Math.PI,
                radius: maxR * (0.2 + Math.random() * 0.6),
                size: maxR * (0.08 + Math.random() * 0.15),
                speed: 0.5 + Math.random() * 1.5,
                phase: Math.random() * 2 * Math.PI,
                wobble: 3 + Math.random() * 8
            });
        }
        
        // 绘制每个 blob 的轮廓
        for (let i = 0; i < blobs; i++) {
            const b = blobData[i];
            const points = [];
            const segs = 16 + Math.floor(Math.random() * 12);
            
            // 基础位置随时间变化（用动画帧的 phase 来模拟）
            const time = Date.now() * 0.0005;
            const moveAngle = b.angle + Math.sin(time * b.speed + b.phase) * 0.5;
            const moveDist = b.radius + Math.sin(time * b.speed * 0.7 + b.phase) * maxR * 0.1;
            
            const baseX = cx + moveDist * Math.cos(moveAngle);
            const baseY = cy + moveDist * Math.sin(moveAngle);
            
            // 绘制变形圆
            for (let j = 0; j <= segs; j++) {
                const a = (2 * Math.PI * j) / segs;
                const wobble = Math.sin(a * b.wobble + time * 2 + b.phase) * 3;
                const r = b.size + wobble;
                
                points.push({
                    x: baseX + r * Math.cos(a),
                    y: baseY + r * Math.sin(a)
                });
            }
            
            if (points.length > 5) {
                points._color = colors[i % colors.length];
                strokes.push(points);
            }
        }
        
        // 连接某些 blob 形成"熔岩桥"
        if (blobs > 2 && Math.random() > 0.5) {
            const bridgeCount = Math.floor(blobs / 2);
            for (let i = 0; i < bridgeCount; i++) {
                const b1 = blobData[i];
                const b2 = blobData[(i + 2) % blobs];
                
                const a1 = b1.angle + Math.sin(Date.now() * 0.0005 * b1.speed + b1.phase) * 0.5;
                const d1 = b1.radius;
                const p1 = { x: cx + d1 * Math.cos(a1), y: cy + d1 * Math.sin(a1) };
                
                const a2 = b2.angle + Math.sin(Date.now() * 0.0005 * b2.speed + b2.phase) * 0.5;
                const d2 = b2.radius;
                const p2 = { x: cx + d2 * Math.cos(a2), y: cy + d2 * Math.sin(a2) };
                
                const bridge = [p1, p2];
                bridge._color = colors[(i + 3) % colors.length];
                strokes.push(bridge);
            }
        }
        
        return strokes;
    },

    // ============ 极坐标花纹 ============
    // 基于极坐标公式的高精度数学花纹

    polarPattern(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const formulaIdx = Math.floor(Math.random() * 5);
        const density = StateManager.state.density || 0.5;
        
        // 极坐标公式的参数
        const params = {
            a: 0.5 + Math.random() * 2,
            b: 0.5 + Math.random() * 2,
            c: 0.1 + Math.random() * 0.5,
            d: 0.1 + Math.random() * 0.5,
            n: 2 + Math.floor(Math.random() * 8),
            m: 2 + Math.floor(Math.random() * 6)
        };
        
        const formulas = [
            // 玫瑰曲线 r = a * cos(k*theta)
            (theta) => params.a * maxR * Math.cos(params.n * theta) + maxR * 0.3,
            // 螺旋变化 r = a + b*theta + c*sin(d*theta)
            (theta) => params.a * maxR * 0.2 + params.b * maxR * 0.01 * theta + params.c * maxR * Math.sin(params.d * theta * 10),
            // 蝴蝶曲线
            (theta) => maxR * (Math.sin(theta * params.n) * Math.cos(theta * params.m) + 0.5) * 0.5,
            // 心形变化
            (theta) => maxR * (1 + Math.cos(theta)) * (0.2 + params.a * 0.1 * Math.sin(theta * params.n)),
            // 随机多项式
            (theta) => maxR * (0.3 + 0.7 * Math.abs(Math.sin(theta * params.n + params.a) * Math.cos(theta * params.m + params.b) + Math.sin(theta * params.c * 10)))
        ];
        
        const formula = formulas[formulaIdx];
        const pointCount = 60 + Math.floor(density * 60);
        
        // 主曲线
        const mainPoints = [];
        for (let i = 0; i <= pointCount; i++) {
            const t = i / pointCount;
            const theta = t * 2 * Math.PI * 2;
            const r = formula(theta);
            
            if (r > 0 && r < maxR) {
                mainPoints.push({
                    x: cx + r * Math.cos(theta),
                    y: cy + r * Math.sin(theta)
                });
            }
        }
        
        if (mainPoints.length > 5) {
            mainPoints._color = colors[0];
            strokes.push(mainPoints);
        }
        
        // 衍生曲线（偏移角度）
        if (density > 0.3) {
            const extraCurves = 1 + Math.floor(density * 3);
            for (let e = 0; e < extraCurves; e++) {
                const offset = (e + 1) * (Math.PI / (extraCurves + 1));
                const points = [];
                for (let i = 0; i <= pointCount; i++) {
                    const t = i / pointCount;
                    const theta = t * 2 * Math.PI * 2 + offset;
                    const r = formula(theta) * (0.7 + Math.random() * 0.3);
                    
                    if (r > 0 && r < maxR) {
                        points.push({
                            x: cx + r * Math.cos(theta),
                            y: cy + r * Math.sin(theta)
                        });
                    }
                }
                if (points.length > 5) {
                    points._color = colors[(e + 1) % colors.length];
                    strokes.push(points);
                }
            }
        }
        
        // 保存生成器配置
        StateManager.setState({
            activeGeneratorName: 'polarPattern',
            generatorConfig: { formulaIdx: formulaIdx, params: { ...params }, density: density }
        });
        
        return strokes;
    },

    // ============ 星空星云 ============

    nebulaCloud(cx, cy, maxR, count, colors, config, palette) {
        const strokes = [];
        const seed = StateManager.state.noiseSeed || Math.floor(Math.random() * 100000);
        NoiseGenerator.init(seed);
        
        const scale = 0.003 + Math.random() * 0.005;
        const density = Math.max(0.3, StateManager.state.density || 0.5); // 确保最小密度
        const numPoints = Math.floor(1200 * density); // 增加点数
        
        let dotsAdded = 0;
        // 生成散点模拟星云
        for (let i = 0; i < numPoints; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const r = Math.sqrt(Math.random()) * maxR; // sqrt 使点更集中中心
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            
            // 用噪声决定星星亮度
            const noiseVal = NoiseGenerator.fbm(x * scale, y * scale, 3);
            const brightness = Math.max(0.1, (noiseVal + 1) * 0.5);
            
            // 降低阈值确保有内容，并强制至少加一些点
            const threshold = -0.5 + (1 - density) * 0.2;
            if (noiseVal > threshold || i < 50) { // 前50个点强制添加
                const size = 0.5 + brightness * 2 + Math.random() * 0.5;
                const colorIdx = Math.floor(Math.abs(noiseVal) * colors.length) % colors.length;
                
                // 用两点表示小点
                const dot = [
                    { x: x - size * 0.5, y: y },
                    { x: x + size * 0.5, y: y }
                ];
                dot._color = colors[colorIdx];
                dot._opacity = 0.3 + brightness * 0.7;
                strokes.push(dot);
                dotsAdded++;
            }
        }
        
        // 少数亮星星（带十字光晕）
        const starCount = Math.floor(5 + density * 10);
        for (let i = 0; i < starCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const r = Math.random() * maxR * 0.8;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            const size = 1 + Math.random() * 3;
            
            // 十字光晕
            const glow = [];
            const glowLen = size * 3;
            glow.push(
                { x: x - glowLen, y: y },
                { x: x + glowLen, y: y },
                { x: x, y: y - glowLen },
                { x: x, y: y + glowLen }
            );
            glow._color = '#ffffff';
            strokes.push(glow);
        }
        
        return strokes;
    }
};