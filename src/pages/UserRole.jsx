import { getPermissionStatus, permissions, userRoles } from "../data/mockData.js";
import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TablePanel from "../components/TablePanel.jsx";
import { roleService } from "../services/roleService.js";

export default function UserRole({ mock, settings, currentRole, onToast }) {
  const canManageUsers = roleService.canEdit("settings", currentRole) || currentRole === "Super Admin";

  function handleEditRole(user) {
    if (!canManageUsers) {
      onToast(currentRole === "Viewer" ? "Mode Viewer" : "Role tidak boleh ubah pengguna");
      return;
    }
    onToast(`Edit role ${user.name} masih dummy`);
  }

  return (
    <section className="page">
      <PageHeader
        companyName={settings.companyName}
        title="User & Role"
        subtitle="Peran, pengguna, dan matriks izin contoh."
        actions={<div className="form-actions"><StatusBadge status={currentRole || "Viewer"} /><button className="secondary-button" type="button" disabled={!canManageUsers} onClick={() => onToast(canManageUsers ? "Tambah pengguna masih contoh" : "Mode Viewer")}><Icon name="person_add" /> Tambah Pengguna</button></div>}
      />
      <div className="module-grid">{userRoles.map((role) => {
        const access = roleService.getRolePermissions(role);
        return <article className="module-card" key={role}><div><span className="label">Peran</span><h2>{role}</h2><p className="muted">{role === currentRole ? "Role aktif sesi ini" : access.approve ? "Bisa approval" : access.export ? "Bisa ekspor" : "Baca data"}</p><StatusBadge status={role === currentRole ? "Aktif" : "Role"} /></div><Icon name="admin_panel_settings" /></article>;
      })}</div>
      <TablePanel title="Tabel Pengguna" style={{ marginTop: 16 }} headers={["Nama", "Email", "Peran", "Status", "Aksi"]} rows={mock.users.map((user) => <tr key={user.email}><td className="table-name">{user.name}</td><td>{user.email}</td><td><StatusBadge status={user.role} /></td><td><StatusBadge status={user.status} /></td><td><button className="ghost-button" type="button" disabled={!canManageUsers} onClick={() => handleEditRole(user)}><Icon name="edit" /> Edit Role</button></td></tr>)} />
      <TablePanel title="Matriks Izin" style={{ marginTop: 16 }} headers={["Peran", ...permissions, "Approve", "Export", "Delete"]} rows={userRoles.map((role) => <tr key={role}><td className="table-name">{role}</td>{permissions.map((permission, index) => <td key={permission}><StatusBadge status={getPermissionStatus(role, index)} /></td>)}<td><StatusBadge status={roleService.canApprove(role) ? "Aktif" : "Nonaktif"} /></td><td><StatusBadge status={roleService.canExport(role) ? "Aktif" : "Nonaktif"} /></td><td><StatusBadge status={roleService.canDelete(role) ? "Aktif" : "Nonaktif"} /></td></tr>)} />
    </section>
  );
}
