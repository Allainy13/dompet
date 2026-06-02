# DOMPET PT AI - React/Vite Frontend

DOMPET PT AI saat ini memakai React + Vite dengan mock fallback. Backend tahap 1 sudah disiapkan untuk Supabase, tetapi frontend tetap berjalan tanpa ENV Supabase dan tanpa koneksi paksa.

## Cara Menjalankan

1. Jalankan `npm install` jika `node_modules` belum ada.
2. Jalankan `npm run dev` untuk development server.
3. Jalankan `npm run build` untuk production build.
4. Jalankan `npm run preview` untuk preview hasil build.

## Backend Supabase Tahap 1

File backend tahap 1 ada di folder `supabase/` dan service frontend ada di `src/services/`.

Langkah setup Supabase:

1. Buat project Supabase baru.
2. Buka SQL Editor Supabase.
3. Jalankan `supabase/schema.sql` untuk membuat tabel, index, trigger, RLS awal, dan storage bucket.
4. Jalankan `supabase/seed.sql` untuk mengisi data contoh.
5. Salin `.env.example` menjadi `.env.local`.
6. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
7. Jalankan ulang `npm run dev`.

Contoh `.env.local`:

```env
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=anon-public-key
```

Jika `VITE_SUPABASE_URL` atau `VITE_SUPABASE_ANON_KEY` kosong, aplikasi otomatis memakai `src/data/mockData.js`.

Tabel Supabase yang disiapkan:

- `companies`
- `users_profile`
- `projects`
- `accounts`
- `categories`
- `transactions`
- `approvals`
- `debts`
- `receivables`
- `petty_cash`
- `activity_logs`
- `backups`

Storage bucket yang disiapkan:

- `transaction-proofs`
- `company-logos`
- `backups`

Catatan RLS: policy memakai `users_profile.auth_user_id = auth.uid()` dan fallback bootstrap via email JWT agar seed dengan `auth_user_id = null` tetap bisa dibaca saat user Auth memakai email yang sama. Untuk production, isi `auth_user_id` profil dengan UUID user Supabase Auth.

## Auth & CRUD Transaksi Tahap 1B

Tahap 1B menambahkan fondasi Supabase Auth email/password dan CRUD transaksi dasar di frontend. Aplikasi tetap masuk mode Demo/Mock kalau ENV kosong, URL Supabase tidak valid, atau key yang dipakai bukan anon public key.

Setup Supabase Auth:

1. Buka Supabase Dashboard.
2. Masuk ke Authentication > Providers.
3. Aktifkan Email provider.
4. Buat user dari Authentication > Users.
5. Salin UUID user tersebut ke `users_profile.auth_user_id` untuk profil perusahaan yang sesuai.
6. Pastikan `users_profile.role` berisi salah satu: `Super Admin`, `Finance`, `Manager`, `Staff`, `Viewer`.

ENV frontend hanya boleh memakai anon public key:

```env
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=anon-public-key
```

Jangan memakai database connection string, password database, atau service role key di variabel `VITE_` karena akan masuk bundle browser.

Test login demo:

1. Kosongkan atau hapus `.env.local`.
2. Jalankan `npm run dev`.
3. Aplikasi masuk mode Demo/Mock otomatis.
4. Klik Keluar untuk melihat halaman login, lalu klik Masuk Demo.

Test login Supabase:

1. Isi `.env.local` dengan Project URL dan anon public key.
2. Pastikan user Auth punya baris `users_profile` dengan `auth_user_id` yang sama.
3. Jalankan ulang `npm run dev`.
4. Login dengan email/password Supabase.

Test tambah transaksi:

1. Buka Pemasukan atau Pengeluaran.
2. Klik Tambah Pemasukan/Tambah Pengeluaran.
3. Isi judul, tanggal, rekening, kategori, nominal, status, dan bukti jika perlu.
4. Simpan transaksi.
5. Jika Supabase siap dan profil punya `company_id`, data dikirim ke tabel `transactions`; jika tidak, data masuk state mock sementara.

## Approval & Role Access Tahap 1C

Tahap 1C menambahkan service approval, role access dasar, dan activity log ringan. Aksi approval tetap aman di mode Demo/Mock.

Role access dasar:

- `Super Admin`: semua akses.
- `Finance`: input/edit transaksi, upload bukti, ekspor laporan, tanpa hapus user.
- `Manager`: approve/reject/minta revisi dan lihat laporan.
- `Staff`: tambah transaksi draft/pending, tanpa approval.
- `Viewer`: read only; aksi edit/approve/tambah menampilkan toast `Mode Viewer`.

Flow approval:

1. Buka halaman Approval.
2. Role aktif tampil di header.
3. Isi Catatan Approval jika perlu.
4. Klik Setujui, Tolak, atau Minta Revisi.
5. Jika role tidak boleh approval, aplikasi menampilkan toast dan mencatat access denied ringan.
6. Jika Supabase siap, `approvals.status` dan `transactions.status` diupdate, lalu `activity_logs` ditambah.
7. Jika Supabase belum siap, status approval berubah di state mock.

## Storage & Settings Tahap 1D

