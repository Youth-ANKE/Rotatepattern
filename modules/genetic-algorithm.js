/**
 * 遗传算法进化系统 - Genetic Algorithm Evolution
 * 基于用户选择进化的图案生成
 */

class GeneticAlgorithm {
    constructor() {
        this.populationSize = 8;
        this.mutationRate = 0.15;
        this.crossoverRate = 0.7;

        // 基因类型
        this.geneTypes = {
            structure: ['mandala', 'spiral', 'geometric', 'flower', 'star', 'organic', 'fractal', 'wave'],
            color: ['vibrant', 'pastel', 'neon', 'earth', 'ocean', 'sunset', 'aurora', 'cosmic'],
            animation: ['none', 'pulse', 'wave', 'spin', 'breathe', 'drift', 'orbit'],
            symmetry: [4, 6, 8, 12, 16, 24],
            brush: ['default', 'calligraphy', 'spray', 'marker', 'neon', 'rainbow']
        };

        // 当前种群
        this.population = [];
        this.generation = 0;
        this.history = [];
    }

    /**
     * 初始化种群
     */
    initialize() {
        this.population = [];
        this.generation = 0;
        this.history = [];

        for (let i = 0; i < this.populationSize; i++) {
            this.population.push(this.randomChromosome());
        }

        this.history.push([...this.population]);
        console.log('[Genetic] Initialized population:', this.populationSize);
        return this.population;
    }

    /**
     * 创建随机染色体（基因组合）
     */
    randomChromosome() {
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        return {
            id: Date.now() + Math.random(),
            structure: pick(this.geneTypes.structure),
            color: pick(this.geneTypes.color),
            animation: pick(this.geneTypes.animation),
            symmetry: pick(this.geneTypes.symmetry),
            brush: pick(this.geneTypes.brush),
            brightness: 0.5 + Math.random() * 0.5,
            saturation: 0.5 + Math.random() * 0.5,
            complexity: 0.3 + Math.random() * 0.7
        };
    }

    /**
     * 交叉两个染色体
     */
    crossover(parent1, parent2) {
        const child = {};

        // 随机选择每个基因来自哪个父母
        for (const gene in parent1) {
            if (gene === 'id') continue;

            if (Math.random() < this.crossoverRate) {
                // 混合父母基因
                if (Math.random() < 0.5) {
                    child[gene] = parent1[gene];
                } else {
                    child[gene] = parent2[gene];
                }
            } else {
                // 随机变异
                child[gene] = this.mutateGene(gene, parent1[gene]);
            }
        }

        child.id = Date.now() + Math.random();
        return child;
    }

    /**
     * 变异基因
     */
    mutateGene(geneName, value) {
        if (Math.random() > this.mutationRate) {
            return value; // 不变异
        }

        const types = this.geneTypes;
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        switch (geneName) {
            case 'structure':
            case 'color':
            case 'animation':
            case 'brush':
                return pick(types[geneName]);
            case 'symmetry':
                return pick(types.symmetry);
            case 'brightness':
            case 'saturation':
            case 'complexity':
                // 微调数值
                const delta = (Math.random() - 0.5) * 0.3;
                return Math.max(0, Math.min(1, value + delta));
            default:
                return value;
        }
    }

    /**
     * 进化一代
     */
    evolve(selectedIndices) {
        if (selectedIndices.length < 2) {
            console.warn('[Genetic] Need at least 2 parents');
            return this.population;
        }

        this.generation++;

        // 获取选中父母
        const parents = selectedIndices.map(i => this.population[i]);

        // 生成新一代
        const newPopulation = [];

        // 精英保留：保留最好的几个
        const eliteCount = Math.min(2, Math.floor(this.populationSize * 0.2));
        for (let i = 0; i < eliteCount; i++) {
            newPopulation.push({ ...parents[i % parents.length] });
        }

        // 生成剩余个体
        while (newPopulation.length < this.populationSize) {
            // 随机选择两个父母
            const p1 = parents[Math.floor(Math.random() * parents.length)];
            const p2 = parents[Math.floor(Math.random() * parents.length)];

            // 交叉
            const child = this.crossover(p1, p2);

            // 可能再次变异
            if (Math.random() < this.mutationRate) {
                for (const gene in child) {
                    child[gene] = this.mutateGene(gene, child[gene]);
                }
            }

            newPopulation.push(child);
        }

        this.population = newPopulation;
        this.history.push([...this.population]);

        console.log(`[Genetic] Generation ${this.generation} created`);
        return this.population;
    }

