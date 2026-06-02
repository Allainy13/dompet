import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { Logo } from "../components/Sidebar.jsx";
import { settingsService } from "../services/settingsService.js";

export default function Settings({ mock, settings, profile, aiRuntime, onResetAiUsage, setSettings, restorePreview, setRestorePreview, onBackup, onExportLog, onApplyRestore, onToast }) {
  const colors = ["#b9c7e4", "#4edea3", "#4cd7f6", "#f7c66a", "#ffb4ab"];
  const aiUsage = aiRuntime?.usage || { totalCost: 0, remaining: aiRuntime?.monthlyBudget || 10, requestCount: 0, status: "safe", blockedCount: 0 };

  async function persistSettings(nextSettings, successMessage) {
    setSettings(nextSettings);
    const result = await settingsService.updateCompanySettings(nextSettings, profile?.company_id);
    if (result.error) {
      onToast(`Pengaturan disimpan lokal: ${result.error.message}`);
      return;
    }
    onToast(result.isMock ? `${successMessage} di mode demo` : successMessage);
  }

  async function saveIdentity() {
    const appName = document.getElementById("settingAppName").value.trim() || "DOMPET PT AI";
    const tagline = document.getElementById("settingTagline").value.trim() || "Pusat kontrol keuangan hemat anggaran";
    const companyName = document.getElementById("settingCompany").value.trim() || "PT Operasional Fiber Nusantara";
    await persistSettings({ ...settings, appName, tagline, companyName }, "Identitas perusahaan disimpan");
  }

  async function previewLogo(file) {
    if (!file) return;
    const result = await settingsService.updateCompanyLogo(file, profile?.company_id);
    const logo = result.data?.logo || "";
    if (logo) setSettings((current) => ({ ...current, logo }));
    onToast(result.error ? `Upload logo gagal: ${result.message || result.error.message}` : result.isMock ? "Logo dipratinjau di mode demo" : "Logo perusahaan diunggah");
  }

  async function previewRestore(file) {
    if (!file) return;
    try {
      const data = await settingsService.previewRestoreMock(file);
      setRestorePreview(data);
      onToast("Pratinjau pulihkan berhasil dibaca");
    } catch {
      onToast("File restore bukan JSON valid");
    }
  }

  return (
    <section className="page">
      <PageHeader companyName={settings.companyName} title="Pengaturan" subtitle="Kontrol identitas aplikasi, tema, cadangan dan pemulihan, log aktivitas, akses pengguna, dan keamanan." />
      <div className="settings-grid">
        <div className="stack">
          <section className="settings-panel"><h2>Identitas Aplikasi</h2><div className="form-grid"><label className="field"><span>Nama Aplikasi</span><input id="settingAppName" className="input" defaultValue={settings.appName} /></label><label className="field"><span>Tagline</span><input id="settingTagline" className="input" defaultValue={settings.tagline} /></label><label className="field"><span>Nama Perusahaan</span><input id="settingCompany" className="input" defaultValue={settings.companyName} /></label><div className="logo-preview"><Logo settings={settings} /><div><strong>Logo Aplikasi</strong><p className="muted" style={{ margin: "4px 0 10px" }}>Unggah logo ke Storage atau pratinjau demo.</p><button className="ghost-button" type="button" onClick={() => document.getElementById("logoInput").click()}><Icon name="upload" /> Unggah Logo</button><input id="logoInput" className="hidden-input" type="file" accept="image/*" onChange={(event) => previewLogo(event.target.files?.[0])} /></div></div><button className="primary-button" type="button" onClick={saveIdentity}><Icon name="save" /> Terapkan Identitas</button></div></section>
          <section className="settings-panel"><h2>Tema</h2><div className="form-grid"><div className="field"><span>Pilih Warna Utama</span><div className="swatches">{colors.map((color) => <button className={`swatch ${settings.primary === color ? "active" : ""}`} type="button" style={{ "--swatch": color }} aria-label={`Warna ${color}`} key={color} onClick={() => persistSettings({ ...settings, primary: color }, "Warna utama disimpan")} />)}</div></div><div className="field"><span>Mode Tampilan</span><div className="segmented">{[["dark", "Gelap"], ["light", "Terang"], ["system", "Sistem"]].map(([theme, label]) => <button className={settings.theme === theme ? "active" : ""} type="button" key={theme} onClick={() => persistSettings({ ...settings, theme }, "Mode tema disimpan")}>{label}</button>)}</div></div></div></section>
          <section className="settings-panel"><h2>Backup & Restore</h2><div className="backup-actions"><button className="secondary-button" type="button" onClick={onBackup}><Icon name="download" /> Cadangkan Data</button><button className="ghost-button" type="button" onClick={() => document.getElementById("restoreInput").click()}><Icon name="upload_file" /> Pulihkan Data</button><input id="restoreInput" className="hidden-input" type="file" accept="application/json" onChange={(event) => previewRestore(event.target.files?.[0])} /><button className="ghost-button" type="button" onClick={() => { setRestorePreview({ appName: "DOMPET PT AI Dipulihkan", transactions: 128, logs: 42 }); onToast("Pratinjau pulihkan contoh ditampilkan"); }}><Icon name="preview" /> Pratinjau Pulihkan</button><button className="ghost-button" type="button" onClick={onExportLog}><Icon name="article" /> Ekspor Log</button></div><div className="restore-preview" style={{ marginTop: 12 }}>{restorePreview ? <><div className="restore-preview-row"><span>Nama aplikasi</span><strong>{restorePreview.appName || "Tidak ada"}</strong></div><div className="restore-preview-row"><span>Total transaksi</span><strong>{restorePreview.transactions || 0}</strong></div><div className="restore-preview-row"><span>Log aktivitas</span><strong>{restorePreview.logs || 0}</strong></div><button className="primary-button" type="button" onClick={onApplyRestore}><Icon name="restore" /> Terapkan Pulihkan Contoh</button></> : <div><strong>Belum ada pratinjau pulihkan</strong><p className="muted" style={{ margin: "4px 0 0" }}>Unggah JSON atau gunakan contoh pratinjau. Data tidak diterapkan otomatis.</p></div>}</div></section>
        </div>
        <div className="stack"><section className="settings-panel"><h2>AI Hemat & Budget</h2><div className="restore-preview"><div className="restore-preview-row"><span>AI Mode</span><strong>Hemat</strong></div><div className="restore-preview-row"><span>Monthly Budget</span><strong>{aiRuntime?.budgetLabel || "$10/bulan"}</strong></div><div className="restore-preview-row"><span>Provider</span><strong>{aiRuntime?.canUseReal ? "DeepSeek / Proxy" : "Mock Lokal"}</strong></div><div className="restore-preview-row"><span>Proxy URL</span><StatusBadge status={aiRuntime?.proxyConfigured ? "Aktif" : "Nonaktif"} /></div><div className="restore-preview-row"><span>Terpakai</span><strong>${Number(aiUsage.totalCost || 0).toFixed(2)}</strong></div><div className="restore-preview-row"><span>Sisa</span><strong>${Number(aiUsage.remaining || 0).toFixed(2)}</strong></div><div className="restore-preview-row"><span>Request</span><strong>{aiUsage.requestCount || 0}</strong></div><div className="restore-preview-row"><span>Blocked</span><strong>{aiUsage.blockedCount || 0}</strong></div></div><div className="form-actions" style={{ marginTop: 12 }}><button className="ghost-button" type="button" onClick={onResetAiUsage}><Icon name="restart_alt" /> Reset Usage Dummy</button><button className="ghost-button" type="button" onClick={() => onToast(aiUsage.message || "AI mode hemat aktif") }><Icon name="info" /> Cek Status</button></div></section><section className="settings-panel"><h2>Log Aktivitas Pengguna</h2><div className="activity-list">{mock.logs.map((log) => <div className="activity-item" key={`${log.time}-${log.action}`}><div><strong>{log.action}</strong><br /><span className="muted">{log.time} - {log.user}</span></div><span className="chip">{log.module}</span></div>)}</div></section><section className="settings-panel"><h2>Akses Pengguna dan Keamanan</h2><div className="setting-row"><div><strong>Peran Pemilik Keuangan</strong><br /><span className="muted">Akses penuh dashboard dan pengaturan</span></div><StatusBadge status="Aktif" /></div><div className="setting-row"><div><strong>Approval 2 langkah</strong><br /><span className="muted">Wajib untuk transaksi di atas Rp 50 jt</span></div><StatusBadge status="Aktif" /></div><div className="setting-row"><div><strong>Batas sesi</strong><br /><span className="muted">30 menit tanpa aktivitas</span></div><StatusBadge status="Aktif" /></div></section></div>
      </div>
    </section>
  );
}
