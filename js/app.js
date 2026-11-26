// ===== Presensi Satpam — frontend (vanilla JS, SPA) =====
const $=s=>document.querySelector(s);
const _s=localStorage.getItem('t')?localStorage:sessionStorage,S={t:_s.getItem('t'),u:JSON.parse(_s.getItem('u')||'null'),tab:'',off:0};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SHN={1:'Shift 1',2:'Shift 2',3:'Shift 3'};
const jam=ms=>new Date(+ms).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'});
const today=()=>new Date(Date.now()+S.off).toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});
function splash(p,t){const a=$('#spb'),b=$('#spp'),c=$('#spt');if(a)a.style.width=p+'%';if(b)b.textContent=p+'%';if(c&&t)c.textContent=t;}
function splashDone(){const e=$('#splash');if(!e||e._d)return;e._d=1;splash(100,'Siap');setTimeout(()=>{e.style.opacity=0;setTimeout(()=>e.remove(),400);},150);}
splash(30,'Memuat aplikasi…');
function toast(m,e){const t=$('#toast');t.textContent=m;t.className='show'+(e?' err':'');clearTimeout(t._x);t._x=setTimeout(()=>t.className='',3200);}
let bz=0;const busy=b=>{bz=Math.max(0,bz+(b?1:-1));clearTimeout(busy.t);if(bz)busy.t=setTimeout(()=>$('#busy').hidden=false,350);else $('#busy').hidden=true;};
const APP_VER='24';
const QU=new Set(['status']),RD=new Set(['izinOpsi','pengajuanSaya','riwayatSaya','dashboard','rekap','jadwalAdmin','listPengajuan','listLaporan','master','getSekolah','laporanSaya','statSaya','jadwalSaya','absensiHari','posSaya','getFoto']),MC={};
// Prinsip "instan": (1) banyak pembacaan dikirim sebagai SATU permintaan, (2) permintaan kembar dibagi, (3) data lama dari HP ditampilkan dulu lalu diperbarui diam-diam.
const SW=new Set(['dashboard','rekap','riwayatSaya','jadwalSaya','statSaya']),BT=new Set(Array.from(RD).concat(['status']).filter(x=>x!=='getFoto')),FL={};let BQ=[],btm=0,rvT=0;
const lcS=()=>localStorage.getItem('u')?localStorage:sessionStorage,lcK=ck=>'lc_'+(S.u&&S.u.id)+'_'+ck;
const lcGet=ck=>{try{const x=JSON.parse(lcS().getItem(lcK(ck))||'null');return x&&Date.now()-x.t<864e5?x.v:undefined;}catch(e){return undefined;}};
const lcSet=(ck,v)=>{try{lcS().setItem(lcK(ck),JSON.stringify({t:Date.now(),v:v}));}catch(e){}};
const lcClear=()=>{[localStorage,sessionStorage].forEach(st=>{try{Object.keys(st).filter(k=>k.indexOf('lc_')===0).forEach(k=>st.removeItem(k));}catch(e){}});};
async function rawCall(a,d){const r=await fetch(GAS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:a,token:S.t,data:d})}),j=await r.json();if(!j.success){if(j.auth)logout();throw new Error(j.message);}return j.data;}
let NB=0;   // 1 = backend lama (belum mengenal 'batch'): kembali ke permintaan satu per satu
function viaBatch(a,d){if(NB)return rawCall(a,d);return new Promise((res,rej)=>{BQ.push({a:a,d:d,res:res,rej:rej});if(!btm)btm=setTimeout(flushBQ,12);});}
async function flushBQ(){btm=0;const q=BQ;BQ=[];if(!q.length)return;
  try{if(q.length===1){q[0].res(await rawCall(q[0].a,q[0].d));return;}
    let out;try{out=await rawCall('batch',{calls:q.map(x=>({a:x.a,d:x.d}))});}catch(e){if(/tidak dikenal/i.test(e.message)){NB=1;await Promise.all(q.map(x=>rawCall(x.a,x.d).then(x.res,x.rej)));return;}throw e;}
    q.forEach((x,i)=>{const o=out&&out[i];if(o&&o.ok)x.res(o.data);else x.rej(new Error(o&&o.message||'Gagal'));});}
  catch(e){q.forEach(x=>x.rej(e));}}
function fetchRead(a,d,ck){if(FL[ck])return FL[ck];const p=(BT.has(a)?viaBatch(a,d):rawCall(a,d)).then(v=>{if(RD.has(a)){MC[ck]={t:Date.now(),v:v};if(SW.has(a))lcSet(ck,v);}return v;});FL[ck]=p;const done=()=>{delete FL[ck];};p.then(done,done);return p;}
function revalidate(a,d,ck,old){const tab=S.tab;fetchRead(a,d,ck).then(v=>{if(JSON.stringify(v)!==JSON.stringify(old))rerender(tab);}).catch(()=>{});}
function rerender(tab){clearTimeout(rvT);rvT=setTimeout(()=>{if(!S.u||S.tab!==tab)return;const ae=document.activeElement;
  if(document.querySelector('.cam,.okscreen,.modal,.lf')||(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)))return;   // jangan mengganggu formulir, kamera, atau jendela yang sedang terbuka
  const v=(S.u.role==='admin'?A:V)[tab];if(v)Promise.resolve(v()).then(()=>{if(S.u&&S.u.role==='admin')cardTools();}).catch(()=>{});},80);}
async function api(a,d={},q){
  if(GAS_URL.startsWith('GANTI')){toast('GAS_URL belum diisi di js/config.js',1);throw new Error('config');}
  const ck=a+JSON.stringify(d),rd=RD.has(a);
  if(rd&&MC[ck]&&Date.now()-MC[ck].t<20000)return MC[ck].v;
  if(SW.has(a)){const c=lcGet(ck);if(c!==undefined){revalidate(a,d,ck,c);return c;}}
  const ov=!q&&!rd&&!QU.has(a);if(ov)busy(1);
  try{if(rd||BT.has(a))return await fetchRead(a,d,ck);
    const v=await rawCall(a,d);if(a!=='login'){for(const x in MC)delete MC[x];lcClear();}return v;
  }catch(e){toast(/Failed to fetch|NetworkError/i.test(e.message)?'Tidak ada koneksi internet':e.message,1);throw e;}finally{if(ov)busy(0);}
}
function logout(){document.body.classList.remove('adm','sb-open','sb-off');localStorage.clear();sessionStorage.clear();S.t=null;S.u=null;boot();}
// ---- foto & GPS ----
function pilihFoto(multi){return new Promise(res=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.capture='user';i.multiple=!!multi;
  i.onchange=async()=>res(await Promise.all([...i.files].map(kecil)));i.click();});}
function kecil(f){return new Promise(r=>{const im=new Image();im.onload=()=>{const k=Math.min(1,720/Math.max(im.width,im.height)),c=document.createElement('canvas');
  c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.6));};im.src=URL.createObjectURL(f);});}
