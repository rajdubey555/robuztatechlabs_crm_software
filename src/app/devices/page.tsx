"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Device } from "@/types/device";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Alert, LoadingSpinner, EmptyState } from "@/components/ui";
import { DeviceSearch } from "@/components/devices/DeviceSearch";
import { DeviceTable } from "@/components/devices/DeviceTable";

export default function DevicesListPage() {
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

      // Fetch devices with customer details
      const { data, error: fetchError } = await supabase
        .from("devices")
        .select(`
          *,
          customer:customers (
            id,
            customer_code,
            full_name,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Failed to load devices: " + fetchError.message);
      } else {
        setDevices(data || []);
      }
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  // Client-side search filtering
  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    const query = searchQuery.toLowerCase().trim();
    return devices.filter((d) => {
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
  }, [devices, searchQuery]);

  return (
    <AppShell userEmail={userEmail}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Devices
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Registered laptops, mobile phones, and tablets for repair
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
        ) : searchQuery ? (
          <EmptyState
            title="No matching devices found"
            description={`No registered device matches "${searchQuery}". Try a different search term.`}
            action={
              <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                Clear Search
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
