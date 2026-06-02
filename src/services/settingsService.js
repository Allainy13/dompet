import { initialSettings, mockRepository } from "../data/mockData.js";
import { defaultCompanyId, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { uploadCompanyLogo } from "./uploadService.js";

function companyToSettings(company) {
  if (!company) return initialSettings;
  return {
    appName: company.app_name || initialSettings.appName,
    tagline: company.tagline || initialSettings.tagline,
    companyName: company.name || initialSettings.companyName,
    logo: company.logo_url || "",
    primary: company.primary_color || initialSettings.primary,
    theme: company.theme_mode || initialSettings.theme,
  };
}

function settingsToCompany(settings) {
  return {
    app_name: settings.appName,
    tagline: settings.tagline,
    name: settings.companyName,
    logo_url: settings.logo || null,
    primary_color: settings.primary,
    theme_mode: settings.theme,
  };
}

export async function loadSettings(companyId = defaultCompanyId) {
  if (!isSupabaseConfigured || !supabase || !companyId) return initialSettings;

  const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
  if (error || !data) return initialSettings;
  return companyToSettings(data);
}

export async function saveSettings(settings, companyId = defaultCompanyId) {
  if (!isSupabaseConfigured || !supabase || !companyId) return { data: settings, isMock: true };

  const { data, error } = await supabase
    .from("companies")
    .update(settingsToCompany(settings))
    .eq("id", companyId)
    .select()
    .single();

  if (error) return { data: settings, error, isMock: true };
  return { data: companyToSettings(data), isMock: false };
}

export async function updateCompanySettings(payload, companyId = defaultCompanyId) {
  const result = await saveSettings(payload, companyId);
  if (!result.isMock) {
    await createActivityLog({ company_id: companyId, module: "Pengaturan", action: "Update identitas perusahaan", description: payload.companyName || payload.appName });
  }
  return result;
}

export async function updateCompanyLogo(file, companyId = defaultCompanyId) {
  const upload = await uploadCompanyLogo(file, companyId);
  if (upload.error) return { data: { logo: upload.url || "" }, error: upload.error, isMock: true, message: upload.message };
  return { data: { logo: upload.url || upload.path || "" }, upload, isMock: upload.isMock };
}

export async function listActivityLogs(companyId = defaultCompanyId) {
  if (!isSupabaseConfigured || !supabase) return mockRepository.loadInitialData().logs;

  let query = supabase.from("activity_logs").select("*").order("created_at", { ascending: false });
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) return mockRepository.loadInitialData().logs;
  return data || [];
}

export async function createActivityLog(payload) {
  if (!isSupabaseConfigured || !supabase) return { data: payload, isMock: true };

  const { data, error } = await supabase.from("activity_logs").insert(payload).select().single();
  if (error) return { data: payload, error, isMock: true };
  return { data, isMock: false };
}

export async function createBackupRecord(payload) {
  if (!isSupabaseConfigured || !supabase) return { data: payload, isMock: true };

  const { data, error } = await supabase.from("backups").insert(payload).select().single();
  if (error) return { data: payload, error, isMock: true };
  return { data, isMock: false };
}

export function getCompanySettings(companyId = defaultCompanyId) {
  return loadSettings(companyId);
}

export function updateCompanySettingsMock(settings) {
  return {
    data: { ...settings },
    isMock: true,
    message: "Pengaturan contoh siap diterapkan ke state lokal.",
  };
}

export function exportBackupMock(data = mockRepository.loadInitialData()) {
  return {
    fileName: "dompet-pt-ai-backup-mock.json",
    contentType: "application/json",
    content: JSON.stringify(data, null, 2),
    isMock: true,
  };
}

export async function previewRestoreMock(fileOrPayload = {}) {
  let payload = fileOrPayload;
  if (fileOrPayload && typeof fileOrPayload.text === "function") {
    const text = await fileOrPayload.text();
    payload = JSON.parse(text);
  }

  return {
    appName: payload.appName || payload.settings?.appName || "DOMPET PT AI Dipulihkan",
    transactions: payload.transactions?.length || 0,
    logs: payload.logs?.length || 0,
    isMock: true,
  };
}

export async function restoreBackupMock(fileOrPayload = {}) {
  const preview = await previewRestoreMock(fileOrPayload);
  return {
    ...preview,
    message: "Restore masih simulasi. Data tidak ditulis ke Supabase.",
    isMock: true,
  };
}

export const settingsService = {
  getCompanySettings,
  updateCompanySettings,
  updateCompanyLogo,
  updateCompanySettingsMock,
  exportBackupMock,
  previewRestoreMock,
  restoreBackupMock,
  loadSettings,
  saveSettings,
  listActivityLogs,
  createActivityLog,
  createBackupRecord,
};
