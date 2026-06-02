import { useEffect, useMemo, useState } from "react";
import { compactCurrency, currency, sumByType } from "../data/mockData.js";
import AiInsightCard from "../components/AiInsightCard.jsx";
import Icon from "../components/Icon.jsx";
import KpiCard from "../components/KpiCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TransactionTable from "../components/TransactionTable.jsx";
import { aiService } from "../services/aiService.js";
import { financeService } from "../services/financeService.js";

function buildLocalSummary(data) {
  const income = sumByType(data.transactions, "income");
  const expense = sumByType(data.transactions, "expense");
  const expensesByCategory = data.transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

  return {
    totalBalance: data.accounts.reduce((total, item) => total + Number(item.balance || 0), 0),
    income,
    expense,
    netProfit: income - expense,
    recentTransactions: data.transactions.slice(0, 5),
    pendingApproval: data.approvals.filter((item) => item.status === "Pending").length,
    urgentApproval: data.approvals.filter((item) => item.urgent).length,
    pettyCashBalance: data.accounts.find((item) => item.type === "Kas Kecil")?.balance || 0,
    dueDebtsCount: data.debts.filter((item) => item.kind === "Hutang" && item.status !== "Lunas").length,
    dueDebtsAmount: data.debts.filter((item) => item.kind === "Hutang" && item.status !== "Lunas").reduce((total, item) => total + Math.max(0, Number(item.amount || 0) - Number(item.paid || 0)), 0),
    dueReceivablesCount: data.debts.filter((item) => item.kind === "Piutang" && item.status !== "Lunas").length,
    dueReceivablesAmount: data.debts.filter((item) => item.kind === "Piutang" && item.status !== "Lunas").reduce((total, item) => total + Math.max(0, Number(item.amount || 0) - Number(item.paid || 0)), 0),
    expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    isMock: true,
  };
}

export default function Dashboard({ mock, settings, profile, isDemo, onNavigate, onOpenDrawer, onToast }) {
  const localSummary = useMemo(() => buildLocalSummary(mock), [mock]);
  const [summary, setSummary] = useState(localSummary);
  const [dashboardInsights, setDashboardInsights] = useState(() => aiService.generateDashboardInsights(mock));
  const aiSavings = summary.expense * 0.08;

  useEffect(() => {
    let isMounted = true;
    setSummary(localSummary);
    setDashboardInsights(aiService.generateDashboardInsights(mock));
    financeService.getDashboardSummary({ companyId: profile?.company_id, isDemo })
      .then((nextSummary) => {
        if (isMounted) setSummary(nextSummary);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isDemo, localSummary, profile?.company_id]);

  function refreshDashboardInsights() {
    setDashboardInsights(aiService.generateDashboardInsights(mock));
    onToast("Insight dashboard diperbarui dari data aktif");
  }

  return (
    <section className="page">
      <PageHeader
        companyName={settings.companyName}
        title="Dashboard Keuangan"
        subtitle="Ringkasan pemasukan, pengeluaran, kas, approval, dan insight AI hemat."
        actions={<div className="form-actions"><button className="ghost-button" type="button" onClick={refreshDashboardInsights}><Icon name="auto_awesome" /> Refresh Insight</button><button className="primary-button" type="button" onClick={() => onToast("Ekspor dashboard contoh disiapkan")}><Icon name="download" /> Ekspor Data</button></div>}
      />
      <div className="kpi-grid">
        <KpiCard label="Saldo Total" value={compactCurrency(summary.totalBalance)} note={summary.isMock ? "Mode demo/mock" : "Data Supabase"} icon="account_balance" />
        <KpiCard label="Pemasukan Bulan Ini" value={compactCurrency(summary.income)} note="Dari transaksi aktif" icon="south_west" />
        <KpiCard label="Pengeluaran Bulan Ini" value={compactCurrency(summary.expense)} note="Per kategori tersedia" icon="north_east" tone="tone-expense" />
        <KpiCard label="Laba Bersih" value={compactCurrency(summary.netProfit)} note={`${summary.pendingApproval} approval menunggu`} icon="monitoring" tone={summary.netProfit >= 0 ? "" : "tone-warning"} />
      </div>
      <div className="dashboard-layout">
        <div className="main-column">
          <section className="panel chart-panel">
            <div className="panel-header"><h2 className="panel-title">Arus Kas 6 Bulan</h2><span className="chip active">Aktual</span></div>
            <div className="bar-chart">
              {[56, 72, 48, 82, 68, 91].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
            </div>
            <div className="chart-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span></div>
          </section>
          <TransactionTable rows={summary.recentTransactions} title="Transaksi Terbaru" onOpenDrawer={onOpenDrawer} onToast={onToast} />
        </div>
        <aside className="ai-column">
          <section className="panel">
            <div className="panel-header"><h2 className="panel-title">Menunggu Approval</h2></div>
            <div className="panel-body approval-list">
              {mock.approvals.slice(0, 3).map((item) => (
                <article className="approval-item" key={item.id}>
                  <div className="approval-top"><div><div className="approval-title">{item.desc}</div><div className="muted">{item.requester} - {item.project}</div></div><strong>{currency(item.amount)}</strong></div>
                  <div className="approval-top" style={{ marginTop: 10 }}><StatusBadge status={item.status} /><button className="ghost-button" type="button" onClick={() => onToast("Detail approval contoh dibuka")}>Detail</button></div>
                </article>
              ))}
              <button className="ghost-button" type="button" onClick={() => onNavigate("approval")}>Lihat Semua</button>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header"><h2 className="panel-title">Pengeluaran per Kategori</h2><span className="chip active">{summary.expensesByCategory.length}</span></div>
            <div className="panel-body approval-list">
              {summary.expensesByCategory.slice(0, 4).map((item) => (
                <article className="approval-item" key={item.category}>
                  <div className="approval-top"><div><div className="approval-title">{item.category}</div><div className="muted">Kontribusi biaya</div></div><strong>{currency(item.amount)}</strong></div>
                </article>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panel-header"><h2 className="panel-title">Kewajiban & Kas</h2><span className="chip active">Ringkas</span></div>
            <div className="panel-body approval-list">
              <article className="approval-item"><div className="approval-top"><div><div className="approval-title">Hutang Jatuh Tempo</div><div className="muted">{summary.dueDebtsCount} invoice perlu dipantau</div></div><strong>{currency(summary.dueDebtsAmount || 0)}</strong></div></article>
              <article className="approval-item"><div className="approval-top"><div><div className="approval-title">Piutang Jatuh Tempo</div><div className="muted">{summary.dueReceivablesCount} tagihan perlu ditagih</div></div><strong>{currency(summary.dueReceivablesAmount || 0)}</strong></div></article>
              <article className="approval-item"><div className="approval-top"><div><div className="approval-title">Saldo Kas Kecil</div><div className="muted">Kas operasional harian</div></div><strong>{currency(summary.pettyCashBalance || 0)}</strong></div></article>
            </div>
          </section>
          {dashboardInsights.map((insight) => <AiInsightCard key={insight.title} icon={insight.icon} title={insight.title} text={insight.text} tone={insight.tone} />)}
          <KpiCard label="Proyeksi Efisiensi" value={currency(aiSavings)} note="AI menemukan potensi hemat" icon="auto_graph" tone="tone-ai" />
        </aside>
      </div>
      <div className="skeleton-demo" aria-label="Skeleton pemuatan contoh">
        <div /><div /><div />
      </div>
      <div className="empty-state"><Icon name="inbox" /><strong>Belum ada data arsip</strong><p>Data arsip lama akan tampil di sini setelah backend tersedia.</p></div>
    </section>
  );
}
