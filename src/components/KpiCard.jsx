import Icon from "./Icon.jsx";

export default function KpiCard({ label, value, note, icon, tone = "" }) {
  return (
    <article className={`kpi-card ${tone}`}>
      <div className="kpi-head">
        <span className="label">{label}</span>
        <span className="kpi-icon"><Icon name={icon} /></span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-note"><Icon name={tone === "tone-expense" ? "trending_down" : "trending_up"} /> {note}</div>
    </article>
  );
}
