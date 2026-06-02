import { currency } from "../data/mockData.js";
import StatusBadge from "./StatusBadge.jsx";

export default function TransactionCard({ item }) {
  return (
    <article className="transaction-card">
      <div>
        <span className="label">{item.id} - {item.date}</span>
        <strong>{item.desc}</strong>
        <span>{item.project} - {item.account}</span>
      </div>
      <div className="transaction-side">
        <span className={`money ${item.type === "income" ? "income" : "expense"}`}>
          {item.type === "income" ? "+" : "-"} {currency(item.amount)}
        </span>
        <StatusBadge status={item.status} />
      </div>
    </article>
  );
}
