import { isServiceRoleKey, isSupabaseConfigured, isSupabaseUrlValid, supabase, supabaseAnonKey, supabaseUrl } from "../lib/supabaseClient.js";

const demoProfile = {
  id: "demo-user",
  auth_user_id: "demo-auth-user",
  company_id: "demo-company",
  name: "Admin Demo",
  email: "demo@dompet.local",
  role: "Super Admin",
  status: "active",
};

const demoUser = {
  id: demoProfile.auth_user_id,
  email: demoProfile.email,
  user_metadata: { name: demoProfile.name },
};

export function isSupabaseReady() {
  return Boolean(isSupabaseConfigured && supabase);
}

export function getAuthMode() {
  if (!supabaseUrl || !supabaseAnonKey) return "Demo/Mock";
  if (!isSupabaseUrlValid) return "Demo/Mock - URL Supabase tidak valid";
  if (isServiceRoleKey) return "Demo/Mock - service_role ditolak di frontend";
  return "Supabase Auth";
}

export async function getCurrentUser() {
  if (!isSupabaseReady()) return { user: null, profile: null, isDemo: false };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return { user: null, profile: null, isDemo: false };

  const profile = await getUserProfile(data.user);
  return { user: data.user, profile, isDemo: false };
}

export async function signInWithEmail(email, password) {
  if (!isSupabaseReady()) return { user: demoUser, profile: { ...demoProfile, email: email || demoProfile.email }, isDemo: true };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const profile = await getUserProfile(data.user);
  return { user: data.user, profile, isDemo: false };
}

export async function signOut() {
  if (!isSupabaseReady()) return { isDemo: true };
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { isDemo: false };
}

export function onAuthStateChange(callback) {
  if (!isSupabaseReady()) {
    return { data: { subscription: { unsubscribe() {} } } };
  }

  return supabase.auth.onAuthStateChange(async (event, session) => {
    const profile = session?.user ? await getUserProfile(session.user) : null;
    callback(event, { user: session?.user || null, profile, isDemo: false });
  });
}

export async function getUserProfile(user) {
  if (!isSupabaseReady()) return demoProfile;

  const currentUser = user || (await supabase.auth.getUser()).data?.user;
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from("users_profile")
    .select("*")
    .or(`auth_user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
    .maybeSingle();

  if (error) return null;
  return data;
}

export const authService = {
  getCurrentUser,
  signInWithEmail,
  signOut,
  onAuthStateChange,
  getUserProfile,
  isSupabaseReady,
  getAuthMode,
};
