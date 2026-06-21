import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Dependency {
  id: string;
  dependsOnTaskId: string;
  dependsOnTaskTitle: string;
  dependsOnTaskStatus: string;
}

interface MiniTask {
  id: string;
  title: string;
  status: string;
}

interface TaskDependenciesProps {
  taskId: string;
  dependencies: Dependency[] | null;
  allTasks: MiniTask[];
  onAddDependency: (targetTaskId: string) => void;
  onDeleteDependency: (dependencyId: string) => void;
}

export const TaskDependencies: React.FC<TaskDependenciesProps> = ({
  taskId,
  dependencies,
  allTasks,
  onAddDependency,
  onDeleteDependency,
}) => {
  const [targetId, setTargetId] = useState("");

  const handleLink = () => {
    if (!targetId) return;
    onAddDependency(targetId);
    setTargetId("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs flex-1 focus:outline-none"
        >
          <option value="">Link blocking task...</option>
          {allTasks
            .filter((t) => t.id !== taskId)
            .map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
            ))}
        </select>
        <Button onClick={handleLink} size="sm" className="h-8 bg-primary">Link</Button>
      </div>

      <div className="space-y-2">
        {dependencies && dependencies.length > 0 ? (
          dependencies.map((dep) => (
            <div key={dep.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Blocked By</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{dep.dependsOnTaskTitle}</span>
                <Badge className="text-[9px]">{dep.dependsOnTaskStatus}</Badge>
              </div>
              <button onClick={() => onDeleteDependency(dep.id)} className="text-slate-400 hover:text-rose-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-slate-400 italic">No linked task dependencies.</div>
        )}
      </div>
    </div>
  );
};
