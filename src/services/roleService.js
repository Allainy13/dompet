import { authService } from "./authService.js";

const roleMatrix = {
  "Super Admin": {
    view: "*",
    create: "*",
    edit: "*",
    approve: true,
    delete: true,
    export: true,
  },
  Finance: {
    view: ["dashboard", "transaksi", "pemasukan", "pengeluaran", "laporan", "rekening", "kategori", "kas-kecil", "hutang-piutang", "approval", "project"],
    create: ["transaksi", "pemasukan", "pengeluaran", "kas-kecil", "hutang-piutang", "project", "rekening", "kategori"],
    edit: ["transaksi", "pemasukan", "pengeluaran", "kas-kecil", "hutang-piutang", "project", "rekening", "kategori"],
    approve: false,
    delete: false,
    export: true,
  },
  Manager: {
    view: ["dashboard", "transaksi", "pemasukan", "pengeluaran", "approval", "laporan", "project", "rekening", "kategori", "kas-kecil", "hutang-piutang"],
    create: [],
    edit: ["approval"],
    approve: true,
    delete: false,
    export: true,
  },
  Staff: {
    view: ["dashboard", "transaksi", "pemasukan", "pengeluaran", "kas-kecil", "project", "rekening", "kategori", "hutang-piutang"],
    create: ["transaksi", "pemasukan", "pengeluaran", "kas-kecil"],
    edit: ["transaksi", "pemasukan", "pengeluaran"],
    approve: false,
    delete: false,
    export: false,
  },
  Viewer: {
    view: ["dashboard", "transaksi", "pemasukan", "pengeluaran", "approval", "laporan", "rekening", "project", "kategori", "kas-kecil", "hutang-piutang", "user-role", "settings", "ai"],
    create: [],
    edit: [],
    approve: false,
    delete: false,
    export: false,
  },
};

function normalizeRole(roleOrProfile) {
  if (typeof roleOrProfile === "string") return roleOrProfile;
  return roleOrProfile?.role || "Viewer";
}

function hasAccess(list, module) {
  if (list === "*") return true;
  return Array.isArray(list) && list.includes(module);
}

export async function getCurrentRole(profile) {
  if (profile?.role) return profile.role;
  const auth = await authService.getCurrentUser();
  return auth.profile?.role || "Viewer";
}

export function canView(module, roleOrProfile = "Viewer") {
  const role = normalizeRole(roleOrProfile);
  return hasAccess(roleMatrix[role]?.view || [], module);
}

export function canCreate(module, roleOrProfile = "Viewer") {
  const role = normalizeRole(roleOrProfile);
  return hasAccess(roleMatrix[role]?.create || [], module);
}

export function canEdit(module, roleOrProfile = "Viewer") {
  const role = normalizeRole(roleOrProfile);
  return hasAccess(roleMatrix[role]?.edit || [], module);
}

export function canApprove(roleOrProfile = "Viewer") {
  const role = normalizeRole(roleOrProfile);
  return Boolean(roleMatrix[role]?.approve);
}

export function canDelete(roleOrProfile = "Viewer") {
  const role = normalizeRole(roleOrProfile);
  return Boolean(roleMatrix[role]?.delete);
}

export function canExport(roleOrProfile = "Viewer") {
  const role = normalizeRole(roleOrProfile);
  return Boolean(roleMatrix[role]?.export);
}

export function getRolePermissions(roleOrProfile = "Viewer") {
  const role = normalizeRole(roleOrProfile);
  return roleMatrix[role] || roleMatrix.Viewer;
}

export const roleService = {
  getCurrentRole,
  canView,
  canCreate,
  canEdit,
  canApprove,
  canDelete,
  canExport,
  getRolePermissions,
};
