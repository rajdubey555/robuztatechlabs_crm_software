"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CatalogItem,
  fetchDeviceCatalog,
  addDeviceCatalogItem,
  updateDeviceCatalogItem,
  deleteDeviceCatalogItem,
  bulkDeleteDeviceCatalogItems,
  bulkUpdateDeviceCategory,
} from "@/services/deviceCatalogService";
import { LAPTOP_PRESETS, DRONE_PRESETS } from "@/services/catalogPresets";
import { Button, Card, CardContent, Modal, Input, Select, Alert, EmptyState } from "@/components/ui";
import { useBranchContext } from "@/context/BranchContext";
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Globe,
  Laptop,
  Crosshair,
  Smartphone,
  Check,
  CheckSquare,
  Square,
  Download,
  Tag,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface DeviceCatalogPageClientProps {
  userEmail?: string;
}

interface ExternalBrand {
  brand_id: number;
  brand_name: string;
  brand_slug: string;
  device_count: number;
}

interface ExternalModel {
  name: string;
  slug: string;
  image?: string;
  selected: boolean;
}

export function DeviceCatalogPageClient({ userEmail }: DeviceCatalogPageClientProps) {
  const { selectedCategory } = useBranchContext();

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("ALL");

  useEffect(() => {
    if (selectedCategory === "drone") {
      setSelectedTypeFilter("Drone");
    } else if (selectedCategory === "laptop_general") {
      setSelectedTypeFilter("Laptop");
    } else {
      setSelectedTypeFilter("ALL");
    }
  }, [selectedCategory]);

  // Selection State for Bulk Operations
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formType, setFormType] = useState("Laptop");
  const [formBrand, setFormBrand] = useState("Dell");
  const [formModel, setFormModel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bulk Category Update Modal State
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [targetBulkCategory, setTargetBulkCategory] = useState("Laptop");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // -------------------------------------------------------------
  // FREE EXTERNAL API SYNC MODAL STATE
  // -------------------------------------------------------------
  const [isApiSyncModalOpen, setIsApiSyncModalOpen] = useState(false);
  const [apiTab, setApiTab] = useState<"phones" | "laptops" | "drones">("phones");

  // Phone Specs API state
  const [apiBrands, setApiBrands] = useState<ExternalBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<ExternalBrand | null>(null);
  const [targetPhoneType, setTargetPhoneType] = useState("Smartphone");

  const [apiModels, setApiModels] = useState<ExternalModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [importingApi, setImportingApi] = useState(false);

  const getItemKey = (item: CatalogItem, index: number) =>
    item.id || `key-${item.device_type}-${item.brand}-${item.model}-${index}`;

  const loadData = async () => {
    setLoading(true);
    const data = await fetchDeviceCatalog();
    setCatalog(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics & unique values
  const uniqueTypes = Array.from(new Set(catalog.map((item) => item.device_type)));
  const uniqueBrands = Array.from(new Set(catalog.map((item) => item.brand)));

  // Filter items
  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch =
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.device_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedTypeFilter === "ALL" || item.device_type === selectedTypeFilter;
    const matchesBrand = selectedBrandFilter === "ALL" || item.brand === selectedBrandFilter;

    return matchesSearch && matchesType && matchesBrand;
  });

  // Load External Brands on Modal Open
  useEffect(() => {
    if (isApiSyncModalOpen && apiBrands.length === 0) {
      async function loadBrands() {
        setLoadingBrands(true);
        try {
          const res = await fetch("/api/external-devices?action=brands");
          const json = await res.json();
          if (json.success && json.brands) {
            setApiBrands(json.brands);
            // Default select Apple if available
            const apple = json.brands.find((b: ExternalBrand) => b.brand_name.toLowerCase() === "apple") || json.brands[0];
            if (apple) {
              setSelectedBrand(apple);
            }
          }
        } catch (e) {
          console.error("Failed to load external brands", e);
        } finally {
          setLoadingBrands(false);
        }
      }
      loadBrands();
    }
  }, [isApiSyncModalOpen, apiBrands.length]);

  // Load Models when selectedBrand changes
  useEffect(() => {
    if (selectedBrand) {
      async function loadModels() {
        setLoadingModels(true);
        try {
          const res = await fetch(`/api/external-devices?action=models&brandSlug=${selectedBrand?.brand_slug}`);
          const json = await res.json();
          if (json.success && json.models) {
            setApiModels(
              json.models.map((m: { name: string; slug: string; image?: string }) => ({
                ...m,
                selected: true,
              }))
            );
          } else {
            setApiModels([]);
          }
        } catch (e) {
          console.error("Failed to load external models", e);
          setApiModels([]);
        } finally {
          setLoadingModels(false);
        }
      }
      loadModels();
    }
  }, [selectedBrand]);

  // Filtered External Brands & Models for modal
  const filteredApiBrands = useMemo(() => {
    if (!brandSearch.trim()) return apiBrands;
    return apiBrands.filter((b) =>
      b.brand_name.toLowerCase().includes(brandSearch.toLowerCase().trim())
    );
  }, [apiBrands, brandSearch]);

  const filteredApiModels = useMemo(() => {
    if (!modelSearch.trim()) return apiModels;
    return apiModels.filter((m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase().trim())
    );
  }, [apiModels, modelSearch]);

  const toggleSelectAllModels = () => {
    const allSelected = filteredApiModels.every((m) => m.selected);
    const targetNames = new Set(filteredApiModels.map((m) => m.name));
    setApiModels((prev) =>
      prev.map((m) => (targetNames.has(m.name) ? { ...m, selected: !allSelected } : m))
    );
  };

  const toggleModelSelection = (name: string) => {
    setApiModels((prev) =>
      prev.map((m) => (m.name === name ? { ...m, selected: !m.selected } : m))
    );
  };

  // Import Selected Models from API
  const handleImportApiModels = async () => {
    const selected = apiModels.filter((m) => m.selected);
    if (!selectedBrand || selected.length === 0) return;

    setImportingApi(true);
    try {
      const itemsToImport = selected.map((m) => ({
        device_type: targetPhoneType.trim() || "Smartphone",
        brand: selectedBrand.brand_name.trim(),
        model: m.name.trim(),
        category_type: targetPhoneType.toLowerCase() === "drone" ? "drone" : "laptop_general",
      }));

      const res = await fetch("/api/external-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToImport }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to import models");
      }

      setMessage({
        type: "success",
        text: `Successfully imported ${selected.length} models for ${selectedBrand.brand_name} into catalog!`,
      });
      setIsApiSyncModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error importing models";
      setMessage({ type: "error", text: msg });
    } finally {
      setImportingApi(false);
    }
  };

  // Import Presets (Laptops or Drones)
  const handleImportPresets = async (type: "laptop" | "drone") => {
    const presets = type === "laptop" ? LAPTOP_PRESETS : DRONE_PRESETS;
    setImportingApi(true);
    try {
      const res = await fetch("/api/external-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: presets }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to import presets");
      }

      setMessage({
        type: "success",
        text: `Successfully imported ${presets.length} popular ${type === "laptop" ? "Laptop" : "Drone"} models!`,
      });
      setIsApiSyncModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error importing presets";
      setMessage({ type: "error", text: msg });
    } finally {
      setImportingApi(false);
    }
  };

  // Handle Manual Add or Edit
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormType("Laptop");
    setFormBrand("Dell");
    setFormModel("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormType(item.device_type);
    setFormBrand(item.brand);
    setFormModel(item.model);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formType.trim() || !formBrand.trim() || !formModel.trim()) return;

    setSubmitting(true);
    const payload: CatalogItem = {
      device_type: formType.trim(),
      brand: formBrand.trim(),
      model: formModel.trim(),
    };

    let success = false;
    if (editingItem && editingItem.id) {
      success = await updateDeviceCatalogItem(editingItem.id, payload);
      if (success) {
        setCatalog((prev) =>
          prev.map((c) => (c.id === editingItem.id ? { ...c, ...payload } : c))
        );
        setMessage({ type: "success", text: "Catalog item updated successfully!" });
      }
    } else {
      success = await addDeviceCatalogItem(payload);
      if (success) {
        setCatalog((prev) => [payload, ...prev]);
        setMessage({ type: "success", text: "New catalog item added successfully!" });
      }
    }

    setSubmitting(false);
    if (success) {
      setIsModalOpen(false);
      loadData();
    } else {
      setMessage({ type: "error", text: "Failed to save catalog item." });
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeleting(true);

    if (itemToDelete.id) {
      await deleteDeviceCatalogItem(itemToDelete.id);
    }
    setCatalog((prev) => prev.filter((c) => c !== itemToDelete && c.id !== itemToDelete.id));

    setDeleting(false);
    setItemToDelete(null);
    setMessage({ type: "success", text: "Catalog item deleted successfully." });
  };

  const handleBulkDelete = async () => {
    if (selectedKeys.length === 0) return;
    setDeleting(true);

    const dbIds = filteredCatalog
      .filter((item, idx) => selectedKeys.includes(getItemKey(item, idx)) && item.id && !item.id.startsWith("def-"))
      .map((item) => item.id as string);

    if (dbIds.length > 0) {
      await bulkDeleteDeviceCatalogItems(dbIds);
    }

    setCatalog((prev) =>
      prev.filter((item, idx) => !selectedKeys.includes(getItemKey(item, idx)))
    );

    setSelectedKeys([]);
    setDeleting(false);
    setIsBulkDeleteModalOpen(false);
    setMessage({ type: "success", text: `${selectedKeys.length} catalog items deleted successfully.` });
  };

  const handleBulkCategoryUpdate = async () => {
    if (selectedKeys.length === 0 || !targetBulkCategory.trim()) return;
    setBulkUpdating(true);

    const dbIds = filteredCatalog
      .filter((item, idx) => selectedKeys.includes(getItemKey(item, idx)) && item.id && !item.id.startsWith("def-"))
      .map((item) => item.id as string);

    if (dbIds.length > 0) {
      await bulkUpdateDeviceCategory(dbIds, targetBulkCategory.trim());
    }

    setCatalog((prev) =>
      prev.map((item, idx) =>
        selectedKeys.includes(getItemKey(item, idx))
          ? { ...item, device_type: targetBulkCategory.trim() }
          : item
      )
    );

    setSelectedKeys([]);
    setBulkUpdating(false);
    setIsBulkCategoryModalOpen(false);
    setMessage({ type: "success", text: `Category updated to '${targetBulkCategory}' for selected items.` });
  };

  return (
    <AppShell userEmail={userEmail}>
      <div className="w-full space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#009688] text-white flex items-center justify-center shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <span>Device Categories & Catalog Master</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Manage master device types, manufacturer brands, and auto-complete repair models
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Free Live API Import Button */}
            <button
              onClick={() => setIsApiSyncModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-teal-500" />
              <span>Import from Free API</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh catalog list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#009688]" : ""}`} />
            </button>

            {/* Add Model Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Model</span>
            </button>
          </div>
        </div>

        {message && (
          <Alert
            variant={message.type === "success" ? "success" : "error"}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {/* Metrics Row (Upgraded with 100% Lucide Icons) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Device Categories</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{uniqueTypes.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manufacturer Brands</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{uniqueBrands.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Master Models</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{catalog.length}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <Card>
          <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models, brands, or categories..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
              >
                <option value="ALL">All Categories ({uniqueTypes.length})</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
              >
                <option value="ALL">All Brands ({uniqueBrands.length})</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {(selectedTypeFilter !== "ALL" || selectedBrandFilter !== "ALL" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedTypeFilter("ALL");
                    setSelectedBrandFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold px-2 py-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedKeys.length > 0 && (
            <div className="bg-teal-50 dark:bg-teal-950/40 px-4 py-2 flex items-center justify-between border-b border-teal-100 dark:border-teal-900/40 text-xs">
              <span className="font-semibold text-teal-900 dark:text-teal-200">
                {selectedKeys.length} items selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkCategoryModalOpen(true)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 rounded-md font-medium text-teal-800 dark:text-teal-200 hover:bg-teal-100"
                >
                  Change Category
                </button>
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-md font-medium hover:bg-rose-700"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredCatalog.length > 0 &&
                        filteredCatalog.every((item, idx) => selectedKeys.includes(getItemKey(item, idx)))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedKeys(filteredCatalog.map((item, idx) => getItemKey(item, idx)));
                        } else {
                          setSelectedKeys([]);
                        }
                      }}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="py-2.5 px-4">Device Category</th>
                  <th className="py-2.5 px-4">Brand</th>
                  <th className="py-2.5 px-4">Model Name</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading catalog...
                    </td>
                  </tr>
                ) : filteredCatalog.length > 0 ? (
                  filteredCatalog.map((item, idx) => {
                    const key = getItemKey(item, idx);
                    const isSelected = selectedKeys.includes(key);

                    return (
                      <tr
                        key={key}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? "bg-teal-50/30 dark:bg-teal-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedKeys((prev) => [...prev, key]);
                              } else {
                                setSelectedKeys((prev) => prev.filter((k) => k !== key));
                              }
                            }}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {item.device_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {item.brand}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {item.model}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                              title="Edit item"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No models match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filteredCatalog.length} of {catalog.length} items</span>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FREE EXTERNAL API SYNC MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isApiSyncModalOpen}
        onClose={() => setIsApiSyncModalOpen(false)}
        title="🌐 Import Master Models from Free Device API"
        description="Fetch 100% free live models (iPhones, Galaxys, MacBooks, Drones) into your database"
      >
        <div className="space-y-4 py-2">
          {/* Segmented Tabs */}
          <div className="inline-flex h-9 w-full items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setApiTab("phones")}
              className={`flex-1 h-7.5 rounded-md font-medium transition-all ${
                apiTab === "phones"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              📱 Live Phones & Tablets API
            </button>
            <button
              type="button"
              onClick={() => setApiTab("laptops")}
              className={`flex-1 h-7.5 rounded-md font-medium transition-all ${
                apiTab === "laptops"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              💻 Laptops Preset (50+)
            </button>
            <button
              type="button"
              onClick={() => setApiTab("drones")}
              className={`flex-1 h-7.5 rounded-md font-medium transition-all ${
                apiTab === "drones"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🛸 Drones Preset (25+)
            </button>
          </div>

          {/* TAB 1: PHONES & TABLETS (LIVE API) */}
          {apiTab === "phones" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Brand Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Manufacturer Brand
                  </label>
                  {loadingBrands ? (
                    <div className="text-xs text-slate-400 py-2 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      Loading 100+ brands...
                    </div>
                  ) : (
                    <select
                      value={selectedBrand?.brand_slug || ""}
                      onChange={(e) => {
                        const brand = apiBrands.find((b) => b.brand_slug === e.target.value);
                        if (brand) setSelectedBrand(brand);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                    >
                      {filteredApiBrands.map((b) => (
                        <option key={b.brand_id} value={b.brand_slug}>
                          {b.brand_name} ({b.device_count} devices)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Tag Category Type */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tag as Category in CRM
                  </label>
                  <select
                    value={targetPhoneType}
                    onChange={(e) => setTargetPhoneType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="Smartphone">Smartphone / Mobile</option>
                    <option value="iPhone">iPhone (Apple)</option>
                    <option value="Tablet">Tablet / iPad</option>
                    <option value="Smartwatch">Smartwatch / Wearable</option>
                    <option value="General Device">General Device</option>
                  </select>
                </div>
              </div>

              {/* Models List Header */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {selectedBrand?.brand_name} Models ({apiModels.filter((m) => m.selected).length}/{apiModels.length} selected)
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAllModels}
                  className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  {apiModels.every((m) => m.selected) ? "Unselect All" : "Select All"}
                </button>
              </div>

              {/* Search in Models */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter models (e.g. 18 Pro, S24, Ultra)..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              {/* Scrollable Model Checkbox List */}
              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 p-1">
                {loadingModels ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    Fetching latest models from GSMArena live API...
                  </div>
                ) : filteredApiModels.length > 0 ? (
                  filteredApiModels.map((m) => (
                    <label
                      key={m.name}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={m.selected}
                        onChange={() => toggleModelSelection(m.name)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                    </label>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No models found for this search.
                  </div>
                )}
              </div>

              {/* Submit Import */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsApiSyncModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImportApiModels}
                  isLoading={importingApi}
                  disabled={apiModels.filter((m) => m.selected).length === 0}
                  className="bg-[#009688] hover:bg-[#00796b] text-white"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Import {apiModels.filter((m) => m.selected).length} Models to Catalog
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: LAPTOPS PRESET */}
          {apiTab === "laptops" && (
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Includes 50+ Top Indian Repair Laptops:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                  <li>Apple: MacBook Air M1/M2/M3, MacBook Pro 14"/16" M1/M2/M3/M4</li>
                  <li>Dell: Inspiron 15/14, Vostro, XPS 13/14/15/16, Latitude 3420/5420, Alienware</li>
                  <li>HP: Pavilion 14/15, Victus 15/16 Gaming, Omen 16/17, Envy x360, Spectre</li>
                  <li>Lenovo: ThinkPad E14/E15/T14/X1 Carbon, IdeaPad 3/Gaming, Legion 5/7</li>
                  <li>ASUS: TUF Gaming F15/A15, ROG Strix G15/G16, Vivobook 15/16, ZenBook 14</li>
                  <li>Acer: Aspire 3/5, Nitro 5/16 Gaming, Predator Helios 16, Swift Go</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsApiSyncModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleImportPresets("laptop")}
                  isLoading={importingApi}
                  className="bg-[#009688] hover:bg-[#00796b] text-white"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Import 50+ Laptops into Database
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: DRONES PRESET */}
          {apiTab === "drones" && (
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Includes 25+ Commercial & Industrial Drones:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                  <li>DJI Consumer: Mini 2/3/4 Pro, Air 2S/3, Mavic 2/3/3 Pro/Classic</li>
                  <li>DJI Enterprise: Mavic 3 Thermal (3T), Matrice 30/30T, Matrice 300/350 RTK</li>
                  <li>DJI FPV & Agri: Avata / Avata 2 FPV, Agras T30/T40/T50</li>
                  <li>Autel Robotics: EVO Nano+, EVO Lite+, EVO II Pro V3 (6K), EVO II Dual 640T, Max 4T</li>
                  <li>Skydio: Skydio 2+, Skydio X2, Skydio X10 Enterprise</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsApiSyncModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleImportPresets("drone")}
                  isLoading={importingApi}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Import 25+ Drones into Database
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Catalog Item" : "Add New Device Catalog Entry"}
        description="Configure category type, brand, and exact model name"
      >
        <form onSubmit={handleSaveItem} className="space-y-4 py-2">
          <Input
            label="Device Category / Type *"
            required
            placeholder="e.g. Laptop, iPhone, MacBook, Android Phone, Tablet"
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
          />

          <Input
            label="Manufacturer Brand *"
            required
            placeholder="e.g. Apple, Samsung, Dell, HP, Lenovo, Asus"
            value={formBrand}
            onChange={(e) => setFormBrand(e.target.value)}
          />

          <Input
            label="Model Name *"
            required
            placeholder="e.g. iPhone 16 Pro Max, Inspiron 15 3511, Galaxy S24"
            value={formModel}
            onChange={(e) => setFormModel(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              {editingItem ? "Update Entry" : "Save Entry"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Delete Catalog Item"
        description={`Are you sure you want to remove '${itemToDelete?.brand} - ${itemToDelete?.model}' from master catalog?`}
      >
        <div className="flex justify-end gap-2 py-2">
          <Button variant="ghost" onClick={() => setItemToDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteItem}
            isLoading={deleting}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Delete Item
          </Button>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Bulk Delete Catalog Items"
        description={`Are you sure you want to permanently delete ${selectedKeys.length} selected catalog items?`}
      >
        <div className="flex justify-end gap-2 py-2">
          <Button variant="ghost" onClick={() => setIsBulkDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkDelete}
            isLoading={deleting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            Delete {selectedKeys.length} Items
          </Button>
        </div>
      </Modal>

      {/* Bulk Category Change Modal */}
      <Modal
        isOpen={isBulkCategoryModalOpen}
        onClose={() => setIsBulkCategoryModalOpen(false)}
        title="Bulk Change Category / Type"
        description={`Assign a new device category to ${selectedKeys.length} selected items.`}
      >
        <div className="space-y-4 py-2">
          <Input
            label="New Category / Type *"
            placeholder="e.g. Laptop, iPhone, MacBook, Android Phone, Tablet"
            value={targetBulkCategory}
            onChange={(e) => setTargetBulkCategory(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsBulkCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkCategoryUpdate}
              isLoading={bulkUpdating}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Update {selectedKeys.length} Items
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
