import Icon from "./Icon.jsx";

export function Logo({ settings, className = "brand-logo" }) {
  if (settings.logo) {
    return <span className={className}><img alt="Logo aplikasi" src={settings.logo} /></span>;
  }
  return <span className={className}><Icon name="account_balance" filled /></span>;
}

export function NavList({ items, activePage, onNavigate, onOpenDrawer, className = "side-nav" }) {
  return (
    <nav className={className}>
      {items.map((item) => {
        if (item.action === "open-drawer") {
          return <button className="nav-item" type="button" key={item.id} data-open-drawer="expense" onClick={() => onOpenDrawer("expense")}><Icon name={item.icon} /><span>{item.label}</span></button>;
        }
        const active = activePage === item.id;
        return <button className={`nav-item ${active ? "active" : ""}`} type="button" key={item.id} onClick={() => onNavigate(item.id)}><Icon name={item.icon} filled={active} /><span>{item.label}</span></button>;
      })}
    </nav>
  );
}

export default function Sidebar({ settings, items, activePage, authProfile, isDemo, onNavigate, onOpenDrawer }) {
  const name = authProfile?.name || "Admin Kontrol";
  const initials = name.split(" ").map((item) => item[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo settings={settings} />
        <div className="brand-text">
          <span className="brand-name">{settings.appName}</span>
          <span className="brand-tagline">{settings.companyName}</span>
        </div>
      </div>
      <NavList items={items} activePage={activePage} onNavigate={onNavigate} onOpenDrawer={onOpenDrawer} />
      <div className="sidebar-footer">
        <div className="user-card">
          <span className="avatar">{initials || "AC"}</span>
          <div>
            <strong>{name}</strong>
            <span>{isDemo ? "Mode Demo" : authProfile?.role || "Pengguna"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
