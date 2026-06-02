import { mockRepository } from "../data/mockData.js";
import { defaultCompanyId, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

function isReady() {
  return Boolean(isSupabaseConfigured && supabase);
}

function formatLogTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toUiLog(row) {
  return {
    time: formatLogTime(row.created_at),
    user: row.user_name || "Sistem",
    module: row.module,
    action: row.action,
  };
}

function cleanUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")) ? value : null;
}

export async function getActivityLogs(companyId = defaultCompanyId) {
  if (!isReady()) return mockRepository.loadInitialData().logs;

  let query = supabase.from("activity_logs").select("*").order("created_at", { ascending: false });
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) return mockRepository.loadInitialData().logs;
  return (data || []).map(toUiLog);
}

export async function addActivityLog(payload = {}) {
  const row = {
    company_id: payload.company_id || defaultCompanyId || null,
    user_id: payload.user_id || null,
    module: payload.module || "Sistem",
    action: payload.action || "Aktivitas",
    target_id: cleanUuid(payload.target_id),
    description: payload.description || null,
    device_info: payload.device_info || "Web React",
    ip_address: payload.ip_address || null,
  };

  if (!isReady() || !row.company_id) return { data: row, isMock: true };

  const { data, error } = await supabase.from("activity_logs").insert(row).select().single();
  if (error) return { data: row, error, isMock: true };
  return { data, isMock: false };
}

export async function addAiActivityLog(action, payload = {}) {
  return addActivityLog({
    ...payload,
    module: "AI Assistant",
    action,
    description: payload.description || "AI usage event",
  });
}

export function exportActivityLogsMock(logs = mockRepository.loadInitialData().logs) {
  return ["time,user,module,action", ...logs.map((log) => `${log.time},${log.user},${log.module},${log.action}`)].join("\n");
}

export const activityLogService = {
  getActivityLogs,
  addActivityLog,
  addAiActivityLog,
  exportActivityLogsMock,
};
