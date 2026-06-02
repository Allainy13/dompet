# FRONTEND SPEC - DOMPET PT AI

## Ringkasan Desain

Frontend DOMPET PT AI memakai gaya enterprise finance yang compact, gelap, dan profesional. Implementasi saat ini memakai React + Vite dengan data mock lokal. Referensi utama berasal dari folder Stitch AI: dashboard desktop, dashboard Android, transaksi, approval, laporan, proyek, dan form tambah transaksi.

Konsep utama:

- Sidebar desktop untuk navigasi lengkap.
- Topbar untuk identitas, pencarian, AI hemat, dan notifikasi.
- Bottom navigation mobile untuk aksi utama satu tangan.
- Chip navigasi modul mobile untuk membuka halaman lanjutan.
- Content area berbasis card, table, drawer kanan, dan panel form.
- Semua label UI menggunakan Bahasa Indonesia dengan istilah bisnis yang umum dipakai di finance.

## Warna

Token warna utama berada di `styles.css`.

- Background utama: dark navy.
- Surface/card: dark charcoal.
- Primary default: `#b9c7e4`.
- Emerald/income/success: untuk pemasukan, approved, paid, aktif, aman.
- Cyan/AI/info: untuk AI insight dan highlight informasi.
- Amber/warning: untuk pending, draft, sebagian, perlu cek, bukti kurang.
- Red/danger: untuk ditolak, mendesak, jatuh tempo, nonaktif, melebihi anggaran.
- Light mode tersedia sebagai pilihan tema dummy.

## Tipografi Dan Spacing

- Font utama: Inter dari Google Fonts.
- Heading compact, tidak hero besar.
- Card radius 8 sampai 14 px mengikuti permukaan enterprise.
- Tabel memakai angka tabular agar nominal rapi.
- Mobile memakai padding lebih rapat dan target tombol minimal 44 px.

## Komponen

- `AppShell` untuk layout utama.
- `Sidebar`, `Topbar`, `BottomNav` untuk navigasi desktop/mobile.
- `kpiCard` untuk statistik besar.
- `StatusBadge` untuk status transaksi, risiko AI, approval, rekening, dan role.
- `TransactionTable` untuk table desktop/mobile scroll.
- `TransactionCard` untuk card transaksi mobile.
- `Drawer` untuk tambah pemasukan/pengeluaran dan detail approval.
- `AiInsightCard` untuk insight AI.
- Toast global untuk aksi dummy.
- Swatch warna dan segmented control untuk pengaturan tema.

## Struktur React/Vite

- `src/main.jsx` memuat React, token, global CSS, dan `App`.
- `src/App.jsx` menyimpan state halaman, drawer, filter, settings, mock data, toast, backup/restore, dan AI handler.
- `src/data/mockData.js` menyimpan data mock, daftar navigasi, helper format rupiah, dan response AI contoh.
- `src/services/authService.js` menyiapkan Supabase Auth email/password dengan mode Demo/Mock.
- `src/services/transactionService.js` menyiapkan CRUD transaksi dasar dengan fallback mock.
- `src/services/approvalService.js` menyiapkan CRUD approval, update status transaksi, dan activity log ringan.
- `src/services/roleService.js` menyiapkan akses role dasar untuk Super Admin, Finance, Manager, Staff, dan Viewer.
- `src/services/activityLogService.js` menyiapkan log aktivitas dan export log mock.
- `src/services/uploadService.js` menyiapkan upload bukti transaksi, logo perusahaan, backup file, signed/public URL, dan fallback preview lokal.
- `src/services/reportService.js` menyiapkan ringkasan laporan, snapshot ringkas untuk AI, laporan arus kas/pemasukan/pengeluaran/kas kecil/hutang/piutang/proyek, export CSV/JSON, dan Copy WhatsApp.
- `src/services/masterDataService.js` menyiapkan CRUD Proyek, Rekening, dan Kategori dengan Supabase atau mock fallback.
- `src/services/payableReceivableService.js` menyiapkan CRUD Hutang dan Piutang, termasuk bayar/terima sebagian dan lunas.
- `src/services/pettyCashService.js` menyiapkan CRUD Kas Kecil, Top Up Kas, Pengeluaran Kas, dan summary kas kecil.
- `src/services/aiService.js` menyiapkan AI Assistant hemat dengan mock fallback, AI proxy, usage counter, budget guard pemakaian AI, task teks finance, cek duplikat lokal, budget guard transaksi, insight dashboard, dan laporan otomatis.
- `src/services/ocrService.js` menyiapkan OCR nota/bukti transaksi dengan mock default, cache sementara, validasi output, dan jalur proxy vision nanti.
- `src/components/` menyimpan komponen reusable.
- `src/pages/` menyimpan halaman aplikasi.
- `src/styles/tokens.css` menyimpan token warna utama.
- `src/styles/global.css` memakai CSS prototype static sebagai dasar visual.
- `static-prototype/` menyimpan salinan prototype static lama.

