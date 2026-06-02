# AGENTS.md - DOMPET PT AI

## Tujuan Project
Project ini adalah aplikasi DOMPET PT AI untuk management pemasukan, pengeluaran, kas kecil, hutang piutang, approval, rekening, project, laporan, backup restore, log aktivitas, dan AI finance assistant hemat budget $10/bulan.

## Aturan Umum
- Fokus utama: UI/UX frontend dulu.
- Jangan buat backend kecuali diminta.
- Jangan ubah logic penting tanpa izin.
- Gunakan mock data dulu.
- Desain harus profesional, compact, modern, responsive.
- Bahasa UI menggunakan Bahasa Indonesia.
- Style finance enterprise, bukan wireframe mentah.

## Platform
Android:
- Kotlin
- Jetpack Compose
- Material 3 / Material You
- Navigation Compose
- MVVM atau MVI ringan
- ViewModel
- StateFlow
- Repository pattern
- Room untuk offline database
- DataStore untuk setting/login/token ringan

Web:
- Responsive dashboard
- Sidebar desktop
- Bottom navigation mobile
- Card statistik
- Table transaksi
- Drawer form kanan
- Modal detail
- Toast notification

## Tema UI
- Default dark mode
- Background: dark navy
- Card: dark charcoal
- Accent: emerald green dan cyan
- Warning: amber
- Danger: red
- Font compact dan mudah dibaca

## Fitur Wajib
- Dashboard
- Pemasukan
- Pengeluaran
- Kas Kecil
- Hutang & Piutang
- Approval
- Rekening
- Project
- Kategori
- Laporan
- AI Assistant
- Settings
- Backup & Restore
- Log Aktivitas
- User & Role

## Settings Wajib
Settings harus bisa:
- Ganti nama aplikasi
- Ganti tagline
- Ganti nama perusahaan
- Upload logo
- Pilih warna utama
- Dark/light/system mode
- Backup data
- Restore data
- Preview restore
- Log aktivitas user
- Export log
- User access dan security

## AI Assistant
AI harus mode hemat:
- Budget $10/bulan
- AI tidak jalan terus menerus
- AI hanya aktif saat user klik/bertanya
- Fitur: ringkas laporan, cek duplikat, analisa budget, kategori otomatis, input transaksi bebas

## Cara Kerja Codex
- Jangan baca seluruh repo sekaligus.
- Baca hanya file relevan.
- Jika task besar, buat plan dulu.
- Implement bertahap.
- Setelah edit, cek error/build.
- Jangan hapus fitur lama.
- Jelaskan perubahan singkat dan jelas.