    /**
     * 将染色体应用到状态
     */
    applyChromosome(chromosome) {
        const state = window.StateManager?.state;
        if (!state) return false;

        const config = {
            symmetryCount: chromosome.symmetry,
            animationMode: chromosome.animation,
            brushType: chromosome.brush,
            paletteIndex: this.colorToPalette(chromosome.color),
            glowMode: chromosome.brightness > 0.7,
            trailMode: chromosome.complexity > 0.5,
            particleEnabled: chromosome.complexity > 0.6
        };

        if (window.StateManager) {
            window.StateManager.setState(config);
        }

        // 设置图案生成器
        if (window.RandomGenerator) {
            window.RandomGenerator.setPatternGenerator(chromosome.structure);
        }

        return true;
    }

    /**
     * 颜色名称转调色板索引
     */
    colorToPalette(colorName) {
        const paletteMap = {
            vibrant: 0,
            pastel: 1,
            neon: 2,
            earth: 3,
            ocean: 4,
            sunset: 5,
            aurora: 6,
            cosmic: 7
        };
        return paletteMap[colorName] || 0;
    }

    /**
     * 生成种群预览
     */
    generatePreviews(width = 150, height = 150) {
        const previews = [];

        for (const chromosome of this.population) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // 使用随机生成器绘制预览
            this.drawChromosomePreview(ctx, chromosome, width, height);

            previews.push({
                id: chromosome.id,
                chromosome,
                dataUrl: canvas.toDataURL()
            });
        }

