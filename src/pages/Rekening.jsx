import { useEffect, useState } from "react";
import { currency } from "../data/mockData.js";
import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TablePanel from "../components/TablePanel.jsx";
import { masterDataService } from "../services/masterDataService.js";
import { roleService } from "../services/roleService.js";

const emptyAccount = { name: "", type: "Bank", number: "", owner: "", balance: "0", status: "Aktif" };

function rowKey(item) {
  return item.id || item.name;
}

export default function Rekening({ mock, settings, profile, currentRole = "Viewer", onToast }) {
  const [accounts, setAccounts] = useState(mock.accounts);
  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [form, setForm] = useState(emptyAccount);
  const canCreate = roleService.canCreate("rekening", currentRole);
  const canEdit = roleService.canEdit("rekening", currentRole);
  const canDelete = roleService.canDelete(currentRole);

  useEffect(() => {
    let isMounted = true;
    masterDataService.getAccounts(profile?.company_id)
      .then((rows) => {
        if (isMounted) setAccounts(rows);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [profile?.company_id]);

  function deny() {
    onToast(currentRole === "Viewer" ? "Mode Viewer" : "Akses ditolak");
  }

  function openCreate() {
    if (!canCreate) return deny();
    setEditingKey("");
    setForm(emptyAccount);
    setFormOpen(true);
  }

  function openEdit(account) {
    if (!canEdit) return deny();
    setEditingKey(rowKey(account));
    setForm({ name: account.name, type: account.type, number: account.number, owner: account.owner, balance: String(account.balance || 0), status: account.status || "Aktif" });
    setFormOpen(true);
  }

  async function saveAccount(event) {
    event.preventDefault();
    if (!form.name.trim()) return onToast("Nama rekening wajib diisi");

    const payload = { ...form, balance: Number(form.balance || 0) };
    const current = accounts.find((item) => rowKey(item) === editingKey);
    const result = editingKey
      ? await masterDataService.updateAccount(current?.id || editingKey, { ...current, ...payload }, profile?.company_id)
      : await masterDataService.createAccount(payload, profile?.company_id);

    const nextAccount = result.uiAccount;
    if (editingKey) {
      setAccounts((rows) => rows.map((item) => (rowKey(item) === editingKey ? { ...item, ...nextAccount } : item)));
    } else {
      setAccounts((rows) => [nextAccount, ...rows]);
    }
    setFormOpen(false);
    onToast(result.error ? `Rekening disimpan lokal: ${result.error.message}` : result.isMock ? "Rekening disimpan di mode demo" : "Rekening disimpan ke Supabase");
  }

  async function toggleStatus(account) {
    if (!canEdit) return deny();
    const nextStatus = account.status === "Aktif" ? "Nonaktif" : "Aktif";
    const result = await masterDataService.updateAccount(account.id || rowKey(account), { ...account, status: nextStatus }, profile?.company_id);
    setAccounts((rows) => rows.map((item) => (rowKey(item) === rowKey(account) ? { ...item, status: result.uiAccount?.status || nextStatus } : item)));
    onToast(result.isMock ? "Status rekening diubah di mode demo" : "Status rekening diubah");
  }

  async function removeAccount(account) {
    if (!canDelete) return deny();
    const result = await masterDataService.deleteAccount(account.id || rowKey(account), profile?.company_id);
    setAccounts((rows) => rows.filter((item) => rowKey(item) !== rowKey(account)));
    onToast(result.isMock ? "Rekening dihapus dari state demo" : "Rekening dihapus");
  }

  return (
    <section className="page">
      <PageHeader companyName={settings.companyName} title="Rekening" subtitle="Saldo rekening, tabel kas/bank, dan mutasi contoh." actions={<button className="secondary-button" type="button" onClick={openCreate}><Icon name="add" /> Tambah Rekening</button>} />

      {formOpen ? (
        <section className="form-panel" style={{ marginBottom: 16 }}>
          <h2>{editingKey ? "Edit Rekening" : "Tambah Rekening"}</h2>
          <form className="filter-grid" onSubmit={saveAccount}>
            <label className="field"><span>Nama Rekening</span><input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="field"><span>Tipe</span><select className="select" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}><option>Bank</option><option>Kas</option><option>Kas Kecil</option><option>E-Wallet</option></select></label>
            <label className="field"><span>Nomor</span><input className="input" value={form.number} onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))} /></label>
            <label className="field"><span>Bank/Pemilik</span><input className="input" value={form.owner} onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))} /></label>
            <label className="field"><span>Saldo</span><input className="input" type="number" value={form.balance} onChange={(event) => setForm((current) => ({ ...current, balance: event.target.value }))} /></label>
            <label className="field"><span>Status</span><select className="select" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option>Aktif</option><option>Nonaktif</option></select></label>
            <div className="form-actions"><button className="primary-button" type="submit"><Icon name="save" /> Simpan</button><button className="ghost-button" type="button" onClick={() => setFormOpen(false)}>Batal</button></div>
          </form>
        </section>
      ) : null}

      <div className="module-grid">{accounts.map((account) => <article className="module-card vertical-card" key={rowKey(account)}><div><span className="label">{account.type}</span><h2>{account.name}</h2><p className="muted">{account.number} - {account.owner}</p></div><strong className="metric-value">{currency(account.balance || 0)}</strong><StatusBadge status={account.status} /></article>)}</div>
      <TablePanel title="Tabel Kas/Bank" style={{ marginTop: 16 }} headers={["Rekening", "Jenis", "Nomor", "Saldo", "Status", "Aksi"]} rows={accounts.map((account) => <tr key={rowKey(account)}><td className="table-name">{account.name}</td><td>{account.type}</td><td>{account.number}</td><td className="money">{currency(account.balance || 0)}</td><td><StatusBadge status={account.status} /></td><td><button className="ghost-button" type="button" onClick={() => openEdit(account)}>Edit</button> <button className="ghost-button" type="button" onClick={() => toggleStatus(account)}>{account.status === "Aktif" ? "Nonaktif" : "Aktifkan"}</button> <button className="ghost-button" type="button" onClick={() => removeAccount(account)}>Hapus</button></td></tr>)} />
      <TablePanel title="Detail Mutasi" style={{ marginTop: 16 }} headers={["Tanggal", "Rekening", "Keterangan", "Debit", "Kredit", "Status"]} rows={mock.mutations.map((item) => <tr key={`${item.date}-${item.desc}`}><td>{item.date}</td><td>{item.account}</td><td className="table-name">{item.desc}</td><td className="money expense">{item.debit ? currency(item.debit) : "-"}</td><td className="money income">{item.credit ? currency(item.credit) : "-"}</td><td><StatusBadge status={item.status} /></td></tr>)} />
    </section>
  );
}
