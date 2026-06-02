import { defaultCompanyId, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { addActivityLog } from "./activityLogService.js";

function safeName(name = "file") {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

function mockUploadResult(bucket, file) {
  return {
    bucket,
    path: "",
    url: file && typeof globalThis.URL?.createObjectURL === "function" ? globalThis.URL.createObjectURL(file) : "",
    fileName: file?.name || "",
    isMock: true,
  };
}

function mockCompanyGuard(bucket, file) {
  return {
    ...mockUploadResult(bucket, file),
    message: "Profil perusahaan belum terhubung ke Supabase. File dipakai sebagai pratinjau lokal.",
  };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

export function isStorageReady() {
  return Boolean(isSupabaseConfigured && supabase);
}

export async function getPublicUrl(bucket, path) {
  if (!isStorageReady() || !bucket || !path) return "";

  const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (!signed.error && signed.data?.signedUrl) return signed.data.signedUrl;

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl.data?.publicUrl || "";
}

async function uploadToBucket(bucket, file, folder) {
  if (!file || !isStorageReady()) return mockUploadResult(bucket, file);

  const path = `${folder}/${Date.now()}-${safeName(file.name)}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) return { ...mockUploadResult(bucket, file), error, message: error.message || "Bucket belum siap" };

  const url = await getPublicUrl(bucket, data.path);
  return {
    bucket,
    path: data.path,
    url,
    fileName: file.name,
    isMock: false,
  };
}

export async function uploadTransactionProof(file, transactionId = "", companyId = defaultCompanyId) {
  if (isStorageReady() && isUuid(companyId) === false) return mockCompanyGuard("transaction-proofs", file);

  const folder = `${companyId || "mock-company"}/transactions${transactionId ? `/${transactionId}` : ""}`;
  const result = await uploadToBucket("transaction-proofs", file, folder);

  if (!result.isMock && isUuid(transactionId)) {
    const { error } = await supabase.from("transactions").update({ proof_url: result.url || result.path }).eq("id", transactionId);
    if (error) return { ...result, error, message: error.message || "Proof URL belum tersimpan ke transaksi" };
    await addActivityLog({ company_id: companyId, module: "Transaksi", action: "Upload bukti transaksi", target_id: transactionId, description: result.fileName });
  }

  return result;
}

export async function uploadCompanyLogo(file, companyId = defaultCompanyId) {
  if (isStorageReady() && isUuid(companyId) === false) return mockCompanyGuard("company-logos", file);

  const result = await uploadToBucket("company-logos", file, `${companyId || "mock-company"}/logos`);

  if (!result.isMock && isUuid(companyId)) {
    const { error } = await supabase.from("companies").update({ logo_url: result.url || result.path }).eq("id", companyId);
    if (error) return { ...result, error, message: error.message || "Logo belum tersimpan ke perusahaan" };
    await addActivityLog({ company_id: companyId, module: "Pengaturan", action: "Upload logo perusahaan", description: result.fileName });
  }

  return result;
}

export async function uploadBackupFile(file, companyId = defaultCompanyId) {
  if (isStorageReady() && isUuid(companyId) === false) return mockCompanyGuard("backups", file);

  const result = await uploadToBucket("backups", file, `${companyId || "mock-company"}/backups`);
  if (!result.isMock) await addActivityLog({ company_id: companyId, module: "Backup", action: "Upload backup", description: result.fileName });
  return result;
}

export function uploadTransactionProofMock(file) {
  return Promise.resolve(mockUploadResult("transaction-proofs", file));
}

export function uploadCompanyLogoMock(file) {
  return Promise.resolve(mockUploadResult("company-logos", file));
}

export const uploadService = {
  isStorageReady,
  getPublicUrl,
  uploadTransactionProofMock,
  uploadCompanyLogoMock,
  uploadTransactionProof,
  uploadCompanyLogo,
  uploadBackupFile,
};
