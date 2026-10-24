"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  MapPin,
  Laptop,
  Crosshair,
  Plus,
  Bell,
  ChevronDown,
  ChevronsUpDown,
  Check,
  LogOut,
  Wrench,
  UserPlus,
  Users,
  PanelLeft,
  Menu,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBranchContext } from "@/context/BranchContext";
import { usePermissions } from "@/context/PermissionContext";
import { ROLE_LABELS, normalizeRole } from "@/types/permissions";
import { BRANCHES } from "@/types/branch";

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
  const {
    selectedBranch,
    selectedCategory,
    setSelectedBranch,
    setSelectedCategory,
  } = useBranchContext();

  const [globalSearch, setGlobalSearch] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { isAdmin, currentEmployee, currentRole } = usePermissions();

  const branchRef = useRef<HTMLDivElement>(null);
  const quickCreateRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close open dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
        setBranchDropdownOpen(false);
      }
      if (quickCreateRef.current && !quickCreateRef.current.contains(event.target as Node)) {
        setQuickCreateOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const query = encodeURIComponent(globalSearch.trim());
    router.push(`/jobs?search=${query}`);
  };

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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isUserAdmin = mounted && isAdmin;
  const activeRole = normalizeRole(currentEmployee?.role || currentRole);
  const activeRoleLabel = ROLE_LABELS[activeRole] || "Staff";
  const activeName = !mounted
    ? (userEmail?.split("@")[0] || "User")
    : isUserAdmin
    ? "Admin"
    : (currentEmployee?.full_name || userEmail?.split("@")[0] || "Staff Member");

  const currentBranchLabel =
    selectedBranch === "all"
      ? "All Locations"
      : BRANCHES[selectedBranch]?.shortName || "Branch";

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-all">
      <div className="flex h-full w-full items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4">
        
        {/* Left: Sidebar Toggles & Global Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
          {/* Mobile Sidebar Hamburger */}
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open sidebar drawer"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <div className="hidden lg:block h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* shadcn Command-Style Global Search */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:block flex-1 max-w-sm">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search jobs, customers, serial..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>
          </form>
        </div>

        {/* Center: Branch Filter & Category Segmented Tabs */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Branch Selector Dropdown */}
          <div className="relative" ref={branchRef}>
            <button
              onClick={() => setBranchDropdownOpen((prev) => !prev)}
              className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all shadow-2xs ${
                selectedBranch === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                  : "bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-800/60"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="hidden sm:inline-block max-w-[140px] truncate">
                {currentBranchLabel}
              </span>
              <span className="sm:hidden font-semibold">
                {selectedBranch === "all" ? "All" : selectedBranch === "south_bopal" ? "Bopal" : "Tragad"}
              </span>
              <ChevronsUpDown className="h-3 w-3 text-slate-400 shrink-0 ml-0.5" />
            </button>

            {branchDropdownOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 p-1 shadow-lg border border-slate-200 dark:border-slate-800 z-50 space-y-0.5 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400">
                  Select Branch
                </div>

                {/* All Locations Option */}
                <button
                  onClick={() => {
                    setSelectedBranch("all");
                    setBranchDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    selectedBranch === "all"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className={`h-4 w-4 shrink-0 ${selectedBranch === "all" ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
                    <div className="text-left truncate">
                      <div className="font-medium text-slate-900 dark:text-white">All Branches</div>
                      <div className="text-[10px] text-slate-400">South Bopal & Tragad Labs</div>
                    </div>
                  </div>
                  {selectedBranch === "all" && <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0 ml-2" />}
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                {/* Specific Branch Options */}
                {Object.values(BRANCHES).map((branch) => {
                  const isSelected = selectedBranch === branch.id;
                  const locationCity = branch.address.split(",").slice(-2).join(",").trim() || branch.subtitle;

                  return (
                    <button
                      key={branch.id}
                      onClick={() => {
                        setSelectedBranch(branch.id);
                        setBranchDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin className={`h-4 w-4 shrink-0 ${isSelected ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
                        <div className="text-left truncate">
                          <div className="font-medium text-slate-900 dark:text-white">{branch.shortName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{locationCity}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Switcher Tabs (Monochromatic Shadcn Segmented Controls) */}
          <div className="inline-flex h-9 items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`h-7.5 px-3 rounded-md text-xs font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="All Categories"
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory("laptop_general")}
              className={`h-7.5 flex items-center gap-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                selectedCategory === "laptop_general"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Laptop & General Repairs"
            >
              <Laptop className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Laptop</span>
            </button>
            <button
              onClick={() => setSelectedCategory("drone")}
              className={`h-7.5 flex items-center gap-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                selectedCategory === "drone"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Drone Repair Hub"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Drone</span>
            </button>
          </div>

        </div>

        {/* Right: Quick Create, Notifications & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Create Dropdown */}
          <div className="relative" ref={quickCreateRef}>
            <button
              onClick={() => setQuickCreateOpen((prev) => !prev)}
              className="h-9 px-3 sm:px-3.5 rounded-lg bg-[#009688] hover:bg-[#00897b] text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden md:inline">Quick Create</span>
            </button>

            {quickCreateOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 p-1.5 shadow-xl border border-slate-200 dark:border-slate-800 z-50 space-y-0.5 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  New Record
                </div>
                <Link
                  href="/jobs/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Wrench className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>New Repair Job</span>
                </Link>
                <Link
                  href="/customers/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <UserPlus className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>New Customer</span>
                </Link>
                <Link
                  href="/devices/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Laptop className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>New Device</span>
                </Link>
                <Link
                  href="/employees/new"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Users className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>New Employee</span>
                </Link>
              </div>
            )}
          </div>

          {/* Notifications Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center relative text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
              title="System Alerts & Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 p-2 shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Notifications</span>
                  <span className="text-[10px] text-teal-600 font-medium">All systems normal</span>
                </div>
                <div className="py-3 px-2 text-center text-xs text-slate-500">
                  <p>No critical alert pending.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hardware labs operational across both branches.</p>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="h-9 pl-1 pr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-xs shadow-2xs">
                {!mounted
                  ? (userEmail?.charAt(0).toUpperCase() || "U")
                  : isUserAdmin
                  ? "A"
                  : (activeName.charAt(0).toUpperCase() || "S")}
              </div>
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {activeName}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {!mounted
                    ? "..."
                    : isUserAdmin
                    ? "Super Admin"
                    : `${activeRoleLabel} Staff`}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5 hidden sm:inline" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 p-1.5 shadow-xl border border-slate-200 dark:border-slate-800 z-50 space-y-1 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                    Signed in as
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                    {userEmail || (isUserAdmin ? "admin@robuzta.com" : "staff@robuzta.com")}
                  </span>
                  <span className="text-[10px] text-teal-600 font-medium block mt-0.5">
                    {isUserAdmin ? "Administrator (Full Access)" : `${activeRoleLabel} Profile`}
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
