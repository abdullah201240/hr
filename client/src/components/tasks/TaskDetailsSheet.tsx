import { useState, useEffect } from "react";
import { TaskChecklist } from "./details/TaskChecklist";
import { TaskComments } from "./details/TaskComments";
import { TaskFiles } from "./details/TaskFiles";
import { TaskDependencies } from "./details/TaskDependencies";
import { TaskTimeLogs } from "./details/TaskTimeLogs";
import { TaskPropertiesGrid } from "./details/TaskPropertiesGrid";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useTaskDetailQuery,
  useUpdateTaskMutation,
  useAddChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
  useCreateDependencyMutation,
  useDeleteDependencyMutation,
  useCreateTimeEntryMutation,
  useDeleteTimeEntryMutation,
  useCreateAttachmentMutation,
  useDeleteAttachmentMutation,
  useTasksQuery,
  useMilestonesQuery,
} from "@/hooks/useTasks";
import { useEmployeeOptionsQuery } from "@/hooks/useEmployees";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/lib/api";
import { format, parseISO, isAfter } from "date-fns";
import {
  Loader2,
  CheckSquare,
  MessageSquare,
  History,
  Paperclip,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatSeconds(totalSecs: number): string {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
}

// Simple Markdown parser utility
function renderMarkdown(text: string) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs'>$1</code>")
    .replace(/\n/g, "<br />");
  return <div dangerouslySetInnerHTML={{ __html: html }} className="text-xs space-y-1 text-slate-700 dark:text-slate-300" />;
}

