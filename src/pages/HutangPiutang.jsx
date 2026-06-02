import { useEffect, useMemo, useState } from "react";
import { currency } from "../data/mockData.js";
import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TablePanel from "../components/TablePanel.jsx";
import { payableReceivableService } from "../services/payableReceivableService.js";
import { roleService } from "../services/roleService.js";

const statusFilters = ["Semua", "Belum Bayar", "Sebagian", "Lunas", "Jatuh Tempo"];
const emptyDebt = { vendor_name: "", invoice_no: "", project_id: "", invoice_date: "2026-06-01", due_date: "2026-06-10", total_amount: "0", paid_amount: "0", status: "Belum Bayar", note: "" };
const emptyReceivable = { client_name: "", invoice_no: "", project_id: "", invoice_date: "2026-06-01", due_date: "2026-06-10", total_amount: "0", received_amount: "0", status: "Belum Bayar", note: "" };

function rowKey(item) {
  return item.id || `${item.kind}-${item.party}-${item.invoice_no}`;
}

function toInputDate(value) {
  if (!value) return "2026-06-01";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return "2026-06-01";
}

function isNearDue(item) {
  if (["Lunas"].includes(item.status) || !item.due_date) return false;
  const diff = new Date(`${item.due_date}T00:00:00`).getTime() - Date.now();
  return diff <= 7 * 24 * 60 * 60 * 1000;
}