Tahap 1D menyambungkan upload bukti transaksi, upload logo perusahaan, dan settings perusahaan ke service Supabase dengan fallback Demo/Mock.

Bucket Supabase Storage yang dibutuhkan:

- `transaction-proofs`
- `company-logos`
- `backups`

Cara buat bucket:

1. Buka Supabase Dashboard.
2. Masuk ke Storage.
3. Buat bucket `transaction-proofs`, `company-logos`, dan `backups`.
4. Untuk development, boleh gunakan bucket private dengan signed URL seperti schema saat ini.
5. Jalankan policy storage dari `supabase/schema.sql` atau buat policy sederhana untuk authenticated user.

Policy development sederhana:

```sql
create policy "authenticated read dompet storage" on storage.objects
for select to authenticated
using (bucket_id in ('transaction-proofs', 'company-logos', 'backups'));

create policy "authenticated upload dompet storage" on storage.objects
for insert to authenticated
with check (bucket_id in ('transaction-proofs', 'company-logos', 'backups'));
```

Catatan production: policy harus diperketat per `company_id`, path folder, role user, ukuran file, dan MIME type. Jangan gunakan service role key di frontend.

Test upload logo:

1. Login Demo atau Supabase.
2. Buka Pengaturan.
3. Klik Unggah Logo.
4. Jika Supabase siap, file masuk bucket `company-logos` dan `companies.logo_url` diupdate.
5. Jika belum siap, logo tampil sebagai preview lokal.

Test upload bukti transaksi:

1. Buka Pemasukan atau Pengeluaran.
2. Klik Tambah.
3. Pilih file di bagian Unggah Bukti.
4. Simpan transaksi.
5. Jika Supabase siap, file masuk bucket `transaction-proofs` dan `proof_url` masuk payload transaksi.
6. Jika belum siap, bukti memakai URL preview lokal.

## Report & Export Tahap 1E

Tahap 1E merapikan `reportService` agar laporan bisa membaca data dari Supabase melalui service finance atau fallback ke mock data jika ENV belum aktif.

Jenis laporan yang tersedia:

- Arus Kas
- Pemasukan
- Pengeluaran
- Kas Kecil
- Hutang
- Piutang
- Per Proyek

Filter laporan:

- Tanggal awal
- Tanggal akhir
- Proyek
- Rekening
- Kategori

Export yang sudah berjalan tanpa dependency tambahan:

- `Ekspor CSV` membuat file `.csv` dari string lokal.
- `Ekspor JSON` membuat file `.json` dari payload laporan.
- `Copy WhatsApp` menyalin ringkasan laporan ke clipboard, dengan fallback textarea jika clipboard dibatasi browser.
- `PDF Segera` masih placeholder untuk tahap berikutnya.

Role export:

- `Super Admin`, `Finance`, dan `Manager` boleh export.
- `Staff` dan `Viewer` hanya lihat laporan; aksi export menampilkan toast akses ditolak atau `Mode Viewer`.

Test laporan mode demo:

1. Jalankan aplikasi tanpa `.env.local`.
2. Login Demo.
3. Buka Laporan.
4. Pilih jenis laporan dan filter.
5. Klik Ekspor CSV, Ekspor JSON, atau Copy WhatsApp.

Test laporan Supabase:

1. Isi ENV Supabase dengan Project URL dan anon public key.
2. Pastikan user punya `users_profile.company_id` dan role yang boleh export.
3. Pastikan tabel `transactions`, `projects`, `accounts`, `categories`, `debts`, `receivables`, dan `petty_cash` sudah ada dari schema.
4. Buka Laporan dan jalankan filter/export.

## Master Data & Dashboard Tahap 1F

Tahap 1F menambahkan CRUD master data ringan untuk Proyek, Rekening, dan Kategori melalui `masterDataService`. Semua operasi memakai Supabase jika ENV dan profil perusahaan siap, lalu fallback ke state demo jika belum.

CRUD master data yang tersedia:

- Proyek: lihat daftar, tambah, edit, ubah status `Aktif`, `Hold`, `Selesai`, dan hapus untuk Super Admin.
- Rekening: lihat card saldo, tambah, edit, ubah status `Aktif/Nonaktif`, dan hapus untuk Super Admin.
- Kategori: tab `Pemasukan`, `Pengeluaran`, `Kas Kecil`, tambah, edit, ubah status `Aktif/Nonaktif`, dan hapus untuk Super Admin.

Role master data:

- `Super Admin`: semua akses, termasuk hapus.
- `Finance`: tambah dan edit master data.
- `Staff`: lihat master data, tidak boleh hapus.
- `Viewer`: read only, aksi tulis menampilkan `Mode Viewer`.

Dashboard summary sekarang memakai `financeService.getDashboardSummary` untuk menghitung:

- Saldo total rekening.
- Pemasukan bulan ini.
- Pengeluaran bulan ini.
- Laba bersih.
- Transaksi terbaru.
- Approval pending.
- Pengeluaran per kategori.

Test master data mode demo:

