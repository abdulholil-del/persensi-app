# Panduan Instalasi — Presensi Satpam

## A. Backend (Google Apps Script)
1. Buka https://script.google.com → **Proyek Baru**.
2. Ganti nama `Code.gs` menjadi `Kode`, hapus isinya, tempel seluruh isi `Kode.gs`.
3. Pilih fungsi **setupAppEnvironment** → ▶ Run → izinkan akses Drive, Sheets, dan Trigger. **Jalankan SEKALI saja.**
4. Cek Execution Log: harus ada ✅. Di Google Drive terbentuk folder "📁 Presensi Satpam" berisi spreadsheet dan folder Uploads.
5. **Deploy → New deployment → Web app** · Execute as: **Me** · Who has access: **Anyone** → Deploy → salin URL `/exec`.
6. Setiap kali `Kode.gs` diubah, buat **New deployment** baru.

Akun awal: admin / `123456` dan satpam contoh S001 / `1234`. **Segera ganti PIN lewat menu Satpam.**

## B. Frontend (GitHub Pages)
Folder kerja = hasil ekstrak ZIP `presensi-satpam` (berisi `index.html`, `css/`, `js/`, `icons/`). Di situlah `git init` dijalankan.
1. Edit `js/config.js`, isi `GAS_URL` dengan URL `/exec` dari langkah A5.
2. Buat repo **Public** baru di github.com (jangan centang README).
3. Buka PowerShell di folder tadi, lalu cek `dir` — `index.html` harus terlihat di daftar teratas.
4. Jalankan satu per satu:
```
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
Saat diminta password, pakai **Personal Access Token** (scope `repo`), bukan password akun.
5. Repo → **Settings → Pages** → Deploy from a branch → `main` / `(root)` → Save → centang **Enforce HTTPS**.
6. Buka `https://USERNAME.github.io/NAMA-REPO/`.

## C. Pengaturan awal oleh admin
1. Login admin → menu **Satpam** → bagian *Koordinat pos jaga*: berdiri di pos, tekan **Pakai lokasi saya** (radius default 100 m).
2. Tambahkan satpam (ID, nama, PIN, pos).
3. Menu **Jadwal**: isi shift per satpam per tanggal.

## D. Memasang di HP
Android/Chrome: tekan **Install** pada banner atas. iPhone/Safari: **Bagikan → Tambah ke Layar Utama**.

## E. Aturan absen
| Shift | Datang (tepat waktu) | Dibuka | Pulang |
|---|---|---|---|
| 1 | 08:00–08:30 | 06:00 | 16:00–18:00 |
| 2 | 16:00–16:30 | 14:00 | 00:00–00:30 (besoknya) |
| 3 | 00:00–00:30 | 22:00 (malam sebelumnya) | 08:00–09:00 |

Lewat batas datang = **T**. Pulang sebelum jendela atau lupa pulang = **PC**. Tidak absen dan tanpa pengajuan = **A**. Izin/Sakit = **I/S** setelah disetujui admin.
Jam yang dipakai adalah jam server (WIB). Shift 3 pada tanggal D dimulai pukul 00:00 tanggal D.
