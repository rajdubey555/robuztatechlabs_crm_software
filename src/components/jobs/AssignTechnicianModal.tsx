"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Badge, Alert, LoadingSpinner, Input } from "@/components/ui";
import { EmployeeRoleBadge } from "@/components/employees/EmployeeRoleBadge";
import { Employee } from "@/types/employee";
import { createClient } from "@/lib/supabase/client";

export interface AssignTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  currentAssignedId?: string | null;
  onAssigned: () => void;
}

export function AssignTechnicianModal({
  isOpen,
  onClose,
  jobId,
  currentAssignedId,
  onAssigned,
}: AssignTechnicianModalProps) {
  const [technicians, setTechnicians] = useState<Employee[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;

    const fetchTechnicians = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch active technicians or qualified staff
        const { data: empData, error: empErr } = await supabase
          .from("employees")
          .select("*")
          .eq("is_active", true)
          .in("role", ["technician", "admin", "manager"])
          .order("full_name", { ascending: true });

        if (empErr) throw empErr;

        if (!empData || empData.length === 0) {
          setTechnicians([]);
          setLoading(false);
          return;
        }

        // Fetch active workload count for each technician
        const techIds = empData.map((e) => e.id);
        const { data: activeJobsData, error: jobsErr } = await supabase
          .from("repair_jobs")
          .select("assigned_employee_id")
          .in("assigned_employee_id", techIds)
          .not("status", "in", '("delivered","closed","cancelled","unrepairable")');

        if (jobsErr) throw jobsErr;

        const countMap: Record<string, number> = {};
        (activeJobsData || []).forEach((j) => {
          if (j.assigned_employee_id) {
            countMap[j.assigned_employee_id] = (countMap[j.assigned_employee_id] || 0) + 1;
          }
        });

        const formatted = empData.map((e) => ({
          ...e,
          active_job_count: countMap[e.id] || 0,
        }));

        setTechnicians(formatted);
        if (currentAssignedId && formatted.some((t) => t.id === currentAssignedId)) {
          setSelectedTechId(currentAssignedId);
        } else if (formatted.length > 0) {
          setSelectedTechId(formatted[0].id);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load technicians.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [isOpen, jobId, currentAssignedId, supabase]);

  const handleAssign = async () => {
    if (!selectedTechId) {
      setError("Please select a technician to assign.");
      return;
    }

    if (selectedTechId === currentAssignedId) {
      setError("Job is already assigned to this technician.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Mark existing active assignment as unassigned
      const now = new Date().toISOString();
      const { error: updateOldErr } = await supabase
        .from("job_assignments")
        .update({ unassigned_at: now })
        .eq("repair_job_id", jobId)
        .is("unassigned_at", null);

      if (updateOldErr) {
        console.warn("Could not unassign previous assignment:", updateOldErr);
      }

      // 2. Insert new job assignment record
      const { error: insertErr } = await supabase
        .from("job_assignments")
        .insert({
          repair_job_id: jobId,
          employee_id: selectedTechId,
          assigned_by: user?.id || null,
          assigned_at: now,
          notes: notes.trim() || null,
        });

      if (insertErr) throw insertErr;

      // 3. Update current assigned_employee_id on repair job
      const { error: updateJobErr } = await supabase
        .from("repair_jobs")
        .update({
          assigned_employee_id: selectedTechId,
          updated_at: now,
        })
        .eq("id", jobId);

      if (updateJobErr) throw updateJobErr;

      onAssigned();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to assign job.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentAssignedId ? "Reassign Repair Job" : "Assign Technician"}
      description="Select an active technician or specialist to handle this repair job."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            isLoading={submitting}
            disabled={loading || technicians.length === 0}
          >
            {currentAssignedId ? "Confirm Reassign" : "Assign Job"}
          </Button>
        </>
      }
    >
      {error && <Alert variant="error" title="Error" className="mb-4">{error}</Alert>}

      {loading ? (
        <div className="py-8 flex justify-center items-center">
          <LoadingSpinner size="md" />
        </div>
      ) : technicians.length === 0 ? (
        <Alert
          variant="warning"
          title="No Technicians Available"
        >
          No active technician available.
        </Alert>
      ) : (
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Available Technicians ({technicians.length})
          </label>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {technicians.map((tech) => {
              const isSelected = selectedTechId === tech.id;
              const isCurrent = currentAssignedId === tech.id;

              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechId(tech.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#009688] bg-[#009688]/5 dark:border-[#009688] dark:bg-[#009688]/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="selected_technician"
                      checked={isSelected}
                      onChange={() => setSelectedTechId(tech.id)}
                      className="h-4 w-4 text-[#009688] focus:ring-[#009688]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {tech.full_name}
                        </span>
                        <EmployeeRoleBadge role={tech.role} />
                        {isCurrent && <Badge variant="info">Currently Assigned</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">
                        Specialization: {tech.specialization || "General"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Active Workload</span>
                    <Badge variant={tech.active_job_count && tech.active_job_count > 3 ? "warning" : "default"}>
                      {tech.active_job_count} active {tech.active_job_count === 1 ? "job" : "jobs"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <Input
            label="Assignment Notes (Optional)"
            placeholder="e.g. Assigned for motherboard chip-level repair"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
          />
        </div>
      )}
    </Modal>
  );
}
