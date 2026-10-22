"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Badge, Alert, LoadingSpinner, Input } from "@/components/ui";
import { EmployeeRoleBadge } from "@/components/employees/EmployeeRoleBadge";
import { Employee, getEmployeesWithWorkload } from "@/modules/employees";
import { assignTechnician } from "@/modules/jobs";

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

  useEffect(() => {
    if (!isOpen) return;

    const fetchTechnicians = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getEmployeesWithWorkload();
        if (res.error) throw new Error(res.error);

        const techList = res.data.filter(
          (e) => e.is_active && ["technician", "admin", "manager"].includes(e.role)
        );

        setTechnicians(techList);
        if (currentAssignedId && techList.some((t) => t.id === currentAssignedId)) {
          setSelectedTechId(currentAssignedId);
        } else if (techList.length > 0) {
          setSelectedTechId(techList[0].id);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load technicians.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [isOpen, jobId, currentAssignedId]);

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
      const res = await assignTechnician(jobId, selectedTechId, notes);

      if (res.error) {
        throw new Error(res.error);
      }

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
