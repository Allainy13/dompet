import { compactCurrency, financeFilters, getTransactionsByType } from "../data/mockData.js";
import Icon from "../components/Icon.jsx";
import KpiCard from "../components/KpiCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import TransactionTable from "../components/TransactionTable.jsx";

export function FinancePage({ type, mock, settings, filter, onFilterChange, onOpenDrawer, onToast }) {
  const isIncome = type === "income";
  const label = isIncome ? "Pemasukan" : "Pengeluaran";
  const action = isIncome ? "Tambah Pemasukan" : "Tambah Pengeluaran";
  const rows = getTransactionsByType(mock, type);
  const visibleRows = rows.filter((item) => filter === "Semua" || item.category === filter);
  const total = rows.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="page">
      <PageHeader
        companyName={settings.companyName}
        title={label}
        subtitle={`${label} perusahaan dengan data contoh, filter ringkas, dan form drawer kanan mengikuti bahan Stitch.`}
        actions={<button className="secondary-button" type="button" onClick={() => onOpenDrawer(isIncome ? "income" : "expense")}><Icon name="add" /> {action}</button>}
      />
      <div className="content-split">
        <div>
          <div className="kpi-grid three-kpi-grid">
            <KpiCard label={`Total ${label}`} value={compactCurrency(total)} note="Bulan berjalan" icon={isIncome ? "south_west" : "north_east"} tone={isIncome ? "" : "tone-expense"} />
            <KpiCard label="Transaksi" value={rows.length} note="Data contoh" icon="receipt_long" />
            <KpiCard label="Rata-rata" value={compactCurrency(total / Math.max(rows.length, 1))} note="Per transaksi" icon="query_stats" tone="tone-ai" />
          </div>
          <div className="filters">
            {financeFilters.map((item) => <button className={`chip ${filter === item ? "active" : ""}`} type="button" key={item} onClick={() => onFilterChange(item)}>{item}</button>)}
          </div>
          <TransactionTable rows={visibleRows} title={`Daftar ${label}`} drawerType={isIncome ? "income" : "expense"} onOpenDrawer={onOpenDrawer} onToast={onToast} />
        </div>
        <aside className="form-panel">
          <h2>{isIncome ? "Input Cepat Pemasukan" : "Input Cepat Pengeluaran"}</h2>
          <div className="form-grid">
            <div className="amount-preview"><span className="label">NOMINAL</span><strong className={isIncome ? "money income" : "money expense"}>{isIncome ? "+" : "-"} Rp 0</strong></div>
            <label className="field"><span>Proyek</span><select className="select"><option>FTTH Barat</option><option>Operasional</option><option>Pemeliharaan</option></select></label>
            <label className="field"><span>Kategori</span><select className="select"><option>{isIncome ? "Pemasukan" : "Infrastruktur"}</option><option>Proyek</option><option>Kas Kecil</option></select></label>
            <button className="ghost-button" type="button" onClick={() => onOpenDrawer(isIncome ? "income" : "expense")}><Icon name="open_in_full" /> Buka Drawer Form</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function Pemasukan(props) {
  return <FinancePage {...props} type="income" />;
}
