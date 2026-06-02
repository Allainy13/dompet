-- DOMPET PT AI - data contoh Supabase tahap 1
-- Jalankan setelah supabase/schema.sql.
-- Seed tidak membuat Supabase Auth user dan tidak menyimpan password.
-- Buat user di Authentication > Users, gunakan email yang sama, lalu isi auth_user_id untuk production.

insert into public.companies (id, name, app_name, tagline, logo_url, primary_color, theme_mode)
values (
  '00000000-0000-4000-8000-000000000001',
  'PT Operasional Fiber Nusantara',
  'DOMPET PT AI',
  'Pusat kontrol keuangan hemat anggaran',
  null,
  '#b9c7e4',
  'dark'
)
on conflict (id) do update set
  name = excluded.name,
  app_name = excluded.app_name,
  tagline = excluded.tagline,
  primary_color = excluded.primary_color,
  theme_mode = excluded.theme_mode;

insert into public.users_profile (id, auth_user_id, company_id, name, email, role, status)
values
  ('00000000-0000-4000-8000-000000000101', null, '00000000-0000-4000-8000-000000000001', 'Admin Kontrol', 'admin@dompet.local', 'Super Admin', 'active'),
  ('00000000-0000-4000-8000-000000000102', null, '00000000-0000-4000-8000-000000000001', 'Siti Aminah', 'siti@dompet.local', 'Finance', 'active'),
  ('00000000-0000-4000-8000-000000000103', null, '00000000-0000-4000-8000-000000000001', 'Budi Santoso', 'budi@dompet.local', 'Manager', 'active'),
  ('00000000-0000-4000-8000-000000000104', null, '00000000-0000-4000-8000-000000000001', 'Dian Pratama', 'dian@dompet.local', 'Staff', 'active'),
  ('00000000-0000-4000-8000-000000000105', null, '00000000-0000-4000-8000-000000000001', 'Viewer Cabang', 'viewer@dompet.local', 'Viewer', 'inactive')
on conflict (id) do nothing;

insert into public.projects (id, company_id, code, name, pic_name, budget, status, start_date, end_date)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'PRJ-FTTH-BRT', 'Fiberisasi Area Barat', 'Budi Santoso', 1250000000, 'active', '2026-01-10', '2026-08-30'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', 'PRJ-POP-UTR', 'Modernisasi POP Utara', 'Andi Wijaya', 680000000, 'hold', '2026-02-01', '2026-07-15'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', 'PRJ-ERP-KEU', 'Implementasi ERP Keuangan', 'Siti Aminah', 320000000, 'active', '2026-04-01', '2026-10-01'),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000001', 'PRJ-CORE-BCK', 'Cadangan Link Core Network', 'Reza Pratama', 410000000, 'completed', '2025-11-01', '2026-05-20')
on conflict (id) do nothing;

insert into public.accounts (id, company_id, name, bank_name, account_number, type, opening_balance, current_balance, status)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', 'BCA Corporate', 'BCA', '892-xxxx-221', 'bank', 2700000000, 3245000000, 'active'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', 'Mandiri Giro', 'Mandiri', '104-xxxx-771', 'bank', 2100000000, 1860000000, 'active'),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000001', 'Kas Kecil HQ', null, 'CASH-HQ', 'petty_cash', 50000000, 68000000, 'active'),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000001', 'BRI Cabang Barat', 'BRI', '330-xxxx-119', 'bank', 0, 0, 'inactive')
on conflict (id) do nothing;

insert into public.categories (id, company_id, name, type, group_name, status)
values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000001', 'Termin Proyek', 'income', 'Pemasukan', 'active'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000001', 'Retensi Klien', 'income', 'Pemasukan', 'active'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000001', 'Infrastruktur', 'expense', 'Pengeluaran', 'active'),
  ('00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000001', 'Fasilitas', 'expense', 'Pengeluaran', 'active'),
  ('00000000-0000-4000-8000-000000000405', '00000000-0000-4000-8000-000000000001', 'Pemasaran', 'expense', 'Pengeluaran', 'active'),
  ('00000000-0000-4000-8000-000000000406', '00000000-0000-4000-8000-000000000001', 'BBM Teknisi', 'petty_cash', 'Kas Kecil', 'active'),
  ('00000000-0000-4000-8000-000000000407', '00000000-0000-4000-8000-000000000001', 'Konsumsi Lapangan', 'petty_cash', 'Kas Kecil', 'inactive')
on conflict (id) do nothing;

