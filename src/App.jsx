import { useEffect, useMemo, useState } from "react";
import AppShell from "./components/AppShell.jsx";
import Drawer from "./components/Drawer.jsx";
import { initialAiMessages, initialSettings, mockRepository } from "./data/mockData.js";
import { activityLogService } from "./services/activityLogService.js";
import { aiService } from "./services/aiService.js";
import { approvalService } from "./services/approvalService.js";
import { authService } from "./services/authService.js";
import { financeService } from "./services/financeService.js";
import { roleService } from "./services/roleService.js";
import { settingsService } from "./services/settingsService.js";
import { transactionService } from "./services/transactionService.js";
import AiAssistant from "./pages/AiAssistant.jsx";
import Approval from "./pages/Approval.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import HutangPiutang from "./pages/HutangPiutang.jsx";
import KasKecil from "./pages/KasKecil.jsx";
import Kategori from "./pages/Kategori.jsx";
import Laporan from "./pages/Laporan.jsx";
import Login from "./pages/Login.jsx";
import Pemasukan from "./pages/Pemasukan.jsx";
import Pengeluaran from "./pages/Pengeluaran.jsx";
import Proyek from "./pages/Proyek.jsx";
import Rekening from "./pages/Rekening.jsx";
import Settings from "./pages/Settings.jsx";
import UserRole from "./pages/UserRole.jsx";

