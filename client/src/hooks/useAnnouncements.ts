import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "info" | "warning" | "event" | "policy";
  department: string;
  date: string;
  authorId?: string;
  authorName?: string;
  author: string;
  status: "Published" | "Draft";
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAnnouncementData = {
  title: string;
  content: string;
  category: "info" | "warning" | "event" | "policy";
  department: string;
  status: "Published" | "Draft";
  authorId?: string;
  authorName?: string;
}
export type UpdateAnnouncementData = Partial<CreateAnnouncementData>;

// API calls
const fetchAnnouncements = async (): Promise<Announcement[]> => {
  const data = await api.get<any[]>('announcements');
  return data.map((item: any) => ({
    ...item,
    author: item.authorName || 'HR Admin'
  }));
};

const createAnnouncement = async (announcement: CreateAnnouncementData): Promise<Announcement> => {
  const data = await api.post<any>('announcements', announcement);
  return { ...data, author: data.authorName || 'HR Admin' };
};

const updateAnnouncement = async ({ id, data }: { id: string; data: UpdateAnnouncementData }): Promise<Announcement> => {
  const dataRes = await api.patch<any>(`announcements/${id}`, data);
  return { ...dataRes, author: dataRes.authorName || 'HR Admin' };
};

const deleteAnnouncement = async (id: string): Promise<void> => {
  await api.delete<void>(`announcements/${id}`);
};

// Hooks
export const useAnnouncements = () => {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: fetchAnnouncements,
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};
