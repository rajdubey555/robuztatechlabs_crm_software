"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Device, DeviceFormData, getDeviceById, deleteDeviceAttachment, DeviceForm } from "@/modules/devices";
import { Customer, getCustomers } from "@/modules/customers";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, LoadingSpinner } from "@/components/ui";
import { convertToWebP } from "@/lib/image-utils";
import { ArrowLeft, Laptop, Copy, Check, ChevronRight } from "lucide-react";

export default function EditDevicePage() {
  const params = useParams();
  const id = params?.id as string;

  const [device, setDevice] = useState<Device | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [copiedCode, setCopiedCode] = useState(false);

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

      // Fetch device via service (includes attachments)
      const { data: deviceData, error: deviceError } = await getDeviceById(id);

      if (deviceError || !deviceData) {
        setError(deviceError || "Failed to load device.");
        setLoading(false);
        return;
      }

      setDevice(deviceData);

      // Fetch customers via customerService
      const { data: custData } = await getCustomers();
      setCustomers(custData || []);

      setLoading(false);
    }

    loadData();
  }, [id, supabase]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDeleteAttachment = async (attachmentId: string, fileUrl?: string) => {
    // Calls service that deletes both physical file from Supabase Storage and database row
    const { success, error: delErr } = await deleteDeviceAttachment(attachmentId, fileUrl);

    if (!success) {
      setError("Failed to delete photo: " + delErr);
      throw new Error(delErr || "Failed to delete photo");
    }

    setDevice((prev) =>
      prev
        ? {
            ...prev,
            attachments: prev.attachments?.filter((a) => a.id !== attachmentId),
          }
        : null
    );
  };

  const handleUpdateDevice = async (formData: DeviceFormData, photos: File[]) => {
    if (!id) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update device record
      const { error: updateError } = await supabase
        .from("devices")
        .update({
          device_type: formData.device_type,
          category_type: formData.category_type,
          branch: formData.branch,
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
          try {
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

              await supabase.from("device_attachments").insert([
                {
                  device_id: id,
                  file_url: publicUrlData.publicUrl,
                  file_name: webpFile.name || file.name,
                  file_type: "image/webp",
                  uploaded_by: user?.id || null,
                },
              ]);
            } else {
              console.warn("Storage upload error:", uploadError.message);
            }
          } catch (uploadException) {
            console.warn("Attachment error:", uploadException);
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
      <div className="space-y-5 w-full">
        {/* Sleek Minimal Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/devices" className="hover:text-[#009688] transition-colors">
            Devices
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          {device ? (
            <Link href={`/devices/${id}`} className="hover:text-[#009688] transition-colors font-mono">
              {device.device_code}
            </Link>
          ) : (
            <span>Device</span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold">Edit</span>
        </div>

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-[#009688] shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-sans text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {device ? `Edit ${device.brand} ${device.model}` : "Edit Device"}
                </h1>
                {device && (
                  <button
                    type="button"
                    onClick={() => handleCopyCode(device.device_code)}
                    title="Click to copy Device ID"
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-mono font-medium transition-colors cursor-pointer"
                  >
                    <span>{device.device_code}</span>
                    {copiedCode ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Update device specifications, intake condition notes, and intake photos
              </p>
            </div>
          </div>

          <Link
            href={`/devices/${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Return</span>
          </Link>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <LoadingSpinner size="lg" className="text-[#009688]" />
          </div>
        ) : device ? (
          <DeviceForm
            isEdit
            customers={
              customers.length > 0
                ? customers
                : device.customer
                ? [device.customer as unknown as Customer]
                : []
            }
            initialData={{
              customer_id: device.customer_id,
              device_type: device.device_type,
              category_type: device.category_type,
              branch: device.branch,
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
            existingAttachments={device.attachments || []}
            onDeleteAttachment={handleDeleteAttachment}
            onSubmit={handleUpdateDevice}
            isLoading={submitting}
            submitButtonText="Save Changes"
          />
        ) : null}
      </div>
    </AppShell>
  );
}
