import { Card, CardContent } from "@/components/ui/card"
import { CalendarOff, CalendarDays, ArrowRight } from "lucide-react"

interface LeaveType {
  id: string
  name: string
  icon: any
  color: string
  days: number
  paid: boolean
  carryForward: boolean
  maxCarryOver: number
  requiresApproval: boolean
  requiresDocument: boolean
  description: string
}

interface LeaveSummaryCardsProps {
  leaveTypes: LeaveType[]
}

export function LeaveSummaryCards({ leaveTypes }: LeaveSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="shadow-none border-border/40 p-4">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Types</p>
              <p className="text-2xl font-bold mt-1">{leaveTypes.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <CalendarOff className="h-5 w-5 text-sky-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-none border-border/40 p-4">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Days</p>
              <p className="text-2xl font-bold mt-1">{leaveTypes.reduce((sum, l) => sum + l.days, 0)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-none border-border/40 p-4">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Carry Forward</p>
              <p className="text-2xl font-bold mt-1">{leaveTypes.filter(l => l.carryForward).length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-violet-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