## Halaman

### Dashboard

Menampilkan saldo total, pemasukan bulan ini, pengeluaran bulan ini, laba bersih, transaksi terbaru, approval pending, pengeluaran per kategori, hutang jatuh tempo, piutang jatuh tempo, saldo kas kecil, chart arus kas dummy, insight AI dinamis, empty state, dan skeleton dummy. Summary memakai `financeService.getDashboardSummary`, sedangkan insight memakai `aiService.generateDashboardInsights`.

### Pemasukan

Menampilkan KPI pemasukan, filter kategori, table transaksi, card mobile, form input cepat, upload bukti transfer, OCR mock untuk mengisi form dari bukti, dan cek duplikat sebelum simpan.

### Pengeluaran

Menampilkan KPI pengeluaran, filter kategori, table transaksi, card mobile, form input cepat, upload nota, OCR mock untuk mengisi form dari invoice/nota, cek duplikat, dan Budget Guard project.

### Approval

Menampilkan ringkasan menunggu/mendesak/disetujui/ditolak, daftar approval, risiko AI, bukti, anggaran terpakai, drawer detail, serta aksi Setujui/Tolak/Minta Revisi dummy.

### Proyek

Menampilkan total anggaran, realisasi, proyek aktif, filter status Aktif/Hold/Selesai, card budget, progress anggaran, table proyek, tambah/edit proyek, ubah status Hold/Aktif, hapus untuk Super Admin, dan insight AI per proyek.

### Laporan

Menampilkan card ringkasan, pilihan laporan Arus Kas/Pemasukan/Pengeluaran/Kas Kecil/Hutang/Piutang/Per Proyek, filter tanggal awal-akhir/proyek/rekening/kategori, pratinjau tabel, catatan laporan, export CSV, export JSON, Copy WhatsApp, dan panel Laporan Otomatis AI. PDF masih tombol `Segera`.

### Rekening

Menampilkan card saldo rekening, table kas/bank, tambah/edit rekening, aktif/nonaktif, hapus untuk Super Admin, mutasi mock, dan status aktif/nonaktif.

### Kategori

Menampilkan tab kategori Pemasukan, Pengeluaran, Kas Kecil, tambah/edit kategori, aktif/nonaktif, hapus untuk Super Admin, dan status badge.

### Kas Kecil

Menampilkan saldo kas kecil, top up bulan ini, pengeluaran hari ini, sisa budget, transaksi kas kecil, top up kas, tambah pengeluaran kas, edit/hapus kas kecil sesuai role, rekap mingguan, dan tombol unggah nota dummy.

### Hutang & Piutang

Menampilkan tab Hutang/Piutang, filter status, jatuh tempo, badge dekat tempo, nominal, terbayar/diterima, tambah, edit, hapus, bayar/terima sebagian, dan tandai lunas sesuai role.

### User & Role

Menampilkan role Super Admin, Finance, Manager, Staff, Viewer, table pengguna, dan matriks izin dummy.

### Pengaturan

Menampilkan identitas aplikasi, tagline, nama perusahaan, upload logo preview, warna utama, mode tema, cadangan JSON, pulihkan JSON, pratinjau pulihkan, ekspor log, AI mode/budget/usage, akses pengguna, dan keamanan dummy.

### AI Assistant

Menampilkan budget $10/bulan, usage counter, sisa budget, jumlah request, riwayat request AI, badge AI Hemat, mode Demo/Mock atau Real via Proxy, quick action cek duplikat/budget/transaksi mencurigakan, chat lokal, dan fallback mock. AI hanya berjalan saat pengguna klik quick action atau tombol kirim.

