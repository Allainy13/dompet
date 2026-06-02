import { createAiResponse, currency, mockRepository } from "../data/mockData.js";
import { isServiceRoleKey, supabaseAnonKey } from "../lib/supabaseClient.js";
import { reportService } from "./reportService.js";

const env = import.meta.env || {};

const aiProxyUrl = String(env.VITE_AI_PROXY_URL || "").trim();
const aiEnvMode = String(env.VITE_AI_MODE || "mock").trim().toLowerCase();
const aiMonthlyBudget = Number(env.VITE_AI_MONTHLY_BUDGET || 10);
const aiReportCache = new Map();
const aiUsageStorageKey = "dompet-pt-ai-usage-v1";

const supportedTasks = new Set([
  "parse_transaction",
  "suggest_category",
  "detect_duplicate",
  "analyze_budget",
  "summarize_report",
  "generate_whatsapp_report",
  "scan_receipt",
  "extract_receipt_fields",
  "chat_finance",
]);

function isProxyUrlValid(url = aiProxyUrl) {
  return /^https?:\/\//i.test(url);
}

export function isAiProxyReady() {
  return Boolean(aiProxyUrl && isProxyUrlValid(aiProxyUrl));
}

export function getDefaultAiMode() {
  return isAiProxyReady() && aiEnvMode !== "mock" ? "real" : "mock";
}

export function getAiRuntimeInfo(selectedMode = getDefaultAiMode()) {
  const canUseReal = isAiProxyReady();
  const mode = selectedMode === "real" && canUseReal ? "real" : "mock";
  const budgetStatus = getAiBudgetStatus();
  return {
    mode,
    modeLabel: mode === "real" ? "Mode Real" : "Mode Demo",
    canUseReal,
    proxyConfigured: Boolean(aiProxyUrl),
    defaultMode: getDefaultAiMode(),
    monthlyBudget: aiMonthlyBudget,
    budgetLabel: `$${aiMonthlyBudget}/bulan`,
    usage: budgetStatus,
    warning: canUseReal ? "" : "AI proxy belum dikonfigurasi, memakai mock lokal.",
  };
}

function shouldUseProxy(options = {}) {
  if (options.forceMock) return false;
  if (options.forceReal) return isAiProxyReady();
  return isAiProxyReady() && aiEnvMode !== "mock";
}

function estimateTokens(prompt = "", payload = {}) {
  return Math.ceil((String(prompt).length + JSON.stringify(payload).length) / 4);
}

function estimateCost(tokens) {
  return Number(((tokens / 1_000_000) * 0.5).toFixed(6));
}

function currentUsageMonth() {
  return new Date().toISOString().slice(0, 7);
}

function canUseStorage() {
  return typeof globalThis.localStorage !== "undefined";
}

function defaultAiUsage() {
  return {
    month: currentUsageMonth(),
    budget: aiMonthlyBudget,
    totalTokens: 0,
    totalCost: 2.65,
    requestCount: 0,
    blockedCount: 0,
    history: [],
  };
}

function normalizeUsage(raw) {
  const base = defaultAiUsage();
  if (!raw || raw.month !== base.month) return base;
  return {
    ...base,
    ...raw,
    budget: aiMonthlyBudget,
    totalTokens: Number(raw.totalTokens || 0),
    totalCost: Number(raw.totalCost || 0),
    requestCount: Number(raw.requestCount || 0),
    blockedCount: Number(raw.blockedCount || 0),
    history: Array.isArray(raw.history) ? raw.history.slice(0, 20) : [],
  };
}

function saveAiUsage(usage) {
  if (!canUseStorage()) return usage;
  try {
    globalThis.localStorage.setItem(aiUsageStorageKey, JSON.stringify(usage));
  } catch {
    return usage;
  }
  return usage;
}

export function getAiUsage() {
  if (!canUseStorage()) return defaultAiUsage();
  try {
    return normalizeUsage(JSON.parse(globalThis.localStorage.getItem(aiUsageStorageKey) || "null"));
  } catch {
    return defaultAiUsage();
  }
}

export function estimateAiCost(task = "chat_finance", payload = {}) {
  const baseTokens = estimateTokens(task, payload);
  const taskMinimums = {
    parse_transaction: { tokens: 750, cost: 0.03 },
    suggest_category: { tokens: 500, cost: 0.02 },
    detect_duplicate: { tokens: 900, cost: 0.04 },
    analyze_budget: { tokens: 900, cost: 0.04 },
    summarize_report: { tokens: 1800, cost: 0.12 },
    generate_whatsapp_report: { tokens: 1000, cost: 0.06 },
    scan_receipt: { tokens: 1400, cost: 0.08 },
    extract_receipt_fields: { tokens: 1000, cost: 0.05 },
    chat_finance: { tokens: 650, cost: 0.02 },
  };
  const minimum = taskMinimums[task] || taskMinimums.chat_finance;
  const estimatedTokens = Math.max(baseTokens, minimum.tokens);
  const estimatedCost = Math.max(estimateCost(estimatedTokens), minimum.cost);
  return {
    estimated_tokens: estimatedTokens,
    estimated_cost: Number(estimatedCost.toFixed(4)),
  };
}

export function getAiBudgetStatus() {
  const usage = getAiUsage();
  const percent = usage.budget ? Math.round((usage.totalCost / usage.budget) * 100) : 0;
  const remaining = Math.max(0, usage.budget - usage.totalCost);
  const status = percent >= 100 ? "blocked" : percent >= 90 ? "danger" : percent >= 70 ? "warning" : "safe";
  const message = status === "blocked"
    ? "Budget AI bulan ini sudah habis. Mode real dialihkan ke mock/local."
    : status === "danger"
      ? "Pemakaian AI sudah melewati 90%. Gunakan mode hemat."
      : status === "warning"
        ? "Pemakaian AI sudah melewati 70%. Prioritaskan request penting."
        : "Pemakaian AI masih aman.";
  return { ...usage, percent, remaining, status, message };
}

