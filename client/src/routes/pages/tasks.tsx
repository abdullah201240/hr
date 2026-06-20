import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useProjectsQuery,
  useTasksQuery,
  useProjectActivitiesQuery,
  useCreateProjectMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  type Task,
} from "@/hooks/useTasks";
import { useEmployeesQuery } from "@/hooks/useEmployees";
import { ProjectCreateDialog } from "@/components/tasks/ProjectCreateDialog";
import { TaskCreateDialog } from "@/components/tasks/TaskCreateDialog";
import { TaskDetailsSheet } from "@/components/tasks/TaskDetailsSheet";
import TaskBoard from "@/components/tasks/TaskBoard";
import TaskListView from "@/components/tasks/TaskListView";
import TaskWorkloadView from "@/components/tasks/TaskWorkloadView";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import {
  CheckSquare,
  Plus,
  Search,
  LayoutGrid,
  List,
  BarChart3,
  Calendar,
  Settings,
  FileSpreadsheet,
  Printer,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state synced with URL search params
  const tab = searchParams.get("tab") || "board";
  const search = searchParams.get("search") || "";
  const selectedProjectId = searchParams.get("project") || "all";
  const selectedAssigneeId = searchParams.get("assignee") || "all";
  const selectedPriority = searchParams.get("priority") || "all";

  // Workplace Mode States
  const [workplaceProjectId, setWorkplaceProjectId] = useState<string | null>(null);

  // Sorting & Grouping
  const [groupBy, setGroupBy] = useState<"none" | "assignee" | "priority">("none");
  const [sortBy, setSortBy] = useState<"created" | "due" | "priority" | "title">("created");

  // Calendar View month state
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Modal Dialog States
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Edit Project Settings state
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projLead, setProjLead] = useState("");
  const [projWebhook, setProjWebhook] = useState("");
  const [projMembers, setProjMembers] = useState<string[]>([]);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);

  // API Queries & Mutations
  const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery();
  const { data: employeesData } = useEmployeesQuery({ limit: 1000 });
  const employees = useMemo(() => employeesData?.data || [], [employeesData]);

  // Sync workplaceProjectId state with search param
  useEffect(() => {
    const projParam = searchParams.get("project");
    if (projParam && projParam !== "all") {
      setWorkplaceProjectId(projParam);
    } else {
      setWorkplaceProjectId(null);
    }
  }, [searchParams]);

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    projectId: workplaceProjectId || (selectedProjectId === "all" ? undefined : selectedProjectId),
    assigneeId: selectedAssigneeId === "all" ? undefined : selectedAssigneeId,
    priority: selectedPriority === "all" ? undefined : selectedPriority,
  }), [search, selectedProjectId, selectedAssigneeId, selectedPriority, workplaceProjectId]);

  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery(filters);

  // Aggregated timeline activities query (only active in workplace mode — result used for cache)
  useProjectActivitiesQuery(workplaceProjectId || "", !!workplaceProjectId);

  const createProjectMut = useCreateProjectMutation();
  const updateProjectMut = useUpdateProjectMutation();
  const deleteProjectMut = useDeleteProjectMutation();
  const createTaskMut = useCreateTaskMutation();
  const updateTaskMut = useUpdateTaskMutation();
  const deleteTaskMut = useDeleteTaskMutation();

  const activeProject = useMemo(() => projects.find((p) => p.id === workplaceProjectId), [projects, workplaceProjectId]);

  // Initialize Project Settings fields when activeProject loads
  useEffect(() => {
    if (activeProject) {
      setProjName(activeProject.name || "");
      setProjDesc(activeProject.description || "");
      setProjLead(activeProject.ownerId || "");
      setProjWebhook(activeProject.slackWebhookUrl || "");
      setProjMembers(activeProject.members ? activeProject.members.split(",") : []);
    }
  }, [activeProject]);

  // Global Keyboard Shortcuts (C, B, L, W)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName.toLowerCase();
      if (activeEl === "input" || activeEl === "textarea" || activeEl === "select") return;

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        setIsTaskOpen(true);
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        setParam("tab", "board");
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        setParam("tab", "list");
      } else if (e.key.toLowerCase() === "w") {
        e.preventDefault();
        setParam("tab", "workload");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchParams]);

  // Search parameter setters
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all" || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  // Handlers
  const handleCreateProject = (data: any) => {
    createProjectMut.mutate(data, {
      onSuccess: (proj) => {
        setIsProjectOpen(false);
        toast.success("Project workspace created");
        setWorkplaceProjectId(proj.id);
        setParam("project", proj.id);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to create project");
      },
    });
  };

  const handleUpdateProjectSettings = () => {
    if (!workplaceProjectId) return;
    updateProjectMut.mutate({
      id: workplaceProjectId,
      data: {
        name: projName,
        description: projDesc,
        ownerId: projLead || null,
        slackWebhookUrl: projWebhook,
        members: projMembers.join(","),
      },
    }, {
      onSuccess: () => {
        toast.success("Project settings updated successfully");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save project settings");
      },
    });
  };

  const handleArchiveProjectToggle = () => {
    if (!activeProject) return;
    updateProjectMut.mutate({
      id: activeProject.id,
      data: {
        archived: !activeProject.archived,
        status: !activeProject.archived ? "Archived" : "Active",
      },
    }, {
      onSuccess: () => {
        toast.success(activeProject.archived ? "Project restored to Active" : "Project archived successfully");
      },
    });
  };

  const handleCreateTask = (data: any) => {
    const payload = workplaceProjectId ? { ...data, projectId: workplaceProjectId } : data;
    createTaskMut.mutate(payload, {
      onSuccess: () => {
        setIsTaskOpen(false);
        toast.success("Task created successfully");
      },
    });
  };

  const handleStatusChange = (taskId: string, status: any) => {
    const currentTask = tasks.find(t => t.id === taskId);
    const oldStatus = currentTask?.status;

    updateTaskMut.mutate(
      { id: taskId, data: { status } },
      {
        onSuccess: () => {
          toast(`Task moved to ${status}`, {
            action: {
              label: "Undo",
              onClick: () => {
                if (oldStatus) {
                  updateTaskMut.mutate({ id: taskId, data: { status: oldStatus } });
                }
              },
            },
          });
        },
      }
    );
  };

  const handleQuickAdd = (title: string, status: Task["status"]) => {
    handleCreateTask({
      title,
      status,
      priority: "Medium",
    });
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) {
      toast.error("No tasks to export");
      return;
    }
    const headers = ["Title", "Project", "Status", "Priority", "Due Date", "Assignee", "Est Hours", "Act Hours", "Tags"];
    const rows = tasks.map(t => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.projectName || "").replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.dueDate || "",
      `"${(t.assigneeName || "").replace(/"/g, '""')}"`,
      t.estimatedHours,
      t.actualHours,
      `"${(t.tags || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tasks_report_${format(new Date(), "yyyy_MM_dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded successfully");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarDate);
    const end = endOfMonth(calendarDate);
    return eachDayOfInterval({ start, end });
  }, [calendarDate]);

  // Project select sidebar filtered listing
  const visibleProjects = useMemo(() => {
    return projects.filter(p => showArchivedProjects ? p.archived : !p.archived);
  }, [projects, showArchivedProjects]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start pb-10 w-full min-w-0">
      {/* ─── Left Workspace Sidebar ─── */}
      <div className="w-full lg:w-[260px] shrink-0 space-y-4 print:hidden">
        <Card className="p-3 shadow-none border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspaces</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsProjectOpen(true)}
              className="h-6 w-6 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            >
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </Button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setWorkplaceProjectId(null);
                setParam("project", "all");
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all duration-200 border border-transparent",
                workplaceProjectId === null
                  ? "bg-primary/10 text-primary border-primary/10 shadow-sm"
                  : "text-slate-500 hover:bg-slate-100/30 dark:hover:bg-slate-800/20"
              )}
            >
              <span className="flex items-center gap-2">
                <CheckSquare className="h-3.5 w-3.5" />
                Global Workspace
              </span>
              <Badge variant="outline" className="text-[9px] bg-background font-bold px-1.5 py-0">
                {projects.reduce((acc, p) => acc + p.totalTasks, 0)}
              </Badge>
            </button>

            {projectsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            ) : (
              visibleProjects.map((p) => {
                const completionRate = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setWorkplaceProjectId(p.id);
                      setParam("project", p.id);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 flex flex-col gap-1 border border-transparent",
                      workplaceProjectId === p.id
                        ? "bg-primary/5 text-primary border-primary/20 shadow-sm font-semibold"
                        : "text-slate-500 hover:bg-slate-100/20 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold truncate pr-2">{p.name}</span>
                      {p.archived && <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded">Archived</span>}
                      {!p.archived && <span className="text-[9px] font-bold shrink-0">{completionRate}%</span>}
                    </div>
                    {!p.archived && (
                      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full transition-all duration-300",
                            completionRate > 75 ? "bg-emerald-500" : completionRate > 40 ? "bg-amber-500" : "bg-primary"
                          )}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <Separator className="bg-slate-200/60 dark:border-slate-800/60" />
          <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500">
            <Checkbox
              id="show-archived"
              checked={showArchivedProjects}
              onCheckedChange={(checked) => setShowArchivedProjects(!!checked)}
            />
            <label htmlFor="show-archived" className="cursor-pointer">Show Archived Projects</label>
          </div>
        </Card>
      </div>

      {/* ─── Right Content Panel ─── */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* Skeletons Loader */}
        {projectsLoading || tasksLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="h-[400px] bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Header controls & Export */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-4 print:hidden">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                  {workplaceProjectId ? activeProject?.name : "Global Task Matrix"}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  {workplaceProjectId ? activeProject?.description : "Aggregate management of organizational deliverables and timelines."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 text-xs font-semibold gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintPDF} className="h-8 text-xs font-semibold gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Print Summary
                </Button>
                <Button size="sm" onClick={() => setIsTaskOpen(true)} className="h-8 text-xs font-semibold gap-1.5 bg-primary">
                  <Plus className="w-3.5 h-3.5" /> Create Task
                </Button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl print:hidden w-full min-w-0">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-[180px]">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setParam("search", e.target.value)}
                    className="pl-8 text-xs h-9 bg-transparent"
                  />
                </div>
                <Select value={selectedAssigneeId} onValueChange={(val) => setParam("assignee", val)}>
                  <SelectTrigger className="w-full sm:w-[140px] text-xs h-9">
                    <SelectValue placeholder="All Assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.fullNameEnglish}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedPriority} onValueChange={(val) => setParam("priority", val)}>
                  <SelectTrigger className="w-full sm:w-[120px] text-xs h-9">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Modes Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/85 p-1 rounded-xl self-end md:self-auto shrink-0">
                <button
                  onClick={() => setParam("tab", "board")}
                  className={cn("p-1.5 rounded-lg text-xs font-semibold transition-all", tab === "board" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500")}
                  title="Board View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setParam("tab", "list")}
                  className={cn("p-1.5 rounded-lg text-xs font-semibold transition-all", tab === "list" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500")}
                  title="List Table"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setParam("tab", "workload")}
                  className={cn("p-1.5 rounded-lg text-xs font-semibold transition-all", tab === "workload" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500")}
                  title="Workload Chart"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                {workplaceProjectId && (
                  <>
                    <button
                      onClick={() => setParam("tab", "calendar")}
                      className={cn("p-1.5 rounded-lg text-xs font-semibold transition-all", tab === "calendar" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500")}
                      title="Project Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setParam("tab", "settings")}
                      className={cn("p-1.5 rounded-lg text-xs font-semibold transition-all", tab === "settings" ? "bg-white dark:bg-slate-900 shadow-sm text-primary" : "text-slate-500")}
                      title="Workspace Configuration"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* TAB CONTENT 1: Board View */}
            {tab === "board" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 justify-end text-xs text-slate-500 print:hidden">
                  <span>Group Swimlanes:</span>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1"
                  >
                    <option value="none">None</option>
                    <option value="assignee">Assignee swimlane</option>
                    <option value="priority">Priority swimlane</option>
                  </select>
                  <span>Sort cards:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1"
                  >
                    <option value="created">Created date</option>
                    <option value="due">Due date</option>
                    <option value="priority">Priority</option>
                    <option value="title">Title</option>
                  </select>
                </div>
                <TaskBoard
                  tasks={tasks}
                  projects={projects}
                  employees={employees}
                  onTaskClick={(t) => setSelectedTaskId(t.id)}
                  onStatusChange={handleStatusChange}
                  onQuickAdd={handleQuickAdd}
                  groupBy={groupBy}
                  sortBy={sortBy}
                />
              </div>
            )}

            {/* TAB CONTENT 2: List View */}
            {tab === "list" && (
              <TaskListView
                tasks={tasks}
                employees={employees}
                onTaskClick={(t) => setSelectedTaskId(t.id)}
                onUpdateTask={(id, data) => updateTaskMut.mutate({ id, data })}
                onDeleteTask={(id) => deleteTaskMut.mutate(id)}
                onBulkUpdateStatus={(ids, status) => {
                  ids.forEach(id => updateTaskMut.mutate({ id, data: { status } }));
                  toast.success(`Updated ${ids.length} tasks`);
                }}
                onBulkDelete={(ids) => {
                  ids.forEach(id => deleteTaskMut.mutate(id));
                  toast.success(`Deleted ${ids.length} tasks`);
                }}
              />
            )}

            {/* TAB CONTENT 3: Workload Analytics */}
            {tab === "workload" && (
              <TaskWorkloadView
                tasks={tasks}
                employees={employees}
              />
            )}

            {/* TAB CONTENT 4: Workplace Project Calendar */}
            {tab === "calendar" && workplaceProjectId && (
              <Card className="p-4 bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Month Schedule Calendar</h3>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>Prev</Button>
                    <span className="text-xs font-semibold px-4">{format(calendarDate, "MMMM yyyy")}</span>
                    <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>Next</Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((day, idx) => {
                    const dayTasks = tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day));
                    return (
                      <div key={idx} className="min-h-[90px] p-2 border border-slate-200/40 dark:border-slate-800/40 bg-white/20 rounded-xl flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-500">{format(day, "d")}</span>
                        <div className="flex flex-col gap-1 mt-1">
                          {dayTasks.map(t => (
                            <div key={t.id} onClick={() => setSelectedTaskId(t.id)} className="text-[10px] truncate bg-primary/10 text-primary border border-primary/20 p-1 rounded cursor-pointer font-medium hover:bg-primary/20">
                              {t.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* TAB CONTENT 5: Workspace Project Settings (Milestones, Members, Webhooks) */}
            {tab === "settings" && workplaceProjectId && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-5 bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md space-y-4">
                  <h3 className="font-semibold text-sm">Project Details Configuration</h3>
                  <div className="grid gap-3 text-xs">
                    <div className="grid gap-1">
                      <label className="font-semibold text-slate-500">Project Name</label>
                      <Input value={projName} onChange={(e) => setProjName(e.target.value)} className="h-9 bg-transparent" />
                    </div>
                    <div className="grid gap-1">
                      <label className="font-semibold text-slate-500">Description</label>
                      <Input value={projDesc} onChange={(e) => setProjDesc(e.target.value)} className="h-9 bg-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <label className="font-semibold text-slate-500">Project Lead</label>
                        <Select value={projLead} onValueChange={setProjLead}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.fullNameEnglish}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <label className="font-semibold text-slate-500">Slack/Teams Incoming Webhook</label>
                        <Input value={projWebhook} onChange={(e) => setProjWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/..." className="h-9 bg-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-between pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleArchiveProjectToggle} className={cn("text-xs", activeProject?.archived ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/25" : "text-amber-500 bg-amber-500/10 hover:bg-amber-500/25")}>
                        {activeProject?.archived ? "Restore Project" : "Archive Project Workspace"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-rose-500 bg-rose-500/10 hover:bg-rose-500/25"
                        onClick={() => {
                          if (!workplaceProjectId) return;
                          Swal.fire({
                            title: "Delete Project Workspace?",
                            text: "Permanently delete this project workspace and all its tasks? This cannot be undone.",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Yes, Delete",
                            cancelButtonText: "Cancel",
                            buttonsStyling: false,
                            customClass: {
                              confirmButton: "swal2-confirm swal2-styled bg-destructive hover:bg-destructive/90 text-white font-semibold rounded-md px-4 py-2 mr-2",
                              cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
                            }
                          }).then((res) => {
                            if (res.isConfirmed) {
                              deleteProjectMut.mutate(workplaceProjectId, {
                                onSuccess: () => {
                                  toast.success("Project deleted");
                                  setWorkplaceProjectId(null);
                                  setParam("project", "all");
                                },
                                onError: (err) => toast.error(err.message || "Failed to delete project"),
                              });
                            }
                          });
                        }}
                      >
                        Delete Project
                      </Button>
                    </div>
                    <Button size="sm" onClick={handleUpdateProjectSettings} className="text-xs bg-primary">
                      Save Workplace Settings
                    </Button>
                  </div>
                </Card>

                {/* Workspace Contributors Checklist */}
                <Card className="p-5 bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md space-y-4">
                  <h3 className="font-semibold text-sm">Assign Workspace Contributors</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {employees.map((emp) => {
                      const isMember = projMembers.includes(emp.id);
                      return (
                        <div key={emp.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0 border-slate-100 dark:border-slate-800/50">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{emp.fullNameEnglish}</span>
                          <Checkbox
                            checked={isMember}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setProjMembers([...projMembers, emp.id]);
                              } else {
                                setProjMembers(projMembers.filter(id => id !== emp.id));
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog Modals */}
      <ProjectCreateDialog
        isOpen={isProjectOpen}
        onClose={() => setIsProjectOpen(false)}
        onSubmit={handleCreateProject}
        isPending={createProjectMut.isPending}
      />

      <TaskCreateDialog
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        onSubmit={handleCreateTask}
        isPending={createTaskMut.isPending}
      />

      <TaskDetailsSheet
        taskId={selectedTaskId || ""}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}
