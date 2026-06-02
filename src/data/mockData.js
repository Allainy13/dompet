export const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "pemasukan", label: "Pemasukan", icon: "arrow_downward" },
  { id: "pengeluaran", label: "Pengeluaran", icon: "arrow_upward" },
  { id: "kas-kecil", label: "Kas Kecil", icon: "account_balance_wallet" },
  { id: "hutang-piutang", label: "Hutang & Piutang", icon: "handshake" },
  { id: "approval", label: "Approval", icon: "fact_check" },
  { id: "rekening", label: "Rekening", icon: "account_balance" },
  { id: "project", label: "Proyek", icon: "work" },
  { id: "kategori", label: "Kategori", icon: "category" },
  { id: "laporan", label: "Laporan", icon: "analytics" },
  { id: "ai", label: "AI Assistant", icon: "auto_awesome" },
  { id: "user-role", label: "User & Role", icon: "admin_panel_settings" },
  { id: "settings", label: "Pengaturan", icon: "settings" },
];

export const bottomItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "pemasukan", label: "Masuk", icon: "arrow_downward" },
  { id: "add", label: "Tambah", icon: "add_circle", action: "open-drawer" },
  { id: "pengeluaran", label: "Keluar", icon: "arrow_upward" },
  { id: "settings", label: "Atur", icon: "settings" },
];

export const initialSettings = {
  appName: "DOMPET PT AI",
  tagline: "Pusat kontrol keuangan hemat anggaran",
  companyName: "PT Operasional Fiber Nusantara",
  logo: "",
  primary: "#b9c7e4",
  theme: "dark",
};

export const initialAiMessages = [
  { role: "ai", text: "Mode hemat aktif. AI hanya berjalan saat tombol aksi atau tombol kirim ditekan." },
];

export const financeFilters = ["Semua", "Proyek", "Infrastruktur", "Kas Kecil", "Fasilitas", "Pemasaran"];

export const categoryGroups = ["Pemasukan", "Pengeluaran", "Kas Kecil"];

export const projectStatusFilters = [
  { value: "Semua", label: "Semua" },
  { value: "Aktif", label: "Aktif" },
  { value: "Hold", label: "Tertahan" },
  { value: "Selesai", label: "Selesai" },
];

export const reportTypes = [
  { value: "cashflow", title: "Arus Kas", text: "Aliran dana masuk dan keluar", icon: "sync_alt", featured: true },
  { value: "income", title: "Pemasukan", text: "Termin dan pendapatan", icon: "south_west" },
  { value: "expense", title: "Pengeluaran", text: "Biaya operasional", icon: "north_east" },
  { value: "petty_cash", title: "Kas Kecil", text: "Rekap kas mingguan", icon: "account_balance_wallet" },
  { value: "debt", title: "Hutang", text: "Kewajiban vendor", icon: "receipt_long" },
  { value: "receivable", title: "Piutang", text: "Tagihan klien", icon: "request_quote" },
  { value: "project", title: "Per Proyek", text: "Anggaran dan realisasi", icon: "work" },
];

export const userRoles = ["Super Admin", "Finance", "Manager", "Staff", "Viewer"];

export const permissions = ["Dashboard", "Transaksi", "Approval", "Laporan", "Pengaturan"];

