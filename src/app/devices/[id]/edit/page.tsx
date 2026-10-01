"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Device, DeviceFormData } from "@/types/device";
import { Customer } from "@/types/customer";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Alert, LoadingSpinner } from "@/components/ui";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { convertToWebP } from "@/lib/image-utils";

export default function EditDevicePage() {
  const params = useParams();
  const id = params?.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);

      // Fetch device
      const { data: deviceData, error: deviceError } = await supabase
        .from("devices")
        .select(`
          *,
          customer:customers (*)
        `)
        .eq("id", id)
        .single();

      if (deviceError || !deviceData) {
        setError("Failed to load device: " + (deviceError?.message || "Not found"));
        setLoading(false);
        return;
      }

      setDevice(deviceData);

      // Fetch customers
      const { data: custData } = await supabase.from("customers").select("*");
      setCustomers(custData || []);

      setLoading(false);
    }

    loadData();
  }, [id, supabase]);

  const handleUpdateDevice = async (formData: DeviceFormData, photos: File[]) => {
    if (!id) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update device fields (Customer ID and Device ID are read-only)
      const { error: updateError } = await supabase
        .from("devices")
        .update({
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
        })
        .eq("id", id);

      if (updateError) {
        setError("Failed to update device: " + updateError.message);
        setSubmitting(false);
        return;
      }

      // Upload new intake photos as compressed WebP if added
      if (photos.length > 0) {
        for (const file of photos) {
          const webpFile = await convertToWebP(file);
          const fileName = `${id}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

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
                device_id: id,
                file_url: fileUrl,
                file_name: webpFile.name,
                file_type: "image/webp",
                uploaded_by: user?.id || null,
              },
            ]);
          }
        }
      }

      router.push(`/devices/${id}`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AppShell userEmail={userEmail}>
        <div className="space-y-1">
          <Link
            href={`/devices/${id}`}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#009688] transition-colors"
          >
            ← Back to Device Details
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Edit Device
            </h1>
            {device && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Device ID (Read-only):</span>
                <Badge variant="primary" className="font-mono">
                  {device.device_code}
                </Badge>
              </div>
            )}
          </div>
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
        ) : device ? (
          <DeviceForm
            isEdit
            customers={customers.length > 0 ? customers : (device.customer ? [device.customer as unknown as Customer] : [])}
            initialData={{
              customer_id: device.customer_id,
              device_type: device.device_type,
              brand: device.brand,
              model: device.model,
              serial_number: device.serial_number || "",
              imei: device.imei || "",
              color: device.color || "",
              ram: device.ram || "",
              storage: device.storage || "",
              operating_system: device.operating_system || "",
              password_note: device.password_note || "",
              accessories: device.accessories || "",
              physical_condition: device.physical_condition || "",
            }}
            onSubmit={handleUpdateDevice}
            isLoading={submitting}
            submitButtonText="Update Device"
          />
        ) : null}
    </AppShell>
  );
}
