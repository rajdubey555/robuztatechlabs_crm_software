"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { DeviceFormData, DeviceFormErrors, DeviceType } from "@/types/device";
import { Customer } from "@/types/customer";
import { Input, Select, Button, Card, CardContent, Modal } from "@/components/ui";
import {
  CatalogItem,
  fetchDeviceCatalog,
  addDeviceCatalogItem,
  DEFAULT_CATALOG,
} from "@/services/deviceCatalogService";

export interface DeviceFormProps {
  customers: Customer[];
  initialData?: DeviceFormData;
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
  const [errors, setErrors] = useState<DeviceFormErrors>({});
  const [isCustomModel, setIsCustomModel] = useState(false);

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

  // Update brand/model defaults when device_type changes
  const handleDeviceTypeChange = (newType: DeviceType) => {
    // Check if current brand exists for this type
    const brandsForType = Array.from(
      new Set(
        catalog
          .filter((c) => !c.device_type || c.device_type === newType)
          .map((c) => c.brand)
      )
    );

    let nextBrand = formData.brand;
    if (brandsForType.length > 0 && (!nextBrand || !brandsForType.includes(nextBrand))) {
      nextBrand = brandsForType[0];
    }

    // Filter models for next brand
    const availableModels = catalog
      .filter((c) => c.brand.toLowerCase() === nextBrand.toLowerCase())
      .map((c) => c.model);

    setFormData({
      ...formData,
      device_type: newType,
      brand: nextBrand,
      model: availableModels.length > 0 ? availableModels[0] : "",
    });
    setIsCustomModel(false);
  };

  // When Brand changes, filter Models for that brand
  const handleBrandChange = (newBrand: string) => {
    const availableModels = catalog
      .filter((c) => c.brand.toLowerCase() === newBrand.toLowerCase())
      .map((c) => c.model);

    setFormData({
      ...formData,
      brand: newBrand,
      model: availableModels.length > 0 ? availableModels[0] : "",
    });
    setIsCustomModel(false);
  };

  // Compute available Brands for current Device Type
  const availableBrands = Array.from(
    new Set(
      catalog
        .filter((c) => !c.device_type || c.device_type === formData.device_type)
        .map((c) => c.brand)
    )
  );
  // Include current brand if custom
  if (formData.brand && !availableBrands.includes(formData.brand)) {
    availableBrands.unshift(formData.brand);
  }
  if (availableBrands.length === 0) {
    availableBrands.push("Apple", "Samsung", "Dell", "HP", "Lenovo", "Asus");
  }

  // Compute available Models for current selected Brand & Device Type
  const availableModels = catalog
    .filter((c) => {
      const matchBrand = c.brand.toLowerCase() === (formData.brand || "").toLowerCase();
      return matchBrand;
    })
    .map((c) => c.model);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Select */}
              <div className="md:col-span-2">
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

              {/* Model with + Quick Add & Brand Association */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Model *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddModelModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#009688] hover:underline"
                    title={`Add new model for ${formData.brand}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-xs">
                      +
                    </span>
                    <span>Add Model</span>
                  </button>
                </div>

                {availableModels.length > 0 ? (
                  <Select
                    disabled={isLoading}
                    options={availableModels.map((m) => ({ label: m, value: m }))}
                    value={
                      availableModels.includes(formData.model)
                        ? formData.model
                        : availableModels[0] || ""
                    }
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    error={errors.model}
                  />
                ) : (
                  <Input
                    placeholder="Type model name"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    error={errors.model}
                    disabled={isLoading}
                  />
                )}
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
              <div className="md:col-span-2 space-y-1.5">
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
              <div className="md:col-span-2 space-y-1.5">
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
              <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Device Intake Photos (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                    <svg className="h-5 w-5 mr-2 text-[#009688]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Select Device Photos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      disabled={isLoading}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">
                    Upload front, back, screen, or damage photos
                  </span>
                </div>

                {/* Photo Previews */}
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {photoPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-square dark:border-slate-800 dark:bg-slate-800"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt={`Intake photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 focus:outline-none shadow-md"
                          title="Remove photo"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
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
    </>
  );
}