function lokasi(){return new Promise((ok,no)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>ok({lat:p.coords.latitude,lng:p.coords.longitude}),()=>no(new Error('Aktifkan izin lokasi (GPS)')),{enableHighAccuracy:true,timeout:15000}):no(new Error('GPS tidak didukung')));}
// ---- layout ----
const IC={dashboard:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z"/>',jadwal:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',absen:'<path d="M20 6L9 17l-5-5"/>',pengajuan:'<path d="M9 12h6M9 16h6M7 3h7l5 5v13H7z"/>',lap:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',rekap:'<path d="M6 2h9l5 5v15H6zM9 13h8M9 17h8"/>',satpam:'<circle cx="12" cy="12" r="8"/>',pos:'<circle cx="12" cy="12" r="8"/>',sekolah:'<path d="M3 10l9-6 9 6v2H3zM5 12v8M10 12v8M14 12v8M19 12v8M3 21h18"/>',akun:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'};
const RC={satpam:'#DC3545',pos:'#17A2B8'};
const svg=(d,z)=>`<svg width="${z||18}" height="${z||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
function nav(items){const n=$('#nav'),ad=S.u&&S.u.role==='admin';n.hidden=!items;if(!items)return;S.nl=Object.fromEntries(items);
  n.innerHTML=(ad?`<div class="brand"><img src="icons/logo.png" alt=""><div>${SEKOLAH.nama}<small>${SEKOLAH.sub}</small></div></div><input id="nf" placeholder="Filter menu…" aria-label="Filter menu">`:'')+items.map(([k,l])=>k[0]==='#'?`<div class="sec">${l}</div>`:`<button data-k="${k}" class="${S.tab===k?'on':''}">${ad?`<i style="color:${RC[k]||'inherit'}">${svg(IC[k]||'')}</i>`:''}<span>${l}</span></button>`).join('');
  n.onclick=e=>{const bb=e.target.closest('button'),k=bb&&bb.dataset.k;if(k){document.body.classList.remove('sb-open');go(k);}};
  const f=$('#nf');if(f)f.oninput=()=>{const q=f.value.toLowerCase();n.querySelectorAll('button').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(q));n.querySelectorAll('.sec').forEach(x=>x.hidden=!!q);};}
const closePops=()=>{['np','up'].forEach(i=>{const q=$('#'+i);if(q)q.hidden=true;});};
const nrKey=()=>'nr_'+(S.u&&S.u.id);
async function notifList(){const L=[];try{
  if(S.u.role==='admin'){const r=await api('dashboard',{bulan:today().slice(0,7)}),k=r.kpi;
    if(k.menunggu)L.push({id:'p'+k.menunggu,t:k.menunggu+' pengajuan izin/sakit menunggu persetujuan',go:'pengajuan'});
    if(k.penting)L.push({id:'l'+k.penting,t:k.penting+' laporan penting belum ditinjau',go:'lap'});
    if(k.belum)L.push({id:'b'+k.belum,t:k.belum+' petugas belum absen',go:'absen'});
    if(k.telat)L.push({id:'t'+k.telat,t:k.telat+' petugas terlambat hari ini',go:'absen'});
  }else{const r=await api('status');r.items.forEach(i=>{
    if(i.state==='datang')L.push({id:'d'+i.tanggal+i.kode,t:'Absen datang Shift '+i.kode+' sudah dibuka',go:'home'});
    if(i.state==='pulang')L.push({id:'g'+i.tanggal+i.kode,t:'Sedang bertugas — pulang mulai '+jam(i.w.pm)+' WIB',go:'home'});
    if(i.state==='menunggu')L.push({id:'m'+i.tanggal+i.kode,t:'Pengajuan izin/sakit menunggu persetujuan',go:'izin'});});}
  }catch(e){}return L;}
async function notifRender(open){const L=await notifList(),rd=JSON.parse(localStorage.getItem(nrKey())||'[]'),un=L.filter(x=>rd.indexOf(x.id)<0),bc=$('#bc');
  if(bc){bc.hidden=!un.length;bc.textContent=un.length;}
  if(open){const q=$('#np');if(!q)return;q.innerHTML='<div class="ph"><b>Notifikasi</b><button id="nm">Tandai semua dibaca</button></div>'+(L.map(x=>`<a href="#" data-g="${x.go}" class="${rd.indexOf(x.id)<0?'un':''}">${esc(x.t)}</a>`).join('')||'<div class="mut" style="padding:14px">Tidak ada notifikasi.</div>');
    q.querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();q.hidden=true;go(a.dataset.g);});
    $('#nm').onclick=()=>{localStorage.setItem(nrKey(),JSON.stringify(L.map(x=>x.id)));notifRender(1);};}}
function topbar(){const t=$('#top');if(!t)return;const ad=S.u.role==='admin',ini=S.u.nama.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();t.hidden=false;document.body.classList.add('hdr');
  t.innerHTML=`${ad?`<button id="hm" aria-label="Buka atau tutup menu">${svg('<path d="M4 6h16M4 12h16M4 18h16"/>',22)}</button>`:''}<img class="tl" src="icons/logo.png" alt=""><div class="tt"><b>PRESENSI SATPAM · ${esc(SEKOLAH.nama.toUpperCase())}</b><small>Portal Presensi Resmi</small></div><span class="sp"></span>
  <div class="bell"><button id="bl" aria-label="Notifikasi">${svg('<path d="M18 8a6 6 0 00-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 20a2 2 0 004 0"/>',22)}<i id="bc" hidden>0</i></button><div id="np" class="pop" hidden></div></div>
  <div class="usr"><button id="um" class="uchip" aria-label="Menu pengguna"><span class="avatar" style="width:34px;height:34px;font-size:13px">${esc(ini)}</span><span class="un"><b>${esc(S.u.nama)}</b><small>${ad?'Pengelola Sekolah':'Satpam · '+esc(S.u.id)}</small></span></button><div id="up" class="pop" hidden><button id="u1">Ganti password</button><button id="u2">Keluar</button></div></div>`;
  const hm=$('#hm');if(hm)hm.onclick=()=>document.body.classList.toggle(innerWidth<900?'sb-open':'sb-off');
  $('#bl').onclick=e=>{e.stopPropagation();const q=$('#np'),was=q.hidden;closePops();if(was){q.hidden=false;q.innerHTML='<div class="mut" style="padding:14px">Memuat…</div>';notifRender(1);}};
  $('#um').onclick=e=>{e.stopPropagation();const q=$('#up'),was=q.hidden;closePops();q.hidden=!was;};
  $('#u1').onclick=()=>{closePops();go(ad?'akun':'profil');};$('#u2').onclick=logout;
  setTimeout(()=>notifRender(0),1200);}
addEventListener('click',e=>{if(!e.target.closest('.pop'))closePops();if(document.body.classList.contains('sb-open')&&!e.target.closest('#nav,#top'))document.body.classList.remove('sb-open');});

function head(){return '';return `<div class="row"><h1>${esc(S.u.nama)}</h1><button class="sec" onclick="logout()" style="flex:0">Keluar</button></div>`;}
function cardTools(){if(S.u.role==='admin')document.querySelectorAll('.card>h2:first-child').forEach(h=>{if(h.querySelector('.tl'))return;const b=document.createElement('button');b.className='tl';b.textContent='−';b.setAttribute('aria-label','Ciutkan kartu');b.onclick=()=>{const c=h.parentElement.classList.toggle('cl');b.textContent=c?'+':'−';};h.appendChild(b);});}
function go(k){clearInterval(S.tm);S.tab=k;$('#app').dataset.crumb=(S.nl&&S.nl[k])||'';document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));$('#app').innerHTML='<div class="sk"></div><div class="sk"></div><div class="sk s"></div>';Promise.resolve((S.u.role==='admin'?A:V)[k]()).then(cardTools).catch(e=>{if(document.querySelector('#app .sk'))$('#app').innerHTML='<div class="card"><b>Gagal memuat halaman</b><p class="mut">'+esc(e&&e.message)+'</p><button onclick="go(S.tab)">Coba lagi</button></div>';}).finally(splashDone);}
let tabRole='satpam',clk;
function loginView(){document.body.classList.add('lgn');nav();document.body.classList.remove('adm','hdr');
  $('#app').innerHTML=`<div class="sl"><section class="sl-l"><div class="sl-in"><div class="sl-brand"><img src="icons/logo.png" alt="Logo"><div><b>${esc(SEKOLAH.nama.toUpperCase())}</b><small>Portal Digital</small></div></div>
  <h1>Selamat Datang</h1><p class="sl-p">di Sistem Presensi Satpam<br>${esc(SEKOLAH.nama)}</p><p class="sl-m">Bersama menjaga keamanan dan kedisiplinan sekolah.</p>
  <ul class="sl-f"><li><b>Presensi</b> Lebih Mudah</li><li><b>Aman</b> dan Terpercaya</li><li><b>Untuk Satpam</b> dan Pengelola</li></ul></div></section>
  <section class="sl-r"><div class="lcard"><img class="logo" src="icons/logo.png" alt="Logo ${esc(SEKOLAH.nama)}"><h2>Portal Satpam / Pengelola</h2><p class="mut">${esc(SEKOLAH.nama)}</p>
  <div class="seg"><button type="button" id="t1" class="on">${svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>')}Satpam</button><button type="button" id="t2">${svg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>')}Pengelola</button></div>
  <form id="lf"><label for="id">ID Petugas / NIP</label><input id="id" autocomplete="username" placeholder="Contoh: S001" required>
  <label for="pin">Kata sandi</label><div class="pw"><input id="pin" type="password" autocomplete="current-password" placeholder="Masukkan kata sandi" required><button class="eye" id="eye" type="button" aria-label="Tampilkan atau sembunyikan sandi">${svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')}</button></div>
  <div class="opt"><label class="rmb"><input type="checkbox" id="rm" checked><span>Ingat saya 14 hari</span></label><a href="#" id="lp">Lupa kata sandi?</a></div><button class="big" id="lg" type="submit">Masuk</button></form>
  <div class="inst" id="inst"><div><b>Pasang di Layar Utama</b><br><small>Akses cepat tanpa browser</small></div><button id="ins" type="button" style="flex:0">Pasang</button></div></div>
  <p class="sl-q">“Keamanan sekolah dimulai dari kedisiplinan kita.”</p><small class="foot">© 2026 ${esc(SEKOLAH.nama)}. All rights reserved.</small></section></div>`;
  const tabs=r=>{tabRole=r;$('#t1').classList.toggle('on',r==='satpam');$('#t2').classList.toggle('on',r==='admin');$('#id').placeholder='Contoh: '+(r==='admin'?'admin':'S001');};
  $('#t1').onclick=()=>tabs('satpam');$('#t2').onclick=()=>tabs('admin');
  $('#eye').onclick=()=>{const q=$('#pin');q.type=q.type==='password'?'text':'password';};
  $('#lp').onclick=e=>{e.preventDefault();toast('Hubungi pengelola sekolah untuk mereset kata sandi');};
  $('#ins').onclick=()=>$('#pwaBtn').click();if(standalone)$('#inst').hidden=true;
  if(!GAS_URL.startsWith('GANTI'))fetch(GAS_URL).catch(()=>{});
  $('#lf').onsubmit=async e=>{e.preventDefault();const r=await api('login',{id:$('#id').value.trim(),pin:$('#pin').value});
    if((r.user.role==='admin')!==(tabRole==='admin')){toast('Akun ini bukan akun '+(tabRole==='admin'?'Pengelola Sekolah':'Satpam Lapangan'),1);return;}
    S.t=r.token;S.u=r.user;const st=$('#rm').checked?localStorage:sessionStorage;st.setItem('t',S.t);st.setItem('u',JSON.stringify(S.u));boot();};
}
function pwForm(f){return `<label for="pw0">Password lama</label><input id="pw0" type="password" autocomplete="current-password"><label for="pw1">Password baru (minimal 6 karakter)</label><input id="pw1" type="password" autocomplete="new-password"><label for="pw2">Ulangi password baru</label><input id="pw2" type="password" autocomplete="new-password"><button class="big" id="pws">Simpan Password</button>${f?'<button class="sec big" id="pwx" style="margin-top:8px">Keluar</button>':''}`;}
function pwBind(f,done){if(f)$('#pwx').onclick=logout;
  $('#pws').onclick=async()=>{const a=$('#pw0').value,b=$('#pw1').value;if(b.length<6)return toast('Password baru minimal 6 karakter',1);if(b!==$('#pw2').value)return toast('Konfirmasi password tidak sama',1);if(a===b)return toast('Password baru tidak boleh sama dengan yang lama',1);
    await api('gantiPassword',{lama:a,baru:b});S.u.wajib=false;[localStorage,sessionStorage].forEach(x=>{if(x.getItem('u'))x.setItem('u',JSON.stringify(S.u));});toast('Password berhasil diganti');done();};}
function pwView(f){
  $('#app').innerHTML=(f?`<div class="login"><div class="lgo"><img class="logo" src="icons/logo.png" alt=""></div><h1>Ganti Password</h1><p class="mut">Demi keamanan, buat password baru sebelum memakai aplikasi.</p></div>`:head()+`<div class="card"><b>${esc(S.u.nama)}</b><br><small>ID ${esc(S.u.id)} · ${esc(S.u.role==='admin'?'Pengelola Sekolah':'Satpam')} ${esc(S.u.pos||'')}</small></div><h2>Ganti Password</h2>`)+`<div class="card">${pwForm(f)}</div>`;
  pwBind(f,()=>{if(f)boot();else pwView(0);});}
function isiSatpam(id){const x=S.ms.find(q=>String(q.id)===String(id));if(!x)return;$('#si').value=x.id;$('#sn').value=x.nama;$('#so').value=x.pos;$('#sr').value=x.role;$('#sa').value=x.aktif||'Y';$('#sp').value='';$('#si').scrollIntoView({behavior:'smooth',block:'center'});}
function isiPos(i){const q=S.mp[i];$('#pn').value=q.nama;$('#pa').value=q.lat;$('#po').value=q.lng;$('#pr').value=q.radius_m||100;$('#pn').scrollIntoView({behavior:'smooth',block:'center'});}
async function resetPw(id){const p=prompt('Password sementara untuk '+id+' (min. 6 karakter). Satpam wajib menggantinya saat login:');if(!p)return;await api('resetPassword',{id,pin:p});toast('Password direset');}
function boot(){document.body.classList.remove('lgn');const tp=$('#top');if(tp)tp.hidden=true;document.body.classList.remove('hdr');if(S.t&&!S.u){localStorage.clear();sessionStorage.clear();S.t=null;}
  if(!S.t){loginView();splashDone();return;}
  splash(60,'Mengambil data akun Anda…');if(S.u.wajib){pwView(1);splashDone();return;}
  if(S.u.role==='admin'){document.body.classList.add('adm');topbar();nav([['dashboard','Dashboard'],['jadwal','Jadwal Shift'],['absen','Absensi Harian'],['pengajuan','Pengajuan Izin/Sakit'],['lap','Laporan Tugas'],['rekap','Rekap & Export PDF'],['#m','Data Master'],['satpam','Data Satpam'],['pos','Data Pos'],['#p','Pengaturan'],['sekolah','Pengaturan Sekolah'],['akun','Akun & Password']]);go('dashboard');}
  else{topbar();nav([['home','Beranda'],['laporan','Laporan'],['izin','Pengajuan'],['jadwal','Jadwal'],['profil','Profil']]);go('home');}
}
const ST={belum:'Belum dibuka',datang:'Siap absen datang',pulang:'Sedang bertugas',lewat:'Waktu pulang lewat',selesai:'Selesai',menunggu:'Menunggu persetujuan',alpa:'Alpa',I:'Izin',S:'Sakit',A:'Alpa',H:'Hadir',T:'Terlambat',PC:'Pulang cepat'};
// ================= SATPAM =================
const V={
async home(){clearInterval(S.tm);const [r,st,lp]=await Promise.all([api('status'),api('statSaya',{bulan:today().slice(0,7)}),api('laporanSaya')]);S.off=r.now-Date.now();
  const hr=+new Date(Date.now()+S.off).toLocaleString('en-GB',{hour:'numeric',hour12:false,timeZone:'Asia/Jakarta'}),sal=hr<11?'Pagi':hr<15?'Siang':hr<19?'Sore':'Malam',ini=S.u.nama.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  const od={datang:0,pulang:0,belum:1,menunggu:2,lewat:3,selesai:4},cards=r.items.slice().sort((a,b)=>(od[a.state]===undefined?5:od[a.state])-(od[b.state]===undefined?5:od[b.state])).map(presensiCard).join('')||'<div class="card mut">Tidak ada shift aktif saat ini. Tombol absen terbuka 2 jam sebelum shift terjadwal.</div>';
  const tay=lp.filter(l=>l.tanggal===today()).slice(0,3);
  $('#app').innerHTML=`<div class="greet"><div class="avatar">${esc(ini)}</div><div><h1>Selamat ${sal}, ${esc(S.u.nama)}</h1><small>${esc(S.u.pos||'')} · ${new Date(Date.now()+S.off).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})}</small></div></div>${cards}
  <h2>Statistik bulan ini</h2><div class="stg"><div class="st h"><small>HADIR (H)</small><b>${st.H||0}</b>hari</div><div class="st t"><small>TERLAMBAT (T)</small><b>${st.T||0}</b>kali</div><div class="st i"><small>IZIN / SAKIT</small><b>${(st.I||0)+(st.S||0)}</b>hari</div><div class="st p"><small>PULANG CEPAT</small><b>${st.PC||0}</b>kali</div></div>
  <h2>Akses cepat</h2><div class="qa"><button onclick="go('laporan')">Buat Laporan Tugas</button><button onclick="go('izin')">Ajukan Izin / Sakit</button><button onclick="go('jadwal')">Cek Jadwal Shift</button></div>
  <h2>Laporan terakhir hari ini</h2>${tay.map(l=>`<div class="card"><b>${esc(l.jenis)}</b> <span class="tag ${l.tingkat==='Penting'?'A':'H'}">${esc(l.tingkat)}</span><br><small>${esc(l.lokasi)}</small><p>${esc(l.uraian)}</p></div>`).join('')||'<div class="card mut">Belum ada laporan hari ini.</div>'}`;
  const f=ms=>[ms/36e5,ms/6e4%60,ms/1e3%60].map(x=>String(Math.floor(x)).padStart(2,'0')).join(':'),
  tick=()=>{const cl=document.querySelectorAll('.clk');if(!cl.length){clearInterval(S.tm);return;}const n=Date.now()+S.off,t=new Date(n).toLocaleTimeString('en-GB',{timeZone:'Asia/Jakarta',hour12:false});
    cl.forEach(c=>c.textContent=t);
    document.querySelectorAll('.cdn').forEach(c=>{const d=+c.dataset.tg-n;c.textContent=f(Math.max(0,d));
      if(d<=0&&c.dataset.rl&&Date.now()-(S._rlT||0)>5000){S._rlT=Date.now();setTimeout(()=>{if(S.tab==='home'&&!document.querySelector('.cam'))go('home');},700);}});
    document.querySelectorAll('.abs[data-da]').forEach(b=>{if(n>+b.dataset.da&&!b.classList.contains('late')){b.classList.add('late');const l=b.querySelector('.al');if(l)l.textContent='ABSEN DATANG (TERLAMBAT) →';}});};
  tick();S.tm=setInterval(tick,1000);},
async profil(){const b=today().slice(0,7),[st,ps]=await Promise.all([api('statSaya',{bulan:b}),api('posSaya')]),ini=S.u.nama.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase(),H=st.H||0,T=st.T||0,PC=st.PC||0,A=st.A||0,dn=H+T+PC+A,dis=dn?Math.round(H/dn*1000)/10:0;
  $('#app').innerHTML=`<div class="pf"><div class="avatar lg">${esc(ini)}</div><h1>${esc(S.u.nama)}</h1><span class="tag H">AKTIF</span><small class="mut" style="display:block;margin-top:4px">Satpam · ID ${esc(S.u.id)}</small></div>
  <div class="card"><div class="row"><span class="mut">Pos jaga</span><b style="text-align:right">${esc(ps.nama||S.u.pos||'–')}</b></div><div class="row" style="margin-top:6px"><span class="mut">Radius presensi</span><b style="text-align:right">${ps.lat!=null?esc(ps.radius)+' m':'Belum diatur'}</b></div></div>
  <h2>Kedisiplinan bulan ini</h2><div class="card"><div class="row"><b>Skor disiplin</b><b class="mono" id="dsk" style="text-align:right">${dn?dis+'%':'–'}</b></div><div class="hb" style="height:10px"><i style="width:${dis}%"></i></div>
  <div class="stg3" style="margin-top:10px">${[['HADIR','h',H],['TERLAMBAT','t',T],['PULANG CEPAT','p',PC],['IZIN / SAKIT','i',(st.I||0)+(st.S||0)],['ALPA','a',A],['LAPORAN','d',st.Laporan||0]].map(x=>`<div class="st ${x[1]}"><small>${x[0]}</small><b>${x[2]}</b></div>`).join('')}</div><small class="mut">Skor = hadir tepat waktu dibagi seluruh shift yang sudah berjalan (tidak termasuk izin/sakit).</small></div>
  <h2>Keamanan</h2><div class="card"><button class="sec big" id="pwt" aria-expanded="false">Ganti password</button><div id="pwb" hidden style="margin-top:12px">${pwForm(0)}</div></div>
  <h2>Aplikasi</h2><div class="card"><div class="row"><span class="mut">Versi aplikasi</span><b style="text-align:right" id="ver">v${APP_VER}</b></div>${standalone?'':'<button class="sec big" id="pin" style="margin-top:10px">Pasang di layar utama</button>'}<button class="sec big" id="pcb" style="margin-top:10px">Bersihkan cache & muat ulang</button><small class="mut">Gunakan bila tampilan tidak sesuai setelah pembaruan. Anda perlu login lagi.</small></div>
  <button class="bad big" id="pko" style="margin-top:14px">Keluar</button>`;
  $('#pwt').onclick=()=>{const x=$('#pwb');x.hidden=!x.hidden;$('#pwt').setAttribute('aria-expanded',String(!x.hidden));if(!x.hidden)$('#pw0').focus();};pwBind(0,()=>V.profil());
  const pi=$('#pin');if(pi)pi.onclick=()=>$('#pwaBtn').click();
  $('#pcb').onclick=()=>{if(!confirm('Aplikasi akan dimuat ulang dan Anda perlu login lagi. Lanjutkan?'))return;if(window.__wipe)window.__wipe();else{localStorage.clear();sessionStorage.clear();location.reload();}};$('#pko').onclick=logout;},

async laporan(){clearInterval(S.tm);const [r,l,ps]=await Promise.all([api('status'),api('laporanSaya'),api('posSaya')]);S.off=r.now-Date.now();
  const it=r.items.find(i=>i.state==='pulang'),dk='ld_'+S.u.id,F={j:'',t:'Biasa',f:[],g:null},AR=typeof AREA!=='undefined'?AREA:AREA_DEF,
  JN=[['Patroli','Patroli lingkungan','<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'],['Kejadian/Insiden','Kejadian / insiden','<path d="M12 3l10 18H2zM12 10v5M12 18v.5"/>'],['Tamu','Tamu & pengunjung','<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'],['Kendaraan','Kendaraan & parkir','<path d="M5 16V11l2-5h10l2 5v5M3 16h18M7 19v-3M17 19v-3"/>'],['Serah Terima','Serah terima','<path d="M7 7h12l-3-3M17 17H5l3 3"/>'],['Lainnya','Lainnya','<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>']],
  dr=(()=>{try{const x=JSON.parse(localStorage.getItem(dk)||'null');return x&&Date.now()-x.ts<864e5?x:null;}catch(e){return null;}})(),
  hist=l.slice(0,10).map(x=>{const nf=x.foto?String(x.foto).split(',').filter(Boolean).length:0,ok=x.catatan_admin?1:0,tm=x.dibuat_pada&&!isNaN(+x.dibuat_pada)?' · '+jam(+x.dibuat_pada)+' WIB':'';
    return `<div class="card"><div class="row"><b>${esc(x.jenis)}</b><span class="tag ${x.tingkat==='Penting'?'A':'H'}" style="flex:0">${esc(x.tingkat).toUpperCase()}</span>${ok?'<span class="tag H" style="flex:0">DITINJAU</span>':''}</div><small>${esc(x.tanggal)} · Shift ${esc(x.kode_shift)}${tm}${x.lokasi?' · '+esc(x.lokasi):''}${nf?' · '+nf+' foto':''}</small><p class="clamp">${esc(x.uraian)}</p>${ok?`<div class="tgp"><b>Tanggapan pengelola:</b> ${esc(x.catatan_admin)}</div>`:''}</div>`;}).join('')||'<div class="card mut">Belum ada laporan.</div>';
  const lock='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  $('#app').innerHTML=`<h1>Laporan Tugas</h1>`+(it?`<div class="shiftbar s${it.kode}"><b>SHIFT ${it.kode} · AKTIF</b><small>Laporan otomatis tercatat pada shift ini · ${esc(it.tanggal)}</small></div>
  <div class="card lf"><label>Tingkat kepentingan</label><div class="tg2"><button type="button" class="tb on" data-t="Biasa">Biasa / Rutin</button><button type="button" class="tb pn" data-t="Penting">Penting / Darurat</button></div>
  <label>Jenis tugas & pantauan <span class="req">wajib</span></label><div class="jg">${JN.map(([v,t,ic])=>`<button type="button" class="jb" data-j="${esc(v)}">${svg(ic,22)}<span>${t}</span></button>`).join('')}</div>
  <label for="lo">Lokasi penugasan <span class="req">wajib</span></label><div class="lchips">${AR.map(a=>`<button type="button" data-l="${esc(a)}">${esc(a)}</button>`).join('')}</div><input id="lo" placeholder="Pilih di atas atau ketik lokasi…" maxlength="80" autocomplete="off">
  <label for="ur">Uraian kejadian & situasi <span class="req">wajib</span><span id="uc" class="mut" style="float:right">0/300</span></label><textarea id="ur" rows="4" maxlength="300" placeholder="Tuliskan detail temuan patroli, nama tamu, plat kendaraan, atau situasi pengamanan…"></textarea><small class="mut">Draf tersimpan otomatis di HP ini. <b id="dn" hidden>Draf dipulihkan.</b></small>
  <label style="margin-top:12px">Foto dokumentasi lapangan <span id="fc" class="mut" style="float:right">0/3</span></label><div id="fg" class="fg"></div><div id="gp" class="gps"></div>
  <button class="big abs" id="kirim">KIRIM LAPORAN TUGAS →</button></div>`:`<div class="card lockc">${lock}<b>Laporan belum bisa dibuat</b><p class="mut">Laporan hanya bisa dibuat saat shift berjalan, yaitu setelah Anda absen datang dan sebelum absen pulang.</p><button class="big" onclick="boot()">Kembali ke Beranda</button></div>`)+`<h2>Laporan saya</h2>${hist}`;
  if(!it)return;
  const $$=q=>document.querySelectorAll(q),uiT=()=>$$('.tb').forEach(b=>b.classList.toggle('on',b.dataset.t===F.t)),uiJ=()=>$$('.jb').forEach(b=>b.classList.toggle('on',b.dataset.j===F.j)),
  uiL=()=>$$('.lchips button').forEach(b=>b.classList.toggle('on',b.dataset.l===$('#lo').value.trim())),uiC=()=>{$('#uc').textContent=$('#ur').value.length+'/300';},
  saveDr=()=>{clearTimeout(S._dt);S._dt=setTimeout(()=>{const u=$('#ur'),lo=$('#lo');if(!u||!lo)return;const v={j:F.j,t:F.t,l:lo.value,u:u.value,ts:Date.now()};if(v.j||v.l.trim()||v.u.trim())localStorage.setItem(dk,JSON.stringify(v));else localStorage.removeItem(dk);},400);},
  drawF=()=>{$('#fg').innerHTML=F.f.map((d,i)=>`<div class="th"><img src="${esc(d)}" alt="Foto ${i+1}"><button type="button" class="x" data-x="${i}" aria-label="Hapus foto ${i+1}">✕</button></div>`).join('')+(F.f.length<3?`<button type="button" class="th add" id="fa">${svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',24)}<span>+ Foto</span></button>`:'');$('#fc').textContent=F.f.length+'/3';},
  drawG=m=>{const g=F.g,d=g&&ps&&ps.lat!=null?jarak(g.lat,g.lng,ps.lat,ps.lng):null;$('#gp').innerHTML=m==='cari'?'<span class="tag">MENCARI GPS…</span>':g?`<span class="tag H">GPS AKTIF</span> <small>±${g.acc} m${d!=null?' · '+d+' m dari pos':''}</small> <button type="button" class="sec sm" id="gr">Perbarui</button><div class="mono mut">${g.lat.toFixed(6)}, ${g.lng.toFixed(6)}</div>`:`<span class="tag Menunggu">GPS TIDAK AKTIF</span> <small>Laporan tetap bisa dikirim tanpa lokasi.</small> <button type="button" class="sec sm" id="gr">Coba lagi</button>`;},
  gps=()=>{drawG('cari');if(!navigator.geolocation){F.g=null;drawG();return;}navigator.geolocation.getCurrentPosition(p=>{F.g={lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)};drawG();},()=>{F.g=null;drawG();},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});};
  $$('.tb').forEach(b=>b.onclick=()=>{F.t=b.dataset.t;uiT();saveDr();});
  $$('.jb').forEach(b=>b.onclick=()=>{F.j=b.dataset.j;if(F.j==='Kejadian/Insiden'&&F.t==='Biasa'){F.t='Penting';uiT();toast('Insiden otomatis ditandai Penting (bisa diubah)');}uiJ();saveDr();});
  $$('.lchips button').forEach(b=>b.onclick=()=>{$('#lo').value=b.dataset.l;uiL();saveDr();});$('#lo').oninput=()=>{uiL();saveDr();};$('#ur').oninput=()=>{uiC();saveDr();};
  $('#fg').onclick=async e=>{const x=e.target.closest('[data-x]');if(x){F.f.splice(+x.dataset.x,1);drawF();return;}if(e.target.closest('#fa')){const d=await ambilFoto();if(d&&F.f.length<3){F.f.push(d);drawF();}}};
  $('#gp').onclick=e=>{if(e.target.closest('#gr'))gps();};
  if(dr){F.j=dr.j||'';F.t=dr.t==='Penting'?'Penting':'Biasa';$('#lo').value=dr.l||'';$('#ur').value=dr.u||'';$('#dn').hidden=false;uiT();uiJ();uiL();uiC();}
  drawF();gps();
  $('#kirim').onclick=async()=>{const j=F.j,lo=$('#lo').value.trim(),u=$('#ur').value.trim();
    if(!j)return toast('Pilih jenis tugas',1);if(!lo)return toast('Isi lokasi penugasan',1);if(u.length<5)return toast('Uraian minimal 5 karakter',1);
    const b=$('#kirim');b.disabled=true;
    try{await api('laporan',{jenis:j,lokasi:lo,uraian:u,tingkat:F.t,fotos:F.f,lat:F.g?F.g.lat:null,lng:F.g?F.g.lng:null});clearTimeout(S._dt);localStorage.removeItem(dk);hasilLap(it,j,F.t,F.f.length);}catch(e){b.disabled=false;}};
},
async izin(){clearInterval(S.tm);const [op,my]=await Promise.all([api('izinOpsi'),api('pengajuanSaya')]),NM={1:'Pagi 08:00–16:00',2:'Sore 16:00–00:00',3:'Malam 00:00–08:00'},F={j:'Sakit',s:null,f:null},
  kd=t=>{const d=new Date(t+'T00:00:00');return d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});},ST={Menunggu:'MENUNGGU KONFIRMASI',Disetujui:'DISETUJUI',Ditolak:'DITOLAK'},
  hist=my.map(x=>{const tm=x.dibuat_pada&&!isNaN(+x.dibuat_pada)?' · diajukan '+jam(+x.dibuat_pada)+' WIB':'';
    return `<div class="card pj p-${esc(x.status)}" id="pj_${esc(x.id)}"><div class="row"><b>${x.jenis==='Sakit'?'Sakit (S)':'Izin (I)'}</b><span class="tag ${esc(x.status)}" style="flex:0;white-space:nowrap">${ST[x.status]||esc(x.status).toUpperCase()}</span></div>
    <small>${esc(kd(x.tanggal))} · Shift ${esc(x.kode_shift)}${tm}${x.ada_bukti?' · bukti terlampir':''}</small><p class="clamp">${esc(x.keterangan)}</p>
    ${x.status==='Ditolak'?`<div class="tgp"><b>Catatan penolakan:</b> ${x.catatan_admin?esc(x.catatan_admin):'tidak ada keterangan, hubungi pengelola'}</div>`:''}${x.status!=='Menunggu'&&x.diproses_oleh?`<small class="mut">Diproses oleh ${esc(x.diproses_oleh)}</small>`:''}
    ${x.status==='Menunggu'?`<button class="sec sm" data-bt="${esc(x.id)}" style="margin-top:8px">Batalkan pengajuan</button>`:''}</div>`;}).join('')||'<div class="card mut">Belum ada pengajuan.</div>';
  $('#app').innerHTML=`<h1>Pengajuan Izin / Sakit</h1><div class="warn" style="margin:0 0 10px">Pengajuan hanya berlaku untuk shift yang belum diabsen. Setelah dikirim, tombol absen untuk shift itu terkunci sampai pengelola memprosesnya.</div>`+
  (op.length?`<div class="card lf"><label>Jenis ketidakhadiran</label><div class="tg2"><button type="button" class="tb on" data-j="Sakit">Sakit (S)</button><button type="button" class="tb" data-j="Izin">Izin Resmi (I)</button></div>
  <label>Shift & tanggal berhalangan <span class="req">wajib</span></label><div id="zl">${op.map((o,i)=>`<button type="button" class="zo" data-i="${i}"><b>${esc(kd(o.tanggal))}</b><small>Shift ${o.kode} · ${NM[o.kode]} WIB</small></button>`).join('')}</div>
  <label for="ik">Alasan & keterangan rinci <span class="req">wajib</span><span id="ic" class="mut" style="float:right">0/300</span></label><textarea id="ik" rows="3" maxlength="300" placeholder="Contoh: demam tinggi 38,5°C, diperiksa di puskesmas…"></textarea>
  <label>Bukti surat dokter / undangan <span class="mut" style="font-weight:400">(opsional)</span></label><div id="zf" class="fg"></div><button class="big" id="zs">Kirim Pengajuan</button></div>`:
  `<div class="card lockc"><b>Tidak ada shift yang bisa diajukan</b><p class="mut">Pengajuan hanya untuk shift terjadwal yang belum diabsen dan belum berakhir. Pastikan jadwal Anda sudah diisi pengelola.</p></div>`)+`<h2>Riwayat pengajuan</h2>${hist}`;
  document.querySelectorAll('[data-bt]').forEach(b=>b.onclick=async()=>{if(!confirm('Batalkan pengajuan ini? Shift tersebut akan bisa diabsen kembali.'))return;const c=$('#pj_'+b.dataset.bt);c.hidden=true;
    try{await api('batalkanPengajuan',{id:b.dataset.bt});toast('Pengajuan dibatalkan');V.izin();}catch(e){c.hidden=false;}});
  if(!op.length)return;
  const $$=q=>document.querySelectorAll(q),drawF=()=>{$('#zf').innerHTML=F.f?`<div class="th"><img src="${esc(F.f)}" alt="Bukti"><button type="button" class="x" id="zx" aria-label="Hapus bukti">✕</button></div>`:`<button type="button" class="th add" id="za"><span>+ Foto / dokumen</span></button>`;};
  $$('.tb').forEach(b=>b.onclick=()=>{F.j=b.dataset.j;$$('.tb').forEach(y=>y.classList.toggle('on',y===b));});
  $$('.zo').forEach(b=>b.onclick=()=>{F.s=F.s===+b.dataset.i?null:+b.dataset.i;$$('.zo').forEach(y=>y.classList.toggle('on',F.s!==null&&+y.dataset.i===F.s));});
  if(op.length===1){F.s=0;$$('.zo')[0].classList.add('on');}
  $('#ik').oninput=()=>{$('#ic').textContent=$('#ik').value.length+'/300';};drawF();
  $('#zf').onclick=async e=>{if(e.target.closest('#zx')){F.f=null;drawF();return;}if(e.target.closest('#za')){const d=await pilihBukti();if(d){F.f=d;drawF();}}};
  $('#zs').onclick=async()=>{const k=$('#ik').value.trim();if(F.s===null)return toast('Pilih shift yang berhalangan',1);if(k.length<5)return toast('Alasan minimal 5 huruf',1);
    const o=op[F.s],b=$('#zs');b.disabled=true;try{await api('ajukan',{tanggal:o.tanggal,kode:o.kode,jenis:F.j,ket:k,foto:F.f});
      $('#app').innerHTML=`<div class="okscreen"><div class="okc H">${svg('<path d="M5 12.5l4.5 4.5L19 7"/>',44)}</div><h1>Pengajuan terkirim</h1><span class="tag Menunggu">MENUNGGU KONFIRMASI</span><p class="mut">${esc(F.j)} · ${esc(kd(o.tanggal))} · Shift ${o.kode}</p><div class="warn">Pengelola akan memprosesnya. Tombol absen untuk shift ini terkunci selama menunggu.</div>
      <button class="big abs" onclick="go('izin')">Lihat riwayat pengajuan</button><button class="sec big" style="margin-top:8px" onclick="boot()">Kembali ke Beranda</button></div>`;}catch(e){b.disabled=false;}};
},
async jadwal(){const b=S.vb||today().slice(0,7);S.vb=b;const [j,rw]=await Promise.all([api('jadwalSaya',{bulan:b}),api('riwayatSaya',{bulan:b})]),td=today(),n0=new Date(Date.now()+S.off),
  nowM=+n0.toLocaleString('en-GB',{hour:'numeric',hour12:false,timeZone:'Asia/Jakarta'})*60+ +n0.toLocaleString('en-GB',{minute:'numeric',timeZone:'Asia/Jakarta'}),BK={1:360,2:840,3:-1},
  NM={1:'Pagi 08:00–16:00',2:'Sore 16:00–00:00',3:'Malam 00:00–08:00'},HR=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],used={},X=[];
  const ftg=t=>{const d=new Date(t+'T00:00:00');return HR[d.getDay()]+', '+d.getDate()+' '+d.toLocaleDateString('id-ID',{month:'short'});};
  j.forEach(x=>{const a=rw.find(r=>r.tanggal===x.tanggal&&+r.kode_shift===+x.kode);if(a)used[a.tanggal+'|'+a.kode_shift]=1;X.push({tanggal:x.tanggal,kode:+x.kode,a:a||null});});
  rw.forEach(a=>{if(!used[a.tanggal+'|'+a.kode_shift])X.push({tanggal:a.tanggal,kode:+a.kode_shift,a:a});});
  const sk=x=>{if(x.a){const s=String(x.a.status);if(s==='A')return 'A';if(s==='I'||s==='S')return 'IS';if(s.indexOf('T')===0)return 'T';if(s.indexOf('PC')>=0)return 'PC';return 'H';}
    if(x.tanggal<td)return 'A';if(x.tanggal>td)return 'UP';return nowM<BK[x.kode]?'UP':'BL';};
  const up=X.filter(x=>sk(x)==='UP').sort((p,q)=>p.tanggal<q.tanggal?-1:1),ri=X.filter(x=>sk(x)!=='UP').sort((p,q)=>p.tanggal<q.tanggal?1:-1),cnt=k=>ri.filter(x=>sk(x)===k).length,
  H=cnt('H'),T=cnt('T'),PC=cnt('PC'),IS=cnt('IS'),A=cnt('A'),dn=H+T+PC+A,dis=dn?Math.round(H/dn*1000)/10:0,c3=[1,2,3].map(k=>j.filter(x=>+x.kode===k).length),fv=S.vf||'';
  const LB={H:['HADIR','H'],T:['TERLAMBAT','T'],PC:['PULANG CEPAT','PC'],A:['ALPA','A'],BL:['BELUM ABSEN','Menunggu'],UP:['AKAN DATANG','']},
  cd=x=>{const s=sk(x),a=x.a,l=s==='IS'?[a.status==='S'?'SAKIT':'IZIN',a.status]:(s==='A'&&!a?['TIDAK ABSEN','A']:LB[s]),dj=a&&a.jam_masuk&&!isNaN(+a.jam_masuk),
    jr=a&&a.jarak_masuk!==''&&a.jarak_masuk!=null?' · '+esc(a.jarak_masuk)+' m dari pos':'';
    return `<div class="card jd j${x.kode} jc${x.tanggal===td?' now':''}" data-s="${s}"><div class="row"><b>${esc(ftg(x.tanggal))}</b><span class="chip s${x.kode}" style="flex:0">Shift ${x.kode}</span><span class="tag ${l[1]}" style="flex:0;white-space:nowrap">${l[0]}</span></div>
    <small>${NM[x.kode]}${x.tanggal===td?' · <b>HARI INI</b>':''}</small>${dj?`<div class="dt">Datang <b>${jam(+a.jam_masuk)}</b> · Pulang <b>${a.jam_pulang&&!isNaN(+a.jam_pulang)?jam(+a.jam_pulang):'–'}</b>${jr}</div>`:''}
    ${a&&a.catatan?`<small class="mut">${esc(a.catatan)}</small>`:''}${a&&a.dikoreksi?'<small class="mut"><br>Dikoreksi oleh pengelola</small>':''}</div>`;},
  wkd=(()=>{const g=new Date(td+'T00:00:00').getDay(),dw=(g+6)%7;return Array.from({length:7},(_,i)=>{const t=geser(td,i-dw),x=j.find(y=>y.tanggal===t);return {t:t,n:['Sen','Sel','Rab','Kam','Jum','Sab','Min'][i],d:+t.slice(8),k:x?+x.kode:0};});})();
  $('#app').innerHTML=head()+`<h1>Jadwal & Riwayat</h1><input id="vb" type="month" value="${b}" aria-label="Pilih bulan">
  <div class="stg3">${[['HADIR','h',H],['TERLAMBAT','t',T],['PULANG CEPAT','p',PC],['IZIN / SAKIT','i',IS],['ALPA','a',A],['DISIPLIN','d',dn?dis+'%':'–']].map(x=>`<div class="st ${x[1]}"><small>${x[0]}</small><b>${x[2]}</b></div>`).join('')}</div>
  <div class="comp"><span class="chip s1">Pagi ${c3[0]}</span><span class="chip s2">Sore ${c3[1]}</span><span class="chip s3">Malam ${c3[2]}</span><small class="mut">jadwal bulan ini</small></div>
  ${b===td.slice(0,7)?`<h2>Pekan ini</h2><div class="wk">${wkd.map(w=>`<div class="${w.t===td?'today':''}"><small>${w.n}</small><b>${w.d}</b><i class="${w.k?'s'+w.k:''}"></i></div>`).join('')}</div>`:''}
  <div class="fchips" style="margin:12px 0 4px">${[['','Semua'],['H','Hadir'],['T','Terlambat'],['PC','Pulang cepat'],['IS','Izin/Sakit'],['A','Alpa']].map(([k,l])=>`<button data-k="${k}" class="${fv===k?'on':''}">${l}</button>`).join('')}</div>
  <div id="sup">${up.length?`<h2>Jadwal mendatang</h2>${up.slice(0,7).map(cd).join('')}`:''}</div>
  <div id="sri"><h2>Riwayat</h2>${ri.map(cd).join('')||'<div class="card mut">Belum ada riwayat pada bulan ini.</div>'}</div><div id="sem" class="card mut" hidden>Tidak ada data untuk filter ini.</div>
  <div class="card cta"><b>Perlu penyesuaian jadwal?</b><p class="mut" style="margin:4px 0 10px">Ajukan izin atau sakit sebelum shift dimulai.</p><button class="big" onclick="go('izin')">Ajukan Izin / Sakit</button></div>`;
  $('#vb').onchange=e=>{S.vf='';S.vb=e.target.value;V.jadwal();};
  const ft=()=>{let m=0;document.querySelectorAll('.jc').forEach(c=>{const v=!S.vf||c.dataset.s===S.vf;c.hidden=!v;if(v)m++;});$('#sem').hidden=!(m===0&&(up.length+ri.length)>0);$('#sup').hidden=!!S.vf;};
  document.querySelectorAll('.fchips button').forEach(bt=>bt.onclick=()=>{S.vf=bt.dataset.k;document.querySelectorAll('.fchips button').forEach(y=>y.classList.toggle('on',y===bt));ft();});ft();}

};
const jarak=(a,b,c,d)=>{const R=6371000,r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return Math.round(2*R*Math.asin(Math.sqrt(h)));};
const STL={H:'Hadir tepat waktu',T:'Terlambat',PC:'Pulang cepat','T+PC':'Terlambat & pulang cepat'};
function presensiCard(it){const w=it.w,k=it.kode,n=Date.now()+S.off,NM={1:'Pagi (08:00 – 16:00)',2:'Sore (16:00 – 00:00)',3:'Malam (00:00 – 08:00)'}[k],
  lock='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  tg={belum:w.buka,datang:w.da,pulang:w.pa}[it.state]||0,lb={belum:'Dibuka dalam',datang:'Batas tepat waktu',pulang:'Batas absen pulang'}[it.state]||'',
  msg={belum:`Absen datang dibuka pukul ${jam(w.buka)} WIB`,datang:`Jendela absen datang terbuka — tepat waktu sampai ${jam(w.da)} WIB`,pulang:`Sedang bertugas — pulang mulai ${jam(w.pm)} WIB`,lewat:'Waktu pulang terlewat — dicatat Pulang Cepat (PC) otomatis',selesai:'Shift selesai — terima kasih',menunggu:'Pengajuan menunggu persetujuan pengelola',alpa:'Tidak absen (Alpa)'}[it.state]||(ST[it.state]||it.state);
  let act='';
  if(it.state==='belum')act=`<button class="big abs off" disabled>${lock}<span>ABSEN DATANG · dibuka <b class="cdn mono" data-tg="${w.buka}" data-rl="1">--:--:--</b></span></button>`;
  if(it.state==='datang'){const late=n>w.da;act=`<button class="big abs${late?' late':''}" data-da="${w.da}" onclick="mulai('absenDatang','${it.tanggal}',${k},0)"><span class="al">${late?'ABSEN DATANG (TERLAMBAT)':'ABSEN DATANG SEKARANG'} →</span></button>`;}
  if(it.state==='belum'||it.state==='datang')act+=`<div class="lockrow">${lock}<span>Absen Pulang (Shift ${k})</span><small>Terbuka pukul ${jam(w.pm)} WIB</small></div>`;
  if(it.state==='pulang'){const early=n<w.pm;act=`<button class="big abs${early?' late':''}" onclick="mulai('absenPulang','${it.tanggal}',${k},${w.pm})">${early?'ABSEN PULANG (LEBIH CEPAT)':'ABSEN PULANG SEKARANG'} →</button>`+(early?`<div class="warn">Pulang sebelum ${jam(w.pm)} WIB akan dicatat <b>Pulang Cepat (PC)</b>.</div>`:'');}
  return `<div class="shiftcard s${k}"><div class="row"><b>Shift ${k} ${NM} WIB</b>${it.status?`<span class="tag ${it.status}" style="flex:0">${it.status}</span>`:''}</div><small style="color:#fffc">Jam resmi server · ${esc(it.tanggal)}</small><div class="clkbig mono clk">--:--:--</div>
  <div class="msg">${esc(msg)}</div>${tg&&it.state!=='belum'?`<div class="row" style="margin-top:8px"><small style="color:#fffc">${lb}</small><b class="mono cdn" data-tg="${tg}" style="text-align:right">--:--:--</b></div>`:''}</div>${act}`;}
