import { useEffect, useMemo, useState } from "react";
import { reportTypes } from "../data/mockData.js";
import Icon from "../components/Icon.jsx";
import KpiCard from "../components/KpiCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TablePanel from "../components/TablePanel.jsx";
import { activityLogService } from "../services/activityLogService.js";
import { aiService } from "../services/aiService.js";
import { reportService } from "../services/reportService.js";
import { roleService } from "../services/roleService.js";

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

function openPrintableReport(file) {
  try {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      downloadFile(file.fileName, file.contentType, file.content);
      return false;
    }

    printWindow.document.open();
    printWindow.document.write(file.content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 300);
    return true;
  } catch {
    downloadFile(file.fileName, file.contentType, file.content);
    return false;
  }
}

function uniqueOptions(values, fallbackLabel) {
  const options = Array.from(new Set(values.filter(Boolean)));
  return [fallbackLabel, ...options];
}

function tableCellClass(column, value) {
  if (["Nominal", "Masuk", "Keluar", "Total", "Dibayar", "Diterima", "Sisa", "Anggaran", "Realisasi"].includes(column)) return "money";
  if (String(value || "").startsWith("Rp")) return "money";
  return column === "Uraian" || column === "Proyek" ? "table-name" : "";
}

export default function Laporan({ mock, settings, profile, currentRole = "Viewer", isDemo, onToast }) {
  const [filters, setFilters] = useState({
    reportType: "cashflow",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    project: "Semua Proyek",
    account: "Semua Rekening",
    category: "Semua Kategori",
  });
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [whatsAppFallback, setWhatsAppFallback] = useState("");
  const [aiReport, setAiReport] = useState(null);
  const [aiReportKind, setAiReportKind] = useState("owner");
  const [isAiReportLoading, setIsAiReportLoading] = useState(false);

  const projectOptions = useMemo(() => uniqueOptions([...mock.projects.map((item) => item.name), ...mock.transactions.map((item) => item.project)], "Semua Proyek"), [mock.projects, mock.transactions]);
  const accountOptions = useMemo(() => uniqueOptions([...mock.accounts.map((item) => item.name), ...mock.transactions.map((item) => item.account)], "Semua Rekening"), [mock.accounts, mock.transactions]);
  const categoryOptions = useMemo(() => uniqueOptions([...mock.categories.map((item) => item.name), ...mock.transactions.map((item) => item.category)], "Semua Kategori"), [mock.categories, mock.transactions]);
  const canExport = roleService.canExport(currentRole);

  const serviceFilters = useMemo(() => ({ ...filters, companyId: profile?.company_id, isDemo }), [filters, isDemo, profile?.company_id]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    reportService.getReportPreview(serviceFilters)
      .then((nextReport) => {
        if (isMounted) setReport(nextReport);
      })
      .catch(() => {
        if (isMounted) onToast("Laporan gagal dimuat, memakai data lokal");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [serviceFilters, onToast]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
    setWhatsAppFallback("");
  }

  async function logReportAction(action) {
    await activityLogService.addActivityLog({
      company_id: profile?.company_id,
      user_id: profile?.id,
      module: "Laporan",
      action,
      description: report?.title || "Laporan",
    });
  }

  async function guardExport(action) {
    if (canExport) return true;
    const message = currentRole === "Viewer" ? "Mode Viewer" : "Role tidak memiliki akses ekspor laporan";
    await logReportAction(`Akses ditolak: ${action}`);
    onToast(message);
    return false;
  }

  async function handlePdfExport() {
    if (!(await guardExport("cetak PDF"))) return;
    const file = await reportService.exportPrintableReport(filters.reportType, serviceFilters);
    const opened = openPrintableReport(file);
    await logReportAction(opened ? "Cetak PDF" : "Download HTML cetak");
    onToast(opened ? "Jendela cetak PDF dibuka" : "Popup dibatasi browser, HTML cetak diunduh");
  }

  async function handleCsvExport() {
    if (!(await guardExport("export CSV"))) return;
    const file = await reportService.exportCsvReport(filters.reportType, serviceFilters);
    downloadFile(file.fileName, file.contentType, file.content);
    await logReportAction("Export CSV");
    onToast(file.isMock ? "CSV laporan dibuat dari data demo" : "CSV laporan diekspor");
  }

  async function handleJsonExport() {
    if (!(await guardExport("export JSON"))) return;
    const file = await reportService.exportJsonReport(filters.reportType, serviceFilters);
    downloadFile(file.fileName, file.contentType, file.content);
    await logReportAction("Export JSON");
    onToast(file.isMock ? "JSON laporan dibuat dari data demo" : "JSON laporan diekspor");
  }

  async function handleWhatsAppCopy() {
    if (!(await guardExport("copy WhatsApp"))) return;
    const text = await reportService.generateWhatsAppReport(serviceFilters);
    try {
      await navigator.clipboard.writeText(text);
      setWhatsAppFallback("");
      await logReportAction("Copy WhatsApp");
      onToast("Ringkasan WhatsApp tersalin");
    } catch {
      setWhatsAppFallback(text);
      await logReportAction("Copy WhatsApp fallback");
      onToast("Clipboard dibatasi browser, teks fallback ditampilkan");
    }
  }

  async function handleAiReport(kind = "owner", regenerate = false) {
    setAiReportKind(kind);
    setIsAiReportLoading(true);
    try {
      const useReal = aiService.getDefaultAiMode() === "real";
      const generators = {
        summary: () => aiService.generateMonthlyFinanceSummary(mock, serviceFilters),
        owner: () => aiService.generateOwnerReport(mock, serviceFilters, { forceReal: useReal, regenerate }),
        manager: () => aiService.generateManagerReport(mock, serviceFilters, { forceReal: useReal, regenerate }),
        finance: () => aiService.generateFinanceReport(mock, serviceFilters, { forceReal: useReal, regenerate }),
      };
      const nextReport = await (generators[kind] || generators.owner)();
      setAiReport(nextReport);
      await logReportAction(`AI report ${kind}`);
      onToast(nextReport.mode === "real" ? "Laporan AI real dibuat" : nextReport.cached ? "Laporan AI dari cache sementara" : "Laporan AI demo dibuat");
    } catch (error) {
      onToast(error.message || "Laporan AI gagal dibuat");
    } finally {
      setIsAiReportLoading(false);
    }
  }

  async function handleAiWhatsAppCopy() {
    if (!(await guardExport("copy WhatsApp AI"))) return;
    const source = aiReport || await aiService.generateOwnerReport(mock, serviceFilters, { forceReal: aiService.getDefaultAiMode() === "real" });
    const text = `LAPORAN AI DOMPET PT\n${source.text}`;
    try {
      await navigator.clipboard.writeText(text);
      setWhatsAppFallback("");
      await logReportAction("Copy WhatsApp AI");
      onToast("Ringkasan WhatsApp AI tersalin");
    } catch {
      setWhatsAppFallback(text);
      await logReportAction("Copy WhatsApp AI fallback");
      onToast("Clipboard dibatasi browser, teks AI ditampilkan");
    }
  }

  async function handleAiJsonDownload() {
    if (!(await guardExport("download JSON AI"))) return;
    const source = aiReport || await aiService.generateOwnerReport(mock, serviceFilters);
    downloadFile(`dompet-pt-ai-report-${source.kind || aiReportKind}.json`, "application/json", JSON.stringify(source, null, 2));
    await logReportAction("Download JSON AI");
    onToast("JSON laporan AI diunduh");
  }

  const actions = (
    <>
      <button className="ghost-button" type="button" onClick={handlePdfExport}><Icon name="picture_as_pdf" /> Cetak PDF</button>
      <button className="ghost-button" type="button" onClick={handleCsvExport}><Icon name="table_view" /> Ekspor CSV</button>
      <button className="ghost-button" type="button" onClick={handleJsonExport}><Icon name="data_object" /> Ekspor JSON</button>
      <button className="ghost-button" type="button" onClick={handleWhatsAppCopy}><Icon name="content_copy" /> Copy WhatsApp</button>
    </>
  );

  const summary = report?.summary;
  const rows = report?.rows || [];
  const columns = report?.columns || ["Item", "Nilai", "Catatan"];

  return (
    <section className="page">
      <PageHeader companyName={settings.companyName} title="Laporan" subtitle="Ringkasan laporan keuangan dengan filter periode, proyek, rekening, kategori, dan export ringan tanpa dependency tambahan." actions={actions} />

      <div className="kpi-grid">
        <KpiCard label="Total Pemasukan" value={summary?.incomeLabel || "Rp 0"} note="Sesuai filter aktif" icon="south_west" />
        <KpiCard label="Total Pengeluaran" value={summary?.expenseLabel || "Rp 0"} note="Vendor dan operasional" icon="north_east" tone="tone-expense" />
        <KpiCard label="Saldo Bersih" value={summary?.netLabel || "Rp 0"} note={numberValue(summary?.net) >= 0 ? "Positif" : "Perlu cek"} icon="account_balance" />
        <KpiCard label="Transaksi" value={summary?.transactions || 0} note={report?.isMock ? "Mode demo/mock" : "Data Supabase"} icon="receipt_long" tone="tone-ai" />
      </div>

      <div className="report-grid">
        {reportTypes.map(({ value, title, text, icon, featured }) => (
          <button className={`report-card ${featured ? "featured" : ""} ${filters.reportType === value ? "active" : ""}`} type="button" key={value} onClick={() => updateFilter("reportType", value)}>
            <div><span><Icon name={icon} /></span><h2>{title}</h2><p className="muted">{text}</p></div><Icon name="chevron_right" />
          </button>
        ))}
      </div>

      <section className="form-panel" style={{ marginTop: 16 }}>
        <h2>Filter Laporan</h2>
        <div className="filter-grid">
          <label className="field"><span>Tanggal Awal</span><input className="input" type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} /></label>
          <label className="field"><span>Tanggal Akhir</span><input className="input" type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} /></label>
          <label className="field"><span>Proyek</span><select className="select" value={filters.project} onChange={(event) => updateFilter("project", event.target.value)}>{projectOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Rekening</span><select className="select" value={filters.account} onChange={(event) => updateFilter("account", event.target.value)}>{accountOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Kategori</span><select className="select" value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}>{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
      </section>

      <section className="settings-panel" style={{ marginTop: 16 }}>
        <div className="table-header">
          <div><h2 className="table-title">Ringkasan {report?.title || "Laporan"}</h2><p className="muted" style={{ margin: "4px 0 0" }}>{report?.summaryText || "Memuat ringkasan laporan..."}</p></div>
          <span className="chip active">{report?.isMock ? "Demo/Mock" : "Supabase"}</span>
        </div>
        <div className="restore-preview" style={{ marginTop: 12 }}>
          <div className="restore-preview-row"><span>Periode</span><strong>{report?.period || "-"}</strong></div>
          <div className="restore-preview-row"><span>Jenis laporan</span><strong>{report?.title || "-"}</strong></div>
          <div className="restore-preview-row"><span>Catatan</span><strong>{report?.note || "Tidak ada catatan"}</strong></div>
        </div>
      </section>

      <section className="settings-panel" style={{ marginTop: 16 }}>
        <div className="table-header">
          <div>
            <h2 className="table-title">Laporan Otomatis AI</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>AI hanya berjalan saat tombol diklik. Data diringkas lokal sebelum dikirim ke proxy.</p>
          </div>
          <span className="chip active">{aiService.getAiRuntimeInfo().modeLabel}</span>
        </div>
        <div className="form-actions" style={{ marginTop: 12 }}>
          <button className="ghost-button" type="button" disabled={isAiReportLoading} onClick={() => handleAiReport("summary", true)}><Icon name="auto_awesome" /> Ringkas dengan AI</button>
          <button className="ghost-button" type="button" disabled={isAiReportLoading} onClick={() => handleAiReport("owner", true)}><Icon name="person" /> Buat Laporan Owner</button>
          <button className="ghost-button" type="button" disabled={isAiReportLoading} onClick={() => handleAiReport("manager", true)}><Icon name="supervisor_account" /> Buat Laporan Manager</button>
          <button className="ghost-button" type="button" disabled={isAiReportLoading} onClick={() => handleAiReport("finance", true)}><Icon name="request_quote" /> Buat Laporan Finance</button>
          <button className="ghost-button" type="button" disabled={isAiReportLoading} onClick={handleAiWhatsAppCopy}><Icon name="content_copy" /> Copy WhatsApp AI</button>
        </div>
        {isAiReportLoading ? <p className="muted" style={{ marginTop: 12 }}>Menyusun laporan AI hemat...</p> : null}
        {aiReport ? (
          <div className="restore-preview" style={{ marginTop: 12 }}>
            <div className="restore-preview-row"><span>Jenis</span><strong>{aiReport.title}</strong></div>
            <div className="restore-preview-row"><span>Mode</span><strong>{aiReport.mode === "real" ? "Real via Proxy" : "Demo/Mock"}</strong></div>
            <div className="restore-preview-row"><span>Cache</span><strong>{aiReport.cached ? "Ya" : "Tidak"}</strong></div>
            <label className="field" style={{ marginTop: 10 }}><span>Hasil laporan</span><textarea className="textarea" value={aiReport.text || ""} readOnly /></label>
            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={handleAiWhatsAppCopy}><Icon name="content_copy" /> Copy</button>
              <button className="ghost-button" type="button" onClick={handleAiJsonDownload}><Icon name="data_object" /> Download JSON</button>
              <button className="ghost-button" type="button" onClick={() => handleAiReport(aiReport.kind || aiReportKind, true)}><Icon name="refresh" /> Regenerate</button>
            </div>
          </div>
        ) : !isAiReportLoading ? <div className="empty-state" style={{ marginTop: 12 }}><Icon name="auto_awesome" /><strong>Belum ada laporan AI</strong><p>Klik salah satu tombol untuk membuat ringkasan otomatis.</p></div> : null}
      </section>

      <TablePanel
        title={isLoading ? "Memuat Pratinjau Laporan" : "Pratinjau Laporan"}
        actions={<StatusBadge status={rows.length ? "Aman" : "Draft"} />}
        style={{ marginTop: 16 }}
        headers={columns}
        rows={rows.length ? rows.map((row, index) => (
          <tr key={`${report?.type || "report"}-${index}`}>
            {columns.map((column) => <td className={tableCellClass(column, row[column])} key={column}>{row[column] || "-"}</td>)}
          </tr>
        )) : [<tr key="empty-report"><td colSpan={columns.length} className="muted">Tidak ada data untuk filter ini.</td></tr>]}
      />

      {whatsAppFallback ? (
        <section className="form-panel" style={{ marginTop: 16 }}>
          <h2>Fallback Copy WhatsApp</h2>
          <label className="field"><span>Teks laporan</span><textarea className="textarea" value={whatsAppFallback} readOnly /></label>
        </section>
      ) : null}
    </section>
  );
}

function numberValue(value) {
  return Number(value || 0);
}