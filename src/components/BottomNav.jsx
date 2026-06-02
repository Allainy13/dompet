import { bottomItems } from "../data/mockData.js";
import { NavList } from "./Sidebar.jsx";

export default function BottomNav({ activePage, onNavigate, onOpenDrawer }) {
  return <NavList items={bottomItems} activePage={activePage} onNavigate={onNavigate} onOpenDrawer={onOpenDrawer} className="bottom-nav" />;
}
