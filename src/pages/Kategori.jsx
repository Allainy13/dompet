import { useEffect, useState } from "react";
import { categoryGroups } from "../data/mockData.js";
import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TablePanel from "../components/TablePanel.jsx";
import { masterDataService } from "../services/masterDataService.js";
import { roleService } from "../services/roleService.js";

const emptyCategory = { name: "", group: "Pemasukan", status: "Aktif" };

function rowKey(item) {
  return item.id || `${item.group}-${item.name}`;
}

function groupIcon(group) {
  if (group === "Pemasukan") return "south_west";
  if (group === "Pengeluaran") return "north_east";
  return "account_balance_wallet";
}

export default function Kategori({ mock, settings, profile, currentRole = "Viewer", onToast }) {
  const [categories, setCategories] = useState(mock.categories);
  const [activeGroup, setActiveGroup] = useState("Pemasukan");
  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [form, setForm] = useState(emptyCategory);
  const canCreate = roleService.canCreate("kategori", currentRole);
  const canEdit = roleService.canEdit("kategori", currentRole);
  const canDelete = roleService.canDelete(currentRole);
  const filtered = categories.filter((item) => item.group === activeGroup);

  useEffect(() => {
    let isMounted = true;
    masterDataService.getCategories(profile?.company_id)
      .then((rows) => {
        if (isMounted) setCategories(rows);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [profile?.company_id]);

  function deny() {
    onToast(currentRole === "Viewer" ? "Mode Viewer" : "Akses ditolak");
  }

  function openCreate(group = activeGroup) {
    if (!canCreate) return deny();
    setEditingKey("");
    setForm({ ...emptyCategory, group });
    setFormOpen(true);
  }

  function openEdit(category) {
    if (!canEdit) return deny();
    setEditingKey(rowKey(category));
    setForm({ name: category.name, group: category.group, status: category.status || "Aktif" });
    setFormOpen(true);
  }

  async function saveCategory(event) {
    event.preventDefault();
    if (!form.name.trim()) return onToast("Nama kategori wajib diisi");

    const current = categories.find((item) => rowKey(item) === editingKey);
    const result = editingKey
      ? await masterDataService.updateCategory(current?.id || editingKey, { ...current, ...form }, profile?.company_id)
      : await masterDataService.createCategory(form, profile?.company_id);

    const nextCategory = result.uiCategory;
    if (editingKey) {
      setCategories((rows) => rows.map((item) => (rowKey(item) === editingKey ? { ...item, ...nextCategory } : item)));
    } else {
      setCategories((rows) => [nextCategory, ...rows]);
      setActiveGroup(nextCategory.group);
    }
    setFormOpen(false);
    onToast(result.error ? `Kategori disimpan lokal: ${result.error.message}` : result.isMock ? "Kategori disimpan di mode demo" : "Kategori disimpan ke Supabase");
  }

  async function toggleStatus(category) {
    if (!canEdit) return deny();
    const nextStatus = category.status === "Aktif" ? "Nonaktif" : "Aktif";
    const result = await masterDataService.updateCategory(category.id || rowKey(category), { ...category, status: nextStatus }, profile?.company_id);
    setCategories((rows) => rows.map((item) => (rowKey(item) === rowKey(category) ? { ...item, status: result.uiCategory?.status || nextStatus } : item)));
    onToast(result.isMock ? "Status kategori diubah di mode demo" : "Status kategori diubah");
  }

  async function removeCategory(category) {
    if (!canDelete) return deny();
    const result = await masterDataService.deleteCategory(category.id || rowKey(category), profile?.company_id);
    setCategories((rows) => rows.filter((item) => rowKey(item) !== rowKey(category)));
    onToast(result.isMock ? "Kategori dihapus dari state demo" : "Kategori dihapus");
  }

  return (
    <section className="page">
      <PageHeader companyName={settings.companyName} title="Kategori" subtitle="Kategori pemasukan, pengeluaran, dan kas kecil dengan aksi master data." actions={<button className="secondary-button" type="button" onClick={() => openCreate()}><Icon name="add" /> Tambah Kategori</button>} />
      <div className="module-grid">{categoryGroups.map((group) => <button className={`module-card vertical-card ${activeGroup === group ? "active" : ""}`} type="button" key={group} onClick={() => setActiveGroup(group)}><div><span className="label">Kategori {group}</span><h2>{categories.filter((item) => item.group === group).length}</h2><p className="muted">Aktif dan nonaktif tersedia</p></div><Icon name={groupIcon(group)} /></button>)}</div>

      <div className="filters" style={{ marginTop: 16, marginBottom: 12 }}>{categoryGroups.map((group) => <button className={`chip ${activeGroup === group ? "active" : ""}`} type="button" key={group} onClick={() => setActiveGroup(group)}>{group}</button>)}</div>

      {formOpen ? (
        <section className="form-panel" style={{ marginBottom: 16 }}>
          <h2>{editingKey ? "Edit Kategori" : "Tambah Kategori"}</h2>
          <form className="filter-grid" onSubmit={saveCategory}>
            <label className="field"><span>Nama Kategori</span><input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="field"><span>Grup</span><select className="select" value={form.group} onChange={(event) => setForm((current) => ({ ...current, group: event.target.value }))}>{categoryGroups.map((group) => <option key={group}>{group}</option>)}</select></label>
            <label className="field"><span>Status</span><select className="select" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option>Aktif</option><option>Nonaktif</option></select></label>
            <div className="form-actions"><button className="primary-button" type="submit"><Icon name="save" /> Simpan</button><button className="ghost-button" type="button" onClick={() => setFormOpen(false)}>Batal</button></div>
          </form>
        </section>
      ) : null}

      <TablePanel title={`Master Kategori ${activeGroup}`} style={{ marginTop: 16 }} headers={["Nama", "Grup", "Status", "Aksi"]} rows={filtered.map((item) => <tr key={rowKey(item)}><td className="table-name">{item.name}</td><td>{item.group}</td><td><StatusBadge status={item.status} /></td><td><button className="ghost-button" type="button" onClick={() => openEdit(item)}>Edit</button> <button className="ghost-button" type="button" onClick={() => toggleStatus(item)}>{item.status === "Aktif" ? "Nonaktif" : "Aktifkan"}</button> <button className="ghost-button" type="button" onClick={() => removeCategory(item)}>Hapus</button></td></tr>)} />
    </section>
  );
}
