import Icon from "./Icon.jsx";

export default function AiInsightCard({ icon, title, text, tone = "" }) {
  return (
    <article className={`insight-card ${tone}`}>
      <span className="insight-icon"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </article>
  );
}
