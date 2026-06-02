function statusTone(status) {
  const normalized = status.toLowerCase();
  if (["selesai", "aktif", "aman", "paid", "approved", "lunas"].includes(normalized)) return "success";
  if (["pending", "draft", "direncanakan", "hold", "sebagian", "belum bayar", "perlu cek", "bukti kurang", "potensi duplikat", "revisi", "minta revisi", "revision_requested", "dekat tempo"].includes(normalized)) return "warning";
  if (["urgent", "gagal", "berisiko", "rejected", "nonaktif", "jatuh tempo", "melebihi anggaran"].includes(normalized)) return "danger";
  return "info";
}

export default function StatusBadge({ status }) {
  const statusClass = status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const labels = {
    Paid: "Dibayar",
    Approved: "Disetujui",
    Rejected: "Ditolak",
    Pending: "Menunggu",
    Hold: "Tertahan",
    Urgent: "Mendesak",
    Revisi: "Revisi",
    revision_requested: "Revisi",
  };
  return <span className={`status-badge status-${statusTone(status)} status-${statusClass}`}>{labels[status] || status}</span>;
}
