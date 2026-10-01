import { createClient } from "@/lib/supabase/server";
import { DeviceCatalogPageClient } from "@/components/devices/DeviceCatalogPageClient";

export const metadata = {
  title: "Device Catalog & Categories | Robuzta CRM",
  description: "Manage master device categories, brands, and models for Robuzta CRM",
};

export default async function DeviceCatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <DeviceCatalogPageClient userEmail={user?.email || undefined} />;
}
