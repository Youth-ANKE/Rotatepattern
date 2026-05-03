#!/usr/bin/env node
/**
 * 音乐下载脚本
 * 下载 SoundHelix 免费音乐到 public/music/ 目录
 * 也可在服务端启动时自动运行
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MUSIC_DIR = path.join(__dirname, '..', 'public', 'music');
const TOTAL_SONGS = 12;
const SONG_INFO = [
    { title: '舒缓旋律 - 轻钢琴', minSize: 500000 },
    { title: '海洋冥想 - 浪涛声', minSize: 500000 },
    { title: '创意灵感 - 律动', minSize: 500000 },
    { title: '日出 - 温暖氛围', minSize: 500000 },
    { title: '月夜 - 静谧旋律', minSize: 500000 },
    { title: '森林漫步 - 自然', minSize: 500000 },
    { title: '星空 - 梦幻电子', minSize: 500000 },
    { title: '花舞 - 轻快活泼', minSize: 500000 },
    { title: '山巅 - 空灵悠远', minSize: 500000 },
    { title: '潮汐 - 循环波纹', minSize: 500000 },
    { title: '微风 - 清新怡人', minSize: 500000 },
    { title: '庆典 - 欢乐氛围', minSize: 500000 },
];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function downloadFile(url, dest, minSize) {
    return new Promise((resolve) => {
        // 检查文件是否已存在且完整
        if (fs.existsSync(dest)) {
            const stat = fs.statSync(dest);
            if (stat.size >= minSize) {
                console.log(`[音乐] 已存在: ${path.basename(dest)} (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);
                resolve(true);
                return;
            }
            console.log(`[音乐] 文件不完整，重新下载: ${path.basename(dest)} (${(stat.size / 1024).toFixed(0)}KB < ${minSize / 1024}KB)`);
            fs.unlinkSync(dest);
        }

        console.log(`[音乐] 下载中: ${path.basename(dest)}...`);
        const file = fs.createWriteStream(dest);
        const module = url.startsWith('https') ? https : http;

        const request = module.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 60000
        }, (response) => {
            // 处理重定向
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                fs.unlinkSync(dest);
                downloadFile(response.headers.location, dest, minSize).then(resolve);
                return;
            }
            if (response.statusCode !== 200) {
                console.log(`[音乐] 下载失败 (HTTP ${response.statusCode}): ${path.basename(dest)}`);
                file.close();
                if (fs.existsSync(dest)) fs.unlinkSync(dest);
                resolve(false);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                const stat = fs.statSync(dest);
                if (stat.size >= minSize) {
                    console.log(`[音乐] 下载完成: ${path.basename(dest)} (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);
                    resolve(true);
                } else {
                    console.log(`[音乐] 下载不完整: ${path.basename(dest)} (${(stat.size / 1024).toFixed(0)}KB)`);
                    fs.unlinkSync(dest);
                    resolve(false);
                }
            });
        });

        request.on('error', (err) => {
            console.log(`[音乐] 下载出错: ${path.basename(dest)} - ${err.message}`);
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            resolve(false);
        });

        request.on('timeout', () => {
            console.log(`[音乐] 下载超时: ${path.basename(dest)}`);
            request.destroy();
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            resolve(false);
        });
    });
}

async function main() {
    ensureDir(MUSIC_DIR);

    let downloaded = 0;
    let failed = 0;

    // 逐个下载，避免并发导致带宽竞争
    for (let i = 1; i <= TOTAL_SONGS; i++) {
        const url = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i}.mp3`;
        const dest = path.join(MUSIC_DIR, `song-${i}.mp3`);
        const info = SONG_INFO[i - 1];
        const ok = await downloadFile(url, dest, info.minSize);
        if (ok) downloaded++;
        else failed++;
    }

    console.log(`\n[音乐] 下载完成: ${downloaded} 成功, ${failed} 失败 (共 ${TOTAL_SONGS} 首)`);

    // 列出所有可用文件
    const available = [];
    for (let i = 1; i <= TOTAL_SONGS; i++) {
        const f = path.join(MUSIC_DIR, `song-${i}.mp3`);
        if (fs.existsSync(f)) {
            const stat = fs.statSync(f);
            available.push({ index: i, size: stat.size, title: SONG_INFO[i - 1].title });
        }
    }
    console.log(`[音乐] 可用本地文件: ${available.length} 首`);
    available.forEach(a => console.log(`  song-${a.index}.mp3: ${(a.size / 1024 / 1024).toFixed(1)}MB - ${a.title}`));
}

main().catch(console.error);
