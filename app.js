const app = document.getElementById("app");
const toast = document.getElementById("toast");

const navItems = [
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

const bottomItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "pemasukan", label: "Masuk", icon: "arrow_downward" },
  { id: "add", label: "Tambah", icon: "add_circle", action: "open-drawer" },
  { id: "pengeluaran", label: "Keluar", icon: "arrow_upward" },
  { id: "settings", label: "Atur", icon: "settings" },
];

const mock = {
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

const state = {
  page: "dashboard",
  drawer: null,
  filter: "Semua",
  projectFilter: "Semua",
  debtTab: "Hutang",
  approvalDetail: null,
  restorePreview: null,
  settings: {
    appName: "DOMPET PT AI",
    tagline: "Pusat kontrol keuangan hemat anggaran",
    companyName: "PT Operasional Fiber Nusantara",
    logo: "",
    primary: "#b9c7e4",
    theme: "dark",
  },
  aiUsage: 2.65,
  aiMessages: [
    { role: "ai", text: "Mode hemat aktif. AI hanya berjalan saat tombol aksi atau tombol kirim ditekan." },
  ],
};

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function currency(value) {
  return rupiah.format(value).replace("IDR", "Rp");
}

function compactCurrency(value) {
  if (Math.abs(value) >= 1000000000) return `Rp ${(value / 1000000000).toFixed(2)} M`; 
  if (Math.abs(value) >= 1000000) return `Rp ${(value / 1000000).toFixed(1)} jt`;
  return currency(value);
}

function icon(name, filled = false) {
  return `<span class="material-symbols-outlined ${filled ? "filled" : ""}">${name}</span>`;
}

function logoMarkup(className = "brand-logo") {
  if (state.settings.logo) {
    return `<span class="${className}"><img alt="Logo aplikasi" src="${state.settings.logo}" /></span>`;
  }
  return `<span class="${className}">${icon("account_balance", true)}</span>`;
}

function statusTone(status) {
  const normalized = status.toLowerCase();
  if (["selesai", "aktif", "aman", "paid", "approved", "lunas"].includes(normalized)) return "success";
  if (["pending", "draft", "direncanakan", "hold", "sebagian", "belum bayar", "perlu cek", "bukti kurang", "potensi duplikat"].includes(normalized)) return "warning";
  if (["urgent", "gagal", "berisiko", "rejected", "nonaktif", "jatuh tempo", "melebihi anggaran"].includes(normalized)) return "danger";
  return "info";
}

function statusBadge(status) {
  const statusClass = status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `<span class="status-badge status-${statusTone(status)} status-${statusClass}">${escapeHtml(status)}</span>`;
}

function sumByType(type) {
  return mock.transactions.filter((item) => item.type === type).reduce((total, item) => total + item.amount, 0);
}

function applyTheme() {
  const selected = state.settings.theme;
  const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = selected === "system" ? (systemDark ? "dark" : "light") : selected;
  document.body.dataset.theme = theme;
  document.body.style.setProperty("--primary", state.settings.primary);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function renderNav(items, className = "side-nav") {
  return `<nav class="${className}">${items.map((item) => {
    const active = state.page === item.id;
    if (item.action === "open-drawer") {
      return `<button class="nav-item" type="button" data-open-drawer="expense">${icon(item.icon)}<span>${item.label}</span></button>`;
    }
    return `<button class="nav-item ${active ? "active" : ""}" type="button" data-page="${item.id}">${icon(item.icon, active)}<span>${item.label}</span></button>`;
  }).join("")}</nav>`;
}

function renderMobileModuleNav() {
  const primaryIds = new Set(["dashboard", "pemasukan", "pengeluaran", "settings"]);
  const moduleItems = navItems.filter((item) => !primaryIds.has(item.id));
  return renderNav(moduleItems, "mobile-module-nav");
}

function renderShell(content) {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          ${logoMarkup()}
          <div class="brand-text">
            <span class="brand-name">${escapeHtml(state.settings.appName)}</span>
            <span class="brand-tagline">${escapeHtml(state.settings.companyName)}</span>
          </div>
        </div>
        ${renderNav(navItems)}
        <div class="sidebar-footer">
          <div class="user-card">
            <span class="avatar">AC</span>
            <div>
              <strong>Admin Kontrol</strong>
              <span>Pemilik Keuangan</span>
            </div>
          </div>
        </div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div class="mobile-title">
            ${logoMarkup("mini-logo")}
            <div class="brand-text">
              <span class="brand-name">${escapeHtml(state.settings.appName)}</span>
              <span class="brand-tagline">${escapeHtml(state.settings.tagline)}</span>
            </div>
          </div>
          <label class="search-box" aria-label="Pencarian global">
            ${icon("search")}
            <input type="search" placeholder="Cari transaksi, proyek, atau laporan..." />
          </label>
          <div class="topbar-actions">
            <button class="ghost-button" type="button" data-page="ai">${icon("auto_awesome")} AI Hemat</button>
            <button class="icon-button" type="button" data-toast="Tidak ada notifikasi baru">${icon("notifications")}</button>
            <span class="avatar">A</span>
            <span class="user-role muted">Admin Kontrol</span>
          </div>
        </header>
        ${renderMobileModuleNav()}
        <main class="page-content">${content}</main>
      </div>
      ${renderNav(bottomItems, "bottom-nav")}
    </div>
    ${state.drawer ? renderDrawer() : ""}
  `;
  bindEvents();
}

function pageHeader(title, subtitle, actions = "") {
  return `
    <div class="page-header">
      <div>
        <p class="page-kicker">${escapeHtml(state.settings.companyName)}</p>
        <h1 class="page-title">${title}</h1>
        <p class="page-subtitle">${subtitle}</p>
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ""}
    </div>
  `;
}

function kpiCard(label, value, note, iconName, tone = "") {
  return `
    <article class="kpi-card ${tone}">
      <div class="kpi-head">
        <span class="label">${label}</span>
        <span class="kpi-icon">${icon(iconName)}</span>
      </div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-note">${icon(tone === "tone-expense" ? "trending_down" : "trending_up")} ${note}</div>
    </article>
  `;
}

function renderDashboardPage() {
  const income = sumByType("income");
  const expense = sumByType("expense");
  const balance = income - expense + 3650000000;
  const aiSavings = 48000000;
  return `
    <section class="page">
      ${pageHeader(
        "Ringkasan Finansial",
        "Status periode aktif: Juni 2026. Semua data masih contoh untuk UI/UX frontend.",
        `<button class="primary-button" type="button" data-toast="Ekspor dashboard contoh disiapkan">${icon("download")} Ekspor Data</button>`
      )}
      <div class="kpi-grid">
        ${kpiCard("Total Saldo", currency(balance), "+12.5% vs bulan lalu", "account_balance_wallet")}
        ${kpiCard("Pemasukan", currency(income), "+5.2% vs bulan lalu", "arrow_downward", "tone-income")}
        ${kpiCard("Pengeluaran", currency(expense), "Terkendali di bawah limit", "arrow_upward", "tone-expense")}
        ${kpiCard("Proyeksi Efisiensi", currency(aiSavings), "AI menemukan potensi hemat", "auto_graph", "tone-ai")}
      </div>
      <div class="dashboard-layout">
        <div class="dashboard-main">
          <div class="dashboard-grid">
            <section class="panel">
              <div class="panel-header">
                <h2 class="panel-title">Arus Kas 30 Hari</h2>
                <div class="period-toggle"><button class="active">Mingguan</button><button>Bulanan</button></div>
              </div>
              <div class="panel-body">
                ${renderChart()}
              </div>
            </section>
            <section class="panel">
              <div class="panel-header"><h2 class="panel-title">Menunggu Approval</h2></div>
              <div class="panel-body approval-list">
                ${mock.approvals.slice(0, 3).map(renderApprovalItem).join("")}
                <button class="ghost-button" type="button" data-page="approval">Lihat Semua</button>
              </div>
            </section>
          </div>
          ${renderTransactionsPanel(mock.transactions.slice(0, 5), "Transaksi Terakhir")}
        </div>
        <aside class="ai-column">
          <div class="panel-header"><h2 class="panel-title">Analitik AI</h2></div>
          ${renderInsight("warning", "Anomali Pengeluaran", "Kategori Infrastruktur naik 18% dari rerata 3 bulan terakhir. Cek vendor OLT sebelum approval.")}
          ${renderInsight("lightbulb", "Optimalisasi Kas Kecil", "Saldo Kas Kecil HQ sering mengendap. Rekomendasi batas turun 10% bulan depan.", "success")}
          ${renderInsight("timeline", "Prediksi Arus Kas", "Likuiditas masih aman 21 hari kerja. Risiko defisit rendah jika termin proyek cair minggu ini.")}
        </aside>
      </div>
    </section>
  `;
}

function renderChart() {
  const bars = [42, 16, 60, 22, 48, 34, 82, 14, 54, 28, 72, 44];
  return `
    <div class="bar-chart" aria-label="Grafik arus kas contoh">
      ${bars.map((height, index) => `<span class="bar ${index % 2 ? "expense" : ""}" style="height:${height}%"></span>`).join("")}
    </div>
    <div class="chart-labels"><span>1 Jun</span><span>15 Jun</span><span>30 Jun</span></div>
  `;
}

function renderApprovalItem(item) {
  return `
    <article class="approval-item">
      <div class="approval-top">
        <div>
          <div class="approval-title">${escapeHtml(item.desc)}</div>
          <div class="muted">${escapeHtml(item.requester)} - ${escapeHtml(item.project)}</div>
        </div>
        <div class="money">${compactCurrency(item.amount)}</div>
      </div>
      <div class="approval-top" style="margin-top:10px">
        ${statusBadge(item.status)}
        <button class="ghost-button" type="button" data-toast="Detail approval contoh dibuka">Detail</button>
      </div>
    </article>
  `;
}

function renderInsight(iconName, title, text, tone = "") {
  return `
    <article class="insight-card ${tone}">
      <h3 class="insight-title">${icon(iconName)} ${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </article>
  `;
}

function renderTransactionsPanel(rows, title = "Daftar Transaksi") {
  const hasRows = rows.length > 0;
  return `
    <section class="table-panel transaction-panel">
      <div class="table-header">
        <h2 class="table-title">${title}</h2>
        <div class="table-actions">
          <button class="ghost-button" type="button" data-toast="Filter lanjutan contoh aktif">${icon("filter_list")} Filter</button>
          <button class="secondary-button" type="button" data-open-drawer="expense">${icon("add")} Tambah</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Tanggal</th><th>Deskripsi</th><th>Proyek</th><th>Nominal</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${hasRows ? rows.map((item) => `
              <tr>
                <td class="muted">${item.id}</td>
                <td>${item.date}</td>
                <td><span class="table-name">${escapeHtml(item.desc)}</span><br><span class="muted">${escapeHtml(item.category)} - ${escapeHtml(item.account)}</span></td>
                <td>${escapeHtml(item.project)}</td>
                <td class="money ${item.type === "income" ? "income" : "expense"}">${item.type === "income" ? "+ " : "- "}${currency(item.amount)}</td>
                <td>${statusBadge(item.status)}</td>
              </tr>
            `).join("") : `<tr><td colspan="6">${renderEmptyState("Tidak ada transaksi", "Coba pilih filter lain atau tambah transaksi baru.")}</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="transaction-cards">
        ${hasRows ? rows.map(renderTransactionCard).join("") : renderEmptyState("Tidak ada transaksi", "Coba pilih filter lain atau tambah transaksi baru.")}
      </div>
      <div class="skeleton-demo" aria-label="Skeleton pemuatan contoh">
        <span></span><span></span><span></span>
      </div>
    </section>
  `;
}

function renderTransactionCard(item) {
  const isIncome = item.type === "income";
  return `
    <article class="transaction-card ${isIncome ? "income" : "expense"}">
      <div class="transaction-icon">${icon(isIncome ? "south_west" : "north_east")}</div>
      <div class="transaction-main">
        <strong>${escapeHtml(item.desc)}</strong>
        <span>${escapeHtml(item.category)} - ${escapeHtml(item.date)}</span>
        <span>${escapeHtml(item.project)} - ${escapeHtml(item.account)}</span>
      </div>
      <div class="transaction-side">
        <span class="money ${isIncome ? "income" : "expense"}">${isIncome ? "+" : "-"}${currency(item.amount)}</span>
        ${statusBadge(item.status)}
      </div>
    </article>
  `;
}

function renderEmptyState(title, text) {
  return `
    <div class="empty-state">
      ${icon("inbox")}
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
    </div>
  `;
}

function renderFinancePage(type) {
  const isIncome = type === "income";
  const label = isIncome ? "Pemasukan" : "Pengeluaran";
  const rows = mock.transactions.filter((item) => item.type === type);
  const total = rows.reduce((sum, item) => sum + item.amount, 0);
  const highest = Math.max(...rows.map((item) => item.amount));
  const action = isIncome ? "Tambah Pemasukan" : "Tambah Pengeluaran";
  return `
    <section class="page">
      ${pageHeader(
        label,
        `${label} perusahaan dengan data contoh, filter ringkas, dan form drawer kanan mengikuti bahan Stitch.`,
        `<button class="secondary-button" type="button" data-open-drawer="${isIncome ? "income" : "expense"}">${icon("add")} ${action}</button>`
      )}
      <div class="stat-grid">
        <article class="metric-card"><span class="label">Total ${label}</span><strong class="metric-value ${isIncome ? "money income" : "money expense"}">${currency(total)}</strong><p class="muted">Periode Juni 2026</p></article>
        <article class="metric-card"><span class="label">Transaksi</span><strong class="metric-value">${rows.length}</strong><p class="muted">Status selesai dan pending</p></article>
        <article class="metric-card"><span class="label">Nominal Tertinggi</span><strong class="metric-value">${currency(highest)}</strong><p class="muted">Butuh audit jika melewati threshold</p></article>
      </div>
      <div class="content-split">
        <div>
          <div class="filters" style="margin-bottom:12px">
            ${["Semua", "Proyek", "Infrastruktur", "Kas Kecil", "Fasilitas", "Pemasaran"].map((filter) => `<button class="chip ${state.filter === filter ? "active" : ""}" type="button" data-filter="${filter}">${filter}</button>`).join("")}
          </div>
          ${renderTransactionsPanel(rows.filter((item) => state.filter === "Semua" || item.category === state.filter), `Daftar ${label}`)}
        </div>
        <aside class="form-panel">
          <h2>${isIncome ? "Input Cepat Pemasukan" : "Input Cepat Pengeluaran"}</h2>
          <div class="form-grid">
            <div class="amount-preview">
              <span class="label">NOMINAL</span>
              <strong class="${isIncome ? "money income" : "money expense"}">${isIncome ? "+" : "-"} Rp 0</strong>
            </div>
            <label class="field"><span>Proyek</span><select class="select"><option>FTTH Barat</option><option>Operasional</option><option>Pemeliharaan</option></select></label>
            <label class="field"><span>Kategori</span><select class="select"><option>${isIncome ? "Pemasukan" : "Infrastruktur"}</option><option>Proyek</option><option>Kas Kecil</option></select></label>
            <button class="ghost-button" type="button" data-open-drawer="${isIncome ? "income" : "expense"}">${icon("open_in_full")} Buka Drawer Form</button>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderSettingsPage() {
  const colors = ["#b9c7e4", "#4edea3", "#4cd7f6", "#f7c66a", "#ffb4ab"];
  return `
    <section class="page">
      ${pageHeader("Pengaturan", "Kontrol identitas aplikasi, tema, cadangan dan pemulihan, log aktivitas, akses pengguna, dan keamanan.")}
      <div class="settings-grid">
        <div class="stack">
          <section class="settings-panel">
            <h2>Identitas Aplikasi</h2>
            <div class="form-grid">
              <label class="field"><span>Nama Aplikasi</span><input id="settingAppName" class="input" value="${escapeHtml(state.settings.appName)}" /></label>
              <label class="field"><span>Tagline</span><input id="settingTagline" class="input" value="${escapeHtml(state.settings.tagline)}" /></label>
              <label class="field"><span>Nama Perusahaan</span><input id="settingCompany" class="input" value="${escapeHtml(state.settings.companyName)}" /></label>
              <div class="logo-preview">
                ${logoMarkup()}
                <div>
                  <strong>Logo Aplikasi</strong>
                  <p class="muted" style="margin:4px 0 10px">Unggah logo lokal untuk pratinjau UI.</p>
                  <button class="ghost-button" type="button" data-trigger-logo>${icon("upload")} Unggah Logo</button>
                  <input id="logoInput" class="hidden-input" type="file" accept="image/*" />
                </div>
              </div>
              <button class="primary-button" type="button" data-save-identity>${icon("save")} Terapkan Identitas</button>
            </div>
          </section>

          <section class="settings-panel">
            <h2>Tema dan Warna</h2>
            <div class="form-grid">
              <div class="field"><span>Pilih Warna Utama</span><div class="swatches">${colors.map((color) => `<button class="swatch ${state.settings.primary === color ? "active" : ""}" type="button" style="--swatch:${color}" aria-label="Warna ${color}" data-color="${color}"></button>`).join("")}</div></div>
              <div class="field"><span>Mode Tampilan</span><div class="segmented">${[["dark", "Gelap"], ["light", "Terang"], ["system", "Sistem"]].map(([theme, label]) => `<button class="${state.settings.theme === theme ? "active" : ""}" type="button" data-theme-choice="${theme}">${label}</button>`).join("")}</div></div>
            </div>
          </section>
        </div>

        <div class="stack">
          <section class="settings-panel">
            <h2>Cadangan dan Pulihkan</h2>
            <div class="backup-actions">
              <button class="secondary-button" type="button" data-backup>${icon("download")} Cadangkan Data</button>
              <button class="ghost-button" type="button" data-trigger-restore>${icon("upload_file")} Pulihkan Data</button>
              <input id="restoreInput" class="hidden-input" type="file" accept="application/json" />
              <button class="ghost-button" type="button" data-preview-sample>${icon("preview")} Pratinjau Pulihkan</button>
              <button class="ghost-button" type="button" data-export-log>${icon("article")} Ekspor Log</button>
            </div>
            <div class="restore-preview" style="margin-top:12px">
              ${renderRestorePreview()}
            </div>
          </section>

          <section class="settings-panel">
            <h2>Log Aktivitas Pengguna</h2>
            <div class="activity-list">${mock.logs.map((log) => `<div class="activity-item"><div><strong>${escapeHtml(log.action)}</strong><br><span class="muted">${escapeHtml(log.user)} - ${escapeHtml(log.module)}</span></div><span class="muted">${escapeHtml(log.time)}</span></div>`).join("")}</div>
          </section>

          <section class="settings-panel">
            <h2>Akses Pengguna dan Keamanan</h2>
            <div class="form-grid">
              <div class="setting-row"><div><strong>Peran Pemilik Keuangan</strong><br><span class="muted">Akses penuh dashboard dan pengaturan</span></div>${statusBadge("Aktif")}</div>
              <div class="setting-row"><div><strong>Approval 2 langkah</strong><br><span class="muted">Wajib untuk transaksi di atas Rp 50 jt</span></div>${statusBadge("Aktif")}</div>
              <div class="setting-row"><div><strong>Batas sesi</strong><br><span class="muted">30 menit tanpa aktivitas</span></div>${statusBadge("Aktif")}</div>
            </div>
          </section>
        </div>
      </div>
    </section>
  `;
}

function renderRestorePreview() {
  if (!state.restorePreview) {
    return `<div><strong>Belum ada pratinjau pulihkan</strong><p class="muted" style="margin:4px 0 0">Unggah JSON atau gunakan contoh pratinjau. Data tidak diterapkan otomatis.</p></div>`;
  }
  return `
    <div class="restore-preview-row"><span>Nama aplikasi</span><strong>${escapeHtml(state.restorePreview.appName || "Tidak ada")}</strong></div>
    <div class="restore-preview-row"><span>Total transaksi</span><strong>${state.restorePreview.transactions || 0}</strong></div>
    <div class="restore-preview-row"><span>Log aktivitas</span><strong>${state.restorePreview.logs || 0}</strong></div>
    <button class="primary-button" type="button" data-apply-restore>${icon("restore")} Terapkan Pulihkan Contoh</button>
  `;
}

function renderAiPage() {
  const usagePercent = Math.min(100, (state.aiUsage / 10) * 100);
  return `
    <section class="page">
      ${pageHeader("AI Assistant Hemat", "Anggaran dibatasi $10/bulan. AI diam sampai pengguna klik aksi atau mengirim pertanyaan.")}
      <div class="assistant-layout">
        <aside class="assistant-card">
          <h2>Status Anggaran</h2>
          <div class="budget-meter">
            <div class="setting-row"><span>Terpakai</span><strong>$${state.aiUsage.toFixed(2)} / $10</strong></div>
            <div class="progress"><span style="width:${usagePercent}%"></span></div>
            <p class="muted">Mode hemat aktif. Tidak ada proses latar belakang.</p>
          </div>
          <div class="ai-stack" style="margin-top:16px">
            ${renderQuickAction("summarize", "Ringkas Laporan", "Ringkas pemasukan, pengeluaran, dan arus kas bulan ini.")}
            ${renderQuickAction("compare_arrows", "Cek Duplikat", "Cari transaksi mirip dari nominal, tanggal, dan vendor.")}
            ${renderQuickAction("query_stats", "Analisa Anggaran", "Tandai kategori yang melewati anggaran.")}
            ${renderQuickAction("category", "Kategori Otomatis", "Sarankan kategori untuk input transaksi bebas.")}
          </div>
        </aside>
        <section class="assistant-card assistant-chat">
          <h2>Ruang Tanya Keuangan</h2>
          <div id="chatWindow" class="chat-window">
            ${state.aiMessages.map((message) => `<div class="chat-message ${message.role}">${escapeHtml(message.text)}</div>`).join("")}
          </div>
          <label class="field"><span>Pertanyaan atau input transaksi bebas</span><textarea id="aiPrompt" class="textarea" placeholder="Contoh: bayar vendor kabel 12 juta dari Mandiri untuk proyek FTTH Barat"></textarea></label>
          <div class="form-actions">
            <button class="primary-button" type="button" data-ai-send>${icon("send")} Kirim Saat Ini</button>
            <button class="ghost-button" type="button" data-ai-clear>${icon("delete")} Bersihkan</button>
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderQuickAction(iconName, title, text) {
  return `<button class="quick-action" type="button" data-ai-quick="${escapeHtml(title)}"><span>${icon(iconName)}</span><span><strong>${escapeHtml(title)}</strong><br><span class="muted">${escapeHtml(text)}</span></span></button>`;
}

function renderTable(headers, rows) {
  return `
    <div class="table-wrap"><table><thead><tr>${headers.map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>
  `;
}

function renderApprovalPage() {
  const pending = mock.approvals.filter((item) => item.status === "Pending").length;
  const urgent = mock.approvals.filter((item) => item.urgent).length;
  const approved = mock.approvals.filter((item) => item.status === "Approved").length;
  const rejected = mock.approvals.filter((item) => item.status === "Rejected").length;
  return `
    <section class="page">
      ${pageHeader("Approval", "Tinjau transaksi, risiko AI, dan tindakan persetujuan contoh.")}
      <div class="stat-grid four-stat-grid">
        <article class="metric-card"><span class="label">Pending</span><strong class="metric-value">${pending}</strong><p class="muted">Menunggu keputusan</p></article>
        <article class="metric-card"><span class="label">Urgent</span><strong class="metric-value money expense">${urgent}</strong><p class="muted">Butuh respon hari ini</p></article>
        <article class="metric-card"><span class="label">Disetujui</span><strong class="metric-value money income">${approved}</strong><p class="muted">Sudah approved</p></article>
        <article class="metric-card"><span class="label">Ditolak</span><strong class="metric-value money expense">${rejected}</strong><p class="muted">Perlu revisi data</p></article>
      </div>
      <section class="table-panel">
        <div class="table-header"><h2 class="table-title">Daftar Approval</h2><button class="ghost-button" type="button" data-toast="Filter approval contoh aktif">${icon("filter_list")} Filter</button></div>
        <div class="approval-list enhanced-list">
          ${mock.approvals.map((item) => `
            <article class="approval-card">
              <div class="approval-top">
                <div><span class="label">${escapeHtml(item.id)} - ${escapeHtml(item.date)}</span><h3>${escapeHtml(item.desc)}</h3><p class="muted">${escapeHtml(item.requester)} - ${escapeHtml(item.unit)} - ${escapeHtml(item.project)}</p></div>
                <div class="approval-amount"><strong>${currency(item.amount)}</strong>${statusBadge(item.status)}</div>
              </div>
              <div class="approval-meta">
                ${statusBadge(item.risk)}
                <span class="muted">Anggaran terpakai ${item.budgetUsed}%</span>
                ${item.urgent ? statusBadge("Urgent") : statusBadge("Aman")}
              </div>
              <div class="form-actions">
                <button class="secondary-button" type="button" data-approval-action="Setujui">${icon("check")} Setujui</button>
                <button class="danger-button" type="button" data-approval-action="Tolak">${icon("close")} Tolak</button>
                <button class="ghost-button" type="button" data-approval-action="Minta Revisi">${icon("edit_note")} Minta Revisi</button>
                <button class="ghost-button" type="button" data-approval-detail="${item.id}">${icon("open_in_full")} Detail</button>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    </section>
  `;
}

function renderProjectPage() {
  const totalBudget = mock.projects.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = mock.projects.reduce((sum, item) => sum + item.spent, 0);
  const filtered = state.projectFilter === "Semua" ? mock.projects : mock.projects.filter((item) => item.status === state.projectFilter);
  return `
    <section class="page">
      ${pageHeader("Proyek", "Anggaran, progres, wawasan AI, dan status proyek aktif.", `<button class="secondary-button" type="button" data-toast="Form proyek baru masih data contoh">${icon("add")} Proyek Baru</button>`)}
      <div class="kpi-grid three-kpi-grid">
        ${kpiCard("Total Anggaran", currency(totalBudget), "+12% vs Q2", "account_balance_wallet")}
        ${kpiCard("Total Realisasi", currency(totalSpent), `${Math.round((totalSpent / totalBudget) * 100)}% terserap`, "payments", "tone-ai")}
        ${kpiCard("Wawasan AI", "1 Risiko", "POP Utara mendekati batas anggaran", "auto_awesome", "tone-expense")}
      </div>
      <div class="filters" style="margin-bottom:12px">${["Semua", "Aktif", "Hold", "Selesai"].map((filter) => `<button class="chip ${state.projectFilter === filter ? "active" : ""}" type="button" data-project-filter="${filter}">${filter}</button>`).join("")}</div>
      <div class="module-grid project-cards">
        ${filtered.map((project) => `<article class="module-card vertical-card"><div><span class="label">${escapeHtml(project.manager)}</span><h2>${escapeHtml(project.name)}</h2><p class="muted">${escapeHtml(project.insight)}</p></div><div class="progress"><span style="width:${project.progress}%;background:${project.status === "Hold" ? "var(--warning)" : "var(--income)"}"></span></div><div class="setting-row"><span class="money">${currency(project.spent)} / ${currency(project.budget)}</span>${statusBadge(project.status)}</div></article>`).join("")}
      </div>
      <section class="table-panel">
        <div class="table-header"><h2 class="table-title">Tabel Proyek Aktif</h2><button class="ghost-button" type="button" data-toast="Filter proyek contoh aktif">${icon("filter_list")} Filter</button></div>
        ${renderTable(["Nama Proyek", "Manajer", "Anggaran", "Realisasi", "Progres Anggaran", "Status"], filtered.map((project) => `<tr><td class="table-name">${escapeHtml(project.name)}</td><td>${escapeHtml(project.manager)}</td><td class="money">${currency(project.budget)}</td><td class="money">${currency(project.spent)}</td><td><div class="progress"><span style="width:${project.progress}%;background:${project.status === "Hold" ? "var(--warning)" : "var(--income)"}"></span></div><span class="muted">${project.progress}%</span></td><td>${statusBadge(project.status)}</td></tr>`))}
      </section>
    </section>
  `;
}

function renderReportsPage() {
  const reportRows = [
    ["Total Pemasukan", currency(sumByType("income")), "+18% dari Mei"],
    ["Total Pengeluaran", currency(sumByType("expense")), "72% dari anggaran"],
    ["Saldo Akhir", currency(sumByType("income") - sumByType("expense") + 3650000000), "Likuiditas aman"],
  ];
  return `
    <section class="page">
      ${pageHeader("Laporan", "Jenis laporan, filter periode, pratinjau, dan aksi ekspor contoh.", `<button class="ghost-button" type="button" data-toast="PDF contoh siap diekspor">${icon("picture_as_pdf")} Ekspor PDF</button><button class="ghost-button" type="button" data-toast="Excel contoh siap diekspor">${icon("table_view")} Ekspor Excel</button><button class="ghost-button" type="button" data-toast="Ringkasan WhatsApp tersalin">${icon("content_copy")} Salin WhatsApp</button>`)}
      <div class="report-grid">
        ${[["Arus Kas", "Aliran dana masuk dan keluar", "sync_alt", "featured"], ["Pemasukan", "Termin dan pendapatan", "south_west", ""], ["Pengeluaran", "Biaya operasional", "north_east", ""], ["Kas Kecil", "Rekap kas mingguan", "account_balance_wallet", ""], ["Hutang Piutang", "Kewajiban dan tagihan", "handshake", ""]].map(([title, text, iconName, extra]) => `<article class="report-card ${extra}"><div><span>${icon(iconName)}</span><h2>${title}</h2><p class="muted">${text}</p></div>${icon("chevron_right")}</article>`).join("")}
      </div>
      <section class="form-panel" style="margin-top:16px"><h2>Filter Laporan</h2><div class="filter-grid"><label class="field"><span>Periode</span><select class="select"><option>Juni 2026</option><option>Mei 2026</option><option>Q2 2026</option></select></label><label class="field"><span>Proyek</span><select class="select"><option>Semua Proyek</option><option>FTTH Barat</option><option>Modernisasi POP Utara</option></select></label><label class="field"><span>Rekening</span><select class="select"><option>Semua Rekening</option><option>BCA Corporate</option><option>Mandiri Giro</option></select></label><label class="field"><span>Kategori</span><select class="select"><option>Semua Kategori</option><option>Infrastruktur</option><option>Kas Kecil</option></select></label></div></section>
      <section class="table-panel" style="margin-top:16px"><div class="table-header"><h2 class="table-title">Pratinjau Laporan</h2>${statusBadge("Aman")}</div>${renderTable(["Item", "Nilai", "Catatan"], reportRows.map(([name, value, note]) => `<tr><td class="table-name">${name}</td><td class="money">${value}</td><td>${note}</td></tr>`))}</section>
    </section>
  `;
}

function renderAccountsPage() {
  return `
    <section class="page">
      ${pageHeader("Rekening", "Saldo rekening, tabel kas/bank, dan mutasi contoh.", `<button class="secondary-button" type="button" data-toast="Tambah rekening masih data contoh">${icon("add")} Tambah Rekening</button>`)}
      <div class="module-grid">${mock.accounts.map((account) => `<article class="module-card vertical-card"><div><span class="label">${escapeHtml(account.type)}</span><h2>${escapeHtml(account.name)}</h2><p class="muted">${escapeHtml(account.number)} - ${escapeHtml(account.owner)}</p></div><strong class="metric-value">${currency(account.balance)}</strong>${statusBadge(account.status)}</article>`).join("")}</div>
      <section class="table-panel" style="margin-top:16px"><div class="table-header"><h2 class="table-title">Tabel Kas/Bank</h2></div>${renderTable(["Rekening", "Jenis", "Nomor", "Saldo", "Status"], mock.accounts.map((account) => `<tr><td class="table-name">${escapeHtml(account.name)}</td><td>${escapeHtml(account.type)}</td><td>${escapeHtml(account.number)}</td><td class="money">${currency(account.balance)}</td><td>${statusBadge(account.status)}</td></tr>`))}</section>
      <section class="table-panel" style="margin-top:16px"><div class="table-header"><h2 class="table-title">Detail Mutasi</h2></div>${renderTable(["Tanggal", "Rekening", "Keterangan", "Debit", "Kredit", "Status"], mock.mutations.map((item) => `<tr><td>${item.date}</td><td>${escapeHtml(item.account)}</td><td class="table-name">${escapeHtml(item.desc)}</td><td class="money expense">${item.debit ? currency(item.debit) : "-"}</td><td class="money income">${item.credit ? currency(item.credit) : "-"}</td><td>${statusBadge(item.status)}</td></tr>`))}</section>
    </section>
  `;
}

function renderCategoriesPage() {
  const groups = ["Pemasukan", "Pengeluaran", "Kas Kecil"];
  return `
    <section class="page">
      ${pageHeader("Kategori", "Kategori pemasukan, pengeluaran, dan kas kecil dengan aksi contoh.", `<button class="secondary-button" type="button" data-toast="Tambah kategori masih data contoh">${icon("add")} Tambah Kategori</button>`)}
      <div class="module-grid">${groups.map((group) => `<article class="module-card vertical-card"><div><span class="label">Kategori ${group}</span><h2>${mock.categories.filter((item) => item.group === group).length}</h2><p class="muted">Aktif dan nonaktif tersedia</p></div>${icon(group === "Pemasukan" ? "south_west" : group === "Pengeluaran" ? "north_east" : "account_balance_wallet")}</article>`).join("")}</div>
      <section class="table-panel" style="margin-top:16px"><div class="table-header"><h2 class="table-title">Master Kategori</h2></div>${renderTable(["Nama", "Grup", "Status", "Aksi"], mock.categories.map((item) => `<tr><td class="table-name">${escapeHtml(item.name)}</td><td>${escapeHtml(item.group)}</td><td>${statusBadge(item.status)}</td><td><button class="ghost-button" type="button" data-toast="Edit kategori masih contoh">Edit</button> <button class="ghost-button" type="button" data-toast="Nonaktif kategori masih contoh">Nonaktif</button></td></tr>`))}</section>
    </section>
  `;
}

function renderPettyCashPage() {
  const balance = mock.accounts.find((item) => item.type === "Kas Kecil")?.balance || 0;
  const weekly = mock.pettyCash.reduce((sum, item) => item.type === "Pengeluaran Harian" ? sum + item.amount : sum, 0);
  return `
    <section class="page">
      ${pageHeader("Kas Kecil", "Saldo, isi kas, pengeluaran harian, rekap mingguan, dan unggah nota contoh.", `<button class="secondary-button" type="button" data-toast="Isi kas masih data contoh">${icon("add_card")} Isi Kas</button><button class="ghost-button" type="button" data-toast="Unggah nota masih contoh">${icon("upload_file")} Unggah Nota</button>`)}
      <div class="stat-grid"><article class="metric-card"><span class="label">Saldo Kas Kecil</span><strong class="metric-value">${currency(balance)}</strong><p class="muted">Kas Kecil HQ</p></article><article class="metric-card"><span class="label">Pengeluaran Harian</span><strong class="metric-value money expense">${currency(weekly)}</strong><p class="muted">Akumulasi minggu ini</p></article><article class="metric-card"><span class="label">Rekap Mingguan</span><strong class="metric-value">87%</strong><p class="muted">Nota sudah lengkap</p></article></div>
      <section class="table-panel"><div class="table-header"><h2 class="table-title">Transaksi Kas Kecil</h2></div>${renderTable(["Tanggal", "Keterangan", "Jenis", "Nominal", "Status"], mock.pettyCash.map((item) => `<tr><td>${item.date}</td><td class="table-name">${escapeHtml(item.desc)}</td><td>${escapeHtml(item.type)}</td><td class="money ${item.type === "Isi Kas" ? "income" : "expense"}">${currency(item.amount)}</td><td>${statusBadge(item.status)}</td></tr>`))}</section>
    </section>
  `;
}

function renderDebtPage() {
  const rows = mock.debts.filter((item) => item.kind === state.debtTab);
  return `
    <section class="page">
      ${pageHeader("Hutang & Piutang", "Pantau jatuh tempo dan status pembayaran.")}
      <div class="segmented page-tabs"><button class="${state.debtTab === "Hutang" ? "active" : ""}" type="button" data-debt-tab="Hutang">Hutang</button><button class="${state.debtTab === "Piutang" ? "active" : ""}" type="button" data-debt-tab="Piutang">Piutang</button></div>
      <section class="table-panel" style="margin-top:16px"><div class="table-header"><h2 class="table-title">Daftar ${state.debtTab}</h2><button class="ghost-button" type="button" data-toast="Tambah ${state.debtTab} masih contoh">${icon("add")} Tambah</button></div>${renderTable(["Pihak", "Jatuh Tempo", "Nominal", "Terbayar", "Status"], rows.map((item) => `<tr><td class="table-name">${escapeHtml(item.party)}</td><td>${item.due}</td><td class="money">${currency(item.amount)}</td><td class="money income">${currency(item.paid)}</td><td>${statusBadge(item.status)}</td></tr>`))}</section>
    </section>
  `;
}

function renderUserRolePage() {
  const roles = ["Super Admin", "Finance", "Manager", "Staff", "Viewer"];
  const permissions = ["Dashboard", "Transaksi", "Approval", "Laporan", "Pengaturan"];
  return `
    <section class="page">
      ${pageHeader("User & Role", "Peran, pengguna, dan matriks izin contoh.", `<button class="secondary-button" type="button" data-toast="Tambah pengguna masih contoh">${icon("person_add")} Tambah Pengguna</button>`)}
      <div class="module-grid">${roles.map((role) => `<article class="module-card"><div><span class="label">Peran</span><h2>${role}</h2><p class="muted">${role === "Viewer" ? "Baca data" : "Akses sesuai matriks"}</p></div>${icon("admin_panel_settings")}</article>`).join("")}</div>
      <section class="table-panel" style="margin-top:16px"><div class="table-header"><h2 class="table-title">Tabel Pengguna</h2></div>${renderTable(["Nama", "Email", "Peran", "Status"], mock.users.map((user) => `<tr><td class="table-name">${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.role)}</td><td>${statusBadge(user.status)}</td></tr>`))}</section>
      <section class="table-panel" style="margin-top:16px"><div class="table-header"><h2 class="table-title">Matriks Izin</h2></div>${renderTable(["Peran", ...permissions], roles.map((role) => `<tr><td class="table-name">${role}</td>${permissions.map((permission, index) => `<td>${statusBadge(role === "Viewer" && index > 0 ? "Nonaktif" : role === "Staff" && [2, 4].includes(index) ? "Nonaktif" : "Aktif")}</td>`).join("")}</tr>`))}</section>
    </section>
  `;
}

function renderDrawer() {
  if (state.drawer === "approval") return renderApprovalDrawer();
  const isIncome = state.drawer === "income";
  return `
    <div class="drawer-backdrop" data-close-drawer></div>
    <aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="Form transaksi">
      <div class="drawer-header">
        <h2>${isIncome ? "Tambah Pemasukan" : "Tambah Pengeluaran"}</h2>
        <button class="icon-button" type="button" data-close-drawer>${icon("close")}</button>
      </div>
      <div class="drawer-body">
        <div class="form-grid">
          <div class="amount-preview"><span class="label">NOMINAL</span><strong class="${isIncome ? "money income" : "money expense"}">${isIncome ? "+" : "-"} Rp 0</strong><button class="ghost-button" type="button" data-toast="AI Scan nota berjalan hanya saat diklik">${icon("auto_awesome")} Scan Nota untuk Isi Otomatis</button></div>
          <div class="segmented"><button class="${!isIncome ? "active" : ""}" type="button" data-open-drawer="expense">Pengeluaran</button><button class="${isIncome ? "active" : ""}" type="button" data-open-drawer="income">Pemasukan</button></div>
          <label class="field"><span>Proyek</span><select class="select"><option>FTTH Barat</option><option>Pemeliharaan</option><option>Operasional</option></select></label>
          <label class="field"><span>Kategori</span><select class="select"><option>${isIncome ? "Pemasukan" : "Infrastruktur"}</option><option>Kas Kecil</option><option>Fasilitas</option><option>Pemasaran</option></select></label>
          <label class="field"><span>Rekening ${isIncome ? "Tujuan" : "Sumber"}</span><select class="select"><option>BCA Corporate</option><option>Mandiri Giro</option><option>Kas Kecil HQ</option></select></label>
          <label class="field"><span>Tanggal Transaksi</span><input class="input" type="date" value="2026-06-01" /></label>
          <label class="field"><span>Keterangan</span><textarea class="textarea" placeholder="Tambahkan catatan transaksi..."></textarea></label>
          <div class="receipt-box"><img alt="Contoh bukti nota" src="assets/receipt-reference.png" /><strong>Unggah Bukti</strong><span class="muted">JPG, PNG, atau PDF maksimal 5MB</span><button class="ghost-button" type="button" data-toast="Unggah bukti masih data contoh">${icon("upload_file")} Pilih File</button></div>
        </div>
      </div>
      <div class="drawer-footer"><button class="primary-button" style="width:100%" type="button" data-save-transaction>${icon("save")} Simpan Transaksi</button></div>
    </aside>
  `;
}

function renderApprovalDrawer() {
  const item = mock.approvals.find((approval) => approval.id === state.approvalDetail) || mock.approvals[0];
  return `
    <div class="drawer-backdrop" data-close-drawer></div>
    <aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="Detail approval">
      <div class="drawer-header">
        <h2>Detail Approval</h2>
        <button class="icon-button" type="button" data-close-drawer>${icon("close")}</button>
      </div>
      <div class="drawer-body">
        <div class="detail-stack">
          <div class="amount-preview"><span class="label">${escapeHtml(item.id)}</span><strong>${currency(item.amount)}</strong><span class="muted">${escapeHtml(item.desc)}</span></div>
          <div class="restore-preview">
            <div class="restore-preview-row"><span>Pemohon</span><strong>${escapeHtml(item.requester)}</strong></div>
            <div class="restore-preview-row"><span>Unit</span><strong>${escapeHtml(item.unit)}</strong></div>
            <div class="restore-preview-row"><span>Proyek</span><strong>${escapeHtml(item.project)}</strong></div>
            <div class="restore-preview-row"><span>Tanggal</span><strong>${escapeHtml(item.date)}</strong></div>
            <div class="restore-preview-row"><span>Status</span>${statusBadge(item.status)}</div>
            <div class="restore-preview-row"><span>Risiko AI</span>${statusBadge(item.risk)}</div>
          </div>
          <article class="insight-card ${item.risk === "Aman" ? "success" : item.risk === "Melebihi Anggaran" ? "danger" : ""}">
            <h3 class="insight-title">${icon("auto_awesome")} Catatan AI</h3>
            <p>${escapeHtml(item.evidence)}. Anggaran terpakai ${item.budgetUsed}%.</p>
          </article>
        </div>
      </div>
      <div class="drawer-footer form-actions">
        <button class="secondary-button" type="button" data-approval-action="Setujui">${icon("check")} Setujui</button>
        <button class="danger-button" type="button" data-approval-action="Tolak">${icon("close")} Tolak</button>
        <button class="ghost-button" type="button" data-approval-action="Minta Revisi">${icon("edit_note")} Minta Revisi</button>
      </div>
    </aside>
  `;
}

function render() {
  applyTheme();
  state.filter = state.filter || "Semua";
  const pages = {
    dashboard: renderDashboardPage,
    pemasukan: () => renderFinancePage("income"),
    pengeluaran: () => renderFinancePage("expense"),
    settings: renderSettingsPage,
    ai: renderAiPage,
    approval: renderApprovalPage,
    project: renderProjectPage,
    laporan: renderReportsPage,
    "kas-kecil": renderPettyCashPage,
    "hutang-piutang": renderDebtPage,
    rekening: renderAccountsPage,
    kategori: renderCategoriesPage,
    "user-role": renderUserRolePage,
  };
  const content = (pages[state.page] || pages.dashboard)();
  renderShell(content);
  const chatWindow = document.getElementById("chatWindow");
  if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
}

function bindEvents() {
  document.querySelectorAll("[data-page]").forEach((element) => {
    element.addEventListener("click", () => {
      state.page = element.dataset.page;
      state.drawer = null;
      state.filter = "Semua";
      render();
    });
  });

  document.querySelectorAll("[data-open-drawer]").forEach((element) => {
    element.addEventListener("click", () => {
      state.drawer = element.dataset.openDrawer;
      render();
    });
  });

  document.querySelectorAll("[data-close-drawer]").forEach((element) => {
    element.addEventListener("click", () => {
      state.drawer = null;
      state.approvalDetail = null;
      render();
    });
  });

  document.querySelectorAll("[data-toast]").forEach((element) => {
    element.addEventListener("click", () => showToast(element.dataset.toast));
  });

  document.querySelectorAll("[data-filter]").forEach((element) => {
    element.addEventListener("click", () => {
      state.filter = element.dataset.filter;
      render();
    });
  });

  document.querySelectorAll("[data-project-filter]").forEach((element) => {
    element.addEventListener("click", () => {
      state.projectFilter = element.dataset.projectFilter;
      render();
    });
  });

  document.querySelectorAll("[data-debt-tab]").forEach((element) => {
    element.addEventListener("click", () => {
      state.debtTab = element.dataset.debtTab;
      render();
    });
  });

  document.querySelectorAll("[data-approval-detail]").forEach((element) => {
    element.addEventListener("click", () => {
      state.approvalDetail = element.dataset.approvalDetail;
      state.drawer = "approval";
      render();
    });
  });

  document.querySelectorAll("[data-approval-action]").forEach((element) => {
    element.addEventListener("click", () => showToast(`Persetujuan: ${element.dataset.approvalAction} masih contoh`));
  });

  document.querySelectorAll("[data-color]").forEach((element) => {
    element.addEventListener("click", () => {
      state.settings.primary = element.dataset.color;
      render();
      showToast("Warna utama diperbarui");
    });
  });

  document.querySelectorAll("[data-theme-choice]").forEach((element) => {
    element.addEventListener("click", () => {
      state.settings.theme = element.dataset.themeChoice;
      render();
      showToast("Mode tema diperbarui");
    });
  });

  const saveIdentity = document.querySelector("[data-save-identity]");
  if (saveIdentity) {
    saveIdentity.addEventListener("click", () => {
      state.settings.appName = document.getElementById("settingAppName").value.trim() || "DOMPET PT AI";
      state.settings.tagline = document.getElementById("settingTagline").value.trim() || "Pusat kontrol keuangan hemat anggaran";
      state.settings.companyName = document.getElementById("settingCompany").value.trim() || "PT Operasional Fiber Nusantara";
      render();
      showToast("Identitas aplikasi diterapkan");
    });
  }

  const logoButton = document.querySelector("[data-trigger-logo]");
  const logoInput = document.getElementById("logoInput");
  if (logoButton && logoInput) {
    logoButton.addEventListener("click", () => logoInput.click());
    logoInput.addEventListener("change", () => {
      const file = logoInput.files && logoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.settings.logo = reader.result;
        render();
        showToast("Logo berhasil dipratinjau");
      };
      reader.readAsDataURL(file);
    });
  }

  const backupButton = document.querySelector("[data-backup]");
  if (backupButton) {
    backupButton.addEventListener("click", () => {
      const payload = JSON.stringify({ settings: state.settings, transactions: mock.transactions, logs: mock.logs }, null, 2);
      downloadFile("dompet-pt-ai-backup-mock.json", "application/json", payload);
      showToast("Cadangan contoh dibuat");
    });
  }

  const restoreButton = document.querySelector("[data-trigger-restore]");
  const restoreInput = document.getElementById("restoreInput");
  if (restoreButton && restoreInput) {
    restoreButton.addEventListener("click", () => restoreInput.click());
    restoreInput.addEventListener("change", () => previewRestoreFile(restoreInput.files && restoreInput.files[0]));
  }

  const samplePreview = document.querySelector("[data-preview-sample]");
  if (samplePreview) {
    samplePreview.addEventListener("click", () => {
      state.restorePreview = { appName: "DOMPET PT AI Dipulihkan", transactions: 128, logs: 42 };
      render();
      showToast("Pratinjau pulihkan contoh ditampilkan");
    });
  }

  const applyRestore = document.querySelector("[data-apply-restore]");
  if (applyRestore) {
    applyRestore.addEventListener("click", () => {
      if (state.restorePreview.appName) state.settings.appName = state.restorePreview.appName;
      mock.logs.unshift({ time: "01 Jun 2026 23:40", user: "Admin Kontrol", action: "Terapkan pulihkan contoh", module: "Pengaturan" });
      state.restorePreview = null;
      render();
      showToast("Pulihkan contoh diterapkan ke UI");
    });
  }

  const exportLog = document.querySelector("[data-export-log]");
  if (exportLog) {
    exportLog.addEventListener("click", () => {
      const csv = ["time,user,module,action", ...mock.logs.map((log) => `${log.time},${log.user},${log.module},${log.action}`)].join("\n");
      downloadFile("dompet-pt-ai-log-mock.csv", "text/csv", csv);
      showToast("Log aktivitas diekspor");
    });
  }

  const saveTransaction = document.querySelector("[data-save-transaction]");
  if (saveTransaction) {
    saveTransaction.addEventListener("click", () => {
      mock.logs.unshift({ time: "01 Jun 2026 23:41", user: "Admin Kontrol", action: "Simpan transaksi contoh", module: state.drawer === "income" ? "Pemasukan" : "Pengeluaran" });
      state.drawer = null;
      render();
      showToast("Transaksi contoh disimpan ke log aktivitas");
    });
  }

  document.querySelectorAll("[data-ai-quick]").forEach((element) => {
    element.addEventListener("click", () => runAi(element.dataset.aiQuick));
  });

  const aiSend = document.querySelector("[data-ai-send]");
  if (aiSend) {
    aiSend.addEventListener("click", () => {
      const prompt = document.getElementById("aiPrompt").value.trim();
      if (!prompt) {
        showToast("Tulis pertanyaan dulu agar AI tetap hemat");
        return;
      }
      runAi(prompt);
    });
  }

  const aiClear = document.querySelector("[data-ai-clear]");
  if (aiClear) {
    aiClear.addEventListener("click", () => {
      state.aiMessages = [{ role: "ai", text: "Chat dibersihkan. Mode hemat tetap aktif dan diam." }];
      render();
    });
  }
}

function previewRestoreFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      state.restorePreview = {
        appName: data.settings?.appName || data.appName || "Cadangan tanpa nama aplikasi",
        transactions: Array.isArray(data.transactions) ? data.transactions.length : 0,
        logs: Array.isArray(data.logs) ? data.logs.length : 0,
      };
      render();
      showToast("Pratinjau pulihkan berhasil dibaca");
    } catch (error) {
      showToast("File restore bukan JSON valid");
    }
  };
  reader.readAsText(file);
}

function runAi(prompt) {
  const text = String(prompt).trim();
  state.aiMessages.push({ role: "user", text });
  state.aiUsage = Math.min(10, state.aiUsage + 0.04);
  const response = createAiResponse(text);
  state.aiMessages.push({ role: "ai", text: response });
  mock.logs.unshift({ time: "01 Jun 2026 23:42", user: "Admin Kontrol", action: `AI: ${text.slice(0, 36)}`, module: "AI Assistant" });
  render();
  showToast("AI dijalankan satu kali sesuai mode hemat");
}

function createAiResponse(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes("duplikat")) return "Ditemukan 2 transaksi dengan nominal mirip: pembayaran vendor OLT dan pembelian perangkat jaringan. Perlu tinjau faktur sebelum persetujuan.";
  if (lower.includes("budget") || lower.includes("anggaran")) return "Pengeluaran Infrastruktur memakai 72% anggaran bulanan. Masih aman, tetapi Modernisasi POP Utara masuk status Berisiko.";
  if (lower.includes("kategori")) return "Saran kategori: Infrastruktur jika terkait vendor kabel, OLT, splitter, POP, atau jaringan. Gunakan Kas Kecil untuk klaim biaya teknisi.";
  if (lower.includes("ringkas") || lower.includes("laporan")) return "Ringkasan Juni 2026: pemasukan lebih tinggi dari pengeluaran, saldo operasional sehat, dan persetujuan urgent terbesar ada di Infrastruktur IT.";
  return "Input diproses sebagai transaksi bebas. Saya sarankan cek nominal, proyek FTTH Barat, rekening Mandiri Giro, lalu simpan sebagai draft sebelum persetujuan.";
}

function downloadFile(name, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

render();
