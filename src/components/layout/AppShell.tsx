"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

        {/* Page Main Content */}
        <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