1. Jalankan tanpa `.env.local`.
2. Login Demo.
3. Buka Proyek, Rekening, atau Kategori.
4. Tambah/edit/nonaktifkan data.
5. Data berubah di state halaman dan tidak menulis backend.

Test master data Supabase:

1. Isi ENV Supabase dengan Project URL dan anon public key.
2. Login dengan user yang punya `users_profile.company_id`.
3. Pastikan role user `Super Admin` atau `Finance` untuk tambah/edit.
4. Buka Proyek/Rekening/Kategori dan simpan data.
5. Cek tabel `projects`, `accounts`, atau `categories` di Supabase.

## Hutang, Piutang & Kas Kecil Tahap 1G

Tahap 1G menambahkan CRUD operasional untuk Hutang, Piutang, dan Kas Kecil. Service tetap memakai Supabase jika ENV dan `company_id` siap, lalu fallback ke mode Demo/Mock jika belum.

Service baru:

- `src/services/payableReceivableService.js` untuk hutang dan piutang.
- `src/services/pettyCashService.js` untuk kas kecil.

CRUD Hutang yang tersedia:

- Lihat daftar hutang.
- Tambah hutang.
- Edit hutang.
- Hapus hutang untuk Super Admin.
- Bayar sebagian.
- Tandai lunas.
- Filter status: `Belum Bayar`, `Sebagian`, `Lunas`, `Jatuh Tempo`.

CRUD Piutang yang tersedia:

- Lihat daftar piutang.
- Tambah piutang.
- Edit piutang.
- Hapus piutang untuk Super Admin.
- Terima sebagian.
- Tandai lunas.
- Filter status: `Belum Bayar`, `Sebagian`, `Lunas`, `Jatuh Tempo`.

CRUD Kas Kecil yang tersedia:

- Lihat transaksi kas kecil.
- Top Up Kas.
- Tambah Pengeluaran Kas.
- Edit transaksi kas kecil.
- Hapus transaksi untuk Super Admin.
- Upload nota masih dummy, tetapi field `proof_url` sudah disiapkan.
- Rekap saldo, top up bulan ini, pengeluaran hari ini, sisa budget, dan rekap mingguan.

Dashboard tahap 1G menampilkan ringkasan tambahan:

- Hutang jatuh tempo.
- Piutang jatuh tempo.
- Saldo kas kecil.

Role tahap 1G:

- `Super Admin`: semua akses termasuk hapus.
- `Finance`: tambah/edit hutang, piutang, dan kas kecil.
- `Staff`: input pengeluaran kas kecil, tidak boleh top up/hapus.
- `Manager`: lihat data, approval nanti disiapkan tahap berikutnya.
- `Viewer`: hanya lihat, aksi tulis menampilkan `Mode Viewer`.

Catatan schema Supabase:

- `debts` dan `receivables` ditambah kolom opsional `note`.
- `petty_cash` ditambah kolom opsional `proof_url`.
- Untuk project Supabase yang sudah pernah dibuat, jalankan ulang `supabase/schema.sql` agar `alter table ... add column if not exists` diterapkan.

Test mode demo:

1. Jalankan tanpa `.env.local`.
2. Login Demo.
3. Buka Hutang & Piutang, tambah/edit/bayar sebagian/lunas.
4. Buka Kas Kecil, top up atau tambah pengeluaran.
5. Data berubah di state halaman dan tidak menulis backend.

Test Supabase:

1. Jalankan ulang `supabase/schema.sql`.
2. Isi ENV Supabase dengan Project URL dan anon public key.
3. Login user yang punya `users_profile.company_id`.
4. Gunakan role `Super Admin` atau `Finance` untuk tambah/edit.
5. Cek tabel `debts`, `receivables`, `petty_cash`, dan `activity_logs`.

## Final Backend QA & RLS Tahap 1H

Tahap 1H merapikan RLS Supabase, policy storage, seed, dan guard frontend. Tidak ada backend server custom, AI API, atau dependency baru.

Cara buat project Supabase:

1. Buat project baru di Supabase Dashboard.
2. Simpan Project URL dan anon public key dari Project Settings > API.
3. Jangan gunakan database connection string, password database, atau service role key di frontend.

Cara jalankan schema:

1. Buka SQL Editor Supabase.
2. Jalankan seluruh isi `supabase/schema.sql`.
3. Script membuat tabel, index, trigger, helper RLS, policy table, bucket storage, dan policy storage.
4. Untuk project lama, jalankan ulang script ini agar `alter table ... add column if not exists` dan policy terbaru diterapkan.

Cara jalankan seed:

1. Setelah schema sukses, buka SQL Editor baru.
2. Jalankan `supabase/seed.sql`.
3. Seed tidak membuat user Auth dan tidak menyimpan password.
4. Buat user di Authentication > Users, lalu samakan email dengan seed atau isi `users_profile.auth_user_id` dengan UUID user Auth.

Cara isi `.env.local`:

```env
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=anon-public-key
```

Cara buat bucket storage:

1. Jalankan `supabase/schema.sql`, atau buat manual bucket berikut dari Storage Dashboard:
   - `transaction-proofs`
   - `company-logos`
   - `backups`
