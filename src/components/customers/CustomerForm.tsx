"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { CustomerFormData, CustomerFormErrors } from "@/types/customer";
import { Input, Button, Card, CardContent, Select } from "@/components/ui";
import {
  User,
  Phone,
  PhoneCall,
  Mail,
  MapPin,
  Building,
  FileText,
  Save,
  Map,
  Loader2,
} from "lucide-react";
import { BRANCHES } from "@/types/branch";

export interface CustomerFormProps {
  initialData?: CustomerFormData;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
}

const DEFAULT_INDIAN_STATES = [
  "Gujarat",
  "Maharashtra",
  "Rajasthan",
  "Delhi",
  "Karnataka",
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Tamil Nadu",
  "Telangana",
  "Andhra Pradesh",
  "West Bengal",
  "Bihar",
  "Kerala",
  "Odisha",
  "Goa",
  "Assam",
  "Chhattisgarh",
  "Jharkhand",
  "Uttarakhand",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Chandigarh",
];

const DEFAULT_GUJARAT_CITIES = [
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Bhavnagar",
  "Jamnagar",
  "Gandhinagar",
  "Junagadh",
  "Anand",
  "Navsari",
  "Morbi",
  "Nadiad",
  "Surendranagar",
  "Bharuch",
  "Mehsana",
  "Bhuj",
  "Porbandar",
  "Palanpur",
  "Valsad",
  "Vapi",
  "Gondal",
  "Veraval",
  "Godhra",
  "Patan",
  "Kalol",
];

export function CustomerForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonText = "Save Customer",
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    full_name: initialData?.full_name || "",
    phone: initialData?.phone || "",
    alternate_phone: initialData?.alternate_phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    state: initialData?.state || "Gujarat",
    city: initialData?.city || "Ahmedabad",
    branch: initialData?.branch || "south_bopal",
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState<CustomerFormErrors>({});

  // Dynamic States & Cities from Free Geo API
  const [statesList, setStatesList] = useState<string[]>(DEFAULT_INDIAN_STATES);
  const [citiesList, setCitiesList] = useState<string[]>(DEFAULT_GUJARAT_CITIES);
  const [loadingCities, setLoadingCities] = useState(false);

  // 1. Load Indian States List on Mount
  useEffect(() => {
    async function loadStates() {
      try {
        const res = await fetch("/api/geo?action=states");
        const json = await res.json();
        if (json.success && Array.isArray(json.states) && json.states.length > 0) {
          setStatesList(json.states);
        }
      } catch (e) {
        console.warn("Could not load states list from API, using defaults:", e);
      }
    }
    loadStates();
  }, []);

  // 2. Fetch Cities whenever selected State changes
  useEffect(() => {
    let active = true;
    const currentState = formData.state || "Gujarat";

    async function loadCities() {
      setLoadingCities(true);
      try {
        const res = await fetch(`/api/geo?action=cities&state=${encodeURIComponent(currentState)}`);
        const json = await res.json();
        if (active && json.success && Array.isArray(json.cities) && json.cities.length > 0) {
          setCitiesList(json.cities);
          // If current city is not in the new state's cities and not typed, pick first city
          if (!formData.city || (json.cities[0] && !json.cities.includes(formData.city) && currentState !== "Gujarat")) {
            setFormData((prev) => ({ ...prev, city: json.cities[0] }));
          }
        }
      } catch (e) {
        console.warn("Could not load cities for state:", e);
      } finally {
        if (active) setLoadingCities(false);
      }
    }

    loadCities();
    return () => {
      active = false;
    };
  }, [formData.state]);

  const validate = (): boolean => {
    const newErrors: CustomerFormErrors = {};

    // Full Name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required.";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Full name must be at least 2 characters.";
    }

    // Phone validation (Indian 10-digit number format)
    const phoneRegex = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = "Enter a valid 10-digit Indian phone number (starts with 6-9).";
    }

    // Alternate Phone validation (optional)
    if (formData.alternate_phone && formData.alternate_phone.trim()) {
      const cleanAltPhone = formData.alternate_phone.replace(/[\s-]/g, "");
      if (!phoneRegex.test(cleanAltPhone)) {
        newErrors.alternate_phone = "Please enter a valid alternate phone number.";
      }
    }

    // Email validation (optional)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <Card className="shadow-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Customer Contact Details */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-[#009688]" />
                Customer Identity & Contact
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <Input
                label="Full Name *"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                error={errors.full_name}
                disabled={isLoading}
                startIcon={<User className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="Phone Number *"
                required
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                error={errors.phone}
                disabled={isLoading}
                startIcon={<Phone className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="Alternate Phone"
                placeholder="e.g. 9123456780"
                value={formData.alternate_phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, alternate_phone: e.target.value })
                }
                error={errors.alternate_phone}
                disabled={isLoading}
                startIcon={<PhoneCall className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. rahul@example.com"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={errors.email}
                disabled={isLoading}
                startIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </div>

          {/* Section 2: Location & Branch */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between">
              <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#009688]" />
                Location & Branch
              </h3>
              {loadingCities && (
                <span className="text-xs text-slate-400 inline-flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#009688]" />
                  Loading cities...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* State Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  State *
                </label>
                <Select
                  options={statesList.map((st) => ({ label: st, value: st }))}
                  value={formData.state || "Gujarat"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value,
                    })
                  }
                  disabled={isLoading}
                />
              </div>

              {/* City Autocomplete */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  City *
                </label>
                <div className="relative">
                  <Input
                    list="indian-cities-datalist"
                    placeholder="Select or enter city"
                    value={formData.city || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    error={errors.city}
                    disabled={isLoading}
                    startIcon={<Building className="w-4 h-4 text-slate-400" />}
                    autoComplete="off"
                  />
                  <datalist id="indian-cities-datalist">
                    {citiesList.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Branch *
                </label>
                <Select
                  options={[
                    { label: "South Bopal Lab (Main)", value: "south_bopal" },
                    { label: "Tragad Lab (Branch 2)", value: "tragad" },
                    { label: "Both Labs (Shared)", value: "both" },
                  ]}
                  value={formData.branch || "south_bopal"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branch: e.target.value as "south_bopal" | "tragad" | "both",
                    })
                  }
                  disabled={isLoading}
                />
              </div>

              {/* Street Address */}
              <div className="md:col-span-3">
                <Input
                  label="Address"
                  placeholder="e.g. 402, Shivalik Plaza, Near SOBO Center, South Bopal"
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  error={errors.address}
                  disabled={isLoading}
                  startIcon={<Map className="w-4 h-4 text-slate-400" />}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#009688]" />
                Notes
              </h3>
            </div>

            <div className="space-y-1.5">
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] transition-colors"
                placeholder="Add any internal customer notes or preferences..."
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
          </div>


          {/* Submit Actions Bar */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-slate-800">
            <Link href="/customers">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="px-6 font-medium"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {submitButtonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
