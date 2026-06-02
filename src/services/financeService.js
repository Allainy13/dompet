import { defaultCompanyId, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { mockRepository, sumByType } from "../data/mockData.js";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

const transactionStatus = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};

const approvalStatus = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Minta Revisi",
};

const activeStatus = {
  active: "Aktif",
  inactive: "Nonaktif",
  invited: "Diundang",
};

const projectStatus = {
  active: "Aktif",
  hold: "Hold",
  completed: "Selesai",
};

const accountType = {
  bank: "Bank",
  cash: "Kas",
  petty_cash: "Kas Kecil",
  ewallet: "E-Wallet",
};

const debtStatus = {
  unpaid: "Belum Bayar",
  partial: "Sebagian",
  paid: "Lunas",
  overdue: "Jatuh Tempo",
};

const pettyCashType = {
  top_up: "Isi Kas",
  expense: "Pengeluaran Harian",
  adjustment: "Penyesuaian",
};

function fallbackData() {
  return mockRepository.loadInitialData();
}

function formatDate(value) {
  if (!value) return "-";
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function numberValue(value) {
  return Number(value || 0);
}

function parseUiDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return new Date(`${String(value).slice(0, 10)}T00:00:00`);
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };
  const [day, month, year] = String(value).split(/\s+/);
  if (!day || months[month] === undefined || !year) return null;
  return new Date(Number(year), months[month], Number(day));
}

function isDueSoon(value) {
  const date = parseUiDate(value);
  if (!date) return false;
  const diff = date.getTime() - Date.now();
  return diff <= 7 * 24 * 60 * 60 * 1000;
}

function applyCompanyFilter(query, companyId, column = "company_id") {
  return companyId ? query.eq(column, companyId) : query;
}

async function readTable(table, { companyId = defaultCompanyId, companyColumn = "company_id", orderBy = "created_at", ascending = false } = {}) {
  let query = supabase.from(table).select("*");
  query = applyCompanyFilter(query, companyId, companyColumn);
  if (orderBy) query = query.order(orderBy, { ascending });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function buildTransactions(rows, maps) {
  return rows.map((row) => {
    const project = maps.projects.get(row.project_id);
    const account = maps.accounts.get(row.account_id);
    const category = maps.categories.get(row.category_id);

    return {
      id: row.transaction_no || row.id,
      date: formatDate(row.date),
      desc: row.title,
      project: project?.name || "Operasional",
      category: category?.name || row.ai_category || "Lainnya",
      account: account?.name || "-",
      type: row.type,
      amount: numberValue(row.amount),
      status: transactionStatus[row.status] || row.status || "Draft",
    };
  });
}

function buildProjects(rows, transactions) {
  return rows.map((row) => {
    const spent = transactions
      .filter((item) => item.project_id === row.id && item.type === "expense")
      .reduce((total, item) => total + numberValue(item.amount), 0);
    const budget = numberValue(row.budget);
    const progress = budget ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

    return {
      id: row.id,
      name: row.name,
      manager: row.pic_name || "-",
      budget,
      spent,
      progress,
      status: projectStatus[row.status] || row.status,
      insight: progress > 90 ? "AI menandai serapan anggaran tinggi." : "Serapan anggaran masih dalam pemantauan.",
    };
  });
}

function buildApprovals(rows, maps) {
  return rows.map((row) => {
    const trx = maps.transactions.get(row.transaction_id);
    const requester = maps.users.get(row.requested_by);
    const project = maps.projects.get(trx?.project_id);
    const amount = numberValue(trx?.amount);
    const risk = row.ai_risk || trx?.ai_risk || "Aman";

    return {
      id: row.id,
      requester: requester?.name || "Finance",
      unit: requester?.role || "Keuangan",
      desc: trx?.title || row.note || "Approval transaksi",
      amount,
      status: approvalStatus[row.status] || transactionStatus[trx?.status] || "Pending",
      urgent: ["Melebihi Anggaran", "Bukti Kurang", "Potensi Duplikat"].includes(risk),
      project: project?.name || "Operasional",
      date: formatDate(row.created_at?.slice(0, 10)),
      risk,
      evidence: row.note || trx?.note || "Menunggu bukti pendukung",
      budgetUsed: amount >= 100000000 ? 92 : 58,
    };
  });
}

function buildAccounts(rows) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    balance: numberValue(row.current_balance),
    type: accountType[row.type] || row.type,
    status: activeStatus[row.status] || row.status,
    number: row.account_number || "-",
    owner: row.bank_name || "PT Operasional Fiber Nusantara",
  }));
}

