import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export function usePermissionsQuery() {
  return useQuery<Permission[]>({
    queryKey: ["roles", "permissions"],
    queryFn: () => apiClient.get<Permission[]>("roles/permissions"),
  });
}

export function useRolesQuery() {
  return useQuery<Role[]>({
    queryKey: ["roles", "list"],
    queryFn: () => apiClient.get<Role[]>("roles"),
  });
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation<Role, Error, { name: string; description: string; permissionIds: string[] }>({
    mutationFn: (payload) => apiClient.post<Role>("roles", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", "list"] });
    },
  });
}

export function useUpdateRoleMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Role, Error, { name: string; description: string; permissionIds: string[] }>({
    mutationFn: (payload) => apiClient.patch<Role>(`roles/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", "list"] });
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: boolean; message: string }>(`roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", "list"] });
    },
  });
}
