import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getJobs } from "@/modules/jobs/services/jobService";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { JobsPageClient } from "@/components/jobs/JobsPageClient";

export default async function JobsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Server-Side Data Fetching: Runs parallel queries on Node.js Server
  // Client browser receives instant HTML with complete data, 0ms waiting time
  const [jobsRes, empRes] = await Promise.all([
    getJobs(supabase),
    getEmployees(supabase),
  ]);

  return (
    <JobsPageClient
      initialJobs={jobsRes.data || []}
      initialEmployees={empRes.data || []}
      userEmail={user.email}
    />
  );
}
