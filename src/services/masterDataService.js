import { mockRepository } from "../data/mockData.js";
import { defaultCompanyId, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { addActivityLog } from "./activityLogService.js";

const projectStatusToDb = { Aktif: "active", Hold: "hold", Selesai: "completed" };
const projectStatusToUi = { active: "Aktif", hold: "Hold", completed: "Selesai" };
const accountTypeToDb = { Bank: "bank", Kas: "cash", "Kas Kecil": "petty_cash", "E-Wallet": "ewallet" };
const accountTypeToUi = { bank: "Bank", cash: "Kas", petty_cash: "Kas Kecil", ewallet: "E-Wallet" };
const categoryGroupToType = { Pemasukan: "income", Pengeluaran: "expense", "Kas Kecil": "petty_cash" };
const categoryTypeToGroup = { income: "Pemasukan", expense: "Pengeluaran", petty_cash: "Kas Kecil" };
const activeStatusToDb = { Aktif: "active", Nonaktif: "inactive" };
const activeStatusToUi = { active: "Aktif", inactive: "Nonaktif" };

function isReady() {
  return Boolean(isSupabaseConfigured && supabase);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function readyCompany(companyId) {
  return isReady() && isUuid(companyId);
}

function numberValue(value) {
  return Number(value || 0);
}

function mockProjectRows() {
  return mockRepository.loadInitialData().projects;
}

function mockAccountRows() {
  return mockRepository.loadInitialData().accounts;
}

function mockCategoryRows() {
  return mockRepository.loadInitialData().categories;
}

function projectToUi(row, spent = 0) {
  const budget = numberValue(row.budget);
  const progress = budget ? Math.min(100, Math.round((spent / budget) * 100)) : numberValue(row.progress);
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    manager: row.pic_name || row.manager || "-",
    budget,
    spent: numberValue(row.spent || spent),
    progress,
    status: projectStatusToUi[row.status] || row.status || "Aktif",
    insight: row.insight || (progress > 90 ? "Serapan anggaran tinggi, perlu tinjauan." : "Serapan anggaran masih dalam pemantauan."),
  };
}

function accountToUi(row) {
  return {
    id: row.id,
    name: row.name,
    balance: numberValue(row.current_balance ?? row.balance),
    openingBalance: numberValue(row.opening_balance ?? row.balance),
    type: accountTypeToUi[row.type] || row.type || "Bank",
    status: activeStatusToUi[row.status] || row.status || "Aktif",
    number: row.account_number || row.number || "-",
    owner: row.bank_name || row.owner || "PT Operasional Fiber Nusantara",
  };
}

function categoryToUi(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type || categoryGroupToType[row.group],
    group: row.group_name || row.group || categoryTypeToGroup[row.type] || "Pengeluaran",
    status: activeStatusToUi[row.status] || row.status || "Aktif",
  };
}

function normalizeProject(payload = {}, companyId = defaultCompanyId) {
  return {
    company_id: companyId,
    code: payload.code || `PRJ-${Date.now().toString().slice(-6)}`,
    name: payload.name,
    pic_name: payload.pic_name || payload.manager || null,
    budget: numberValue(payload.budget),
    status: projectStatusToDb[payload.status] || payload.status || "active",
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
  };
}

function normalizeAccount(payload = {}, companyId = defaultCompanyId) {
  const balance = numberValue(payload.current_balance ?? payload.balance);
  return {
    company_id: companyId,
    name: payload.name,
    bank_name: payload.bank_name || payload.owner || payload.name,
    account_number: payload.account_number || payload.number || null,
    type: accountTypeToDb[payload.type] || payload.type || "bank",
    opening_balance: numberValue(payload.opening_balance ?? payload.openingBalance ?? balance),
    current_balance: balance,
    status: activeStatusToDb[payload.status] || payload.status || "active",
  };
}

function normalizeCategory(payload = {}, companyId = defaultCompanyId) {
  const group = payload.group_name || payload.group || categoryTypeToGroup[payload.type] || "Pengeluaran";
  return {
    company_id: companyId,
    name: payload.name,
    type: payload.type || categoryGroupToType[group] || "expense",
    group_name: group,
    status: activeStatusToDb[payload.status] || payload.status || "active",
  };
}

async function logMaster(companyId, module, action, targetId, description) {
  await addActivityLog({ company_id: companyId, module, action, target_id: targetId, description });
}

export async function getProjects(companyId = defaultCompanyId) {
  if (!readyCompany(companyId)) return mockProjectRows();

  const { data, error } = await supabase.from("projects").select("*").eq("company_id", companyId).order("created_at", { ascending: true });
  if (error || !data?.length) return mockProjectRows();

  const { data: transactions } = await supabase.from("transactions").select("project_id, type, amount").eq("company_id", companyId);
  const spentMap = (transactions || []).reduce((acc, row) => {
    if (row.type === "expense" && row.project_id) acc[row.project_id] = (acc[row.project_id] || 0) + numberValue(row.amount);
    return acc;
  }, {});

  return data.map((row) => projectToUi(row, spentMap[row.id] || 0));
}

export async function createProject(payload, companyId = defaultCompanyId) {
  const normalized = normalizeProject(payload, companyId);
  if (!readyCompany(companyId)) return { data: normalized, uiProject: projectToUi({ ...normalized, id: `mock-project-${Date.now()}` }), isMock: true };

  const { data, error } = await supabase.from("projects").insert(normalized).select().single();
  if (error) return { data: normalized, uiProject: projectToUi(normalized), error, isMock: true };
  await logMaster(companyId, "Proyek", "Tambah proyek", data.id, data.name);
  return { data, uiProject: projectToUi(data), isMock: false };
}