export function canRunAiTask(task = "chat_finance", payload = {}) {
  const estimate = estimateAiCost(task, payload);
  const budget = getAiBudgetStatus();
  const canRunReal = budget.totalCost + estimate.estimated_cost <= budget.budget;
  return {
    canRun: canRunReal,
    canRunReal,
    fallbackMode: canRunReal ? "real" : "mock",
    estimate,
    budget,
    message: canRunReal ? "AI real boleh dijalankan." : "Budget AI habis. Gunakan mode mock/local.",
  };
}

export function addAiUsage(task = "chat_finance", estimatedTokens = 0, estimatedCost = 0, meta = {}) {
  const current = getAiUsage();
  const cost = Math.max(0, Number(estimatedCost || 0));
  const tokens = Math.max(0, Number(estimatedTokens || 0));
  const next = {
    ...current,
    totalTokens: current.totalTokens + tokens,
    totalCost: Number((current.totalCost + cost).toFixed(4)),
    requestCount: current.requestCount + (meta.blocked ? 0 : 1),
    blockedCount: current.blockedCount + (meta.blocked ? 1 : 0),
    history: [
      {
        task,
        mode: meta.mode || "mock",
        estimatedTokens: tokens,
        estimatedCost: cost,
        status: meta.blocked ? "blocked" : meta.status || "ok",
        message: meta.message || "",
        time: new Date().toISOString(),
      },
      ...current.history,
    ].slice(0, 20),
  };
  return saveAiUsage(next);
}

export function resetMonthlyUsageMock() {
  const next = { ...defaultAiUsage(), totalCost: 0, requestCount: 0, history: [] };
  return saveAiUsage(next);
}

function buildUsage(prompt, payload) {
  const estimatedTokens = estimateTokens(prompt, payload);
  return {
    estimated_tokens: estimatedTokens,
    estimated_cost: estimateCost(estimatedTokens),
  };
}

function compactPayload(payload) {
  const text = JSON.stringify(payload ?? {});
  if (text.length <= 12000) return payload ?? {};
  return {
    note: "Payload frontend dipangkas agar budget AI tetap hemat.",
    preview: text.slice(0, 12000),
  };
}

function aiProxyHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (supabaseAnonKey && !isServiceRoleKey) headers.Authorization = `Bearer ${supabaseAnonKey}`;
  return headers;
}

function normalizeTask(task) {
  return supportedTasks.has(task) ? task : "chat_finance";
}

function parseAmountFromText(text = "") {
  const lower = text.toLowerCase();
  const number = Number((lower.match(/\d+(?:[.,]\d+)?/) || [0])[0].replace(",", "."));
  if (!number) return 0;
  if (lower.includes("miliar") || lower.includes("milyar")) return number * 1000000000;
  if (lower.includes("juta") || lower.includes("jt")) return number * 1000000;
  if (lower.includes("ribu") || lower.includes("rb")) return number * 1000;
  return number;
}

const monthIndex = {
  Jan: 0,
  Feb: 1,
  Apr: 3,
  Mar: 2,
  Mei: 4,
  Jun: 5,
  Jul: 6,
  Agu: 7,
  Sep: 8,
  Okt: 9,
  Nov: 10,
  Des: 11,
};

function numberValue(value) {
  return Number(value || 0);
}

function percentValue(value, total) {
  return total ? Math.round((numberValue(value) / numberValue(total)) * 100) : 0;
}

function topByAmount(rows = [], limit = 3) {
  return rows.slice().sort((a, b) => numberValue(b.amount) - numberValue(a.amount)).slice(0, limit);
}

function groupAmounts(rows = [], key) {
  return rows.reduce((acc, item) => {
    const name = item[key] || "Lainnya";
    acc[name] = (acc[name] || 0) + numberValue(item.amount);
    return acc;
  }, {});
}

