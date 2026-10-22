"use client";

import { useState, useEffect, FormEvent } from "react";
import { Modal, Button, Input, Alert } from "@/components/ui";
import { DiagnosisFormData, DiagnosisFormErrors, Diagnosis } from "@/types/diagnosis";
import { addDiagnosis } from "@/modules/jobs";

export interface DiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  assignedEmployeeId?: string | null;
  latestDiagnosis?: Diagnosis | null;
  customerComplaint?: string;
  onSaved: () => void;
}

export function DiagnosisModal({
  isOpen,
  onClose,
  jobId,
  assignedEmployeeId,
  latestDiagnosis,
  customerComplaint,
  onSaved,
}: DiagnosisModalProps) {
  const [formData, setFormData] = useState<DiagnosisFormData>({
    diagnosis: "",
    recommended_action: "",
    estimated_cost: "",
    notes: "",
  });

  const [errors, setErrors] = useState<DiagnosisFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (latestDiagnosis) {
        setFormData({
          diagnosis: latestDiagnosis.diagnosis || "",
          recommended_action: latestDiagnosis.recommended_action || "",
          estimated_cost: latestDiagnosis.estimated_cost !== null && latestDiagnosis.estimated_cost !== undefined
            ? latestDiagnosis.estimated_cost
            : "",
          notes: latestDiagnosis.notes || "",
        });
      } else {
        setFormData({
          diagnosis: "",
          recommended_action: "",
          estimated_cost: "",
          notes: "",
        });
      }
      setErrors({});
      setError(null);
    }
  }, [isOpen, latestDiagnosis]);

  const validate = (): boolean => {
    const newErrors: DiagnosisFormErrors = {};

    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = "Diagnosis details are required.";
    }

    if (formData.estimated_cost !== "" && formData.estimated_cost !== undefined && formData.estimated_cost !== null) {
      const num = Number(formData.estimated_cost);
      if (isNaN(num) || num < 0) {
        newErrors.estimated_cost = "Estimated cost must be a valid non-negative number.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await addDiagnosis(jobId, formData, assignedEmployeeId);

      if (res.error) {
        throw new Error(res.error);
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save diagnosis.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={latestDiagnosis ? "Update Repair Diagnosis" : "Record Repair Diagnosis"}
      description="Enter detailed diagnostic observations and recommended repair actions."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
            {latestDiagnosis ? "Save New Diagnosis Record" : "Submit Diagnosis"}
          </Button>
        </>
      }
    >
      {error && <Alert variant="error" title="Error" className="mb-4">{error}</Alert>}

      {customerComplaint && (
        <div className="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
          <span className="text-slate-500 font-semibold block uppercase">Customer Complaint</span>
          <span className="text-slate-800 dark:text-slate-200 font-medium">{customerComplaint}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Diagnosis Findings *
          </label>
          <textarea
            required
            rows={3}
            placeholder="e.g. DC charging jack connector is physically damaged."
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            disabled={submitting}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-hidden focus:ring-2 dark:bg-slate-900 dark:text-white ${
              errors.diagnosis
                ? "border-rose-500 focus:ring-rose-500"
                : "border-slate-300 dark:border-slate-700 focus:border-[#009688] focus:ring-[#009688]"
            }`}
          />
          {errors.diagnosis && <p className="text-xs text-rose-500 mt-1">{errors.diagnosis}</p>}
        </div>

        <Input
          label="Recommended Action / Solution"
          placeholder="e.g. Replace DC charging jack with Dell original spare part."
          value={formData.recommended_action || ""}
          onChange={(e) => setFormData({ ...formData, recommended_action: e.target.value })}
          disabled={submitting}
        />

        <Input
          label="Estimated Cost (₹)"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 1500"
          value={formData.estimated_cost !== undefined ? formData.estimated_cost : ""}
          onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
          error={errors.estimated_cost}
          disabled={submitting}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Technical Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Need compatible Dell DC jack part #398-X."
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm transition-colors focus:border-[#009688] focus:outline-hidden focus:ring-2 focus:ring-[#009688] dark:bg-slate-900 dark:text-white"
          />
        </div>
      </form>
    </Modal>
  );
}
