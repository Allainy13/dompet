# FRONTEND SPEC - DOMPET PT AI

## Ringkasan Desain

Frontend DOMPET PT AI memakai gaya enterprise finance yang compact, gelap, dan profesional. Referensi utama berasal dari folder Stitch AI: dashboard desktop, dashboard Android, transaksi, approval, laporan, proyek, dan form tambah transaksi.

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
- Red/danger: untuk rejected, urgent, jatuh tempo, nonaktif, melebihi anggaran.
- Light mode tersedia sebagai pilihan tema dummy.

## Tipografi Dan Spacing

- Font utama: Inter dari Google Fonts.
- Heading compact, tidak hero besar.
- Card radius 8 sampai 14 px mengikuti permukaan enterprise.
- Tabel memakai angka tabular agar nominal rapi.
- Mobile memakai padding lebih rapat dan target tombol minimal 44 px.

## Komponen

- `kpiCard` untuk statistik besar.
- `statusBadge` untuk status transaksi, risiko AI, approval, rekening, dan role.
- `renderTable` untuk table desktop/mobile scroll.
- `renderTransactionsPanel` untuk table desktop dan card transaksi mobile.
- `renderDrawer` untuk tambah pemasukan/pengeluaran.
- `renderApprovalDrawer` untuk detail approval.
- `renderEmptyState` untuk state kosong dummy.
- `renderQuickAction` untuk AI Assistant hemat.
- Toast global untuk aksi dummy.
- Swatch warna dan segmented control untuk pengaturan tema.

## Halaman

### Dashboard

Menampilkan KPI pemasukan, pengeluaran, saldo operasional, approval pending, chart arus kas dummy, approval ringkas, insight AI, empty state, dan skeleton dummy.

### Pemasukan

Menampilkan KPI pemasukan, filter kategori, table transaksi, card mobile, dan form input cepat.

### Pengeluaran

Menampilkan KPI pengeluaran, filter kategori, table transaksi, card mobile, dan form input cepat.

### Approval

Menampilkan ringkasan pending/urgent/disetujui/ditolak, daftar approval, risiko AI, bukti, anggaran terpakai, drawer detail, serta aksi Setujui/Tolak/Minta Revisi dummy.

### Proyek

Menampilkan total anggaran, realisasi, proyek aktif, filter status Aktif/Hold/Selesai, card budget, progress anggaran, table proyek, dan insight AI per proyek.

### Laporan

Menampilkan pilihan jenis laporan, filter periode/proyek/rekening/kategori, pratinjau laporan, dan tombol ekspor PDF/Excel/WhatsApp dummy.

### Rekening

Menampilkan card saldo rekening, table kas/bank, mutasi mock, dan status aktif/nonaktif.

### Kategori

Menampilkan kategori pemasukan, pengeluaran, kas kecil, serta aksi tambah/edit/nonaktif dummy.

### Kas Kecil

Menampilkan saldo kas kecil, isi kas, pengeluaran harian, rekap mingguan, transaksi kas kecil, dan tombol unggah nota dummy.

### Hutang & Piutang

Menampilkan tab Hutang/Piutang, jatuh tempo, nominal, terbayar, dan status pembayaran.

### User & Role

Menampilkan role Super Admin, Finance, Manager, Staff, Viewer, table pengguna, dan matriks izin dummy.

### Pengaturan

Menampilkan identitas aplikasi, tagline, nama perusahaan, upload logo preview, warna utama, mode tema, cadangan JSON, pulihkan JSON, pratinjau pulihkan, ekspor log, akses pengguna, dan keamanan dummy.

### AI Assistant

Menampilkan budget $10/bulan, quick action, chat lokal, dan mock response. AI hanya berjalan saat pengguna klik quick action atau tombol kirim.

## Flow Transaksi

1. Pengguna membuka Pemasukan atau Pengeluaran.
2. Pengguna klik Tambah atau tombol tengah bottom navigation.
3. Drawer transaksi terbuka.
4. Pengguna memilih tipe Pemasukan/Pengeluaran, proyek, kategori, rekening, tanggal, keterangan, dan bukti.
5. Tombol Simpan Transaksi menutup drawer dan menambah log aktivitas contoh.

## Flow Settings

1. Pengguna membuka Pengaturan.
2. Pengguna mengubah nama aplikasi, tagline, atau nama perusahaan.
3. Tombol Terapkan Identitas memperbarui state UI sementara.
4. Upload logo memakai FileReader untuk pratinjau lokal.
5. Pilih warna utama mengubah CSS variable `--primary`.
6. Mode tema Gelap/Terang/Sistem mengubah `body[data-theme]`.
7. Cadangkan Data mengunduh JSON mock.
8. Pulihkan Data membaca JSON lokal dan menampilkan pratinjau.
9. Terapkan Pulihkan Contoh hanya menerapkan nama aplikasi dari pratinjau mock.
10. Ekspor Log mengunduh CSV mock.

## Flow AI Assistant

1. AI mulai dalam mode hemat dengan usage mock `$2.65 / $10`.
2. Quick action mengirim prompt siap pakai.
3. Textarea menerima pertanyaan atau input transaksi bebas.
4. Tombol Kirim Saat Ini menambah pesan user dan mock response AI.
5. Usage bertambah kecil per aksi.
6. Tidak ada proses latar belakang.

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

## Batasan Saat Ini

- Belum ada backend.
- Belum ada autentikasi atau role permission nyata.
- Belum ada penyimpanan permanen.
- Belum ada validasi form produksi.
- Ekspor PDF/Excel/WhatsApp masih toast dummy.
- Upload nota masih tombol dummy, kecuali upload logo dan restore JSON yang memakai preview lokal.
