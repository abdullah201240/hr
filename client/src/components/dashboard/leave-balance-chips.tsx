import { Badge } from "@/components/ui/badge"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LeaveBalance } from "./types"

interface LeaveBalanceChipsProps {
  balances: LeaveBalance[]
}

export function LeaveBalanceChips({ balances }: LeaveBalanceChipsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Leave Balance</p>
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
          {balances.reduce((acc, b) => acc + (b.total - b.used), 0)} / {balances.reduce((acc, b) => acc + b.total, 0)} days left
        </Badge>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {balances.map(b => {
          const Icon = b.icon as any
          const remaining = b.total - b.used
          return (
            <div
              key={b.key}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("leaveType", b.key)
                e.dataTransfer.effectAllowed = "copy"
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold cursor-grab active:cursor-grabbing border border-border/40 bg-background hover:bg-muted/30 transition-colors select-none"
            >
              <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <Icon className={cn("h-4 w-4 shrink-0", b.light)} />
              <span className="truncate">{b.label.replace(" Leave", "")}</span>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 py-0 font-bold ml-auto shrink-0">
                {remaining}/{b.total}
              </Badge>
            </div>
          )
        })}
      </div>
      <p className="text-[9px] text-muted-foreground/50 italic">Drag a leave type onto a calendar date to apply</p>
    </div>
  )
}
