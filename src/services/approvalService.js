import { cloneMockData, getApprovalSummary as getMockApprovalSummary } from "../data/mockData.js";
import { defaultCompanyId, isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { addActivityLog } from "./activityLogService.js";

const approvalStatusToUi = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Revisi",
};

const transactionStatusByApproval = {
  approved: "approved",
  rejected: "rejected",
  revision_requested: "draft",
};

function isReady() {
  return Boolean(isSupabaseConfigured && supabase);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function toUiApproval(row) {
  const trx = row.transactions || {};
  const requester = row.requester || row.requested_by_profile || row.users_profile || {};
  const approver = row.approver || {};
  const risk = row.ai_risk || trx.ai_risk || "Aman";

  return {
    id: row.id,
    transactionId: row.transaction_id,
    requester: requester.name || "Finance",
    approver: approver.name || "-",
    unit: requester.role || "Keuangan",
    desc: trx.title || row.note || "Approval transaksi",
    amount: Number(trx.amount || 0),
    status: approvalStatusToUi[row.status] || row.status || "Pending",
    urgent: ["Melebihi Anggaran", "Bukti Kurang", "Potensi Duplikat"].includes(risk),
    project: trx.projects?.name || "Operasional",
    date: formatDate(row.created_at),
    risk,
    evidence: row.note || trx.note || "Menunggu bukti pendukung",
    budgetUsed: Number(trx.amount || 0) >= 100000000 ? 92 : 58,
  };
}

function getMockApprovals() {
  return cloneMockData().approvals;
}

export async function getApprovals(companyId = defaultCompanyId) {
  if (!isReady()) return getMockApprovals();

  let query = supabase
    .from("approvals")
    .select("*, transactions(*, projects(name, code), accounts(name), categories(name, type))")
    .order("created_at", { ascending: false });

  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) return getMockApprovals();
  return (data || []).map(toUiApproval);
}

export async function getApprovalById(id) {
  if (!isReady()) return getMockApprovals().find((item) => item.id === id) || null;

  const { data, error } = await supabase
    .from("approvals")
    .select("*, transactions(*, projects(name, code), accounts(name), categories(name, type))")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return toUiApproval(data);
}

export async function createApproval(payload) {
  if (!isReady()) return { data: payload, isMock: true };

  const { data, error } = await supabase.from("approvals").insert(payload).select().single();
  if (error) return { data: payload, error, isMock: true };
  await addActivityLog({ company_id: data.company_id, module: "Approval", action: "Buat approval", target_id: data.id, description: payload.note });
  return { data, isMock: false };
}

async function updateApprovalFlow(approvalId, status, note = "", profile = {}) {
  if (!isReady()) {
    return { data: { id: approvalId, status, note }, uiStatus: approvalStatusToUi[status], isMock: true };
  }

  const { data: approval, error: readError } = await supabase
    .from("approvals")
    .select("*")
    .eq("id", approvalId)
    .maybeSingle();

  if (readError || !approval) return { data: { id: approvalId, status, note }, error: readError, isMock: true };

  const patch = {
    status,
    note: note || approval.note,
    approved_by: status === "approved" ? profile.id || null : approval.approved_by,
  };

  const { data, error } = await supabase
    .from("approvals")
    .update(patch)
    .eq("id", approvalId)
    .select()
    .single();

  if (error) return { data: { id: approvalId, status, note }, error, isMock: true };

  const transactionStatus = transactionStatusByApproval[status];
  if (transactionStatus && approval.transaction_id) {
    const transactionPatch = {
      status: transactionStatus,
      approved_by: status === "approved" ? profile.id || null : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    };
    await supabase.from("transactions").update(transactionPatch).eq("id", approval.transaction_id);
  }

  await addActivityLog({
    company_id: approval.company_id,
    user_id: profile.id || null,
    module: "Approval",
    action: status === "approved" ? "Approve" : status === "rejected" ? "Reject" : "Minta revisi",
    target_id: approvalId,
    description: note,
  });

  return { data, uiStatus: approvalStatusToUi[status], isMock: false };
}

export function approveTransaction(approvalId, note = "", profile) {
  return updateApprovalFlow(approvalId, "approved", note, profile);
}

export function rejectTransaction(approvalId, note = "", profile) {
  return updateApprovalFlow(approvalId, "rejected", note, profile);
}

export function requestRevision(approvalId, note = "", profile) {
  return updateApprovalFlow(approvalId, "revision_requested", note, profile);
}

export async function getApprovalSummary(companyId = defaultCompanyId) {
  const approvals = await getApprovals(companyId);
  if (!isReady()) return getMockApprovalSummary({ approvals });

  return {
    pending: approvals.filter((item) => item.status === "Pending").length,
    urgent: approvals.filter((item) => item.urgent).length,
    approved: approvals.filter((item) => item.status === "Approved").length,
    rejected: approvals.filter((item) => item.status === "Rejected").length,
  };
}

export const approvalService = {
  getApprovals,
  getApprovalById,
  createApproval,
  approveTransaction,
  rejectTransaction,
  requestRevision,
  getApprovalSummary,
};
