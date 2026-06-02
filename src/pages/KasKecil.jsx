import { useEffect, useMemo, useState } from "react";
import { currency } from "../data/mockData.js";
import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TablePanel from "../components/TablePanel.jsx";
import { pettyCashService } from "../services/pettyCashService.js";
import { roleService } from "../services/roleService.js";

const emptyForm = { type: "spend", account_id: "", transaction_id: "", amount: "0", note: "", proof_url: "" };

function rowKey(item) {
  return item.id || `${item.date}-${item.desc}-${item.amount}`;
}

function summarize(rows, fallbackBalance = 0) {
  const topUpMonth = rows.filter((item) => item.type === "Isi Kas").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const spend = rows.filter((item) => item.type !== "Isi Kas").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return {
    balance: fallbackBalance || Math.max(0, topUpMonth - spend),
    topUpMonth,
    spendToday: spend,
    weeklySpend: spend,
    budgetRemaining: Math.max(0, (fallbackBalance || topUpMonth) - spend),
  };
}

export default function KasKecil({ mock, settings, profile, currentRole = "Viewer", onToast }) {
  const fallbackBalance = mock.accounts.find((item) => item.type === "Kas Kecil")?.balance || 0;
  const [entries, setEntries] = useState(mock.pettyCash);
  const [summary, setSummary] = useState(() => summarize(mock.pettyCash, fallbackBalance));
  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [form, setForm] = useState(emptyForm);
  const canCreate = roleService.canCreate("kas-kecil", currentRole);
  const canEdit = roleService.canEdit("kas-kecil", currentRole);
  const canDelete = roleService.canDelete(currentRole);
  const pettyAccounts = useMemo(() => mock.accounts.filter((item) => ["Kas Kecil", "Kas", "Bank", "E-Wallet"].includes(item.type)), [mock.accounts]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      pettyCashService.getPettyCash(profile?.company_id),
      pettyCashService.getPettyCashSummary(profile?.company_id),
    ]).then(([rows, nextSummary]) => {
      if (!isMounted) return;
      setEntries(rows);
      setSummary(nextSummary);
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [profile?.company_id]);

  function deny() {
    onToast(currentRole === "Viewer" ? "Mode Viewer" : "Akses ditolak");
  }

  function recalc(rows) {
    setSummary((current) => ({ ...current, ...summarize(rows, current.isMock ? fallbackBalance : 0) }));
  }

  function openCreate(type = "spend") {
    if (!canCreate) return deny();
    if (currentRole === "Staff" && type === "topup") return deny();
    setEditingKey("");
    setForm({ ...emptyForm, type });
    setFormOpen(true);
  }

  function openEdit(item) {
    if (!canEdit) return deny();
    setEditingKey(rowKey(item));
    setForm({ type: item.type === "Isi Kas" ? "topup" : "spend", account_id: item.account_id || "", transaction_id: item.transaction_id || "", amount: String(item.amount || 0), note: item.note || item.desc || "", proof_url: item.proof_url || "" });
    setFormOpen(true);
  }

  async function saveEntry(event) {
    event.preventDefault();
    if (currentRole === "Staff" && form.type === "topup") return deny();
    if (Number(form.amount || 0) <= 0) return onToast("Nominal kas kecil harus lebih dari 0");
    const current = entries.find((item) => rowKey(item) === editingKey);
    const result = editingKey
      ? await pettyCashService.updatePettyCashEntry(current?.id || editingKey, { ...current, ...form }, profile?.company_id)
      : form.type === "topup"
        ? await pettyCashService.topUpPettyCash(form, profile?.company_id)
        : await pettyCashService.spendPettyCash(form, profile?.company_id);
    const next = result.uiEntry;
    const nextRows = editingKey ? entries.map((item) => rowKey(item) === editingKey ? next : item) : [next, ...entries];
    setEntries(nextRows);
    recalc(nextRows);
    setFormOpen(false);
    onToast(result.error ? `Kas kecil disimpan lokal: ${result.error.message}` : result.isMock ? "Kas kecil disimpan di mode demo" : "Kas kecil disimpan ke Supabase");
  }

  async function removeEntry(item) {
    if (!canDelete) return deny();
    await pettyCashService.deletePettyCashEntry(item.id || rowKey(item), profile?.company_id);
    const nextRows = entries.filter((row) => rowKey(row) !== rowKey(item));
    setEntries(nextRows);
    recalc(nextRows);
    onToast("Transaksi kas kecil dihapus");
  }

  function mockUploadNote() {
    onToast("Upload nota kas kecil masih dummy. Storage bukti transaksi sudah siap untuk transaksi utama.");
  }

  return (
    <section className="page">
      <PageHeader companyName={settings.companyName} title="Kas Kecil" subtitle="Saldo, top up, pengeluaran harian, rekap mingguan, dan unggah nota dummy." actions={<><button className="secondary-button" type="button" onClick={() => openCreate("topup")}><Icon name="add_card" /> Top Up Kas</button><button className="ghost-button" type="button" onClick={() => openCreate("spend")}><Icon name="payments" /> Tambah Pengeluaran</button><button className="ghost-button" type="button" onClick={mockUploadNote}><Icon name="upload_file" /> Unggah Nota</button></>} />
      <div className="stat-grid">
        <article className="metric-card"><span className="label">Saldo Kas Kecil</span><strong className="metric-value">{currency(summary.balance || 0)}</strong><p className="muted">Kas Kecil HQ</p></article>
        <article className="metric-card"><span className="label">Top Up Bulan Ini</span><strong className="metric-value money income">{currency(summary.topUpMonth || 0)}</strong><p className="muted">Total isi kas</p></article>
        <article className="metric-card"><span className="label">Pengeluaran Hari Ini</span><strong className="metric-value money expense">{currency(summary.spendToday || 0)}</strong><p className="muted">Akumulasi berjalan</p></article>
        <article className="metric-card"><span className="label">Sisa Budget</span><strong className="metric-value">{currency(summary.budgetRemaining || 0)}</strong><p className="muted">Setelah rekap mingguan</p></article>
      </div>

      {formOpen ? (
        <section className="form-panel" style={{ marginBottom: 16 }}>
          <h2>{editingKey ? "Edit Kas Kecil" : form.type === "topup" ? "Top Up Kas" : "Tambah Pengeluaran Kas"}</h2>
          <form className="filter-grid" onSubmit={saveEntry}>
            <label className="field"><span>Jenis</span><select className="select" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}><option value="topup">Top Up</option><option value="spend">Pengeluaran</option></select></label>
            <label className="field"><span>Rekening</span><select className="select" value={form.account_id} onChange={(event) => setForm((current) => ({ ...current, account_id: event.target.value }))}><option value="">Kas Kecil HQ</option>{pettyAccounts.map((account) => <option key={account.id || account.name} value={account.id || account.name}>{account.name}</option>)}</select></label>
            <label className="field"><span>Nominal</span><input className="input" type="number" min="0" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} /></label>
            <label className="field"><span>Catatan</span><textarea className="textarea" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
            <label className="field"><span>Proof URL Opsional</span><input className="input" value={form.proof_url} onChange={(event) => setForm((current) => ({ ...current, proof_url: event.target.value }))} placeholder="Nota dummy atau URL" /></label>
            <div className="form-actions"><button className="primary-button" type="submit"><Icon name="save" /> Simpan</button><button className="ghost-button" type="button" onClick={() => setFormOpen(false)}>Batal</button></div>
          </form>
        </section>
      ) : null}

      <TablePanel title="Transaksi Kas Kecil" headers={["Tanggal", "Keterangan", "Jenis", "Nominal", "Status", "Aksi"]} rows={entries.map((item) => <tr key={rowKey(item)}><td>{item.date}</td><td className="table-name">{item.desc || item.note}</td><td>{item.type}</td><td className={`money ${item.type === "Isi Kas" ? "income" : "expense"}`}>{currency(item.amount)}</td><td><StatusBadge status={item.status} /></td><td><button className="ghost-button" type="button" onClick={() => openEdit(item)}>Edit</button> <button className="ghost-button" type="button" onClick={() => removeEntry(item)}>Hapus</button></td></tr>)} />
      <section className="settings-panel" style={{ marginTop: 16 }}>
        <h2>Rekap Mingguan</h2>
        <div className="restore-preview" style={{ marginTop: 12 }}>
          <div className="restore-preview-row"><span>Total pengeluaran minggu ini</span><strong>{currency(summary.weeklySpend || 0)}</strong></div>
          <div className="restore-preview-row"><span>Nota lengkap</span><strong>87%</strong></div>
          <div className="restore-preview-row"><span>Mode data</span><strong>{summary.isMock ? "Demo/Mock" : "Supabase"}</strong></div>
        </div>
      </section>
    </section>
  );
}
