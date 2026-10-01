import { createClient } from "@/lib/supabase/server";
import { PermissionsClient } from "@/components/permissions/PermissionsClient";

export const metadata = {
  title: "Roles & Permissions | Robuzta CRM",
  description: "Manage system roles and access controls",
};

export default async function PermissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <PermissionsClient userEmail={user?.email || "admin@robuzta.com"} />;
}
