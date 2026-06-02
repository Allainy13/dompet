import { aiService } from "./aiService.js";

const env = import.meta.env || {};
const ocrMode = String(env.VITE_OCR_MODE || "mock").trim().toLowerCase();
const maxFileSize = 3 * 1024 * 1024;
const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const scanCache = new Map();

function fileKey(file) {
  return [file?.name || "file", file?.size || 0, file?.lastModified || 0].join(":");
}

function parseAmountFromText(text = "") {
  const normalized = String(text).replace(/\./g, "").replace(/,/g, ".");
  const candidates = [...normalized.matchAll(/(?:rp\s*)?(\d{4,}(?:\.\d+)?)/gi)].map((match) => Number(match[1]));
  return candidates.length ? Math.max(...candidates) : 0;
}

function normalizeDate(text = "") {
  const match = String(text).match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (!match) return new Date().toISOString().slice(0, 10);
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${month}-${day}`;
}

function clampConfidence(value) {
  const number = Number(value || 0);
  if (number > 1) return Math.min(1, number / 100);
  return Math.max(0, Math.min(1, number));
}

function normalizePaymentMethod(value = "") {
  const lower = String(value).toLowerCase();
  if (lower.includes("cash") || lower.includes("tunai")) return "cash";
  if (lower.includes("giro")) return "giro";
  if (lower.includes("wallet") || lower.includes("qris")) return "ewallet";
  return "transfer";
}

export function isOcrReady() {
  return ocrMode === "real" && aiService.isAiProxyReady();
}

export function validateOcrResult(result = {}) {
  const rawDate = String(result.date || "");
  const normalized = {
    date: /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : normalizeDate(rawDate),
    type: result.type === "income" ? "income" : "expense",
    title: String(result.title || "Transaksi dari hasil OCR").trim(),
    vendor_or_source: String(result.vendor_or_source || result.vendor || result.source || "Belum terbaca").trim(),
    category: String(result.category || result.category_hint || "Operasional").trim(),
    amount: Number(result.amount || 0),
    tax_amount: Number(result.tax_amount || 0),
    payment_method: normalizePaymentMethod(result.payment_method),
    note: String(result.note || "Hasil OCR perlu dicek manual.").trim(),
    confidence: clampConfidence(result.confidence || 0.72),
  };

  if (!normalized.amount || normalized.amount < 0) normalized.amount = 0;
  if (normalized.tax_amount < 0) normalized.tax_amount = 0;
  return normalized;
}

export function extractTransactionFromOcrText(text = "") {
  const lower = String(text).toLowerCase();
  const isIncome = lower.includes("diterima") || lower.includes("transfer masuk") || lower.includes("termin") || lower.includes("payment received");
  const amount = parseAmountFromText(text);

  return validateOcrResult({
    date: normalizeDate(text),
    type: isIncome ? "income" : "expense",
    title: isIncome ? "Bukti transfer pemasukan" : "Pembayaran dari nota OCR",
    vendor_or_source: isIncome ? "Klien dari bukti transfer" : "Vendor dari nota",
    category: isIncome ? "Termin Proyek" : lower.includes("bbm") || lower.includes("parkir") ? "Kas Kecil" : "Infrastruktur",
    amount,
    tax_amount: lower.includes("ppn") ? Math.round(amount * 0.11) : 0,
    payment_method: lower.includes("tunai") ? "cash" : "transfer",
    note: "Diekstrak dari teks OCR. Validasi ulang nominal dan vendor.",
    confidence: amount ? 0.78 : 0.55,
  });
}

export async function mockScanReceipt(file) {
  const name = String(file?.name || "nota-demo").toLowerCase();
  const isIncome = name.includes("transfer") || name.includes("termin") || name.includes("pemasukan") || name.includes("income");
  const amountFromName = parseAmountFromText(name);
  const amount = amountFromName || (isIncome ? 485000000 : 12500000);

  return validateOcrResult({
    date: new Date().toISOString().slice(0, 10),
    type: isIncome ? "income" : "expense",
    title: isIncome ? "Bukti transfer termin proyek" : "Pembayaran vendor dari nota",
    vendor_or_source: isIncome ? "Klien Enterprise Fiber" : "Vendor Kabel FO",
    category: isIncome ? "Termin Proyek" : name.includes("bbm") ? "Kas Kecil" : "Infrastruktur",
    amount,
    tax_amount: isIncome ? 0 : Math.round(amount * 0.11),
    payment_method: "transfer",
    note: `OCR mock dari file ${file?.name || "demo"}. Periksa ulang sebelum simpan.`,
    confidence: 0.82,
  });
}

export async function scanReceiptImage(file) {
  if (!file) throw new Error("Pilih file nota terlebih dahulu");
  if (file.size > maxFileSize) throw new Error("Ukuran file terlalu besar. Maksimal 3 MB agar OCR tetap hemat.");
  if (file.type && !supportedTypes.includes(file.type)) throw new Error("Format file belum didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF.");

  const key = fileKey(file);
  if (scanCache.has(key)) return { ...scanCache.get(key), cached: true };

  const fallback = await mockScanReceipt(file);
  if (!isOcrReady()) {
    const usage = aiService.estimateAiCost("scan_receipt", { fileName: file.name, fileSize: file.size });
    aiService.addAiUsage("scan_receipt", usage.estimated_tokens, 0, { mode: "mock" });
    scanCache.set(key, fallback);
    return fallback;
  }

  const response = await aiService.runAiTask("scan_receipt", {
    prompt: "Scan nota atau bukti transfer ini dan ekstrak field transaksi wajib.",
    payload: {
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
      expected_output: ["date", "type", "title", "vendor_or_source", "category", "amount", "tax_amount", "payment_method", "note", "confidence"],
      note: "Tahap ini tidak mengirim API key ke frontend. Jika provider vision belum aktif, frontend fallback ke mock.",
    },
  }, { forceReal: true });

  const result = response?.ok ? validateOcrResult(response.result) : fallback;
  const output = response?.warning ? { ...result, warning: response.warning } : result;
  scanCache.set(key, output);
  return output;
}

export const ocrService = {
  isOcrReady,
  scanReceiptImage,
  extractTransactionFromOcrText,
  mockScanReceipt,
  validateOcrResult,
};
