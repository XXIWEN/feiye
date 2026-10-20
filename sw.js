var CACHE = 'feiye-v3';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;

  // 页面导航：网络优先，且强制绕过 HTTP 缓存(GitHub Pages 会给 index.html 发 max-age=600，
  // 不加 no-store 会在部署后 10 分钟内仍拿到旧版，表现为"新功能不生效")
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(function(res){
        if(res && res.status === 200){
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return res;
      }).catch(function(){ return caches.match(e.request); })
    );
    return;
  }

  // 静态资源：缓存优先
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request).then(function(res){
        if(res && res.status === 200 && e.request.url.indexOf('http') === 0){
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return res;
      });
    })
  );
});
