import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, CalendarOff, X, Pencil, ToggleRight, ToggleLeft } from "lucide-react"
import type { LeaveType } from "@/types"
import { cn } from "@/lib/utils"

interface LeaveTypesListProps {
  leaveTypes: LeaveType[]
  onEdit: (leave: LeaveType) => void
  onToggleActive: (leave: LeaveType) => void
}

export function LeaveTypesList({ leaveTypes, onEdit, onToggleActive }: LeaveTypesListProps) {
  return (
    <div className="w-full overflow-x-auto bg-transparent">
      <Table>
        <TableHeader className="bg-muted/10 border-b border-border/30">
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="font-semibold text-xs text-muted-foreground">Leave Type</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Description</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground">Days</TableHead>
            <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Active</TableHead>
            <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Policy</TableHead>
            <TableHead className="w-24 font-semibold text-xs text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveTypes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center border-b-0">
                <div className="flex flex-col items-center justify-center">
                  <CalendarOff className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No leave types configured yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Leave Type" to get started.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leaveTypes.map((leave) => {
              return (
                <TableRow key={leave.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                  {/* Leave Type with Icon */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      
                      <div>
                        <p className="font-semibold text-sm">{leave.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="secondary" className="text-[10px] h-5">{leave.days} days/year</Badge>
                          <Badge className={`text-[10px] h-5 ${leave.paid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                            {leave.paid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground py-3 max-w-xs">
                    <p className="truncate">{leave.description}</p>
                  </TableCell>

                  {/* Days Allocation */}
                  <TableCell className="py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{leave.days}</p>
                      <p className="text-[10px] text-muted-foreground">days/year</p>
                    </div>
                  </TableCell>

                  {/* Active/Inactive Toggle */}
                  <TableCell className="hidden lg:table-cell py-3">
                    <Badge
                      variant={leave.isActive ? "default" : "outline"}
                      className={cn(
                        "text-[10px] h-5 gap-1",
                        leave.isActive
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "text-muted-foreground border-border/40"
                      )}
                    >
                      {leave.isActive ? (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Active
                        </>
                      ) : (
                        <>
                          <X className="h-2.5 w-2.5" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </TableCell>

                  {/* Policy Details */}
                  <TableCell className="hidden lg:table-cell py-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        {leave.paid ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span>Paid Leave</span>
                          </>
                        ) : (
                          <>
                            <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
                            <span className="line-through opacity-50">Unpaid Leave</span>
                          </>
                        )}
                      </div>
                      {leave.requiresApproval ? (
                        <div className="flex items-center gap-1 text-[11px] text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>Approval Required</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Auto-Approved</span>
                        </div>
                      )}
                      {leave.requiresDocument && (
                        <div className="flex items-center gap-1 text-[11px] text-sky-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>Document Needed</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-muted"
                        onClick={() => onEdit(leave)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${
                          leave.isActive
                            ? "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                            : "text-muted-foreground/40 hover:bg-muted"
                        }`}
                        onClick={() => onToggleActive(leave)}
                      >
                        {leave.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
