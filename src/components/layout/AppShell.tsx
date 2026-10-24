"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { usePermissions } from "@/context/PermissionContext";
import { getModuleByPath } from "@/types/permissions";
import { ShieldAlert, ArrowLeft, KeyRound, ExternalLink } from "lucide-react";

export interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const {
    canAccessPage,
    isAdmin,
    currentEmployee,
    currentRole,
    isLoading,
  } = usePermissions();

  const isAllowed = canAccessPage(pathname);
  const targetModule = getModuleByPath(pathname);

  // Preserve sidebar collapse state across navigation
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("robuzta_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("robuzta_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const activeName = currentEmployee?.full_name || "Staff Member";
  const activeRole = currentEmployee?.role || currentRole;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={mounted ? isCollapsed : false}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        userEmail={userEmail}
      />

      {/* Main Container Layout adjusting to sidebar width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          isCollapsed ? "lg:pl-16" : "lg:pl-60"
        }`}
      >
        {/* Top Header / Topbar */}
        <Topbar
          userEmail={userEmail}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onToggleDesktopSidebar={handleToggleCollapse}
          isSidebarCollapsed={isCollapsed}
        />

        {/* Page Main Content or Restricted Guard */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {!isLoading && !isAllowed ? (
            <div className="max-w-xl mx-auto mt-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  <KeyRound className="w-3.5 h-3.5" />
                  Access Restricted
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {targetModule ? `${targetModule.pageName} Module Restricted` : "Restricted Area"}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your account does not have permission to view or manage this section.
                  Access has been restricted based on your assigned staff permissions.
                </p>
              </div>

              {/* Persona Context Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 text-left text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                  <span className="text-slate-500 dark:text-slate-400">Active Staff Profile:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{activeName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                  <span className="text-slate-500 dark:text-slate-400">Assigned Role:</span>
                  <span className="font-semibold uppercase text-slate-900 dark:text-white">{activeRole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Required Policy:</span>
                  <span className="font-mono text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    {targetModule?.mainKey || "page_access"} = false
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#009688] text-white hover:bg-[#00897b] transition-colors shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Dashboard
                </Link>

                {isAdmin && (
                  <Link
                    href="/permissions"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                  >
                    Manage Permissions
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
