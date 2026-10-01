import { createClient } from "@/lib/supabase/server";
import { PartRequestsPageClient } from "@/components/partRequests/PartRequestsPageClient";

export const metadata = {
  title: "Part Requests | Robuzta CRM",
  description: "Track and manage spare part procurement requests via WhatsApp",
};

export default async function PartRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <PartRequestsPageClient userEmail={user?.email || undefined} />;
}
