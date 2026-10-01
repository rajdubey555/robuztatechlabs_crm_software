import { createClient } from "@/lib/supabase/client";

export interface CatalogItem {
  id?: string;
  device_type: string;
  brand: string;
  model: string;
  created_at?: string;
}

export const DEFAULT_CATALOG: CatalogItem[] = [
  // Apple iPhone
  { id: "def-1", device_type: "iPhone", brand: "Apple", model: "iPhone 11" },
  { id: "def-2", device_type: "iPhone", brand: "Apple", model: "iPhone 12" },
  { id: "def-3", device_type: "iPhone", brand: "Apple", model: "iPhone 12 Pro" },
  { id: "def-4", device_type: "iPhone", brand: "Apple", model: "iPhone 13" },
  { id: "def-5", device_type: "iPhone", brand: "Apple", model: "iPhone 13 Pro Max" },
  { id: "def-6", device_type: "iPhone", brand: "Apple", model: "iPhone 14" },
  { id: "def-7", device_type: "iPhone", brand: "Apple", model: "iPhone 14 Pro" },
  { id: "def-8", device_type: "iPhone", brand: "Apple", model: "iPhone 15" },
  { id: "def-9", device_type: "iPhone", brand: "Apple", model: "iPhone 15 Pro Max" },
  { id: "def-10", device_type: "iPhone", brand: "Apple", model: "iPhone 16" },
  { id: "def-11", device_type: "iPhone", brand: "Apple", model: "iPhone 16 Pro Max" },
  // Apple MacBook
  { id: "def-12", device_type: "MacBook", brand: "Apple", model: "MacBook Air M1 (2020)" },
  { id: "def-13", device_type: "MacBook", brand: "Apple", model: "MacBook Air M2 (2022)" },
  { id: "def-14", device_type: "MacBook", brand: "Apple", model: "MacBook Air M3 (2024)" },
  { id: "def-15", device_type: "MacBook", brand: "Apple", model: "MacBook Pro 13\" M1" },
  { id: "def-16", device_type: "MacBook", brand: "Apple", model: "MacBook Pro 14\" M2 Pro" },
  { id: "def-17", device_type: "MacBook", brand: "Apple", model: "MacBook Pro 16\" M3 Max" },
  // Apple iPad
  { id: "def-18", device_type: "Tablet", brand: "Apple", model: "iPad Air 5th Gen" },
  { id: "def-19", device_type: "Tablet", brand: "Apple", model: "iPad Pro 11\" M2" },
  { id: "def-20", device_type: "Tablet", brand: "Apple", model: "iPad Pro 12.9\" M2" },
  { id: "def-21", device_type: "Tablet", brand: "Apple", model: "iPad Mini 6th Gen" },
  // Samsung
  { id: "def-22", device_type: "Android Phone", brand: "Samsung", model: "Galaxy S21" },
  { id: "def-23", device_type: "Android Phone", brand: "Samsung", model: "Galaxy S22 Ultra" },
  { id: "def-24", device_type: "Android Phone", brand: "Samsung", model: "Galaxy S23" },
  { id: "def-25", device_type: "Android Phone", brand: "Samsung", model: "Galaxy S24 Ultra" },
  { id: "def-26", device_type: "Android Phone", brand: "Samsung", model: "Galaxy A54 5G" },
  { id: "def-27", device_type: "Android Phone", brand: "Samsung", model: "Galaxy Z Fold 5" },
  { id: "def-28", device_type: "Android Phone", brand: "Samsung", model: "Galaxy Z Flip 5" },
  { id: "def-29", device_type: "Tablet", brand: "Samsung", model: "Galaxy Tab S8" },
  { id: "def-30", device_type: "Tablet", brand: "Samsung", model: "Galaxy Tab S9 Ultra" },
  // Dell
  { id: "def-31", device_type: "Laptop", brand: "Dell", model: "Inspiron 15 3511" },
  { id: "def-32", device_type: "Laptop", brand: "Dell", model: "Inspiron 14 5420" },
  { id: "def-33", device_type: "Laptop", brand: "Dell", model: "Vostro 3510" },
  { id: "def-34", device_type: "Laptop", brand: "Dell", model: "XPS 13 9315" },
  { id: "def-35", device_type: "Laptop", brand: "Dell", model: "XPS 15 9530" },
  { id: "def-36", device_type: "Laptop", brand: "Dell", model: "Latitude 5420" },
  { id: "def-37", device_type: "Desktop", brand: "Dell", model: "OptiPlex 7090 Tower" },
  // HP
  { id: "def-38", device_type: "Laptop", brand: "HP", model: "Pavilion 15-eg2000" },
  { id: "def-39", device_type: "Laptop", brand: "HP", model: "HP 14s-dq3000" },
  { id: "def-40", device_type: "Laptop", brand: "HP", model: "Spectre x360 14" },
  { id: "def-41", device_type: "Laptop", brand: "HP", model: "Envy 13-ba1000" },
  { id: "def-42", device_type: "Laptop", brand: "HP", model: "Victus 16-d1000" },
  { id: "def-43", device_type: "Laptop", brand: "HP", model: "Omen 16-k0000" },
  { id: "def-44", device_type: "Desktop", brand: "HP", model: "ProDesk 400 G7" },
  // Lenovo
  { id: "def-45", device_type: "Laptop", brand: "Lenovo", model: "ThinkPad E14 Gen 4" },
  { id: "def-46", device_type: "Laptop", brand: "Lenovo", model: "IdeaPad Slim 3" },
  { id: "def-47", device_type: "Laptop", brand: "Lenovo", model: "Yoga 7i 14\"" },
  { id: "def-48", device_type: "Laptop", brand: "Lenovo", model: "Legion 5 Pro" },
  { id: "def-49", device_type: "Tablet", brand: "Lenovo", model: "Tab M10 Plus Gen 3" },
  // Asus
  { id: "def-50", device_type: "Laptop", brand: "Asus", model: "ROG Strix G15" },
  { id: "def-51", device_type: "Laptop", brand: "Asus", model: "TUF Gaming F15" },
  { id: "def-52", device_type: "Laptop", brand: "Asus", model: "ZenBook 14 OLED" },
  { id: "def-53", device_type: "Laptop", brand: "Asus", model: "VivoBook 15" },
  // Others
  { id: "def-54", device_type: "Android Phone", brand: "OnePlus", model: "OnePlus 11 5G" },
  { id: "def-55", device_type: "Android Phone", brand: "OnePlus", model: "OnePlus 12" },
  { id: "def-56", device_type: "Android Phone", brand: "Xiaomi", model: "Redmi Note 12 Pro" },
  { id: "def-57", device_type: "Android Phone", brand: "Realme", model: "Realme 11 Pro+" },
];

