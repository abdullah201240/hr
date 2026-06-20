import { useState } from "react";
import type { Task } from "@/hooks/useTasks";
import { format, parseISO } from "date-fns";
import {
  ArrowUpDown,
  Trash2,
  Edit2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";

interface TaskListViewProps {
  tasks: Task[];
  employees: any[];
  onTaskClick: (task: Task) => void;
  onUpdateTask: (taskId: string, data: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onBulkUpdateStatus?: (taskIds: string[], status: Task["status"]) => void;
  onBulkDelete?: (taskIds: string[]) => void;
}

export default function TaskListView({
  tasks,
  employees,
  onTaskClick,
  onUpdateTask,
  onDeleteTask,
  onBulkUpdateStatus,
  onBulkDelete,
}: TaskListViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof Task>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting logic
  const handleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === null || valA === undefined) return sortOrder === "asc" ? 1 : -1;
    if (valB === null || valB === undefined) return sortOrder === "asc" ? -1 : 1;

    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === "number" && typeof valB === "number") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedTasks.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedTasks = sortedTasks.slice(startIdx, startIdx + pageSize);

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedTasks.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, taskId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== taskId));
    }
  };

  const triggerBulkStatus = (status: Task["status"]) => {
    if (onBulkUpdateStatus && selectedIds.length > 0) {
      onBulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
    }
  };

  const triggerBulkDelete = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      Swal.fire({
        title: "Delete Selected Tasks?",
        text: `Are you sure you want to delete ${selectedIds.length} tasks?`,
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
          onBulkDelete(selectedIds);
          setSelectedIds([]);
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-primary/10 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-xs font-semibold text-primary">
            {selectedIds.length} tasks selected
          </span>
          <div className="flex items-center gap-2">
            <select
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
              onChange={(e) => triggerBulkStatus(e.target.value as Task["status"])}
              defaultValue=""
            >
              <option value="" disabled>Change Status...</option>
              <option value="Backlog">Backlog</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button
              onClick={triggerBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500/30 transition-colors text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="relative overflow-x-auto border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md max-h-[600px]">
        <table className="w-full text-left border-collapse text-slate-700 dark:text-slate-300">
          <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 z-10 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="p-4 w-12 text-center">
                <Checkbox
                  checked={selectedIds.length === paginatedTasks.length && paginatedTasks.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100" onClick={() => handleSort("title")}>
                <div className="flex items-center gap-1">
                  Title <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100" onClick={() => handleSort("priority")}>
                <div className="flex items-center gap-1">
                  Priority <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100" onClick={() => handleSort("dueDate")}>
                <div className="flex items-center gap-1">
                  Due Date <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100" onClick={() => handleSort("assigneeId")}>
                <div className="flex items-center gap-1">
                  Assignee <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100" onClick={() => handleSort("progress")}>
                <div className="flex items-center gap-1">
                  Progress <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100" onClick={() => handleSort("approvalStatus")}>
                <div className="flex items-center gap-1">
                  Review <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-4 text-center">Hours</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {paginatedTasks.length > 0 ? (
              paginatedTasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all duration-150"
                >
                  <td className="p-4 text-center">
                    <Checkbox
                      checked={selectedIds.includes(task.id)}
                      onCheckedChange={(checked) => handleSelectRow(task.id, !!checked)}
                    />
                  </td>
                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                    <button
                      onClick={() => onTaskClick(task)}
                      className="hover:underline text-left block"
                    >
                      {task.title}
                    </button>
                    {task.projectName && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        Project: {task.projectName}
                      </span>
                    )}
                  </td>
                  {/* Inline Status Edit */}
                  <td className="p-4">
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateTask(task.id, { status: e.target.value as Task["status"] })}
                      className="bg-slate-100 dark:bg-slate-800 text-[11px] font-medium py-1 px-2.5 rounded-lg border-0 outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Backlog">Backlog</option>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Done">Done</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  {/* Inline Priority Edit */}
                  <td className="p-4">
                    <select
                      value={task.priority}
                      onChange={(e) => onUpdateTask(task.id, { priority: e.target.value as Task["priority"] })}
                      className={cn(
                        "text-[11px] font-medium py-1 px-2.5 rounded-lg border-0 outline-none focus:ring-1 focus:ring-primary bg-slate-100 dark:bg-slate-800",
                        task.priority === "Urgent" && "text-rose-500 bg-rose-500/10",
                        task.priority === "High" && "text-orange-500 bg-orange-500/10",
                        task.priority === "Medium" && "text-blue-500 bg-blue-500/10",
                        task.priority === "Low" && "text-slate-400 bg-slate-500/10"
                      )}
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </td>
                  <td className="p-4 text-slate-500">
                    {task.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : "-"}
                  </td>
                  {/* Inline Assignee Edit */}
                  <td className="p-4">
                    <select
                      value={task.assigneeId || ""}
                      onChange={(e) => onUpdateTask(task.id, { assigneeId: e.target.value || null })}
                      className="bg-slate-100 dark:bg-slate-800 text-[11px] py-1 px-2.5 rounded-lg border-0 outline-none max-w-[140px] focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Unassigned</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullNameEnglish}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Progress bar cell */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 font-bold text-[10px] text-slate-600 dark:text-slate-400 text-right">{task.progress || 0}%</span>
                      <div className="w-12 bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div className="h-full bg-primary" style={{ width: `${task.progress || 0}%` }} />
                      </div>
                    </div>
                  </td>
                  {/* Approval outcome badge cell */}
                  <td className="p-4">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded uppercase border border-transparent",
                      task.approvalStatus === "Approved" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" :
                      task.approvalStatus === "Changes Requested" ? "bg-rose-500/10 text-rose-500 border-rose-500/10" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    )}>
                      {task.approvalStatus || "Pending"}
                    </span>
                  </td>
                  <td className="p-4 text-center font-medium text-slate-500">
                    {task.actualHours}h / {task.estimatedHours}h
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onTaskClick(task)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: "Delete Task?",
                            text: "Are you sure you want to delete this task?",
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
                              onDeleteTask(task.id);
                            }
                          });
                        }}
                        className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                  No tasks matched the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
