import { mockRepository } from "../data/mockData.js";
import { defaultCompanyId, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { addActivityLog } from "./activityLogService.js";

const statusToDb = {
  "Belum Bayar": "unpaid",
  Sebagian: "partial",
  Lunas: "paid",
  "Jatuh Tempo": "overdue",
};

const statusToUi = {
  unpaid: "Belum Bayar",
  partial: "Sebagian",
  paid: "Lunas",
  overdue: "Jatuh Tempo",
};

function isReady() {
  return Boolean(isSupabaseConfigured && supabase);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function readyCompany(companyId) {
  return isReady() && isUuid(companyId);
}

function cleanUuid(value) {
  return isUuid(value) ? value : null;
}

function numberValue(value) {
  return Number(value || 0);
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function toIsoDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", Jun: "06", Jul: "07", Agu: "08", Sep: "09", Okt: "10", Nov: "11", Des: "12" };
  const [day, month, year] = text.split(/\s+/);
  if (!day || !months[month] || !year) return null;
  return `${year}-${months[month]}-${String(day).padStart(2, "0")}`;
}

function mockDebtRows() {
  return mockRepository.loadInitialData().debts.filter((item) => item.kind === "Hutang").map((item) => ({
    id: item.id || `mock-debt-${item.party}`,
    vendor_name: item.party,
    invoice_no: item.invoice_no || "-",
    project_id: item.project_id || "",
    invoice_date: item.invoice_date || "2026-06-01",
    due_date: toIsoDate(item.due) || item.due,
    due: item.due,
    total_amount: item.amount,
    paid_amount: item.paid,
    status: item.status,
    note: item.note || "Data hutang contoh",
  }));
}

function mockReceivableRows() {
  return mockRepository.loadInitialData().debts.filter((item) => item.kind === "Piutang").map((item) => ({
    id: item.id || `mock-receivable-${item.party}`,
    client_name: item.party,
    invoice_no: item.invoice_no || "-",
    project_id: item.project_id || "",
    invoice_date: item.invoice_date || "2026-06-01",
    due_date: toIsoDate(item.due) || item.due,
    due: item.due,
    total_amount: item.amount,
    received_amount: item.paid,
    status: item.status,
    note: item.note || "Data piutang contoh",
  }));
}

function debtToUi(row) {
  return {
    id: row.id,
    vendor_name: row.vendor_name,
    party: row.vendor_name,
    kind: "Hutang",
    invoice_no: row.invoice_no || "-",
    project_id: row.project_id || "",
    invoice_date: row.invoice_date || "",
    due_date: row.due_date || "",
    due: formatDate(row.due_date) || row.due || "-",
    total_amount: numberValue(row.total_amount),
    paid_amount: numberValue(row.paid_amount),
    amount: numberValue(row.total_amount),
    paid: numberValue(row.paid_amount),
    status: statusToUi[row.status] || row.status || "Belum Bayar",
    note: row.note || "",
  };
}

function receivableToUi(row) {
  return {
    id: row.id,
    client_name: row.client_name,
    party: row.client_name,
    kind: "Piutang",
    invoice_no: row.invoice_no || "-",
    project_id: row.project_id || "",
    invoice_date: row.invoice_date || "",
    due_date: row.due_date || "",
    due: formatDate(row.due_date) || row.due || "-",
    total_amount: numberValue(row.total_amount),
    received_amount: numberValue(row.received_amount),
    amount: numberValue(row.total_amount),
    paid: numberValue(row.received_amount),
    status: statusToUi[row.status] || row.status || "Belum Bayar",
    note: row.note || "",
  };
}

function normalizeDebt(payload = {}, companyId = defaultCompanyId) {
  return {
    company_id: companyId,
    project_id: cleanUuid(payload.project_id),
    vendor_name: payload.vendor_name || payload.party || "Vendor",
    invoice_no: payload.invoice_no || null,
    invoice_date: toIsoDate(payload.invoice_date) || null,
    due_date: toIsoDate(payload.due_date || payload.due) || null,
    total_amount: numberValue(payload.total_amount ?? payload.amount),
    paid_amount: numberValue(payload.paid_amount ?? payload.paid),
    status: statusToDb[payload.status] || payload.status || "unpaid",
    note: payload.note || null,
  };
}

function normalizeReceivable(payload = {}, companyId = defaultCompanyId) {
  return {
    company_id: companyId,
    project_id: cleanUuid(payload.project_id),
    client_name: payload.client_name || payload.party || "Klien",
    invoice_no: payload.invoice_no || null,
    invoice_date: toIsoDate(payload.invoice_date) || null,
    due_date: toIsoDate(payload.due_date || payload.due) || null,
    total_amount: numberValue(payload.total_amount ?? payload.amount),
    received_amount: numberValue(payload.received_amount ?? payload.paid),
    status: statusToDb[payload.status] || payload.status || "unpaid",
    note: payload.note || null,
  };
}

async function logFinance(companyId, module, action, targetId, description) {
  await addActivityLog({ company_id: companyId, module, action, target_id: targetId, description });
}

export async function getDebts(companyId = defaultCompanyId) {
  if (!readyCompany(companyId)) return mockDebtRows();
  const { data, error } = await supabase.from("debts").select("*").eq("company_id", companyId).order("due_date", { ascending: true });
  if (error) return mockDebtRows();
  return (data || []).map(debtToUi);
}

export async function getDebtById(id, companyId = defaultCompanyId) {
  if (!readyCompany(companyId) || !isUuid(id)) return mockDebtRows().find((item) => item.id === id) || null;
  const { data, error } = await supabase.from("debts").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return debtToUi(data);
}

export async function createDebt(payload, companyId = defaultCompanyId) {
  const normalized = normalizeDebt(payload, companyId);
  if (!readyCompany(companyId)) return { data: normalized, uiDebt: debtToUi({ ...normalized, id: `mock-debt-${Date.now()}` }), isMock: true };
  const { data, error } = await supabase.from("debts").insert(normalized).select().single();
  if (error) return { data: normalized, uiDebt: debtToUi(normalized), error, isMock: true };
  await logFinance(companyId, "Hutang", "Tambah hutang", data.id, data.vendor_name);
  return { data, uiDebt: debtToUi(data), isMock: false };
}

export async function updateDebt(id, payload, companyId = defaultCompanyId) {
  const normalized = normalizeDebt(payload, companyId);
  if (!readyCompany(companyId) || !isUuid(id)) return { data: { id, ...normalized }, uiDebt: debtToUi({ id, ...normalized }), isMock: true };
  const { data, error } = await supabase.from("debts").update(normalized).eq("id", id).select().single();
  if (error) return { data: { id, ...normalized }, uiDebt: debtToUi({ id, ...normalized }), error, isMock: true };
  await logFinance(companyId, "Hutang", "Ubah hutang", data.id, data.vendor_name);
  return { data, uiDebt: debtToUi(data), isMock: false };
}

export async function deleteDebt(id, companyId = defaultCompanyId) {
  if (!readyCompany(companyId) || !isUuid(id)) return { id, isMock: true };
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) return { id, error, isMock: true };
  await logFinance(companyId, "Hutang", "Hapus hutang", id, "Hutang dihapus");
  return { id, isMock: false };
}

export async function markDebtPartialPaid(id, amount, companyId = defaultCompanyId) {
  const current = await getDebtById(id, companyId);
  const paid = Math.min(numberValue(current?.total_amount), numberValue(current?.paid_amount) + numberValue(amount));
  const status = paid >= numberValue(current?.total_amount) ? "Lunas" : "Sebagian";
  return updateDebt(id, { ...current, paid_amount: paid, status }, companyId);
}

export async function markDebtPaid(id, companyId = defaultCompanyId) {
  const current = await getDebtById(id, companyId);
  return updateDebt(id, { ...current, paid_amount: current?.total_amount || current?.amount || 0, status: "Lunas" }, companyId);
}

export async function getReceivables(companyId = defaultCompanyId) {
  if (!readyCompany(companyId)) return mockReceivableRows();
  const { data, error } = await supabase.from("receivables").select("*").eq("company_id", companyId).order("due_date", { ascending: true });
  if (error) return mockReceivableRows();
  return (data || []).map(receivableToUi);
}

export async function getReceivableById(id, companyId = defaultCompanyId) {
  if (!readyCompany(companyId) || !isUuid(id)) return mockReceivableRows().find((item) => item.id === id) || null;
  const { data, error } = await supabase.from("receivables").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return receivableToUi(data);
}

export async function createReceivable(payload, companyId = defaultCompanyId) {
  const normalized = normalizeReceivable(payload, companyId);
  if (!readyCompany(companyId)) return { data: normalized, uiReceivable: receivableToUi({ ...normalized, id: `mock-receivable-${Date.now()}` }), isMock: true };
  const { data, error } = await supabase.from("receivables").insert(normalized).select().single();
  if (error) return { data: normalized, uiReceivable: receivableToUi(normalized), error, isMock: true };
  await logFinance(companyId, "Piutang", "Tambah piutang", data.id, data.client_name);
  return { data, uiReceivable: receivableToUi(data), isMock: false };
}

export async function updateReceivable(id, payload, companyId = defaultCompanyId) {
  const normalized = normalizeReceivable(payload, companyId);
  if (!readyCompany(companyId) || !isUuid(id)) return { data: { id, ...normalized }, uiReceivable: receivableToUi({ id, ...normalized }), isMock: true };
  const { data, error } = await supabase.from("receivables").update(normalized).eq("id", id).select().single();
  if (error) return { data: { id, ...normalized }, uiReceivable: receivableToUi({ id, ...normalized }), error, isMock: true };
  await logFinance(companyId, "Piutang", "Ubah piutang", data.id, data.client_name);
  return { data, uiReceivable: receivableToUi(data), isMock: false };
}

export async function deleteReceivable(id, companyId = defaultCompanyId) {
  if (!readyCompany(companyId) || !isUuid(id)) return { id, isMock: true };
  const { error } = await supabase.from("receivables").delete().eq("id", id);
  if (error) return { id, error, isMock: true };
  await logFinance(companyId, "Piutang", "Hapus piutang", id, "Piutang dihapus");
  return { id, isMock: false };
}

export async function markReceivablePartialReceived(id, amount, companyId = defaultCompanyId) {
  const current = await getReceivableById(id, companyId);
  const received = Math.min(numberValue(current?.total_amount), numberValue(current?.received_amount) + numberValue(amount));
  const status = received >= numberValue(current?.total_amount) ? "Lunas" : "Sebagian";
  return updateReceivable(id, { ...current, received_amount: received, status }, companyId);
}

export async function markReceivablePaid(id, companyId = defaultCompanyId) {
  const current = await getReceivableById(id, companyId);
  return updateReceivable(id, { ...current, received_amount: current?.total_amount || current?.amount || 0, status: "Lunas" }, companyId);
}

export const payableReceivableService = {
  getDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  markDebtPartialPaid,
  markDebtPaid,
  getReceivables,
  getReceivableById,
  createReceivable,
  updateReceivable,
  deleteReceivable,
  markReceivablePartialReceived,
  markReceivablePaid,
};