insert into public.transactions (id, company_id, project_id, account_id, category_id, transaction_no, type, date, title, vendor_or_source, payment_method, amount, tax_amount, note, proof_url, status, ai_category, ai_risk, created_by, approved_by, approved_at)
values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000401', 'TRX-2401', 'income', '2026-06-01', 'Termin 2 Proyek Fiberisasi Area Barat', 'Enterprise Fiber Barat', 'transfer', 485000000, 0, 'Termin kedua proyek FTTH Barat.', null, 'paid', 'Termin Proyek', 'Aman', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000103', '2026-06-01 10:20:00+07'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000403', 'TRX-2402', 'expense', '2026-06-01', 'Pembayaran Vendor OLT dan Splitter', 'Vendor OLT Nusantara', 'transfer', 175000000, 0, 'Menunggu approval manager.', null, 'pending', 'Infrastruktur', 'Perlu Cek', '00000000-0000-4000-8000-000000000102', null, null),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000001', null, '00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000406', 'TRX-2403', 'expense', '2026-05-31', 'Isi Kas Kecil Teknisi Lapangan', 'Kas Kecil HQ', 'cash', 18500000, 0, 'Top up kas teknisi lapangan.', null, 'approved', 'Kas Kecil', 'Aman', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000103', '2026-05-31 14:10:00+07'),
  ('00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000402', 'TRX-2404', 'income', '2026-05-30', 'Pelunasan Faktur Pemeliharaan Core', 'Klien Gedung A', 'transfer', 128000000, 0, 'Pelunasan pemeliharaan core.', null, 'paid', 'Retensi Klien', 'Aman', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000103', '2026-05-30 11:20:00+07'),
  ('00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000001', null, '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000404', 'TRX-2405', 'expense', '2026-05-29', 'Sewa Gudang Material POP', 'Gudang Barat Sentosa', 'transfer', 32500000, 0, 'Ditolak karena RAB belum sesuai.', null, 'rejected', 'Fasilitas', 'Melebihi Anggaran', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000103', '2026-05-29 17:30:00+07')
on conflict (id) do nothing;

insert into public.approvals (id, company_id, transaction_id, requested_by, approved_by, status, note, ai_risk)
values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000102', null, 'pending', 'Faktur dan PO lengkap. Anggaran terpakai 72%.', 'Perlu Cek'),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000103', 'approved', 'Nota lengkap.', 'Aman'),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000103', 'rejected', 'Perlu revisi RAB.', 'Melebihi Anggaran')
on conflict (id) do nothing;

insert into public.debts (id, company_id, project_id, vendor_name, invoice_no, invoice_date, due_date, total_amount, paid_amount, status, note)
values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'Vendor Kabel FO', 'INV-VFO-0601', '2026-06-01', '2026-06-10', 76000000, 0, 'unpaid', 'Tagihan kabel feeder untuk FTTH Barat.'),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000001', null, 'Sewa Gudang POP', 'INV-GDG-0529', '2026-05-29', '2026-06-05', 32500000, 12000000, 'partial', 'Pembayaran termin sewa gudang POP.')
on conflict (id) do nothing;

insert into public.receivables (id, company_id, project_id, client_name, invoice_no, invoice_date, due_date, total_amount, received_amount, status, note)
values
  ('00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000204', 'Klien Gedung A', 'AR-GA-0530', '2026-05-30', '2026-06-03', 65000000, 0, 'overdue', 'Tagihan pemeliharaan core belum diterima.'),
  ('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'Enterprise Fiber Barat', 'AR-EFB-0601', '2026-06-01', '2026-06-15', 485000000, 485000000, 'paid', 'Termin FTTH Barat sudah lunas.')
on conflict (id) do nothing;

insert into public.petty_cash (id, company_id, account_id, transaction_id, type, amount, note, proof_url)
values
  ('00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000503', 'top_up', 15000000, 'Isi kas teknisi barat', null),
  ('00000000-0000-4000-8000-000000000902', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000303', null, 'expense', 450000, 'BBM kendaraan survey', null),
  ('00000000-0000-4000-8000-000000000903', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000303', null, 'expense', 780000, 'Konsumsi tim instalasi', null)
on conflict (id) do nothing;

insert into public.activity_logs (id, company_id, user_id, module, action, target_id, description, device_info, ip_address, created_at)
values
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Pengaturan', 'Pratinjau pulihkan data contoh', null, 'Restore preview dijalankan tanpa apply database.', 'Web React', null, '2026-06-01 16:20:00+07'),
  ('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'Laporan', 'Ekspor laporan pemasukan', null, 'Ekspor dummy siap diganti job backend.', 'Web React', null, '2026-06-01 15:44:00+07'),
  ('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'Approval', 'Setujui transaksi TRX-2403', '00000000-0000-4000-8000-000000000503', 'Approval contoh.', 'Web React', null, '2026-06-01 14:10:00+07'),
  ('00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'AI Assistant', 'AI cek duplikat transaksi', null, 'Mode hemat, satu aksi manual.', 'Web React', null, '2026-05-31 19:12:00+07')
on conflict (id) do nothing;

insert into public.backups (id, company_id, file_url, backup_type, created_by)
values
  ('00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000000001', 'backups/example/dompet-pt-ai-backup-mock.json', 'manual', '00000000-0000-4000-8000-000000000101')
on conflict (id) do nothing;
