"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export interface TopbarProps {
  userEmail?: string;
  onOpenMobileSidebar: () => void;
  onToggleDesktopSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export function Topbar({
  userEmail,
  onOpenMobileSidebar,
  onToggleDesktopSidebar,
  isSidebarCollapsed,
}: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const [globalSearch, setGlobalSearch] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const query = encodeURIComponent(globalSearch.trim());
    router.push(`/jobs?search=${query}`);
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 h-16 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 transition-all">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        
        {/* Left Side: Mobile Menu Button & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open sidebar drawer"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:block flex-1 max-w-md">
            <Input
              placeholder="Global Search (Job ID, Customer, Phone, Device)..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              startIcon={
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </form>
        </div>

        {/* Right Side: Quick Actions, Notifications & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Quick Create Dropdown */}
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setQuickCreateOpen(!quickCreateOpen)}
              className="flex items-center gap-1.5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden md:inline">Quick Create</span>
            </Button>

            {quickCreateOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-2 shadow-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 z-50 space-y-1">
                <Link
                  href="/jobs/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e0f2f1] hover:text-[#004d40] rounded-lg transition-colors"
                >
                  <span>📋</span> + New Repair Job
                </Link>
                <Link
                  href="/customers/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e0f2f1] hover:text-[#004d40] rounded-lg transition-colors"
                >
                  <span>👤</span> + New Customer
                </Link>
                <Link
                  href="/devices/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e0f2f1] hover:text-[#004d40] rounded-lg transition-colors"
                >
                  <span>💻</span> + New Device
                </Link>
                <Link
                  href="/employees/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#e0f2f1] hover:text-[#004d40] rounded-lg transition-colors"
                >
                  <span>👨‍🔧</span> + New Employee
                </Link>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <button
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#009688] ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#009688] text-white font-bold text-xs">
                {userEmail ? userEmail[0].toUpperCase() : "U"}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                {userEmail || "Staff User"}
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-2 shadow-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 z-50 space-y-1">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Signed in as</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                    {userEmail || "Staff User"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  isLoading={loggingOut}
                  onClick={handleSignOut}
                  className="mt-1"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
