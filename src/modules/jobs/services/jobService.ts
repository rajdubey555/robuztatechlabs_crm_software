import { createClient } from "@/lib/supabase/client";
import { RepairJob, RepairJobFormData, JobStatus } from "@/types/job";
import { JobAssignment } from "@/types/employee";
import { Diagnosis, DiagnosisFormData } from "@/types/diagnosis";
import { PartRequest } from "@/types/partRequest";

/**
 * Fetch all repair jobs with related customer, device, assigned employee, and diagnoses
 */
export async function getJobs(): Promise<{ data: RepairJob[]; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("repair_jobs")
      .select(`
        *,
        customer:customers (
          id,
          customer_code,
          full_name,
          phone
        ),
        device:devices (
          id,
          device_code,
          device_type,
          brand,
          model,
          serial_number,
          imei
        ),
        assigned_employee:employees!repair_jobs_assigned_employee_id_fkey (
          id,
          employee_code,
          full_name,
          role,
          specialization,
          is_active
        ),
        diagnoses (
          id,
          diagnosis,
          recommended_action,
          estimated_cost,
          notes,
          created_at,
          employee:employees (
            id,
            full_name
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    const formattedJobs: RepairJob[] = (data || []).map((j) => {
      const diagnosesList = j.diagnoses || [];
      const sortedDiagnoses = [...diagnosesList].sort(
        (a: Diagnosis, b: Diagnosis) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        ...j,
        diagnoses: sortedDiagnoses,
        latest_diagnosis: sortedDiagnoses.length > 0 ? sortedDiagnoses[0] : null,
      };
    });

    return { data: formattedJobs, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load repair jobs.";
    return { data: [], error: msg };
  }
}

/**
 * Fetch a single job by ID with full customer, device, employee, diagnoses, assignments & part requests
 */
export async function getJobById(id: string): Promise<{
  data: {
    job: RepairJob | null;
    assignmentsHistory: JobAssignment[];
    diagnoses: Diagnosis[];
    partRequests: PartRequest[];
  };
  error: string | null;
}> {
  const supabase = createClient();
  try {
    // 1. Fetch main job record
    const { data: jobData, error: jobErr } = await supabase
      .from("repair_jobs")
      .select(`
        *,
        customer:customers (*),
        device:devices (*),
        assigned_employee:employees!repair_jobs_assigned_employee_id_fkey (*)
      `)
      .eq("id", id)
      .single();

    if (jobErr || !jobData) {
      return {
        data: { job: null, assignmentsHistory: [], diagnoses: [], partRequests: [] },
        error: jobErr?.message || "Job not found",
      };
    }

    // 2. Fetch assignments history
    const { data: historyData } = await supabase
      .from("job_assignments")
      .select(`
        *,
        employee:employees (*)
      `)
      .eq("repair_job_id", id)
      .order("assigned_at", { ascending: false });

    // 3. Fetch diagnoses
    const { data: diagData } = await supabase
      .from("diagnoses")
      .select(`
        *,
        employee:employees (*)
      `)
      .eq("repair_job_id", id)
      .order("created_at", { ascending: false });

    // 4. Fetch part requests
    const { data: partReqData } = await supabase
      .from("part_requests")
      .select(`
        *,
        vendor:vendors(*),
        requested_by_employee:employees!part_requests_requested_by_fkey(*)
      `)
      .eq("repair_job_id", id)
      .order("created_at", { ascending: false });

    return {
      data: {
        job: jobData as RepairJob,
        assignmentsHistory: (historyData as JobAssignment[]) || [],
        diagnoses: (diagData as Diagnosis[]) || [],
        partRequests: (partReqData as unknown as PartRequest[]) || [],
      },
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load job details.";
    return {
      data: { job: null, assignmentsHistory: [], diagnoses: [], partRequests: [] },
      error: msg,
    };
  }
}

/**
 * Create a new repair job
 */
export async function createJob(
  formData: RepairJobFormData
): Promise<{ data: RepairJob | null; error: string | null }> {
  const supabase = createClient();
  try {
    const payload = {
      customer_id: formData.customer_id,
      device_id: formData.device_id,
      branch: formData.branch || "south_bopal",
      category_type: formData.category_type || "laptop_general",
      customer_complaint: formData.customer_complaint.trim(),
      priority: formData.priority,
      status: "received",
      estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : null,
      final_cost: formData.final_cost ? Number(formData.final_cost) : null,
      expected_delivery_at: formData.expected_delivery_at || null,
    };

    const { data, error } = await supabase
      .from("repair_jobs")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as RepairJob, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create repair job.";
    return { data: null, error: msg };
  }
}

/**
 * Update an existing repair job
 */
export async function updateJob(
  id: string,
  formData: Partial<RepairJobFormData>
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const payload: Record<string, unknown> = {};
    if (formData.customer_id !== undefined) payload.customer_id = formData.customer_id;
    if (formData.device_id !== undefined) payload.device_id = formData.device_id;
    if (formData.branch !== undefined) payload.branch = formData.branch;
    if (formData.category_type !== undefined) payload.category_type = formData.category_type;
    if (formData.customer_complaint !== undefined) payload.customer_complaint = formData.customer_complaint.trim();
    if (formData.priority !== undefined) payload.priority = formData.priority;
    if (formData.estimated_cost !== undefined) {
      payload.estimated_cost = formData.estimated_cost ? Number(formData.estimated_cost) : null;
    }
    if (formData.final_cost !== undefined) {
      payload.final_cost = formData.final_cost ? Number(formData.final_cost) : null;
    }
    if (formData.expected_delivery_at !== undefined) {
      payload.expected_delivery_at = formData.expected_delivery_at || null;
    }

    const { error } = await supabase
      .from("repair_jobs")
      .update(payload)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update repair job.";
    return { success: false, error: msg };
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(
  id: string,
  newStatus: JobStatus
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("repair_jobs")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update status.";
    return { success: false, error: msg };
  }
}

/**
 * Assign a technician to a repair job
 */
export async function assignTechnician(
  jobId: string,
  employeeId: string,
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();

    // 1. Mark existing active assignment as unassigned
    await supabase
      .from("job_assignments")
      .update({ unassigned_at: now })
      .eq("repair_job_id", jobId)
      .is("unassigned_at", null);

    // 2. Insert new assignment
    const { error: insertErr } = await supabase
      .from("job_assignments")
      .insert({
        repair_job_id: jobId,
        employee_id: employeeId,
        assigned_by: user?.id || null,
        assigned_at: now,
        notes: notes?.trim() || null,
      });

    if (insertErr) throw insertErr;

    // 3. Update current assigned_employee_id on repair job
    const { error: updateJobErr } = await supabase
      .from("repair_jobs")
      .update({
        assigned_employee_id: employeeId,
        status: "diagnosis_pending",
      })
      .eq("id", jobId);

    if (updateJobErr) throw updateJobErr;

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to assign technician.";
    return { success: false, error: msg };
  }
}

/**
 * Add or record a repair diagnosis for a job and mark job as diagnosed
 */
export async function addDiagnosis(
  jobId: string,
  formData: DiagnosisFormData,
  assignedEmployeeId?: string | null
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const costVal =
      formData.estimated_cost !== "" && formData.estimated_cost !== undefined
        ? Number(formData.estimated_cost)
        : null;

    // 1. Insert new diagnosis record
    const { error: insertErr } = await supabase.from("diagnoses").insert({
      repair_job_id: jobId,
      employee_id: assignedEmployeeId || null,
      diagnosis: formData.diagnosis.trim(),
      recommended_action: formData.recommended_action?.trim() || null,
      estimated_cost: costVal,
      notes: formData.notes?.trim() || null,
    });

    if (insertErr) throw insertErr;

    // 2. Update repair job status to 'diagnosed' and update estimated_cost
    const jobUpdatePayload: { status: string; updated_at: string; estimated_cost?: number | null } = {
      status: "diagnosed",
      updated_at: new Date().toISOString(),
    };

    if (costVal !== null) {
      jobUpdatePayload.estimated_cost = costVal;
    }

    const { error: updateJobErr } = await supabase
      .from("repair_jobs")
      .update(jobUpdatePayload)
      .eq("id", jobId);

    if (updateJobErr) throw updateJobErr;

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save diagnosis.";
    return { success: false, error: msg };
  }
}
