import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCustomers } from "@/modules/customers/services/customerService";
import { CustomersPageClient } from "@/components/customers/CustomersPageClient";

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Server-Side Data Fetching: Queries run on Node.js Server, NOT on client browser!
  // Fast, instant HTML delivery with pre-loaded customers
  const { data: initialCustomers } = await getCustomers(supabase);

  return (
    <CustomersPageClient
      initialCustomers={initialCustomers || []}
      userEmail={user.email}
    />
  );
}
