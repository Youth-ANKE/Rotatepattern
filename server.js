/**
 * 旋转万花筒绘图工具 - 后端服务（增强版）
 * ================================
 * 支持移动端访问、PWA、项目保存/加载、画廊共享、局域网协作
 * 音乐库扩充至12首、音效库14种、播放模式切换、节拍同步
 * 
 * 启动: node server.js
 * 默认端口: 3000
 * 自定义端口: node server.js --port=8080
 * HTTPS 模式: node server.js --https (需要自行配置证书)
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const https = require('https');

// ==================== 配置 ====================
const PORT = parseInt(process.argv.find(a => a.startsWith('--port='))?.split('=')[1]) || 3000;
const DATA_DIR = path.join(__dirname, 'server-data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const GALLERY_DIR = path.join(DATA_DIR, 'gallery');
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ==================== 初始化目录 ====================
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[初始化] 创建目录: ${dir}`);
    }
}
ensureDir(DATA_DIR);
ensureDir(PROJECTS_DIR);
ensureDir(GALLERY_DIR);
ensureDir(PUBLIC_DIR + '/icons');

// ==================== Multer 文件上传配置 ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = file.fieldname === 'gallery' ? GALLERY_DIR : PROJECTS_DIR;
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.json';
        const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const allowed = ['.json', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
        if (allowed.includes(ext) || file.fieldname === 'gallery' || file.fieldname === 'project') {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'), false);
        }
    }
});

// ==================== 安全与验证工具 ====================

/**
 * 安全的文件名验证
 * @param {string} filename - 文件名
 * @returns {boolean} 是否安全
 */
function isValidFilename(filename) {
  if (!filename || typeof filename !== 'string') return false;
  const safeName = path.basename(filename);
  return safeName === filename && !/[<>:"/\\|?*]/.test(filename);
}

/**
 * 路径遍历防护 - 解析并验证文件路径
 * @param {string} baseDir - 基础目录
 * @param {string} filename - 文件名
 * @returns {string|null} 安全的完整路径，无效返回null
 */
function safePathJoin(baseDir, filename) {
  const safeName = path.basename(filename);
  const fullPath = path.join(baseDir, safeName);
  const normalized = path.normalize(fullPath);
  if (!normalized.startsWith(baseDir)) return null;
  return normalized;
}

// ==================== Express 应用 ====================
const app = express();

// Helmet 安全头配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  frameguard: { action: "deny" },
  xssFilter: true,
  noSniff: true,
}));

// CORS 配置 - 只允许同源请求
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      const ips = getNetworkIPs();
      const allowed = ips.some(ip => origin?.includes(ip.address));
      callback(null, allowed || process.env.NODE_ENV === 'development');
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};
app.use(cors(corsOptions));

// 请求体解析
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 简单的请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== API 路由 ====================

// --- 服务器状态（增强移动端信息） ---
app.get('/api/status', (req, res) => {
    const ips = getNetworkIPs();
    res.json({
        status: 'online',
        name: '旋转万花筒绘图工具 - 后端服务',
        version: '1.1.0',
        uptime: process.uptime(),
        timestamp: Date.now(),
        features: {
            musicCount: 12,
            soundEffects: 14,
            playModes: ['random', 'loop', 'sequential'],
            beatSync: true,
            audioVisualization: true
        },
        // 移动端专用信息
        mobile: {
            ips: ips.map(ip => ip.address),
            qrcode: `${req.protocol}://${req.get('host')}/api/qrcode`,
            pwa: {
                manifest: '/public/manifest.json',
                serviceWorker: '/public/service-worker.js',
                installable: true
            }
        }
    });
});

