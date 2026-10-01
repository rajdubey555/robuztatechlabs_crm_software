import { createClient } from "@/lib/supabase/server";
import { VendorsPageClient } from "@/components/vendors/VendorsPageClient";

export const metadata = {
  title: "Vendors & Suppliers | Robuzta CRM",
  description: "Manage spare parts vendors and contact details for Robuzta CRM",
};

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: vendorsData } = await supabase
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });

  return (
    <VendorsPageClient
      initialVendors={vendorsData || []}
      userEmail={user?.email || undefined}
    />
  );
}
