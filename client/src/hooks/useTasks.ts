import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface TaskProject {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Completed" | "Archived";
  departmentId: string | null;
  ownerId: string | null;
  totalTasks: number;
  completedTasks: number;
  archived: boolean;
  members: string;
  slackWebhookUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string | null;
  title: string;
  description: string;
  status: "Backlog" | "Todo" | "In Progress" | "In Review" | "Done" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneePhotoUrl: string | null;
  reporterId: string | null;
  estimatedHours: number;
  actualHours: number;
  projectName: string | null;
  subtasksTotal: number;
  subtasksCompleted: number;
  commentsCount: number;
  tags: string | null;
  timerStartedAt: string | null;
  timerElapsedSeconds: number;
  milestoneId: string | null;
  recurrencePattern: string;
  recurrenceInterval: number;
  nextRecurrenceDate: string | null;
  progress: number;
  workStatus: "Idle" | "Active Working" | "Paused" | "Blocked";
  approvalStatus: "Pending" | "Approved" | "Changes Requested";
  reviewRating: number | null;
  reviewFeedback: string | null;
  watchers?: string;
  dependencies?: TaskDependency[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userPhotoUrl: string | null;
  isPinned: boolean;
  category: "general" | "status" | "blocker" | "feedback";
  reactions: string;
}

export interface TaskActivity {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  userId: string | null;
  userName: string | null;
}

export interface TaskDependency {
  id: string;
  dependsOnTaskId: string;
  dependencyType: string;
  dependsOnTaskTitle: string;
  dependsOnTaskStatus: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedById: string | null;
  uploadedByName: string | null;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string | null;
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  description: string;
}

export interface TaskMilestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string | null;
  status: "Open" | "Achieved";
}

export interface TaskNotification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TaskDetails extends Task {
  comments: TaskComment[];
  activities: TaskActivity[];
  checklist: ChecklistItem[];
  dependencies: TaskDependency[];
  attachments: TaskAttachment[];
  timeEntries: TimeEntry[];
}

export interface TaskQueryFilters {
  search?: string;
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
}

// ─── Projects Hooks ─────────────────────────────────────────────────────────

export function useProjectsQuery(departmentId?: string) {
  return useQuery<TaskProject[]>({
    queryKey: ["task-projects", departmentId],
    queryFn: () => apiClient.get<TaskProject[]>("tasks/projects", { params: { departmentId } }),
  });
}

export interface ProjectActivity {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  userPhotoUrl: string | null;
  taskTitle: string;
  taskId: string;
}

