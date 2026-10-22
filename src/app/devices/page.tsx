"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Device, getDevices, DeviceSearch, DeviceTable } from "@/modules/devices";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";

export default function DevicesListPage() {
  const { selectedBranch, selectedCategory, activeBranchInfo, activeCategoryInfo, isFiltered, clearFilters } = useBranchContext();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Branch & Category & Search filtering
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      // Branch context filter
      if (selectedBranch !== "all" && d.branch && d.branch !== selectedBranch) return false;

      // Category context filter
      if (selectedCategory !== "all" && d.category_type && d.category_type !== selectedCategory) return false;

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
  }, [devices, selectedBranch, selectedCategory, searchQuery]);

  return (
    <AppShell userEmail={userEmail}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Devices
            </h1>
            {activeBranchInfo && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${activeBranchInfo.badgeColor}`}>
                📍 {activeBranchInfo.shortName}
              </span>
            )}
            {activeCategoryInfo && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${activeCategoryInfo.badgeColor}`}>
                {activeCategoryInfo.icon} {activeCategoryInfo.name}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registered laptops, mobile phones, tablets, and drones for repair
          </p>
        </div>

        <Link href="/devices/new">
          <Button variant="primary" size="md">
            <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Device
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <DeviceSearch
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" className="text-[#009688]" />
        </div>
      ) : filteredDevices.length > 0 ? (
        <DeviceTable devices={filteredDevices} />
      ) : searchQuery || isFiltered ? (
        <EmptyState
          title="No matching devices found"
          description="No registered device matches your search, branch, or category selection."
          action={
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); clearFilters(); }}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No devices registered yet"
          description="Start by registering a device for a customer."
          action={
            <Link href="/devices/new">
              <Button variant="primary" size="sm">
                + Add First Device
              </Button>
            </Link>
          }
        />
      )}
    </AppShell>
  );
}
