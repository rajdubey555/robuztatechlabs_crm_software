export * from "@/types/job";
export * from "@/types/diagnosis";

export interface JobFilterParams {
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
  assignmentFilter?: string;
  employeeFilter?: string;
  diagnosisFilter?: string;
  branchFilter?: string;
  categoryFilter?: string;
}