2. File harus diunggah dengan path awal `company_id`, misalnya `transaction-proofs/<company_id>/transactions/file.pdf`.
3. Policy storage hanya mengizinkan user company tersebut membaca file di path company-nya.

Cara aktifkan RLS:

- `supabase/schema.sql` sudah menjalankan `alter table ... enable row level security` untuk semua tabel wajib.
- Policy dasar memakai company isolation: user hanya mengakses `company_id = current_company_id()`.
- Role dasar:
  - `Super Admin`: akses penuh dalam perusahaan.
  - `Finance`: transaksi, master data, laporan, hutang/piutang, kas kecil, upload operasional.
  - `Manager`: baca data dan approve.
  - `Staff`: buat transaksi draft/pending dan pengeluaran kas kecil.
  - `Viewer`: read only.

Catatan mode Demo/Mock:

- Jika `.env.local` kosong, URL tidak valid, atau service role key ditempel di `VITE_SUPABASE_ANON_KEY`, aplikasi otomatis masuk mode Demo/Mock.
- Semua service memakai fallback mock/local agar tidak muncul blank page.
- `.env`, `.env.local`, dan `.env.*.local` masuk `.gitignore`.

Catatan production security:

- Rotasi semua key yang pernah ditempel ke chat atau repo.
- Gunakan anon public key di frontend, bukan service role key.
- Isi `users_profile.auth_user_id` untuk semua user production.
- Perketat policy lanjutan berdasarkan ownership `created_by`, batas approval nominal, path `user_id`, MIME validation server-side, dan audit IP/device.
- Backup production sebaiknya dibuat via job server/edge function, bukan browser langsung.

## AI Proxy Murah Tahap 2B

Tahap 2B menambahkan jalur AI aman untuk teks finance. Frontend tidak menyimpan API key AI dan hanya memanggil Supabase Edge Function `ai-router`. Jika proxy belum tersedia, AI Assistant otomatis tetap memakai mock lokal.

ENV frontend yang dipakai:

```env
VITE_AI_PROXY_URL=
VITE_AI_MODE=mock
VITE_AI_MONTHLY_BUDGET=10
```

Jangan membuat `VITE_AI_API_KEY`. Semua private key AI harus disimpan sebagai Supabase Edge Function secret.

Deploy Edge Function:

```bash
supabase functions deploy ai-router
```

Set secrets di Supabase:

```bash
supabase secrets set AI_PROVIDER=deepseek
supabase secrets set AI_API_KEY=isi_di_supabase_secret
supabase secrets set AI_MODEL=deepseek-chat
supabase secrets set AI_MONTHLY_BUDGET=10
```

Isi `VITE_AI_PROXY_URL` dengan URL function, misalnya:

```env
VITE_AI_PROXY_URL=https://project-id.functions.supabase.co/ai-router
VITE_AI_MODE=real
VITE_AI_MONTHLY_BUDGET=10
```

Task AI yang didukung `ai-router`:

- `parse_transaction`
- `suggest_category`
- `detect_duplicate`
- `analyze_budget`
- `summarize_report`
- `generate_whatsapp_report`
- `chat_finance`

Kontrak response sukses:

```json
{
  "ok": true,
  "task": "chat_finance",
  "result": {},
  "usage": {
    "estimated_tokens": 0,
    "estimated_cost": 0
  },
  "mode": "real"
}
```

Kontrak error:

```json
{
  "ok": false,
  "message": "Pesan error rapi"
}
```

Budget guard:

- Prompt dibatasi 4.000 karakter.
- Payload dibatasi 12.000 karakter.
- Frontend hanya mengirim data ringkas, bukan seluruh database.
- AI tidak auto-run; hanya jalan saat klik quick action atau tombol kirim.
- Estimasi token dan biaya dikembalikan di response untuk tracking UI.

Test mode mock:

1. Kosongkan `VITE_AI_PROXY_URL` atau set `VITE_AI_MODE=mock`.
2. Jalankan `npm run dev`.
3. Buka AI Assistant.
4. Jalankan quick action atau input transaksi bebas.
5. Badge menampilkan Mode Demo dan response berasal dari mock lokal.

Test mode real:

1. Deploy `supabase/functions/ai-router/index.ts`.
2. Set secrets Supabase untuk DeepSeek.
3. Isi `VITE_AI_PROXY_URL` dan set `VITE_AI_MODE=real`.
4. Jalankan ulang `npm run dev`.
5. Buka AI Assistant, pilih `Real via Proxy`, lalu kirim prompt.
6. Jika proxy error atau belum deploy, UI fallback ke mock dan menampilkan catatan fallback.

Catatan provider:

- Primary teks: DeepSeek `deepseek-chat`.
- Fallback OCR/nota seperti Gemini Flash Lite belum diaktifkan pada tahap ini.
- Production perlu monitoring biaya per user/company dan rate limit yang lebih ketat di Edge Function.

## OCR Nota Murah Tahap 2C

Tahap 2C menambahkan OCR nota/invoice/bukti transfer di form transaksi. Default tetap Demo/Mock agar aplikasi berjalan tanpa AI proxy, tanpa API key frontend, dan tanpa dependency baru.

