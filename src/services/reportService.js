import { currency, mockRepository, sumByType } from "../data/mockData.js";
import { defaultCompanyId, isSupabaseConfigured } from "../lib/supabaseClient.js";
import { financeService } from "./financeService.js";

const reportTypeMeta = {
  cashflow: { label: "Arus Kas", file: "arus-kas" },
  income: { label: "Pemasukan", file: "pemasukan" },
  expense: { label: "Pengeluaran", file: "pengeluaran" },
  petty_cash: { label: "Kas Kecil", file: "kas-kecil" },
  debt: { label: "Hutang", file: "hutang" },
  receivable: { label: "Piutang", file: "piutang" },
  project: { label: "Per Proyek", file: "per-proyek" },
};

const monthIndex = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  Mei: 4,
  Jun: 5,
  Jul: 6,
  Agu: 7,
  Sep: 8,
  Okt: 9,
  Nov: 10,
  Des: 11,
};

function isAll(value) {
  return !value || String(value).toLowerCase().startsWith("semua");
}

function parseReportDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return new Date(`${text.slice(0, 10)}T00:00:00`);

  const [day, month, year] = text.split(/\s+/);
  if (!day || !month || !year || monthIndex[month] === undefined) return null;
  return new Date(Number(year), monthIndex[month], Number(day));
}

function dateInRange(value, filters = {}) {
  const date = parseReportDate(value);
  if (!date) return true;

  const start = parseReportDate(filters.startDate);
  const end = parseReportDate(filters.endDate);
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function periodLabel(filters = {}) {
  const start = formatPeriodDate(filters.startDate || "2026-06-01");
  const end = formatPeriodDate(filters.endDate || "2026-06-30");
  return `${start} s/d ${end}`;
}

function formatPeriodDate(value) {
  const date = parseReportDate(value);
  if (!date) return String(value || "-");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function numberValue(value) {
  return Number(value || 0);
}

function percent(value) {
  return `${Math.round(numberValue(value))}%`;
}

function cleanFilters(filters = {}) {
  return {
    reportType: filters.reportType || "cashflow",
    startDate: filters.startDate || "2026-06-01",
    endDate: filters.endDate || "2026-06-30",
    project: filters.project || "Semua Proyek",
    account: filters.account || "Semua Rekening",
    category: filters.category || "Semua Kategori",
    companyId: filters.companyId || defaultCompanyId,
    isDemo: Boolean(filters.isDemo || !isSupabaseConfigured),
  };
}

async function loadReportData(filters = {}) {
  const safeFilters = cleanFilters(filters);
  const data = await financeService.loadInitialData({ companyId: safeFilters.companyId });
  return { data, filters: safeFilters, isMock: safeFilters.isDemo || !isSupabaseConfigured };
}

function filterTransactions(transactions = [], filters = {}, type) {
  return transactions.filter((item) => {
    if (type && item.type !== type) return false;
    if (!dateInRange(item.date, filters)) return false;
    if (!isAll(filters.project) && item.project !== filters.project) return false;
    if (!isAll(filters.account) && item.account !== filters.account) return false;
    if (!isAll(filters.category) && item.category !== filters.category) return false;
    return true;
  });
}

function filterPettyCash(rows = [], filters = {}) {
  return rows.filter((item) => dateInRange(item.date, filters));
}

function filterDebtRows(rows = [], filters = {}, kind) {
  return rows.filter((item) => item.kind === kind && dateInRange(item.due, filters));
}

function filterProjects(rows = [], filters = {}) {
  if (isAll(filters.project)) return rows;
  return rows.filter((item) => item.name === filters.project || item.name.includes(filters.project));
}

function buildSummary(data, filters = {}) {
  const transactions = filterTransactions(data.transactions, filters);
  const income = sumByType(transactions, "income");
  const expense = sumByType(transactions, "expense");
  const pettyCash = filterPettyCash(data.pettyCash, filters).reduce((total, item) => total + numberValue(item.amount), 0);
  const debts = filterDebtRows(data.debts, filters, "Hutang");
  const receivables = filterDebtRows(data.debts, filters, "Piutang");

  return {
    income,
    expense,
    net: income - expense,
    transactions: transactions.length,
    pettyCash,
    debtOutstanding: debts.reduce((total, item) => total + Math.max(0, numberValue(item.amount) - numberValue(item.paid)), 0),
    receivableOutstanding: receivables.reduce((total, item) => total + Math.max(0, numberValue(item.amount) - numberValue(item.paid)), 0),
    incomeLabel: currency(income),
    expenseLabel: currency(expense),
    netLabel: currency(income - expense),
  };
}

function topExpenses(transactions = []) {
  const grouped = transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + numberValue(item.amount);
      return acc;
    }, {});

  return Object.entries(grouped)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
}

