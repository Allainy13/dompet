import { useState } from "react";
import { currency, getApprovalSummary } from "../data/mockData.js";
import Icon from "../components/Icon.jsx";
import KpiCard from "../components/KpiCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Approval({ mock, settings, currentRole, canApprove, onApprovalDetail, onApprovalAction, onToast }) {
  const { pending, urgent, approved, rejected } = getApprovalSummary(mock);
  const [notes, setNotes] = useState({});

  function updateNote(id, value) {
    setNotes((current) => ({ ...current, [id]: value }));
  }

  function runAction(id, action) {
    onApprovalAction(id, action, notes[id] || "");
  }

  return (
    <section className="page">
      <PageHeader
        companyName={settings.companyName}
        title="Approval"
        subtitle="Tinjau transaksi, risiko AI, dan tindakan persetujuan."
        actions={<div className="form-actions"><StatusBadge status={currentRole || "Viewer"} /><button className="ghost-button" type="button" onClick={() => onToast(canApprove ? "Role boleh approval" : "Role hanya lihat approval")}><Icon name="admin_panel_settings" /> Role Saat Ini</button></div>}
      />
      <div className="stat-grid four-stat-grid">
        <KpiCard label="Menunggu" value={pending} note="Butuh tindak lanjut" icon="hourglass_top" tone="tone-warning" />
        <KpiCard label="Mendesak" value={urgent} note="Prioritas hari ini" icon="priority_high" tone="tone-expense" />
        <KpiCard label="Disetujui" value={approved} note="Sudah aman" icon="verified" />
        <KpiCard label="Ditolak" value={rejected} note="Perlu revisi" icon="block" tone="tone-expense" />
      </div>
      <section className="table-panel">
        <div className="table-header"><h2 className="table-title">Daftar Approval</h2><button className="ghost-button" type="button" onClick={() => onToast("Filter approval contoh aktif")}><Icon name="filter_list" /> Filter</button></div>
        <div className="approval-list enhanced-list">
          {mock.approvals.map((item) => (
            <article className="approval-card" key={item.id}>
              <div className="approval-top">
                <div><span className="label">{item.id} - {item.date}</span><h3>{item.desc}</h3><p className="muted">{item.requester} - {item.unit} - {item.project}</p></div>
                <div className="approval-amount"><strong>{currency(item.amount)}</strong><StatusBadge status={item.status} /></div>
              </div>
              <div className="approval-meta"><StatusBadge status={item.risk} /><span className="muted">Anggaran terpakai {item.budgetUsed}%</span><StatusBadge status={item.urgent ? "Urgent" : "Aman"} /></div>
              <label className="field"><span>Catatan Approval</span><textarea className="textarea" value={notes[item.id] || ""} onChange={(event) => updateNote(item.id, event.target.value)} placeholder="Tulis catatan singkat sebelum setujui, tolak, atau minta revisi..." /></label>
              <div className="form-actions">
                <button className="secondary-button" type="button" disabled={!canApprove} onClick={() => runAction(item.id, "approved")}><Icon name="check" /> Setujui</button>
                <button className="danger-button" type="button" disabled={!canApprove} onClick={() => runAction(item.id, "rejected")}><Icon name="close" /> Tolak</button>
                <button className="ghost-button" type="button" disabled={!canApprove} onClick={() => runAction(item.id, "revision_requested")}><Icon name="edit_note" /> Minta Revisi</button>
                <button className="ghost-button" type="button" onClick={() => onApprovalDetail(item.id)}><Icon name="open_in_full" /> Detail</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
