import { useState } from "react";
import { currency } from "../data/mockData.js";
import Icon from "./Icon.jsx";
import StatusBadge from "./StatusBadge.jsx";
import TransactionForm from "./TransactionForm.jsx";

export default function Drawer({ drawer, approvalItem, mock, profile, canApprove, onClose, onOpenDrawer, onSaveTransaction, onApprovalAction, onToast }) {
  if (!drawer) return null;
  if (drawer === "approval") {
    return <ApprovalDrawer item={approvalItem} canApprove={canApprove} onClose={onClose} onApprovalAction={onApprovalAction} />;
  }
  return <TransactionDrawer type={drawer} mock={mock} profile={profile} onClose={onClose} onOpenDrawer={onOpenDrawer} onSaveTransaction={onSaveTransaction} onToast={onToast} />;
}

function TransactionDrawer({ type, mock, profile, onClose, onOpenDrawer, onSaveTransaction, onToast }) {
  const isIncome = type === "income";
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label="Form transaksi">
        <div className="drawer-header">
          <h2>{isIncome ? "Tambah Pemasukan" : "Tambah Pengeluaran"}</h2>
          <button className="icon-button" type="button" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          <TransactionForm type={type} mock={mock} profile={profile} onSubmit={onSaveTransaction} onSwitchType={onOpenDrawer} onToast={onToast} />
        </div>
        <div className="drawer-footer"><span className="muted">{isIncome ? "Pemasukan" : "Pengeluaran"} disimpan ke Supabase jika konfigurasi siap, selain itu ke state mock.</span></div>
      </aside>
    </>
  );
}

function ApprovalDrawer({ item, canApprove, onClose, onApprovalAction }) {
  const [note, setNote] = useState("");

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label="Detail approval">
        <div className="drawer-header">
          <h2>Detail Approval</h2>
          <button className="icon-button" type="button" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          <div className="detail-stack">
            <div className="amount-preview"><span className="label">{item.id}</span><strong>{currency(item.amount)}</strong><span className="muted">{item.desc}</span></div>
            <div className="restore-preview">
              <div className="restore-preview-row"><span>Pemohon</span><strong>{item.requester}</strong></div>
              <div className="restore-preview-row"><span>Unit</span><strong>{item.unit}</strong></div>
              <div className="restore-preview-row"><span>Proyek</span><strong>{item.project}</strong></div>
              <div className="restore-preview-row"><span>Tanggal</span><strong>{item.date}</strong></div>
              <div className="restore-preview-row"><span>Status</span><StatusBadge status={item.status} /></div>
              <div className="restore-preview-row"><span>Risiko AI</span><StatusBadge status={item.risk} /></div>
            </div>
            <article className="insight-card warning">
              <span className="insight-icon"><Icon name="auto_awesome" /></span>
              <div><strong>Catatan AI</strong><p>{item.evidence}. Anggaran terpakai {item.budgetUsed}%.</p></div>
            </article>
            <label className="field"><span>Catatan Approval</span><textarea className="textarea" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Tambahkan catatan approval..." /></label>
          </div>
        </div>
        <div className="drawer-footer form-actions">
          <button className="secondary-button" type="button" disabled={!canApprove} onClick={() => onApprovalAction(item.id, "approved", note)}><Icon name="check" /> Setujui</button>
          <button className="danger-button" type="button" disabled={!canApprove} onClick={() => onApprovalAction(item.id, "rejected", note)}><Icon name="close" /> Tolak</button>
          <button className="ghost-button" type="button" disabled={!canApprove} onClick={() => onApprovalAction(item.id, "revision_requested", note)}><Icon name="edit_note" /> Minta Revisi</button>
        </div>
      </aside>
    </>
  );
}