function baseReport(type, data, filters, rows, columns, note) {
  const summary = buildSummary(data, filters);
  const meta = reportTypeMeta[type] || reportTypeMeta.cashflow;
  return {
    type,
    title: meta.label,
    period: periodLabel(filters),
    filters,
    summary,
    summaryText: `${meta.label}: ${summary.incomeLabel} pemasukan, ${summary.expenseLabel} pengeluaran, saldo bersih ${summary.netLabel}.`,
    note,
    columns,
    rows,
    topExpenses: topExpenses(filterTransactions(data.transactions, filters)),
    isMock: filters.isDemo || !isSupabaseConfigured,
  };
}

function transactionRows(transactions, mode) {
  return transactions.map((item) => {
    const base = {
      Tanggal: item.date,
      Uraian: item.desc,
      Proyek: item.project,
      Rekening: item.account,
      Kategori: item.category,
      Status: item.status,
    };

    if (mode === "income") return { ...base, Sumber: item.desc, Nominal: currency(item.amount) };
    if (mode === "expense") return { ...base, Vendor: item.desc, Nominal: currency(item.amount) };
    return {
      ...base,
      Masuk: item.type === "income" ? currency(item.amount) : "-",
      Keluar: item.type === "expense" ? currency(item.amount) : "-",
    };
  });
}

export async function getReportSummary(filters = {}) {
  const { data, filters: safeFilters, isMock } = await loadReportData(filters);
  return { ...buildSummary(data, safeFilters), isMock };
}

export async function getCashflowReport(filters = {}) {
  const { data, filters: safeFilters } = await loadReportData(filters);
  const rows = transactionRows(filterTransactions(data.transactions, safeFilters), "cashflow");
  return baseReport("cashflow", data, safeFilters, rows, ["Tanggal", "Uraian", "Proyek", "Rekening", "Kategori", "Masuk", "Keluar", "Status"], "Arus kas menampilkan pemasukan dan pengeluaran dalam periode terpilih.");
}

export async function getIncomeReport(filters = {}) {
  const { data, filters: safeFilters } = await loadReportData(filters);
  const rows = transactionRows(filterTransactions(data.transactions, safeFilters, "income"), "income");
  return baseReport("income", data, safeFilters, rows, ["Tanggal", "Uraian", "Sumber", "Proyek", "Rekening", "Kategori", "Nominal", "Status"], "Laporan pemasukan fokus pada termin, retensi, dan sumber dana lain.");
}

export async function getExpenseReport(filters = {}) {
  const { data, filters: safeFilters } = await loadReportData(filters);
  const rows = transactionRows(filterTransactions(data.transactions, safeFilters, "expense"), "expense");
  return baseReport("expense", data, safeFilters, rows, ["Tanggal", "Uraian", "Vendor", "Proyek", "Rekening", "Kategori", "Nominal", "Status"], "Laporan pengeluaran membantu meninjau vendor, kategori, dan status pembayaran.");
}

export async function getPettyCashReport(filters = {}) {
  const { data, filters: safeFilters } = await loadReportData(filters);
  const rows = filterPettyCash(data.pettyCash, safeFilters).map((item) => ({
    Tanggal: item.date,
    Uraian: item.desc,
    Jenis: item.type,
    Nominal: currency(item.amount),
    Status: item.status,
  }));
  return baseReport("petty_cash", data, safeFilters, rows, ["Tanggal", "Uraian", "Jenis", "Nominal", "Status"], "Kas kecil masih diringkas dari transaksi harian dan top up kas.");
}

export async function getDebtReport(filters = {}) {
  const { data, filters: safeFilters } = await loadReportData(filters);
  const rows = filterDebtRows(data.debts, safeFilters, "Hutang").map((item) => ({
    "Jatuh Tempo": item.due,
    Vendor: item.party,
    Total: currency(item.amount),
    Dibayar: currency(item.paid),
    Sisa: currency(Math.max(0, numberValue(item.amount) - numberValue(item.paid))),
    Status: item.status,
  }));
  return baseReport("debt", data, safeFilters, rows, ["Jatuh Tempo", "Vendor", "Total", "Dibayar", "Sisa", "Status"], "Hutang menampilkan kewajiban vendor dan sisa pembayaran.");
}

export async function getReceivableReport(filters = {}) {
  const { data, filters: safeFilters } = await loadReportData(filters);
  const rows = filterDebtRows(data.debts, safeFilters, "Piutang").map((item) => ({
    "Jatuh Tempo": item.due,
    Klien: item.party,
    Total: currency(item.amount),
    Diterima: currency(item.paid),
    Sisa: currency(Math.max(0, numberValue(item.amount) - numberValue(item.paid))),
    Status: item.status,
  }));
  return baseReport("receivable", data, safeFilters, rows, ["Jatuh Tempo", "Klien", "Total", "Diterima", "Sisa", "Status"], "Piutang menampilkan tagihan klien dan realisasi penerimaan.");
}