export default function HutangPiutang({ mock, settings, profile, currentRole = "Viewer", debtTab, onDebtTab, onToast }) {
  const [debts, setDebts] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [form, setForm] = useState(emptyDebt);
  const canCreate = roleService.canCreate("hutang-piutang", currentRole);
  const canEdit = roleService.canEdit("hutang-piutang", currentRole);
  const canDelete = roleService.canDelete(currentRole);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      payableReceivableService.getDebts(profile?.company_id),
      payableReceivableService.getReceivables(profile?.company_id),
    ]).then(([debtRows, receivableRows]) => {
      if (!isMounted) return;
      setDebts(debtRows);
      setReceivables(receivableRows);
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [profile?.company_id]);

  const rows = useMemo(() => {
    const source = debtTab === "Hutang" ? debts : receivables;
    return statusFilter === "Semua" ? source : source.filter((item) => item.status === statusFilter);
  }, [debtTab, debts, receivables, statusFilter]);

  function deny() {
    onToast(currentRole === "Viewer" ? "Mode Viewer" : "Akses ditolak");
  }

  function openCreate(kind = debtTab) {
    if (!canCreate) return deny();
    setEditingKey("");
    setForm(kind === "Hutang" ? emptyDebt : emptyReceivable);
    onDebtTab(kind);
    setFormOpen(true);
  }

  function openEdit(item) {
    if (!canEdit) return deny();
    setEditingKey(rowKey(item));
    if (debtTab === "Hutang") {
      setForm({ vendor_name: item.vendor_name || item.party, invoice_no: item.invoice_no || "", project_id: item.project_id || "", invoice_date: toInputDate(item.invoice_date), due_date: toInputDate(item.due_date), total_amount: String(item.total_amount || item.amount || 0), paid_amount: String(item.paid_amount || item.paid || 0), status: item.status || "Belum Bayar", note: item.note || "" });
    } else {
      setForm({ client_name: item.client_name || item.party, invoice_no: item.invoice_no || "", project_id: item.project_id || "", invoice_date: toInputDate(item.invoice_date), due_date: toInputDate(item.due_date), total_amount: String(item.total_amount || item.amount || 0), received_amount: String(item.received_amount || item.paid || 0), status: item.status || "Belum Bayar", note: item.note || "" });
    }
    setFormOpen(true);
  }

  async function saveItem(event) {
    event.preventDefault();
    const isDebt = debtTab === "Hutang";
    const name = isDebt ? form.vendor_name : form.client_name;
    if (!name.trim()) return onToast(`${isDebt ? "Vendor" : "Klien"} wajib diisi`);

    if (isDebt) {
      const current = debts.find((item) => rowKey(item) === editingKey);
      const result = editingKey
        ? await payableReceivableService.updateDebt(current?.id || editingKey, { ...current, ...form }, profile?.company_id)
        : await payableReceivableService.createDebt(form, profile?.company_id);
      const next = result.uiDebt;
      setDebts((items) => editingKey ? items.map((item) => rowKey(item) === editingKey ? next : item) : [next, ...items]);
      onToast(result.isMock ? "Hutang disimpan di mode demo" : "Hutang disimpan ke Supabase");
    } else {
      const current = receivables.find((item) => rowKey(item) === editingKey);
      const result = editingKey
        ? await payableReceivableService.updateReceivable(current?.id || editingKey, { ...current, ...form }, profile?.company_id)
        : await payableReceivableService.createReceivable(form, profile?.company_id);
      const next = result.uiReceivable;
      setReceivables((items) => editingKey ? items.map((item) => rowKey(item) === editingKey ? next : item) : [next, ...items]);
      onToast(result.isMock ? "Piutang disimpan di mode demo" : "Piutang disimpan ke Supabase");
    }
    setFormOpen(false);
  }

  async function partialPay(item) {
    if (!canEdit) return deny();
    const currentPaid = Number(item.paid || item.paid_amount || item.received_amount || 0);
    const total = Number(item.amount || item.total_amount || 0);
    const paid = Math.min(total, currentPaid + Math.max(1, Math.round((total - currentPaid) / 2)));
    const status = paid >= total ? "Lunas" : "Sebagian";
    if (debtTab === "Hutang") {
      const result = await payableReceivableService.updateDebt(item.id || rowKey(item), { ...item, paid_amount: paid, status }, profile?.company_id);
      setDebts((items) => items.map((row) => rowKey(row) === rowKey(item) ? result.uiDebt : row));
    } else {
      const result = await payableReceivableService.updateReceivable(item.id || rowKey(item), { ...item, received_amount: paid, status }, profile?.company_id);
      setReceivables((items) => items.map((row) => rowKey(row) === rowKey(item) ? result.uiReceivable : row));
    }
    onToast(`${debtTab} ditandai sebagian`);
  }

  async function markPaid(item) {
    if (!canEdit) return deny();
    const total = Number(item.amount || item.total_amount || 0);
    if (debtTab === "Hutang") {
      const result = await payableReceivableService.updateDebt(item.id || rowKey(item), { ...item, paid_amount: total, status: "Lunas" }, profile?.company_id);
      setDebts((items) => items.map((row) => rowKey(row) === rowKey(item) ? result.uiDebt : row));
    } else {
      const result = await payableReceivableService.updateReceivable(item.id || rowKey(item), { ...item, received_amount: total, status: "Lunas" }, profile?.company_id);
      setReceivables((items) => items.map((row) => rowKey(row) === rowKey(item) ? result.uiReceivable : row));
    }
    onToast(`${debtTab} ditandai lunas`);
  }

  async function removeItem(item) {
    if (!canDelete) return deny();
    if (debtTab === "Hutang") {
      await payableReceivableService.deleteDebt(item.id || rowKey(item), profile?.company_id);
      setDebts((items) => items.filter((row) => rowKey(row) !== rowKey(item)));
    } else {
      await payableReceivableService.deleteReceivable(item.id || rowKey(item), profile?.company_id);
      setReceivables((items) => items.filter((row) => rowKey(row) !== rowKey(item)));
    }
    onToast(`${debtTab} dihapus`);
  }

  const fieldName = debtTab === "Hutang" ? "vendor_name" : "client_name";
  const paidName = debtTab === "Hutang" ? "paid_amount" : "received_amount";

  return (
    <section className="page">
      <PageHeader companyName={settings.companyName} title="Hutang & Piutang" subtitle="Pantau jatuh tempo dan status pembayaran." actions={<button className="secondary-button" type="button" onClick={() => openCreate(debtTab)}><Icon name="add" /> Tambah {debtTab}</button>} />
      <div className="segmented page-tabs"><button className={debtTab === "Hutang" ? "active" : ""} type="button" onClick={() => { onDebtTab("Hutang"); setStatusFilter("Semua"); setFormOpen(false); }}>Hutang</button><button className={debtTab === "Piutang" ? "active" : ""} type="button" onClick={() => { onDebtTab("Piutang"); setStatusFilter("Semua"); setFormOpen(false); }}>Piutang</button></div>
      <div className="filters" style={{ marginTop: 12 }}>{statusFilters.map((status) => <button className={`chip ${statusFilter === status ? "active" : ""}`} type="button" key={status} onClick={() => setStatusFilter(status)}>{status}</button>)}</div>

      {formOpen ? (
        <section className="form-panel" style={{ marginTop: 16 }}>
          <h2>{editingKey ? `Edit ${debtTab}` : `Tambah ${debtTab}`}</h2>
          <form className="filter-grid" onSubmit={saveItem}>
            <label className="field"><span>{debtTab === "Hutang" ? "Vendor" : "Klien"}</span><input className="input" value={form[fieldName] || ""} onChange={(event) => setForm((current) => ({ ...current, [fieldName]: event.target.value }))} /></label>
            <label className="field"><span>No Invoice</span><input className="input" value={form.invoice_no || ""} onChange={(event) => setForm((current) => ({ ...current, invoice_no: event.target.value }))} /></label>
            <label className="field"><span>Proyek</span><select className="select" value={form.project_id || ""} onChange={(event) => setForm((current) => ({ ...current, project_id: event.target.value }))}><option value="">Operasional</option>{mock.projects.map((project) => <option key={project.id || project.name} value={project.id || project.name}>{project.name}</option>)}</select></label>
            <label className="field"><span>Tanggal Invoice</span><input className="input" type="date" value={form.invoice_date || ""} onChange={(event) => setForm((current) => ({ ...current, invoice_date: event.target.value }))} /></label>
            <label className="field"><span>Jatuh Tempo</span><input className="input" type="date" value={form.due_date || ""} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} /></label>
            <label className="field"><span>Total</span><input className="input" type="number" min="0" value={form.total_amount || "0"} onChange={(event) => setForm((current) => ({ ...current, total_amount: event.target.value }))} /></label>
            <label className="field"><span>{debtTab === "Hutang" ? "Terbayar" : "Diterima"}</span><input className="input" type="number" min="0" value={form[paidName] || "0"} onChange={(event) => setForm((current) => ({ ...current, [paidName]: event.target.value }))} /></label>
            <label className="field"><span>Status</span><select className="select" value={form.status || "Belum Bayar"} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>{statusFilters.filter((item) => item !== "Semua").map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="field"><span>Catatan</span><textarea className="textarea" value={form.note || ""} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
            <div className="form-actions"><button className="primary-button" type="submit"><Icon name="save" /> Simpan</button><button className="ghost-button" type="button" onClick={() => setFormOpen(false)}>Batal</button></div>
          </form>
        </section>
      ) : null}

      <TablePanel title={`Daftar ${debtTab}`} style={{ marginTop: 16 }} actions={<button className="ghost-button" type="button" onClick={() => openCreate(debtTab)}><Icon name="add" /> Tambah</button>} headers={["Pihak", "Invoice", "Jatuh Tempo", "Nominal", debtTab === "Hutang" ? "Terbayar" : "Diterima", "Status", "Aksi"]} rows={rows.map((item) => <tr key={rowKey(item)}><td className="table-name">{item.party}</td><td>{item.invoice_no}</td><td>{item.due} {isNearDue(item) ? <StatusBadge status="Dekat Tempo" /> : null}</td><td className="money">{currency(item.amount)}</td><td className="money income">{currency(item.paid)}</td><td><StatusBadge status={item.status} /></td><td><button className="ghost-button" type="button" onClick={() => openEdit(item)}>Edit</button> <button className="ghost-button" type="button" onClick={() => partialPay(item)}>Sebagian</button> <button className="ghost-button" type="button" onClick={() => markPaid(item)}>Lunas</button> <button className="ghost-button" type="button" onClick={() => removeItem(item)}>Hapus</button></td></tr>)} />
    </section>
  );
}
