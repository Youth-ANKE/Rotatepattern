# 🌀 Rotatepattern - 旋转万花筒 & AI 创意绘图工具

一个基于 Canvas 的创意万花筒绘图应用，支持 AI 智能生成、多种对称模式、粒子特效、音乐生成与丰富的交互控制。

![Version](https://img.shields.io/badge/version-3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-ready-orange)

## ✨ 核心功能

### 🤖 AI 智能生成
- **DeepSeek API 集成**：AI 根据艺术美学原理生成独特配色
- **直接生成颜色值**：突破预设限制，创作无限可能
- **智能容错机制**：多格式 JSON 解析，颜色自动验证修复
- **配色保留**：AI 失败时可保留上次配色继续创作
- **一键 AI 随机**：按 `R` 键启用 AI 生成模式

### 🎨 绘图核心
- **三种对称模式**：旋转对称、镜像对称、螺旋对称、交错镜像
- **对称数可调**：2-24 路对称，实时切换
- **18+ 种图案生成器**：曼陀罗、伊斯兰几何、黄金螺旋、分形树、玫瑰曲线等
- **四种画笔类型**：实线、虚线、点线、喷枪、缎带
- **发光效果**：可调颜色与模糊强度
- **渐变画笔**：双色渐变绘制
- **彩虹模式**：色相自动流转
- **11 种混合模式**：正常、正片叠底、滤色、叠加、柔光等

### 🎬 动画系统
- **5 种动画模式**：呼吸、色彩流、自转、漂移、脉冲、迷幻
- **预设动画**：呼吸、漂浮、漩涡、迷幻、随机
- **背景动画**：星云、极光、星空、渐变切换
- **可调参数**：缩放、颜色、漂移、旋转速度与幅度

### ✨ 视觉增强
- **45+ 套高端配色**：梵高星夜、霓虹赛博、极光之巅、鎏金岁月等
- **6 种粒子特效**：火花、星光、彩虹粒、蝴蝶、泡泡、雪花
- **随机配置生成**：一键生成随机万花筒图案
- **15 套大师预设组合**：精心调配的惊艳组合

### 🎵 音频系统
- **绘图音**：8 种音乐主题（极光、赛博、森林、梦境等）
- **内置背景音乐**：12 首免费可商用音乐
- **14 种音效**：细雨、海浪、风声、水滴、风铃、泡泡等
- **节拍同步**：旋转速度与 BPM 联动

### 🔬 高级功能
- **遗传算法**：自动进化优化图案配置
- **图像风格迁移**：将图片风格应用到图案
- **音乐图案生成**：根据音乐节奏生成图案

### 📤 导出与保存
- **多格式导出**：PNG、JPG、SVG、WebM 视频
- **项目文件**：保存/加载完整项目配置（JSON）
- **截图画廊**：截图收藏与浏览
- **分享链接**：生成作品分享页

### 📱 移动端 & PWA
- **响应式设计**：适配桌面端与移动端
- **PWA 支持**：可添加到主屏幕，离线可用
- **二维码访问**：局域网内手机扫码即可使用
- **触摸绘制**：完整触摸手势支持

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 增加/减少对称数 |
| `←` / `→` | 减小/增大旋转速度 |
| `Space` | 暂停/恢复自动旋转 |
| `C` | 清空画布 |
| `T` | 切换拖尾模式 |
| `M` | 切换背景音乐 |
| `R` | AI 智能随机生成 |
| `G` | 切换发光效果 |
| `F` | 全屏模式 |
| `1-5` | 切换画笔类型 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` | 重做 |
| `S` | 导出 PNG |
| `A` | 启动/停止动画 |
| `P` | 粒子系统开关 |

## 🚀 快速开始

### 环境要求
- Node.js 14+

### 一键启动
```bash
chmod +x start.sh
./start.sh
```

### 手动启动
```bash
# 安装依赖
npm install

# 启动服务
npm start

# 自定义端口
node server.js --port=8080
```

启动后访问 `http://localhost:3000` 即可使用。

### 🤖 AI 功能配置
1. 点击工具栏中的 AI 设置按钮
2. 输入你的 DeepSeek API Key
3. 选择模型（V4 Flash 快速 / V4 Pro 高质量）
4. 点击保存并测试
5. 启用 AI 随机模式，享受 AI 创作的无限可能

> 💡 API Key 仅存储在浏览器本地 localStorage，不会上传到服务器

### 📱 移动端访问
1. 确保手机与电脑在同一 WiFi 网络
2. 启动服务后，访问 `http://localhost:3000/api/qrcode` 获取二维码
3. 手机扫码或手动输入局域网地址

## 📁 项目结构

```
├── index.html                 # 主页面
├── main.js                    # 应用入口
├── server.js                  # Express 后端服务
├── styles.css                 # 样式表
├── start.sh                   # 一键启动脚本
├── package.json               # 项目配置
├── modules/                   # 前端模块
│   ├── ai-config.js          # AI 配置管理
│   ├── ai-service.js         # DeepSeek API 服务
│   ├── ai-smart-generator.js # AI 智能生成器
│   ├── ai-template-generator.js # AI 模板生成
│   ├── animation-controller.js# 动画控制器
│   ├── audio-engine.js       # 音频引擎
│   ├── background-animation.js# 背景动画
│   ├── canvas-renderer.js    # Canvas 渲染器
│   ├── color-palette.js      # 色板管理
│   ├── creative-extensions.js # 创意扩展
│   ├── export-manager.js      # 导出管理
│   ├── fractal-generator.js  # 分形生成器
│   ├── fullscreen-controller.js# 全屏控制器
│   ├── game-system.js        # 游戏系统
│   ├── genetic-algorithm.js  # 遗传算法
│   ├── image-style-transfer.js# 图像风格迁移
│   ├── input-handler.js      # 输入处理
│   ├── keyboard-handler.js   # 快捷键处理
│   ├── music-pattern-generator.js# 音乐图案生成
│   ├── noise-generator.js     # 噪声生成器
│   ├── particle-physics.js   # 粒子物理
│   ├── particle-system.js     # 粒子系统
│   ├── random-generator.js   # 随机图案生成器（核心）
│   ├── state-manager.js       # 状态管理
│   └── ui-controller.js       # UI 控制器
├── utils/                     # 工具库
│   ├── canvas-cache.js       # 画布缓存
│   ├── error-handler.js      # 错误处理
│   ├── math-utils.js         # 数学工具
│   ├── object-pool.js        # 对象池
│   └── storage-utils.js      # 安全存储
├── scripts/                   # 脚本
│   ├── download-music.js     # 音乐下载
│   └── generate-icons.js     # 图标生成
├── public/                    # 静态资源
│   ├── icons/                # 应用图标
│   ├── music/                # 本地音乐
│   ├── manifest.json         # PWA 清单
│   └── service-worker.js     # Service Worker
└── server-data/              # 服务端数据
    ├── projects/             # 保存的项目
    └── gallery/              # 画廊截图
```

## 🔌 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/status` | 服务器状态 |
| GET | `/api/qrcode` | 移动端二维码 |
| POST | `/api/project/save` | 保存项目 |
| GET | `/api/project/list` | 项目列表 |
| POST | `/api/gallery/save` | 保存截图 |
| GET | `/api/gallery/list` | 截图列表 |
| GET | `/api/online-music/list` | 在线音乐 |
| GET | `/api/online-music/stream` | 音频流代理 |
| GET | `/api/sound-effects/list` | 音效列表 |
| POST | `/api/share` | 生成分享链接 |

## 🛠 技术栈

- **前端**：原生 HTML5 Canvas + JavaScript（零框架依赖）
- **后端**：Node.js + Express
- **AI**：DeepSeek API（用户自配 API Key）
- **安全**：Helmet（CSP/HSTS/XSS防护）、路径遍历防护
- **性能**：对象池、画布缓存、requestAnimationFrame
- **音频**：Web Audio API + 本地 MP3
- **PWA**：Service Worker + Web App Manifest

## 📄 许可证

MIT License

## 🙏 致谢

- 背景音乐来源：[SoundHelix](https://www.soundhelix.com/)（免费可商用）
- AI 能力由 [DeepSeek](https://deepseek.com/) 提供
