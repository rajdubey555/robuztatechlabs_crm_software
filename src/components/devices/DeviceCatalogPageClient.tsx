"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CatalogItem,
  fetchDeviceCatalog,
  addDeviceCatalogItem,
  updateDeviceCatalogItem,
  deleteDeviceCatalogItem,
  bulkDeleteDeviceCatalogItems,
  bulkUpdateDeviceCategory,
  DEFAULT_CATALOG,
} from "@/services/deviceCatalogService";
import { Button, Card, CardContent, Modal, Input, Select, Alert, EmptyState } from "@/components/ui";

// SVG Icons
function IconGrid({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function IconPlus({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconSearch({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconEdit({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconTrash({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconRefresh({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

interface DeviceCatalogPageClientProps {
  userEmail?: string;
}

import { useBranchContext } from "@/context/BranchContext";

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

  const getItemKey = (item: CatalogItem, index: number) => item.id || `key-${item.device_type}-${item.brand}-${item.model}-${index}`;

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

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    const allFilteredKeys = filteredCatalog.map((item, idx) => getItemKey(item, idx));
    if (selectedKeys.length === allFilteredKeys.length && allFilteredKeys.length > 0) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(allFilteredKeys);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormType(uniqueTypes[0] || "Laptop");
    setFormBrand(uniqueBrands[0] || "Apple");
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
    if (!formType.trim() || !formBrand.trim() || !formModel.trim()) {
      setMessage({ type: "error", text: "Please fill in all fields (Type, Brand, Model)." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

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

  // Bulk Delete Selected
  const handleBulkDelete = async () => {
    if (selectedKeys.length === 0) return;
    setDeleting(true);

    // Extract valid UUID database IDs
    const dbIds = filteredCatalog
      .filter((item, idx) => selectedKeys.includes(getItemKey(item, idx)) && item.id && !item.id.startsWith("def-"))
      .map((item) => item.id as string);

    if (dbIds.length > 0) {
      await bulkDeleteDeviceCatalogItems(dbIds);
    }

    // Filter local state
    setCatalog((prev) =>
      prev.filter((item, idx) => !selectedKeys.includes(getItemKey(item, idx)))
    );

    setSelectedKeys([]);
    setDeleting(false);
    setIsBulkDeleteModalOpen(false);
    setMessage({ type: "success", text: `${selectedKeys.length} catalog items deleted successfully.` });
  };

  // Bulk Category Update
  const handleBulkCategoryUpdate = async () => {
    if (selectedKeys.length === 0 || !targetBulkCategory.trim()) return;
    setBulkUpdating(true);

    const dbIds = filteredCatalog
      .filter((item, idx) => selectedKeys.includes(getItemKey(item, idx)) && item.id && !item.id.startsWith("def-"))
      .map((item) => item.id as string);

    if (dbIds.length > 0) {
      await bulkUpdateDeviceCategory(dbIds, targetBulkCategory.trim());
    }

    // Update local state
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
                <IconGrid className="w-5 h-5" />
              </div>
              <span>Device Categories & Catalog Master</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Add, edit, and organize device types, manufacturer brands, and repair models
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Refresh catalog list"
            >
              <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin text-[#009688]" : ""}`} />
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <IconPlus className="w-4 h-4" />
              Add New Model / Category
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

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] flex items-center justify-center shrink-0 font-extrabold text-lg">
              📱
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Device Categories</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{uniqueTypes.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center shrink-0 font-extrabold text-lg">
              🏷️
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manufacturer Brands</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{uniqueBrands.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0 font-extrabold text-lg">
              💻
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Models</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{catalog.length}</p>
            </div>
          </div>
        </div>

        {/* Filters & Bulk Action Bar */}
        <div className="space-y-3">
          {/* BULK ACTION BAR */}
          {selectedKeys.length > 0 && (
            <div className="bg-[#009688] text-white px-4 py-2.5 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-2 font-medium text-xs">
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                  {selectedKeys.length} / {filteredCatalog.length} Items Selected
                </span>
                <span>Bulk Operations Ready</span>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                <button
                  onClick={() => setIsBulkCategoryModalOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-xs transition-transform active:scale-95 flex items-center gap-1"
                >
                  <span>🏷️</span> Bulk Change Category
                </button>

                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 font-bold text-white shadow-xs transition-transform active:scale-95 flex items-center gap-1"
                >
                  <span>🗑️</span> Delete Selected ({selectedKeys.length})
                </button>

                <button
                  onClick={() => setSelectedKeys([])}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-medium transition-colors"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search type, brand, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688]"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688] font-medium"
              >
                <option value="ALL">All Categories ({uniqueTypes.length})</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688] font-medium"
              >
                <option value="ALL">All Brands ({uniqueBrands.length})</option>
                {uniqueBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
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
                  className="text-xs font-semibold text-rose-600 hover:underline shrink-0 px-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Catalog Items Table */}
        <Card className="shadow-xs overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pl-4 pr-2 py-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedKeys.length > 0 &&
                        selectedKeys.length === filteredCatalog.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-[#009688] focus:ring-[#009688] h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">Device Category / Type</th>
                  <th className="px-4 py-3.5">Brand</th>
                  <th className="px-4 py-3.5">Model Name</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No device catalog items match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map((item, idx) => {
                    const itemKey = getItemKey(item, idx);
                    const isSelected = selectedKeys.includes(itemKey);

                    return (
                      <tr
                        key={itemKey}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-teal-50/30 dark:bg-teal-950/20"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <td className="pl-4 pr-2 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(itemKey)}
                            className="rounded border-slate-300 text-[#009688] focus:ring-[#009688] h-4 w-4 cursor-pointer"
                          />
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#009688] font-bold border border-teal-200/60 dark:border-teal-900">
                            <span>📱</span> {item.device_type}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-200">
                          <span className="inline-flex items-center gap-1">
                            <strong className="text-slate-900 dark:text-white font-mono">{item.brand}</strong>
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          {item.model}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Catalog Entry"
                            >
                              <IconEdit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              title="Delete Entry"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

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
