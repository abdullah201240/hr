import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface TaskChecklistProps {
  checklist: ChecklistItem[] | null;
  onAddItem: (title: string) => void;
  onToggleItem: (itemId: string, completed: boolean) => void;
  onDeleteItem: (itemId: string) => void;
}

export const TaskChecklist: React.FC<TaskChecklistProps> = ({
  checklist,
  onAddItem,
  onToggleItem,
  onDeleteItem,
}) => {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddItem(newTitle);
    setNewTitle("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Add checklist subtask item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="h-8 text-xs flex-1 bg-transparent"
        />
        <Button type="submit" size="sm" className="h-8 gap-1 text-xs bg-primary">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </form>

      <div className="space-y-1 bg-slate-50/10 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
        {checklist && checklist.length > 0 ? (
          checklist.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between py-1.5 px-2 hover:bg-slate-100/35 dark:hover:bg-slate-800/20 rounded transition-colors"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Checkbox
                  id={item.id}
                  checked={item.isCompleted}
                  onCheckedChange={(checked) => onToggleItem(item.id, !!checked)}
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
                onClick={() => onDeleteItem(item.id)}
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
  );
};
