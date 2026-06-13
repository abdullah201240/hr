import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, AlertCircle, CheckCircle2, Trash2 } from "lucide-react"

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

interface LeaveTypesListProps {
  leaveTypes: LeaveType[]
  onEdit: (leave: LeaveType) => void
  onDelete: (id: string) => void
}

export function LeaveTypesList({ leaveTypes, onEdit, onDelete }: LeaveTypesListProps) {
  return (
    <Card className="shadow-none border-border/40">
      <CardHeader>
        <CardTitle>Configured Leave Types</CardTitle>
        <CardDescription>Manage all leave policies for your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaveTypes.map((leave) => {
            const Icon = leave.icon
            return (
              <div
                key={leave.id}
                className="flex items-center justify-between rounded-lg border border-border/40 p-4 hover:border-border/60 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Icon with color */}
                  <div className={`h-10 w-10 rounded-xl ${leave.color}/10 flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${leave.color.replace('bg-', 'text-')}`} />
                  </div>
                  
                  {/* Leave Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{leave.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{leave.days} days/year</Badge>
                      <Badge className={`text-[10px] ${leave.paid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {leave.paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{leave.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {leave.carryForward ? (
                          <>
                            <ArrowRight className="h-3 w-3" />
                            Carry: {leave.maxCarryOver} days
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                            No carry-forward
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        {leave.requiresApproval ? (
                          <>
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                            Approval required
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Auto-approved
                          </>
                        )}
                      </span>
                      {leave.requiresDocument && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-sky-500" />
                          Document needed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(leave)}
                    className="h-8 text-xs gap-1.5"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(leave.id)}
                    className="h-8 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