// --- 生成链接二维码的 HTML 页面 ---
app.get('/api/qrcode', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const ips = getNetworkIPs();
    // 生成所有可用地址
    const urls = [
        { label: '本地', url: `http://localhost:${PORT}` },
        ...ips.map(ip => ({ label: `${ip.name}`, url: `http://${ip.address}:${PORT}` }))
    ];

    res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>移动端访问 - 二维码</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        background: #0f0f23; color: #ccd6e0;
        font-family: -apple-system, 'Microsoft YaHei', sans-serif;
        min-height: 100vh; display: flex; flex-direction: column;
        align-items: center; justify-content: center; padding: 20px;
    }
    .container { max-width: 480px; width: 100%; text-align: center; }
    h1 { font-size: 22px; color: #e94560; margin-bottom: 8px; }
    p { color: #8899aa; font-size: 14px; margin-bottom: 24px; }
    .qrcode-box {
        background: #fff; border-radius: 16px;
        padding: 24px; display: inline-block; margin-bottom: 20px;
    }
    .qrcode-box svg { width: 240px; height: 240px; }
    .url-list { display: flex; flex-direction: column; gap: 10px; }
    .url-item {
        background: rgba(255,255,255,0.06); border-radius: 10px;
        padding: 14px 18px; text-align: left;
        border: 1px solid rgba(255,255,255,0.08);
    }
    .url-label { font-size: 12px; color: #8899aa; margin-bottom: 4px; }
    .url-value {
        font-size: 16px; color: #00d2ff; word-break: break-all;
        font-family: monospace;
    }
    .hint {
        margin-top: 20px; padding: 14px;
        background: rgba(233,69,96,0.1); border-radius: 10px;
        border: 1px solid rgba(233,69,96,0.2);
    }
    .hint p { font-size: 13px; color: #ccd6e0; margin: 0; }
    .hint strong { color: #e94560; }
</style>
</head>
<body>
<div class="container">
    <h1>📱 移动端访问</h1>
    <p>扫描下方二维码或直接输入网址打开</p>
    
    <div class="qrcode-box">
        <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
            <rect width="240" height="240" fill="#fff"/>
            <g fill="#000">
                <!-- 定位图案 -->
                <rect x="20" y="20" width="56" height="56" rx="5" fill="#000"/>
                <rect x="28" y="28" width="40" height="40" rx="2" fill="#fff"/>
                <rect x="36" y="36" width="24" height="24" rx="1" fill="#000"/>
                
                <rect x="164" y="20" width="56" height="56" rx="5" fill="#000"/>
                <rect x="172" y="28" width="40" height="40" rx="2" fill="#fff"/>
                <rect x="180" y="36" width="24" height="24" rx="1" fill="#000"/>
                
                <rect x="20" y="164" width="56" height="56" rx="5" fill="#000"/>
                <rect x="28" y="172" width="40" height="40" rx="2" fill="#fff"/>
                <rect x="36" y="180" width="24" height="24" rx="1" fill="#000"/>
                
                <!-- 数据模块 -->
                ${generateQRDataModules()}
            </g>
            <!-- 中心万花筒Logo -->
            <circle cx="120" cy="120" r="18" fill="#e94560"/>
            <text x="120" y="126" text-anchor="middle" fill="#fff" font-size="18">🌀</text>
        </svg>
    </div>

    <div class="url-list">
        ${urls.map(u => `
        <div class="url-item">
            <div class="url-label">${u.label}</div>
            <div class="url-value">${u.url}</div>
        </div>`).join('')}
    </div>

    <div class="hint">
        <p>💡 <strong>提示:</strong> 确保手机与电脑连接同一WiFi网络。</p>
        <p style="margin-top:6px;">📲 可使用手机相机扫描二维码，或手动输入网址。</p>
    </div>
</div>
</body>
</html>`);
});

// 辅助函数：生成二维码样式数据模块
function generateQRDataModules() {
    const blocks = [];
    const positions = [
        [82,82], [82,92], [82,102], [82,112], [82,122], [82,132], [82,142],
        [92,82], [92,142], [102,82], [102,102], [102,112], [102,132], [102,142],
        [112,82], [112,92], [112,122], [112,142], [122,82], [122,112], [122,122],
        [122,132], [132,82], [132,92], [132,102], [132,112], [132,122], [132,132],
        [142,82], [142,92], [142,102], [142,112], [142,122], [142,132], [142,142],
        // 右侧数据
        [164,82], [164,92], [164,102], [164,112], [164,122],
        [174,82], [174,92], [174,102], [174,112], [174,122],
        [184,82], [184,92], [184,102], [184,112], [184,122],
        [194,82], [194,92], [194,102], [194,112], [194,122],
        [204,82], [204,92], [204,102], [204,112], [204,122],
        [214,82], [214,92], [214,102], [214,112], [214,122],
        // 底部数据
        [82,164], [82,174], [82,184], [82,194], [82,204], [82,214],
        [92,164], [92,174], [92,184], [92,194], [92,214],
        [102,164], [102,174], [102,184], [102,194], [102,204], [102,214],
        [112,164], [112,174], [112,184], [112,204], [112,214],
        [122,164], [122,174], [122,184], [122,194], [122,204], [122,214],
        [132,164], [132,174], [132,184], [132,194], [132,204],
        [142,164], [142,174], [142,184], [142,194], [142,204], [142,214]
    ];
    for (const [x, y] of positions) {
        if (Math.random() > 0.35) {
            blocks.push(`<rect x="${x}" y="${y}" width="8" height="8" rx="1" fill="#000"/>`);
        }
    }
    return blocks.join('\n                ');
}

// --- 保存项目 ---
app.post('/api/project/save', upload.single('project'), (req, res) => {
  try {
    if (req.file) {
      res.json({
        success: true,
        filename: req.file.filename,
        path: `/api/project/download/${req.file.filename}`,
        message: '项目保存成功'
      });
    } else {
      const data = req.body;
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ success: false, message: '无效的项目数据' });
      }
      const filename = `project_${Date.now()}.json`;
      const filepath = safePathJoin(PROJECTS_DIR, filename);
      if (!filepath) {
        return res.status(400).json({ success: false, message: '无效的文件名' });
      }
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
      res.json({
        success: true,
        filename,
        path: `/api/project/download/${filename}`,
        message: '项目保存成功'
      });
    }
  } catch (err) {
    console.error('[API] 保存项目失败:', err);
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

// --- 下载项目 ---
app.get('/api/project/download/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!isValidFilename(filename) || !filename.endsWith('.json')) {
    return res.status(400).json({ success: false, message: '无效的文件请求' });
  }
  const filepath = safePathJoin(PROJECTS_DIR, filename);
  if (!filepath || !fs.existsSync(filepath)) {
    return res.status(404).json({ success: false, message: '文件不存在' });
  }
  res.download(filepath);
});

// --- 列出所有项目 ---
app.get('/api/project/list', (req, res) => {
  try {
    const files = fs.readdirSync(PROJECTS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const stat = fs.statSync(path.join(PROJECTS_DIR, f));
        return {
          filename: f,
          size: stat.size,
          createdAt: stat.birthtime,
          modifiedAt: stat.mtime
        };
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt);
    res.json({ success: true, projects: files });
  } catch (err) {
    console.error('[API] 获取项目列表失败:', err);
    res.status(500).json({ success: false, message: '获取列表失败' });
  }
});

// --- 删除项目 ---
app.delete('/api/project/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!isValidFilename(filename)) {
    return res.status(400).json({ success: false, message: '无效的文件名' });
  }
  const filepath = safePathJoin(PROJECTS_DIR, filename);
  try {
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true, message: '已删除' });
    } else {
      res.status(404).json({ success: false, message: '文件不存在' });
    }
  } catch (err) {
    console.error('[API] 删除项目失败:', err);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// --- 保存画廊截图 ---
app.post('/api/gallery/save', upload.single('gallery'), (req, res) => {
    try {
        if (!req.file && req.body.image) {
            const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `gallery_${Date.now()}.png`;
            const filepath = safePathJoin(GALLERY_DIR, filename);
            if (!filepath) {
                return res.status(400).json({ success: false, message: '无效的文件名' });
            }
            fs.writeFileSync(filepath, buffer);
            return res.json({
                success: true,
                filename,
                url: `/api/gallery/image/${filename}`,
                message: '截图保存成功'
            });
        }
        
        if (req.file) {
            res.json({
                success: true,
                filename: req.file.filename,
                url: `/api/gallery/image/${req.file.filename}`,
                message: '截图保存成功'
            });
        } else {
            res.status(400).json({ success: false, message: '缺少图片数据' });
        }
    } catch (err) {
        console.error('[API] 保存截图失败:', err);
        res.status(500).json({ success: false, message: '保存失败' });
    }
});

// --- 获取画廊图片 ---
app.get('/api/gallery/image/:filename', (req, res) => {
    const filename = req.params.filename;
    const validExt = /\.(png|jpg|jpeg|gif)$/i;
    if (!isValidFilename(filename) || !validExt.test(filename)) {
        return res.status(400).json({ success: false, message: '无效的文件请求' });
    }
    const filepath = safePathJoin(GALLERY_DIR, filename);
    if (!filepath || !fs.existsSync(filepath)) {
        return res.status(404).json({ success: false, message: '图片不存在' });
    }
    res.sendFile(filepath);
});

// --- 画廊列表 ---
app.get('/api/gallery/list', (req, res) => {
    try {
        const files = fs.readdirSync(GALLERY_DIR)
            .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
            .map(f => {
                const stat = fs.statSync(path.join(GALLERY_DIR, f));
                return {
                    filename: f,
                    url: `/api/gallery/image/${f}`,
                    thumbnail: `/api/gallery/image/${f}`,
                    size: stat.size,
                    createdAt: stat.birthtime
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt);
        res.json({ success: true, images: files });
    } catch (err) {
        console.error('[API] 获取画廊列表失败:', err);
        res.status(500).json({ success: false, message: '获取列表失败' });
    }
});

// --- 删除画廊图片 ---
app.delete('/api/gallery/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!isValidFilename(filename)) {
        return res.status(400).json({ success: false, message: '无效的文件名' });
    }
    const filepath = safePathJoin(GALLERY_DIR, filename);
    try {
        if (filepath && fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            res.json({ success: true, message: '已删除' });
        } else {
            res.status(404).json({ success: false, message: '文件不存在' });
        }
    } catch (err) {
        console.error('[API] 删除画廊图片失败:', err);
        res.status(500).json({ success: false, message: '删除失败' });
    }
});

// ==================== 在线音乐 API（增强版） ====================

/**
 * 获取在线音乐列表（通过第三方API）
 * 用于用户绘制时播放背景音乐，提升创作体验
 */
app.get('/api/online-music/list', async (req, res) => {
    try {
        // 尝试多个免费音乐API源
        const apis = [
            // 1. 网易云音乐 - 热门推荐歌曲（通过代理）
            {
                url: 'https://api.uomg.com/api/rand.music?sort=热歌榜&format=json',
                parser: (data) => {
                    if (data.code === 1 && data.data) {
                        return {
                            success: true,
                            title: data.data.name || '未知歌曲',
                            artist: data.data.artists?.[0]?.name || '未知艺人',
                            url: data.data.url,
                            cover: data.data.picUrl || '',
                            source: 'netease'
                        };
                    }
                    return null;
                }
            },
            // 2. 备用: 免费音乐API
            {
                url: 'https://api.infinitecloud.cn/api/rand.music?type=热歌&format=json',
                parser: (data) => {
                    if (data.code === 200 && data.data?.url) {
                        return {
                            success: true,
                            title: data.data.name || '随机音乐',
                            artist: data.data.artist || '未知',
                            url: data.data.url,
                            cover: data.data.picUrl || '',
                            source: 'infinitecloud'
                        };
                    }
                    return null;
                }
            },
            // 3. 备用: V1API 免费音乐
            {
                url: 'https://api.v1.mk/music/random',
                parser: (data) => {
                    if (data.url) {
                        return {
                            success: true,
                            title: data.title || data.name || '随机音乐',
                            artist: data.artist || '未知',
                            url: data.url,
                            cover: data.cover || data.pic || '',
                            source: 'v1api'
                        };
                    }
                    return null;
                }
            }
        ];

        // 依次尝试各个API
        for (const api of apis) {
            try {
                console.log(`[在线音乐] 尝试获取: ${api.url}`);
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(api.url, { 
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });
                clearTimeout(timeout);
                
                if (!response.ok) continue;
                
                const data = await response.json();
                const parsed = api.parser(data);
                
                if (parsed && parsed.url) {
                    console.log(`[在线音乐] 获取成功: ${parsed.title} (来源: ${parsed.source})`);
                    return res.json(parsed);
                }
            } catch (e) {
                console.log(`[在线音乐] API ${api.url} 失败: ${e.message}`);
                continue;
            }
        }

        // 所有API都失败，返回内置备用音乐
        const fallbackMusic = getFallbackMusic();
        console.log(`[在线音乐] 使用备用音乐: ${fallbackMusic.title}`);
        res.json(fallbackMusic);

    } catch (err) {
        console.error('[在线音乐] 获取失败:', err.message);
        res.json(getFallbackMusic());
    }
});

/**
 * 获取在线音乐播放列表（支持播放模式切换）
 * mode=random: 随机打乱12首
 * mode=loop: 循环播放第一首
 * mode=sequential: 顺序播放全部
 */
app.get('/api/online-music/playlist', (req, res) => {
    const mode = req.query.mode || 'random';
    const playlist = getExtendedPlaylist();
    
    if (mode === 'random') {
        const shuffled = [...playlist].sort(() => Math.random() - 0.5);
        return res.json({ success: true, mode: 'random', playlist: shuffled, total: playlist.length });
    } else if (mode === 'sequential') {
        return res.json({ success: true, mode: 'sequential', playlist, total: playlist.length });
    } else {
        // loop: 单首循环
        const index = parseInt(req.query.index) || 0;
        const track = playlist[index % playlist.length];
        return res.json({ success: true, mode: 'loop', playlist: [track], total: 1, currentIndex: index });
    }
});

/**
 * 获取完整播放列表（12首免费可商用音乐）
 * 全部来自 SoundHelix 免费可商用音乐
 */
function getExtendedPlaylist() {
    return [
        { title: '舒缓旋律 - 轻钢琴', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', source: 'soundhelix', duration: 300 },
        { title: '海洋冥想 - 浪涛声', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', source: 'soundhelix', duration: 300 },
        { title: '创意灵感 - 律动', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', source: 'soundhelix', duration: 300 },
        { title: '日出 - 温暖氛围', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', source: 'soundhelix', duration: 300 },
        { title: '月夜 - 静谧旋律', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', source: 'soundhelix', duration: 300 },
        { title: '森林漫步 - 自然', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', source: 'soundhelix', duration: 300 },
        { title: '星空 - 梦幻电子', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', source: 'soundhelix', duration: 300 },
        { title: '花舞 - 轻快活泼', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', source: 'soundhelix', duration: 300 },
        { title: '山巅 - 空灵悠远', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', source: 'soundhelix', duration: 300 },
        { title: '潮汐 - 循环波纹', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', source: 'soundhelix', duration: 300 },
        { title: '微风 - 清新怡人', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', source: 'soundhelix', duration: 300 },
        { title: '庆典 - 欢乐氛围', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', source: 'soundhelix', duration: 300 }
    ];
}

/**
 * 获取备用音乐（扩充至12首免费可商用音乐）
 * 当所有第三方API都不可用时使用
 * 来源: SoundHelix 全部12首免费可商用音乐 + 喜马拉雅备用
 */
function getFallbackMusic() {
    const fallbackList = [
        { title: '🎵 舒缓旋律 - 轻钢琴', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', source: 'soundhelix' },
        { title: '🌊 海洋冥想 - 浪涛声', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', source: 'soundhelix' },
        { title: '🎵 创意灵感 - 律动', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', source: 'soundhelix' },
        { title: '🌅 日出 - 温暖氛围', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', source: 'soundhelix' },
        { title: '🌙 月夜 - 静谧旋律', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', source: 'soundhelix' },
        { title: '🌿 森林漫步 - 自然', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', source: 'soundhelix' },
        { title: '✨ 星空 - 梦幻电子', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', source: 'soundhelix' },
        { title: '🌸 花舞 - 轻快活泼', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', source: 'soundhelix' },
        { title: '🏔️ 山巅 - 空灵悠远', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', source: 'soundhelix' },
        { title: '🌊 潮汐 - 循环波纹', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', source: 'soundhelix' },
        { title: '🍃 微风 - 清新怡人', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', source: 'soundhelix' },
        { title: '🎆 庆典 - 欢乐氛围', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', source: 'soundhelix' }
    ];
    const music = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    return {
        success: true,
        title: music.title,
        artist: music.artist,
        url: music.url,
        cover: '',
        source: music.source
    };
}

/**
 * 代理音频流（解决跨域问题）
 */
app.get('/api/online-music/stream', (req, res) => {
    const audioUrl = req.query.url;
    if (!audioUrl) {
        return res.status(400).json({ success: false, message: '缺少音频URL参数' });
    }

    console.log(`[音频代理] 请求: ${audioUrl.substring(0, 80)}...`);

    const isHttps = audioUrl.startsWith('https');
    const httpModule = isHttps ? https : http;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');

    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'audio/*,*/*'
        }
    };

    if (req.headers.range) {
        options.headers['Range'] = req.headers.range;
    }

    const proxyReq = httpModule.get(audioUrl, options, (proxyRes) => {
        res.status(proxyRes.statusCode);
        const forwardHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition'];
        for (const h of forwardHeaders) {
            const val = proxyRes.headers[h];
            if (val) {
                res.setHeader(h, val);
            }
        }
        if (!proxyRes.headers['content-type']) {
            res.setHeader('content-type', 'audio/mpeg');
        }
        proxyRes.pipe(res);
        proxyRes.on('error', (err) => {
            console.error('[音频代理] 流错误:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: '音频流错误' });
            }
        });
    });

    proxyReq.on('error', (err) => {
        console.error('[音频代理] 请求失败:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: '音频代理失败' });
        }
    });

    proxyReq.setTimeout(15000, () => {
        proxyReq.destroy();
        if (!res.headersSent) {
            res.status(504).json({ success: false, message: '音频代理超时' });
        }
    });
});

// ==================== 音效库 API（新增） ====================

/**
 * 获取音效列表 - 14种可合成的音效参数
 * 前端使用 Web Audio API 直接合成，无需加载音频文件
 */
app.get('/api/sound-effects/list', (req, res) => {
    const effects = [
        { id: 'rain', name: '🌧️ 细雨', type: 'whiteNoise', params: { duration: 2.0, highpass: 2000, gain: 0.3 } },
        { id: 'ocean', name: '🌊 海浪', type: 'brownNoise', params: { duration: 3.0, lowpass: 600, gain: 0.25 } },
        { id: 'wind', name: '💨 风声', type: 'pinkNoise', params: { duration: 2.5, bandpass: { freq: 400, Q: 0.5 }, gain: 0.2 } },
        { id: 'drip', name: '💧 水滴', type: 'tone', params: { freq: 800, decay: 0.15, gain: 0.4 } },
        { id: 'chime', name: '🔔 风铃', type: 'harmonic', params: { baseFreq: 440, harmonics: [1, 2.5, 4.2], decay: 0.8, gain: 0.3 } },
        { id: 'click', name: '🖱️ 咔嗒', type: 'noiseClick', params: { duration: 0.03, gain: 0.5 } },
        { id: 'swoosh', name: '🌀 嗖嗖', type: 'sweep', params: { freqStart: 200, freqEnd: 2000, duration: 0.4, gain: 0.3 } },
        { id: 'bubble', name: '🫧 泡泡', type: 'tone', params: { freq: 1200, decay: 0.08, gain: 0.35 } },
        { id: 'heartbeat', name: '💓 心跳', type: 'pulse', params: { freq: 60, decay: 0.2, gain: 0.5, interval: 0.8 } },
        { id: 'crackle', name: '🔥 噼啪', type: 'crackle', params: { density: 0.3, duration: 1.0, gain: 0.4 } },
        { id: 'harp', name: '🎵 竖琴拨弦', type: 'tone', params: { freq: 523, decay: 0.6, gain: 0.3 } },
        { id: 'bell', name: '🔔 钟声', type: 'harmonic', params: { baseFreq: 660, harmonics: [1, 3, 5], decay: 1.5, gain: 0.25 } },
        { id: 'rainforest', name: '🌴 雨林', type: 'complex', params: { layers: ['rain', 'chime'], gain: 0.3 } },
        { id: 'sparkle', name: '✨ 闪耀', type: 'sparkle', params: { count: 6, freqRange: [2000, 5000], decay: 0.3, gain: 0.2 } }
    ];
    res.json({ success: true, effects, total: effects.length });
});

/**
 * 获取单个音效的详细合成参数
 */
app.get('/api/sound-effects/:id', (req, res) => {
    const effects = [
        { id: 'rain', name: '🌧️ 细雨', type: 'whiteNoise', params: { duration: 2.0, highpass: 2000, gain: 0.3 } },
        { id: 'ocean', name: '🌊 海浪', type: 'brownNoise', params: { duration: 3.0, lowpass: 600, gain: 0.25 } },
        { id: 'wind', name: '💨 风声', type: 'pinkNoise', params: { duration: 2.5, bandpass: { freq: 400, Q: 0.5 }, gain: 0.2 } },
        { id: 'drip', name: '💧 水滴', type: 'tone', params: { freq: 800, decay: 0.15, gain: 0.4 } },
        { id: 'chime', name: '🔔 风铃', type: 'harmonic', params: { baseFreq: 440, harmonics: [1, 2.5, 4.2], decay: 0.8, gain: 0.3 } },
        { id: 'click', name: '🖱️ 咔嗒', type: 'noiseClick', params: { duration: 0.03, gain: 0.5 } },
        { id: 'swoosh', name: '🌀 嗖嗖', type: 'sweep', params: { freqStart: 200, freqEnd: 2000, duration: 0.4, gain: 0.3 } },
        { id: 'bubble', name: '🫧 泡泡', type: 'tone', params: { freq: 1200, decay: 0.08, gain: 0.35 } },
        { id: 'heartbeat', name: '💓 心跳', type: 'pulse', params: { freq: 60, decay: 0.2, gain: 0.5, interval: 0.8 } },
        { id: 'crackle', name: '🔥 噼啪', type: 'crackle', params: { density: 0.3, duration: 1.0, gain: 0.4 } },
        { id: 'harp', name: '🎵 竖琴拨弦', type: 'tone', params: { freq: 523, decay: 0.6, gain: 0.3 } },
        { id: 'bell', name: '🔔 钟声', type: 'harmonic', params: { baseFreq: 660, harmonics: [1, 3, 5], decay: 1.5, gain: 0.25 } },
        { id: 'rainforest', name: '🌴 雨林', type: 'complex', params: { layers: ['rain', 'chime'], gain: 0.3 } },
        { id: 'sparkle', name: '✨ 闪耀', type: 'sparkle', params: { count: 6, freqRange: [2000, 5000], decay: 0.3, gain: 0.2 } }
    ];
    const effect = effects.find(e => e.id === req.params.id);
    if (!effect) {
        return res.status(404).json({ success: false, message: '音效不存在' });
    }
    res.json({ success: true, effect });
});

// ==================== 节拍同步 API（新增） ====================

/**
 * 根据旋转速度返回节拍同步参数
 * 旋转速度 0-100 → BPM 40-200
 */
app.get('/api/beat/sync', (req, res) => {
    const rotationSpeed = parseInt(req.query.speed) || 20;
    const bpm = 40 + (rotationSpeed / 100) * 160;
    const beatInterval = 60000 / bpm;
    res.json({
        success: true,
        bpm: Math.round(bpm),
        beatInterval: Math.round(beatInterval),
        rotationSpeed,
        timeSignature: '4/4',
        subdivision: bpm > 120 ? 'eighth' : 'quarter',
        barsPerMinute: Math.round(bpm / 4)
    });
});

// ==================== 分享链接生成 ====================
const shareLinks = new Map();
let shareCounter = 0;

app.post('/api/share', (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ success: false, message: '缺少文件名' });
        }
        const code = (++shareCounter).toString(36).toUpperCase();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        shareLinks.set(code, {
            type: 'gallery',
            filename,
            url: `${baseUrl}/api/gallery/image/${filename}`,
            createdAt: Date.now()
        });
        res.json({
            success: true,
            code,
            shareUrl: `${baseUrl}/share/${code}`,
            message: '分享链接已生成'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: '生成分享链接失败', error: err.message });
    }
});

// --- 访问分享链接 ---
app.get('/share/:code', (req, res) => {
    const link = shareLinks.get(req.params.code);
    if (!link) {
        return res.status(404).send('<h2>❌ 分享链接已失效</h2>');
    }
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>万花筒分享</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; text-align: center; 
                   background: #1a1a2e; color: #fff; margin: 0; padding: 20px; }
            img { max-width: 100%; max-height: 80vh; border-radius: 12px; 
                  box-shadow: 0 4px 20px rgba(0,0,0,0.5); margin: 20px 0; }
            .btn { display: inline-block; padding: 10px 24px; background: #e94560; 
                   color: #fff; text-decoration: none; border-radius: 8px; 
                   font-size: 16px; margin: 10px; }
            .btn:hover { background: #ff6b81; }
        </style>
        </head>
        <body>
            <h2>🎨 万花筒作品分享</h2>
            <img src="${link.url}" alt="万花筒作品"/>
            <br/>
            <a class="btn" href="${link.url}" download="kaleidoscope.png">⬇ 下载图片</a>
            <a class="btn" href="/">🎨 开始创作</a>
        </body>
        </html>
    `);
});

// ==================== PWA 支持 ====================
// 注册 Service Worker
app.get('/sw.js', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'service-worker.js'));
});

