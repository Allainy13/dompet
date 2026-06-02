import { currency } from "../data/mockData.js";
import Icon from "./Icon.jsx";
import StatusBadge from "./StatusBadge.jsx";
import TransactionCard from "./TransactionCard.jsx";

export function DataTable({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export default function TransactionTable({ rows, title = "Daftar Transaksi", drawerType = "expense", onOpenDrawer, onToast }) {
  return (
    <section className="table-panel transaction-panel">
      <div className="table-header">
        <h2 className="table-title">{title}</h2>
        <div className="table-actions">
          <button className="ghost-button" type="button" onClick={() => onToast("Filter lanjutan contoh aktif")}><Icon name="filter_list" /> Filter</button>
          <button className="secondary-button" type="button" onClick={() => onOpenDrawer(drawerType)}><Icon name="add" /> Tambah</button>
        </div>
      </div>
      <DataTable
        headers={["ID", "Tanggal", "Deskripsi", "Proyek", "Nominal", "Status"]}
        rows={rows.map((item) => (
          <tr key={item.id}>
            <td className="muted">{item.id}</td>
            <td>{item.date}</td>
            <td className="table-name">{item.desc}</td>
            <td>{item.project}</td>
            <td className={`money ${item.type === "income" ? "income" : "expense"}`}>{item.type === "income" ? "+" : "-"} {currency(item.amount)}</td>
            <td><StatusBadge status={item.status} /></td>
          </tr>
        ))}
      />
      <div className="transaction-cards">
        {rows.map((item) => <TransactionCard item={item} key={item.id} />)}
      </div>
    </section>
  );
}
