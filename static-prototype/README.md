# DOMPET PT AI - Frontend Static

DOMPET PT AI saat ini adalah prototype frontend static untuk dashboard keuangan perusahaan. Semua data masih mock di `app.js`; belum ada backend, API, database, autentikasi nyata, atau penyimpanan permanen.

## Cara Buka

1. Buka file `index.html` langsung di browser modern.
2. Tidak perlu install dependency.
3. Jika browser memblokir upload file lokal, jalankan dari server static sederhana milik editor/browser, tetapi aplikasi tetap tidak membutuhkan backend.

## Struktur File

- `index.html` - entry HTML static.
- `styles.css` - tema, layout responsive, komponen UI, table, drawer, bottom navigation.
- `app.js` - mock data, render halaman, event dummy, backup/restore preview, AI Assistant hemat.
- `assets/receipt-reference.png` - gambar contoh bukti nota.
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
- Ekspor PDF, Excel, dan Salin WhatsApp pada Laporan.
- Cadangkan JSON, pratinjau pulihkan JSON, dan ekspor log.
- Unggah logo dengan pratinjau lokal.
- Unggah bukti/nota masih berupa tombol contoh.
- Quick action AI dan chat AI hemat berjalan dari mock response lokal.
- Filter Proyek, tab Hutang/Piutang, dan filter transaksi masih mock state.

## Catatan

- Belum ada backend.
- Belum ada database.
- Belum ada API.
- Belum ada login/session nyata.
- Semua aksi yang menulis data hanya mengubah state sementara di browser.