ENV OCR frontend:

```env
VITE_OCR_MODE=mock
```

Gunakan `VITE_OCR_MODE=real` hanya jika `VITE_AI_PROXY_URL` sudah aktif dan Edge Function sudah mendukung provider vision/OCR. Private key OCR tetap disimpan sebagai Supabase secret, bukan di React.

Task OCR yang disiapkan di `ai-router`:

- `scan_receipt`
- `extract_receipt_fields`

Output OCR standar:

```json
{
  "date": "",
  "type": "expense",
  "title": "",
  "vendor_or_source": "",
  "category": "",
  "amount": 0,
  "tax_amount": 0,
  "payment_method": "",
  "note": "",
  "confidence": 0
}
```

Flow upload dan scan nota:

1. Buka Pemasukan atau Pengeluaran.
2. Klik Tambah transaksi.
3. Pilih file bukti di bagian Unggah Bukti.
4. Preview gambar tampil untuk file gambar; PDF tetap diterima tanpa preview gambar.
5. Klik `Scan dengan AI` atau tombol `Scan Nota/Scan Bukti`.
6. OCR berjalan satu kali saat klik, tidak otomatis saat file dipilih.
7. Hasil scan tampil sebagai pratinjau: tanggal, vendor/sumber, kategori, nominal, pajak, metode, dan confidence.
8. Klik `Masukkan ke Form` untuk mengisi field transaksi.
9. User tetap bisa edit manual sebelum simpan.

Mode hemat OCR:

- Maksimal file 3 MB.
- Scan tidak berjalan otomatis.
- Hasil scan di-cache sementara berdasarkan nama, ukuran, dan waktu file.
- Jika proxy kosong, error, atau provider vision belum siap, hasil fallback ke mock lokal.
- Jangan gunakan `VITE_AI_API_KEY` atau service role key di frontend.

Test OCR mock:

1. Set `VITE_OCR_MODE=mock` atau kosongkan `VITE_AI_PROXY_URL`.
2. Jalankan `npm run dev`.
3. Buka Pengeluaran, pilih file JPG/PNG/PDF di drawer transaksi.
4. Klik `Scan dengan AI`.
5. Klik `Masukkan ke Form` dan cek field terisi otomatis.

Test OCR real nanti:

1. Deploy `ai-router` yang sudah punya task `scan_receipt` dan `extract_receipt_fields`.
2. Aktifkan provider vision/OCR di Edge Function secrets.
3. Isi `VITE_AI_PROXY_URL` dan set `VITE_OCR_MODE=real`.
4. Jalankan ulang aplikasi.
5. Jika provider vision belum aktif, UI tetap fallback mock dengan toast rapi.

## AI Cek Duplikat & Budget Guard Tahap 2D

Tahap 2D menambahkan pengecekan risiko lokal yang tetap hemat. Logic utama berjalan di browser dari data aktif, sehingga aplikasi tetap jalan tanpa AI proxy dan tanpa API key frontend.

Cek duplikat memakai parameter:

- Tanggal sama atau berdekatan 1 sampai 3 hari.
- Nominal sama atau mirip.
- Vendor/sumber mirip.
- Kategori sama.
- Project sama.
- Keterangan mirip.
- `proof_url` sama jika ada.

Output cek duplikat:

```json
{
  "risk": "low | medium | high",
  "score": 0,
  "matches": [],
  "message": ""
}
```

Budget Guard menghitung:

- Budget project.
- Total pengeluaran project.
- Sisa budget.
- Persentase terpakai.
- Estimasi setelah transaksi baru.

Status budget:

- `Aman` jika estimasi <= 80%.
- `Perlu Cek` jika estimasi 80% sampai 100%.
- `Melebihi Anggaran` jika estimasi > 100%.

Flow di form transaksi:

1. Buka Pemasukan atau Pengeluaran.
2. Isi data transaksi.
3. Klik `Cek Sekarang` pada box Cek Duplikat.
4. Di Pengeluaran, pilih project dan isi nominal, lalu klik `Analisa Budget`.
5. Jika risiko duplikat tinggi atau budget melebihi anggaran, klik Simpan akan menampilkan peringatan.
6. User bisa klik Simpan sekali lagi sebagai konfirmasi dummy.
7. Tombol `Jelaskan dengan AI` memakai proxy jika tersedia, atau fallback mock jika tidak.

Quick action AI Assistant baru:

- `Cek Duplikat Transaksi`
- `Analisa Budget Project`
- `Cari Transaksi Mencurigakan`

Mode hemat:

- Logic lokal dipakai lebih dulu.
- AI proxy hanya dipanggil saat user klik `Jelaskan dengan AI` atau quick action.
- Frontend tidak mengirim seluruh database ke AI.
- Viewer hanya bisa melihat warning dan tidak bisa simpan transaksi.

Test form Pengeluaran:

1. Jalankan tanpa `.env.local`.
2. Login Demo.
3. Buka Pengeluaran dan klik Tambah.
4. Isi nominal besar, pilih project dengan progress tinggi seperti Modernisasi POP Utara.
5. Klik `Analisa Budget`.
6. Klik `Cek Sekarang` untuk duplikat.
7. Klik Simpan; jika high risk, klik Simpan lagi untuk konfirmasi dummy.