## Flow Transaksi

1. Pengguna membuka Pemasukan atau Pengeluaran.
2. Pengguna klik Tambah atau tombol tengah bottom navigation.
3. Drawer transaksi terbuka.
4. Pengguna memilih tipe Pemasukan/Pengeluaran, proyek, kategori, rekening, tanggal, keterangan, dan bukti.
5. Tombol Simpan Transaksi memanggil `transactionService.createTransaction`.
6. Jika Supabase siap dan profil punya `company_id`, data disimpan ke tabel `transactions`.
7. Jika Supabase belum siap, transaksi ditambahkan ke state mock sementara.

## Flow OCR Nota Tahap 2C

1. Pengguna membuka Pemasukan atau Pengeluaran.
2. Pengguna klik Tambah dan memilih file bukti di drawer transaksi.
3. File gambar menampilkan preview; PDF tetap bisa dipilih tanpa preview gambar.
4. OCR tidak berjalan otomatis saat file dipilih.
5. Pengguna klik `Scan dengan AI`, `Scan Nota`, atau `Scan Bukti`.
6. `ocrService.scanReceiptImage` memvalidasi ukuran maksimal 3 MB dan format JPG/PNG/WebP/GIF/PDF.
7. Jika `VITE_OCR_MODE=mock` atau AI proxy kosong, service memakai `mockScanReceipt`.
8. Jika `VITE_OCR_MODE=real` dan proxy siap, service memanggil task `scan_receipt` melalui `aiService.runAiTask`.
9. Jika proxy error, hasil fallback ke mock dan UI menampilkan toast fallback.
10. Hasil OCR tampil sebagai pratinjau: tanggal, vendor/sumber, kategori, nominal, pajak, metode, dan confidence.
11. Tombol `Masukkan ke Form` mengisi field tanggal, judul, vendor/sumber, kategori, metode, nominal, pajak, dan catatan.
12. User tetap bisa edit manual sebelum simpan transaksi.

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

## Flow AI Cek Duplikat & Budget Guard Tahap 2D

1. Cek dasar berjalan lokal di `aiService`, bukan langsung ke provider AI.
2. `getDuplicateScore` memberi skor 0-100 dari tanggal, nominal, vendor/sumber, kategori, project, keterangan, dan bukti.
3. `findDuplicateTransactions` mengembalikan match terkuat dari data transaksi aktif.
4. `checkDuplicateBeforeSave` mengembalikan `risk`, `score`, `matches`, dan `message`.
5. Box `Cek Duplikat` di form transaksi punya tombol `Cek Sekarang` dan `Jelaskan dengan AI`.
6. Budget Guard hanya tampil di form Pengeluaran.
7. `getProjectBudgetUsage` menghitung budget, used, remaining, dan usage percent dari project + transaksi pengeluaran.
8. `analyzeProjectBudget` menghitung estimasi setelah transaksi baru.
9. Status Budget Guard: `Aman` <= 80%, `Perlu Cek` 80%-100%, `Melebihi Anggaran` > 100%.
10. Saat simpan, form menjalankan guard lokal. Jika duplikat high atau budget melebihi anggaran, user mendapat toast dan harus klik Simpan lagi sebagai konfirmasi dummy.
11. Tombol `Jelaskan dengan AI` hanya memanggil proxy jika user klik; jika proxy kosong, penjelasan fallback mock.
12. Viewer hanya bisa melihat warning dan tombol simpan nonaktif.

Output duplikat:

```json
{
  "risk": "low | medium | high",
  "score": 0,
  "matches": [],
  "message": ""
}
```

Output budget:

```json
{
  "status": "Aman | Perlu Cek | Melebihi Anggaran",
  "budget": 0,
  "used": 0,
  "remaining": 0,
  "afterTransaction": 0,
  "usagePercent": 0,
  "message": ""
}
```

## Flow Login

1. Jika Supabase ENV kosong atau tidak valid, aplikasi masuk mode Demo/Mock.
2. Jika pengguna klik Keluar, halaman login tampil dengan tombol Masuk Demo.
3. Jika Supabase ENV valid, login memakai Supabase Auth email/password.
4. Profil pengguna dibaca dari `users_profile`, termasuk `role` dan `company_id`.

