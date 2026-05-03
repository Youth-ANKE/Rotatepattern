/**
 * 旋转万花筒绘图工具 - Service Worker
 * 提供离线缓存、资源预加载、PWA支持
 * 
 * 版本: 1.1.0
 * 更新: 2026-05-02 (fix: AudioEngine NaN, cache busting)
 */

const CACHE_NAME = 'kaleidoscope-cache-v2';

// 需要预缓存的核心资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/utils/math-utils.js',
  '/modules/state-manager.js',
  '/modules/audio-engine.js',
  '/modules/particle-system.js',
  '/modules/random-generator.js',
  '/modules/canvas-renderer.js',
  '/modules/input-handler.js',
  '/modules/keyboard-handler.js',
  '/modules/ui-controller.js',
  '/manifest.json',
  '/favicon.ico'
];

// 安装事件：预缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 预缓存核心资源...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] 预缓存完成');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] 预缓存失败:', err);
      })
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (cacheWhitelist.indexOf(name) === -1) {
            console.log('[SW] 删除旧缓存:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker 已激活');
      return self.clients.claim();
    })
  );
});

// 网络优先策略（适用于API请求）
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw err;
  }
}

// 缓存优先策略（适用于静态资源）
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      const cachedPage = await cache.match('/index.html');
      if (cachedPage) return cachedPage;
    }
    throw err;
  }
}

// 网络优先，带超时
async function networkWithTimeout(request, timeoutMs = 3000) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('网络超时')), timeoutMs)
  );

  try {
    const response = await Promise.race([
      fetch(request.clone()),
      timeoutPromise
    ]);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw err;
  }
}

// 请求拦截
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== self.location.origin) return;

  // API请求使用网络优先（带超时）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkWithTimeout(request, 3000));
    return;
  }

  // 静态资源（js/css/images）使用缓存优先
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json)$/) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 导航请求使用缓存优先
  if (request.mode === 'navigate') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 默认网络优先
  event.respondWith(networkFirst(request));
});