function mulai(a,tg,kd,pm){if(a==='absenPulang'&&pm&&Date.now()+S.off<pm&&!confirm('Anda akan absen pulang sebelum jam pulang ('+jam(pm)+' WIB). Status akan dicatat Pulang Cepat (PC). Lanjutkan?'))return;absen(a,tg,kd);}
function hasil(a,r,kd,g){const dat=a==='absenDatang',sc=r.status==='H'?'H':r.status==='T'?'T':'PC';if(navigator.vibrate)navigator.vibrate(150);
  $('#app').innerHTML=`<div class="okscreen"><div class="okc ${sc}">${svg('<path d="M5 12.5l4.5 4.5L19 7"/>',44)}</div><h1>${dat?'Absen datang berhasil':'Absen pulang berhasil'}</h1><span class="tag ${r.status}">${esc((STL[r.status]||r.status).toUpperCase())} (${esc(r.status)})</span>
  <p class="mut">Shift ${esc(kd)} · ${new Date(Date.now()+S.off).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'})} WIB${g&&g.d?' · '+g.d+' m dari pos':''}</p>${sc==='H'?'':`<div class="warn">${r.status==='T'?'Anda tercatat terlambat pada shift ini.':'Pulang lebih cepat dari jam yang ditentukan.'}</div>`}<button class="big abs" onclick="boot()">Kembali ke Beranda</button></div>`;}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.u&&S.u.role==='satpam'&&S.tab==='home'&&!document.querySelector('.cam')&&!document.querySelector('.okscreen'))go('home');});
