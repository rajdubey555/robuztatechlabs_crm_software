"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { EmployeeFormData, createEmployee, EmployeeForm } from "@/modules/employees";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, Button } from "@/components/ui";

export default function AddEmployeePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    }
    checkAuth();
  }, [supabase]);

  const handleSubmit = async (formData: EmployeeFormData) => {
    setLoading(true);
    setError(null);

    const { data, error: createError } = await createEmployee(formData);

    if (createError || !data) {
      setError(createError || "Failed to add employee.");
      setLoading(false);
      return;
    }

    router.push(`/employees/${data.id}`);
  };

  return (
    <AppShell userEmail={userEmail}>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/employees" className="hover:text-[#009688] transition-colors">
            Employees
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Add New Employee</span>
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Add New Employee
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create a new technician, manager, or staff profile for repair job assignments.
            </p>
          </div>

          <Link href="/employees">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <EmployeeForm
          onSubmit={handleSubmit}
          isLoading={loading}
          submitButtonText="Create Employee Profile"
        />
    </AppShell>
  );
}