function downloadFile(name, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [drawer, setDrawer] = useState(null);
  const [filter, setFilter] = useState("Semua");
  const [projectFilter, setProjectFilter] = useState("Semua");
  const [debtTab, setDebtTab] = useState("Hutang");
  const [approvalDetail, setApprovalDetail] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [settings, setSettings] = useState(initialSettings);
  const [mock, setMock] = useState(() => mockRepository.loadInitialData());
  const [aiUsageDetails, setAiUsageDetails] = useState(() => aiService.getAiBudgetStatus());
  const [aiMessages, setAiMessages] = useState(initialAiMessages);
  const [aiMode, setAiMode] = useState(() => aiService.getDefaultAiMode());
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [authError, setAuthError] = useState("");
  const [toast, setToast] = useState("");

  const approvalItem = useMemo(() => mock.approvals.find((item) => item.id === approvalDetail) || mock.approvals[0], [approvalDetail, mock.approvals]);
  const currentRole = userProfile?.role || "Viewer";
  const canApproveCurrent = roleService.canApprove(currentRole);
  const aiRuntime = useMemo(() => ({ ...aiService.getAiRuntimeInfo(aiMode), usage: aiUsageDetails }), [aiMode, aiUsageDetails]);

  useEffect(() => {
    let isMounted = true;

    authService.getCurrentUser()
      .then((auth) => {
        if (!isMounted) return;
        setCurrentUser(auth.user);
        setUserProfile(auth.profile);
        setIsDemo(auth.isDemo);
        setAuthLoading(false);
      })
      .catch(() => {
        if (isMounted) setAuthLoading(false);
      });

    const subscription = authService.onAuthStateChange((event, auth) => {
      if (!isMounted || event === "INITIAL_SESSION") return;
      setCurrentUser(auth.user);
      setUserProfile(auth.profile);
      setIsDemo(auth.isDemo);
    });

    financeService.loadInitialData()
      .then((data) => {
        if (isMounted) setMock(data);
      })
      .catch(() => {});

    settingsService.loadSettings()
      .then((nextSettings) => {
        if (isMounted) setSettings((current) => ({ ...current, ...nextSettings }));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      subscription?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!userProfile?.company_id) return undefined;

    let isMounted = true;
    settingsService.loadSettings(userProfile.company_id)
      .then((nextSettings) => {
        if (isMounted) setSettings((current) => ({ ...current, ...nextSettings }));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [userProfile?.company_id]);

  useEffect(() => {
    const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = settings.theme === "system" ? (systemDark ? "dark" : "light") : settings.theme;
    document.body.dataset.theme = theme;
    document.body.style.setProperty("--primary", settings.primary);
  }, [settings]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const chatWindow = document.getElementById("chatWindow");
    if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
  }, [aiMessages, page]);

  function showToast(message) {
    setToast(message);
  }

  function refreshAiUsage() {
    setAiUsageDetails(aiService.getAiBudgetStatus());
  }

  function resetAiUsage() {
    aiService.resetMonthlyUsageMock();
    refreshAiUsage();
    showToast("Usage AI bulan ini direset dalam mode demo");
  }

  function navigate(nextPage) {
    refreshAiUsage();
    setPage(nextPage);
    setDrawer(null);
    setApprovalDetail(null);
    setFilter("Semua");
  }

  async function saveTransaction(payload) {
    const moduleName = payload.type === "income" ? "Pemasukan" : "Pengeluaran";
    try {
      const result = await transactionService.createTransaction(payload);
      const transaction = result.uiTransaction;

      setMock((current) => ({
        ...current,
        transactions: transaction ? [transaction, ...current.transactions] : current.transactions,
        logs: [{ time: "01 Jun 2026 23:41", user: userProfile?.name || "Admin Demo", action: `Simpan ${moduleName.toLowerCase()}`, module: moduleName }, ...current.logs],
      }));

      setDrawer(null);
      showToast(result.isMock ? "Transaksi disimpan di mode mock" : "Transaksi disimpan ke Supabase");
    } catch (error) {
      showToast(error.message || "Transaksi gagal disimpan");
    }
  }

  async function login(credentials) {
    setAuthError("");
    try {
      const auth = await authService.signInWithEmail(credentials.email, credentials.password);
      setCurrentUser(auth.user);
      setUserProfile(auth.profile);
      setIsDemo(auth.isDemo);
      setPage("dashboard");
      showToast(auth.isDemo ? "Masuk mode demo" : "Berhasil masuk");
    } catch (error) {
      setAuthError(error.message || "Login gagal");
    }
  }

  async function logout() {
    await authService.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    setIsDemo(false);
    setPage("login");
    showToast("Sesi keluar");
  }

  async function approvalAction(approvalId, action, note = "") {
    if (!canApproveCurrent) {
      const message = currentRole === "Viewer" ? "Mode Viewer" : "Role tidak memiliki akses approval";
      await activityLogService.addActivityLog({
        company_id: userProfile?.company_id,
        user_id: userProfile?.id,
        module: "Approval",
        action: "Role access denied",
        target_id: approvalId,
        description: message,
      });
      showToast(message);
      return;
    }

    const actionMap = {
      approved: { label: "disetujui", run: approvalService.approveTransaction, uiStatus: "Approved", transactionStatus: "Approved" },
      rejected: { label: "ditolak", run: approvalService.rejectTransaction, uiStatus: "Rejected", transactionStatus: "Rejected" },
      revision_requested: { label: "diminta revisi", run: approvalService.requestRevision, uiStatus: "Revisi", transactionStatus: "Revisi" },
    };
    const selected = actionMap[action] || actionMap.revision_requested;
    const result = await selected.run(approvalId, note, userProfile);

    setMock((current) => ({
      ...current,
      approvals: current.approvals.map((item) => item.id === approvalId ? { ...item, status: result.uiStatus || selected.uiStatus, evidence: note || item.evidence } : item),
      transactions: current.transactions.map((item) => item.id === approvalId || item.id === result.data?.transaction_id ? { ...item, status: selected.transactionStatus } : item),
      logs: [{ time: "01 Jun 2026 23:45", user: userProfile?.name || "Penyetuju", action: `Approval ${selected.label}`, module: "Approval" }, ...current.logs],
    }));

    setDrawer(null);
    setApprovalDetail(null);
    showToast(result.isMock ? `Approval ${selected.label} dalam mode mock` : `Approval ${selected.label}`);
  }

  function backupData() {
    const backup = settingsService.exportBackupMock({ settings, transactions: mock.transactions, logs: mock.logs });
    downloadFile(backup.fileName, backup.contentType, backup.content);
    showToast("Cadangan contoh dibuat");
  }

  function exportLog() {
    const csv = ["time,user,module,action", ...mock.logs.map((log) => `${log.time},${log.user},${log.module},${log.action}`)].join("\n");
    downloadFile("dompet-pt-ai-log-mock.csv", "text/csv", csv);
    showToast("Log aktivitas diekspor");
  }

  function applyRestorePreview() {
    if (restorePreview?.appName) setSettings((current) => ({ ...current, appName: restorePreview.appName }));
    setMock((current) => ({ ...current, logs: [{ time: "01 Jun 2026 23:40", user: "Admin Kontrol", action: "Terapkan pulihkan contoh", module: "Pengaturan" }, ...current.logs] }));
    setRestorePreview(null);
    showToast("Pulihkan contoh diterapkan ke UI");
  }

  function isTransactionPrompt(text) {
    const lower = text.toLowerCase();
    return ["bayar", "terima", "invoice", "nota", "vendor", "kas", "termin", "transaksi"].some((keyword) => lower.includes(keyword));
  }

  async function runAi(prompt) {
    const text = String(prompt).trim();
    if (!text) return;

    const taskGuard = aiService.canRunAiTask("chat_finance", { prompt: text });
    const forceMockForBudget = aiMode === "real" && !taskGuard.canRunReal;
    const options = { forceMock: aiMode === "mock" || forceMockForBudget, forceReal: aiMode === "real" && !forceMockForBudget };
    setAiMessages((current) => [...current, { role: "user", text }, { role: "ai", text: "Memproses satu request AI..." }]);

    try {
      let response;
      if (text === "Ringkas Laporan") {
        response = await aiService.summarizeReport({ isDemo }, options);
      } else if (text === "Cek Duplikat" || text === "Cek Duplikat Transaksi") {
        const duplicate = aiService.checkDuplicateBeforeSave(mock.transactions[1], mock.transactions);
        response = { ok: true, task: "detect_duplicate", result: { message: `${duplicate.message} Risiko ${duplicate.risk}, skor ${duplicate.score}/100, ${duplicate.matches.length} match.` }, usage: aiService.estimateAiCost("detect_duplicate", duplicate), mode: "mock" };
      } else if (text === "Analisa Anggaran" || text === "Analisa Budget Project") {
        const riskyProject = mock.projects.slice().sort((a, b) => (b.progress || 0) - (a.progress || 0))[0] || mock.projects[0];
        const budget = aiService.analyzeProjectBudget(riskyProject?.name, 175000000, mock);
        response = { ok: true, task: "analyze_budget", result: { message: `${budget.message} Budget ${budget.budget ? budget.usagePercent : 0}% setelah simulasi transaksi Rp 175 jt.` }, usage: aiService.estimateAiCost("analyze_budget", budget), mode: "mock" };
      } else if (text === "Cari Transaksi Mencurigakan") {
        const suspicious = mock.transactions
          .map((item) => ({ item, duplicate: aiService.checkDuplicateBeforeSave(item, mock.transactions.filter((candidate) => candidate.id !== item.id)) }))
          .filter(({ item, duplicate }) => duplicate.risk !== "low" || Number(item.amount || 0) >= 100000000 || ["Pending", "Rejected"].includes(item.status))
          .slice(0, 4);
        const message = suspicious.length
          ? suspicious.map(({ item, duplicate }, index) => `${index + 1}. ${item.id} - ${item.desc}: ${duplicate.risk !== "low" ? `duplikat ${duplicate.score}/100` : item.status}.`).join("\n")
          : "Tidak ada transaksi mencurigakan kuat pada data aktif.";
        response = { ok: true, task: "detect_duplicate", result: { message }, usage: aiService.estimateAiCost("detect_duplicate", suspicious), mode: "mock" };
      } else if (text === "Laporan Owner") {
        const report = await aiService.generateOwnerReport(mock, { isDemo }, options);
        response = { ok: true, task: "summarize_report", result: { message: report.text }, usage: report.usage || aiService.estimateAiCost("summarize_report", report), mode: report.mode || "mock", usageLogged: report.usageLogged };
      } else if (text === "Laporan Finance") {
        const report = await aiService.generateFinanceReport(mock, { isDemo }, options);
        response = { ok: true, task: "summarize_report", result: { message: report.text }, usage: report.usage || aiService.estimateAiCost("summarize_report", report), mode: report.mode || "mock", usageLogged: report.usageLogged };
      } else if (text === "Kategori Otomatis") {
        response = await aiService.suggestCategory({ title: "Pembayaran vendor kabel", amount: 12000000, vendor_or_source: "Vendor kabel" }, options);
      } else if (isTransactionPrompt(text)) {
        response = await aiService.parseTransactionText(text, options);
      } else {
        response = await aiService.chatFinance(text, { companyName: settings.companyName, activePage: page }, options);
      }

      if (!response.usageLogged) {
        const usage = response.usage || aiService.estimateAiCost(response.task || "chat_finance", { prompt: text });
        const estimatedCost = response.mode === "real" ? usage.estimated_cost : 0;
        aiService.addAiUsage(response.task || "chat_finance", usage.estimated_tokens, estimatedCost, { mode: response.mode || "mock", status: forceMockForBudget ? "budget-fallback" : "ok", message: forceMockForBudget ? taskGuard.message : "" });
        response = { ...response, usage: { ...usage, estimated_cost: estimatedCost }, usageLogged: true };
      }
      await activityLogService.addActivityLog({
        company_id: userProfile?.company_id,
        user_id: userProfile?.id,
        module: "AI Assistant",
        action: forceMockForBudget ? "AI blocked karena budget" : `AI ${response.task || "chat_finance"}`,
        description: `${response.mode || "mock"} - ${text.slice(0, 80)}`,
      });
      refreshAiUsage();
      const answer = aiService.getAiResultText(response);
      setAiMessages((current) => current.map((message, index) => (
        index === current.length - 1 && message.role === "ai"
          ? { ...message, text: response.warning ? `${answer}\n\nCatatan: ${response.warning}` : answer }
          : message
      )));
      setMock((current) => ({ ...current, logs: [{ time: "01 Jun 2026 23:42", user: userProfile?.name || "Admin Kontrol", action: `AI ${response.mode === "real" ? "proxy" : "mock"}: ${text.slice(0, 36)}`, module: "AI Assistant" }, ...current.logs] }));
      showToast(forceMockForBudget ? "Budget AI habis, memakai mock" : response.mode === "real" ? "AI proxy dijalankan satu kali" : response.warning ? "AI proxy fallback ke mock" : "AI mock dijalankan satu kali");
    } catch (error) {
      setAiMessages((current) => current.map((message, index) => (
        index === current.length - 1 && message.role === "ai"
          ? { ...message, text: aiService.mockAiResponse(text) }
          : message
      )));
      showToast(error.message || "AI fallback ke mock");
    }
  }

  const pageProps = { mock, settings, profile: userProfile, isDemo, onToast: showToast };
  const pages = {
    dashboard: <Dashboard {...pageProps} onNavigate={navigate} onOpenDrawer={setDrawer} />,
    pemasukan: <Pemasukan {...pageProps} filter={filter} onFilterChange={setFilter} onOpenDrawer={setDrawer} />,
    pengeluaran: <Pengeluaran {...pageProps} filter={filter} onFilterChange={setFilter} onOpenDrawer={setDrawer} />,
    approval: <Approval {...pageProps} currentRole={currentRole} canApprove={canApproveCurrent} onApprovalDetail={(id) => { setApprovalDetail(id); setDrawer("approval"); }} onApprovalAction={approvalAction} />,
    project: <Proyek {...pageProps} currentRole={currentRole} projectFilter={projectFilter} onProjectFilter={setProjectFilter} />,
    laporan: <Laporan {...pageProps} currentRole={currentRole} />,
    rekening: <Rekening {...pageProps} currentRole={currentRole} />,
    kategori: <Kategori {...pageProps} currentRole={currentRole} />,
    "kas-kecil": <KasKecil {...pageProps} currentRole={currentRole} />,
    "hutang-piutang": <HutangPiutang {...pageProps} currentRole={currentRole} debtTab={debtTab} onDebtTab={setDebtTab} />,
    "user-role": <UserRole {...pageProps} currentRole={currentRole} roleAccess={roleService.getRolePermissions(currentRole)} />,
    settings: <Settings {...pageProps} aiRuntime={aiRuntime} onResetAiUsage={resetAiUsage} setSettings={setSettings} restorePreview={restorePreview} setRestorePreview={setRestorePreview} onBackup={backupData} onExportLog={exportLog} onApplyRestore={applyRestorePreview} />,
    ai: <AiAssistant settings={settings} aiUsageDetails={aiUsageDetails} aiRuntime={aiRuntime} aiMode={aiMode} aiMessages={aiMessages} onAiModeChange={setAiMode} onResetAiUsage={resetAiUsage} onRunAi={runAi} onClearAi={() => setAiMessages([{ role: "ai", text: "Chat dibersihkan. Mode hemat tetap aktif dan diam." }])} onToast={showToast} />,
  };

  if (authLoading) {
    return <main className="login-shell"><section className="login-card"><strong>Memuat sesi...</strong><p className="muted">Menyiapkan mode Supabase atau Demo.</p></section></main>;
  }

  if (!currentUser || page === "login") {
    return <><Login settings={settings} isSupabaseReady={authService.isSupabaseReady()} authMode={authService.getAuthMode()} onLogin={login} error={authError} /><div id="toast" className={`toast ${toast ? "visible" : ""}`} role="status" aria-live="polite">{toast}</div></>;
  }

  return (
    <>
      <AppShell settings={settings} activePage={page} authProfile={userProfile} isDemo={isDemo} onNavigate={navigate} onOpenDrawer={setDrawer} onToast={showToast} onSignOut={logout}>
        {pages[page] || pages.dashboard}
      </AppShell>
      <Drawer drawer={drawer} approvalItem={approvalItem} mock={mock} profile={userProfile} canApprove={canApproveCurrent} onClose={() => { setDrawer(null); setApprovalDetail(null); }} onOpenDrawer={setDrawer} onSaveTransaction={saveTransaction} onApprovalAction={approvalAction} onToast={showToast} />
      <div id="toast" className={`toast ${toast ? "visible" : ""}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