const AREA_DEF=['Gerbang utama','Parkir','Gedung kelas','Laboratorium','Lapangan','Kantin','Lainnya'];
function ambilFoto(){return new Promise(res=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.capture='environment';i.onchange=async()=>res(i.files[0]?await kecil(i.files[0]):null);i.click();});}
function hasilLap(it,jenis,tingkat,nf){if(navigator.vibrate)navigator.vibrate(120);const pn=tingkat==='Penting';
  $('#app').innerHTML=`<div class="okscreen"><div class="okc ${pn?'PC':'H'}">${svg('<path d="M5 12.5l4.5 4.5L19 7"/>',44)}</div><h1>Laporan terkirim</h1><span class="tag ${pn?'A':'H'}">${pn?'PENTING / DARURAT':'BIASA / RUTIN'}</span>
  <p class="mut">${esc(jenis)} · Shift ${esc(it.kode)} · ${new Date(Date.now()+S.off).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'})} WIB${nf?' · '+nf+' foto':''}</p>${pn?'<div class="warn">Laporan ditandai penting dan akan ditinjau pengelola sekolah.</div>':''}
  <button class="big abs" onclick="V.laporan()">Buat laporan lagi</button><button class="sec big" style="margin-top:8px" onclick="boot()">Kembali ke Beranda</button></div>`;}
