import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {};

export const supabaseUrl = String(env.VITE_SUPABASE_URL || "").trim();
export const supabaseAnonKey = String(env.VITE_SUPABASE_ANON_KEY || "").trim();
export const defaultCompanyId = String(env.VITE_SUPABASE_COMPANY_ID || "").trim();

function getJwtRole(token) {
  const payload = token.split(".")[1];
  if (!payload || typeof globalThis.atob !== "function") return "";

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(globalThis.atob(padded)).role || "";
  } catch {
    return "";
  }
}

export const isSupabaseUrlValid = /^https:\/\/[^\s]+\.supabase\.co\/?$/.test(supabaseUrl);
export const isServiceRoleKey = getJwtRole(supabaseAnonKey) === "service_role";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && isSupabaseUrlValid && !isServiceRoleKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient() {
  return supabase;
}
