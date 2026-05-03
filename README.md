# 🌀 Rotatepattern - 旋转万花筒绘图工具

一个基于 Canvas 的创意万花筒绘图应用，支持多种对称模式、粒子特效、音乐生成与丰富的交互控制。

## ✨ 功能特性

### 绘图核心
- **三种对称模式**：旋转对称、镜像对称、螺旋对称
- **对称数可调**：2-24 路对称，实时切换
- **四种画笔类型**：实线、虚线、点线、喷枪
- **发光效果**：可调颜色与模糊强度
- **渐变画笔**：双色渐变绘制
- **彩虹模式**：色相自动流转
- **11 种混合模式**：正常、正片叠底、滤色、叠加、柔光、强光等
- **拖尾/淡出模式**：画布内容渐隐效果

### 动画系统
- **5 种动画模式**：呼吸、色彩流、自转、漂移、脉冲
- **预设动画**：呼吸、漂浮、漩涡、迷幻、随机
- **可调参数**：缩放、颜色、漂移、旋转速度与幅度

### 视觉增强
- **10 种配色色板**：极光炫彩、熔岩烈焰、深海幽蓝、彩虹糖果、星夜璀璨、霓虹赛博等
- **6 种粒子特效**：火花、星光、彩虹粒、蝴蝶、泡泡、雪花
- **5 种画笔预设**：霓虹、赛博、自然、火焰、彩虹
- **随机配置生成**：一键生成随机万花筒图案

### 音频系统
- **绘图音**：8 种音乐主题（极光、赛博、森林、梦境、古风、太空、爵士、海洋）
- **内置背景音乐**：12 首免费可商用音乐，本地优先播放
- **在线音乐**：支持随机/顺序/单曲循环播放模式
- **14 种音效**：细雨、海浪、风声、水滴、风铃、泡泡等
- **滴答音效**：旋转扇区切换时的节奏反馈
- **节拍同步**：旋转速度与 BPM 联动

### 导出与保存
- **多格式导出**：PNG、JPG、SVG
- **项目文件**：保存/加载完整项目配置（JSON）
- **截图画廊**：截图收藏与浏览
- **分享链接**：生成作品分享页

### 移动端 & PWA
- **响应式设计**：适配桌面端与移动端
- **PWA 支持**：可添加到主屏幕，离线可用基础功能
- **二维码访问**：局域网内手机扫码即可使用
- **触摸绘制**：完整触摸手势支持

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 增加/减少对称数 |
| `←` / `→` | 减小/增大旋转速度 |
| `Space` | 暂停/恢复自动旋转 |
| `C` | 清空画布 |
| `T` | 切换拖尾模式 |
| `M` | 切换背景音乐 |
| `R` | 随机生成 |
| `G` | 切换发光效果 |
| `F` | 全屏模式 |
| `1-4` | 切换画笔类型 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` | 重做 |
| `S` | 导出 PNG |
| `A` | 启动/停止动画 |

## 🚀 快速开始

### 环境要求
- Node.js 14+

### 一键启动
```bash
chmod +x start.sh
./start.sh
```

脚本会自动安装 Node.js（如未安装）、安装依赖并启动服务。

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

### 移动端访问
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
│   ├── audio-engine.js        # 音频引擎（绘图音/背景音乐/音效）
│   ├── canvas-renderer.js     # Canvas 渲染器
│   ├── state-manager.js       # 状态管理
│   ├── input-handler.js       # 输入处理
│   ├── keyboard-handler.js    # 快捷键处理
│   ├── ui-controller.js       # UI 控制器
│   ├── particle-system.js     # 粒子系统
│   ├── animation-controller.js# 动画控制器
│   ├── fullscreen-controller.js# 全屏控制器
│   ├── random-generator.js    # 随机图案生成器
│   ├── advanced-generators.js # 高级生成器
│   ├── noise-generator.js     # 噪声生成器
│   └── color-palette.js       # 色板管理
├── utils/                     # 工具库
│   ├── math-utils.js          # 数学工具
│   ├── storage-utils.js       # 安全存储
│   ├── object-pool.js         # 对象池
│   ├── canvas-cache.js        # 画布缓存
│   └── error-handler.js       # 错误处理
├── scripts/                   # 脚本
│   ├── download-music.js      # 音乐下载脚本
│   └── generate-icons.js      # 图标生成脚本
├── public/                    # 静态资源
│   ├── icons/                 # 应用图标（SVG）
│   ├── music/                 # 本地音乐（MP3，自动下载）
│   ├── manifest.json          # PWA 清单
│   └── service-worker.js      # Service Worker
└── server-data/               # 服务端数据（运行时生成）
    ├── projects/              # 保存的项目文件
    └── gallery/               # 画廊截图
```

## 🔌 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/status` | 服务器状态 |
| GET | `/api/qrcode` | 移动端访问二维码页面 |
| POST | `/api/project/save` | 保存项目 |
| GET | `/api/project/list` | 项目列表 |
| GET | `/api/project/download/:filename` | 下载项目 |
| DELETE | `/api/project/:filename` | 删除项目 |
| POST | `/api/gallery/save` | 保存截图 |
| GET | `/api/gallery/list` | 截图列表 |
| DELETE | `/api/gallery/:filename` | 删除截图 |
| GET | `/api/online-music/list` | 随机在线音乐 |
| GET | `/api/online-music/playlist` | 音乐播放列表 |
| GET | `/api/online-music/stream` | 音频流代理 |
| GET | `/api/sound-effects/list` | 音效列表（14种） |
| GET | `/api/beat/sync` | 节拍同步参数 |
| POST | `/api/share` | 生成分享链接 |

## 🛠 技术栈

- **前端**：原生 HTML5 Canvas + JavaScript（无框架依赖）
- **后端**：Node.js + Express
- **安全**：Helmet（CSP/HSTS/XSS防护）、路径遍历防护、安全文件名校验
- **性能**：对象池、画布缓存、requestAnimationFrame
- **音频**：Web Audio API 合成 + 本地 MP3 播放
- **PWA**：Service Worker + Web App Manifest

## 📄 许可证

MIT License

## 🙏 致谢

- 背景音乐来源：[SoundHelix](https://www.soundhelix.com/)（免费可商用）