export const mockData = {
  transactions: [
    { id: "TRX-2401", date: "01 Jun 2026", desc: "Termin 2 Proyek Fiberisasi Area Barat", project: "FTTH Barat", category: "Proyek", account: "BCA Corporate", type: "income", amount: 485000000, status: "Paid" },
    { id: "TRX-2402", date: "01 Jun 2026", desc: "Pembayaran Vendor OLT dan Splitter", project: "FTTH Barat", category: "Infrastruktur", account: "Mandiri Giro", type: "expense", amount: 175000000, status: "Pending" },
    { id: "TRX-2403", date: "31 Mei 2026", desc: "Isi Kas Kecil Teknisi Lapangan", project: "Operasional", category: "Kas Kecil", account: "Kas Kecil HQ", type: "expense", amount: 18500000, status: "Approved" },
    { id: "TRX-2404", date: "30 Mei 2026", desc: "Pelunasan Faktur Pemeliharaan Core", project: "Pemeliharaan", category: "Pemasukan", account: "BCA Corporate", type: "income", amount: 128000000, status: "Paid" },
    { id: "TRX-2405", date: "29 Mei 2026", desc: "Sewa Gudang Material POP", project: "Operasional", category: "Fasilitas", account: "Mandiri Giro", type: "expense", amount: 32500000, status: "Rejected" },
    { id: "TRX-2406", date: "28 Mei 2026", desc: "Iklan Rekrutmen Teknisi", project: "SDM", category: "Pemasaran", account: "BCA Corporate", type: "expense", amount: 7500000, status: "Draft" },
    { id: "TRX-2407", date: "27 Mei 2026", desc: "Pembayaran Retensi Klien Gedung A", project: "Enterprise", category: "Pemasukan", account: "Mandiri Giro", type: "income", amount: 65000000, status: "Paid" },
  ],
  approvals: [
    { id: "APR-001", requester: "Budi Santoso", unit: "Infrastruktur IT", desc: "Pembelian perangkat jaringan POP", amount: 45000000, status: "Pending", urgent: true, project: "FTTH Barat", date: "02 Jun 2026", risk: "Perlu Cek", evidence: "Faktur dan PO lengkap", budgetUsed: 72 },
    { id: "APR-002", requester: "Anita Wijaya", unit: "Keuangan", desc: "Penggantian biaya perjalanan audit cabang", amount: 12500000, status: "Pending", urgent: false, project: "Audit Q2", date: "02 Jun 2026", risk: "Bukti Kurang", evidence: "Nota hotel belum lengkap", budgetUsed: 42 },
    { id: "APR-003", requester: "Dian Pratama", unit: "Operasional", desc: "Stok ulang alat instalasi teknisi", amount: 5200000, status: "Approved", urgent: false, project: "Operasional", date: "01 Jun 2026", risk: "Aman", evidence: "Nota lengkap", budgetUsed: 36 },
    { id: "APR-004", requester: "Rina Lestari", unit: "Proyek", desc: "Pembayaran vendor kabel feeder", amount: 188000000, status: "Rejected", urgent: true, project: "Modernisasi POP Utara", date: "31 Mei 2026", risk: "Melebihi Anggaran", evidence: "Perlu revisi RAB", budgetUsed: 108 },
    { id: "APR-005", requester: "Fajar Nugroho", unit: "Kas Kecil", desc: "Klaim BBM teknisi area barat", amount: 1850000, status: "Pending", urgent: false, project: "Operasional", date: "31 Mei 2026", risk: "Potensi Duplikat", evidence: "Nomor nota mirip klaim lama", budgetUsed: 58 },
  ],
  projects: [
    { name: "Fiberisasi Area Barat", manager: "Budi Santoso", budget: 1250000000, spent: 840000000, progress: 67, status: "Aktif", insight: "Serapan normal, termin kedua siap ditagihkan." },
    { name: "Modernisasi POP Utara", manager: "Andi Wijaya", budget: 680000000, spent: 642000000, progress: 94, status: "Hold", insight: "AI menandai potensi melebihi anggaran 8%." },
    { name: "Implementasi ERP Keuangan", manager: "Siti Aminah", budget: 320000000, spent: 116000000, progress: 36, status: "Aktif", insight: "Ritme belanja rendah, masih sesuai rencana dasar." },
    { name: "Cadangan Link Core Network", manager: "Reza Pratama", budget: 410000000, spent: 410000000, progress: 100, status: "Selesai", insight: "Selesai tanpa deviasi anggaran." },
  ],
  logs: [
    { time: "01 Jun 2026 16:20", user: "Admin Kontrol", action: "Pratinjau pulihkan data contoh", module: "Pengaturan" },
    { time: "01 Jun 2026 15:44", user: "Lead Keuangan", action: "Ekspor laporan pemasukan", module: "Laporan" },
    { time: "01 Jun 2026 14:10", user: "Penyetuju", action: "Setujui transaksi TRX-2403", module: "Approval" },
    { time: "31 Mei 2026 19:12", user: "Admin Kontrol", action: "AI cek duplikat transaksi", module: "AI Assistant" },
  ],
  accounts: [
    { name: "BCA Corporate", balance: 3245000000, type: "Bank", status: "Aktif", number: "892-xxxx-221", owner: "PT Operasional Fiber Nusantara" },
    { name: "Mandiri Giro", balance: 1860000000, type: "Bank", status: "Aktif", number: "104-xxxx-771", owner: "PT Operasional Fiber Nusantara" },
    { name: "Kas Kecil HQ", balance: 68000000, type: "Kas Kecil", status: "Aktif", number: "CASH-HQ", owner: "Keuangan HQ" },
    { name: "BRI Cabang Barat", balance: 0, type: "Bank", status: "Nonaktif", number: "330-xxxx-119", owner: "Cabang Barat" },
  ],
  mutations: [
    { date: "02 Jun 2026", account: "BCA Corporate", desc: "Termin FTTH Barat", debit: 0, credit: 485000000, status: "Paid" },
    { date: "01 Jun 2026", account: "Mandiri Giro", desc: "Vendor OLT dan Splitter", debit: 175000000, credit: 0, status: "Pending" },
    { date: "31 Mei 2026", account: "Kas Kecil HQ", desc: "Isi kas teknisi", debit: 18500000, credit: 0, status: "Approved" },
  ],
  categories: [
    { name: "Termin Proyek", group: "Pemasukan", status: "Aktif" },
    { name: "Retensi Klien", group: "Pemasukan", status: "Aktif" },
    { name: "Infrastruktur", group: "Pengeluaran", status: "Aktif" },
    { name: "Fasilitas", group: "Pengeluaran", status: "Aktif" },
    { name: "Pemasaran", group: "Pengeluaran", status: "Aktif" },
    { name: "BBM Teknisi", group: "Kas Kecil", status: "Aktif" },
    { name: "Konsumsi Lapangan", group: "Kas Kecil", status: "Nonaktif" },
  ],
  pettyCash: [
    { date: "02 Jun 2026", desc: "Isi kas teknisi barat", type: "Isi Kas", amount: 15000000, status: "Approved" },
    { date: "02 Jun 2026", desc: "BBM kendaraan survey", type: "Pengeluaran Harian", amount: 450000, status: "Pending" },
    { date: "01 Jun 2026", desc: "Konsumsi tim instalasi", type: "Pengeluaran Harian", amount: 780000, status: "Paid" },
  ],
  debts: [
    { party: "Vendor Kabel FO", kind: "Hutang", due: "10 Jun 2026", amount: 76000000, paid: 0, status: "Belum Bayar" },
    { party: "Sewa Gudang POP", kind: "Hutang", due: "05 Jun 2026", amount: 32500000, paid: 12000000, status: "Sebagian" },
    { party: "Klien Gedung A", kind: "Piutang", due: "03 Jun 2026", amount: 65000000, paid: 0, status: "Jatuh Tempo" },
    { party: "Enterprise Fiber Barat", kind: "Piutang", due: "15 Jun 2026", amount: 485000000, paid: 485000000, status: "Lunas" },
  ],
  users: [
    { name: "Admin Kontrol", email: "admin@dompet.local", role: "Super Admin", status: "Aktif" },
    { name: "Siti Aminah", email: "siti@dompet.local", role: "Finance", status: "Aktif" },
    { name: "Budi Santoso", email: "budi@dompet.local", role: "Manager", status: "Aktif" },
    { name: "Dian Pratama", email: "dian@dompet.local", role: "Staff", status: "Aktif" },
    { name: "Viewer Cabang", email: "viewer@dompet.local", role: "Viewer", status: "Nonaktif" },
  ],
};

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function cloneMockData() {
  return JSON.parse(JSON.stringify(mockData));
}

