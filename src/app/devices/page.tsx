import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDevices } from "@/modules/devices/services/deviceService";
import { DevicesPageClient } from "@/components/devices/DevicesPageClient";

export default async function DevicesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Server-Side Data Fetching: Runs query on Node.js Server
  // Client browser receives instant HTML with complete data, 0ms waiting time
  const { data: initialDevices } = await getDevices(supabase);

  return (
    <DevicesPageClient
      initialDevices={initialDevices || []}
      userEmail={user.email}
    />
  );
}