function mapTopGroups(grouped = {}, limit = 3) {
  return Object.entries(grouped)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function buildFinanceSnapshot(data = mockRepository.loadInitialData()) {
  const transactions = data.transactions || [];
  const incomeRows = transactions.filter((item) => item.type === "income");
  const expenseRows = transactions.filter((item) => item.type === "expense");
  const income = incomeRows.reduce((total, item) => total + numberValue(item.amount), 0);
  const expense = expenseRows.reduce((total, item) => total + numberValue(item.amount), 0);
  const pettyCashBalance = (data.accounts || []).find((item) => item.type === "Kas Kecil")?.balance || 0;
  const pettyCashSpend = (data.pettyCash || []).filter((item) => item.type !== "Isi Kas").reduce((total, item) => total + numberValue(item.amount), 0);
  const debts = (data.debts || []).filter((item) => item.kind === "Hutang" && item.status !== "Lunas");
  const receivables = (data.debts || []).filter((item) => item.kind === "Piutang" && item.status !== "Lunas");
  const projectRisks = (data.projects || []).map((project) => ({
    name: project.name,
    budget: numberValue(project.budget),
    spent: numberValue(project.spent),
    progress: numberValue(project.progress || percentValue(project.spent, project.budget)),
    status: project.status,
  })).filter((project) => project.progress >= 80 || project.status === "Hold").sort((a, b) => b.progress - a.progress);
  const duplicateCandidates = transactions
    .map((item) => ({ item, duplicate: checkDuplicateBeforeSave(item, transactions.filter((candidate) => candidate.id !== item.id)) }))
    .filter(({ item, duplicate }) => duplicate.risk !== "low" || numberValue(item.amount) >= 100000000 || ["Pending", "Rejected"].includes(item.status))
    .slice(0, 5);

  return {
    income,
    expense,
    net: income - expense,
    transactionCount: transactions.length,
    pendingTransactions: transactions.filter((item) => item.status === "Pending").length,
    pendingApprovals: (data.approvals || []).filter((item) => item.status === "Pending").length,
    urgentApprovals: (data.approvals || []).filter((item) => item.urgent).length,
    topIncome: topByAmount(incomeRows),
    topExpenses: topByAmount(expenseRows),
    expenseByCategory: mapTopGroups(groupAmounts(expenseRows, "category"), 5),
    incomeByCategory: mapTopGroups(groupAmounts(incomeRows, "category"), 5),
    pettyCashBalance,
    pettyCashSpend,
    debtsDueAmount: debts.reduce((total, item) => total + Math.max(0, numberValue(item.amount) - numberValue(item.paid)), 0),
    debtsDueCount: debts.length,
    receivablesDueAmount: receivables.reduce((total, item) => total + Math.max(0, numberValue(item.amount) - numberValue(item.paid)), 0),
    receivablesDueCount: receivables.length,
    projectRisks,
    duplicateCandidates,
  };
}

function makeCacheKey(kind, data, filters = {}) {
  const fingerprint = [
    kind,
    (data.transactions || []).length,
    (data.projects || []).length,
    (data.debts || []).length,
    JSON.stringify(filters),
  ].join(":");
  return fingerprint;
}

function localReport(kind, title, data = mockRepository.loadInitialData(), filters = {}) {
  const snapshot = buildFinanceSnapshot(data);
  const audienceNotes = {
    owner: "Fokus owner: angka utama, masalah penting, dan tindakan cepat.",
    manager: "Fokus manager: project, budget, approval pending, dan risiko pengeluaran.",
    finance: "Fokus finance: detail pemasukan/pengeluaran, kategori, pending, hutang/piutang, dan kas kecil.",
    daily: "Ringkasan harian untuk keputusan operasional cepat.",
    weekly: "Ringkasan mingguan untuk evaluasi pola pengeluaran dan cashflow.",
    monthly: "Ringkasan bulanan untuk review manajemen.",
  };
  const issues = [];
  if (snapshot.expenseByCategory[0]) issues.push(`Pengeluaran terbesar: ${snapshot.expenseByCategory[0].name} senilai ${currency(snapshot.expenseByCategory[0].amount)}.`);
  if (snapshot.pettyCashBalance < 20000000) issues.push(`Kas kecil rendah: ${currency(snapshot.pettyCashBalance)}.`);
  if (snapshot.debtsDueCount) issues.push(`${snapshot.debtsDueCount} hutang perlu dipantau senilai ${currency(snapshot.debtsDueAmount)}.`);
  if (snapshot.receivablesDueCount) issues.push(`${snapshot.receivablesDueCount} piutang perlu ditagih senilai ${currency(snapshot.receivablesDueAmount)}.`);
  if (snapshot.projectRisks[0]) issues.push(`Project ${snapshot.projectRisks[0].name} sudah ${snapshot.projectRisks[0].progress}% budget/progress.`);
  if (snapshot.duplicateCandidates.length) issues.push(`${snapshot.duplicateCandidates.length} transaksi perlu dicek karena nominal besar, pending, atau mirip transaksi lain.`);

  const recommendations = suggestFinanceActions(data).map((item) => item.text);
  const text = [
    title,
    `Periode: ${filters.startDate || "aktif"} s/d ${filters.endDate || "aktif"}`,
    `Pemasukan: ${currency(snapshot.income)}`,
    `Pengeluaran: ${currency(snapshot.expense)}`,
    `Saldo bersih: ${currency(snapshot.net)}`,
    audienceNotes[kind] || "Ringkasan finance otomatis.",
    "Masalah penting:",
    ...(issues.length ? issues.map((item) => `- ${item}`) : ["- Tidak ada masalah penting dari data aktif."]),
    "Rekomendasi:",
    ...recommendations.slice(0, 4).map((item) => `- ${item}`),
  ].join("\n");

  return {
    kind,
    title,
    summary: snapshot,
    issues,
    recommendations,
    text,
    mode: "mock",
    generatedAt: new Date().toISOString(),
  };
}

function parseTransactionDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return new Date(`${text.slice(0, 10)}T00:00:00`);
  const [day, month, year] = text.split(/\s+/);
  if (!day || monthIndex[month] === undefined || !year) return null;
  return new Date(Number(year), monthIndex[month], Number(day));
}

function dateDistanceDays(a, b) {
  const first = parseTransactionDate(a);
  const second = parseTransactionDate(b);
  if (!first || !second) return 99;
  return Math.abs(first.getTime() - second.getTime()) / 86400000;
}

