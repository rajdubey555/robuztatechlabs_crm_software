"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePermissions } from "@/context/PermissionContext";
import { ROLE_LABELS, normalizeRole } from "@/types/permissions";

import {
  LayoutDashboard,
  Users,
  Laptop,
  Wrench,
  Inbox,
  Building2,
  Briefcase,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Receipt,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  userEmail?: string;
  onSignOut?: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  userEmail = "admin@robuzta.com",
}: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Customers",
      href: "/customers",
      icon: <Users className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Devices",
      href: "/devices",
      icon: <Laptop className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Jobs",
      href: "/jobs",
      icon: <Wrench className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Part Requests",
      href: "/part-requests",
      icon: <Inbox className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Vendors",
      href: "/vendors",
      icon: <Building2 className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Expenses",
      href: "/expenses",
      icon: <Receipt className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Employees",
      href: "/employees",
      icon: <Briefcase className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Permissions",
      href: "/permissions",
      icon: <ShieldCheck className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Billing",
      href: "/billing",
      badge: "Soon",
      disabled: true,
      icon: <CreditCard className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Reports",
      href: "/reports",
      badge: "Soon",
      disabled: true,
      icon: <BarChart3 className="h-4 w-4 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
      badge: "Soon",
      disabled: true,
      icon: <Settings className="h-4 w-4 shrink-0" />,
    },
  ];

  const { canAccessPage, isAdmin, currentEmployee, currentRole } = usePermissions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allowedNavItems = useMemo(() => {
    // On SSR and initial hydration frame, render navItems so SSR and Client HTML match 100%
    if (!mounted) {
      return navItems;
    }
    return navItems.filter((item) => {
      if (item.disabled) return true;
      return canAccessPage(item.href);
    });
  }, [mounted, canAccessPage]);

  const isUserAdmin = mounted && isAdmin;
  const activeRole = normalizeRole(currentEmployee?.role || currentRole);
  const activeRoleLabel = ROLE_LABELS[activeRole] || "Staff";

  const activePersonaName = !mounted
    ? (userEmail?.split("@")[0] || "User")
    : isUserAdmin
    ? "Admin User"
    : (currentEmployee?.full_name || userEmail?.split("@")[0] || "Staff Member");

  const activePersonaSub = !mounted
    ? (userEmail || "Super Admin")
    : isUserAdmin
    ? (userEmail || "Super Admin")
    : `${activeRoleLabel} Staff`;

  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign out error:", err);
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200">
      {/* Brand & Collapse Header */}
      <div>
        <div
          className={`flex h-16 items-center border-b border-slate-100 dark:border-slate-800 transition-all ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
            title={isCollapsed ? "Robuzta CRM Dashboard" : undefined}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#009688] text-white shadow-xs font-black">
              R
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base leading-tight font-mono">
                  ROBUZTA
                </span>
                <span className="text-[10px] font-semibold text-[#009688] uppercase tracking-wider">
                  Techlabs CRM
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 p-3">
          {allowedNavItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 opacity-60 cursor-not-allowed ${
                    isCollapsed ? "justify-center" : ""
                  }`}
                  title={isCollapsed ? `${item.label} (${item.badge || "Coming Soon"})` : undefined}
                >
                  <span className="text-slate-400">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#009688] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Profile Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3">
        <div
          className={`flex items-center gap-3 ${
            isCollapsed ? "justify-center" : "px-2"
          }`}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#009688]/15 text-[#009688] font-bold text-xs dark:bg-[#009688]/25 dark:text-teal-300"
            title={isCollapsed ? `${activePersonaName} (${activePersonaSub})` : undefined}
          >
            {isUserAdmin ? "A" : activePersonaName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex flex-1 items-center justify-between overflow-hidden">
              <div className="flex flex-col min-w-0 pr-1">
                <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {activePersonaName}
                </span>
                <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {activePersonaSub}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                disabled={loggingOut}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block transition-all duration-200 ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
