import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getEmployeesWithWorkload } from "@/modules/employees/services/employeeService";
import { EmployeesPageClient } from "@/components/employees/EmployeesPageClient";

export default async function EmployeesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Server-Side Data Fetching: Runs query on Node.js Server
  // Client browser receives instant HTML with complete employee workload data
  const { data: initialEmployees } = await getEmployeesWithWorkload(supabase);

  return (
    <EmployeesPageClient
      initialEmployees={initialEmployees || []}
      userEmail={user.email}
    />
  );
}