function buildCategories(rows) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    group: row.group_name,
    status: activeStatus[row.status] || row.status,
  }));
}

function buildMutations(transactions, maps) {
  return transactions.slice(0, 10).map((row) => ({
    date: formatDate(row.date),
    account: maps.accounts.get(row.account_id)?.name || "-",
    desc: row.title,
    debit: row.type === "expense" ? numberValue(row.amount) : 0,
    credit: row.type === "income" ? numberValue(row.amount) : 0,
    status: transactionStatus[row.status] || row.status,
  }));
}

function buildPettyCash(rows) {
  return rows.map((row) => ({
    date: formatDate(row.created_at?.slice(0, 10)),
    desc: row.note || "Kas kecil",
    type: pettyCashType[row.type] || row.type,
    amount: numberValue(row.amount),
    status: row.type === "expense" ? "Pending" : "Approved",
  }));
}

function buildDebtReceivableRows(debts, receivables) {
  return [
    ...debts.map((row) => ({
      party: row.vendor_name,
      kind: "Hutang",
      due: formatDate(row.due_date),
      amount: numberValue(row.total_amount),
      paid: numberValue(row.paid_amount),
      status: debtStatus[row.status] || row.status,
    })),
    ...receivables.map((row) => ({
      party: row.client_name,
      kind: "Piutang",
      due: formatDate(row.due_date),
      amount: numberValue(row.total_amount),
      paid: numberValue(row.received_amount),
      status: debtStatus[row.status] || row.status,
    })),
  ];
}

function buildLogs(rows, maps) {
  return rows.map((row) => ({
    time: formatDateTime(row.created_at),
    user: maps.users.get(row.user_id)?.name || "Sistem",
    action: row.action,
    module: row.module,
  }));
}

function buildUsers(rows) {
  return rows.map((row) => ({
    name: row.name,
    email: row.email,
    role: row.role,
    status: activeStatus[row.status] || row.status,
  }));
}

function hydrateData({ projects, accounts, categories, transactions, approvals, debts, receivables, pettyCash, logs, users }) {
  const maps = {
    projects: new Map(projects.map((item) => [item.id, item])),
    accounts: new Map(accounts.map((item) => [item.id, item])),
    categories: new Map(categories.map((item) => [item.id, item])),
    transactions: new Map(transactions.map((item) => [item.id, item])),
    users: new Map(users.map((item) => [item.id, item])),
  };

  return {
    transactions: buildTransactions(transactions, maps),
    approvals: buildApprovals(approvals, maps),
    projects: buildProjects(projects, transactions),
    logs: buildLogs(logs, maps),
    accounts: buildAccounts(accounts),
    mutations: buildMutations(transactions, maps),
    categories: buildCategories(categories),
    pettyCash: buildPettyCash(pettyCash),
    debts: buildDebtReceivableRows(debts, receivables),
    users: buildUsers(users),
  };
}

export async function loadInitialFinanceData(options = {}) {
  if (!isSupabaseConfigured || !supabase) return fallbackData();

  try {
    const companyId = options.companyId || defaultCompanyId;
    const [projects, accounts, categories, transactions, approvals, debts, receivables, pettyCash, logs, users] = await Promise.all([
      readTable("projects", { companyId, orderBy: "created_at", ascending: true }),
      readTable("accounts", { companyId, orderBy: "created_at", ascending: true }),
      readTable("categories", { companyId, orderBy: "created_at", ascending: true }),
      readTable("transactions", { companyId, orderBy: "date" }),
      readTable("approvals", { companyId }),
      readTable("debts", { companyId, orderBy: "due_date", ascending: true }),
      readTable("receivables", { companyId, orderBy: "due_date", ascending: true }),
      readTable("petty_cash", { companyId }),
      readTable("activity_logs", { companyId }),
      readTable("users_profile", { companyId, orderBy: "created_at", ascending: true }),
    ]);

    if (!transactions.length && !projects.length) return fallbackData();
    return hydrateData({ projects, accounts, categories, transactions, approvals, debts, receivables, pettyCash, logs, users });
  } catch {
    return fallbackData();
  }
}

