import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  experience: string;
  description: string;
  status: "Open" | "Closed";
  dateOpened: string;
  applicants?: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  linkedIn?: string;
  resumeUrl?: string;
  role: string;
  source: string;
  stage: "Applied" | "Screening" | "Interview" | "Technical" | "Offer" | "Hired" | "Rejected";
  appliedDate: string;
  notes?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  offerLetterGenerated?: boolean;
  joiningLetterGenerated?: boolean;
  offeredSalary?: string;
  offeredStartDate?: string;
  joiningManager?: string;
  stageHistory?: { stage: string; date: string }[];
}

export interface OnboardingTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface OnboardingHire {
  id: string;
  candidateId: string;
  name: string;
  role: string;
  department: string;
  startDate: string;
  tasks: OnboardingTask[];
}

export interface RecruitmentAnalytics {
  stats: {
    openJobs: number;
    totalApplicants: number;
    pipelineActive: number;
    hiredThisMonth: number;
  };
  pipelineData: { stage: string; count: number }[];
  sourceData: { source: string; count: number }[];
}

// ─── Jobs Hooks ─────────────────────────────────────────────────────────────

export function useJobsQuery() {
  return useQuery<JobOpening[]>({
    queryKey: ["recruitment", "jobs"],
    queryFn: () => apiClient.get<JobOpening[]>("recruitment/jobs"),
  });
}

export function useCreateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation<JobOpening, Error, Omit<JobOpening, "id" | "dateOpened">>({
    mutationFn: (payload) => apiClient.post<JobOpening>("recruitment/jobs", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "analytics"] });
    },
  });
}

export function useUpdateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation<JobOpening, Error, { id: string; data: Partial<JobOpening> }>({
    mutationFn: (payload) => apiClient.patch<JobOpening>(`recruitment/jobs/${payload.id}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "analytics"] });
    },
  });
}

export function useDeleteJobMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`recruitment/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "analytics"] });
    },
  });
}

// ─── Candidates Hooks ───────────────────────────────────────────────────────

export function useCandidatesQuery() {
  return useQuery<Candidate[]>({
    queryKey: ["recruitment", "candidates"],
    queryFn: () => apiClient.get<Candidate[]>("recruitment/candidates"),
  });
}

export function useCandidateQuery(id: string) {
  return useQuery<Candidate>({
    queryKey: ["recruitment", "candidates", id],
    queryFn: () => apiClient.get<Candidate>(`recruitment/candidates/${id}`),
    enabled: !!id,
  });
}

export function useCreateCandidateMutation() {
  const queryClient = useQueryClient();
  return useMutation<Candidate, Error, Omit<Candidate, "id" | "appliedDate">>({
    mutationFn: (payload) => apiClient.post<Candidate>("recruitment/candidates", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "analytics"] });
    },
  });
}

export function useUpdateCandidateMutation() {
  const queryClient = useQueryClient();
  return useMutation<Candidate, Error, { id: string; data: Partial<Candidate> }>({
    mutationFn: (payload) => apiClient.patch<Candidate>(`recruitment/candidates/${payload.id}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "analytics"] });
    },
  });
}

export function useDeleteCandidateMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`recruitment/candidates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "analytics"] });
    },
  });
}

export function useUpdateCandidateStageMutation() {
  const queryClient = useQueryClient();
  return useMutation<Candidate, Error, { id: string; stage: string }>({
    mutationFn: (payload) => apiClient.patch<Candidate>(`recruitment/candidates/${payload.id}/stage`, { stage: payload.stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment", "analytics"] });
    },
  });
}

export function useScheduleInterviewMutation() {
  const queryClient = useQueryClient();
  return useMutation<Candidate, Error, { id: string; date: string; time: string; location?: string }>({
    mutationFn: (payload) => apiClient.patch<Candidate>(`recruitment/candidates/${payload.id}/interview`, { date: payload.date, time: payload.time, location: payload.location }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
    },
  });
}

export function useGenerateOfferLetterMutation() {
  const queryClient = useQueryClient();
  return useMutation<Candidate, Error, { id: string; offeredSalary: string; offeredStartDate: string }>({
    mutationFn: (payload) => apiClient.patch<Candidate>(`recruitment/candidates/${payload.id}/offer`, { offeredSalary: payload.offeredSalary, offeredStartDate: payload.offeredStartDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
    },
  });
}

export function useGenerateJoiningLetterMutation() {
  const queryClient = useQueryClient();
  return useMutation<Candidate, Error, { id: string; joiningManager: string }>({
    mutationFn: (payload) => apiClient.patch<Candidate>(`recruitment/candidates/${payload.id}/joining`, { joiningManager: payload.joiningManager }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] });
    },
  });
}

// ─── Onboarding Hooks ────────────────────────────────────────────────────────

export function useOnboardingHiresQuery() {
  return useQuery<OnboardingHire[]>({
    queryKey: ["recruitment", "onboarding"],
    queryFn: () => apiClient.get<OnboardingHire[]>("recruitment/onboarding"),
  });
}

export function useToggleOnboardingTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<OnboardingTask, Error, string>({
    mutationFn: (taskId) => apiClient.patch<OnboardingTask>(`recruitment/onboarding/tasks/${taskId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "onboarding"] });
    },
  });
}

export function useAddOnboardingTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<OnboardingTask, Error, { hireId: string; title: string }>({
    mutationFn: (payload) => apiClient.post<OnboardingTask>(`recruitment/onboarding/${payload.hireId}/tasks`, { title: payload.title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "onboarding"] });
    },
  });
}

export function useRemoveOnboardingTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (taskId) => apiClient.delete<{ message: string }>(`recruitment/onboarding/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment", "onboarding"] });
    },
  });
}

// ─── Analytics Hooks ─────────────────────────────────────────────────────────

export function useRecruitmentAnalyticsQuery() {
  return useQuery<RecruitmentAnalytics>({
    queryKey: ["recruitment", "analytics"],
    queryFn: () => apiClient.get<RecruitmentAnalytics>("recruitment/analytics"),
  });
}
