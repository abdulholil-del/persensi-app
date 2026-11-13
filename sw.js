const C='presensi-v13',F=['./','index.html','css/style.css','js/config.js','js/app.js','manifest.webmanifest','icons/icon-192.png','icons/logo.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
// cache dulu (instan), perbarui di belakang layar; permintaan ke Google tidak disentuh
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(caches.match(e.request).then(m=>{const n=fetch(e.request).then(r=>{if(r.ok){const x=r.clone();caches.open(C).then(c=>c.put(e.request,x));}return r;}).catch(()=>m);return m||n;}));});
