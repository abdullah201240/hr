import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface AssetHistoryLog {
  id: string;
  action: string;
  employeeName: string | null;
  employeeDisplayId: string | null;
  actionByName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  serialNumber: string;
  category: string;
  model: string | null;
  purchaseDate: string | null;
  cost: number;
  condition: "New" | "Good" | "Damaged" | "Lost";
  status: "Available" | "Assigned" | "Under Maintenance" | "Retired";
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToDisplayId: string | null;
  assignedAt: string | null;
  returnDueDate: string | null;
  remarks: string | null;
  createdAt: string;
  history?: AssetHistoryLog[];
}

export function useAssetsQuery(filters?: { employeeId?: string; status?: string; category?: string }) {
  return useQuery<Asset[]>({
    queryKey: ["assets", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append("employeeId", filters.employeeId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.category) params.append("category", filters.category);

      const queryStr = params.toString();
      const endpoint = queryStr ? `assets?${queryStr}` : "assets";
      return apiClient.get<Asset[]>(endpoint);
    },
  });
}

export function useAssetDetailsQuery(id: string) {
  return useQuery<Asset>({
    queryKey: ["assetDetails", id],
    queryFn: () => apiClient.get<Asset>(`assets/${id}`),
    enabled: !!id,
  });
}

export function useCreateAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    Asset,
    Error,
    { assetTag: string; name: string; serialNumber: string; category: string; model?: string; purchaseDate?: string; cost?: number; remarks?: string }
  >({
    mutationFn: (payload) => apiClient.post<Asset>("assets", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useAllocateAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    Asset,
    Error,
    { id: string; assignedToId: string; returnDueDate?: string; notes?: string }
  >({
    mutationFn: ({ id, ...payload }) =>
      apiClient.post<Asset>(`assets/${id}/allocate`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assetDetails", variables.id] });
    },
  });
}

export function useReturnAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    Asset,
    Error,
    { id: string; notes?: string }
  >({
    mutationFn: ({ id, ...payload }) =>
      apiClient.post<Asset>(`assets/${id}/return`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assetDetails", variables.id] });
    },
  });
}

export function useUpdateAssetConditionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    Asset,
    Error,
    { id: string; condition: "New" | "Good" | "Damaged" | "Lost"; notes?: string }
  >({
    mutationFn: ({ id, ...payload }) =>
      apiClient.patch<Asset>(`assets/${id}/condition`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assetDetails", variables.id] });
    },
  });
}