export const mockRepository = {
  loadInitialData: cloneMockData,
};

export function currency(value) {
  return rupiah.format(value).replace("IDR", "Rp");
}

export function compactCurrency(value) {
  if (Math.abs(value) >= 1000000000) return `Rp ${(value / 1000000000).toFixed(2)} M`;
  if (Math.abs(value) >= 1000000) return `Rp ${(value / 1000000).toFixed(1)} jt`;
  return currency(value);
}

export function sumByType(transactions, type) {
  return transactions.filter((item) => item.type === type).reduce((total, item) => total + item.amount, 0);
}

export function getTransactionsByType(data, type) {
  return data.transactions.filter((item) => item.type === type);
}

export function getApprovalSummary(data) {
  return {
    pending: data.approvals.filter((item) => item.status === "Pending").length,
    urgent: data.approvals.filter((item) => item.urgent).length,
    approved: data.approvals.filter((item) => item.status === "Approved").length,
    rejected: data.approvals.filter((item) => item.status === "Rejected").length,
  };
}

export function getProjectSummary(data) {
  const totalBudget = data.projects.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = data.projects.reduce((sum, item) => sum + item.spent, 0);
  return {
    totalBudget,
    totalSpent,
    activeCount: data.projects.filter((item) => item.status === "Aktif").length,
    spentPercent: Math.round((totalSpent / totalBudget) * 100),
  };
}