        return previews;
    }

    /**
     * 绘制染色体预览
     */
    drawChromosomePreview(ctx, chromosome, width, height) {
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.min(width, height) * 0.4;

        // 背景
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);

        // 根据结构绘制
        ctx.save();
        ctx.translate(cx, cy);

        const hue = this.getColorHue(chromosome.color);
        const saturation = chromosome.saturation * 100;
        const brightness = chromosome.brightness * 70 + 30;

        switch (chromosome.structure) {
            case 'mandala':
                this.drawMandalaPreview(ctx, maxRadius, chromosome.symmetry, hue, saturation, brightness);
                break;
            case 'spiral':
                this.drawSpiralPreview(ctx, maxRadius, hue, saturation, brightness);
                break;
            case 'geometric':
                this.drawGeometricPreview(ctx, maxRadius, chromosome.symmetry, hue, saturation, brightness);
                break;
            case 'flower':
                this.drawFlowerPreview(ctx, maxRadius, chromosome.symmetry, hue, saturation, brightness);
                break;
            case 'star':
                this.drawStarPreview(ctx, maxRadius, chromosome.symmetry, hue, saturation, brightness);
                break;
            case 'organic':
                this.drawOrganicPreview(ctx, maxRadius, hue, saturation, brightness);
                break;
            case 'fractal':
                this.drawFractalPreview(ctx, maxRadius, hue, saturation, brightness);
                break;
            case 'wave':
                this.drawWavePreview(ctx, maxRadius, hue, saturation, brightness);
                break;
            default:
                this.drawMandalaPreview(ctx, maxRadius, 8, hue, saturation, brightness);
        }

        ctx.restore();
    }

    getColorHue(colorName) {
        const hueMap = {
            vibrant: 0,
            pastel: 300,
            neon: 180,
            earth: 30,
            ocean: 210,
            sunset: 30,
            aurora: 150,
            cosmic: 270
        };
        return hueMap[colorName] || Math.random() * 360;
    }

    drawMandalaPreview(ctx, radius, symmetry, hue, sat, bri) {
        const layers = 5;
        for (let l = 0; l < layers; l++) {
            const layerRadius = radius * (1 - l / layers);
            const alpha = 1 - l / layers * 0.5;

            ctx.beginPath();
            for (let i = 0; i <= symmetry; i++) {
                const angle = (i / symmetry) * Math.PI * 2;
                const x = Math.cos(angle) * layerRadius;
                const y = Math.sin(angle) * layerRadius;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            ctx.fillStyle = `hsla(${hue + l * 20}, ${sat}%, ${bri}%, ${alpha * 0.5})`;
            ctx.strokeStyle = `hsla(${hue + l * 20}, ${sat}%, ${bri + 10}%, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();
        }
    }

    drawSpiralPreview(ctx, radius, hue, sat, bri) {
        ctx.beginPath();
        for (let t = 0; t < Math.PI * 6; t += 0.1) {
            const r = radius * t / (Math.PI * 6);
            const x = Math.cos(t) * r;
            const y = Math.sin(t) * r;

            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${bri}%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawGeometricPreview(ctx, radius, symmetry, hue, sat, bri) {
        const angleStep = (Math.PI * 2) / symmetry;

        for (let i = 0; i < symmetry; i++) {
            const angle = i * angleStep;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            ctx.lineTo(Math.cos(angle + angleStep / 2) * radius * 0.5,
                       Math.sin(angle + angleStep / 2) * radius * 0.5);
            ctx.closePath();

            ctx.fillStyle = `hsla(${hue + i * 10}, ${sat}%, ${bri}%, 0.5)`;
            ctx.fill();
        }
    }

    drawFlowerPreview(ctx, radius, petals, hue, sat, bri) {
        for (let p = 0; p < petals; p++) {
            const angle = (p / petals) * Math.PI * 2;

            ctx.beginPath();
            for (let t = 0; t < Math.PI * 2; t += 0.1) {
                const r = radius * (0.3 + 0.7 * Math.abs(Math.cos(t * petals / 2)));
                const x = Math.cos(angle + t) * r;
                const y = Math.sin(angle + t) * r;

                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `hsla(${hue + p * 20}, ${sat}%, ${bri}%, 0.7)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    drawStarPreview(ctx, radius, points, hue, sat, bri) {
        ctx.beginPath();
        for (let i = 0; i <= points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? radius : radius * 0.4;

            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${bri}%, 0.6)`;
        ctx.fill();
        ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${bri + 20}%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawOrganicPreview(ctx, radius, hue, sat, bri) {
        ctx.beginPath();
        for (let t = 0; t < Math.PI * 2; t += 0.05) {
            const r = radius * (0.5 + 0.3 * Math.sin(t * 3) + 0.2 * Math.sin(t * 7));
            const x = Math.cos(t) * r;
            const y = Math.sin(t) * r;

            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${bri}%, 0.4)`;
        ctx.fill();
        ctx.strokeStyle = `hsl(${hue}, ${sat}%, ${bri + 10}%)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawFractalPreview(ctx, radius, hue, sat, bri) {
        const drawBranch = (x, y, len, angle, depth) => {
            if (depth === 0 || len < 2) return;

            const x2 = x + Math.cos(angle) * len;
            const y2 = y + Math.sin(angle) * len;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${bri}%, ${depth / 8})`;
            ctx.lineWidth = depth / 2;
            ctx.stroke();

            drawBranch(x2, y2, len * 0.7, angle - 0.5, depth - 1);
            drawBranch(x2, y2, len * 0.7, angle + 0.5, depth - 1);
        };

        drawBranch(0, radius * 0.8, radius * 0.4, -Math.PI / 2, 8);
    }

    drawWavePreview(ctx, radius, hue, sat, bri) {
        for (let w = 0; w < 5; w++) {
            ctx.beginPath();
            for (let x = -radius; x <= radius; x += 2) {
                const y = Math.sin(x / radius * Math.PI * 2) * radius * 0.2 * (w + 1);

                if (x === -radius) ctx.moveTo(x, y + w * radius * 0.15);
                else ctx.lineTo(x, y + w * radius * 0.15);
            }
            ctx.strokeStyle = `hsla(${hue + w * 15}, ${sat}%, ${bri}%, 0.8 - w * 0.1)`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    /**
     * 获取当前种群信息
     */
    getPopulationInfo() {
        return {
            generation: this.generation,
            populationSize: this.population.length,
            chromosomes: this.population.map(c => ({
                id: c.id,
                structure: c.structure,
                color: c.color,
                symmetry: c.symmetry
            }))
        };
    }

    /**
     * 重置进化
     */
    reset() {
        this.population = [];
        this.generation = 0;
        this.history = [];
    }
}

// 导出
window.GeneticAlgorithm = GeneticAlgorithm;