async function absen(a,tg,kd){
  const pos=await api('posSaya'),dat=a==='absenDatang',lb=dat?'DATANG':'PULANG';let strm,wid,g=null,foto=null;
  const stop=()=>{if(strm)strm.getTracks().forEach(t=>t.stop());if(wid!=null)navigator.geolocation.clearWatch(wid);};
  clearInterval(S.tm);nav();
  $('#app').innerHTML=`<div class="row" style="flex-wrap:nowrap"><button class="sec" id="cb" style="flex:0">←</button><h1 style="flex:1;margin:0">Kamera Presensi · ${lb}</h1></div><p class="mut" style="margin:6px 0">Pastikan wajah terlihat jelas dan Anda berada di dalam radius pos jaga.</p>
  <div class="cam"><video id="vd" autoplay playsinline muted></video><canvas id="cv" hidden></canvas><div class="face"></div></div>
  <div class="card"><div class="row"><b>Validasi radius</b><span id="gv" class="tag" style="flex:0">Mencari GPS…</span></div><small id="gt">Menunggu sinyal GPS${pos.lat==null?' · koordinat pos belum diatur pengelola':''}</small><p class="mono" id="gc" style="margin:6px 0 0">-</p></div>
  <button class="big abs" id="shot">AMBIL FOTO SELFIE</button><button class="sec big" id="re" hidden style="margin-top:8px">Ambil ulang foto</button>`;
  const sync=()=>{const ok=!!foto&&!!g&&(pos.lat==null||g.d<=pos.radius);const sb=$('#shot');if(foto){sb.textContent='KIRIM ABSEN '+lb+' →';sb.disabled=!ok;}};
  $('#cb').onclick=()=>{stop();boot();};
  try{strm=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});$('#vd').srcObject=strm;}catch(e){toast('Kamera tidak bisa dibuka, memakai kamera bawaan HP',1);}
  wid=navigator.geolocation.watchPosition(p=>{g={lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)};
    const ok=pos.lat==null||(g.d=jarak(g.lat,g.lng,pos.lat,pos.lng))<=pos.radius;if(pos.lat==null)g.d=0;
    $('#gv').className='tag '+(ok?'H':'A');$('#gv').textContent=ok?'VALID'+(pos.lat==null?'':' ('+g.d+' m)'):'DI LUAR RADIUS';
    $('#gt').textContent=pos.lat==null?'Koordinat pos belum diatur — server yang memvalidasi':(ok?'Dalam radius pos jaga '+esc(pos.nama):g.d+' m dari pos (maks '+pos.radius+' m)');
    $('#gc').textContent=g.lat.toFixed(6)+', '+g.lng.toFixed(6)+' · akurasi ±'+g.acc+' m';sync();},()=>toast('Aktifkan izin lokasi (GPS)',1),{enableHighAccuracy:true,maximumAge:5000});
  $('#re').onclick=()=>{foto=null;$('#cv').hidden=true;$('#vd').hidden=false;$('#re').hidden=true;$('#shot').disabled=false;$('#shot').textContent='AMBIL FOTO SELFIE';};
  $('#shot').onclick=async()=>{
    if(!foto){const v=$('#vd'),c=$('#cv');
      if(strm&&v.videoWidth){const k=Math.min(1,720/Math.max(v.videoWidth,v.videoHeight));c.width=v.videoWidth*k;c.height=v.videoHeight*k;c.getContext('2d').drawImage(v,0,0,c.width,c.height);foto=c.toDataURL('image/jpeg',.6);c.hidden=false;v.hidden=true;}
      else foto=(await pilihFoto(0))[0];
      if(!foto)return;$('#re').hidden=false;sync();return;}
    try{const r=await api(a,{tanggal:tg,kode:kd,foto:foto,lat:g.lat,lng:g.lng});stop();hasil(a,r,kd,g);}catch(e){}};
}
// ================= ADMIN =================
const bln=()=>`<input id="bl" type="month" value="${today().slice(0,7)}">`;
const A={
async akun(){pwView(0);},
async dashboard(){const b=S.db||today().slice(0,7);S.db=b;const r=await api('dashboard',{bulan:b}),k=r.kpi;
  const C={H:'#10B981',T:'#F59E0B',PC:'#F97316',I:'#6366F1',S:'#8B5CF6',A:'#EF4444'},K=Object.keys(C),tot={};
  K.forEach(x=>tot[x]=r.rekap.reduce((a,y)=>a+y[x],0));const sum=K.reduce((a,x)=>a+tot[x],0),dn=tot.H+tot.T+tot.PC+tot.A,dis=dn?Math.round(tot.H/dn*1000)/10:0;
  let a=0;const cg=sum?K.map(x=>{const s0=a;a+=tot[x]/sum*100;return `${C[x]} ${s0}% ${a}%`}).join(','):'#E2E8F0 0 100%';
  const mx=Math.max(1,...r.tren.map(x=>x.hadir)),st=300/Math.max(1,r.tren.length-1),pts=r.tren.map((x,i)=>`${(i*st).toFixed(1)},${(100-x.hadir/mx*90).toFixed(1)}`).join(' ');
  const ik=['<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>','<path d="M20 6L9 17l-5-5"/>','<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>','<path d="M12 3l10 18H2zM12 10v5M12 18v.5"/>','<path d="M9 12h6M9 16h6M7 3h7l5 5v13H7z"/>','<path d="M5 3v18M5 4h13l-3 4 3 4H5"/>'],jm=Math.max(1,...Object.values(r.jenis)),kp=[['Bertugas sekarang',k.bertugas,'#007BFF'],['Hadir hari ini',k.hadir,'#28A745'],['Terlambat',k.telat,'#D97706'],['Belum absen',k.belum,'#DC3545'],['Izin/Sakit menunggu',k.menunggu,'#6F42C1'],['Laporan penting',k.penting,'#FD7E14']];
  $('#app').innerHTML=`<div class="hero"><small style="color:#fff9">${SEKOLAH.nama.toUpperCase()}</small><h1>Konsol Pengawasan Keamanan & Presensi</h1><p>Halo, ${esc(S.u.nama)}. Ringkasan kedisiplinan satpam bulan berjalan.</p><div class="row"><input id="db" type="month" value="${b}"></div></div>
  <div class="kpis">${kp.map((x,i)=>`<div class="ib"><span class="ibi" style="background:${x[2]}">${svg(ik[i],30)}</span><div><small>${x[0]}</small><b>${x[1]}</b></div></div>`).join('')}</div>
  <div class="g2"><div class="card"><h2 style="margin-top:0">Kehadiran per satpam</h2>${r.rekap.map(x=>{const t=K.reduce((q,y)=>q+x[y],0)||1;return `<div><b>${esc(x.nama)}</b> <small>${K.map(y=>x[y]?y+' '+x[y]:'').filter(Boolean).join(' · ')||'belum ada data'}</small><div class="bar">${K.map(y=>`<i style="width:${x[y]/t*100}%;background:${C[y]}" title="${y}"></i>`).join('')}</div></div>`}).join('')||'<p class="mut">Belum ada data.</p>'}
  <div class="lg">${K.map(y=>`<span style="--c:${C[y]}">${y}</span>`).join('')}</div></div>
  <div class="card"><h2 style="margin-top:0">Indeks kedisiplinan</h2><div class="donut" style="background:conic-gradient(${cg})"><div>${dis}%<small>DISIPLIN</small></div></div><div class="lg">${K.map(y=>`<span style="--c:${C[y]}">${y} ${tot[y]}</span>`).join('')}</div></div></div>
  <div class="g2"><div class="card"><h2 style="margin-top:0">Tren kehadiran harian</h2><svg viewBox="0 0 300 100" width="100%" height="120" preserveAspectRatio="none" role="img" aria-label="Tren kehadiran harian"><defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B82F6" stop-opacity=".35"/><stop offset="1" stop-color="#3B82F6" stop-opacity=".02"/></linearGradient></defs><g stroke="#E9ECEF" stroke-width="1" vector-effect="non-scaling-stroke"><line x1="0" y1="10" x2="300" y2="10"/><line x1="0" y1="33" x2="300" y2="33"/><line x1="0" y1="55" x2="300" y2="55"/><line x1="0" y1="78" x2="300" y2="78"/><line x1="0" y1="100" x2="300" y2="100"/></g><polygon points="0,100 ${pts} 300,100" fill="url(#gr)"/><polyline points="${pts}" fill="none" stroke="#1E40AF" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg><small>Tanggal 1–${r.tren.length} · puncak ${mx} absen/hari</small></div>
  <div class="card"><h2 style="margin-top:0">Laporan per jenis</h2>${Object.keys(r.jenis).map(j=>`<div class="row"><span>${esc(j)}</span><b style="flex:0">${r.jenis[j]}</b></div><div class="hb"><i style="width:${r.jenis[j]/jm*100}%"></i></div>`).join('')||'<p class="mut">Belum ada laporan.</p>'}</div></div>
  <div class="g2"><div class="card"><h2 style="margin-top:0">Pengajuan menunggu</h2>${r.pengajuan.map(p=>`<div class="row" style="margin-bottom:10px"><div><b>${esc(p.nama)}</b> <span class="tag ${p.jenis==='Sakit'?'S':'I'}">${p.jenis}</span><br><small>${p.tanggal} · ${SHN[p.kode_shift]} · ${esc(p.keterangan)}</small></div><div class="row" style="flex:0"><button class="bad" onclick="proses('${p.id}',0)">Tolak</button><button class="ok" onclick="proses('${p.id}',1)">Setujui</button></div></div>`).join('')||'<p class="mut">Tidak ada pengajuan menunggu.</p>'}</div>
  <div class="card"><h2 style="margin-top:0">Laporan terbaru</h2>${r.laporan.map(l=>`<div style="margin-bottom:10px"><b>${esc(l.jenis)}</b> <span class="tag ${l.tingkat==='Penting'?'A':''}">${esc(l.tingkat)}</span><br><small>${esc(l.nama)} · ${l.tanggal} · ${esc(l.lokasi)}</small></div>`).join('')||'<p class="mut">Belum ada laporan.</p>'}</div></div>`;
  $('#db').onchange=e=>{S.db=e.target.value;A.dashboard();};},
async jadwal(){const b=S.bl||today().slice(0,7);S.bl=b;const r=await api('jadwalAdmin',{bulan:b}),n=new Date(b.slice(0,4),b.slice(5),0).getDate(),td=today(),m={},dn=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  r.jadwal.forEach(x=>m[x.tanggal+'|'+x.id]=x.kode);
  const days=Array.from({length:n},(_,i)=>{const t=b+'-'+String(i+1).padStart(2,'0'),w=new Date(t+'T00:00:00').getDay();return {t:t,i:i+1,d:dn[w],wk:w===0||w===6};}),br=S.br===undefined?'':S.br;
  $('#app').innerHTML=`<div class="hero"><h1>Pengaturan & Jadwal Shift Satpam</h1><p>Pilih mode isi, lalu ketuk sel pada matriks. Perubahan tersimpan otomatis.</p><div class="row"><input id="bl" type="month" value="${b}"><button id="ar" class="sec">Auto-Rotasi 3 Shift</button><button id="kb" class="sec">Kosongkan Bulan</button></div></div>
  <div class="card lgd"><b>Mode isi:</b><button class="mode ${br===''?'sel':''}" data-b="">Ketuk = ganti</button>${[[1,'Pagi'],[2,'Sore'],[3,'Malam'],[0,'Libur']].map(([k,l])=>`<button class="mode sc c${k} ${br===String(k)?'sel':''}" data-b="${k}" aria-label="Isi ${l}">${k||'L'}</button>`).join('')}<small style="flex-basis:100%">1 Pagi 08–16 · 2 Sore 16–00 · 3 Malam 00–08 (mulai pukul 00:00 pada tanggal itu; absen dibuka 22:00 malam sebelumnya) · L Libur</small></div>
  <div class="card scroll"><table class="mx"><tr><th class="stk">Satpam</th>${days.map(x=>`<th class="${x.t===td?'tdy':''} ${x.wk?'wk':''}">${x.d}<br>${x.i}</th>`).join('')}</tr>`+
  (r.satpam.map(q=>`<tr><td class="stk"><b>${esc(q.nama)}</b></td>`+days.map(x=>{const v=m[x.t+'|'+q.id]||0;return `<td class="${x.t===td?'tdy':''}"><button class="sc c${v}" data-t="${x.t}" data-i="${q.id}" data-v="${v}" aria-label="${esc(q.nama)} tanggal ${x.i}">${v||'L'}</button></td>`;}).join('')+'</tr>').join('')||'<tr><td>Belum ada satpam aktif. Tambahkan di menu Data Satpam.</td></tr>')+
  [1,2,3].map(k=>`<tr class="ft"><td class="stk">Σ Shift ${k}</td>${days.map(x=>`<td data-c="${k}|${x.t}">0</td>`).join('')}</tr>`).join('')+'</table></div><small>Baris Σ menunjukkan jumlah petugas per shift tiap hari; angka merah berarti shift itu belum ada petugasnya.</small>';
  const cov=()=>{[1,2,3].forEach(k=>days.forEach(x=>{const c=document.querySelector(`[data-c="${k}|${x.t}"]`),q=document.querySelectorAll(`.mx .sc[data-t="${x.t}"][data-v="${k}"]`).length;c.textContent=q;c.classList.toggle('zr',q===0);}));};cov();
  $('#bl').onchange=e=>{S.bl=e.target.value;A.jadwal();};
  document.querySelectorAll('.mode').forEach(x=>x.onclick=()=>{S.br=x.dataset.b;document.querySelectorAll('.mode').forEach(y=>y.classList.toggle('sel',y===x));});
  document.querySelectorAll('.mx .sc').forEach(bt=>{bt.dataset.s=bt.dataset.v;const set=v=>{bt.dataset.v=v;bt.className='sc c'+v;bt.textContent=v||'L';cov();};
    bt.onclick=()=>{const o=+bt.dataset.v,nv=S.br===''||S.br===undefined?(o+1)%4:+S.br;if(nv===o)return;set(nv);
      bt._q=(bt._q||Promise.resolve()).then(async()=>{const v=+bt.dataset.v;if(+bt.dataset.s===v)return;try{await api('simpanJadwal',{tanggal:bt.dataset.t,id:bt.dataset.i,kode:v||''},1);bt.dataset.s=v;}catch(e){set(+bt.dataset.s);}});};});
  $('#ar').onclick=async()=>{if(!r.satpam.length||!confirm('Isi otomatis jadwal bulan ini dengan rotasi 3 shift? Jadwal bulan ini akan diganti.'))return;const P=[1,1,2,2,3,3,0],items=[];
    r.satpam.forEach((q,si)=>days.forEach((x,di)=>items.push({tanggal:x.t,id:q.id,kode:P[(di+si*2)%7]||''})));await api('simpanJadwalMassal',{items:items});toast('Jadwal terisi otomatis');A.jadwal();};
  $('#kb').onclick=async()=>{if(!r.jadwal.length||!confirm('Kosongkan seluruh jadwal bulan ini?'))return;await api('simpanJadwalMassal',{items:r.jadwal.map(x=>({tanggal:x.tanggal,id:x.id,kode:''}))});toast('Jadwal dikosongkan');A.jadwal();};},
async absen(){const t=S.at||today();S.at=t;const [ab,ja]=await Promise.all([api('absensiHari',{tanggal:t}),api('jadwalAdmin',{bulan:t.slice(0,7)})]),nm={},used={},R=[];
  ja.satpam.forEach(s=>nm[s.id]=s.nama);
  ja.jadwal.filter(x=>x.tanggal===t).forEach(x=>{const a=ab.find(q=>String(q.id_satpam)===String(x.id)&&+q.kode_shift===+x.kode);if(a)used[a.id]=1;R.push({nama:nm[x.id]||x.id,uid:x.id,kode:+x.kode,a:a||null});});
  ab.forEach(a=>{if(!used[a.id])R.push({nama:a.nama,uid:a.id_satpam,kode:+a.kode_shift,a:a});});
  R.sort((p,q)=>p.kode-q.kode||String(p.nama).localeCompare(String(q.nama)));S.ar=R;
  const td=today(),n0=new Date(Date.now()+S.off),nowM=+n0.toLocaleString('en-GB',{hour:'numeric',hour12:false,timeZone:'Asia/Jakarta'})*60+ +n0.toLocaleString('en-GB',{minute:'numeric',timeZone:'Asia/Jakarta'}),BK={1:360,2:840,3:-1};
  const st=x=>x.a?String(x.a.status):'',kind=x=>t<td?'alpa':t>td?'nanti':(nowM<BK[x.kode]?'nanti':'belum'),
  cat=x=>{const s=st(x);if(!x.a)return kind(x)==='nanti'?'NT':'BL';if(s==='A')return 'BL';if(s==='I'||s==='S')return 'IS';if(s.indexOf('T')===0)return 'T';if(s.indexOf('PC')>=0)return 'PC';return 'H';},
  STN={H:'Hadir',T:'Terlambat',PC:'Pulang cepat','T+PC':'Terlambat + PC',I:'Izin',S:'Sakit',A:'Alpa'},TG={belum:'<span class="tag Menunggu">BELUM ABSEN</span>',alpa:'<span class="tag A">TIDAK ABSEN</span>',nanti:'<span class="tag">BELUM MULAI</span>'};
  const c=[['Terjadwal',R.length,'#007BFF','cal'],['Sudah hadir',R.filter(x=>x.a&&x.a.jam_masuk).length,'#28A745','ok'],['Terlambat',R.filter(x=>st(x).indexOf('T')===0).length,'#D97706','clk'],['Pulang cepat',R.filter(x=>st(x).indexOf('PC')>=0).length,'#FD7E14','out'],['Izin / Sakit',R.filter(x=>cat(x)==='IS').length,'#6F42C1','doc'],['Belum absen / Alpa',R.filter(x=>cat(x)==='BL').length,'#DC3545','al']];
  const dm=m=>m?(isNaN(+m)?'–':jam(+m)):'–',jr=v=>(v===''||v===undefined||v===null)?'–':v+' m',fs=S.af||'',fst=S.as||'';
  $('#app').innerHTML=`<div class="hero"><h1>Absensi Harian</h1><p>Pantau kehadiran per shift. Selfie dan jarak ke pos tersedia pada tiap baris.</p><div class="row dn"><button class="sec" id="d0" aria-label="Hari sebelumnya">‹</button><input id="at" type="date" value="${t}" aria-label="Tanggal"><button class="sec" id="d1" aria-label="Hari berikutnya">›</button><button class="sec" id="dt">Hari ini</button><button class="sec" id="csv">Ekspor CSV</button></div></div>
  <div class="kpis cmp">${c.map(x=>`<div class="ib"><span class="ibi" style="background:${x[2]}">${svg(KI[x[3]],22)}</span><div><small>${x[0]}</small><b>${x[1]}</b></div></div>`).join('')}</div>
  <div class="card"><div class="row fl"><div class="fchips">${[['','Semua shift'],['1','Shift 1'],['2','Shift 2'],['3','Shift 3']].map(([k,l])=>`<button data-k="${k}" class="${fs===k?'on':''}">${l}</button>`).join('')}</div>
  <select id="as" aria-label="Filter status">${[['','Semua status'],['H','Hadir tepat waktu'],['T','Terlambat'],['PC','Pulang cepat'],['IS','Izin / Sakit'],['BL','Belum absen / Alpa'],['NT','Belum mulai']].map(([k,l])=>`<option value="${k}" ${fst===k?'selected':''}>${l}</option>`).join('')}</select><input id="aq" placeholder="Cari nama petugas…" aria-label="Cari nama petugas" value="${esc(S.aq||'')}"></div>
  <div class="scroll"><table class="rtab"><thead><tr><th>Petugas</th><th>Shift</th><th>Datang</th><th>Pulang</th><th>Jarak</th><th>Status</th><th>Bukti</th><th>Aksi</th></tr></thead><tbody>`+
  (R.map((x,ix)=>{const a=x.a,s=st(x),f=a?[a.foto_masuk,a.foto_pulang]:['',''],ids=f.filter(Boolean).join(','),lb=[f[0]?'Datang':'',f[1]?'Pulang':''].filter(Boolean).join(',');
    return `<tr class="ar" data-i="${ix}" data-n="${esc(String(x.nama).toLowerCase())}" data-k="${x.kode}" data-s="${cat(x)}"><td><b>${esc(x.nama)}</b>${a&&a.catatan?`<br><small>${esc(a.catatan)}</small>`:''}${a&&a.dikoreksi_oleh?`<br><small class="kor">✎ Dikoreksi oleh ${esc(a.dikoreksi_oleh)}</small>`:''}</td><td data-label="Shift"><span class="chip s${x.kode}">Shift ${x.kode}</span></td><td data-label="Datang" class="mono">${a?dm(a.jam_masuk):'–'}</td><td data-label="Pulang" class="mono">${a?dm(a.jam_pulang):'–'}</td><td data-label="Jarak">${a?jr(a.jarak_masuk):'–'}</td><td data-label="Status">${a?`<span class="tag ${s}">${esc(STN[s]||s).toUpperCase()}</span>`:TG[kind(x)]}</td><td data-label="Bukti">${ids?`<button class="sec sm" data-f="${esc(ids)}" data-l="${esc(lb)}" data-j="Selfie · ${esc(x.nama)}">Selfie</button>`:'–'}</td><td data-label="Aksi"><button class="sec sm" data-kor="${ix}">${a?'Koreksi':'Isi manual'}</button></td></tr>`;}).join('')||'<tr><td colspan="8" class="mut">Tidak ada jadwal atau absensi pada tanggal ini.</td></tr>')+`</tbody></table></div><small id="ac" class="mut"></small></div>`;
  const go_=v=>{S.at=v;A.absen();};$('#at').onchange=e=>go_(e.target.value||today());$('#d0').onclick=()=>go_(geser(t,-1));$('#d1').onclick=()=>go_(geser(t,1));$('#dt').onclick=()=>go_(today());
  const ft=()=>{const q=$('#aq').value.trim().toLowerCase();let m=0;document.querySelectorAll('tr.ar').forEach(r=>{const v=(!S.af||r.dataset.k===S.af)&&(!S.as||r.dataset.s===S.as)&&(!q||r.dataset.n.indexOf(q)>=0);r.hidden=!v;if(v)m++;});$('#ac').textContent=R.length?'Menampilkan '+m+' dari '+R.length+' baris':'';$('#csv').textContent='Ekspor CSV ('+m+')';};
  document.querySelectorAll('.fchips button').forEach(b=>b.onclick=()=>{S.af=b.dataset.k;document.querySelectorAll('.fchips button').forEach(y=>y.classList.toggle('on',y===b));ft();});
  document.querySelectorAll('[data-kor]').forEach(b=>b.onclick=()=>koreksi(+b.dataset.kor));
  const lbl=x=>x.a?(STN[st(x)]||st(x)):({belum:'Belum absen',alpa:'Tidak absen',nanti:'Belum mulai'})[kind(x)];
  $('#csv').onclick=()=>{const L=[...document.querySelectorAll('tr.ar')].filter(r=>!r.hidden).map(r=>R[+r.dataset.i]);if(!L.length)return toast('Tidak ada baris untuk diekspor',1);unduhTeks('absensi_'+t+'.csv',csvAbsensi(L,t,lbl));toast('CSV diunduh ('+L.length+' baris)');};
  $('#as').onchange=e=>{S.as=e.target.value;ft();};$('#aq').oninput=e=>{S.aq=e.target.value;ft();};ft();},
async pengajuan(){const r=await api('listPengajuan'),f=S.pf||'Semua',c=x=>r.filter(p=>p.status===x).length;S.pf=f;
  $('#app').innerHTML=`<div class="hero"><small style="color:#fff9">MANAJEMEN PENGAJUAN</small><h1>Izin & Sakit Satpam</h1><p>Tinjau bukti, lalu setujui atau tolak. Keputusan langsung masuk ke rekap.</p></div>
  <div class="kpis3"><div class="kpi" style="--c:#F59E0B"><b>${c('Menunggu')}</b><small>Menunggu</small></div><div class="kpi" style="--c:#10B981"><b>${c('Disetujui')}</b><small>Disetujui</small></div><div class="kpi" style="--c:#EF4444"><b>${c('Ditolak')}</b><small>Ditolak</small></div></div>
  <div class="seg tabs" style="margin:12px 0">${['Semua','Menunggu','Disetujui','Ditolak'].map(x=>`<button data-f="${x}" class="${x===f?'on':''}">${x}</button>`).join('')}</div>`+
  (r.filter(p=>f==='Semua'||p.status===f).map(p=>`<div class="card"><div class="row"><b>${esc(p.nama)}</b><span class="tag ${p.jenis==='Sakit'?'S':'I'}" style="flex:0">${p.jenis.toUpperCase()}</span><span class="tag ${p.status}" style="flex:0">${p.status}</span></div><small>${p.tanggal} · ${SHN[p.kode_shift]}</small><p>${esc(p.keterangan)||'<span class="mut">Tanpa keterangan</span>'}</p>${p.catatan_admin?`<p class="tgp"><b>Alasan penolakan:</b> ${esc(p.catatan_admin)}</p>`:''}${p.foto_bukti?`<button class="sec" onclick="bukti(this,'${p.foto_bukti}')">Lihat bukti foto</button>`:''}`+
  (p.status==='Menunggu'?`<div class="row" style="margin-top:10px"><button class="bad" onclick="proses('${p.id}',0)">Tolak (Alpa A)</button><button class="ok" onclick="proses('${p.id}',1)">Setujui (${p.jenis==='Sakit'?'S':'I'})</button></div>`:`<small>Diproses oleh ${esc(p.diproses_oleh)}</small>`)+'</div>').join('')||'<div class="card mut">Tidak ada pengajuan.</div>');
  document.querySelectorAll('.tabs button').forEach(x=>x.onclick=()=>{S.pf=x.dataset.f;A.pengajuan();});},
async lap(){const t=S.lt||'',r=await api('listLaporan',{tanggal:t}),n=l=>(l.foto?String(l.foto).split(',').filter(Boolean):[]),rv=l=>l.catatan_admin?1:0,fk=S.lk||'',fj=S.lj||'',so=S.ls||'',jn=Array.from(new Set(r.map(l=>l.jenis))).sort();
  const ftg=x=>{const d=new Date(x+'T00:00:00');return isNaN(d)?x:d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',year:'numeric'});},kt=[['Total laporan','#007BFF','lap'],['Laporan penting','#DC3545','al'],['Belum ditinjau','#FD7E14','clk']];
  $('#app').innerHTML=`<div class="hero"><h1>Laporan Tugas</h1><p>Tinjau laporan satpam, lihat foto, dan beri catatan pengelola.</p><div class="row dn wr"><input id="lt" type="date" value="${esc(t)}" aria-label="Filter tanggal"><button class="sec" id="l1">Hari ini</button><button class="sec" id="l0">Semua tanggal</button></div></div>
  <div class="kpis">${kt.map((x,i)=>`<div class="ib"><span class="ibi" style="background:${x[1]}">${svg(KI[x[2]],30)}</span><div><small>${x[0]}</small><b id="lk${i}">0</b></div></div>`).join('')}</div>
  <div class="card"><div class="row fl"><div class="fchips">${[['','Semua'],['penting','Penting'],['belum','Belum ditinjau'],['sudah','Sudah ditinjau']].map(([k,l])=>`<button data-k="${k}" class="${fk===k?'on':''}">${l}</button>`).join('')}</div>
  <select id="lj" aria-label="Filter jenis"><option value="">Semua jenis</option>${jn.map(j=>`<option ${fj===j?'selected':''}>${esc(j)}</option>`).join('')}</select>
  <select id="ls" aria-label="Urutan"><option value="">Urutan: terbaru</option><option value="p" ${so==='p'?'selected':''}>Urutan: prioritas</option></select><input id="lq" placeholder="Cari petugas, lokasi, uraian…" aria-label="Cari laporan" value="${esc(S.lq||'')}"></div><small id="lc" class="mut"></small>${r.length>=100?'<br><small class="mut">Hanya 100 laporan terbaru yang dimuat. Pilih tanggal tertentu untuk melihat yang lebih lama.</small>':''}</div>
  <div id="ll">`+(r.map((l,i)=>{const f=n(l),pen=l.tingkat==='Penting',ok=rv(l),hay=(l.nama+' '+l.lokasi+' '+l.uraian).toLowerCase(),tm=l.dibuat_pada&&!isNaN(+l.dibuat_pada)?+l.dibuat_pada:0;
    return `<div class="card lp${pen?' pen':''}" id="lc_${esc(l.id)}" data-i="${i}" data-t="${tm}" data-p="${pen?1:0}" data-r="${ok}" data-j="${esc(l.jenis)}" data-h="${esc(hay)}"><div class="row"><b>${esc(l.jenis)}</b><span class="tag ${pen?'A':'H'}" style="flex:0">${esc(l.tingkat).toUpperCase()}</span><span id="lb_${esc(l.id)}" class="tag ${ok?'H':'Menunggu'}" style="flex:0;white-space:nowrap">${ok?'DITINJAU':'BELUM DITINJAU'}</span></div>
    <small>${esc(l.nama)} · ${esc(ftg(l.tanggal))} · Shift ${esc(l.kode_shift)}${tm?' · '+jam(tm)+' WIB':''}${l.lokasi?' · '+esc(l.lokasi):''}</small><p>${esc(l.uraian)}</p>
    ${f.length?`<button class="sec sm" data-f="${esc(f.join(','))}" data-l="${esc(f.map((_,k)=>'Foto '+(k+1)).join(','))}" data-j="Foto laporan · ${esc(l.nama)}">Lihat foto (${f.length})</button>`:''}
    <div class="cat"><label for="c_${esc(l.id)}">Catatan pengelola</label><div class="qf"><button type="button" data-q="Aman, tidak perlu tindakan lanjutan">Aman</button><button type="button" data-q="Sudah ditindaklanjuti">Sudah ditindaklanjuti</button><button type="button" data-q="Perlu perhatian, akan dibahas dengan komandan regu">Perlu perhatian</button></div>
    <textarea id="c_${esc(l.id)}" rows="2" maxlength="500" placeholder="Tulis tanggapan atau tindak lanjut…">${esc(l.catatan_admin||'')}</textarea><button class="ok sm" onclick="simpanCatatan('${esc(l.id)}',this)">${ok?'Perbarui catatan':'Simpan catatan'}</button>
    <small class="mut lr" id="lr_${esc(l.id)}">${ok&&l.ditinjau_oleh?'Ditinjau oleh '+esc(l.ditinjau_oleh)+(l.ditinjau_pada&&!isNaN(+l.ditinjau_pada)?' · '+jam(+l.ditinjau_pada)+' WIB':''):''}</small></div></div>`;}).join('')||'<div class="card mut">Belum ada laporan.</div>')+`</div><div id="le" class="card mut" hidden>Tidak ada laporan yang cocok dengan filter.</div>`;
  const go_=v=>{S.lt=v;A.lap();};$('#lt').onchange=e=>go_(e.target.value);$('#l1').onclick=()=>go_(today());$('#l0').onclick=()=>go_('');
  const ft=()=>{const q=$('#lq').value.trim().toLowerCase(),j=$('#lj').value,cs=[...document.querySelectorAll('#ll .lp')];let m=0,k0=0,k1=0,k2=0;
    cs.forEach(x=>{k0++;if(x.dataset.p==='1')k1++;if(x.dataset.r==='0')k2++;const v=(!S.lk||(S.lk==='penting'&&x.dataset.p==='1')||(S.lk==='belum'&&x.dataset.r==='0')||(S.lk==='sudah'&&x.dataset.r==='1'))&&(!j||x.dataset.j===j)&&(!q||x.dataset.h.indexOf(q)>=0);x.hidden=!v;if(v)m++;});
    [k0,k1,k2].forEach((v,i)=>{const e=$('#lk'+i);if(e)e.textContent=v;});
    const pr=x=>x.dataset.p==='1'&&x.dataset.r==='0'?0:x.dataset.p==='1'?1:x.dataset.r==='0'?2:3,box=$('#ll');
    cs.sort((a,b)=>S.ls==='p'?(pr(a)-pr(b)||a.dataset.i-b.dataset.i):a.dataset.i-b.dataset.i).forEach(x=>box.appendChild(x));
    $('#lc').textContent='Menampilkan '+m+' dari '+cs.length+' laporan';$('#le').hidden=!(cs.length&&!m);};
  S.lft=ft;document.querySelectorAll('.fchips button').forEach(b=>b.onclick=()=>{S.lk=b.dataset.k;document.querySelectorAll('.fchips button').forEach(y=>y.classList.toggle('on',y===b));ft();});
  $('#lj').onchange=e=>{S.lj=e.target.value;ft();};$('#ls').onchange=e=>{S.ls=e.target.value;ft();};$('#lq').oninput=e=>{S.lq=e.target.value;ft();};
  document.querySelectorAll('.qf button').forEach(b=>b.onclick=()=>{const ta=b.closest('.cat').querySelector('textarea'),v=ta.value.trim();ta.value=v?(v.indexOf(b.dataset.q)>=0?v:v+' · '+b.dataset.q):b.dataset.q;ta.focus();});ft();},
async rekap(){const b=S.rb||today().slice(0,7);S.rb=b;const [r,sk]=await Promise.all([api('rekap',{bulan:b}),api('getSekolah')]),q=(S.rq||'').toLowerCase(),K=['H','T','PC','I','S','A','Laporan'],tt={};
  const L=r.filter(x=>!q||(x.nama+x.id).toLowerCase().includes(q)),dis=x=>{const n=x.H+x.T+x.PC+x.A;return n?Math.round(x.H/n*1000)/10:0;};K.forEach(k=>tt[k]=L.reduce((a,x)=>a+x[k],0));
  $('#app').innerHTML=`<div class="hero"><small style="color:#fff9">DOKUMEN KEDINASAN</small><h1>Rekapitulasi Presensi & Ekspor PDF</h1><p>Kehadiran 3 shift per bulan, dicetak berkop sekolah dan diketahui Kepala Sekolah.</p><div class="row"><input id="bl" type="month" value="${b}"><button id="pdf" class="sec">Cetak PDF Resmi</button></div></div>
  <div class="card kop"><img src="${sk.logoUri||'icons/logo.png'}" alt="Logo"><div><small>${esc(sk.instansi)}</small><b>${esc(sk.nama)}</b><small>${esc(sk.alamat)} ${esc(sk.telp)}</small></div></div>
  <input id="rq" placeholder="Cari nama / ID satpam, lalu tekan Enter" value="${esc(S.rq||'')}"><div class="card scroll"><table><tr><th>No</th><th>ID</th><th>Nama</th><th>Penugasan</th>${K.map(k=>`<th>${k==='Laporan'?'LAP':k}</th>`).join('')}<th>DISIPLIN</th></tr>`+
  L.map((x,i)=>`<tr><td>${i+1}</td><td class="mono">${esc(x.id)}</td><td><b>${esc(x.nama)}</b></td><td>${esc(x.pos)}</td>${K.map(k=>`<td>${x[k]}</td>`).join('')}<td><b>${dis(x)}%</b></td></tr>`).join('')+
  `<tr><th colspan="4">JUMLAH TOTAL & RATA-RATA</th>${K.map(k=>`<th>${tt[k]}</th>`).join('')}<th>${dis(tt)}%</th></tr></table></div><small>H hadir · T terlambat · PC pulang cepat · I izin · S sakit · A alpa</small>`;
  $('#bl').onchange=e=>{S.rb=e.target.value;A.rekap();};$('#rq').onchange=e=>{S.rq=e.target.value;A.rekap();};
  $('#pdf').onclick=async()=>{const f=await api('exportPdf',{bulan:b});unduh(f.b64,f.nama);toast('PDF dibuat & disimpan di Drive › Exports');};},
async sekolah(){const k=await api('getSekolah'),F=[['nama','Nama sekolah'],['instansi','Instansi induk (opsional, tampil di atas nama sekolah)'],['alamat','Alamat lengkap'],['telp','Telepon'],['email','Email'],['kepsek','Nama Kepala Sekolah'],['nip','NIP Kepala Sekolah'],['pengelola','Nama pengelola / koordinator satpam'],['kota','Kota tanda tangan']];
  $('#app').innerHTML=`<div class="hero"><small style="color:#fff9">MODUL ADMINISTRASI</small><h1>Pengaturan Identitas Sekolah</h1><p>Data ini dipakai pada kop dan tanda tangan PDF rekap.</p></div>
  <div class="card row"><img id="lgp" class="logo" src="${k.logoUri||'icons/logo.png'}" alt="Logo" style="margin:0;flex:0 0 72px"><div><button class="sec" id="lgu">Unggah logo baru</button><br><small>Gambar otomatis dikecilkan (maks 256 px)</small></div></div>
  <div class="card">${F.map(f=>`<label for="s_${f[0]}">${f[1]}</label><input id="s_${f[0]}" value="${esc(k[f[0]])}">`).join('')}<button class="big" id="sv">Simpan Pengaturan</button></div>`;
  $('#lgu').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=async()=>{const d=await logoPng(i.files[0]);await api('uploadLogo',{foto:d});$('#lgp').src=d;toast('Logo tersimpan');};i.click();};
  $('#sv').onclick=async()=>{const d={};F.forEach(f=>d[f[0]]=$('#s_'+f[0]).value.trim());await api('simpanSekolah',d);toast('Pengaturan tersimpan');};},
async satpam(){const r=await api('master');S.ms=r.satpam;const bt='style="min-height:34px;padding:4px 12px"';
  $('#app').innerHTML=`<div class="hero"><h1>Data Satpam</h1><p>Kelola akun petugas, penempatan pos, dan reset kata sandi.</p></div>
  <div class="card"><h2>Daftar Satpam</h2><div class="scroll"><table><tr><th>ID</th><th>Nama</th><th>Peran</th><th>Pos</th><th>Status</th><th></th></tr>`+
  r.satpam.map(x=>`<tr><td class="mono">${esc(x.id)}</td><td><b>${esc(x.nama)}</b></td><td>${x.role==='admin'?'Pengelola':'Satpam'}</td><td>${esc(x.pos)||'-'}</td><td><span class="tag ${x.aktif==='N'?'A':'H'}">${x.aktif==='N'?'NONAKTIF':'AKTIF'}</span></td><td><button class="sec" ${bt} onclick="isiSatpam('${esc(x.id)}')">Ubah</button> <button class="sec" ${bt} onclick="resetPw('${esc(x.id)}')">Reset sandi</button></td></tr>`).join('')+`</table></div></div>
  <div class="card"><h2>Tambah / Ubah Satpam</h2><label for="si">ID</label><input id="si"><label for="sn">Nama</label><input id="sn"><label for="sp">Password (min. 6 karakter; kosongkan jika tidak diubah)</label><input id="sp" type="password" autocomplete="new-password">
  <label for="so">Pos</label><select id="so">${r.pos.map(q=>`<option>${esc(q.nama)}</option>`).join('')}</select><label for="sr">Peran</label><select id="sr"><option value="satpam">Satpam</option><option value="admin">Pengelola</option></select><label for="sa">Status</label><select id="sa"><option value="Y">Aktif</option><option value="N">Nonaktif</option></select><button class="big" id="sb">Simpan</button></div>`;
  $('#sb').onclick=async()=>{await api('simpanSatpam',{id:$('#si').value.trim(),nama:$('#sn').value,pin:$('#sp').value,pos:$('#so').value,role:$('#sr').value,aktif:$('#sa').value});toast('Tersimpan');A.satpam();};},
async pos(){const r=await api('master');S.mp=r.pos;const bt='style="min-height:34px;padding:4px 12px"';
  $('#app').innerHTML=`<div class="hero"><h1>Data Pos</h1><p>Lokasi pos jaga dan radius presensi (geofence). Satpam hanya bisa absen di dalam radius.</p></div>
  <div class="card"><h2>Daftar Pos</h2><div class="scroll"><table><tr><th>Nama pos</th><th>Latitude</th><th>Longitude</th><th>Radius</th><th></th></tr>`+
  (r.pos.map((q,i)=>`<tr><td><b>${esc(q.nama)}</b></td><td class="mono">${esc(q.lat)||'-'}</td><td class="mono">${esc(q.lng)||'-'}</td><td>${esc(q.radius_m)||100} m</td><td><button class="sec" ${bt} onclick="isiPos(${i})">Ubah</button></td></tr>`).join('')||'<tr><td>Belum ada pos.</td></tr>')+`</table></div></div>
  <div class="card"><h2>Tambah / Ubah Pos</h2><label for="pn">Nama pos</label><input id="pn"><div class="row"><div><label for="pa">Latitude</label><input id="pa" inputmode="decimal"></div><div><label for="po">Longitude</label><input id="po" inputmode="decimal"></div></div>
  <label for="pr">Radius (meter)</label><input id="pr" type="number" value="100"><div class="row"><button class="sec" id="pg">Pakai lokasi saya</button><button id="ps">Simpan Pos</button></div><small>Berdirilah di pos jaga, lalu tekan "Pakai lokasi saya" agar koordinat akurat.</small></div>`;
  $('#pg').onclick=async()=>{const g=await lokasi();$('#pa').value=g.lat.toFixed(6);$('#po').value=g.lng.toFixed(6);toast('Koordinat diisi dari lokasi Anda');};
  $('#ps').onclick=async()=>{const n=$('#pn').value.trim();if(!n)return toast('Nama pos wajib diisi',1);await api('simpanPos',{nama:n,lat:$('#pa').value,lng:$('#po').value,radius_m:$('#pr').value});toast('Pos tersimpan');A.pos();};}
};
const KI={cal:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',ok:'<path d="M20 6L9 17l-5-5"/>',clk:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',out:'<path d="M5 3v18M5 4h13l-3 4 3 4H5"/>',doc:'<path d="M9 12h6M9 16h6M7 3h7l5 5v13H7z"/>',al:'<path d="M12 3l10 18H2zM12 10v5M12 18v.5"/>',lap:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'};
const geser=(t,n)=>{const d=new Date(t+'T00:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function csvAbsensi(list,t,lbl){const q=v=>{let s=String(v==null?'':v).replace(/[\r\n]+/g,' ');if(/^[=+\-@\t]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';},
  hm=m=>(m&&!isNaN(+m))?new Date(+m).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta',hour12:false}):'',
  H=['Tanggal','Shift','Petugas','ID','Jam Datang','Jam Pulang','Jarak Datang (m)','Jarak Pulang (m)','Status','Keterangan Status','Catatan','Dikoreksi Oleh'];
  return '\uFEFF'+[H.map(q).join(';')].concat(list.map(x=>{const a=x.a;return [t,'Shift '+x.kode,x.nama,x.uid,a?hm(a.jam_masuk):'',a?hm(a.jam_pulang):'',a?a.jarak_masuk:'',a?a.jarak_pulang:'',a?a.status:'',lbl(x),a?a.catatan:'',a?a.dikoreksi_oleh:''].map(q).join(';');})).join('\r\n');}
function unduhTeks(nama,teks,mime){const u=URL.createObjectURL(new Blob([teks],{type:mime||'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=nama;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function koreksi(i){const x=S.ar[i],a=x.a,t=S.at,hm=ms=>(ms&&!isNaN(+ms))?new Date(+ms).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta',hour12:false}):'',ATT=['H','T','PC','T+PC'];
  const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-label','Koreksi absensi');
  m.innerHTML=`<div class="mbox" style="max-width:480px"><div class="row" style="flex-wrap:nowrap"><b>Koreksi absensi</b><button class="sec sm" id="kx" aria-label="Tutup" style="flex:0">✕</button></div>
  <p class="mut" style="margin:4px 0 12px">${esc(x.nama)} · Shift ${x.kode} · ${esc(t)}</p>
  <label for="ks">Status</label><select id="ks">${[['H','Hadir tepat waktu (H)'],['T','Terlambat (T)'],['PC','Pulang cepat (PC)'],['T+PC','Terlambat + Pulang cepat'],['I','Izin (I)'],['S','Sakit (S)'],['A','Alpa (A)']].map(([k,l])=>`<option value="${k}" ${(a?String(a.status):'H')===k?'selected':''}>${l}</option>`).join('')}</select>
  <div class="row" id="kt"><div><label for="km">Jam datang</label><input id="km" type="time" value="${a?hm(a.jam_masuk):''}"></div><div><label for="kp">Jam pulang (opsional)</label><input id="kp" type="time" value="${a?hm(a.jam_pulang):''}"></div></div>
  <label for="kc">Alasan koreksi (wajib)</label><textarea id="kc" rows="3" maxlength="300" placeholder="Contoh: HP rusak sehingga tidak bisa absen, sudah dikonfirmasi komandan."></textarea>
  <small class="mut">Koreksi dicatat bersama nama pengelola, waktu, dan status sebelumnya.</small>
  <div class="row" style="margin-top:12px"><button class="sec" id="kb">Batal</button><button id="kk">Simpan koreksi</button></div></div>`;
  document.body.appendChild(m);const cl=()=>{m.remove();document.removeEventListener('keydown',kd);},kd=e=>{if(e.key==='Escape')cl();},q=s=>m.querySelector(s);document.addEventListener('keydown',kd);
  m.onclick=e=>{if(e.target===m)cl();};q('#kx').onclick=cl;q('#kb').onclick=cl;
  const sy=()=>{q('#kt').style.display=ATT.indexOf(q('#ks').value)>=0?'':'none';};q('#ks').onchange=sy;sy();
  q('#kk').onclick=async()=>{const s=q('#ks').value,al=q('#kc').value.trim(),att=ATT.indexOf(s)>=0;
    if(al.length<3)return toast('Alasan koreksi wajib diisi',1);if(att&&!q('#km').value)return toast('Jam datang wajib diisi untuk status ini',1);
    try{await api('koreksiAbsensi',{tanggal:t,kode:x.kode,id:x.uid,status:s,jam_masuk:att?q('#km').value:'',jam_pulang:att?q('#kp').value:'',alasan:al});}catch(e){return;}
    cl();toast('Koreksi tersimpan');A.absen();};}
function lihatFoto(ids,labels,judul){const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-label','Foto');
  m.innerHTML=`<div class="mbox"><div class="row" style="flex-wrap:nowrap"><b>${esc(judul||'Foto')}</b><button class="sec sm" id="mx" aria-label="Tutup" style="flex:0">✕</button></div><div class="mg">${ids.map((x,i)=>`<figure><div class="sk" style="height:200px;margin:0"></div><figcaption>${esc(labels[i]||'')}</figcaption></figure>`).join('')}</div></div>`;
  document.body.appendChild(m);const cl=()=>{m.remove();document.removeEventListener('keydown',kd);},kd=e=>{if(e.key==='Escape')cl();};document.addEventListener('keydown',kd);
  m.onclick=e=>{if(e.target===m)cl();};m.querySelector('#mx').onclick=cl;
  ids.forEach(async(id,i)=>{const fg=m.querySelectorAll('figure')[i];try{const d=await api('getFoto',{id:id},1);fg.firstChild.outerHTML='<img src="'+d+'" alt="'+esc(labels[i]||'Foto')+'">';}catch(e){fg.firstChild.outerHTML='<div class="mut" style="padding:40px 0">Foto tidak bisa dimuat</div>';}});}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-f]');if(b&&b.dataset.f)lihatFoto(b.dataset.f.split(',').filter(Boolean),(b.dataset.l||'').split(','),b.dataset.j);});
async function simpanCatatan(id,btn){const ta=$('#c_'+id),v=ta.value.trim();if(btn)btn.disabled=true;
  try{const r=await api('catatLaporan',{id:id,catatan:v});toast(v?'Catatan tersimpan':'Catatan dihapus');
    const b=$('#lb_'+id);if(b){b.textContent=v?'DITINJAU':'BELUM DITINJAU';b.className='tag '+(v?'H':'Menunggu');}const c=$('#lc_'+id);if(c)c.dataset.r=v?'1':'0';
    const lr=$('#lr_'+id);if(lr)lr.textContent=v?'Ditinjau oleh '+(r.oleh||'pengelola')+(r.pada?' · '+jam(+r.pada)+' WIB':''):'';
    if(btn)btn.textContent=v?'Perbarui catatan':'Simpan catatan';if(typeof S.lft==='function')S.lft();}catch(e){}finally{if(btn)btn.disabled=false;}}
async function bukti(b,id){const d=await api('getFoto',{id});b.outerHTML='<img class="bukti" src="'+d+'" alt="Bukti foto">';}
function unduh(b64,n){const a=document.createElement('a');a.href='data:application/pdf;base64,'+b64;a.download=n;document.body.appendChild(a);a.click();a.remove();}
function logoPng(f){return new Promise(r=>{const im=new Image();im.onload=()=>{const k=Math.min(1,256/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);r(c.toDataURL('image/png'));};im.src=URL.createObjectURL(f);});}
function pilihBukti(){return new Promise(res=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=async()=>res(i.files[0]?await kecil(i.files[0]):null);i.click();});}
async function proses(id,s){let al='';if(!s){const r=prompt('Alasan penolakan (boleh dikosongkan, akan dilihat petugas):');if(r===null)return;al=r.trim();}await api('prosesPengajuan',{id,setuju:s,alasan:al});toast('Diproses');go(S.tab);}
// ================= PWA =================
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
let dp;const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;if(!standalone)$('#pwa').hidden=false;});
$('#pwaBtn').onclick=async()=>{if(dp){dp.prompt();await dp.userChoice;dp=null;$('#pwa').hidden=true;}else toast('Di iPhone: tekan Bagikan → Tambah ke Layar Utama');};
$('#pwaX').onclick=()=>$('#pwa').hidden=true;
if(!standalone&&/iphone|ipad/i.test(navigator.userAgent)){$('#pwaTxt').textContent='Bagikan → Tambah ke Layar Utama';$('#pwaBtn').hidden=true;$('#pwa').hidden=false;}
if(S.t&&!GAS_URL.startsWith('GANTI'))fetch(GAS_URL).catch(()=>{});
boot();
