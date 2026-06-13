import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-sky-500" /> Total Types
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{leaveTypes.length}</CardContent>
      </Card>
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-emerald-500" /> Total Days
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{leaveTypes.reduce((sum, l) => sum + l.days, 0)}</CardContent>
      </Card>
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-violet-500" /> Carry Forward
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{leaveTypes.filter(l => l.carryForward).length}</CardContent>
      </Card>
    </div>
  )
}
