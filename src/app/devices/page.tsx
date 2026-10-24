"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Device, getDevices, DeviceSearch, DeviceTable } from "@/modules/devices";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import {
  Laptop,
  Plane,
  Smartphone,
  HardDrive,
  Plus,
  RotateCcw,
} from "lucide-react";

export default function DevicesListPage() {
  const { selectedBranch, selectedCategory, isFiltered, clearFilters } = useBranchContext();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch devices via deviceService
      const { data, error: fetchError } = await getDevices();

      if (fetchError) {
        setError("Failed to load devices: " + fetchError);
      } else {
        setDevices(data);
      }
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  // Branch, Category, Type & Search filtering
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      // Branch context filter (from Topbar)
      if (selectedBranch !== "all" && d.branch && d.branch !== selectedBranch) return false;

      // Category context filter (from Topbar)
      if (selectedCategory !== "all" && d.category_type && d.category_type !== selectedCategory) return false;

      // Type filter
      if (selectedType && d.device_type !== selectedType) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();

      const devCode = d.device_code?.toLowerCase() || "";
      const brand = d.brand?.toLowerCase() || "";
      const model = d.model?.toLowerCase() || "";
      const serial = d.serial_number?.toLowerCase() || "";
      const imei = d.imei?.toLowerCase() || "";
      const custName = d.customer?.full_name?.toLowerCase() || "";
      const custCode = d.customer?.customer_code?.toLowerCase() || "";

      return (
        devCode.includes(query) ||
        brand.includes(query) ||
        model.includes(query) ||
        serial.includes(query) ||
        imei.includes(query) ||
        custName.includes(query) ||
        custCode.includes(query)
      );
    });
  }, [devices, selectedBranch, selectedCategory, selectedType, searchQuery]);

  // Operational metrics for the current branch view
  const branchDevices = useMemo(() => {
    return devices.filter((d) => {
      if (selectedBranch !== "all" && d.branch && d.branch !== selectedBranch) return false;
      if (selectedCategory !== "all" && d.category_type && d.category_type !== selectedCategory) return false;
      return true;
    });
  }, [devices, selectedBranch, selectedCategory]);

  const laptopCount = useMemo(() => {
    return branchDevices.filter((d) => d.device_type === "Laptop" || d.device_type === "MacBook").length;
  }, [branchDevices]);

  const droneCount = useMemo(() => {
    return branchDevices.filter((d) => d.device_type === "Drone" || d.category_type === "drone").length;
  }, [branchDevices]);

  const phoneCount = useMemo(() => {
    return branchDevices.filter(
      (d) => d.device_type === "iPhone" || d.device_type === "Android Phone" || d.device_type === "Tablet"
    ).length;
  }, [branchDevices]);

  const hasActiveFilters = Boolean(searchQuery || selectedType || isFiltered);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedType("");
    clearFilters();
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-5 w-full">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688]">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-sans text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Devices
                </h1>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {filteredDevices.length} {filteredDevices.length === 1 ? "unit" : "units"}
                </span>
              </div>
            </div>
          </div>

          <Link href="/devices/new">
            <Button variant="primary" size="md" className="font-medium shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Register Device
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Minimal High-Density KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Total Registered</span>
              <HardDrive className="w-4 h-4 text-[#009688]" />
            </div>
            <div className="mt-1.5 text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
              {branchDevices.length}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Laptops & MacBooks</span>
              <Laptop className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1.5 text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
              {laptopCount}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Drones</span>
              <Plane className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1.5 text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
              {droneCount}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium">Phones & Tablets</span>
              <Smartphone className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1.5 text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
              {phoneCount}
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <DeviceSearch
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onReset={resetFilters}
        />

        {/* Content Table or Empty States */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <LoadingSpinner size="lg" className="text-[#009688]" />
          </div>
        ) : filteredDevices.length > 0 ? (
          <DeviceTable devices={filteredDevices} />
        ) : hasActiveFilters ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Laptop className="w-5 h-5" />
            </div>
            <h3 className="font-sans text-base font-semibold text-slate-900 dark:text-white">
              No matching devices found
            </h3>
            <p className="text-xs text-slate-500">
              No registered devices match your search, branch, or type selection.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs font-medium">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#009688] flex items-center justify-center mx-auto">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="font-sans text-base font-semibold text-slate-900 dark:text-white">
              No devices registered yet
            </h3>
            <p className="text-xs text-slate-500">
              Register a laptop, drone, or smartphone to link with customers and repair jobs.
            </p>
            <Link href="/devices/new">
              <Button variant="primary" size="sm" className="mt-2 text-xs font-medium">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Register First Device
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
