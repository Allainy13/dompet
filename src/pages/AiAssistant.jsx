import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";

function QuickAction({ icon, title, text, onRun }) {
  return (
    <button className="quick-action" type="button" onClick={() => onRun(title)}>
      <span><Icon name={icon} /></span>
      <span><strong>{title}</strong><br /><span className="muted">{text}</span></span>
    </button>
  );
}

export default function AiAssistant({
  settings,
  aiUsageDetails,
  aiRuntime,
  aiMode,
  aiMessages,
  onAiModeChange,
  onResetAiUsage,
  onRunAi,
  onClearAi,
  onToast,
}) {
  const budget = aiRuntime?.monthlyBudget || 10;
  const usage = aiUsageDetails || aiRuntime?.usage || { totalCost: 0, remaining: budget, requestCount: 0, history: [], status: "safe", message: "" };
  const usagePercent = Math.min(100, usage.percent || 0);
  const activeMode = aiRuntime?.mode || "mock";

  function sendPrompt() {
    const field = document.getElementById("aiPrompt");
    const prompt = field?.value.trim() || "";
    if (!prompt) {
      onToast("Tulis pertanyaan dulu agar AI tetap hemat");
      return;
    }
    onRunAi(prompt);
    field.value = "";
  }

  const actions = (
    <div className="form-actions">
      <span className="chip active">AI Hemat</span>
      <span className="chip active">Budget {aiRuntime?.budgetLabel || "$10/bulan"}</span>
      <span className="chip active">{activeMode === "real" ? "Mode Real" : "Mode Demo"}</span>
    </div>
  );

  return (
    <section className="page">
      <PageHeader
        companyName={settings.companyName}
        title="AI Assistant Hemat"
        subtitle="AI hanya berjalan saat pengguna klik aksi atau mengirim pertanyaan. Private key disimpan di proxy, bukan browser."
        actions={actions}
      />

      <div className="assistant-layout">
        <aside className="assistant-card">
          <h2>Status Anggaran</h2>
          <div className="budget-meter">
            <div className="setting-row">
              <span>Terpakai</span>
              <strong>${Number(usage.totalCost || 0).toFixed(2)} / ${budget}</strong>
            </div>
            <div className="progress"><span style={{ width: `${usagePercent}%` }} /></div>
            <div className="restore-preview" style={{ marginTop: 12 }}>
              <div className="restore-preview-row"><span>Sisa budget</span><strong>${Number(usage.remaining || 0).toFixed(2)}</strong></div>
              <div className="restore-preview-row"><span>Request AI</span><strong>{usage.requestCount || 0}</strong></div>
              <div className="restore-preview-row"><span>Status</span><strong>{usage.status === "blocked" ? "Soft block" : usage.status === "danger" ? "Danger" : usage.status === "warning" ? "Warning" : "Aman"}</strong></div>
            </div>
            <p className="muted">{usage.message || "Tidak ada proses latar belakang. Setiap klik dihitung sebagai satu request."}</p>
            <button className="ghost-button" type="button" onClick={onResetAiUsage}><Icon name="restart_alt" /> Reset Usage Dummy</button>
          </div>

          <label className="field" style={{ marginTop: 16 }}>
            <span>Mode AI</span>
            <div className="segmented">
              <button className={aiMode === "mock" ? "active" : ""} type="button" onClick={() => onAiModeChange("mock")}>Demo/Mock</button>
              <button className={aiMode === "real" ? "active" : ""} type="button" disabled={!aiRuntime?.canUseReal} onClick={() => onAiModeChange("real")}>Real via Proxy</button>
            </div>
            <span className="muted">{aiRuntime?.canUseReal ? "Proxy tersedia. Mode real tetap lewat endpoint aman." : "Proxy belum tersedia, aplikasi memakai mock lokal."}</span>
          </label>

          <div className="ai-stack" style={{ marginTop: 16 }}>
            <QuickAction icon="summarize" title="Ringkas Laporan" text="Ringkas pemasukan, pengeluaran, dan arus kas bulan ini." onRun={onRunAi} />
            <QuickAction icon="compare_arrows" title="Cek Duplikat Transaksi" text="Cari transaksi mirip dari nominal, tanggal, vendor, project, dan bukti." onRun={onRunAi} />
            <QuickAction icon="query_stats" title="Analisa Budget Project" text="Hitung serapan budget dan dampak transaksi baru." onRun={onRunAi} />
            <QuickAction icon="report" title="Cari Transaksi Mencurigakan" text="Tandai nominal besar, duplikat, atau risiko approval." onRun={onRunAi} />
            <QuickAction icon="summarize" title="Laporan Owner" text="Ringkas angka utama, masalah penting, dan rekomendasi." onRun={onRunAi} />
            <QuickAction icon="request_quote" title="Laporan Finance" text="Detail pemasukan, pengeluaran, hutang/piutang, dan kas kecil." onRun={onRunAi} />
            <QuickAction icon="category" title="Kategori Otomatis" text="Sarankan kategori untuk input transaksi bebas." onRun={onRunAi} />
          </div>

          <section className="restore-preview" style={{ marginTop: 16 }}>
            <strong>Riwayat Request AI</strong>
            {(usage.history || []).slice(0, 5).length ? (usage.history || []).slice(0, 5).map((item, index) => (
              <div className="restore-preview-row" key={`${item.time}-${index}`}><span>{item.task}</span><strong>{item.mode} ${item.status === "blocked" ? "blocked" : `$${Number(item.estimatedCost || 0).toFixed(2)}`}</strong></div>
            )) : <p className="muted" style={{ margin: "8px 0 0" }}>Belum ada request AI bulan ini.</p>}
          </section>
        </aside>

        <section className="assistant-card assistant-chat">
          <div className="chat-window" id="chatWindow">
            {aiMessages.map((message, index) => (
              <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>
            ))}
          </div>
          <label className="field">
            <span>Pertanyaan atau input transaksi bebas</span>
            <textarea id="aiPrompt" className="textarea" placeholder="Contoh: bayar vendor kabel 12 juta dari Mandiri untuk proyek FTTH Barat" />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="button" onClick={sendPrompt}><Icon name="send" /> Kirim Saat Ini</button>
            <button className="ghost-button" type="button" onClick={onClearAi}><Icon name="delete" /> Bersihkan</button>
          </div>
        </section>
      </div>
    </section>
  );
}