Test AI Assistant:

1. Buka AI Assistant.
2. Klik `Cek Duplikat Transaksi`.
3. Klik `Analisa Budget Project`.
4. Klik `Cari Transaksi Mencurigakan`.
5. Semua tetap berjalan di mode mock jika proxy kosong.

## AI Laporan Otomatis & Insight Dashboard Tahap 2E

Tahap 2E menambahkan insight dashboard yang lebih pintar dan laporan otomatis yang tetap hemat. Semua insight dasar dihitung lokal dari data aktif, lalu AI proxy hanya dipakai jika user klik generate dan proxy tersedia.

Insight Dashboard yang tampil:

- Insight pengeluaran terbesar dan konsentrasi biaya.
- Kas kecil hampir habis atau masih aman.
- Hutang/piutang jatuh tempo.
- Project mendekati atau melewati budget.
- Transaksi mencurigakan atau potensi duplikat.
- Rekomendasi tindakan finance.

Laporan otomatis yang tersedia:

- Ringkasan harian.
- Ringkasan mingguan.
- Ringkasan bulanan.
- Laporan Owner: angka utama, masalah penting, rekomendasi tindakan.
- Laporan Manager: project, budget, approval pending, risiko pengeluaran.
- Laporan Finance: pemasukan/pengeluaran, kategori terbesar, pending, hutang/piutang, kas kecil.

Flow halaman Laporan:

1. Buka Laporan.
2. Atur filter periode, project, rekening, dan kategori.
3. Klik `Ringkas dengan AI`, `Buat Laporan Owner`, `Buat Laporan Manager`, atau `Buat Laporan Finance`.
4. Hasil tampil di panel `Laporan Otomatis AI`.
5. Klik `Copy`, `Download JSON`, `Regenerate`, atau `Copy WhatsApp AI`.
6. Jika proxy kosong, laporan dibuat dari summary lokal/mock.

Mode hemat laporan AI:

- Data diringkas lokal dulu.
- AI tidak menerima seluruh database mentah.
- AI hanya berjalan saat tombol diklik.
- Hasil laporan di-cache sementara berdasarkan jumlah data dan filter.
- Jika proxy error, laporan lokal tetap tampil.

Test Dashboard AI Insight:

1. Jalankan tanpa `.env.local`.
2. Login Demo.
3. Buka Dashboard.
4. Lihat panel AI Insight di kolom kanan.
5. Klik `Refresh Insight` untuk menghitung ulang dari data aktif.

Test Laporan AI:

1. Buka Laporan.
2. Klik `Buat Laporan Owner`.
3. Klik `Buat Laporan Manager`.
4. Klik `Buat Laporan Finance`.
5. Klik `Copy WhatsApp AI` dan `Download JSON`.
6. Semua berjalan di mode Demo jika proxy kosong.

## Final AI QA & Budget Usage Counter Tahap 2F

Tahap 2F menambahkan counter pemakaian AI bulanan, guard budget, dan riwayat request. Semua tetap aman tanpa AI proxy dan tanpa API key frontend.

Fungsi usage counter di `aiService`:

- `getAiUsage()` membaca usage bulan berjalan dari localStorage.
- `addAiUsage(task, estimatedTokens, estimatedCost)` menambah request dan riwayat.
- `resetMonthlyUsageMock()` reset dummy untuk bulan berjalan.
- `getAiBudgetStatus()` menghitung persentase, sisa budget, dan status.
- `canRunAiTask(task)` mengecek apakah mode real masih boleh jalan.
- `estimateAiCost(task, payload)` memberi estimasi token dan biaya per task.

Budget default:

- Budget bulanan: `$10` dari `VITE_AI_MONTHLY_BUDGET`.
- Warning jika pemakaian >= 70%.
- Danger jika pemakaian >= 90%.
- Soft block jika pemakaian >= 100%: mode real dialihkan ke mock/local, user tetap bisa bekerja.

AI Assistant menampilkan:

- Budget bulanan.
- Estimasi terpakai bulan ini.
- Sisa budget.
- Jumlah request AI.
- Status budget.
- Mode Demo/Real.
- Tombol reset usage dummy.
- Riwayat request AI terakhir.

Settings menampilkan:

- AI Mode: Hemat.
- Monthly Budget.
- Provider: DeepSeek/Proxy atau Mock Lokal.
- Proxy URL status.
- Usage summary.
- Reset usage dummy.

Activity log AI:

- Chat AI dan quick action mencatat aktivitas ke `activity_logs` jika Supabase siap, atau ke log mock UI.
- Usage history lokal mencatat parse transaksi, scan nota, ringkas laporan, cek duplikat, analisa budget, generate WhatsApp/report, dan budget blocked.

Test budget warning:

1. Buka AI Assistant.
2. Jalankan beberapa quick action atau laporan AI untuk menambah request.
3. Untuk simulasi cepat di browser DevTools, set localStorage key `dompet-pt-ai-usage-v1` dengan `totalCost` mendekati `7` atau `9`, lalu pindah halaman ke AI Assistant.
4. Status akan berubah menjadi Warning atau Danger.
5. Jika `totalCost >= 10`, mode real soft-block dan fallback ke mock/local.

