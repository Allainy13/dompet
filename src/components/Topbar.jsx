import Icon from "./Icon.jsx";
import { Logo } from "./Sidebar.jsx";

export default function Topbar({ settings, authProfile, isDemo, onNavigate, onToast, onSignOut }) {
  const name = authProfile?.name || "Admin Kontrol";
  const initials = name.split(" ").map((item) => item[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <div className="mobile-title">
        <Logo settings={settings} className="mini-logo" />
        <div className="brand-text">
          <span className="brand-name">{settings.appName}</span>
          <span className="brand-tagline">{settings.tagline}</span>
        </div>
      </div>
      <label className="search-box" aria-label="Pencarian global">
        <Icon name="search" />
        <input type="search" placeholder="Cari transaksi, proyek, atau laporan..." />
      </label>
      <div className="topbar-actions">
        <button className="ghost-button" type="button" onClick={() => onNavigate("ai")}><Icon name="auto_awesome" /> AI Hemat</button>
        <button className="icon-button" type="button" onClick={() => onToast("Tidak ada notifikasi baru")}><Icon name="notifications" /></button>
        <span className="avatar">{initials || "A"}</span>
        <span className="user-role muted">{isDemo ? "Demo" : authProfile?.role || "User"}</span>
        <button className="icon-button" type="button" onClick={onSignOut} title="Keluar"><Icon name="logout" /></button>
      </div>
    </header>
  );
}
