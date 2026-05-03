#!/usr/bin/env node
/**
 * 万花筒 PWA 图标生成器
 * 使用 Canvas API 生成多尺寸 SVG/PNG 图标
 * 
 * 运行: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// 需要的图标尺寸
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// 确保目录存在
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 生成 SVG 图标（无需依赖，纯文本）
function generateSvgIcon(size) {
    const half = size / 2;
    const innerR = size * 0.32;
    const outerR = size * 0.44;
    
    // 万花筒风格的对称圆形图案
    const petals = [];
    const numPetals = 8;
    
    for (let i = 0; i < numPetals; i++) {
        const angle = (i / numPetals) * Math.PI * 2;
        const nextAngle = ((i + 1) / numPetals) * Math.PI * 2;
        
        // 交替颜色
        const hue = (i * 45) % 360;
        const color = `hsl(${hue}, 80%, 60%)`;
        const nextColor = `hsl(${(i * 45 + 45) % 360}, 80%, 60%)`;
        
        // 绘制花瓣
        const x1 = half + Math.cos(angle) * outerR;
        const y1 = half + Math.sin(angle) * outerR;
        const x2 = half + Math.cos(nextAngle) * outerR;
        const y2 = half + Math.sin(nextAngle) * outerR;
        
        petals.push(`<path d="M${half},${half} L${x1},${y1} A${outerR},${outerR} 0 0,1 ${x2},${y2} Z" fill="${color}" opacity="0.85"/>`);
    }

    // 中心圆
    const centerCircle = `<circle cx="${half}" cy="${half}" r="${innerR}" fill="#e94560" opacity="0.9"/>`;
    
    // 外发光环
    const glowRing = `<circle cx="${half}" cy="${half}" r="${outerR + 2}" fill="none" stroke="rgba(233,69,96,0.3)" stroke-width="2"/>`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16213e"/>
      <stop offset="100%" stop-color="#0f0f23"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
  ${petals.join('\n  ')}
  ${centerCircle}
  ${glowRing}
</svg>`;

    return svg;
}

// 生成所有尺寸的 SVG 图标
console.log('🎨 正在生成 PWA 图标...\n');

for (const size of SIZES) {
    const svgContent = generateSvgIcon(size);
    const filename = `icon-${size}.svg`;
    const filepath = path.join(ICONS_DIR, filename);
    fs.writeFileSync(filepath, svgContent, 'utf-8');
    console.log(`  ✅ 已生成: ${filename} (${size}x${size})`);
}

// 复制最小尺寸作为 favicon
const faviconSvg = generateSvgIcon(32);
fs.writeFileSync(path.join(ICONS_DIR, '..', 'favicon.svg'), faviconSvg, 'utf-8');
console.log('  ✅ 已生成: favicon.svg');

console.log('\n✨ 图标生成完成！');
console.log('💡 提示: 如需 PNG 格式，可使用在线工具将 SVG 转换为 PNG。');
console.log('   推荐: https://convertio.co/zh/svg-png/');