export async function updateProject(id, payload, companyId = defaultCompanyId) {
  const normalized = normalizeProject(payload, companyId);
  if (!readyCompany(companyId) || !isUuid(id)) return { data: { id, ...normalized }, uiProject: projectToUi({ id, ...normalized, spent: payload.spent, progress: payload.progress, insight: payload.insight }), isMock: true };

  const { data, error } = await supabase.from("projects").update(normalized).eq("id", id).select().single();
  if (error) return { data: { id, ...normalized }, uiProject: projectToUi({ id, ...normalized }), error, isMock: true };
  await logMaster(companyId, "Proyek", "Ubah proyek", data.id, data.name);
  return { data, uiProject: projectToUi(data), isMock: false };
}

export async function deleteProject(id, companyId = defaultCompanyId) {
  if (!readyCompany(companyId) || !isUuid(id)) return { id, isMock: true };

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { id, error, isMock: true };
  await logMaster(companyId, "Proyek", "Hapus proyek", id, "Project dihapus");
  return { id, isMock: false };
}

export async function getAccounts(companyId = defaultCompanyId) {
  if (!readyCompany(companyId)) return mockAccountRows();

  const { data, error } = await supabase.from("accounts").select("*").eq("company_id", companyId).order("created_at", { ascending: true });
  if (error || !data?.length) return mockAccountRows();
  return data.map(accountToUi);
}

export async function createAccount(payload, companyId = defaultCompanyId) {
  const normalized = normalizeAccount(payload, companyId);
  if (!readyCompany(companyId)) return { data: normalized, uiAccount: accountToUi({ ...normalized, id: `mock-account-${Date.now()}` }), isMock: true };

  const { data, error } = await supabase.from("accounts").insert(normalized).select().single();
  if (error) return { data: normalized, uiAccount: accountToUi(normalized), error, isMock: true };
  await logMaster(companyId, "Rekening", "Tambah rekening", data.id, data.name);
  return { data, uiAccount: accountToUi(data), isMock: false };
}

export async function updateAccount(id, payload, companyId = defaultCompanyId) {
  const normalized = normalizeAccount(payload, companyId);
  if (!readyCompany(companyId) || !isUuid(id)) return { data: { id, ...normalized }, uiAccount: accountToUi({ id, ...normalized }), isMock: true };

  const { data, error } = await supabase.from("accounts").update(normalized).eq("id", id).select().single();
  if (error) return { data: { id, ...normalized }, uiAccount: accountToUi({ id, ...normalized }), error, isMock: true };
  await logMaster(companyId, "Rekening", "Ubah rekening", data.id, data.name);
  return { data, uiAccount: accountToUi(data), isMock: false };
}

export async function deleteAccount(id, companyId = defaultCompanyId) {
  if (!readyCompany(companyId) || !isUuid(id)) return { id, isMock: true };

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { id, error, isMock: true };
  await logMaster(companyId, "Rekening", "Hapus rekening", id, "Rekening dihapus");
  return { id, isMock: false };
}

export async function getCategories(companyId = defaultCompanyId) {
  if (!readyCompany(companyId)) return mockCategoryRows();

  const { data, error } = await supabase.from("categories").select("*").eq("company_id", companyId).order("created_at", { ascending: true });
  if (error || !data?.length) return mockCategoryRows();
  return data.map(categoryToUi);
}

export async function createCategory(payload, companyId = defaultCompanyId) {
  const normalized = normalizeCategory(payload, companyId);
  if (!readyCompany(companyId)) return { data: normalized, uiCategory: categoryToUi({ ...normalized, id: `mock-category-${Date.now()}` }), isMock: true };

  const { data, error } = await supabase.from("categories").insert(normalized).select().single();
  if (error) return { data: normalized, uiCategory: categoryToUi(normalized), error, isMock: true };
  await logMaster(companyId, "Kategori", "Tambah kategori", data.id, data.name);
  return { data, uiCategory: categoryToUi(data), isMock: false };
}

export async function updateCategory(id, payload, companyId = defaultCompanyId) {
  const normalized = normalizeCategory(payload, companyId);
  if (!readyCompany(companyId) || !isUuid(id)) return { data: { id, ...normalized }, uiCategory: categoryToUi({ id, ...normalized }), isMock: true };

  const { data, error } = await supabase.from("categories").update(normalized).eq("id", id).select().single();
  if (error) return { data: { id, ...normalized }, uiCategory: categoryToUi({ id, ...normalized }), error, isMock: true };
  await logMaster(companyId, "Kategori", "Ubah kategori", data.id, data.name);
  return { data, uiCategory: categoryToUi(data), isMock: false };
}

export async function deleteCategory(id, companyId = defaultCompanyId) {
  if (!readyCompany(companyId) || !isUuid(id)) return { id, isMock: true };

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { id, error, isMock: true };
  await logMaster(companyId, "Kategori", "Hapus kategori", id, "Kategori dihapus");
  return { id, isMock: false };
}

export async function getCategoriesByType(type, companyId = defaultCompanyId) {
  const rows = await getCategories(companyId);
  return rows.filter((item) => item.type === type || categoryGroupToType[item.group] === type);
}

export const masterDataService = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByType,
};