export async function getDashboardData(options = {}) {
  return loadInitialFinanceData(options);
}

export async function getDashboardSummary(options = {}) {
  const data = await loadInitialFinanceData(options);
  const income = sumByType(data.transactions, "income");
  const expense = sumByType(data.transactions, "expense");
  const totalBalance = data.accounts.reduce((total, item) => total + numberValue(item.balance), 0);
  const pendingApproval = data.approvals.filter((item) => item.status === "Pending").length;
  const pettyCashBalance = data.accounts.find((item) => item.type === "Kas Kecil")?.balance || 0;
  const dueDebts = data.debts.filter((item) => item.kind === "Hutang" && item.status !== "Lunas" && isDueSoon(item.due));
  const dueReceivables = data.debts.filter((item) => item.kind === "Piutang" && item.status !== "Lunas" && isDueSoon(item.due));
  const expensesByCategory = data.transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + numberValue(item.amount);
      return acc;
    }, {});

  return {
    totalBalance,
    income,
    expense,
    netProfit: income - expense,
    recentTransactions: data.transactions.slice(0, 5),
    pendingApproval,
    urgentApproval: data.approvals.filter((item) => item.urgent).length,
    pettyCashBalance,
    dueDebtsCount: dueDebts.length,
    dueDebtsAmount: dueDebts.reduce((total, item) => total + Math.max(0, numberValue(item.amount) - numberValue(item.paid)), 0),
    dueReceivablesCount: dueReceivables.length,
    dueReceivablesAmount: dueReceivables.reduce((total, item) => total + Math.max(0, numberValue(item.amount) - numberValue(item.paid)), 0),
    expensesByCategory: Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    isMock: !isSupabaseConfigured || !supabase,
  };
}

export async function getTransactions(options = {}) {
  const data = await loadInitialFinanceData(options);
  return data.transactions;
}

export async function getTransactionsByType(type, options = {}) {
  const transactions = await getTransactions(options);
  return transactions.filter((item) => item.type === type);
}

export async function getApprovals(options = {}) {
  const data = await loadInitialFinanceData(options);
  return data.approvals;
}

export async function getProjects(options = {}) {
  const data = await loadInitialFinanceData(options);
  return data.projects;
}

export async function getAccounts(options = {}) {
  const data = await loadInitialFinanceData(options);
  return data.accounts;
}

export async function getCategories(options = {}) {
  const data = await loadInitialFinanceData(options);
  return data.categories;
}

export async function getPettyCash(options = {}) {
  const data = await loadInitialFinanceData(options);
  return data.pettyCash;
}

export async function getDebts(options = {}) {
  const data = await loadInitialFinanceData(options);
  return data.debts.filter((item) => item.kind === "Hutang");
}

export async function getReceivables(options = {}) {
  const data = await loadInitialFinanceData(options);
  return data.debts.filter((item) => item.kind === "Piutang");
}

export async function getActivityLogs(options = {}) {
  const data = await loadInitialFinanceData(options);
  return data.logs;
}

export async function createTransaction(payload) {
  if (!isSupabaseConfigured || !supabase) return { data: payload, isMock: true };

  const { data, error } = await supabase.from("transactions").insert(payload).select().single();
  if (error) return { data: payload, error, isMock: true };
  return { data, isMock: false };
}

export async function updateApprovalStatus(id, status, note = "") {
  if (!isSupabaseConfigured || !supabase) return { data: { id, status, note }, isMock: true };

  const { data, error } = await supabase
    .from("approvals")
    .update({ status, note })
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: { id, status, note }, error, isMock: true };
  return { data, isMock: false };
}

export const financeService = {
  loadInitialData: loadInitialFinanceData,
  getDashboardData,
  getDashboardSummary,
  getTransactions,
  getTransactionsByType,
  getApprovals,
  getProjects,
  getAccounts,
  getCategories,
  getPettyCash,
  getDebts,
  getReceivables,
  getActivityLogs,
  createTransaction,
  updateApprovalStatus,
};
