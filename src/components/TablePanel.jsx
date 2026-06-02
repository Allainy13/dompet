import { DataTable } from "./TransactionTable.jsx";

export default function TablePanel({ title, actions, headers, rows, className = "", style }) {
  return (
    <section className={`table-panel ${className}`.trim()} style={style}>
      {(title || actions) ? (
        <div className="table-header">
          {title ? <h2 className="table-title">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      <DataTable headers={headers} rows={rows} />
    </section>
  );
}
