import { navItems } from "../data/mockData.js";
import BottomNav from "./BottomNav.jsx";
import Sidebar, { NavList } from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function AppShell({ children, settings, activePage, authProfile, isDemo, onNavigate, onOpenDrawer, onToast, onSignOut }) {
  const primaryIds = new Set(["dashboard", "pemasukan", "pengeluaran", "settings"]);
  const moduleItems = navItems.filter((item) => !primaryIds.has(item.id));

  return (
    <div className="app-shell">
      <Sidebar settings={settings} items={navItems} activePage={activePage} authProfile={authProfile} isDemo={isDemo} onNavigate={onNavigate} onOpenDrawer={onOpenDrawer} />
      <div className="workspace">
        <Topbar settings={settings} authProfile={authProfile} isDemo={isDemo} onNavigate={onNavigate} onToast={onToast} onSignOut={onSignOut} />
        <NavList items={moduleItems} activePage={activePage} onNavigate={onNavigate} onOpenDrawer={onOpenDrawer} className="mobile-module-nav" />
        <main className="page-content">{children}</main>
      </div>
      <BottomNav activePage={activePage} onNavigate={onNavigate} onOpenDrawer={onOpenDrawer} />
    </div>
  );
}