Final QA AI yang dicek:

- AI Assistant chat.
- Input transaksi bebas.
- OCR nota mock.
- Cek duplikat.
- Budget guard transaksi.
- Ringkas laporan dan laporan otomatis.
- Dashboard insight.
- Copy WhatsApp AI.
- Usage counter dan reset dummy.
- Fallback mock tanpa proxy.

## Hardening Dan Deploy Tahap 3A

Tahap 3A merapikan project agar siap dibuild untuk production tanpa mengubah scope fitur. Aplikasi tetap bisa berjalan tanpa `.env.local`; mode Demo/Mock otomatis aktif jika Supabase atau AI proxy belum dikonfigurasi.

Checklist sebelum deploy:

1. Jalankan `npm install` jika `node_modules` belum ada.
2. Jalankan `npm run build` dan pastikan folder `dist/` terbentuk.
3. Jalankan `npm run preview` untuk cek hasil build lokal.
4. Pastikan `.env`, `.env.local`, `dist/`, `node_modules/`, file log, dan file rahasia tidak ikut commit.
5. Pastikan tidak ada `VITE_AI_API_KEY`, service role key, database connection string, password database, atau token private di frontend.

Variabel deploy frontend:

```env
VITE_SUPABASE_URL=https://project-id.supabase.co
VITE_SUPABASE_ANON_KEY=anon-public-key
VITE_AI_PROXY_URL=https://project-id.functions.supabase.co/ai-router
VITE_AI_MODE=mock
VITE_AI_MONTHLY_BUDGET=10
VITE_OCR_MODE=mock
```

Catatan ENV:

- `VITE_SUPABASE_URL` harus Project URL Supabase, bukan database URL `postgresql://...`.
- `VITE_SUPABASE_ANON_KEY` harus anon public key, bukan service role key.
- Jangan membuat `VITE_AI_API_KEY`; private key AI hanya disimpan sebagai Supabase Edge Function secret.
- Jika proxy AI belum deploy, biarkan `VITE_AI_MODE=mock`.

Panduan deploy static hosting:

1. Jalankan `npm run build`.
2. Upload folder `dist/` ke hosting static seperti Vercel, Netlify, Cloudflare Pages, Nginx, atau hosting panel yang mendukung static site.
3. Isi environment variable di dashboard hosting, bukan di file repo.
4. Untuk Vite SPA, aktifkan fallback route ke `index.html` jika hosting memakai rewrite rules.
5. Setelah deploy, cek halaman Dashboard, transaksi, Pengaturan, Laporan, dan AI Assistant dalam mode mock terlebih dahulu.

Panduan Deploy Preview Vercel:

1. Import repository ke Vercel.
2. Pilih Framework Preset: `Vite`.
3. Pastikan Build Command: `npm run build`.
4. Pastikan Output Directory: `dist`.
5. Isi Environment Variables di Vercel Project Settings. Untuk preview tanpa backend, semua ENV boleh dikosongkan kecuali ingin mengetes Supabase/AI proxy.
6. `vercel.json` sudah menyiapkan rewrite `/(.*)` ke `/index.html` agar refresh route React tidak 404.
7. Deploy preview, lalu cek Dashboard, Pemasukan, Pengeluaran, Laporan, Pengaturan, dan AI Assistant.

