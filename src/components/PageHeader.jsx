export default function PageHeader({ title, subtitle, companyName, actions }) {
  return (
    <div className="page-header">
      <div>
        <p className="page-kicker">{companyName}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}