export async function getProjectReport(filters = {}) {
  const { data, filters: safeFilters } = await loadReportData(filters);
  const rows = filterProjects(data.projects, safeFilters).map((item) => ({
    Proyek: item.name,
    PIC: item.manager,
    Anggaran: currency(item.budget),
    Realisasi: currency(item.spent),
    Sisa: currency(Math.max(0, numberValue(item.budget) - numberValue(item.spent))),
    Progress: percent(item.progress),
    Status: item.status,
  }));
  return baseReport("project", data, safeFilters, rows, ["Proyek", "PIC", "Anggaran", "Realisasi", "Sisa", "Progress", "Status"], "Laporan proyek menyorot budget, realisasi, dan status pekerjaan.");
}

async function getReportByType(reportType = "cashflow", filters = {}) {
  const type = reportType || filters.reportType || "cashflow";
  const nextFilters = { ...filters, reportType: type };
  const handlers = {
    cashflow: getCashflowReport,
    income: getIncomeReport,
    expense: getExpenseReport,
    petty_cash: getPettyCashReport,
    debt: getDebtReport,
    receivable: getReceivableReport,
    project: getProjectReport,
  };
  return (handlers[type] || getCashflowReport)(nextFilters);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function exportCsvReport(reportType = "cashflow", filters = {}) {
  const report = await getReportByType(reportType, filters);
  const lines = [report.columns.join(","), ...report.rows.map((row) => report.columns.map((column) => csvEscape(row[column])).join(","))];
  const file = reportTypeMeta[report.type]?.file || "laporan";
  return {
    fileName: `dompet-pt-ai-${file}.csv`,
    contentType: "text/csv;charset=utf-8",
    content: lines.join("\n"),
    report,
    isMock: report.isMock,
  };
}

export async function exportJsonReport(reportType = "cashflow", filters = {}) {
  const report = await getReportByType(reportType, filters);
  const file = reportTypeMeta[report.type]?.file || "laporan";
  return {
    fileName: `dompet-pt-ai-${file}.json`,
    contentType: "application/json",
    content: JSON.stringify(report, null, 2),
    report,
    isMock: report.isMock,
  };
}

export async function generateWhatsAppReport(filters = {}) {
  const report = await getReportByType(filters.reportType || "cashflow", filters);
  const top = report.topExpenses.length
    ? report.topExpenses.map((item, index) => `${index + 1}. ${item.category} - ${currency(item.amount)}`).join("\n")
    : "- Belum ada pengeluaran";

  return `LAPORAN KEUANGAN DOMPET PT\nPeriode: ${report.period}\n\nPemasukan: ${report.summary.incomeLabel}\nPengeluaran: ${report.summary.expenseLabel}\nSaldo Bersih: ${report.summary.netLabel}\n\nTop Pengeluaran:\n${top}\n\nCatatan:\n- ${report.isMock ? "Data masih mode demo jika Supabase belum aktif." : "Data diambil dari Supabase sesuai filter aktif."}`;
}

export async function getReportPreview(filters = {}) {
  return getReportByType(filters.reportType || "cashflow", filters);
}

export function createCompactReportSnapshot(report = {}) {
  return {
    type: report.type,
    title: report.title,
    period: report.period,
    summary: report.summary,
    topExpenses: (report.topExpenses || []).slice(0, 3),
    rowCount: (report.rows || []).length,
    sampleRows: (report.rows || []).slice(0, 8),
    isMock: report.isMock,
  };
}

export function getMockReportPreview() {
  const data = mockRepository.loadInitialData();
  const filters = cleanFilters({ isDemo: true });
  return baseReport("cashflow", data, filters, transactionRows(data.transactions, "cashflow"), ["Tanggal", "Uraian", "Proyek", "Rekening", "Kategori", "Masuk", "Keluar", "Status"], "Pratinjau mock arus kas.");
}

export async function exportReportPlaceholder(format, filters = {}) {
  return format === "json" ? exportJsonReport(filters.reportType || "cashflow", filters) : exportCsvReport(filters.reportType || "cashflow", filters);
}

export const reportService = {
  getReportSummary,
  getCashflowReport,
  getIncomeReport,
  getExpenseReport,
  getPettyCashReport,
  getDebtReport,
  getReceivableReport,
  getProjectReport,
  generateWhatsAppReport,
  exportCsvReport,
  exportJsonReport,
  createCompactReportSnapshot,
  getReportPreview,
  getMockReportPreview,
  exportReportPlaceholder,
};