function normalizeText(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function textTokens(value = "") {
  return new Set(normalizeText(value).split(" ").filter((token) => token.length > 2));
}

function textSimilarity(a = "", b = "") {
  const left = textTokens(a);
  const right = textTokens(b);
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function pickTransactionText(transaction = {}) {
  return transaction.title || transaction.desc || transaction.note || transaction.description || "";
}

function pickVendor(transaction = {}) {
  return transaction.vendor_or_source || transaction.vendor || transaction.source || transaction.desc || "";
}

function pickProject(transaction = {}) {
  return transaction.project_name || transaction.project || transaction.project_id || "";
}

function pickCategory(transaction = {}) {
  return transaction.category_name || transaction.category || transaction.category_id || transaction.ai_category || "";
}

function pickProof(transaction = {}) {
  return transaction.proof_url || transaction.proof || "";
}

export function getDuplicateScore(transactionA = {}, transactionB = {}) {
  if (!transactionA || !transactionB) return 0;
  const amountA = numberValue(transactionA.amount);
  const amountB = numberValue(transactionB.amount);
  const amountDiff = Math.abs(amountA - amountB);
  const amountBase = Math.max(amountA, amountB, 1);
  const amountRatio = amountDiff / amountBase;
  const dateGap = dateDistanceDays(transactionA.date, transactionB.date);
  const vendorSimilarity = textSimilarity(pickVendor(transactionA), pickVendor(transactionB));
  const descSimilarity = textSimilarity(pickTransactionText(transactionA), pickTransactionText(transactionB));
  const sameCategory = normalizeText(pickCategory(transactionA)) && normalizeText(pickCategory(transactionA)) === normalizeText(pickCategory(transactionB));
  const sameProject = normalizeText(pickProject(transactionA)) && normalizeText(pickProject(transactionA)) === normalizeText(pickProject(transactionB));
  const sameProof = pickProof(transactionA) && pickProof(transactionA) === pickProof(transactionB);

  let score = 0;
  if (amountA && amountB) {
    if (amountRatio === 0) score += 32;
    else if (amountRatio <= 0.03) score += 26;
    else if (amountRatio <= 0.08) score += 16;
  }
  if (dateGap === 0) score += 18;
  else if (dateGap <= 1) score += 14;
  else if (dateGap <= 3) score += 10;
  score += Math.round(vendorSimilarity * 18);
  score += Math.round(descSimilarity * 14);
  if (sameCategory) score += 8;
  if (sameProject) score += 7;
  if (sameProof) score += 20;
  return Math.max(0, Math.min(100, score));
}

export function findDuplicateTransactions(transaction = {}, existingTransactions = []) {
  return existingTransactions
    .filter((item) => item && item.id !== transaction.id)
    .map((item) => ({
      ...item,
      duplicateScore: getDuplicateScore(transaction, item),
    }))
    .filter((item) => item.duplicateScore >= 45)
    .sort((a, b) => b.duplicateScore - a.duplicateScore)
    .slice(0, 5);
}

export function explainDuplicateRisk(matches = []) {
  if (!matches.length) return "Tidak ada transaksi mirip yang kuat pada data aktif.";
  const top = matches[0];
  return `Transaksi ini mirip dengan ${top.id || "transaksi lama"} tanggal ${top.date || "-"} nominal ${currency(top.amount || 0)}. Skor kemiripan ${top.duplicateScore}/100.`;
}

export function checkDuplicateBeforeSave(transaction = {}, existingTransactions = []) {
  const source = existingTransactions.length ? existingTransactions : mockRepository.loadInitialData().transactions;
  const matches = findDuplicateTransactions(transaction, source);
  const score = matches[0]?.duplicateScore || 0;
  const risk = score >= 78 ? "high" : score >= 58 ? "medium" : "low";
  return {
    risk,
    score,
    matches,
    message: explainDuplicateRisk(matches),
  };
}

function findProject(projectId, projects = []) {
  const normalized = normalizeText(projectId);
  return projects.find((item) => normalizeText(item.id) === normalized || normalizeText(item.name) === normalized || normalizeText(item.name).includes(normalized)) || null;
}

export function getProjectBudgetUsage(projectId, data = mockRepository.loadInitialData()) {
  const project = findProject(projectId, data.projects || []);
  if (!project) {
    return { project: null, budget: 0, used: 0, remaining: 0, usagePercent: 0 };
  }
  const projectKey = normalizeText(project.id || project.name);
  const projectName = normalizeText(project.name);
  const transactionSpent = (data.transactions || [])
    .filter((item) => item.type === "expense")
    .filter((item) => normalizeText(item.project_id || item.project) === projectKey || normalizeText(item.project_name || item.project).includes(projectName))
    .reduce((total, item) => total + numberValue(item.amount), 0);
  const used = Math.max(numberValue(project.spent), transactionSpent);
  const budget = numberValue(project.budget);
  return {
    project,
    budget,
    used,
    remaining: Math.max(0, budget - used),
    usagePercent: budget ? Math.round((used / budget) * 100) : 0,
  };
}

export function explainBudgetRisk(projectOrUsage, newAmount = 0) {
  const usage = projectOrUsage?.project ? projectOrUsage : { project: projectOrUsage, budget: numberValue(projectOrUsage?.budget), used: numberValue(projectOrUsage?.spent) };
  const afterTransaction = numberValue(usage.used) + numberValue(newAmount);
  const usagePercent = usage.budget ? Math.round((afterTransaction / usage.budget) * 100) : 0;
  const projectName = usage.project?.name || "proyek";
  if (!usage.project) return "Project belum dipilih atau budget belum tersedia.";
  if (usagePercent > 100) return `Transaksi ini membuat anggaran ${projectName} melewati batas menjadi ${usagePercent}%.`;
  if (usagePercent >= 80) return `Anggaran ${projectName} masuk zona perlu cek: estimasi terpakai ${usagePercent}%.`;
  return `Anggaran ${projectName} masih aman: estimasi terpakai ${usagePercent}%.`;
}

export function analyzeProjectBudget(projectId, newAmount = 0, data = mockRepository.loadInitialData()) {
  const usage = getProjectBudgetUsage(projectId, data);
  const afterTransaction = numberValue(usage.used) + numberValue(newAmount);
  const usagePercent = usage.budget ? Math.round((afterTransaction / usage.budget) * 100) : 0;
  const status = usagePercent > 100 ? "Melebihi Anggaran" : usagePercent >= 80 ? "Perlu Cek" : "Aman";
  return {
    status,
    budget: usage.budget,
    used: usage.used,
    remaining: Math.max(0, usage.budget - afterTransaction),
    afterTransaction,
    usagePercent,
    project: usage.project,
    message: explainBudgetRisk(usage, newAmount),
  };
}

export function detectSpendingAnomalies(data = mockRepository.loadInitialData()) {
  const snapshot = buildFinanceSnapshot(data);
  const anomalies = [];
  const topExpense = snapshot.expenseByCategory[0];
  if (topExpense && topExpense.amount >= snapshot.expense * 0.35) {
    anomalies.push({
      level: "warning",
      title: "Pengeluaran Terkonsentrasi",
      text: `${topExpense.name} menyerap ${percentValue(topExpense.amount, snapshot.expense)}% total pengeluaran. Cek vendor dan bukti sebelum approval.`,
    });
  }
  snapshot.topExpenses.filter((item) => numberValue(item.amount) >= 100000000).forEach((item) => {
    anomalies.push({
      level: "warning",
      title: "Nominal Besar",
      text: `${item.id || "Transaksi"} ${item.desc || item.title} bernilai ${currency(item.amount)} dan perlu review approval.`,
    });
  });
  snapshot.duplicateCandidates.slice(0, 2).forEach(({ item, duplicate }) => {
    anomalies.push({
      level: duplicate.risk === "high" ? "danger" : "warning",
      title: "Potensi Duplikat",
      text: `${item.id || "Transaksi"} punya skor duplikat ${duplicate.score}/100. ${duplicate.message}`,
    });
  });
  return anomalies.length ? anomalies : [{ level: "success", title: "Tidak Ada Anomali Kuat", text: "Data aktif belum menunjukkan pola pengeluaran mencurigakan." }];
}

export function suggestFinanceActions(data = mockRepository.loadInitialData()) {
  const snapshot = buildFinanceSnapshot(data);
  const actions = [];
  if (snapshot.pendingApprovals) actions.push({ priority: "high", text: `Tinjau ${snapshot.pendingApprovals} approval menunggu agar cashflow tidak tertahan.` });
  if (snapshot.pettyCashBalance < 20000000) actions.push({ priority: "medium", text: `Top up atau batasi pemakaian kas kecil. Saldo saat ini ${currency(snapshot.pettyCashBalance)}.` });
  if (snapshot.debtsDueCount) actions.push({ priority: "high", text: `Siapkan pembayaran ${snapshot.debtsDueCount} hutang jatuh tempo senilai ${currency(snapshot.debtsDueAmount)}.` });
  if (snapshot.receivablesDueCount) actions.push({ priority: "high", text: `Follow up ${snapshot.receivablesDueCount} piutang jatuh tempo senilai ${currency(snapshot.receivablesDueAmount)}.` });
  if (snapshot.projectRisks[0]) actions.push({ priority: "medium", text: `Review budget project ${snapshot.projectRisks[0].name}; progress/serapan ${snapshot.projectRisks[0].progress}%.` });
  if (snapshot.duplicateCandidates.length) actions.push({ priority: "medium", text: `Cek ${snapshot.duplicateCandidates.length} transaksi mencurigakan sebelum proses bayar/approve.` });
  if (!actions.length) actions.push({ priority: "low", text: "Pertahankan ritme approval dan pantau transaksi besar harian." });
  return actions;
}

export function explainCashflowTrend(data = mockRepository.loadInitialData()) {
  const snapshot = buildFinanceSnapshot(data);
  if (snapshot.net < 0) return `Cashflow negatif ${currency(snapshot.net)}. Tahan pengeluaran non-prioritas dan percepat penagihan piutang.`;
  if (snapshot.expense > snapshot.income * 0.8) return `Cashflow positif, tetapi pengeluaran sudah ${percentValue(snapshot.expense, snapshot.income)}% dari pemasukan. Perlu disiplin approval.`;
  return `Cashflow sehat: pemasukan ${currency(snapshot.income)} lebih tinggi dari pengeluaran ${currency(snapshot.expense)}.`;
}

export function generateDashboardInsights(data = mockRepository.loadInitialData()) {
  const snapshot = buildFinanceSnapshot(data);
  const topExpense = snapshot.expenseByCategory[0];
  const projectRisk = snapshot.projectRisks[0];
  const duplicateRisk = snapshot.duplicateCandidates[0];
  return [
    {
      icon: topExpense ? "trending_up" : "analytics",
      title: "Insight Pengeluaran",
      text: topExpense ? `${topExpense.name} menjadi pengeluaran terbesar: ${currency(topExpense.amount)} atau ${percentValue(topExpense.amount, snapshot.expense)}% total biaya.` : "Belum ada pengeluaran untuk dianalisis.",
      tone: topExpense && percentValue(topExpense.amount, snapshot.expense) >= 35 ? "warning" : "",
    },
    {
      icon: "account_balance_wallet",
      title: "Kas Kecil",
      text: snapshot.pettyCashBalance < 20000000 ? `Kas kecil hampir habis: ${currency(snapshot.pettyCashBalance)}. Siapkan top up atau batasi klaim harian.` : `Kas kecil masih aman: ${currency(snapshot.pettyCashBalance)}.`,
      tone: snapshot.pettyCashBalance < 20000000 ? "warning" : "success",
    },
    {
      icon: "event_busy",
      title: "Hutang & Piutang",
      text: `${snapshot.debtsDueCount} hutang (${currency(snapshot.debtsDueAmount)}) dan ${snapshot.receivablesDueCount} piutang (${currency(snapshot.receivablesDueAmount)}) perlu dipantau.`,
      tone: snapshot.debtsDueCount || snapshot.receivablesDueCount ? "warning" : "success",
    },
    {
      icon: "work_history",
      title: "Budget Project",
      text: projectRisk ? `${projectRisk.name} mendekati/melewati batas dengan serapan ${projectRisk.progress}%.` : "Tidak ada project yang melewati ambang 80% dari data aktif.",
      tone: projectRisk ? "warning" : "success",
    },
    {
      icon: "report",
      title: "Transaksi Mencurigakan",
      text: duplicateRisk ? `${duplicateRisk.item.id || "Transaksi"} perlu dicek: ${duplicateRisk.duplicate.risk} dengan skor ${duplicateRisk.duplicate.score}/100.` : "Tidak ada transaksi mencurigakan kuat pada data aktif.",
      tone: duplicateRisk ? "warning" : "success",
    },
    {
      icon: "task_alt",
      title: "Rekomendasi Tindakan",
      text: suggestFinanceActions(data)[0]?.text || "Pantau approval dan transaksi besar secara berkala.",
      tone: "",
    },
  ];
}

async function maybeUseAiReport(kind, report, options = {}) {
  const shouldAskProxy = options.forceReal && isAiProxyReady();
  if (!shouldAskProxy) return report;
  const response = await runAiTask("summarize_report", {
    prompt: `Buat laporan ${kind} DOMPET PT dari summary ringkas ini. Jangan mengarang angka.`,
    payload: {
      title: report.title,
      summary: report.summary,
      issues: report.issues,
      recommendations: report.recommendations.slice(0, 5),
    },
  }, options);
  if (!response?.ok || response.mode !== "real") return { ...report, warning: response?.warning || "AI proxy fallback ke laporan lokal." };
  return {
    ...report,
    text: getAiResultText(response),
    mode: "real",
    usage: response.usage,
    usageLogged: response.usageLogged,
  };
}

async function generateFinanceReportBase(kind, title, data = mockRepository.loadInitialData(), filters = {}, options = {}) {
  const cacheKey = makeCacheKey(kind, data, filters);
  if (!options.regenerate && aiReportCache.has(cacheKey)) return { ...aiReportCache.get(cacheKey), cached: true };
  const report = localReport(kind, title, data, filters);
  const finalReport = await maybeUseAiReport(kind, report, options);
  if (!finalReport.usageLogged) {
    const usage = estimateAiCost("summarize_report", { kind, summary: report.summary, issues: report.issues });
    addAiUsage(`report_${kind}`, usage.estimated_tokens, finalReport.mode === "real" ? usage.estimated_cost : 0, { mode: finalReport.mode || "mock" });
    finalReport.usage = { estimated_tokens: usage.estimated_tokens, estimated_cost: finalReport.mode === "real" ? usage.estimated_cost : 0 };
    finalReport.usageLogged = true;
  }
  aiReportCache.set(cacheKey, finalReport);
  return finalReport;
}

export function generateDailyFinanceSummary(data = mockRepository.loadInitialData(), filters = {}) {
  const report = localReport("daily", "Laporan Harian DOMPET PT", data, filters);
  const usage = estimateAiCost("summarize_report", { kind: "daily", summary: report.summary });
  addAiUsage("report_daily", usage.estimated_tokens, 0, { mode: "mock" });
  return { ...report, usage: { ...usage, estimated_cost: 0 }, usageLogged: true };
}

export function generateWeeklyFinanceSummary(data = mockRepository.loadInitialData(), filters = {}) {
  const report = localReport("weekly", "Laporan Mingguan DOMPET PT", data, filters);
  const usage = estimateAiCost("summarize_report", { kind: "weekly", summary: report.summary });
  addAiUsage("report_weekly", usage.estimated_tokens, 0, { mode: "mock" });
  return { ...report, usage: { ...usage, estimated_cost: 0 }, usageLogged: true };
}

export function generateMonthlyFinanceSummary(data = mockRepository.loadInitialData(), filters = {}) {
  const report = localReport("monthly", "Laporan Bulanan DOMPET PT", data, filters);
  const usage = estimateAiCost("summarize_report", { kind: "monthly", summary: report.summary });
  addAiUsage("report_monthly", usage.estimated_tokens, 0, { mode: "mock" });
  return { ...report, usage: { ...usage, estimated_cost: 0 }, usageLogged: true };
}

export function generateOwnerReport(data = mockRepository.loadInitialData(), filters = {}, options = {}) {
  return generateFinanceReportBase("owner", "Laporan Owner DOMPET PT", data, filters, options);
}

export function generateManagerReport(data = mockRepository.loadInitialData(), filters = {}, options = {}) {
  return generateFinanceReportBase("manager", "Laporan Manager DOMPET PT", data, filters, options);
}

export function generateFinanceReport(data = mockRepository.loadInitialData(), filters = {}, options = {}) {
  return generateFinanceReportBase("finance", "Laporan Finance DOMPET PT", data, filters, options);
}

async function buildMockTaskResponse(task, prompt = "", payload = {}) {
  const data = mockRepository.loadInitialData();
  const text = String(prompt || "");
  const lower = text.toLowerCase();
  const usage = buildUsage(text, payload);

  const results = {
    parse_transaction: {
      type: lower.includes("terima") || lower.includes("termin") || lower.includes("pemasukan") ? "income" : "expense",
      date: new Date().toISOString().slice(0, 10),
      title: text || "Transaksi dari input bebas",
      vendor_or_source: lower.includes("vendor") ? "Vendor dari input" : "Sumber dari input",
      amount: parseAmountFromText(text),
      tax_amount: 0,
      payment_method: lower.includes("mandiri") ? "Transfer Mandiri" : "Transfer Bank",
      category_hint: lower.includes("kas") ? "Kas Kecil" : lower.includes("kabel") || lower.includes("olt") ? "Infrastruktur" : "Operasional",
      project_hint: lower.includes("barat") ? "FTTH Barat" : "Operasional",
      account_hint: lower.includes("mandiri") ? "Mandiri Giro" : "BCA Corporate",
      status: "Draft",
      note: "Hasil parsing mock. Periksa lagi sebelum disimpan.",
    },
    suggest_category: {
      category: lower.includes("kas") ? "Kas Kecil" : lower.includes("termin") ? "Termin Proyek" : "Infrastruktur",
      confidence: 0.78,
      reason: "Saran dibuat dari kata kunci transaksi dan pola kategori demo.",
      risk: "Aman",
    },
    detect_duplicate: {
      ...checkDuplicateBeforeSave(payload.transaction || data.transactions[1], payload.existingTransactions || data.transactions),
      reason: "Mode demo membandingkan tanggal, nominal, vendor, kategori, project, deskripsi, dan bukti.",
    },
    analyze_budget: {
      ...analyzeProjectBudget(payload.projectId || payload.project_id || data.projects[0]?.name, payload.amount || 0, data),
      recommendation: "Minta approval manager jika status Perlu Cek atau Melebihi Anggaran.",
    },
    summarize_report: {
      summary: createAiResponse("ringkas laporan"),
      highlights: ["Pemasukan masih lebih tinggi dari pengeluaran", "Approval pending perlu ditinjau"],
      risks: ["Pengeluaran infrastruktur perlu dipantau"],
      recommendations: ["Review transaksi pending dan bukti vendor bernilai besar"],
    },
    scan_receipt: {
      date: new Date().toISOString().slice(0, 10),
      type: lower.includes("transfer") || lower.includes("termin") ? "income" : "expense",
      title: lower.includes("transfer") ? "Bukti transfer pemasukan" : "Pembayaran vendor dari nota",
      vendor_or_source: lower.includes("transfer") ? "Klien Enterprise Fiber" : "Vendor Kabel FO",
      category: lower.includes("transfer") ? "Termin Proyek" : "Infrastruktur",
      amount: parseAmountFromText(text) || 12500000,
      tax_amount: lower.includes("ppn") ? 1375000 : 0,
      payment_method: "transfer",
      note: "Hasil scan OCR mock. Periksa ulang sebelum simpan.",
      confidence: 0.82,
    },
    extract_receipt_fields: {
      date: new Date().toISOString().slice(0, 10),
      type: lower.includes("diterima") || lower.includes("termin") ? "income" : "expense",
      title: text.slice(0, 80) || "Transaksi dari teks OCR",
      vendor_or_source: lower.includes("vendor") ? "Vendor dari teks OCR" : "Sumber dari teks OCR",
      category: lower.includes("bbm") ? "Kas Kecil" : lower.includes("termin") ? "Termin Proyek" : "Infrastruktur",
      amount: parseAmountFromText(text),
      tax_amount: lower.includes("ppn") ? Math.round(parseAmountFromText(text) * 0.11) : 0,
      payment_method: lower.includes("tunai") ? "cash" : "transfer",
      note: "Field diekstrak dari teks OCR mock.",
      confidence: parseAmountFromText(text) ? 0.78 : 0.55,
    },
    chat_finance: {
      answer: createAiResponse(text),
      next_action: "Tinjau data terkait sebelum membuat transaksi atau approval.",
    },
  };

  if (task === "generate_whatsapp_report") {
    return {
      ok: true,
      task,
      result: { text: await reportService.generateWhatsAppReport(payload.filters || payload || { isDemo: true }) },
      usage,
      mode: "mock",
    };
  }

  return {
    ok: true,
    task,
    result: results[task] || results.chat_finance,
    usage,
    mode: "mock",
  };
}

export function getAiResultText(response) {
  const result = response?.result || {};
  if (typeof result === "string") return result;
  if (result.answer) return result.answer;
  if (result.text) return result.text;
  if (result.summary) return result.summary;
  if (result.title && result.amount !== undefined) {
    const amount = Number(result.amount || 0);
    return `Transaksi terbaca: ${result.title}. Nominal ${amount ? currency(amount) : "belum terbaca"}. Saran kategori ${result.category || result.category_hint || "belum pasti"}, proyek ${result.project_hint || "belum pasti"}, rekening ${result.account_hint || "belum pasti"}. Simpan sebagai ${result.status || "Draft"} setelah dicek.`;
  }
  if (result.message) return result.message;
  if (result.recommendation) return result.recommendation;
  if (result.category) return `Saran kategori: ${result.category}. ${result.reason || ""}`.trim();
  if (result.risk || result.budget_status) return `${result.risk || "Analisa"}: ${result.budget_status || ""} ${result.reason || ""}`.trim();
  return createAiResponse(JSON.stringify(result));
}

export async function runAiTask(task, { prompt = "", payload = {} } = {}, options = {}) {
  const safeTask = normalizeTask(task);
  const safePrompt = String(prompt || "").slice(0, 4000);
  const safePayload = compactPayload(payload);
  const fallback = await buildMockTaskResponse(safeTask, safePrompt, safePayload);
  const estimated = estimateAiCost(safeTask, { prompt: safePrompt, payload: safePayload });
  const budgetGuard = canRunAiTask(safeTask, { prompt: safePrompt, payload: safePayload });

  if (!shouldUseProxy(options)) {
    const response = options.forceReal && !isAiProxyReady()
      ? { ...fallback, warning: "AI proxy belum tersedia, memakai mock lokal." }
      : fallback;
    const usage = response.usage || estimated;
    addAiUsage(safeTask, usage.estimated_tokens, 0, { mode: "mock", status: response.warning ? "fallback" : "ok", message: response.warning || "" });
    return { ...response, usage, usageLogged: true };
  }

  if (!budgetGuard.canRunReal) {
    addAiUsage(safeTask, 0, 0, { mode: "mock", blocked: true, message: budgetGuard.message });
    return {
      ...fallback,
      warning: "Budget AI bulan ini habis, mode real dialihkan ke mock/local.",
      usage: { estimated_tokens: 0, estimated_cost: 0 },
      usageLogged: true,
    };
  }

  try {
    const response = await fetch(aiProxyUrl, {
      method: "POST",
      headers: aiProxyHeaders(),
      body: JSON.stringify({ task: safeTask, prompt: safePrompt, payload: safePayload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.message || "AI proxy tidak merespons normal.");
    const usage = data.usage || estimated;
    addAiUsage(safeTask, usage.estimated_tokens, usage.estimated_cost, { mode: "real" });
    return { ...data, usage, usageLogged: true };
  } catch (error) {
    addAiUsage(safeTask, estimated.estimated_tokens, 0, { mode: "mock", status: "fallback", message: error instanceof Error ? error.message : "AI proxy gagal" });
    return {
      ...fallback,
      warning: `AI proxy gagal, memakai mock lokal. ${error instanceof Error ? error.message : ""}`.trim(),
      usage: { ...estimated, estimated_cost: 0 },
      usageLogged: true,
    };
  }
}

export function mockAiResponse(prompt) {
  return createAiResponse(prompt);
}

export async function chatFinance(prompt, payload = {}, options = {}) {
  const response = await runAiTask("chat_finance", { prompt, payload }, options);
  return { ...response, text: getAiResultText(response) };
}

export async function parseTransactionText(text, options = {}) {
  return runAiTask("parse_transaction", { prompt: text, payload: { expected_fields: ["type", "date", "title", "amount", "category_hint", "project_hint"] } }, options);
}

export async function suggestCategory(transaction, options = {}) {
  return runAiTask("suggest_category", { prompt: "Sarankan kategori transaksi ini.", payload: { transaction } }, options);
}

export async function detectDuplicateTransaction(transaction, existingTransactions = [], options = {}) {
  const compactTransactions = existingTransactions.slice(0, 25).map((item) => ({
    id: item.id,
    date: item.date,
    title: item.title || item.desc,
    vendor_or_source: item.vendor_or_source || item.desc,
    amount: item.amount,
  }));
  return runAiTask("detect_duplicate", { prompt: "Cek apakah transaksi ini duplikat.", payload: { transaction, existingTransactions: compactTransactions } }, options);
}

export async function analyzeBudget(projectId, amount, options = {}) {
  return runAiTask("analyze_budget", { prompt: "Analisa dampak nominal terhadap budget proyek.", payload: { projectId, amount } }, options);
}

export async function summarizeReport(filters = {}, options = {}) {
  const report = await reportService.getReportPreview(filters);
  return runAiTask("summarize_report", {
    prompt: "Ringkas laporan keuangan ini untuk manajemen.",
    payload: {
      title: report.title,
      period: report.period,
      summary: report.summary,
      topExpenses: report.topExpenses,
      rows: report.rows.slice(0, 20),
      isMock: report.isMock,
    },
  }, options);
}

export async function generateWhatsAppReport(filters = {}, options = {}) {
  const report = await reportService.getReportPreview(filters);
  const response = await runAiTask("generate_whatsapp_report", {
    prompt: "Buat ringkasan WhatsApp laporan ini.",
    payload: {
      filters,
      title: report.title,
      period: report.period,
      summary: report.summary,
      topExpenses: report.topExpenses,
      isMock: report.isMock,
    },
  }, options);
  return { ...response, text: getAiResultText(response) };
}

export async function scanReceipt(payload = {}, options = {}) {
  return runAiTask("scan_receipt", {
    prompt: "Scan nota atau bukti transfer dan kembalikan field transaksi.",
    payload,
  }, options);
}

export async function extractReceiptFields(text = "", options = {}) {
  return runAiTask("extract_receipt_fields", {
    prompt: text,
    payload: { expected_output: ["date", "type", "title", "vendor_or_source", "category", "amount", "tax_amount", "payment_method", "note", "confidence"] },
  }, options);
}

export function getAiInsights() {
  const data = mockRepository.loadInitialData();
  const largestExpense = data.transactions.filter((item) => item.type === "expense").sort((a, b) => b.amount - a.amount)[0];
  return [
    "AI mode hemat aktif dan hanya berjalan saat diminta.",
    largestExpense ? `Pengeluaran terbesar demo: ${largestExpense.desc} senilai ${currency(largestExpense.amount)}.` : "Belum ada pengeluaran besar.",
    "Gunakan proxy Supabase Edge Function untuk mode real tanpa membocorkan API key di browser.",
  ];
}

export const aiService = {
  isAiProxyReady,
  getDefaultAiMode,
  getAiRuntimeInfo,
  getAiUsage,
  addAiUsage,
  resetMonthlyUsageMock,
  getAiBudgetStatus,
  canRunAiTask,
  estimateAiCost,
  runAiTask,
  chatFinance,
  parseTransactionText,
  suggestCategory,
  detectDuplicateTransaction,
  analyzeBudget,
  findDuplicateTransactions,
  getDuplicateScore,
  explainDuplicateRisk,
  checkDuplicateBeforeSave,
  analyzeProjectBudget,
  getProjectBudgetUsage,
  explainBudgetRisk,
  generateDailyFinanceSummary,
  generateWeeklyFinanceSummary,
  generateMonthlyFinanceSummary,
  generateDashboardInsights,
  detectSpendingAnomalies,
  generateOwnerReport,
  generateManagerReport,
  generateFinanceReport,
  explainCashflowTrend,
  suggestFinanceActions,
  summarizeReport,
  generateWhatsAppReport,
  scanReceipt,
  extractReceiptFields,
  getAiInsights,
  getAiResultText,
  mockAiResponse,
};
