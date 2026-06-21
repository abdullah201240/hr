import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";

interface TimeEntry {
  id: string;
  description: string;
  durationSeconds: number;
  employeeName?: string | null;
  startTime: string;
}

interface TaskTimeLogsProps {
  timeEntries: TimeEntry[] | null;
  onAddManualTime: (minutes: string, description: string) => void;
  onDeleteTimeEntry: (entryId: string) => void;
}

export const TaskTimeLogs: React.FC<TaskTimeLogsProps> = ({
  timeEntries,
  onAddManualTime,
  onDeleteTimeEntry,
}) => {
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");

  const handleLogTime = () => {
    if (!minutes || !minutes.trim()) return;
    onAddManualTime(minutes, description);
    setMinutes("");
    setDescription("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50/10 dark:bg-slate-900/10 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 space-y-3">
        <span className="font-semibold text-slate-700 dark:text-slate-350 block text-xs">Add Manual Time Log</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Duration (Minutes)</label>
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="h-8 bg-transparent"
              placeholder="e.g. 60"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 bg-transparent"
              placeholder="What did you work on?"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleLogTime} size="sm" className="h-8 bg-primary">Log Time</Button>
        </div>
      </div>

      <div className="space-y-2">
        {timeEntries && timeEntries.length > 0 ? (
          timeEntries.map((log) => (
            <div key={log.id} className="p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/5 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-350 block">{log.description}</span>
                <span className="text-[10px] text-slate-400">
                  Logged by {log.employeeName || "User"} • {format(parseISO(log.startTime), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary">{Math.round(log.durationSeconds / 60)} min</span>
                <button onClick={() => onDeleteTimeEntry(log.id)} className="text-slate-400 hover:text-rose-500">
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
  );
};
