"use client";

import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from "react";
import { Loader2, Sparkles, Smartphone, Upload, Camera, Trash2, ImageIcon, ZoomIn, Eye } from "lucide-react";
import { DeviceFormData, DeviceFormErrors, DeviceType, DeviceAttachment } from "@/types/device";
import { Customer } from "@/types/customer";
import { Input, Select, Button, Card, CardContent, Modal } from "@/components/ui";
import { MobileUploadCompanionModal } from "./MobileUploadCompanionModal";
import {
  CatalogItem,
  fetchDeviceCatalog,
  addDeviceCatalogItem,
  DEFAULT_CATALOG,
} from "@/services/deviceCatalogService";

export interface DeviceFormProps {
  customers: Customer[];
  initialData?: DeviceFormData;
  existingAttachments?: DeviceAttachment[];
  onDeleteAttachment?: (attachmentId: string, fileUrl?: string) => Promise<void>;
  onSubmit: (data: DeviceFormData, photos: File[]) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  isEdit?: boolean;
}

const DEFAULT_DEVICE_TYPES: DeviceType[] = [
  "Laptop",
  "Desktop",
  "MacBook",
  "iPhone",
  "Android Phone",
  "Tablet",
  "Other",
];

export function DeviceForm({
  customers,
  initialData,
  existingAttachments,
  onDeleteAttachment,
  onSubmit,
  isLoading = false,
  submitButtonText = "Save Device",
  isEdit = false,
}: DeviceFormProps) {
  const [formData, setFormData] = useState<DeviceFormData>({
    customer_id: initialData?.customer_id || (customers[0]?.id || ""),
    device_type: initialData?.device_type || "Laptop",
    brand: initialData?.brand || "Dell",
    model: initialData?.model || "",
    serial_number: initialData?.serial_number || "",
    imei: initialData?.imei || "",
    color: initialData?.color || "",
    ram: initialData?.ram || "",
    storage: initialData?.storage || "",
    operating_system: initialData?.operating_system || "",
    password_note: initialData?.password_note || "",
    accessories: initialData?.accessories || "",
    physical_condition: initialData?.physical_condition || "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<DeviceAttachment[]>(existingAttachments || []);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<DeviceFormErrors>({});
  const [isCustomModel, setIsCustomModel] = useState(false);

  useEffect(() => {
    if (existingAttachments) {
      setExistingPhotos(existingAttachments);
    }
  }, [existingAttachments]);

  const handleDeleteExistingPhoto = async (id: string, fileUrl?: string) => {
    if (!onDeleteAttachment) return;
    setDeletingAttachmentId(id);
    try {
      await onDeleteAttachment(id, fileUrl);
      setExistingPhotos((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  // Live External API Auto-Fetch State
  const [liveApiModels, setLiveApiModels] = useState<string[]>([]);
  const [loadingApiModels, setLoadingApiModels] = useState(false);

  // Catalog State
  const [catalog, setCatalog] = useState<CatalogItem[]>(DEFAULT_CATALOG);
  const [deviceTypesList, setDeviceTypesList] = useState<string[]>(DEFAULT_DEVICE_TYPES);

  // Quick Add Modals State
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [newModelName, setNewModelName] = useState("");

  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      const items = await fetchDeviceCatalog();
      if (items && items.length > 0) {
        setCatalog(items);

        // Derive unique types
        const typesSet = new Set<string>(DEFAULT_DEVICE_TYPES);
        items.forEach((item) => {
          if (item.device_type) typesSet.add(item.device_type);
        });
        setDeviceTypesList(Array.from(typesSet));
      }
    }

    loadCatalog();
  }, []);

  // Auto-fetch live models from API / presets whenever brand or device_type changes
  useEffect(() => {
    let active = true;
    async function fetchLiveModels() {
      if (!formData.brand) return;
      setLoadingApiModels(true);
      try {
        const query = new URLSearchParams({
          action: "models",
          brand: formData.brand,
          deviceType: formData.device_type,
        });
        const res = await fetch(`/api/external-devices?${query.toString()}`);
        const json = await res.json();
        if (active && json.success && Array.isArray(json.models)) {
          const names = json.models.map((m: { name: string }) => m.name);
          setLiveApiModels(names);
        }
      } catch (e) {
        console.warn("Failed to fetch live API models for brand:", e);
      } finally {
        if (active) setLoadingApiModels(false);
      }
    }

    fetchLiveModels();
    return () => {
      active = false;
    };
  }, [formData.brand, formData.device_type]);

  const POPULAR_BRANDS = [
    "Apple",
    "Dell",
    "HP",
    "Lenovo",
    "Asus",
    "Acer",
    "Samsung",
    "DJI",
    "OnePlus",
    "Xiaomi",
    "Vivo",
    "Oppo",
    "Google",
    "Realme",
    "Motorola",
    "Nothing",
    "Honor",
    "Sony",
    "Autel Robotics",
  ];

  // Update brand/model defaults when device_type changes
  const handleDeviceTypeChange = (newType: DeviceType) => {
    let nextBrand = formData.brand;
    if (!nextBrand) {
      nextBrand = newType === "Drone" ? "DJI" : newType === "MacBook" || newType === "iPhone" ? "Apple" : "Dell";
    }

    setFormData({
      ...formData,
      device_type: newType,
      brand: nextBrand,
    });
    setIsCustomModel(false);
  };

  // When Brand changes, update brand in state
  const handleBrandChange = (newBrand: string) => {
    setFormData({
      ...formData,
      brand: newBrand,
    });
    setIsCustomModel(false);
  };

  // Compute available Brands (Popular brands + Catalog brands + current brand)
  const availableBrands = Array.from(
    new Set([
      ...POPULAR_BRANDS,
      ...catalog
        .filter((c) => !c.device_type || c.device_type === formData.device_type)
        .map((c) => c.brand),
      formData.brand,
    ].filter(Boolean))
  );

  // Combined models: Live API models + DB catalog items (deduplicated)
  const combinedModels = useMemo(() => {
    const list: string[] = [...liveApiModels];
    catalog
      .filter((c) => c.brand.toLowerCase() === (formData.brand || "").toLowerCase())
      .forEach((c) => {
        if (!list.some((item) => item.toLowerCase() === c.model.toLowerCase())) {
          list.push(c.model);
        }
      });
    return list;
  }, [liveApiModels, catalog, formData.brand]);

  // Quick Add Handlers
  const handleAddTypeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    setModalSubmitting(true);
    const typeName = newTypeName.trim();

    if (!deviceTypesList.includes(typeName)) {
      setDeviceTypesList((prev) => [...prev, typeName]);
    }

    setFormData((prev) => ({ ...prev, device_type: typeName as DeviceType }));
    setNewTypeName("");
    setIsAddTypeModalOpen(false);
    setModalSubmitting(false);
  };

  const handleAddBrandSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    setModalSubmitting(true);
    const brandName = newBrandName.trim();

    // Create a catalog entry
    const newItem: CatalogItem = {
      device_type: formData.device_type,
      brand: brandName,
      model: `${brandName} Series`,
    };

    await addDeviceCatalogItem(newItem);
    setCatalog((prev) => [newItem, ...prev]);

    setFormData((prev) => ({
      ...prev,
      brand: brandName,
      model: `${brandName} Series`,
    }));

    setNewBrandName("");
    setIsAddBrandModalOpen(false);
    setModalSubmitting(false);
  };

  const handleAddModelSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) return;

    setModalSubmitting(true);
    const modelName = newModelName.trim();

    const newItem: CatalogItem = {
      device_type: formData.device_type,
      brand: formData.brand || "General",
      model: modelName,
    };

    await addDeviceCatalogItem(newItem);
    setCatalog((prev) => [newItem, ...prev]);

    setFormData((prev) => ({
      ...prev,
      model: modelName,
    }));

    setNewModelName("");
    setIsAddModelModalOpen(false);
    setModalSubmitting(false);
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    const newPhotos = [...photos, ...selectedFiles];
    setPhotos(newPhotos);

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    setPhotoPreviews(updatedPreviews);
  };

  const handleMobilePhotosReceived = (newFiles: File[]) => {
    setPhotos((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const validate = (): boolean => {
    const newErrors: DeviceFormErrors = {};

    if (!formData.customer_id) {
      newErrors.customer_id = "Please select a customer.";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required.";
    }

    if (!formData.model.trim()) {
      newErrors.model = "Model is required.";
    }

    if (formData.imei && formData.imei.trim()) {
      const imeiClean = formData.imei.trim();
      if (!/^\d{14,16}$/.test(imeiClean)) {
        newErrors.imei = "IMEI must be 14-16 digits.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData, photos);
  };

  const customerOptions = customers.map((c) => ({
    label: `${c.full_name} (${c.customer_code} - ${c.phone})`,
    value: c.id,
  }));

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Customer Select */}
              <div className="md:col-span-2 lg:col-span-3">
                <Select
                  label="Customer *"
                  required
                  disabled={isEdit || isLoading || customers.length === 0}
                  options={
                    customers.length > 0
                      ? customerOptions
                      : [{ label: "No customers available", value: "" }]
                  }
                  value={formData.customer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_id: e.target.value })
                  }
                  error={errors.customer_id}
                />
              </div>

              {/* Device Type with + Quick Add */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Device Type *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddTypeModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#009688] hover:underline"
                    title="Add new Device Type"
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-xs">
                      +
                    </span>
                    <span>Add Type</span>
                  </button>
                </div>

                <Select
                  disabled={isLoading}
                  options={deviceTypesList.map((t) => ({ label: t, value: t }))}
                  value={formData.device_type}
                  onChange={(e) =>
                    handleDeviceTypeChange(e.target.value as DeviceType)
                  }
                  error={errors.device_type}
                />
              </div>

              {/* Brand with + Quick Add & Interlinked Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Brand *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddBrandModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#009688] hover:underline"
                    title="Add new Brand"
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-xs">
                      +
                    </span>
                    <span>Add Brand</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <Select
                    disabled={isLoading}
                    options={availableBrands.map((b) => ({ label: b, value: b }))}
                    value={formData.brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    error={errors.brand}
                  />
                  <p className="text-[11px] text-slate-400 italic">
                    Selecting brand filters models automatically
                  </p>
                </div>
              </div>

              {/* Model with Live API Suggestions & Freeform Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Model *
                  </label>
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium inline-flex items-center gap-1">
                    {loadingApiModels ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Fetching models from API...
                      </>
                    ) : combinedModels.length > 0 ? (
                      <>
                        <Sparkles className="w-3 h-3 text-teal-500" />
                        {combinedModels.length} models loaded (Live API)
                      </>
                    ) : (
                      <span className="text-slate-400">Type any model name</span>
                    )}
                  </span>
                </div>

                <div className="relative">
                  <Input
                    list="device-models-live-datalist"
                    placeholder={
                      loadingApiModels
                        ? "Loading models from API..."
                        : combinedModels.length > 0
                        ? `Type to search or choose (e.g. ${combinedModels[0]})...`
                        : "Type model name..."
                    }
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    error={errors.model}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <datalist id="device-models-live-datalist">
                    {combinedModels.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  Powered by Live API — auto-suggests as you type, or enter any custom model directly (no manual adding needed).
                </p>
              </div>

              {/* Serial Number */}
              <Input
                label="Serial Number"
                placeholder="e.g. 8HKL9X2 (Optional)"
                value={formData.serial_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, serial_number: e.target.value })
                }
                disabled={isLoading}
              />

              {/* IMEI */}
              <Input
                label="IMEI (For Mobile/Tablets)"
                placeholder="15-digit IMEI number (Optional)"
                value={formData.imei || ""}
                onChange={(e) =>
                  setFormData({ ...formData, imei: e.target.value })
                }
                error={errors.imei}
                disabled={isLoading}
              />

              {/* Color */}
              <Input
                label="Color"
                placeholder="e.g. Space Grey, Black, Silver (Optional)"
                value={formData.color || ""}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                disabled={isLoading}
              />

              {/* RAM */}
              <Input
                label="RAM"
                placeholder="e.g. 8GB, 16GB, 4GB (Optional)"
                value={formData.ram || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ram: e.target.value })
                }
                disabled={isLoading}
              />

              {/* Storage */}
              <Input
                label="Storage"
                placeholder="e.g. 512GB SSD, 128GB (Optional)"
                value={formData.storage || ""}
                onChange={(e) =>
                  setFormData({ ...formData, storage: e.target.value })
                }
                disabled={isLoading}
              />

              {/* Operating System */}
              <Input
                label="Operating System"
                placeholder="e.g. Windows 11, macOS Sequoia, iOS 18 (Optional)"
                value={formData.operating_system || ""}
                onChange={(e) =>
                  setFormData({ ...formData, operating_system: e.target.value })
                }
                disabled={isLoading}
              />

              {/* Password Note */}
              <Input
                label="Password / PIN / Pattern Note"
                placeholder="e.g. PIN 1234 or 'No password' (Optional)"
                value={formData.password_note || ""}
                onChange={(e) =>
                  setFormData({ ...formData, password_note: e.target.value })
                }
                disabled={isLoading}
              />

              {/* Accessories */}
              <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Accessories Received
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Original Charger, Laptop Bag, Wireless Mouse, Power Adapter (Optional)"
                  value={formData.accessories || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, accessories: e.target.value })
                  }
                  disabled={isLoading}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#009688] focus:outline-none focus:ring-2 focus:ring-[#009688]/20 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Physical Condition */}
              <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Physical Condition at Intake
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Minor scratches on top cover, dent near left hinge, screen protector cracked (Optional)"
                  value={formData.physical_condition || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, physical_condition: e.target.value })
                  }
                  disabled={isLoading}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#009688] focus:outline-none focus:ring-2 focus:ring-[#009688]/20 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Device Intake Photos Upload */}
              <div className="md:col-span-2 lg:col-span-3 space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Device Intake Photos (Optional)
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Snap condition photos with your phone camera or browse files on this computer
                    </p>
                  </div>
                  {photos.length > 0 && (
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-[#009688]">
                      {photos.length} {photos.length === 1 ? "photo" : "photos"} selected
                    </span>
                  )}
                </div>

                {/* 1. Existing Uploaded Photos (when editing) */}
                {existingPhotos.length > 0 && (
                  <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#009688]" />
                        Existing Intake Photos ({existingPhotos.length})
                      </span>
                      <span className="text-[11px] text-slate-400">Click photo to view large</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                      {existingPhotos.map((att) => (
                        <div
                          key={att.id}
                          className="relative group rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden bg-white dark:bg-slate-800 aspect-square min-h-[110px] shadow-2xs"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            onClick={() => setActiveLightboxUrl(att.file_url)}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          />
                          <button
                            type="button"
                            disabled={deletingAttachmentId === att.id}
                            onClick={() => handleDeleteExistingPhoto(att.id, att.file_url)}
                            className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-rose-950 text-rose-400 hover:text-white rounded-full p-1.5 focus:outline-none shadow-md transition-colors cursor-pointer"
                            title="Delete this photo"
                          >
                            {deletingAttachmentId === att.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Action Buttons to Add More Photos */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Option 1: Mobile Phone Camera via QR */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileModalOpen(true)}
                    className="h-10 px-4 text-xs font-semibold border-teal-200 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50"
                  >
                    <Smartphone className="w-4 h-4 mr-2 text-[#009688]" />
                    {isEdit ? "Add More via Phone (Scan QR)" : "Take via Phone Camera (Scan QR)"}
                  </Button>

                  {/* Option 2: Upload from Laptop / PC */}
                  <label className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors h-10 shadow-2xs">
                    <Upload className="h-4 w-4 mr-2 text-slate-500" />
                    Browse Files on Laptop
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      disabled={isLoading}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 3. Newly Added Photos Previews */}
                {photoPreviews.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      New Photos to Save ({photoPreviews.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                      {photoPreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="relative group rounded-xl border border-teal-300 dark:border-teal-700 overflow-hidden bg-slate-100 aspect-square min-h-[110px] dark:bg-slate-800 shadow-2xs"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`New intake photo ${index + 1}`}
                            onClick={() => setActiveLightboxUrl(preview)}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-slate-900 text-rose-400 rounded-full p-1.5 focus:outline-none shadow-md transition-colors"
                            title="Remove photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="min-w-[140px]"
              >
                {submitButtonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* MODAL 1: QUICK ADD DEVICE TYPE */}
      <Modal
        isOpen={isAddTypeModalOpen}
        onClose={() => setIsAddTypeModalOpen(false)}
        title="Add New Device Type"
        description="Add a custom device type category (e.g. Smartwatch, Gaming Console, Drone)"
      >
        <form onSubmit={handleAddTypeSubmit} className="space-y-4 py-2">
          <Input
            label="Device Type Category Name *"
            required
            placeholder="e.g. Smartwatch, Gaming Console"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddTypeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={modalSubmitting}>
              Add & Select Type
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: QUICK ADD BRAND */}
      <Modal
        isOpen={isAddBrandModalOpen}
        onClose={() => setIsAddBrandModalOpen(false)}
        title="Add New Device Brand"
        description={`Add a new manufacturer brand for ${formData.device_type}`}
      >
        <form onSubmit={handleAddBrandSubmit} className="space-y-4 py-2">
          <Input
            label="Brand Name *"
            required
            placeholder="e.g. Acer, Nothing, Motorola, Sony"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddBrandModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={modalSubmitting}>
              Add & Select Brand
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: QUICK ADD MODEL (Linked to Brand) */}
      <Modal
        isOpen={isAddModelModalOpen}
        onClose={() => setIsAddModelModalOpen(false)}
        title={`Add New Model for ${formData.brand}`}
        description={`Add a new model linked to brand '${formData.brand}' and type '${formData.device_type}'`}
      >
        <form onSubmit={handleAddModelSubmit} className="space-y-4 py-2">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-xl text-xs text-[#009688]">
            <span>Catalog Target: </span>
            <strong>{formData.brand}</strong> ➔ <span>{formData.device_type}</span>
          </div>

          <Input
            label="New Model Name *"
            required
            placeholder={`e.g. ${
              formData.brand === "Apple"
                ? "iPhone 16 Pro Max"
                : formData.brand === "Samsung"
                ? "Galaxy S25 Ultra"
                : "Inspiron 16 5630"
            }`}
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddModelModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={modalSubmitting}>
              Add Model to {formData.brand}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MOBILE QR CAMERA INTAKE MODAL */}
      <MobileUploadCompanionModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        onPhotosReceived={handleMobilePhotosReceived}
      />

      {/* FULL-SIZE PHOTO PREVIEW LIGHTBOX */}
      {activeLightboxUrl && (
        <Modal
          isOpen={!!activeLightboxUrl}
          onClose={() => setActiveLightboxUrl(null)}
          title="Intake Photo Preview"
          maxWidth="2xl"
        >
          <div className="flex flex-col items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeLightboxUrl}
              alt="Photo preview full"
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-md"
            />
          </div>
        </Modal>
      )}
    </>
  );
}