## Flow Approval Dan Role Access

1. Pengguna membuka Approval.
2. Role aktif tampil di header dan tombol approval mengikuti izin role.
3. Manager dan Super Admin bisa Setujui, Tolak, atau Minta Revisi.
4. Finance, Staff, dan Viewer tidak bisa approval; Viewer mendapat toast `Mode Viewer`.
5. Aksi approval memakai `approvalService` dan mencatat activity log ringan.
6. Jika Supabase siap, tabel `approvals` dan `transactions` ikut diupdate.
7. Jika Supabase belum siap, perubahan terjadi di state mock lokal.

## Flow Storage Dan Settings Perusahaan

1. Upload bukti transaksi memakai `uploadTransactionProof(file, transactionId, companyId)`.
2. Jika Supabase Storage siap, file masuk bucket `transaction-proofs` dan `proof_url` dipakai di transaksi.
3. Jika Storage belum siap atau bucket error, UI menampilkan toast rapi dan fallback preview lokal.
4. Upload logo memakai `settingsService.updateCompanyLogo(file, companyId)` lalu menyimpan `companies.logo_url` jika Supabase siap.
5. Nama aplikasi, tagline, perusahaan, warna utama, dan mode tema memakai `updateCompanySettings`.
6. Backup/restore masih mock tetapi sudah punya service `exportBackupMock`, `previewRestoreMock`, dan `restoreBackupMock`.

## Flow Laporan Dan Export

1. Pengguna membuka Laporan.
2. `reportService.getReportPreview` mengambil data dari Supabase melalui `financeService` jika ENV siap, atau mock fallback jika belum.
3. Pengguna memilih jenis laporan dan filter tanggal awal, tanggal akhir, proyek, rekening, kategori.
4. Card ringkasan dan tabel pratinjau diperbarui sesuai filter.
5. Ekspor CSV dan JSON membuat file dari string/browser Blob tanpa dependency tambahan.
6. Copy WhatsApp memakai clipboard browser; jika gagal, UI menampilkan textarea fallback.
7. Aksi export mencatat activity log ringan dan mengikuti `roleService.canExport`.
8. Viewer/Staff tetap bisa lihat laporan tetapi tidak bisa export.

## Flow Laporan Otomatis AI Tahap 2E

1. Pengguna membuka Laporan dan mengatur filter periode, project, rekening, dan kategori.
2. Panel `Laporan Otomatis AI` menyediakan tombol `Ringkas dengan AI`, `Buat Laporan Owner`, `Buat Laporan Manager`, `Buat Laporan Finance`, dan `Copy WhatsApp AI`.
3. `aiService` membangun summary lokal kecil dari pemasukan, pengeluaran, kategori terbesar, approval pending, hutang/piutang, kas kecil, project risk, dan transaksi mencurigakan.
4. Jika AI proxy kosong, laporan dibuat dari generator lokal dan diberi badge Demo/Mock.
5. Jika AI proxy aktif dan mode real dipilih dari ENV, summary kecil dikirim ke `ai-router` saat tombol diklik.
6. Hasil laporan tampil di textarea read-only dengan tombol `Copy`, `Download JSON`, dan `Regenerate`.
7. Hasil di-cache sementara berdasarkan jenis laporan, jumlah data, dan filter.
8. Viewer/Staff bisa membaca hasil, tetapi export/copy mengikuti guard role export.

Format laporan:

- Owner: ringkas, angka utama, masalah penting, rekomendasi tindakan.
- Manager: fokus project, budget, approval pending, dan risiko pengeluaran.
- Finance: detail pemasukan/pengeluaran, kategori terbesar, transaksi pending, hutang/piutang, dan kas kecil.

## Flow Master Data

1. Pengguna membuka Proyek, Rekening, atau Kategori.
2. Halaman memanggil `masterDataService` untuk membaca data dari Supabase jika ENV dan `company_id` siap.
3. Jika Supabase belum aktif atau profil perusahaan belum valid, halaman memakai mock data dan update state lokal.
4. Finance bisa tambah/edit master data; Super Admin bisa tambah/edit/hapus.
5. Staff dan Viewer hanya melihat data. Viewer mendapat toast `Mode Viewer` saat klik aksi tulis.
6. Operasi Supabase mencatat `activity_logs` ringan.
7. Proyek memakai status `Aktif`, `Hold`, `Selesai`; Rekening dan Kategori memakai `Aktif`, `Nonaktif`.

