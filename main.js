/**
 * 旋转万花筒绘图工具 - 主入口
 *
 * 核心优化升级：
 * - 撤销/重做历史系统 (Ctrl+Z/Y)
 * - 4种画笔类型（实线/虚线/点线/喷枪）
 * - 发光效果、渐变画笔、彩虹模式
 * - 螺旋对称模式
 * - 粒子特效系统（4种粒子类型）
 * - 绘图互动音乐生成（4种音乐主题：极光/赛博/森林/梦境）
 * - 随机配置生成器
 * - 保存/导出（PNG、JPG、SVG、项目文件）
 * - 截图画廊
 * - 快捷键系统
 * 
 * v2.0 新增优化：
 * - 安全中间件与CSP保护
 * - 安全存储工具
 * - 对象池与渲染缓存
 * - 全局错误处理
 * - 状态管理增强
 */
(function () {
  'use strict';

  // 初始化错误处理器
  if (typeof ErrorHandler !== 'undefined') {
    ErrorHandler.init();
  }

    // 配置
    const CONFIG = {
        canvasId: 'kaleidoscope-canvas',
        fps: 60
    };

    // 背景动画类型映射
    const BG_ANIMATION_MAP = {
        none: null,
        aurora: 'aurora',
        gradientShift: 'gradientShift',
        starField: 'starField',
        nebula: 'nebula'
    };

    // 动画循环控制
    let animationId = null;
    let autoRotate = true;
    let lastFrameTime = 0;
    let tickLastAngle = 0;
    // 保存事件监听器引用，以便正确移除
    const _onBeforeUnload = () => destroy();
    const _onVisibilityChange = () => {
        if (!document.hidden && !animationId) {
            startAnimation();
        }
    };

    /**
     * 销毁应用（释放所有资源和事件监听）
     */
    function destroy() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (typeof AnimationController !== 'undefined') {
            AnimationController.setEnabled(false);
        }
        // 清理背景动画
        if (typeof BackgroundAnimation !== 'undefined') {
            BackgroundAnimation.destroy();
        }
        // 清理各模块
        CanvasRenderer.destroy();
        StateManager.destroy();
        if (typeof InputHandler !== 'undefined' && typeof InputHandler.destroy === 'function') {
            InputHandler.destroy();
        }
        if (typeof ParticleSystem.destroy === 'function') {
            ParticleSystem.destroy();
        }
        window.removeEventListener('beforeunload', _onBeforeUnload);
        document.removeEventListener('visibilitychange', _onVisibilityChange);
    }

    /**
     * 初始化应用
     */
    function init() {
        // 初始化状态管理器（必须先于其他模块）
        StateManager.init();
        
        // 初始化动画控制器
        if (typeof AnimationController !== 'undefined') {
            AnimationController.init();
        }
        
        // 初始化背景动画系统
        if (typeof BackgroundAnimation !== 'undefined') {
            BackgroundAnimation.init();
        }
        
        // 初始化各个模块
        CanvasRenderer.init(CONFIG.canvasId);
        InputHandler.init(CONFIG.canvasId);
        UIController.init();
        ParticleSystem.init();
        KeyboardHandler.init();
        FullscreenController.init();

        // 保存初始状态快照
        StateManager.pushStateSnapshot();

        // 开始动画循环
        startAnimation();

        // 窗口焦点恢复时继续动画
        document.addEventListener('visibilitychange', _onVisibilityChange);

        // 页面关闭时销毁
        window.addEventListener('beforeunload', _onBeforeUnload);

        // 显示欢迎提示
        setTimeout(() => {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = '🎨 开始创作！提示：按 C 清空画布，按 R 随机生成';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }
        }, 500);
    }

    /**
     * 开始动画循环
     */
    function startAnimation() {
        lastFrameTime = performance.now();
        function animate(time) {
            const delta = Math.min(time - lastFrameTime, 100); // 限制最大步长
            lastFrameTime = time;

            // 更新旋转
            updateRotation(delta);

            // 更新动画系统（呼吸/色彩变换/漂移/脉冲）
            updateAnimation(delta);

            // 更新高级动画控制器（由主循环统一驱动，避免双重渲染）
            if (typeof AnimationController !== 'undefined' && AnimationController.enabled) {
                AnimationController.update();
            }

            // 更新粒子
            ParticleSystem.update();

            // 绘制到画布
            CanvasRenderer.render();

            // 继续下一帧
            animationId = requestAnimationFrame(animate);
        }
        animationId = requestAnimationFrame(animate);
    }

    /**
     * 更新动态演化动画
     * 支持：breathing（呼吸）, colorShift（色彩变换）, rotate（自动旋转）, drift（漂移）, pulse（脉冲）
     * @param {number} delta - 距离上一帧的毫秒数
     */
    function updateAnimation(delta) {
        const { animationMode, animationSpeed, animationPhase } = StateManager.state;
        if (animationMode === 'none') return;

        const speed = animationSpeed * 0.001; // 速度归一化
        const increment = delta * speed * 0.05;
        const newPhase = animationPhase + increment;

        StateManager.setState({ animationPhase: newPhase });

        switch (animationMode) {
            case 'breathing': {
                // 呼吸效果：通过脉冲改变 strokeWidth 和 glowBlur
                const breath = 0.6 + 0.4 * Math.sin(newPhase * 2);
                const baseWidth = StateManager.state.strokeWidth;
                // 动态宽度由 renderer 处理，这里只传递相位
                break;
            }
            case 'colorShift': {
                // 色彩变换：让 rainbowHue 随时间流动
                const hueShift = (newPhase * 60) % 360;
                StateManager.setState({
                    rainbowMode: true,
                    rainbowHue: hueShift
                });
                break;
            }
            case 'rotate': {
                // 自动旋转：持续增加旋转角度（覆盖 autoRotate）
                const { rotationSpeed } = StateManager.state;
                const speed2 = (rotationSpeed / 100) * 4;
                const angleIncrement = (speed2 * delta) / 1000;
                let newRotation = StateManager.state.currentRotation + angleIncrement;
                if (newRotation > Math.PI * 2) newRotation -= Math.PI * 2;
                StateManager.setState({ currentRotation: newRotation });
                break;
            }
            case 'drift': {
                // 漂移效果：影响对称中心偏移（通过变换实现）
                // 该效果在 canvas-renderer 中处理
                break;
            }
            case 'pulse': {
                // 脉冲效果：发光强度和宽度周期性变化
                const pulse = 0.5 + 0.5 * Math.sin(newPhase * 3);
                StateManager.setState({
                    glowBlur: 5 + pulse * 25
                });
                break;
            }
        }
    }

    /**
     * 更新旋转角度并触发滴答声
     * @param {number} delta - 距离上一帧的毫秒数
     */
    function updateRotation(delta) {
        const { rotationSpeed, currentRotation } = StateManager.state;
        const autoRotateToggle = document.getElementById('auto-rotate-toggle');
        
        if (autoRotateToggle) {
            autoRotate = autoRotateToggle.classList.contains('active');
        }

        if (!autoRotate) return;

        // 速度：0-100 映射到 每秒 0-4 弧度
        const speed = (rotationSpeed / 100) * 4;
        const angleIncrement = (speed * delta) / 1000;
        
        let newRotation = currentRotation + angleIncrement;
        
        // 归一化到 0-2PI 避免溢出
        if (newRotation > Math.PI * 2) {
            newRotation -= Math.PI * 2;
        }

        StateManager.setState({ currentRotation: newRotation });
        
        // 滴答声检测：每次经过一个扇区边界时播放
        const sCount = StateManager.state.symmetryCount;
        const sectorAngle = (2 * Math.PI) / sCount;
        const lastSector = Math.floor(tickLastAngle / sectorAngle);
        const currentSector = Math.floor(newRotation / sectorAngle);
        if (currentSector !== lastSector) {
            AudioEngine.playTick();
        }
        tickLastAngle = newRotation;
    }

    // 更新API引用
    const app = {
        init,
        CONFIG,
        modules: {
            StateManager,
            CanvasRenderer,
            InputHandler,
            UIController,
            AudioEngine,
            ParticleSystem,
            KeyboardHandler,
            MathUtils,
            RandomGenerator,
            AnimationController
        }
    };

    // 暴露到全局，方便调试
    window.app = app;
    window.StateManager = StateManager;
    window.CanvasRenderer = CanvasRenderer;
    window.AudioEngine = AudioEngine;
    window.ParticleSystem = ParticleSystem;
    window.RandomGenerator = RandomGenerator;
    window.AnimationController = AnimationController;

    // DOM 加载完成后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();