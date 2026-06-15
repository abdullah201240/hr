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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertCircle, CheckCircle2, Trash2, MoreHorizontal, Edit2, CalendarOff } from "lucide-react"
import type { LeaveType } from "@/types"

interface LeaveTypesListProps {
  leaveTypes: LeaveType[]
  onEdit: (leave: LeaveType) => void
  onDelete: (id: string) => void
}

export function LeaveTypesList({ leaveTypes, onEdit, onDelete }: LeaveTypesListProps) {
  return (
    <div className="w-full overflow-x-auto bg-transparent">
      <Table>
        <TableHeader className="bg-muted/10 border-b border-border/30">
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="font-semibold text-xs text-muted-foreground">Leave Type</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Description</TableHead>
            <TableHead className="font-semibold text-xs text-muted-foreground">Days</TableHead>
            <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Status</TableHead>
            <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Policy</TableHead>
            <TableHead className="w-12 font-semibold text-xs text-muted-foreground" />
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

                  {/* Status Badges */}
                  <TableCell className="hidden lg:table-cell py-3">
                    <div className="space-y-1.5">
                      {leave.requiresApproval ? (
                        <Badge variant="outline" className="text-[10px] h-5 gap-1 border-amber-500/30 text-amber-600">
                          <AlertCircle className="h-2.5 w-2.5" />
                          Approval Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-5 gap-1 border-emerald-500/30 text-emerald-600">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Auto-Approved
                        </Badge>
                      )}
                      {leave.requiresDocument && (
                        <div>
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                            <AlertCircle className="h-2.5 w-2.5 text-sky-500" />
                            Document Needed
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Policy Details */}
                  <TableCell className="hidden lg:table-cell py-3">
                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1">
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
                    </div>
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => onEdit(leave)}>
                          <Edit2 className="mr-2 h-3.5 w-3.5" />
                          Edit Leave Type
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          variant="destructive"
                          onClick={() => onDelete(leave.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