export async function fetchDeviceCatalog(): Promise<CatalogItem[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("device_catalog")
      .select("*")
      .order("brand", { ascending: true });

    if (!error && data && data.length > 0) {
      return data as CatalogItem[];
    }
  } catch (e) {
    console.warn("Could not fetch device_catalog from Supabase, using defaults:", e);
  }
  return DEFAULT_CATALOG;
}

export async function addDeviceCatalogItem(newItem: CatalogItem): Promise<boolean> {
  const supabase = createClient();
  try {
    const { error } = await supabase.from("device_catalog").insert([
      {
        device_type: newItem.device_type,
        brand: newItem.brand,
        model: newItem.model,
      },
    ]);

    if (error) {
      console.warn("Error inserting to device_catalog table:", error.message);
    }
    return true;
  } catch (e) {
    console.error("Failed to insert catalog item:", e);
    return false;
  }
}

export async function updateDeviceCatalogItem(
  id: string,
  updatedItem: Partial<CatalogItem>
): Promise<boolean> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("device_catalog")
      .update(updatedItem)
      .eq("id", id);

    if (error) {
      console.warn("Error updating device_catalog item:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Failed to update catalog item:", e);
    return false;
  }
}

export async function deleteDeviceCatalogItem(id: string): Promise<boolean> {
  const supabase = createClient();
  try {
    const { error } = await supabase.from("device_catalog").delete().eq("id", id);

    if (error) {
      console.warn("Error deleting device_catalog item:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Failed to delete catalog item:", e);
    return false;
  }
}

export async function bulkDeleteDeviceCatalogItems(ids: string[]): Promise<boolean> {
  const supabase = createClient();
  try {
    const { error } = await supabase.from("device_catalog").delete().in("id", ids);

    if (error) {
      console.warn("Error bulk deleting catalog items:", error.message);
    }
    return true;
  } catch (e) {
    console.error("Failed to bulk delete catalog items:", e);
    return false;
  }
}

export async function bulkUpdateDeviceCategory(ids: string[], newType: string): Promise<boolean> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("device_catalog")
      .update({ device_type: newType })
      .in("id", ids);

    if (error) {
      console.warn("Error bulk updating category:", error.message);
    }
    return true;
  } catch (e) {
    console.error("Failed to bulk update category:", e);
    return false;
  }
}