export function getPettyCashSummary(data) {
  return {
    balance: data.accounts.find((item) => item.type === "Kas Kecil")?.balance || 0,
    weekly: data.pettyCash.reduce((sum, item) => item.type === "Pengeluaran Harian" ? sum + item.amount : sum, 0),
  };
}

export function getReportRows(data) {
  const income = sumByType(data.transactions, "income");
  const expense = sumByType(data.transactions, "expense");
  return [
    ["Total Pemasukan", currency(income), "Termin dan retensi"],
    ["Total Pengeluaran", currency(expense), "Vendor dan operasional"],
    ["Saldo Bersih", currency(income - expense), "Positif"],
    ["Approval Menunggu", String(getApprovalSummary(data).pending), "Butuh tinjauan"],
  ];
}

export function countCategoriesByGroup(data, group) {
  return data.categories.filter((item) => item.group === group).length;
}

export function getPermissionStatus(role, permissionIndex) {
  if (role === "Viewer" && permissionIndex > 0) return "Nonaktif";
  if (role === "Staff" && [2, 4].includes(permissionIndex)) return "Nonaktif";
  return "Aktif";
}

export function createAiResponse(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes("duplikat")) return "Ditemukan 2 transaksi dengan nominal mirip: pembayaran vendor OLT dan pembelian perangkat jaringan. Perlu tinjau faktur sebelum persetujuan.";
  if (lower.includes("budget") || lower.includes("anggaran")) return "Pengeluaran Infrastruktur memakai 72% anggaran bulanan. Masih aman, tetapi Modernisasi POP Utara masuk status Berisiko.";
  if (lower.includes("kategori")) return "Saran kategori: Infrastruktur jika terkait vendor kabel, OLT, splitter, POP, atau jaringan. Gunakan Kas Kecil untuk klaim biaya teknisi.";
  if (lower.includes("ringkas") || lower.includes("laporan")) return "Ringkasan Juni 2026: pemasukan lebih tinggi dari pengeluaran, saldo operasional sehat, dan persetujuan mendesak terbesar ada di Infrastruktur IT.";
  return "Input diproses sebagai transaksi bebas. Saya sarankan cek nominal, proyek FTTH Barat, rekening Mandiri Giro, lalu simpan sebagai draft sebelum persetujuan.";
}
