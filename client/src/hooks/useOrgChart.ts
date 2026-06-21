import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface OrgNode {
  id: string;
  parentId?: string;
  personName: string;
  title: string;
  department: string;
  grade: string;
  headcount: number;
  openRoles: number;
  avatarColor: string;
  isRealData?: boolean;
  children: OrgNode[];
}

export function useOrgChartQuery() {
  return useQuery<OrgNode>({
    queryKey: ["org-chart"],
    queryFn: () => apiClient.get<OrgNode>("org-chart"),
  });
}

export function useCreateOrgNodeMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    OrgNode,
    Error,
    {
      id: string;
      parentId?: string;
      personName: string;
      title: string;
      department: string;
      grade: string;
      headcount?: number;
      openRoles?: number;
      avatarColor: string;
    }
  >({
    mutationFn: (payload) => apiClient.post<OrgNode>("org-chart/node", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-chart"] });
    },
  });
}

export function useUpdateOrgNodeMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    OrgNode,
    Error,
    {
      id: string;
      personName?: string;
      title?: string;
      department?: string;
      grade?: string;
      headcount?: number;
      openRoles?: number;
      avatarColor?: string;
    }
  >({
    mutationFn: ({ id, ...payload }) =>
      apiClient.patch<OrgNode>(`org-chart/node/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-chart"] });
    },
  });
}

export function useDeleteOrgNodeMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`org-chart/node/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-chart"] });
    },
  });
}

export function useResetOrgChartMutation() {
  const queryClient = useQueryClient();
  return useMutation<OrgNode, Error, void>({
    mutationFn: () => apiClient.post<OrgNode>("org-chart/reset", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-chart"] });
    },
  });
}