## Flow Dashboard Summary

1. Dashboard memulai tampilan dari data mock aktif agar UI langsung tampil.
2. `financeService.getDashboardSummary` menghitung saldo total, pemasukan, pengeluaran, laba bersih, transaksi terbaru, approval pending, pengeluaran per kategori, hutang jatuh tempo, piutang jatuh tempo, dan saldo kas kecil.
3. Jika Supabase siap, summary memakai data tabel finance sesuai company profile.
4. Jika Supabase kosong atau ENV tidak aktif, summary tetap memakai fallback mock/default aman.

## Flow Insight Dashboard AI Tahap 2E

1. Dashboard menghitung insight lokal dari `aiService.generateDashboardInsights`.
2. Insight yang tampil: pengeluaran terbesar, kas kecil, hutang/piutang, budget project, transaksi mencurigakan, dan rekomendasi tindakan.
3. Tombol `Refresh Insight` menghitung ulang insight dari data aktif tanpa memanggil provider AI.
4. Provider AI tidak berjalan otomatis agar budget tetap hemat.

## Flow Hutang Dan Piutang

1. Pengguna membuka Hutang & Piutang.
2. Halaman membaca `debts` dan `receivables` melalui `payableReceivableService`.
3. Jika Supabase belum siap, data memakai mock dan perubahan hanya berlaku di state halaman.
4. Finance dan Super Admin bisa tambah/edit hutang dan piutang.
5. Super Admin bisa hapus; Viewer dan role tanpa izin mendapat toast `Mode Viewer` atau `Akses ditolak`.
6. Aksi bayar sebagian dan lunas mengubah `paid_amount` pada Hutang atau `received_amount` pada Piutang.
7. Setiap operasi Supabase mencatat `activity_logs` ringan.

## Flow Kas Kecil

1. Pengguna membuka Kas Kecil.
2. Halaman membaca `petty_cash` melalui `pettyCashService` dan menghitung saldo/top up/pengeluaran/sisa budget.
3. Finance dan Super Admin bisa top up dan tambah pengeluaran.
4. Staff hanya boleh input pengeluaran kas kecil.
5. Upload nota masih dummy, tetapi field `proof_url` sudah tersedia di service dan schema.
6. Jika Supabase belum siap, perubahan kas kecil hanya tersimpan di state halaman.
7. Operasi Supabase mencatat `activity_logs` ringan.

## Flow Backend QA Dan RLS

1. Frontend memakai `src/lib/supabaseClient.js` yang hanya aktif jika `VITE_SUPABASE_URL` valid `https://*.supabase.co`, anon key tersedia, dan JWT bukan `service_role`.
2. Jika ENV kosong, URL tidak valid, atau service role key tertempel, semua service kembali ke mode Demo/Mock.
3. `supabase/schema.sql` mengaktifkan RLS untuk `companies`, `users_profile`, `projects`, `accounts`, `categories`, `transactions`, `approvals`, `debts`, `receivables`, `petty_cash`, `activity_logs`, dan `backups`.
4. Helper RLS `current_company_id`, `current_user_role`, dan `has_company_role` membatasi data berdasarkan company profile aktif.
5. Policy table memakai company isolation terlebih dahulu, lalu role dasar untuk create/update/delete.
6. Policy storage mengharuskan path file diawali `company_id` pada bucket `transaction-proofs`, `company-logos`, dan `backups`.
7. Seed memakai `auth_user_id = null` untuk contoh; production harus mengisi UUID Supabase Auth, sementara schema memberi fallback bootstrap via email JWT.
8. Service layer menangani error Supabase dengan fallback mock/local agar tidak ada blank page.

## Flow AI Proxy Tahap 2B

