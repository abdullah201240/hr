import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/hooks/useTasks";
import { useEmployeeOptionsQuery } from "@/hooks/useEmployees";
import { useAuthStore } from "@/store/useAuthStore";
import { format, parseISO, isAfter } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Trash2,
  Plus,
  Send,
  Loader2,
  CheckSquare,
  MessageSquare,
  History,
  Play,
  Square,
  Paperclip,
  GitBranch,
  Eye,
  File,
  Download,
  Pin,
  Star,
  Edit,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
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

  // Form local states
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentCategory, setCommentCategory] = useState("general");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [descText, setDescText] = useState("");

  const [activeTab, setActiveTab] = useState<"checklist" | "comments" | "activity" | "files" | "dependencies" | "time">("checklist");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [timerVal, setTimerVal] = useState("00:00:00");

  // Advanced features form states
  const [depTargetId, setDepTargetId] = useState("");
  const [manualTimeMinutes, setManualTimeMinutes] = useState("");
  const [manualTimeDesc, setManualTimeDesc] = useState("");
  const [watchersList, setWatchersList] = useState<string[]>([]);
  const [isAddingWatcher, setIsAddingWatcher] = useState(false);

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
    if (!task?.timerStartedAt) {
      setTimerVal(formatSeconds(task?.timerElapsedSeconds || 0));
      return;
    }
    const interval = setInterval(() => {
      const elapsed = (task.timerElapsedSeconds || 0) + Math.floor((Date.now() - new Date(task.timerStartedAt!).getTime()) / 1000);
      setTimerVal(formatSeconds(elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [task?.timerStartedAt, task?.timerElapsedSeconds]);

  const handleStartTimer = () => {
    handleMetaUpdate("timerStartedAt", new Date().toISOString());
  };

  const handleStopTimer = () => {
    if (!task || !task.timerStartedAt) return;
    const elapsed = (task.timerElapsedSeconds || 0) + Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000);
    if (!taskId) return;
    updateTaskMut.mutate(
      {
        id: taskId,
        data: {
          timerStartedAt: null,
          timerElapsedSeconds: elapsed,
          actualHours: Number((elapsed / 3600).toFixed(2)),
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

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !taskId) return;
    addChecklistMut.mutate(
      { taskId, title: newChecklistTitle },
      {
        onSuccess: () => {
          setNewChecklistTitle("");
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

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !taskId) return;
    addCommentMut.mutate(
      { taskId, content: commentText, category: commentCategory },
      {
        onSuccess: () => {
          setCommentText("");
          setCommentCategory("general");
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

  const handleSaveCommentEdit = (commentId: string) => {
    if (!editingCommentText.trim()) return;
    updateCommentMut.mutate({
      commentId,
      data: { content: editingCommentText },
    }, {
      onSuccess: () => {
        setEditingCommentId(null);
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

  // Advanced features handlers
  const handleAddDependency = () => {
    if (!depTargetId) return;
    createDependencyMut.mutate({
      dependsOnTaskId: depTargetId,
      dependencyType: "blocked_by",
    }, {
      onSuccess: () => {
        setDepTargetId("");
        toast.success("Dependency link created");
      },
    });
  };

  const handleAddManualTime = () => {
    if (!manualTimeMinutes || !currentUser) return;
    const durationSecs = Number(manualTimeMinutes) * 60;
    createTimeEntryMut.mutate({
      employeeId: currentUser.id,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: durationSecs,
      description: manualTimeDesc || "Manual time entry",
    }, {
      onSuccess: () => {
        setManualTimeMinutes("");
        setManualTimeDesc("");
        toast.success("Manual time entry logged");
      },
    });
  };

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    createAttachmentMut.mutate({
      taskId,
      fileName: file.name,
      fileUrl: "https://via.placeholder.com/150", // Simulated path
      fileSize: file.size,
      uploadedById: currentUser?.id || null,
    }, {
      onSuccess: () => {
        toast.success(`Simulated upload for ${file.name} complete`);
      },
    });
  };

  const handleAddWatcher = (empId: string) => {
    if (watchersList.includes(empId)) return;
    const updated = [...watchersList, empId];
    setWatchersList(updated);
    toast.success("Watcher added");
    setIsAddingWatcher(false);
  };

  const handleRemoveWatcher = (empId: string) => {
    setWatchersList(watchersList.filter(id => id !== empId));
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
        className="w-[100vw] sm:max-w-[760px] p-0 flex flex-row border-l border-slate-200/60 dark:border-slate-800/60 text-xs bg-background"
        showCloseButton={true}
      >
        {isLoading || !task ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Left Main Content */}
            <div className="flex-1 flex flex-col h-full border-r border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
              <SheetHeader className="p-5 border-b border-slate-200/40 dark:border-slate-800/40 flex flex-col gap-1.5 shrink-0">
                <SheetTitle className="sr-only">Task details side sheet</SheetTitle>
                <div className="flex items-center flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none py-0.5 px-2 font-bold uppercase tracking-wider text-[9px]">
                    {task.projectName || "Independent Task"}
                  </Badge>
                  <Badge className={cn(
                    "border-none py-0.5 px-2 text-[9px] font-bold uppercase",
                    task.priority === "Urgent" ? "bg-rose-500/10 text-rose-500"
                      : task.priority === "High" ? "bg-amber-500/10 text-amber-600"
                      : task.priority === "Medium" ? "bg-slate-500/10 text-slate-600"
                      : "bg-blue-500/10 text-blue-500"
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
                    className="text-lg font-bold mt-1 text-foreground cursor-pointer hover:bg-slate-100/30 dark:hover:bg-slate-800/10 p-1 rounded transition-colors font-heading"
                  >
                    {task.title}
                  </h2>
                )}
              </SheetHeader>

              <ScrollArea className="flex-1 p-5">
                <div className="space-y-6">
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
                      <div className="space-y-4">
                        <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                          <Input
                            placeholder="Add checklist subtask item..."
                            value={newChecklistTitle}
                            onChange={(e) => setNewChecklistTitle(e.target.value)}
                            className="h-8 text-xs flex-1 bg-transparent"
                          />
                          <Button type="submit" size="sm" className="h-8 gap-1 text-xs bg-primary">
                            <Plus className="h-3.5 w-3.5" /> Add
                          </Button>
                        </form>

                        <div className="space-y-1 bg-slate-50/10 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                          {task.checklist && task.checklist.length > 0 ? (
                            task.checklist.map((item) => (
                              <div
                                key={item.id}
                                className="group flex items-center justify-between py-1.5 px-2 hover:bg-slate-100/35 dark:hover:bg-slate-800/20 rounded transition-colors"
                              >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <Checkbox
                                    id={item.id}
                                    checked={item.isCompleted}
                                    onCheckedChange={(checked) => handleToggleChecklist(item.id, !!checked)}
                                  />
                                  <label
                                    htmlFor={item.id}
                                    className={cn(
                                      "text-xs cursor-pointer select-none truncate flex-1 font-medium",
                                      item.isCompleted && "line-through text-slate-400"
                                    )}
                                  >
                                    {item.title}
                                  </label>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteChecklist(item.id)}
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="py-6 text-center text-slate-400 italic">No checklist subtasks registered.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab: COMMENTS (Threads with Textarea) */}
                    {activeTab === "comments" && (
                      <div className="space-y-4">
                        <form onSubmit={handlePostComment} className="flex flex-col gap-2.5 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-semibold text-slate-400 uppercase">Category:</span>
                            <div className="flex gap-1">
                              {["general", "status", "blocker", "feedback"].map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setCommentCategory(cat)}
                                  className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase border transition-all cursor-pointer",
                                    commentCategory === cat
                                      ? cat === "blocker" ? "bg-rose-500/10 border-rose-500 text-rose-600"
                                        : cat === "status" ? "bg-blue-500/10 border-blue-500 text-blue-600"
                                        : cat === "feedback" ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                                        : "bg-primary/10 border-primary text-primary"
                                      : "border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  )}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <Textarea
                            placeholder="Write collaborative updates/feedback... Use Shift+Enter for new line."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="text-xs min-h-[70px] resize-none bg-transparent"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handlePostComment(e);
                              }
                            }}
                          />
                          <div className="flex justify-end">
                            <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs bg-primary">
                              <Send className="h-3.5 w-3.5" /> Post Comment
                            </Button>
                          </div>
                        </form>

                        <div className="space-y-3">
                          {task.comments && task.comments.length > 0 ? (
                            // Sort comments: pinned first, then by date
                            [...task.comments]
                              .sort((a, b) => {
                                if (a.isPinned && !b.isPinned) return -1;
                                if (!a.isPinned && b.isPinned) return 1;
                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                              })
                              .map((comm) => {
                                let reactionObj: Record<string, string[]> = {};
                                try {
                                  reactionObj = JSON.parse(comm.reactions || "{}");
                                } catch {
                                  reactionObj = {};
                                }

                                return (
                                  <div
                                    key={comm.id}
                                    className={cn(
                                      "group p-3 rounded-lg border flex gap-2.5 items-start transition-all duration-300",
                                      comm.isPinned
                                        ? "bg-amber-500/5 dark:bg-amber-500/2 border-amber-300/60 dark:border-amber-900/40 shadow-sm"
                                        : "bg-slate-50/20 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-800/50"
                                    )}
                                  >
                                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 overflow-hidden">
                                      {comm.userPhotoUrl ? (
                                        <img src={comm.userPhotoUrl} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        comm.userName?.[0] || "U"
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">{comm.userName}</span>
                                          {comm.category && comm.category !== "general" && (
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                "text-[8px] px-1 py-0 border-none font-bold uppercase",
                                                comm.category === "blocker" ? "bg-rose-500/10 text-rose-500"
                                                  : comm.category === "status" ? "bg-blue-500/10 text-blue-500"
                                                  : "bg-emerald-500/10 text-emerald-500"
                                              )}
                                            >
                                              {comm.category}
                                            </Badge>
                                          )}
                                          {comm.isPinned && (
                                            <span className="flex items-center text-amber-500 gap-0.5 text-[8px] font-bold uppercase">
                                              <Pin className="w-2.5 h-2.5 fill-amber-500 rotate-45" /> Pinned
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                          {format(new Date(comm.createdAt), "MMM d, h:mm a")}
                                        </span>
                                      </div>

                                      {editingCommentId === comm.id ? (
                                        <div className="space-y-1.5 pt-1">
                                          <Textarea
                                            value={editingCommentText}
                                            onChange={(e) => setEditingCommentText(e.target.value)}
                                            className="text-xs min-h-[60px] resize-none"
                                          />
                                          <div className="flex justify-end gap-1">
                                            <Button size="xs" variant="outline" className="text-[9px] h-6" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                            <Button size="xs" className="text-[9px] h-6 bg-primary" onClick={() => handleSaveCommentEdit(comm.id)}>Save</Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{comm.content}</p>
                                      )}

                                      {/* Reactions Bar */}
                                      <div className="flex items-center gap-1 mt-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                                        {["👍", "❤️", "🚀", "👀"].map((emoji) => {
                                          const userList = reactionObj[emoji] || [];
                                          const hasReacted = currentUser?.id ? userList.includes(currentUser.id) : false;
                                          const count = userList.length;

                                          return (
                                            <button
                                              key={emoji}
                                              onClick={() => handleToggleReaction(comm.id, emoji, comm.reactions)}
                                              className={cn(
                                                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-all cursor-pointer",
                                                hasReacted
                                                  ? "bg-primary/10 border-primary/20 text-primary font-bold"
                                                  : "border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-600"
                                              )}
                                            >
                                              <span>{emoji}</span>
                                              {count > 0 && <span className="text-[9px]">{count}</span>}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Action Buttons: Pin, Edit, Delete */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-hover:block shrink-0 transition-opacity ml-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handlePinComment(comm.id, comm.isPinned)}
                                        className={cn(
                                          "h-6 w-6 text-slate-400 hover:text-amber-500 hover:bg-transparent",
                                          comm.isPinned && "text-amber-500"
                                        )}
                                        title={comm.isPinned ? "Unpin Comment" : "Pin Comment"}
                                      >
                                        <Pin className="h-3 w-3 rotate-45" />
                                      </Button>
                                      
                                      {comm.userId === currentUser?.id && (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              setEditingCommentId(comm.id);
                                              setEditingCommentText(comm.content);
                                            }}
                                            className="h-6 w-6 text-slate-400 hover:text-primary hover:bg-transparent"
                                            title="Edit Comment"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>

                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteCommentMut.mutate(comm.id)}
                                            className="h-6 w-6 text-slate-400 hover:text-rose-500 hover:bg-transparent"
                                            title="Delete Comment"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                          ) : (
                            <div className="py-8 text-center text-slate-400 italic">No discussion logged. Start the conversation!</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab: FILES / ATTACHMENTS (Drag & Drop Zone) */}
                    {activeTab === "files" && (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center hover:border-primary/60 transition-colors relative cursor-pointer">
                          <input
                            type="file"
                            onChange={handleSimulateFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Paperclip className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Drag files here or click to upload</span>
                          <span className="text-[10px] text-slate-400">Simulator supports files up to 25MB</span>
                        </div>

                        <div className="space-y-2">
                          {task.attachments && task.attachments.length > 0 ? (
                            task.attachments.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/5">
                                <div className="flex items-center gap-2">
                                  <File className="w-4 h-4 text-primary" />
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{file.fileName}</span>
                                    <span className="text-[9px] text-slate-400">
                                      {Math.round(file.fileSize / 1024)} KB • uploaded by {file.uploadedByName || "User"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <a href={file.fileUrl} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                  <button onClick={() => deleteAttachmentMut.mutate(file.id)} className="p-1 hover:bg-rose-500/10 rounded text-slate-400 hover:text-rose-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-6 text-center text-slate-400 italic">No attachments uploaded yet.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab: TASK DEPENDENCIES */}
                    {activeTab === "dependencies" && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <select
                            value={depTargetId}
                            onChange={(e) => setDepTargetId(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs flex-1 focus:outline-none"
                          >
                            <option value="">Link blocking task...</option>
                            {allTasks
                              .filter((t) => t.id !== taskId)
                              .map((t) => (
                                <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                              ))}
                          </select>
                          <Button onClick={handleAddDependency} size="sm" className="h-8 bg-primary">Link</Button>
                        </div>

                        <div className="space-y-2">
                          {task.dependencies && task.dependencies.length > 0 ? (
                            task.dependencies.map((dep) => (
                              <div key={dep.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/5 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-500">Blocked By</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{dep.dependsOnTaskTitle}</span>
                                  <Badge className="text-[9px]">{dep.dependsOnTaskStatus}</Badge>
                                </div>
                                <button onClick={() => deleteDependencyMut.mutate(dep.id)} className="text-slate-400 hover:text-rose-500">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="py-6 text-center text-slate-400 italic">No linked task dependencies.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab: MANUAL TIME LOGS */}
                    {activeTab === "time" && (
                      <div className="space-y-4">
                        <div className="bg-slate-50/10 dark:bg-slate-900/10 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 space-y-3">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">Add Manual Time Log</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Duration (Minutes)</label>
                              <Input type="number" value={manualTimeMinutes} onChange={(e) => setManualTimeMinutes(e.target.value)} className="h-8 bg-transparent" placeholder="e.g. 60" />
                            </div>
                            <div className="grid gap-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Description</label>
                              <Input value={manualTimeDesc} onChange={(e) => setManualTimeDesc(e.target.value)} className="h-8 bg-transparent" placeholder="What did you work on?" />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button onClick={handleAddManualTime} size="sm" className="h-8 bg-primary">Log Time</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {task.timeEntries && task.timeEntries.length > 0 ? (
                            task.timeEntries.map((log) => (
                              <div key={log.id} className="p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/5 text-xs flex justify-between items-center">
                                <div>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">{log.description}</span>
                                  <span className="text-[10px] text-slate-400">
                                    Logged by {log.employeeName || "User"} • {format(parseISO(log.startTime), "MMM d, yyyy")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-primary">{Math.round(log.durationSeconds / 60)} min</span>
                                  <button onClick={() => deleteTimeEntryMut.mutate(log.id)} className="text-slate-400 hover:text-rose-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-6 text-center text-slate-400 italic">No manual hours logged.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab: ACTIVITY HISTORY */}
                    {activeTab === "activity" && (
                      <div className="space-y-3 bg-slate-50/10 dark:bg-slate-900/10 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                        {task.activities && task.activities.length > 0 ? (
                          task.activities.map((act) => (
                            <div key={act.id} className="text-xs text-slate-400 flex items-start gap-2 border-b border-slate-200/20 pb-2 last:border-b-0 last:pb-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                              <div className="flex-1">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">{act.userName || "System"}</span>
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
            </div>

            {/* Right Parameter Sidebar (Properties, Live Timer, Followers) */}
            <div className="w-[230px] shrink-0 h-full bg-slate-50/30 dark:bg-slate-900/10 flex flex-col overflow-y-auto p-4 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Properties</h3>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Status
                </Label>
                <Select value={task.status} onValueChange={(val) => handleMetaUpdate("status", val)}>
                  <SelectTrigger className="h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Backlog" className="text-xs">Backlog</SelectItem>
                    <SelectItem value="Todo" className="text-xs">Todo</SelectItem>
                    <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                    <SelectItem value="In Review" className="text-xs">In Review</SelectItem>
                    <SelectItem value="Done" className="text-xs">Done</SelectItem>
                    <SelectItem value="Cancelled" className="text-xs">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee Selector */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <User className="h-3 w-3" /> Assignee
                </Label>
                <Select value={task.assigneeId || "unassigned"} onValueChange={(val) => handleMetaUpdate("assigneeId", val === "unassigned" ? null : val)}>
                  <SelectTrigger className="h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" className="text-xs">Unassigned</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id} className="text-xs">{e.fullNameEnglish}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Selector */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Priority
                </Label>
                <Select value={task.priority} onValueChange={(val) => handleMetaUpdate("priority", val)}>
                  <SelectTrigger className="h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low" className="text-xs">Low</SelectItem>
                    <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                    <SelectItem value="High" className="text-xs">High</SelectItem>
                    <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Due Date
                </Label>
                <Input
                  type="date"
                  value={task.dueDate ? task.dueDate.split("T")[0] : ""}
                  onChange={(e) => handleMetaUpdate("dueDate", e.target.value ? `${e.target.value}T00:00:00.000Z` : null)}
                  className="h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60"
                />
              </div>

              {/* ─── Work Monitoring Options ─── */}
              <div className="space-y-3 bg-slate-50/20 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Monitoring Metrics
                </span>
                
                {/* Work Status */}
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-400">Work Status</label>
                  <Select value={task.workStatus || "Idle"} onValueChange={(val) => handleMetaUpdate("workStatus", val)}>
                    <SelectTrigger className="h-7 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Idle" className="text-xs">Idle</SelectItem>
                      <SelectItem value="Active Working" className="text-xs">Active Working</SelectItem>
                      <SelectItem value="Paused" className="text-xs">Paused</SelectItem>
                      <SelectItem value="Blocked" className="text-xs">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                    <span>Progress</span>
                    <span className="font-bold text-primary">{task.progress || 0}%</span>
                  </div>
                  <Select value={String(task.progress || 0)} onValueChange={(val) => handleMetaUpdate("progress", Number(val))}>
                    <SelectTrigger className="h-7 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                        <SelectItem key={p} value={String(p)} className="text-xs">{p}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Health Index Card */}
                <div className="space-y-1 pt-1 border-t border-slate-200/40 dark:border-slate-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-semibold">Health Index:</span>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5",
                      health === "Healthy" ? "bg-emerald-500/10 text-emerald-500" :
                      health === "At Risk" ? "bg-amber-500/10 text-amber-500" :
                      "bg-rose-500/10 text-rose-500"
                    )}>
                      {health === "Healthy" && <CheckCircle2 className="h-2.5 w-2.5" />}
                      {health === "At Risk" && <AlertTriangle className="h-2.5 w-2.5" />}
                      {health === "Critical" && <AlertCircle className="h-2.5 w-2.5" />}
                      {health}
                    </span>
                  </div>
                </div>

                {/* Time Variance Card */}
                {task.estimatedHours > 0 && (
                  <div className="flex items-center justify-between pt-1 text-[9px]">
                    <span className="text-slate-400 font-semibold">Time Variance:</span>
                    <span className={cn(
                      "font-bold",
                      timeVariance >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {timeVariance >= 0 ? `+${timeVariance}h under` : `${timeVariance}h over`}
                    </span>
                  </div>
                )}
              </div>

              {/* ─── Supervisor Feedback Options ─── */}
              <div className="space-y-3 bg-slate-50/20 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Supervisor Reviews
                </span>

                {/* Approval Status */}
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-400">Review Result</label>
                  <Select value={task.approvalStatus || "Pending"} onValueChange={(val) => handleMetaUpdate("approvalStatus", val)}>
                    <SelectTrigger className="h-7 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending" className="text-xs">Pending Review</SelectItem>
                      <SelectItem value="Approved" className="text-xs">Approved</SelectItem>
                      <SelectItem value="Changes Requested" className="text-xs">Changes Requested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating (1-5 clickable stars) */}
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-400 block">Rating Score</label>
                  <div className="flex gap-1 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        onClick={() => handleMetaUpdate("reviewRating", star)}
                        className={cn(
                          "w-4 h-4 cursor-pointer transition-colors",
                          star <= (task.reviewRating || 0)
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-300 dark:text-slate-700"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Remarks/feedback text */}
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-400">Remarks / Feedback</label>
                  <Textarea
                    placeholder="Provide supervisor feedback remarks..."
                    defaultValue={task.reviewFeedback || ""}
                    onBlur={(e) => handleMetaUpdate("reviewFeedback", e.target.value)}
                    className="text-[11px] min-h-[50px] resize-none bg-background p-1.5"
                  />
                </div>
              </div>

              <Separator className="bg-slate-200/40 dark:border-slate-800/40 my-2" />

              {/* Watchers / Followers Pane */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Watchers ({watchersList.length})
                  </Label>
                  <button onClick={() => setIsAddingWatcher(!isAddingWatcher)} className="text-primary hover:underline text-[10px]">Add</button>
                </div>

                {isAddingWatcher && (
                  <select
                    onChange={(e) => { if (e.target.value) handleAddWatcher(e.target.value); }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>Select User...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.fullNameEnglish}</option>
                    ))}
                  </select>
                )}

                <div className="flex flex-wrap gap-1 mt-1">
                  {watchersList.map((watcherId) => {
                    const empName = employees.find(e => e.id === watcherId)?.fullNameEnglish || "User";
                    return (
                      <Badge key={watcherId} variant="outline" className="text-[10px] gap-1 px-1.5 py-0.5">
                        {empName.split(" ")[0]}
                        <button onClick={() => handleRemoveWatcher(watcherId)} className="text-slate-400 hover:text-rose-500 font-bold">×</button>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Tags Input */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags (comma-separated)
                </Label>
                <Input
                  defaultValue={task.tags || ""}
                  onBlur={(e) => handleMetaUpdate("tags", e.target.value)}
                  placeholder="Design, Bug, Critical"
                  className="h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60"
                />
              </div>

              {/* Live Time Tracker (Timer) */}
              <div className="space-y-2 bg-slate-50/10 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Live Timer
                  </Label>
                  <span className="font-mono text-xs font-bold text-foreground">{timerVal}</span>
                </div>
                {task.timerStartedAt ? (
                  <Button size="xs" onClick={handleStopTimer} className="w-full h-7 text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1">
                    <Square className="h-3 w-3 fill-white" /> Stop Timer
                  </Button>
                ) : (
                  <Button size="xs" onClick={handleStartTimer} className="w-full h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1">
                    <Play className="h-3 w-3 fill-white" /> Start Timer
                  </Button>
                )}
              </div>

              {/* Estimated vs Actual Hours */}
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label className="text-[9px] font-bold text-slate-400 uppercase">Est. Hours</Label>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={task.estimatedHours}
                    onBlur={(e) => handleMetaUpdate("estimatedHours", Number(e.target.value) || 0)}
                    className="h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-[9px] font-bold text-slate-400 uppercase">Act. Hours</Label>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={task.actualHours}
                    onBlur={(e) => handleMetaUpdate("actualHours", Number(e.target.value) || 0)}
                    className="h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60"
                  />
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 space-y-1 bg-slate-50/10 dark:bg-slate-900/10 p-2 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                <p>Created: <span className="font-semibold text-slate-700 dark:text-slate-300">{format(parseISO(task.createdAt), "MMM d, yyyy")}</span></p>
                <p>Modified: <span className="font-semibold text-slate-700 dark:text-slate-300">{format(parseISO(task.updatedAt), "MMM d, yyyy")}</span></p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