interface TaskDetailsSheetProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailsSheet({
  taskId,
  isOpen,
  onClose,
}: TaskDetailsSheetProps) {
  const { user: currentUser } = useAuthStore();
  const { data: task, isLoading } = useTaskDetailQuery(taskId || "", isOpen);
  const { data: employees = [] } = useEmployeeOptionsQuery();
  const { data: allTasks = [] } = useTasksQuery({});
  const { data: milestones = [] } = useMilestonesQuery(task?.projectId || "");

  const updateTaskMut = useUpdateTaskMutation();
  const addChecklistMut = useAddChecklistItemMutation();
  const updateChecklistMut = useUpdateChecklistItemMutation(taskId || "");
  const deleteChecklistMut = useDeleteChecklistItemMutation(taskId || "");
  const addCommentMut = useAddCommentMutation();
  const deleteCommentMut = useDeleteCommentMutation(taskId || "");
  const updateCommentMut = useUpdateCommentMutation(taskId || "");

  // Advanced feature mutations
  const createDependencyMut = useCreateDependencyMutation(taskId || "");
  const deleteDependencyMut = useDeleteDependencyMutation(taskId || "");
  const createTimeEntryMut = useCreateTimeEntryMutation(taskId || "");
  const deleteTimeEntryMut = useDeleteTimeEntryMutation(taskId || "");
  const createAttachmentMut = useCreateAttachmentMutation(taskId || "");
  const deleteAttachmentMut = useDeleteAttachmentMutation(taskId || "");

  // Local UI states
  const [titleText, setTitleText] = useState("");
  const [descText, setDescText] = useState("");
  const [activeTab, setActiveTab] = useState<"checklist" | "comments" | "activity" | "files" | "dependencies" | "time">("checklist");
  const [activeMainTab, setActiveMainTab] = useState<"details" | "properties">("details");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [timerVal, setTimerVal] = useState("00:00:00");
  const [watchersList, setWatchersList] = useState<string[]>([]);
  const [isAddingWatcher, setIsAddingWatcher] = useState(false);

  useEffect(() => {
    if (task) {
      setWatchersList(task.watchers ? task.watchers.split(',').filter(Boolean) : []);
    }
  }, [task]);

  // Close sheet on Escape keyboard shortcut
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    const baseSeconds = Math.round((task?.actualHours || 0) * 3600) + (task?.timerElapsedSeconds || 0);
    if (!task?.timerStartedAt) {
      setTimerVal(formatSeconds(baseSeconds));
      return;
    }
    const interval = setInterval(() => {
      const elapsed = baseSeconds + Math.floor((Date.now() - new Date(task.timerStartedAt!).getTime()) / 1000);
      setTimerVal(formatSeconds(elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [task?.timerStartedAt, task?.timerElapsedSeconds, task?.actualHours]);

  const handleStartTimer = () => {
    handleMetaUpdate("timerStartedAt", new Date().toISOString());
  };

  const handleStopTimer = () => {
    if (!task || !task.timerStartedAt) return;
    if (!taskId) return;
    const sessionSeconds = Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000);
    const existingHours = task.actualHours || 0;
    const sessionHours = Number((sessionSeconds / 3600).toFixed(2));
    updateTaskMut.mutate(
      {
        id: taskId,
        data: {
          timerStartedAt: null,
          timerElapsedSeconds: 0,
          actualHours: Number((existingHours + sessionHours).toFixed(2)),
        },
      },
      {
        onSuccess: () => {
          toast.success("Timer stopped & actual hours updated");
        },
      }
    );
  };

  const handleMetaUpdate = (field: string, value: any) => {
    if (!taskId) return;
    updateTaskMut.mutate(
      {
        id: taskId,
        data: { [field]: value },
      },
      {
        onSuccess: () => {
          toast.success("Task updated successfully");
        },
      }
    );
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (!titleText.trim() || titleText === task?.title) return;
    handleMetaUpdate("title", titleText);
  };

  const handleDescSave = () => {
    setIsEditingDesc(false);
    if (descText === task?.description) return;
    handleMetaUpdate("description", descText);
  };

  const handleAddChecklistItem = (title: string) => {
    if (!title.trim() || !taskId) return;
    addChecklistMut.mutate(
      { taskId, title },
      {
        onSuccess: () => {
          toast.success("Subtask check item added");
        },
      }
    );
  };

  const handleToggleChecklist = (itemId: string, isCompleted: boolean) => {
    updateChecklistMut.mutate({ itemId, data: { isCompleted } });
  };

  const handleDeleteChecklist = (itemId: string) => {
    deleteChecklistMut.mutate(itemId);
  };

  const handlePostComment = (content: string, category: string) => {
    if (!content.trim() || !taskId) return;
    addCommentMut.mutate(
      { taskId, content, category },
      {
        onSuccess: () => {
          toast.success("Comment posted successfully");
        },
      }
    );
  };

  const handlePinComment = (commentId: string, currentPinned: boolean) => {
    updateCommentMut.mutate({
      commentId,
      data: { isPinned: !currentPinned },
    }, {
      onSuccess: () => {
        toast.success(!currentPinned ? "Comment pinned to top" : "Comment unpinned");
      }
    });
  };

  const handleSaveCommentEdit = (commentId: string, content: string) => {
    if (!content.trim()) return;
    updateCommentMut.mutate({
      commentId,
      data: { content },
    }, {
      onSuccess: () => {
        toast.success("Comment updated");
      }
    });
  };

  const handleToggleReaction = (commentId: string, emoji: string, reactionsStr: string) => {
    if (!currentUser?.id) return;
    let parsed: Record<string, string[]> = {};
    try {
      parsed = JSON.parse(reactionsStr || "{}");
    } catch {
      parsed = {};
    }
    if (!parsed[emoji]) {
      parsed[emoji] = [];
    }
    if (parsed[emoji].includes(currentUser.id)) {
      parsed[emoji] = parsed[emoji].filter(id => id !== currentUser.id);
    } else {
      parsed[emoji].push(currentUser.id);
    }
    updateCommentMut.mutate({
      commentId,
      data: { reactions: JSON.stringify(parsed) },
    });
  };

  const handleAddDependency = (targetTaskId: string) => {
    if (!targetTaskId) return;
    createDependencyMut.mutate({
      dependsOnTaskId: targetTaskId,
      dependencyType: "blocked_by",
    }, {
      onSuccess: () => {
        toast.success("Dependency link created");
      },
    });
  };

  const handleAddManualTime = (minutes: string, description: string) => {
    if (!minutes || !currentUser) return;
    const durationSecs = Number(minutes) * 60;
    createTimeEntryMut.mutate({
      employeeId: currentUser.id,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: durationSecs,
      description: description || "Manual time entry",
    }, {
      onSuccess: () => {
        toast.success("Manual time entry logged");
      },
    });
  };

  const handleSimulateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    const loadingToastId = toast.loading(`Uploading ${file.name} to Cloudinary...`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await apiClient.post<any>(`upload?folder=tasks/${taskId}`, formData);
      const fileUrl = res.secureUrl || res.url;

      createAttachmentMut.mutate({
        taskId,
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        uploadedById: currentUser?.id || null,
      }, {
        onSuccess: () => {
          toast.dismiss(loadingToastId);
          toast.success(`Upload for ${file.name} complete`);
        },
        onError: () => {
          toast.dismiss(loadingToastId);
          toast.error("Failed to register attachment");
        }
      });
    } catch (err: any) {
      toast.dismiss(loadingToastId);
      toast.error(`Upload failed: ${err.message || "Unknown error"}`);
    }
  };

  const handleAddWatcher = (empId: string) => {
    if (watchersList.includes(empId)) return;
    const updated = [...watchersList, empId];
    setWatchersList(updated);
    handleMetaUpdate("watchers", updated.join(','));
    toast.success("Watcher added");
    setIsAddingWatcher(false);
  };

  const handleRemoveWatcher = (empId: string) => {
    const updated = watchersList.filter(id => id !== empId);
    setWatchersList(updated);
    handleMetaUpdate("watchers", updated.join(','));
    toast.success("Watcher removed");
  };

  const isOverdue = task?.dueDate ? isAfter(new Date(), parseISO(task.dueDate)) && task.status !== "Done" : false;
  let health: "Healthy" | "At Risk" | "Critical" = "Healthy";
  if (task) {
    if (isOverdue || task.approvalStatus === "Changes Requested") {
      health = "Critical";
    } else if (task.workStatus === "Blocked" || (task.actualHours > task.estimatedHours && task.estimatedHours > 0)) {
      health = "At Risk";
    }
  }
  const timeVariance = task ? (task.estimatedHours || 0) - (task.actualHours || 0) : 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-[100vw] data-[side=right]:sm:max-w-[960px] gap-0 p-0 flex flex-col overflow-hidden border-l border-slate-200/60 dark:border-slate-800/60 text-xs bg-background"
        showCloseButton={true}
      >
        {isLoading || !task ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Unified Top Header & Switcher */}
            <SheetHeader className="p-5 border-b border-slate-200/40 dark:border-slate-800/40 flex flex-col gap-1.5 shrink-0">
              <SheetTitle className="sr-only">Task details side sheet</SheetTitle>
              <div className="flex items-center flex-wrap gap-2 pr-6">
                <Badge variant="secondary" className="bg-primary/5 text-primary border-none py-0.5 px-2 font-bold uppercase tracking-wider text-[9px]">
                  {task.projectName || "Independent Task"}
                </Badge>
                <Badge className={cn(
                  "border-none py-0.5 px-2 text-[9px] font-bold uppercase",
                  task.priority === "Urgent" ? "bg-rose-500/10 text-rose-500"
                    : task.priority === "High" ? "bg-amber-500/10 text-amber-600"
                    : task.priority === "Medium" ? "bg-slate-50/10 text-slate-600"
                    : "bg-blue-50/10 text-blue-500"
                )}>
                  {task.priority} Priority
                </Badge>
                {task.approvalStatus === "Approved" && (
                  <Badge className="bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-600 border-none py-0.5 px-2 text-[9px] font-bold uppercase flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Approved
                  </Badge>
                )}
                {task.approvalStatus === "Changes Requested" && (
                  <Badge className="bg-rose-500/15 hover:bg-rose-500/20 text-rose-600 border-none py-0.5 px-2 text-[9px] font-bold uppercase flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Changes Requested
                  </Badge>
                )}
              </div>

              {isEditingTitle ? (
                <Input
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                  className="text-lg font-bold h-9 mt-1 px-2 focus:ring-0 focus:border-primary text-foreground font-heading"
                  autoFocus
                />
              ) : (
                <h2
                  onClick={() => { setTitleText(task.title); setIsEditingTitle(true); }}
                  className="text-lg font-bold mt-1 text-foreground cursor-pointer hover:bg-slate-100/30 dark:hover:bg-slate-800/10 p-1 rounded transition-colors font-heading pr-8"
                >
                  {task.title}
                </h2>
              )}

              {/* Segmented Control for Both Desktop and Mobile */}
              <div className="flex mt-3 p-0.5 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200/40 dark:border-slate-800/40 max-w-md">
                <button
                  onClick={() => setActiveMainTab("details")}
                  className={cn(
                    "flex-1 py-1.5 text-center rounded-lg font-semibold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer",
                    activeMainTab === "details"
                      ? "bg-white dark:bg-slate-900 text-foreground shadow-sm font-bold border border-slate-200/40 dark:border-slate-800/40"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                  )}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Task Details & Work
                </button>
                <button
                  onClick={() => setActiveMainTab("properties")}
                  className={cn(
                    "flex-1 py-1.5 text-center rounded-lg font-semibold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer",
                    activeMainTab === "properties"
                      ? "bg-white dark:bg-slate-900 text-foreground shadow-sm font-bold border border-slate-200/40 dark:border-slate-800/40"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                  )}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Properties & Settings
                </button>
              </div>
            </SheetHeader>

            {/* TAB CONTENT: Details & Work */}
            {activeMainTab === "details" && (
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-6 p-5 pb-8">
                  {/* Task Description & Markdown Preview */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description (Basic Markdown Supported)</Label>
                    {isEditingDesc ? (
                      <div className="space-y-2">
                        <Textarea
                          value={descText}
                          onChange={(e) => setDescText(e.target.value)}
                          placeholder="markdown: **bold** or *list item..."
                          className="min-h-[100px] text-xs resize-none"
                          autoFocus
                        />
                        <div className="flex gap-1.5 justify-end">
                          <Button size="xs" variant="outline" onClick={() => setIsEditingDesc(false)} className="text-[10px] h-7 px-2">Cancel</Button>
                          <Button size="xs" onClick={handleDescSave} className="text-[10px] h-7 px-2 bg-primary">Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => { setDescText(task.description || ""); setIsEditingDesc(true); }}
                        className={cn(
                          "p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors cursor-pointer text-xs leading-relaxed min-h-[60px]",
                          !task.description && "text-slate-400 italic"
                        )}
                      >
                        {task.description ? renderMarkdown(task.description) : "Add detailed guidelines or markdown scope details..."}
                      </div>
                    )}
                  </div>

                  {/* Tab Navigation */}
                  <div className="space-y-4 pt-2">
                    <div className="flex border-b border-slate-200/40 dark:border-slate-800/40 shrink-0 overflow-x-auto gap-2">
                      {[
                        { id: "checklist", label: "Checklist", icon: CheckSquare },
                        { id: "comments", label: `Comments (${task.comments?.length || 0})`, icon: MessageSquare },
                        { id: "files", label: `Files (${task.attachments?.length || 0})`, icon: Paperclip },
                        { id: "dependencies", label: `Dependencies (${task.dependencies?.length || 0})`, icon: GitBranch },
                        { id: "time", label: `Time Logs`, icon: Clock },
                        { id: "activity", label: "History", icon: History },
                      ].map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-2 border-b-2 -mb-[2px] transition-colors font-semibold text-xs whitespace-nowrap",
                              activeTab === t.id
                                ? "border-primary text-primary"
                                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab: CHECKLIST SUBTASKS */}
                    {activeTab === "checklist" && (
                      <TaskChecklist
                        checklist={task.checklist}
                        onAddItem={handleAddChecklistItem}
                        onToggleItem={handleToggleChecklist}
                        onDeleteItem={handleDeleteChecklist}
                      />
                    )}

                    {/* Tab: COMMENTS */}
                    {activeTab === "comments" && (
                      <TaskComments
                        comments={task.comments}
                        employees={employees}
                        currentUser={currentUser}
                        onPostComment={handlePostComment}
                        onPinComment={handlePinComment}
                        onSaveCommentEdit={handleSaveCommentEdit}
                        onDeleteComment={(id) => deleteCommentMut.mutate(id)}
                        onToggleReaction={handleToggleReaction}
                      />
                    )}

                    {/* Tab: FILES / ATTACHMENTS */}
                    {activeTab === "files" && (
                      <TaskFiles
                        attachments={task.attachments}
                        onFileUpload={handleSimulateFileUpload}
                        onDeleteFile={(id) => deleteAttachmentMut.mutate(id)}
                      />
                    )}

                    {/* Tab: TASK DEPENDENCIES */}
                    {activeTab === "dependencies" && (
                      <TaskDependencies
                        taskId={task.id}
                        dependencies={task.dependencies}
                        allTasks={allTasks}
                        onAddDependency={handleAddDependency}
                        onDeleteDependency={(id) => deleteDependencyMut.mutate(id)}
                      />
                    )}

                    {/* Tab: MANUAL TIME LOGS */}
                    {activeTab === "time" && (
                      <TaskTimeLogs
                        timeEntries={task.timeEntries}
                        onAddManualTime={handleAddManualTime}
                        onDeleteTimeEntry={(id) => deleteTimeEntryMut.mutate(id)}
                      />
                    )}

                    {/* Tab: ACTIVITY HISTORY */}
                    {activeTab === "activity" && (
                      <div className="space-y-3 bg-slate-50/10 dark:bg-slate-900/10 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                        {task.activities && task.activities.length > 0 ? (
                          task.activities.map((act) => (
                            <div key={act.id} className="text-xs text-slate-400 flex items-start gap-2 border-b border-slate-200/20 pb-2 last:border-b-0 last:pb-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                              <div className="flex-1">
                                <span className="font-semibold text-slate-700 dark:text-slate-350 mr-1">{act.userName || "System"}</span>
                                <span>{act.details}</span>
                                <p className="text-[9px] text-slate-400 mt-0.5">
                                  {format(new Date(act.createdAt), "MMM d, yyyy h:mm a")}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-slate-400 italic">No activities logged yet.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* TAB CONTENT: Properties & Settings */}
            {activeMainTab === "properties" && (
              <TaskPropertiesGrid
                task={task}
                employees={employees}
                milestones={milestones}
                health={health}
                timeVariance={timeVariance}
                timerVal={timerVal}
                watchersList={watchersList}
                isAddingWatcher={isAddingWatcher}
                setIsAddingWatcher={setIsAddingWatcher}
                onAddWatcher={handleAddWatcher}
                onRemoveWatcher={handleRemoveWatcher}
                onMetaUpdate={handleMetaUpdate}
                onStartTimer={handleStartTimer}
                onStopTimer={handleStopTimer}
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
