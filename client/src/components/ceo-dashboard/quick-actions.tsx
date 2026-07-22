import { useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CalendarOff,
  CalendarClock,
  Coins,
  Megaphone,
  Users,
  BarChart3,
  ArrowRight,
  Zap,
} from "lucide-react"

interface QuickAction {
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  href: string
}

const actions: QuickAction[] = [
  {
    title: "Leave Approvals",
    description: "Review pending applications",
    icon: CalendarOff,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    href: "/leave-applications",
  },
  {
    title: "Attendance Report",
    description: "View company attendance",
    icon: CalendarClock,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    href: "/attendance/company",
  },
  {
    title: "Payroll Management",
    description: "Process monthly payroll",
    icon: Coins,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/10",
    href: "/payroll",
  },
  {
    title: "Announcements",
    description: "Broadcast to all employees",
    icon: Megaphone,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10",
    href: "/announcements",
  },
  {
    title: "Employee Directory",
    description: "View all employees",
    icon: Users,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    href: "/employees",
  },
  {
    title: "Reports & Analytics",
    description: "Detailed HR reports",
    icon: BarChart3,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    href: "/reports",
  },
  {
    title: "Bonus MD Approvals",
    description: "Review pending bonus cycles",
    icon: Coins,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    href: "/payroll/md-approvals?tab=bonus",
  },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
            <p className="text-[10px] text-muted-foreground">Frequently used shortcuts</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.title}
                onClick={() => navigate(action.href)}
                className="flex items-center gap-3 rounded-xl border border-border/20 bg-muted/5 p-2.5 text-left hover:bg-muted/20 hover:border-border/40 transition-all group"
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${action.iconBg}`}>
                  <Icon className={`h-4 w-4 ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