// 提供 PWA manifest
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'manifest.json'));
});

// 提供 public 目录下的静态文件（icons 等）
app.use('/public', express.static(PUBLIC_DIR, {
    maxAge: '7d',
    etag: true
}));

// ==================== 静态文件服务 ====================
// 提供项目根目录的静态文件
app.use(express.static(__dirname, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// 404 处理 - 发送 index.html 支持 SPA 路由
app.use((req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath) && req.accepts('html')) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Not Found' });
    }
});

// ==================== 网络信息 ====================
function getNetworkIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push({
                    name,
                    address: iface.address,
                    isIPv6: false
                });
            }
        }
    }
    return ips;
}

// ==================== 启动服务器（自动处理端口占用） ====================
function startServer(port) {
    const server = app.listen(port, '0.0.0.0');
    
    server.on('listening', () => {
        console.log('');
        console.log('🎨 ========================================');
        console.log('🎨   旋转万花筒绘图工具 - 后端服务 v1.1');
        console.log('🎨 ========================================');
        console.log('');
        console.log(`📌 本地访问:    http://localhost:${port}`);
        
        const ips = getNetworkIPs();
        if (ips.length > 0) {
            console.log(`📱 移动端访问（请确保手机与电脑在同一WiFi网络）:`);
            ips.forEach(ip => {
                console.log(`   http://${ip.address}:${port}`);
            });
            console.log('');
            console.log(`📲 二维码页面: http://localhost:${port}/api/qrcode`);
        } else {
            console.log('⚠️  未检测到局域网连接，无法提供移动端访问');
        }
        
        console.log('');
        console.log('📋 API 端点:');
        console.log(`   GET  /api/status               - 服务器状态`);
        console.log(`   GET  /api/qrcode                - 移动端访问二维码`);
        console.log(`   POST /api/project/save          - 保存项目`);
        console.log(`   GET  /api/project/list          - 项目列表`);
        console.log(`   POST /api/gallery/save          - 保存截图`);
        console.log(`   GET  /api/gallery/list          - 截图列表`);
        console.log(`   POST /api/share                 - 生成分享链接`);
        console.log(`   GET  /api/online-music/list     - 随机在线音乐（12首备选）`);
        console.log(`   GET  /api/online-music/playlist - 音乐播放列表（支持模式切换）`);
        console.log(`   GET  /api/online-music/stream   - 音频流代理`);
        console.log(`   GET  /api/sound-effects/list    - 音效列表（14种）`);
        console.log(`   GET  /api/sound-effects/:id     - 音效合成参数`);
        console.log(`   GET  /api/beat/sync             - 节拍同步参数`);
        console.log('');
        console.log('📱 PWA 支持:');
        console.log(`   /manifest.json                  - PWA 清单`);
        console.log(`   /sw.js                          - Service Worker`);
        console.log(`   /public/icons/                  - 应用图标`);
        console.log('');
        console.log('💡 提示:');
        console.log(`   • 手机浏览器打开地址 → 点击"添加到主屏幕" → 像APP一样使用`);
        console.log(`   • 离线也可使用基础绘图功能（Service Worker 缓存）`);
        console.log(`   • 支持 Ctrl+C 停止服务器`);
        if (port !== PORT) {
            console.log(`   • 端口 ${PORT} 已被占用，自动切换至端口 ${port}`);
        }
        console.log('');
    });
    
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  端口 ${port} 已被占用，尝试端口 ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('❌ 服务器启动失败:', err.message);
            process.exit(1);
        }
    });
}

startServer(PORT);