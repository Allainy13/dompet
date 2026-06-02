import { useEffect, useMemo, useState } from "react";
import { currency, projectStatusFilters } from "../data/mockData.js";
import Icon from "../components/Icon.jsx";
import KpiCard from "../components/KpiCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TablePanel from "../components/TablePanel.jsx";
import { masterDataService } from "../services/masterDataService.js";
import { roleService } from "../services/roleService.js";

const emptyProject = { name: "", manager: "", budget: "0", status: "Aktif" };

function rowKey(item) {
  return item.id || item.name;
}

function projectSummary(projects) {
  const totalBudget = projects.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  const totalSpent = projects.reduce((sum, item) => sum + Number(item.spent || 0), 0);
  return {
    totalBudget,
    totalSpent,
    activeCount: projects.filter((item) => item.status === "Aktif").length,
    spentPercent: totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0,
  };
}

export default function Proyek({ mock, settings, profile, currentRole = "Viewer", projectFilter, onProjectFilter, onToast }) {
  const [projects, setProjects] = useState(mock.projects);
  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [form, setForm] = useState(emptyProject);
  const canCreate = roleService.canCreate("project", currentRole);
  const canEdit = roleService.canEdit("project", currentRole);
  const canDelete = roleService.canDelete(currentRole);
  const summary = useMemo(() => projectSummary(projects), [projects]);
  const filtered = projectFilter === "Semua" ? projects : projects.filter((item) => item.status === projectFilter);

  useEffect(() => {
    let isMounted = true;
    masterDataService.getProjects(profile?.company_id)
      .then((rows) => {
        if (isMounted) setProjects(rows);
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
    setForm(emptyProject);
    setFormOpen(true);
  }

  function openEdit(project) {
    if (!canEdit) return deny();
    setEditingKey(rowKey(project));
    setForm({ name: project.name, manager: project.manager, budget: String(project.budget || 0), status: project.status || "Aktif" });
    setFormOpen(true);
  }

  async function saveProject(event) {
    event.preventDefault();
    if (!form.name.trim()) return onToast("Nama proyek wajib diisi");

    const payload = { ...form, budget: Number(form.budget || 0) };
    const current = projects.find((item) => rowKey(item) === editingKey);
    const result = editingKey
      ? await masterDataService.updateProject(current?.id || editingKey, { ...current, ...payload }, profile?.company_id)
      : await masterDataService.createProject(payload, profile?.company_id);

    const nextProject = result.uiProject;
    if (editingKey) {
      setProjects((rows) => rows.map((item) => (rowKey(item) === editingKey ? { ...item, ...nextProject } : item)));
    } else {
      setProjects((rows) => [nextProject, ...rows]);
    }
    setFormOpen(false);
    onToast(result.error ? `Proyek disimpan lokal: ${result.error.message}` : result.isMock ? "Proyek disimpan di mode demo" : "Proyek disimpan ke Supabase");
  }

  async function toggleHold(project) {
    if (!canEdit) return deny();
    const nextStatus = project.status === "Hold" ? "Aktif" : "Hold";
    const result = await masterDataService.updateProject(project.id || rowKey(project), { ...project, status: nextStatus }, profile?.company_id);
    setProjects((rows) => rows.map((item) => (rowKey(item) === rowKey(project) ? { ...item, status: result.uiProject?.status || nextStatus } : item)));
    onToast(result.isMock ? "Status proyek diubah di mode demo" : "Status proyek diubah");
  }

  async function removeProject(project) {
    if (!canDelete) return deny();
    const result = await masterDataService.deleteProject(project.id || rowKey(project), profile?.company_id);
    setProjects((rows) => rows.filter((item) => rowKey(item) !== rowKey(project)));
    onToast(result.isMock ? "Proyek dihapus dari state demo" : "Proyek dihapus");
  }

  return (
    <section className="page">
      <PageHeader companyName={settings.companyName} title="Proyek" subtitle="Anggaran, progres, wawasan AI, dan status proyek aktif." actions={<button className="secondary-button" type="button" onClick={openCreate}><Icon name="add" /> Proyek Baru</button>} />
      <div className="stat-grid">
        <KpiCard label="Total Anggaran" value={currency(summary.totalBudget)} note="Dari master proyek" icon="account_balance_wallet" />
        <KpiCard label="Total Realisasi" value={currency(summary.totalSpent)} note={`${summary.spentPercent}% terserap`} icon="payments" tone="tone-ai" />
        <KpiCard label="Proyek Aktif" value={summary.activeCount} note="Status Aktif" icon="work" />
      </div>

      {formOpen ? (
        <section className="form-panel" style={{ marginBottom: 16 }}>
          <h2>{editingKey ? "Edit Proyek" : "Tambah Proyek"}</h2>
          <form className="filter-grid" onSubmit={saveProject}>
            <label className="field"><span>Nama Proyek</span><input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="field"><span>PIC</span><input className="input" value={form.manager} onChange={(event) => setForm((current) => ({ ...current, manager: event.target.value }))} /></label>
            <label className="field"><span>Anggaran</span><input className="input" type="number" min="0" value={form.budget} onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} /></label>
            <label className="field"><span>Status</span><select className="select" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option>Aktif</option><option>Hold</option><option>Selesai</option></select></label>
            <div className="form-actions"><button className="primary-button" type="submit"><Icon name="save" /> Simpan</button><button className="ghost-button" type="button" onClick={() => setFormOpen(false)}>Batal</button></div>
          </form>
        </section>
      ) : null}

      <div className="filters" style={{ marginBottom: 12 }}>{projectStatusFilters.map(({ value, label }) => <button className={`chip ${projectFilter === value ? "active" : ""}`} type="button" key={value} onClick={() => onProjectFilter(value)}>{label}</button>)}</div>
      <div className="module-grid project-cards">
        {filtered.map((project) => (
          <article className="module-card vertical-card" key={rowKey(project)}>
            <div><span className="label">{project.manager}</span><h2>{project.name}</h2><p className="muted">{project.insight}</p></div>
            <div className="progress"><span style={{ width: `${project.progress || 0}%`, background: project.status === "Hold" ? "var(--warning)" : "var(--income)" }} /></div>
            <div className="setting-row"><span className="money">{currency(project.spent || 0)} / {currency(project.budget || 0)}</span><StatusBadge status={project.status} /></div>
          </article>
        ))}
      </div>
      <TablePanel
        title="Tabel Proyek Aktif"
        style={{ marginTop: 16 }}
        actions={<button className="ghost-button" type="button" onClick={() => onToast("Filter proyek aktif") }><Icon name="filter_list" /> Filter</button>}
        headers={["Nama Proyek", "Manajer", "Anggaran", "Realisasi", "Progres Anggaran", "Status", "Aksi"]}
        rows={filtered.map((project) => (
          <tr key={rowKey(project)}><td className="table-name">{project.name}</td><td>{project.manager}</td><td className="money">{currency(project.budget || 0)}</td><td className="money">{currency(project.spent || 0)}</td><td><div className="progress"><span style={{ width: `${project.progress || 0}%`, background: project.status === "Hold" ? "var(--warning)" : "var(--income)" }} /></div><span className="muted">{project.progress || 0}%</span></td><td><StatusBadge status={project.status} /></td><td><button className="ghost-button" type="button" onClick={() => openEdit(project)}>Edit</button> <button className="ghost-button" type="button" onClick={() => toggleHold(project)}>{project.status === "Hold" ? "Aktifkan" : "Hold"}</button> <button className="ghost-button" type="button" onClick={() => removeProject(project)}>Hapus</button></td></tr>
        ))}
      />
    </section>
  );
}
