import { defaultCompanyId, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { cloneMockData, currency, mockRepository, sumByType } from "../data/mockData.js";

const statusToUi = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};

const uiToStatus = {
  Draft: "draft",
  Pending: "pending",
  Approved: "approved",
  Paid: "paid",
  Rejected: "rejected",
};

function isReady() {
  return Boolean(isSupabaseConfigured && supabase);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function cleanUuid(value) {
  return isUuid(value) ? value : null;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function toUiTransaction(row) {
  return {
    id: row.transaction_no || row.id,
    date: formatDate(row.date),
    desc: row.title || row.desc || "Transaksi",
    project: row.projects?.name || row.project || "Operasional",
    category: row.categories?.name || row.category || row.ai_category || "Lainnya",
    account: row.accounts?.name || row.account || "-",
    type: row.type,
    amount: Number(row.amount || 0),
    status: statusToUi[row.status] || row.status || "Draft",
  };
}

function makeTransactionNo(type) {
  const prefix = type === "income" ? "INC" : "EXP";
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

function normalizePayload(payload) {
  return {
    company_id: cleanUuid(payload.company_id || defaultCompanyId),
    project_id: cleanUuid(payload.project_id),
    account_id: cleanUuid(payload.account_id),
    category_id: cleanUuid(payload.category_id),
    transaction_no: payload.transaction_no || makeTransactionNo(payload.type),
    type: payload.type,
    date: payload.date,
    title: payload.title,
    vendor_or_source: payload.vendor_or_source || null,
    payment_method: payload.payment_method || null,
    amount: Number(payload.amount || 0),
    tax_amount: Number(payload.tax_amount || 0),
    note: payload.note || null,
    proof_url: payload.proof_url || null,
    status: uiToStatus[payload.status] || payload.status || "draft",
    ai_category: payload.ai_category || null,
    ai_risk: payload.ai_risk || null,
    created_by: cleanUuid(payload.created_by),
  };
}

function getMockRows() {
  return cloneMockData().transactions;
}

export async function getTransactions() {
  if (!isReady()) return getMockRows();

  const { data, error } = await supabase
    .from("transactions")
    .select("*, projects(name, code), accounts(name), categories(name, type)")
    .order("date", { ascending: false });

  if (error) return getMockRows();
  return (data || []).map(toUiTransaction);
}

export async function getTransactionById(id) {
  if (!isReady()) return getMockRows().find((item) => item.id === id) || null;

  const { data, error } = await supabase
    .from("transactions")
    .select("*, projects(name, code), accounts(name), categories(name, type)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return toUiTransaction(data);
}

export async function createTransaction(payload) {
  const normalized = normalizePayload(payload);

  if (!isReady() || !normalized.company_id) {
    const mockRow = toUiTransaction({
      ...normalized,
      project: payload.project_name,
      category: payload.category_name,
      account: payload.account_name,
      status: normalized.status || "draft",
    });
    return { data: normalized, uiTransaction: mockRow, isMock: true };
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert(normalized)
    .select("*, projects(name, code), accounts(name), categories(name, type)")
    .single();

  if (error) return { data: normalized, uiTransaction: toUiTransaction(normalized), error, isMock: true };

  await addActivityLog({
    company_id: normalized.company_id,
    module: "Transaksi",
    action: "Tambah transaksi",
    target_id: data.id,
    description: normalized.title,
  });

  return { data, uiTransaction: toUiTransaction(data), isMock: false };
}

export async function updateTransaction(id, payload) {
  const normalized = normalizePayload(payload);

  if (!isReady()) return { data: { id, ...normalized }, uiTransaction: toUiTransaction({ id, ...normalized }), isMock: true };

  const { data, error } = await supabase
    .from("transactions")
    .update(normalized)
    .eq("id", id)
    .select("*, projects(name, code), accounts(name), categories(name, type)")
    .single();

  if (error) return { data: { id, ...normalized }, error, isMock: true };
  await addActivityLog({ company_id: data.company_id, module: "Transaksi", action: "Ubah transaksi", target_id: data.id, description: data.title });
  return { data, uiTransaction: toUiTransaction(data), isMock: false };
}

export async function deleteTransaction(id) {
  if (!isReady()) return { id, isMock: true };

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { id, error, isMock: true };
  await addActivityLog({ module: "Transaksi", action: "Hapus transaksi", target_id: id, description: "Transaksi dihapus" });
  return { id, isMock: false };
}

export async function getTransactionsByType(type) {
  const rows = await getTransactions();
  return rows.filter((item) => item.type === type);
}

export async function getTransactionSummary() {
  const data = mockRepository.loadInitialData();
  const rows = await getTransactions();
  const income = sumByType({ ...data, transactions: rows }.transactions, "income");
  const expense = sumByType({ ...data, transactions: rows }.transactions, "expense");

  return {
    income,
    expense,
    net: income - expense,
    incomeLabel: currency(income),
    expenseLabel: currency(expense),
    netLabel: currency(income - expense),
    totalTransactions: rows.length,
  };
}

export async function addActivityLog(payload) {
  if (!isReady() || !payload.company_id) return { data: payload, isMock: true };

  const { data, error } = await supabase.from("activity_logs").insert(payload).select().single();
  if (error) return { data: payload, error, isMock: true };
  return { data, isMock: false };
}

export const transactionService = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByType,
  getTransactionSummary,
  addActivityLog,
};