Environment Variables Vercel:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AI_PROXY_URL=
VITE_AI_MODE=mock
VITE_AI_MONTHLY_BUDGET=10
VITE_OCR_MODE=mock
```

Catatan Vercel:

- Jangan isi key asli di file repo; isi hanya dari Vercel dashboard.
- `VITE_SUPABASE_URL` harus Project URL Supabase, bukan database URL.
- `VITE_SUPABASE_ANON_KEY` harus anon public key.
- `VITE_AI_PROXY_URL` hanya diisi jika Supabase Edge Function `ai-router` sudah deploy.
- Private key AI tetap disimpan di Supabase secrets, bukan di Vercel frontend ENV.

Panduan deploy Supabase:

1. Buat project Supabase.
2. Jalankan `supabase/schema.sql` dari SQL Editor.
3. Jalankan `supabase/seed.sql` jika butuh data contoh.
4. Pastikan bucket `transaction-proofs`, `company-logos`, dan `backups` tersedia.
5. Deploy Edge Function `supabase/functions/ai-router/index.ts` jika ingin mode AI real.
6. Set Supabase secrets untuk Edge Function, bukan di React:

```bash
supabase secrets set AI_PROVIDER=deepseek
supabase secrets set AI_API_KEY=isi_di_supabase_secret
supabase secrets set AI_MODEL=deepseek-chat
supabase secrets set AI_MONTHLY_BUDGET=10
```

Catatan keamanan production:

- Aktifkan RLS dan uji akses per company sebelum data asli dipakai.
- Isi `users_profile.auth_user_id` dengan UUID Supabase Auth user nyata.
- Perketat policy storage untuk bukti transaksi, logo, dan backup.
- Rotasi key jika pernah tertempel di chat, screenshot, log, atau file lokal.
- AI usage counter saat ini masih estimasi localStorage; production perlu pencatatan server-side agar budget tidak bisa dimanipulasi dari browser.

## Struktur File

- `index.html` - entry HTML Vite.
- `src/main.jsx` - React bootstrap.
- `src/App.jsx` - state utama, routing mock, toast, drawer, backup/restore, AI handler.
- `src/data/mockData.js` - mock data, nav item, helper format, mock response AI.
- `src/lib/supabaseClient.js` - konfigurasi Supabase yang aktif hanya jika ENV lengkap.
- `src/services/financeService.js` - repository data finance dengan mock fallback.
- `src/services/settingsService.js` - service pengaturan, log, dan backup record.
- `src/services/authService.js` - Supabase Auth email/password dengan mode Demo/Mock.
- `src/services/transactionService.js` - CRUD transaksi dasar dengan mock fallback.
- `src/services/approvalService.js` - CRUD approval dan aksi approve/reject/revisi.
- `src/services/roleService.js` - role access dasar untuk UI.
- `src/services/activityLogService.js` - activity log ringan dan export log mock.
- `src/services/reportService.js` - service ringkasan laporan, laporan per jenis, export CSV/JSON, dan Copy WhatsApp.
- `src/services/masterDataService.js` - CRUD master data Proyek, Rekening, dan Kategori dengan mock fallback.
- `src/services/payableReceivableService.js` - CRUD hutang dan piutang dengan aksi bayar/terima sebagian dan lunas.
- `src/services/pettyCashService.js` - CRUD kas kecil, top up, pengeluaran kas, dan summary kas kecil.
- `src/services/uploadService.js` - service upload storage Supabase dengan mock fallback.
- `src/services/aiService.js` - service AI proxy dengan mode mock/real, usage counter, budget guard, laporan AI, OCR task, dan fallback aman.
- `src/services/ocrService.js` - OCR nota/bukti transaksi dengan mock default, cache sementara, dan jalur proxy vision nanti.
- `supabase/schema.sql` - desain database Supabase, RLS awal, dan bucket storage.
- `supabase/seed.sql` - data contoh Supabase.
- `supabase/functions/ai-router/index.ts` - Supabase Edge Function proxy AI teks dengan DeepSeek.
- `src/components/` - shell, navigasi, card, badge, table, drawer, insight.
- `src/pages/` - halaman DOMPET PT AI.
- `src/styles/tokens.css` - token warna inti.
- `src/styles/global.css` - CSS hasil migrasi dari prototype static.
- `public/assets/receipt-reference.png` - gambar contoh bukti nota untuk Vite.
- `static-prototype/` - salinan file static lama sebagai referensi.
- `stitch_dompet_pt_ai_finance_dashboard/` - bahan referensi desain Stitch AI.

## Daftar Halaman

- Dashboard
- Pemasukan
- Pengeluaran
- Approval
- Proyek
- Laporan
- Rekening
- Kategori
- Kas Kecil
- Hutang & Piutang
- User & Role
- Pengaturan
- AI Assistant

## Fitur Dummy

- Tambah transaksi melalui drawer.
- Aksi approval: Setujui, Tolak, Minta Revisi.
- Ekspor CSV, JSON, dan Copy WhatsApp pada Laporan sudah berjalan lokal; PDF masih placeholder `Segera`.
- Cadangkan JSON, pratinjau pulihkan JSON, dan ekspor log.
- Unggah logo memakai Supabase Storage jika siap, fallback ke pratinjau lokal.
- Unggah bukti/nota memakai upload service, fallback ke pratinjau lokal, dan OCR mock bisa mengisi form transaksi.
- Quick action AI, usage counter, cek duplikat, budget guard, laporan otomatis, insight dashboard, dan chat AI hemat berjalan dari logic/mock lokal atau proxy `ai-router` jika dikonfigurasi.
- Upload nota kas kecil masih dummy; field URL sudah tersedia untuk tahap integrasi upload berikutnya.

## Catatan

- Backend Supabase baru tahap 1: schema, seed, service, dan ENV.
- Login Supabase Auth dan login Demo sudah disiapkan di UI.
- AI API teks sudah disiapkan via Supabase Edge Function proxy, tetap fallback mock jika belum deploy.
- OCR nota/bukti transaksi sudah siap mode mock; mode real menunggu provider vision/OCR di proxy.
- Cek duplikat dan Budget Guard sudah lokal/mock; penjelasan AI real menunggu proxy aktif.
- Laporan otomatis AI dan insight dashboard memakai summary lokal; kualitas real meningkat saat proxy aktif.
- AI usage counter memakai localStorage dan reset dummy; production perlu billing/usage table server-side.
- Belum ada payment logic rumit.
- CRUD transaksi, approval, upload bukti/logo, dan settings perusahaan sudah punya service Supabase dasar, tetapi modul lain masih banyak memakai state/mock.
- Prototype static lama tidak dihapus dan tersedia di `static-prototype/`.
