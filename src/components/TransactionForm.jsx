import { useMemo, useState } from "react";
import Icon from "./Icon.jsx";
import { currency } from "../data/mockData.js";
import { activityLogService } from "../services/activityLogService.js";
import { aiService } from "../services/aiService.js";
import { ocrService } from "../services/ocrService.js";
import { uploadTransactionProof } from "../services/uploadService.js";

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "paid", label: "Dibayar" },
  { value: "rejected", label: "Ditolak" },
];

function optionValue(item) {
  return item.id || item.name || "";
}

function findByValue(items, value) {
  return items.find((item) => optionValue(item) === value);
}

export default function TransactionForm({ type, mock, profile, onSubmit, onSwitchType, onToast }) {
  const isIncome = type === "income";
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [ocrResult, setOcrResult] = useState(null);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [budgetResult, setBudgetResult] = useState(null);
  const [riskExplanation, setRiskExplanation] = useState("");
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const [form, setForm] = useState({
    type,
    date: new Date().toISOString().slice(0, 10),
    title: "",
    vendor_or_source: "",
    project_id: "",
    account_id: "",
    category_id: "",
    payment_method: "transfer",
    amount: "",
    tax_amount: "0",
    note: "",
    status: isIncome ? "paid" : "pending",
    proof_url: "",
  });

  const categoryOptions = useMemo(() => {
    const group = isIncome ? "Pemasukan" : "Pengeluaran";
    return mock.categories.filter((item) => item.group === group || item.type === type || item.group === "Kas Kecil");
  }, [isIncome, mock.categories, type]);

  const amount = Number(form.amount || 0);
  const proofInputId = `transactionProofInput-${type}`;
  const isViewer = profile?.role === "Viewer";

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setSaveConfirmed(false);
  }

  function buildDraftTransaction() {
    const project = findByValue(mock.projects, form.project_id);
    const account = findByValue(mock.accounts, form.account_id);
    const category = findByValue(categoryOptions, form.category_id);
    return {
      ...form,
      type,
      amount,
      tax_amount: Number(form.tax_amount || 0),
      project_id: project?.id || form.project_id,
      account_id: account?.id || form.account_id,
      category_id: category?.id || form.category_id,
      project_name: project?.name || form.project_id || "Operasional",
      project: project?.name || form.project_id || "Operasional",
      account_name: account?.name || "-",
      category_name: category?.name || (isIncome ? "Pemasukan" : "Pengeluaran"),
      category: category?.name || (isIncome ? "Pemasukan" : "Pengeluaran"),
      desc: form.title,
    };
  }

  async function handleUpload(file) {
    if (!file) return;
    setReceiptFile(file);
    setOcrResult(null);
    setSaveConfirmed(false);
    setUploadName(file.name);
    const result = await uploadTransactionProof(file, "", profile?.company_id);
    updateField("proof_url", result.url || result.path || file.name);
    setReceiptPreview(file.type?.startsWith("image/") ? result.url : "");
    onToast(result.error ? `Upload bukti gagal: ${result.message || result.error.message}` : result.isMock ? "Bukti disiapkan sebagai pratinjau lokal" : "Bukti transaksi diunggah");
  }

  async function handleScanReceipt() {
    if (!receiptFile) {
      onToast(isIncome ? "Pilih bukti transfer dulu" : "Pilih nota dulu");
      return;
    }

    setIsScanning(true);
    try {
      const result = await ocrService.scanReceiptImage(receiptFile);
      setOcrResult(result);
      await activityLogService.addAiActivityLog("AI scan nota", { company_id: profile?.company_id, user_id: profile?.id, description: result.warning ? "OCR fallback mock" : "OCR bukti transaksi" });
      onToast(result.warning ? "OCR proxy fallback ke mock" : result.cached ? "Hasil scan diambil dari cache sementara" : ocrService.isOcrReady() ? "OCR proxy selesai" : "OCR mock selesai");
    } catch (error) {
      onToast(error.message || "OCR gagal membaca bukti");
    } finally {
      setIsScanning(false);
    }
  }

  function applyOcrResult() {
    if (!ocrResult) return;
    const category = categoryOptions.find((item) => item.name.toLowerCase() === ocrResult.category.toLowerCase())
      || categoryOptions.find((item) => item.name.toLowerCase().includes(ocrResult.category.toLowerCase()) || ocrResult.category.toLowerCase().includes(item.name.toLowerCase()));

    setForm((current) => ({
      ...current,
      date: ocrResult.date || current.date,
      title: ocrResult.title || current.title,
      vendor_or_source: ocrResult.vendor_or_source || current.vendor_or_source,
      category_id: category ? optionValue(category) : current.category_id,
      payment_method: ocrResult.payment_method || current.payment_method,
      amount: ocrResult.amount ? String(ocrResult.amount) : current.amount,
      tax_amount: String(ocrResult.tax_amount || 0),
      note: ocrResult.note || current.note,
    }));

    if (ocrResult.type !== type) {
      onToast(`Hasil OCR terdeteksi ${ocrResult.type === "income" ? "pemasukan" : "pengeluaran"}. Jenis form saat ini tetap ${isIncome ? "pemasukan" : "pengeluaran"}.`);
      return;
    }
    onToast("Hasil OCR dimasukkan ke form. Tetap bisa diedit manual.");
  }

  async function handleCheckDuplicate() {
    const result = aiService.checkDuplicateBeforeSave(buildDraftTransaction(), mock.transactions);
    setDuplicateResult(result);
    setRiskExplanation("");
    await activityLogService.addAiActivityLog("AI cek duplikat", { company_id: profile?.company_id, user_id: profile?.id, description: result.message });
    onToast(result.risk === "high" ? "Risiko duplikat tinggi ditemukan" : result.risk === "medium" ? "Ada kemiripan transaksi, perlu cek" : "Tidak ada duplikat kuat");
  }

  async function handleAnalyzeBudget() {
    if (isIncome) {
      onToast("Budget Guard fokus untuk pengeluaran");
      return;
    }
    if (!form.project_id) {
      onToast("Pilih proyek dulu untuk analisa budget");
      return;
    }
    const result = aiService.analyzeProjectBudget(form.project_id, amount, mock);
    setBudgetResult(result);
    setRiskExplanation("");
    await activityLogService.addAiActivityLog("AI analisa budget", { company_id: profile?.company_id, user_id: profile?.id, description: result.message });
    onToast(result.status === "Melebihi Anggaran" ? "Budget melebihi batas" : result.status === "Perlu Cek" ? "Budget masuk zona perlu cek" : "Budget masih aman");
  }

  async function explainRiskWithAi(kind) {
    const payload = kind === "duplicate" ? duplicateResult : budgetResult;
    if (!payload) {
      onToast("Jalankan pengecekan dulu");
      return;
    }
    const response = await aiService.chatFinance(`Jelaskan risiko ${kind === "duplicate" ? "duplikat transaksi" : "budget project"} ini secara singkat.`, { risk: payload }, { forceReal: true });
    setRiskExplanation(aiService.getAiResultText(response));
    onToast(response.mode === "real" ? "Penjelasan AI proxy dibuat" : "Penjelasan mock dibuat");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isViewer) {
      onToast("Mode Viewer");
      return;
    }
    if (!form.title.trim()) {
      onToast("Judul transaksi wajib diisi");
      return;
    }
    if (amount <= 0) {
      onToast("Nominal transaksi harus lebih dari 0");
      return;
    }

    const project = findByValue(mock.projects, form.project_id);
    const account = findByValue(mock.accounts, form.account_id);
    const category = findByValue(categoryOptions, form.category_id);
    const draftTransaction = buildDraftTransaction();
    const duplicateCheck = aiService.checkDuplicateBeforeSave(draftTransaction, mock.transactions);
    const budgetCheck = !isIncome && form.project_id ? aiService.analyzeProjectBudget(form.project_id, amount, mock) : null;
    setDuplicateResult(duplicateCheck);
    if (budgetCheck) setBudgetResult(budgetCheck);

    const needsConfirmation = duplicateCheck.risk === "high" || budgetCheck?.status === "Melebihi Anggaran";
    if (needsConfirmation && !saveConfirmed) {
      setSaveConfirmed(true);
      onToast("Risiko tinggi ditemukan. Cek warning lalu klik Simpan lagi untuk konfirmasi dummy.");
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        ...form,
        type,
        amount,
        tax_amount: Number(form.tax_amount || 0),
        project_id: project?.id || form.project_id,
        account_id: account?.id || form.account_id,
        category_id: category?.id || form.category_id,
        project_name: project?.name || "Operasional",
        account_name: account?.name || "-",
        category_name: category?.name || (isIncome ? "Pemasukan" : "Pengeluaran"),
        company_id: profile?.company_id,
        created_by: profile?.id,
      });
      setSaveConfirmed(false);
    } finally {
      setIsSaving(false);
    }
  }

  const budgetPercent = Math.min(120, budgetResult?.usagePercent || 0);

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="amount-preview">
        <span className="label">NOMINAL</span>
        <strong className={isIncome ? "money income" : "money expense"}>{isIncome ? "+" : "-"} {currency(amount)}</strong>
        <button className="ghost-button" type="button" disabled={isScanning} onClick={handleScanReceipt}> <Icon name="auto_awesome" /> {isScanning ? "Scan..." : isIncome ? "Scan Bukti" : "Scan Nota"}</button>
      </div>

      <div className="segmented">
        <button className={!isIncome ? "active" : ""} type="button" onClick={() => onSwitchType("expense")}>Pengeluaran</button>
        <button className={isIncome ? "active" : ""} type="button" onClick={() => onSwitchType("income")}>Pemasukan</button>
      </div>

      <label className="field"><span>Judul Transaksi</span><input className="input" value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder={isIncome ? "Termin proyek" : "Pembayaran vendor"} /></label>
      <label className="field"><span>Vendor atau Sumber</span><input className="input" value={form.vendor_or_source} onChange={(event) => updateField("vendor_or_source", event.target.value)} placeholder={isIncome ? "Nama klien" : "Nama vendor"} /></label>
      <label className="field"><span>Tanggal</span><input className="input" type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} /></label>
      <label className="field"><span>Proyek</span><select className="select" value={form.project_id} onChange={(event) => updateField("project_id", event.target.value)}><option value="">Operasional</option>{mock.projects.map((item) => <option key={item.name} value={optionValue(item)}>{item.name}</option>)}</select></label>
      <label className="field"><span>Rekening</span><select className="select" value={form.account_id} onChange={(event) => updateField("account_id", event.target.value)}><option value="">Pilih rekening</option>{mock.accounts.map((item) => <option key={item.name} value={optionValue(item)}>{item.name}</option>)}</select></label>
      <label className="field"><span>Kategori</span><select className="select" value={form.category_id} onChange={(event) => updateField("category_id", event.target.value)}><option value="">Pilih kategori</option>{categoryOptions.map((item) => <option key={`${item.group}-${item.name}`} value={optionValue(item)}>{item.name}</option>)}</select></label>
      <label className="field"><span>Metode Pembayaran</span><select className="select" value={form.payment_method} onChange={(event) => updateField("payment_method", event.target.value)}><option value="transfer">Transfer</option><option value="cash">Tunai</option><option value="giro">Giro</option><option value="ewallet">E-Wallet</option></select></label>
      <label className="field"><span>Nominal</span><input className="input" type="number" min="0" value={form.amount} onChange={(event) => updateField("amount", event.target.value)} placeholder="0" /></label>
      <label className="field"><span>Pajak</span><input className="input" type="number" min="0" value={form.tax_amount} onChange={(event) => updateField("tax_amount", event.target.value)} placeholder="0" /></label>
      <label className="field"><span>Status</span><select className="select" value={form.status} onChange={(event) => updateField("status", event.target.value)}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="field"><span>Catatan</span><textarea className="textarea" value={form.note} onChange={(event) => updateField("note", event.target.value)} placeholder="Tambahkan catatan transaksi..." /></label>

      <section className={`insight-card ${duplicateResult?.risk === "high" ? "warning" : ""}`}>
        <span className="insight-icon"><Icon name="compare_arrows" /></span>
        <div style={{ width: "100%" }}>
          <strong>Cek Duplikat</strong>
          <p>{duplicateResult?.message || "Cek transaksi mirip dari tanggal, nominal, vendor/sumber, kategori, project, keterangan, dan bukti."}</p>
          {duplicateResult ? <p className="muted">Risiko: {duplicateResult.risk} | Skor: {duplicateResult.score}/100 | Match: {duplicateResult.matches.length}</p> : null}
          <div className="form-actions">
            <button className="ghost-button" type="button" onClick={handleCheckDuplicate}><Icon name="search" /> Cek Sekarang</button>
            <button className="ghost-button" type="button" disabled={!duplicateResult} onClick={() => explainRiskWithAi("duplicate")}><Icon name="auto_awesome" /> Jelaskan dengan AI</button>
          </div>
        </div>
      </section>

      {!isIncome ? (
        <section className={`insight-card ${budgetResult?.status === "Melebihi Anggaran" || budgetResult?.status === "Perlu Cek" ? "warning" : ""}`}>
          <span className="insight-icon"><Icon name="query_stats" /></span>
          <div style={{ width: "100%" }}>
            <strong>Budget Guard</strong>
            <p>{budgetResult?.message || "Pilih proyek dan isi nominal untuk melihat dampak ke anggaran."}</p>
            {budgetResult ? (
              <>
                <div className="progress"><span style={{ width: `${Math.min(100, budgetPercent)}%`, background: budgetResult.status === "Melebihi Anggaran" ? "var(--danger)" : budgetResult.status === "Perlu Cek" ? "var(--warning)" : "var(--income)" }} /></div>
                <p className="muted">{currency(budgetResult.used)} terpakai dari {currency(budgetResult.budget)}. Setelah transaksi: {currency(budgetResult.afterTransaction)} ({budgetResult.usagePercent}%).</p>
              </>
            ) : null}
            <div className="form-actions">
              <button className="ghost-button" type="button" onClick={handleAnalyzeBudget}><Icon name="analytics" /> Analisa Budget</button>
              <button className="ghost-button" type="button" disabled={!budgetResult} onClick={() => explainRiskWithAi("budget")}><Icon name="auto_awesome" /> Jelaskan dengan AI</button>
            </div>
          </div>
        </section>
      ) : null}

      {riskExplanation ? <article className="insight-card"><span className="insight-icon"><Icon name="auto_awesome" /></span><div><strong>Penjelasan AI Hemat</strong><p>{riskExplanation}</p></div></article> : null}

      <div className="receipt-box">
        <img alt="Pratinjau bukti transaksi" src={receiptPreview || "/assets/receipt-reference.png"} />
        <strong>Unggah Bukti</strong>
        <span className="muted">{uploadName || "JPG, PNG, WebP, PDF"}</span>
        <div className="form-actions">
          <button className="ghost-button" type="button" onClick={() => document.getElementById(proofInputId)?.click()}><Icon name="upload_file" /> Pilih File</button>
          <button className="ghost-button" type="button" disabled={!receiptFile || isScanning} onClick={handleScanReceipt}><Icon name="document_scanner" /> {isScanning ? "Memindai..." : "Scan dengan AI"}</button>
        </div>
        <input id={proofInputId} className="hidden-input" type="file" accept="image/*,application/pdf" onChange={(event) => handleUpload(event.target.files?.[0])} />
        {ocrResult ? (
          <div className="restore-preview" style={{ width: "100%" }}>
            <div className="restore-preview-row"><span>Tanggal</span><strong>{ocrResult.date || "-"}</strong></div>
            <div className="restore-preview-row"><span>Vendor/Sumber</span><strong>{ocrResult.vendor_or_source || "-"}</strong></div>
            <div className="restore-preview-row"><span>Kategori</span><strong>{ocrResult.category || "-"}</strong></div>
            <div className="restore-preview-row"><span>Nominal</span><strong>{currency(ocrResult.amount || 0)}</strong></div>
            <div className="restore-preview-row"><span>Pajak</span><strong>{currency(ocrResult.tax_amount || 0)}</strong></div>
            <div className="restore-preview-row"><span>Metode</span><strong>{ocrResult.payment_method || "-"}</strong></div>
            <div className="restore-preview-row"><span>Confidence</span><strong>{Math.round((ocrResult.confidence || 0) * 100)}%</strong></div>
            <button className="secondary-button" type="button" onClick={applyOcrResult}><Icon name="drive_file_move" /> Masukkan ke Form</button>
          </div>
        ) : null}
      </div>

      <button className="primary-button" style={{ width: "100%" }} type="submit" disabled={isSaving || isViewer}><Icon name="save" /> {isViewer ? "Mode Viewer" : isSaving ? "Menyimpan..." : saveConfirmed ? "Konfirmasi Simpan" : "Simpan Transaksi"}</button>
    </form>
  );
}