1. Frontend membaca `VITE_AI_PROXY_URL`, `VITE_AI_MODE`, dan `VITE_AI_MONTHLY_BUDGET`.
2. Private key AI tidak pernah masuk React. Tidak ada `VITE_AI_API_KEY`.
3. Jika `VITE_AI_MODE=mock` atau URL proxy kosong, `aiService` memakai mock lokal dari `mockData`.
4. Jika proxy tersedia dan pengguna memilih `Real via Proxy`, frontend POST ke Supabase Edge Function `ai-router`.
5. Edge Function membaca secrets `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, dan `AI_MONTHLY_BUDGET` dari Supabase secrets.
6. Provider teks utama adalah DeepSeek `deepseek-chat`.
7. Edge Function membatasi prompt, payload, estimasi token, dan estimasi biaya per request.
8. Jika proxy/provider error, frontend menampilkan fallback mock tanpa blank page.
9. AI tidak berjalan otomatis di background; semua request berasal dari klik quick action atau tombol kirim.

Task AI yang didukung:

- `parse_transaction` untuk input transaksi bebas.
- `suggest_category` untuk saran kategori.
- `detect_duplicate` untuk cek transaksi mirip.
- `analyze_budget` untuk cek budget proyek/kategori.
- `summarize_report` untuk ringkasan laporan.
- `generate_whatsapp_report` untuk format laporan WhatsApp.
- `scan_receipt` untuk nota/invoice/bukti transfer.
- `extract_receipt_fields` untuk mengekstrak teks OCR menjadi transaksi.
- `chat_finance` untuk tanya jawab finance umum.

Kontrak response AI:

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

Kontrak error AI:

```json
{
  "ok": false,
  "message": "Pesan error rapi"
}
```

## Flow Settings

1. Pengguna membuka Pengaturan.
2. Pengguna mengubah nama aplikasi, tagline, atau nama perusahaan.
3. Tombol Terapkan Identitas memperbarui state UI sementara.
4. Upload logo memakai `settingsService.updateCompanyLogo`; Supabase menyimpan ke Storage jika siap, selain itu pratinjau lokal.
5. Pilih warna utama mengubah CSS variable `--primary`.
6. Mode tema Gelap/Terang/Sistem mengubah `body[data-theme]`.
7. Cadangkan Data mengunduh JSON mock.
8. Pulihkan Data membaca JSON lokal dan menampilkan pratinjau.
9. Terapkan Pulihkan Contoh hanya menerapkan nama aplikasi dari pratinjau mock.
10. Ekspor Log mengunduh CSV mock.

## Flow AI Assistant

1. AI mulai dalam mode hemat dengan budget `$10/bulan`.
2. Badge menampilkan `AI Hemat`, budget bulanan, mode aktif, usage, sisa budget, jumlah request, status, dan riwayat request.
3. Segmented control memilih `Demo/Mock` atau `Real via Proxy` jika URL proxy tersedia.
4. Quick action mengirim task siap pakai: ringkas laporan, cek duplikat transaksi, analisa budget project, cari transaksi mencurigakan, atau kategori otomatis.
5. Textarea menerima pertanyaan atau input transaksi bebas; kata kunci transaksi diarahkan ke parser mock/proxy.
6. Tombol Kirim Saat Ini menambah pesan user dan menjalankan satu request AI.
7. Usage counter bertambah dari estimasi token/cost setiap request.
8. Tidak ada proses latar belakang.

## Flow AI Usage Counter Tahap 2F

1. `getAiUsage` membaca pemakaian bulan berjalan dari localStorage.
2. `addAiUsage` mencatat task, token, cost, mode, status, waktu, dan history request.
3. `getAiBudgetStatus` menghitung sisa budget, persentase, status `safe`, `warning`, `danger`, atau `blocked`.
4. Warning aktif saat pemakaian >= 70%, danger >= 90%, soft block >= 100%.
5. Saat soft block, mode real dialihkan ke mock/local dan history mencatat blocked.
6. `resetMonthlyUsageMock` menghapus usage bulan berjalan untuk test/demo.
7. Settings menampilkan AI Mode Hemat, monthly budget, provider, proxy status, usage summary, dan reset dummy.
8. Activity log mencatat action AI utama jika Supabase siap; local history tetap aktif tanpa Supabase.

## Status Hardening Tahap 3A

1. Project siap dibuild sebagai Vite static app melalui `npm run build`.
2. Output production berada di `dist/` dan tidak boleh ikut commit.
3. App tetap masuk mode Demo/Mock jika `.env.local` kosong, Supabase ENV tidak valid, atau AI proxy belum deploy.
4. `.env.example` hanya berisi placeholder public ENV dan tidak memuat private AI key.
5. `.gitignore` wajib menahan `node_modules`, `dist`, `.env`, `.env.local`, `.env.*.local`, log, dan file workspace lokal.
6. Deploy frontend cukup memakai static hosting; semua koneksi data tetap melalui Supabase client dan Edge Function proxy.
7. Supabase production perlu RLS, storage policy, Auth user nyata, dan secret Edge Function yang dikelola dari dashboard/CLI Supabase.
8. Android Compose nanti harus mengikuti pola yang sama: tidak menyimpan service role key atau AI API key di client.

## Responsive

- Desktop: sidebar lengkap, topbar, table penuh, drawer kanan.
- Tablet: grid KPI dan konten turun menjadi dua atau satu kolom.
- Mobile: sidebar disembunyikan, bottom navigation aktif, chip navigasi modul tampil, table transaksi berubah menjadi card, table modul lain bisa scroll horizontal, drawer full width.

## Catatan Migrasi React/Web

- Pisahkan `mock` menjadi service/mock repository.
- Pecah renderer menjadi komponen: Shell, Sidebar, Topbar, BottomNav, PageHeader, KpiCard, StatusBadge, Table, Drawer, Toast.
- Gunakan state manager ringan seperti React state/context terlebih dahulu.
- Hubungkan aksi dummy ke API setelah kontrak backend siap.
- Pertahankan token warna di CSS variables atau design token JSON.
- Tambahkan route per halaman agar URL bisa di-bookmark.

## Catatan Migrasi Android Compose

- Shell desktop diterjemahkan menjadi NavigationRail/Drawer untuk tablet dan NavigationBar untuk mobile.
- Card KPI menjadi Material 3 Card dengan warna token yang sama.
- StatusBadge menjadi AssistChip/SuggestionChip custom.
- Drawer transaksi menjadi ModalBottomSheet pada mobile.
- Table desktop perlu diganti LazyColumn card untuk Android.
- Settings memakai DataStore untuk identitas ringan dan tema.
- Data mock bisa dipindah ke Repository pattern, lalu diganti Room/API saat backend tersedia.
- AI Assistant tetap event-based agar biaya hemat dan tidak berjalan di background.
- Untuk mode real, Android/Web sebaiknya tetap memanggil proxy backend/Edge Function, bukan menyimpan key AI di client.
- OCR real sebaiknya memakai provider vision di Edge Function dan hanya mengirim file URL/signed URL ringkas, bukan private key atau service role dari client.

## Batasan Saat Ini

- Backend Supabase tahap awal sudah disiapkan untuk schema, service, Auth, dan CRUD transaksi dasar.
- RLS dasar company isolation dan role access sudah disiapkan di `supabase/schema.sql`.
- Role permission UI masih ringan walau profil Supabase sudah bisa dibaca.
- Penyimpanan permanen baru siap untuk transaksi dan approval jika ENV Supabase dan profil user valid.
- CRUD master data Proyek, Rekening, dan Kategori sudah siap memakai Supabase atau state demo.
- CRUD Hutang, Piutang, dan Kas Kecil sudah siap memakai Supabase atau state demo.
- Storage permanen siap untuk bukti transaksi dan logo perusahaan jika bucket dan policy Supabase sudah dibuat.
- Belum ada validasi form produksi.
- Export CSV, JSON, dan Copy WhatsApp pada Laporan sudah berjalan dari data aktif; PDF masih placeholder.
- Upload nota transaksi sudah melalui `uploadService`, OCR mock mengisi form, dan tetap fallback ke pratinjau lokal saat Supabase/AI proxy belum siap.
- Upload nota kas kecil masih dummy; `proof_url` sudah tersedia untuk integrasi berikutnya.
- AI teks real sudah disiapkan lewat `supabase/functions/ai-router`, tetapi akan tetap mock sampai Edge Function deploy dan secrets Supabase diisi.
- OCR nota real dengan Gemini Flash Lite/provider vision belum dikerjakan pada tahap ini; task proxy dan UI sudah disiapkan, default masih mock.
- Insight dashboard dan laporan otomatis AI sudah memakai summary lokal/cache; kualitas narasi real meningkat saat proxy aktif.
- AI usage counter memakai localStorage dan estimasi biaya; production perlu tabel usage server-side untuk billing dan limit yang kuat.
