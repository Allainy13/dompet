import { mockRepository } from "../data/mockData.js";
import { defaultCompanyId, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { addActivityLog } from "./activityLogService.js";

const typeToDb = {
  topup: "top_up",
  top_up: "top_up",
  "Top Up": "top_up",
  "Isi Kas": "top_up",
  spend: "expense",
  expense: "expense",
  "Pengeluaran Kas": "expense",
  "Pengeluaran Harian": "expense",
};

const typeToUi = {
  top_up: "Isi Kas",
  expense: "Pengeluaran Harian",
  adjustment: "Penyesuaian",
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

function readyCompany(companyId) {
  return isReady() && isUuid(companyId);
}

function numberValue(value) {
  return Number(value || 0);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function mockRows() {
  return mockRepository.loadInitialData().pettyCash.map((item, index) => ({
    id: item.id || `mock-petty-${index}`,
    date: item.date,
    desc: item.desc,
    type: item.type,
    account_id: item.account_id || "",
    transaction_id: item.transaction_id || "",
    amount: numberValue(item.amount),
    note: item.note || item.desc,
    proof_url: item.proof_url || "",
    status: item.status,
    created_at: item.created_at || todayIso(),
  }));
}

function pettyCashToUi(row) {
  return {
    id: row.id,
    date: row.date || formatDateTime(row.created_at),
    desc: row.note || row.desc || "Kas kecil",
    type: typeToUi[row.type] || row.type || "Pengeluaran Harian",
    account_id: row.account_id || "",
    transaction_id: row.transaction_id || "",
    amount: numberValue(row.amount),
    note: row.note || "",
    proof_url: row.proof_url || "",
    status: row.status || (row.type === "top_up" ? "Approved" : "Pending"),
    created_at: row.created_at,
  };
}

function normalizePayload(payload = {}, companyId = defaultCompanyId) {
  const type = typeToDb[payload.type] || payload.type || "expense";
  return {
    company_id: companyId,
    account_id: cleanUuid(payload.account_id),
    transaction_id: cleanUuid(payload.transaction_id),
    type,
    amount: numberValue(payload.amount),
    note: payload.note || payload.desc || null,
    proof_url: payload.proof_url || null,
  };
}

async function logPetty(companyId, action, targetId, description) {
  await addActivityLog({ company_id: companyId, module: "Kas Kecil", action, target_id: targetId, description });
}

export async function getPettyCash(companyId = defaultCompanyId) {
  if (!readyCompany(companyId)) return mockRows();
  const { data, error } = await supabase.from("petty_cash").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
  if (error) return mockRows();
  return (data || []).map(pettyCashToUi);
}

export async function getPettyCashSummary(companyId = defaultCompanyId) {
  const rows = await getPettyCash(companyId);
  const mock = mockRepository.loadInitialData();
  const baseBalance = readyCompany(companyId)
    ? 0
    : mock.accounts.find((item) => item.type === "Kas Kecil")?.balance || 0;
  const topUpMonth = rows.filter((item) => item.type === "Isi Kas").reduce((sum, item) => sum + numberValue(item.amount), 0);
  const spend = rows.filter((item) => item.type !== "Isi Kas").reduce((sum, item) => sum + numberValue(item.amount), 0);
  const today = todayIso();
  const spendToday = rows
    .filter((item) => item.type !== "Isi Kas" && String(item.created_at || "").startsWith(today))
    .reduce((sum, item) => sum + numberValue(item.amount), 0);
  const weeklySpend = rows.filter((item) => item.type !== "Isi Kas").reduce((sum, item) => sum + numberValue(item.amount), 0);
  const balance = readyCompany(companyId) ? topUpMonth - spend : baseBalance;

  return {
    balance,
    topUpMonth,
    spendToday: spendToday || weeklySpend,
    weeklySpend,
    budgetRemaining: Math.max(0, balance - weeklySpend),
    rows,
    isMock: !readyCompany(companyId),
  };
}

export async function createPettyCashEntry(payload, companyId = defaultCompanyId) {
  const normalized = normalizePayload(payload, companyId);
  if (!readyCompany(companyId)) return { data: normalized, uiEntry: pettyCashToUi({ ...normalized, id: `mock-petty-${Date.now()}`, created_at: new Date().toISOString(), status: normalized.type === "top_up" ? "Approved" : "Pending" }), isMock: true };
  const { data, error } = await supabase.from("petty_cash").insert(normalized).select().single();
  if (error) return { data: normalized, uiEntry: pettyCashToUi(normalized), error, isMock: true };
  await logPetty(companyId, normalized.type === "top_up" ? "Top up kas" : "Pengeluaran kas", data.id, data.note);
  return { data, uiEntry: pettyCashToUi(data), isMock: false };
}

export async function updatePettyCashEntry(id, payload, companyId = defaultCompanyId) {
  const normalized = normalizePayload(payload, companyId);
  if (!readyCompany(companyId) || !isUuid(id)) return { data: { id, ...normalized }, uiEntry: pettyCashToUi({ id, ...normalized, created_at: payload.created_at || new Date().toISOString(), status: payload.status }), isMock: true };
  const { data, error } = await supabase.from("petty_cash").update(normalized).eq("id", id).select().single();
  if (error) return { data: { id, ...normalized }, uiEntry: pettyCashToUi({ id, ...normalized }), error, isMock: true };
  await logPetty(companyId, "Ubah kas kecil", data.id, data.note);
  return { data, uiEntry: pettyCashToUi(data), isMock: false };
}

export async function deletePettyCashEntry(id, companyId = defaultCompanyId) {
  if (!readyCompany(companyId) || !isUuid(id)) return { id, isMock: true };
  const { error } = await supabase.from("petty_cash").delete().eq("id", id);
  if (error) return { id, error, isMock: true };
  await logPetty(companyId, "Hapus kas kecil", id, "Transaksi kas kecil dihapus");
  return { id, isMock: false };
}

export function topUpPettyCash(payload, companyId = defaultCompanyId) {
  return createPettyCashEntry({ ...payload, type: "topup" }, companyId);
}

export function spendPettyCash(payload, companyId = defaultCompanyId) {
  return createPettyCashEntry({ ...payload, type: "spend" }, companyId);
}

export const pettyCashService = {
  getPettyCash,
  getPettyCashSummary,
  createPettyCashEntry,
  updatePettyCashEntry,
  deletePettyCashEntry,
  topUpPettyCash,
  spendPettyCash,
};
