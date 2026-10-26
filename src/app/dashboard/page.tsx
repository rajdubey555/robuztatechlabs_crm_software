import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardData } from "@/modules/dashboard/services/dashboardService";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Server-Side Data Fetching: 100% executes on Node.js server before HTML is sent
  // Zero UI lag, 0ms loading spinner on client browser
  const { data: initialData } = await getDashboardData(supabase);

  return <DashboardClient userEmail={user.email} initialData={initialData} />;
}