export function useProjectActivitiesQuery(projectId: string, enabled = true) {
  return useQuery<ProjectActivity[]>({
    queryKey: ["task-projects", "activities", projectId],
    queryFn: () => apiClient.get<ProjectActivity[]>(`tasks/projects/${projectId}/activities`),
    enabled: !!projectId && enabled,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation<TaskProject, Error, Omit<TaskProject, "id" | "totalTasks" | "completedTasks" | "createdAt" | "updatedAt">>({
    mutationFn: (payload) => apiClient.post<TaskProject>("tasks/projects", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-projects"] });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation<TaskProject, Error, { id: string; data: Partial<TaskProject> }>({
    mutationFn: (payload) => apiClient.patch<TaskProject>(`tasks/projects/${payload.id}`, payload.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-projects"] });
      queryClient.invalidateQueries({ queryKey: ["task-projects", variables.id] });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`tasks/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-projects"] });
    },
  });
}

// ─── Tasks Hooks ─────────────────────────────────────────────────────────────

export function useTasksQuery(filters: TaskQueryFilters) {
  return useQuery<Task[]>({
    queryKey: ["tasks", filters],
    queryFn: () => apiClient.get<Task[]>("tasks", { params: filters }),
  });
}

export interface PaginatedTasksResponse {
  tasks: Task[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useInfiniteTasksQuery(filters: TaskQueryFilters & { limit?: number }) {
  return useInfiniteQuery<PaginatedTasksResponse>({
    queryKey: ["tasks", "infinite", filters],
    queryFn: ({ pageParam }) =>
      apiClient.get<PaginatedTasksResponse>("tasks", {
        params: { ...filters, limit: filters.limit || 50, cursor: pageParam },
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useTaskDetailQuery(id: string, enabled = true) {
  return useQuery<TaskDetails>({
    queryKey: ["tasks", "detail", id],
    queryFn: () => apiClient.get<TaskDetails>(`tasks/${id}`),
    enabled: !!id && enabled,
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, Partial<Task>>({
    mutationFn: (payload) => apiClient.post<Task>("tasks", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-projects"] });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, { id: string; data: Partial<Task> }>({
    mutationFn: (payload) => apiClient.patch<Task>(`tasks/${payload.id}`, payload.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["task-projects"] });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`tasks/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["task-projects"] });
    },
  });
}

// ─── Checklist Hooks ─────────────────────────────────────────────────────────

export function useAddChecklistItemMutation() {
  const queryClient = useQueryClient();
  return useMutation<ChecklistItem, Error, { taskId: string; title: string }>({
    mutationFn: (payload) => apiClient.post<ChecklistItem>(`tasks/${payload.taskId}/checklist`, { title: payload.title }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateChecklistItemMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<ChecklistItem, Error, { itemId: string; data: { isCompleted?: boolean; title?: string } }>({
    mutationFn: (payload) => apiClient.patch<ChecklistItem>(`tasks/checklist/${payload.itemId}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteChecklistItemMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (itemId) => apiClient.delete<{ message: string }>(`tasks/checklist/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ─── Comments Hooks ──────────────────────────────────────────────────────────

export function useAddCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation<TaskComment, Error, { taskId: string; content: string; category?: string }>({
    mutationFn: (payload) => apiClient.post<TaskComment>(`tasks/${payload.taskId}/comments`, { content: payload.content, category: payload.category }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteCommentMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (commentId) => apiClient.delete<{ message: string }>(`tasks/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateCommentMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<TaskComment, Error, { commentId: string; data: { content?: string; isPinned?: boolean; reactions?: string } }>({
    mutationFn: (payload) => apiClient.patch<TaskComment>(`tasks/comments/${payload.commentId}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
    },
  });
}

// ─── Milestones Hooks ────────────────────────────────────────────────────────

export function useMilestonesQuery(projectId: string) {
  return useQuery<TaskMilestone[]>({
    queryKey: ["task-projects", "milestones", projectId],
    queryFn: () => apiClient.get<TaskMilestone[]>(`tasks/projects/${projectId}/milestones`),
    enabled: !!projectId && projectId !== "all",
  });
}

export function useCreateMilestoneMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<TaskMilestone, Error, Partial<TaskMilestone>>({
    mutationFn: (payload) => apiClient.post<TaskMilestone>(`tasks/projects/${projectId}/milestones`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-projects", "milestones", projectId] });
    },
  });
}

export function useUpdateMilestoneMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<TaskMilestone, Error, { id: string; data: Partial<TaskMilestone> }>({
    mutationFn: (payload) => apiClient.patch<TaskMilestone>(`tasks/milestones/${payload.id}`, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-projects", "milestones", projectId] });
    },
  });
}

export function useDeleteMilestoneMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`tasks/milestones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-projects", "milestones", projectId] });
    },
  });
}

// ─── Dependencies Hooks ──────────────────────────────────────────────────────

export function useCreateDependencyMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { dependsOnTaskId: string; dependencyType?: string }>({
    mutationFn: (payload) => apiClient.post<any>(`tasks/${taskId}/dependencies`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
    },
  });
}

export function useDeleteDependencyMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`tasks/dependencies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
    },
  });
}

// ─── Time Entries Hooks ──────────────────────────────────────────────────────

export function useCreateTimeEntryMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<TimeEntry, Error, Omit<TimeEntry, "id" | "employeeName">>({
    mutationFn: (payload) => apiClient.post<TimeEntry>(`tasks/${taskId}/time-entries`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTimeEntryMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`tasks/time-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTimeEntryMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<TimeEntry, Error, { id: string; data: Partial<Omit<TimeEntry, "id" | "employeeName">> }>({
    mutationFn: ({ id, data }) => apiClient.patch<TimeEntry>(`tasks/time-entries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ─── Attachments Hooks ───────────────────────────────────────────────────────

export function useCreateAttachmentMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<TaskAttachment, Error, Omit<TaskAttachment, "id" | "uploadedByName">>({
    mutationFn: (payload) => apiClient.post<TaskAttachment>(`tasks/${taskId}/attachments`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
    },
  });
}

export function useDeleteAttachmentMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`tasks/attachments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
    },
  });
}

// ─── Notifications Hooks ─────────────────────────────────────────────────────

export function useNotificationsQuery() {
  return useQuery<TaskNotification[]>({
    queryKey: ["task-notifications"],
    queryFn: () => apiClient.get<TaskNotification[]>("tasks/notifications"),
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation<TaskNotification, Error, string>({
    mutationFn: (id) => apiClient.patch<TaskNotification>(`tasks/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
  });
}
