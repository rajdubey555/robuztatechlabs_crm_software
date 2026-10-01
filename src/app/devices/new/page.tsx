"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DeviceFormData } from "@/types/device";
import { Customer } from "@/types/customer";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, LoadingSpinner, EmptyState, Button } from "@/components/ui";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { convertToWebP } from "@/lib/image-utils";

function NewDeviceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch customers for selection
      const { data, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .order("full_name", { ascending: true });

      if (fetchError) {
        setError("Failed to load customers: " + fetchError.message);
      } else {
        setCustomers(data || []);
      }
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const handleCreateDevice = async (formData: DeviceFormData, photos: File[]) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Insert device record
      const { data: device, error: insertError } = await supabase
        .from("devices")
        .insert([
          {
            customer_id: formData.customer_id,
            device_type: formData.device_type,
            brand: formData.brand.trim(),
            model: formData.model.trim(),
            serial_number: formData.serial_number?.trim() || null,
            imei: formData.imei?.trim() || null,
            color: formData.color?.trim() || null,
            ram: formData.ram?.trim() || null,
            storage: formData.storage?.trim() || null,
            operating_system: formData.operating_system?.trim() || null,
            password_note: formData.password_note?.trim() || null,
            accessories: formData.accessories?.trim() || null,
            physical_condition: formData.physical_condition?.trim() || null,
          },
        ])
        .select()
        .single();

      if (insertError || !device) {
        setError("Failed to register device: " + (insertError?.message || "Unknown error"));
        setSubmitting(false);
        return;
      }

      // 2. Upload intake photos as compressed WebP images to Supabase Storage
      if (photos.length > 0 && device.id) {
        for (const file of photos) {
          // Client-side convert to WebP
          const webpFile = await convertToWebP(file);

          const fileName = `${device.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

          const { error: uploadError } = await supabase.storage
            .from("device-attachments")
            .upload(fileName, webpFile, {
              contentType: "image/webp",
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("device-attachments")
              .getPublicUrl(fileName);

            const fileUrl = publicUrlData.publicUrl;

            await supabase.from("device_attachments").insert([
              {
                device_id: device.id,
                file_url: fileUrl,
                file_name: webpFile.name,
                file_type: "image/webp",
                uploaded_by: user?.id || null,
              },
            ]);
          }
        }
      }

      // 3. Successful creation -> redirect to Device Detail page
      router.push(`/devices/${device.id}`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AppShell userEmail={userEmail}>
        {/* Header */}
        <div className="space-y-1">
          <Link
            href="/devices"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            ← Back to Devices
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Register New Device
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Register a laptop, mobile phone, or tablet for repair intake
          </p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" className="text-[#009688]" />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="You must create at least one customer before registering a device."
            action={
              <Link href="/customers/new">
                <Button variant="primary" size="sm">
                  + Create Customer First
                </Button>
              </Link>
            }
          />
        ) : (
          <DeviceForm
            customers={customers}
            initialData={{
              customer_id: preselectedCustomerId || customers[0]?.id || "",
              device_type: "Laptop",
              brand: "",
              model: "",
            }}
            onSubmit={handleCreateDevice}
            isLoading={submitting}
            submitButtonText="Register Device"
          />
        )}
    </AppShell>
  );
}

export default function NewDevicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-[#009688]" />
        </div>
      }
    >
      <NewDeviceContent />
    </Suspense>
  );
}
