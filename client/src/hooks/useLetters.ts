import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface HRLetter {
  id: string;
  type: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment?: string;
  subject: string;
  issueDate: string;
  effectiveDate: string;
  status: "Draft" | "Sent" | "Signed" | "Archived";
  body: string;
  fields: Record<string, string>;
  createdBy: string;
  createdAt: string;
}

export interface LetterQuery {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLetters {
  data: HRLetter[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useLettersQuery(query: LetterQuery) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);

  const queryString = params.toString();
  const endpoint = queryString ? `letters?${queryString}` : "letters";

  return useQuery<PaginatedLetters>({
    queryKey: ["letters", queryString],
    queryFn: () => apiClient.get<PaginatedLetters>(endpoint),
  });
}

export function useLetterQuery(id: string) {
  return useQuery<HRLetter>({
    queryKey: ["letters", id],
    queryFn: () => apiClient.get<HRLetter>(`letters/${id}`),
    enabled: !!id,
  });
}

export function useCreateLetterMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    HRLetter,
    Error,
    {
      type: string;
      employeeId: string;
      subject: string;
      issueDate: string;
      effectiveDate: string;
      body: string;
      fields: Record<string, string>;
      status?: "Draft" | "Sent" | "Signed" | "Archived";
    }
  >({
    mutationFn: (payload) => apiClient.post<HRLetter>("letters", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
    },
  });
}

export function useUpdateLetterStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    HRLetter,
    Error,
    { id: string; status: "Draft" | "Sent" | "Signed" | "Archived" }
  >({
    mutationFn: ({ id, status }) =>
      apiClient.patch<HRLetter>(`letters/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      queryClient.invalidateQueries({ queryKey: ["letters", variables.id] });
    },
  });
}

export function useDeleteLetterMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`letters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
    },
  });
}
