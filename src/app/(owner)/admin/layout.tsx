"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LayoutDashboard,
  Package,
  BarChart3,
  Calendar,
  Layers,
  Search,
  Bell,
  HelpCircle,
} from "lucide-react";

import LogoutButton from "@/components/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Events", href: "/admin/events", icon: Calendar },
    { name: "Categories", href: "/admin/categories", icon: Layers },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Employees", href: "/admin/employees", icon: Users },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-surface font-body">
      {/* SIDEBAR */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest flex flex-col py-8 px-4 z-40 border-r border-surface-container/60">
        {/* Brand */}
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-extrabold text-primary-container font-headline tracking-tight">
            POSinAja
          </h1>
          <p className="text-[10px] text-on-surface-variant/70 font-semibold uppercase tracking-widest mt-1">
            Management Suite
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 ${isActive
                    ? "bg-orange-50 text-primary-container shadow-sm"
                    : "text-slate-500 hover:text-primary-container hover:bg-orange-50/50"
                  }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto px-0 pt-4 border-t border-surface-container/50">
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Top App Bar */}
        <header className="flex justify-between items-center w-full px-10 h-20 bg-transparent">
          <div className="flex items-center gap-4">
            <div className="bg-surface-container-lowest rounded-full px-4 py-2 flex items-center gap-2 border border-surface-container">
              <Search size={16} className="text-on-surface-variant/50" />
              <input
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-on-surface w-64 font-body placeholder:text-on-surface-variant/50"
                placeholder="Search across portal..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="text-on-surface-variant/50 hover:text-primary-container transition-colors">
              <Bell size={20} />
            </button>
            <button className="text-on-surface-variant/50 hover:text-primary-container transition-colors">
              <HelpCircle size={20} />
            </button>
            <div className="h-10 w-10 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-surface-container-lowest flex items-center justify-center text-primary font-bold text-sm font-headline">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-10 pb-12">{children}</div>
      </main>
    </div>
  );
}
