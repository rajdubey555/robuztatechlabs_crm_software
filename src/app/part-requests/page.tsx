import { createClient } from "@/lib/supabase/server";
import { PartRequestsPageClient } from "@/components/partRequests/PartRequestsPageClient";

export const metadata = {
  title: "Part Requests | Robuzta CRM",
  description: "Track and manage spare part procurement requests via WhatsApp",
};

export default async function PartRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Server-Side Data Fetching: Parallel fetch on Server
  const [reqsRes, vendorsRes] = await Promise.all([
    supabase.from("part_requests").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("vendors").select("*").order("name", { ascending: true }),
  ]);

  return (
    <PartRequestsPageClient
      initialRequests={reqsRes.data || []}
      initialVendors={vendorsRes.data || []}
      userEmail={user?.email || undefined}
    />
  );
}
