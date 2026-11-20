const V='21',C='presensi-v'+V,F=['./','index.html','css/style.css?v='+V,'js/config.js?v='+V,'js/app.js?v='+V,'manifest.webmanifest','icons/icon-192.png','icons/logo.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
// halaman utama: selalu ambil yang terbaru dari jaringan (cache hanya cadangan offline); aset berversi: cache dulu agar cepat
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin)return;
  const keep=x=>{if(x.ok){const y=x.clone();caches.open(C).then(c=>c.put(r,y));}return x;};
  if(r.mode==='navigate'){e.respondWith(fetch(r,{cache:'no-cache'}).then(keep).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));return;}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(keep)));});
