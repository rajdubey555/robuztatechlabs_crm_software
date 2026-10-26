"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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

export interface DevicesPageClientProps {
  initialDevices?: Device[];
  userEmail?: string;
}

export function DevicesPageClient({
  initialDevices = [],
  userEmail,
}: DevicesPageClientProps) {
  const { selectedBranch, selectedCategory, isFiltered, clearFilters } = useBranchContext();

  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [loading, setLoading] = useState(initialDevices.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getDevices();
      if (fetchError) {
        setError("Failed to load devices: " + fetchError);
      } else {
        setDevices(data);
      }
    } catch {
      setError("An unexpected error occurred while loading devices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDevices.length === 0) {
      loadData();
    }
  }, [initialDevices.length]);

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

  const otherCount = useMemo(() => {
    return branchDevices.length - (laptopCount + droneCount + phoneCount);
  }, [branchDevices, laptopCount, droneCount, phoneCount]);

  const hasActiveFilters = Boolean(searchQuery || selectedType || isFiltered);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedType("");
    clearFilters();
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Customer Devices
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredDevices.length} {filteredDevices.length === 1 ? "device" : "devices"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Registered laptops, drones and smartphones linked to repair jobs
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/devices/new">
              <Button variant="primary" size="sm" className="font-semibold text-xs shadow-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Register Device
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Minimal High-Density Device Category Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setSelectedType(selectedType === "Laptop" ? "" : "Laptop")}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedType === "Laptop"
                ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Laptops & PCs</span>
              <Laptop className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {laptopCount}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType(selectedType === "Drone" ? "" : "Drone")}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedType === "Drone"
                ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 ring-1 ring-purple-500"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Drones</span>
              <Plane className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {droneCount}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType(selectedType === "Smartphone" ? "" : "Smartphone")}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedType === "Smartphone"
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Smartphones</span>
              <Smartphone className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {phoneCount}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType("")}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedType === ""
                ? "border-slate-400 bg-slate-50 dark:bg-slate-800"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">All Devices</span>
              <HardDrive className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {branchDevices.length}
            </div>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <DeviceSearch
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            onReset={resetFilters}
          />
        </div>

        {/* Content Table or Empty States */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
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
              No devices match your search or filter criteria.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs font-medium">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset All Filters
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
              Register a customer device before creating a repair job card.
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
