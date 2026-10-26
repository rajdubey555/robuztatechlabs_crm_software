import { createClient } from "@/lib/supabase/server";
import { DeviceCatalogPageClient } from "@/components/devices/DeviceCatalogPageClient";
import { fetchDeviceCatalog } from "@/services/deviceCatalogService";

export const metadata = {
  title: "Device Catalog & Categories | Robuzta CRM",
  description: "Manage master device categories, brands, and models for Robuzta CRM",
};

export default async function DeviceCatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Server-Side Data Fetching: Pre-fetch master catalog on the Server
  const initialCatalog = await fetchDeviceCatalog(supabase);

  return (
    <DeviceCatalogPageClient
      initialCatalog={initialCatalog}
      userEmail={user?.email || undefined}
    />
  );
}
