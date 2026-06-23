import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, Trash2, AlertCircle, CheckCircle, Clock, XCircle, Loader2, 
  Edit, Download, ListChecks, Users, Calendar, DollarSign 
} from "lucide-react"
import Swal from "sweetalert2"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CrossMonthAdjustmentProps {
  employees: any[]
  salaries?: any[]
  selectedMonth: string
  cycleStatus?: string
  formatCurrency: (amount: number) => string
  onCreateAdjustment: (data: any) => void
  onDeleteAdjustment: (id: string) => void
  onApplyAdjustments: (monthKey: string) => void
  pendingAdjustments: any[]
  allAdjustments: any[]
  isCreating?: boolean
  isApplying?: boolean
}

export function CrossMonthAdjustments({
  employees,
  salaries = [],
  selectedMonth,
  cycleStatus = "Draft",
  formatCurrency,
  onCreateAdjustment,
  onDeleteAdjustment,
  onApplyAdjustments,
  pendingAdjustments,
  allAdjustments = [],
  isCreating = false,
  isApplying = false,
}: CrossMonthAdjustmentProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "applied" | "all">("pending")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [editingAdjustment, setEditingAdjustment] = useState<any>(null)
  
  // Form state
  const [employeeId, setEmployeeId] = useState("")
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [targetMonthKey, setTargetMonthKey] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"addition" | "deduction" | "partial_salary">("partial_salary")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  
  // Partial salary fields
  const [prorationMode, setProrationMode] = useState<"dayRange" | "dateRange" | "paidDays">("dayRange")
  const [startDay, setStartDay] = useState("1")
  const [endDay, setEndDay] = useState("15")
  const [paidDays, setPaidDays] = useState("15")

  const getDaysInMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number)
    if (!year || !month) return 30
    return new Date(year, month, 0).getDate()
  }

  const calculatePartialAmount = (basicSalary: number, monthKey: string) => {
    if (!monthKey || !basicSalary) return 0

    const daysInMonth = getDaysInMonth(monthKey)
    let calculatedPaidDays = 0

    if (prorationMode === "dayRange") {
      calculatedPaidDays = parseInt(endDay) - parseInt(startDay) + 1
    } else if (prorationMode === "paidDays") {
      calculatedPaidDays = parseInt(paidDays)
    }

    const unpaidDays = daysInMonth - calculatedPaidDays
    const deductionAmount = Math.round((basicSalary / daysInMonth) * unpaidDays)
    return deductionAmount
  }

  const validateForm = (): boolean => {
    if (isBulkMode) {
      if (selectedEmployees.length === 0) {
        toast.error("Please select at least one employee")
        return false
      }
    } else {
      if (!employeeId) {
        toast.error("Please select an employee")
        return false
      }
    }

    if (!targetMonthKey) {
      toast.error("Please select target month")
      return false
    }

    if (!reason || reason.trim().length < 5) {
      toast.error("Please provide a detailed reason (at least 5 characters)")
      return false
    }

    if (targetMonthKey > selectedMonth) {
      toast.error("Target month cannot be in the future")
      return false
    }

    // Check for duplicates
    const employeesToCheck = isBulkMode ? selectedEmployees : [employeeId]
    for (const empId of employeesToCheck) {
      const hasDuplicate = pendingAdjustments.some(
        (adj) => adj.employeeId === empId && adj.targetMonthKey === targetMonthKey && adj.status === "Pending"
      )
      if (hasDuplicate && !editingAdjustment) {
        const emp = employees.find(e => e.id === empId)
        toast.error(`Pending adjustment already exists for ${emp?.firstName} ${emp?.lastName}`)
        return false
      }
    }

    if (adjustmentType === "partial_salary") {
      if (prorationMode === "dayRange") {
        const start = parseInt(startDay)
        const end = parseInt(endDay)
        const daysInMonth = getDaysInMonth(targetMonthKey)
        
        if (isNaN(start) || isNaN(end) || start < 1 || end > daysInMonth || start > end) {
          toast.error(`Invalid day range. Month has ${daysInMonth} days`)
          return false
        }
      }
      
      if (prorationMode === "paidDays") {
        const days = parseInt(paidDays)
        const daysInMonth = getDaysInMonth(targetMonthKey)
        
        if (isNaN(days) || days < 0 || days > daysInMonth) {
          toast.error(`Invalid paid days. Month has ${daysInMonth} days`)
          return false
        }
      }
    } else {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        toast.error("Please enter a valid amount greater than 0")
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const employeesToProcess = isBulkMode ? selectedEmployees : [employeeId]
    const adjustments = []

    for (const empId of employeesToProcess) {
      const emp = employees.find(e => e.id === empId)
      const salaryRecord = salaries.find(s => s.employeeId === empId)
      const basicSalary = emp?.salary?.basicSalary || salaryRecord?.basicSalary || 0

      const finalAmount = adjustmentType === "partial_salary" 
        ? calculatePartialAmount(basicSalary, targetMonthKey) 
        : parseFloat(amount)

      const metadata = adjustmentType === "partial_salary" ? {
        prorationMode,
        startDay: prorationMode === "dayRange" ? parseInt(startDay) : undefined,
        endDay: prorationMode === "dayRange" ? parseInt(endDay) : undefined,
        paidDays: prorationMode === "paidDays" ? parseInt(paidDays) : undefined,
        totalDaysInMonth: getDaysInMonth(targetMonthKey),
        basicSalary,
      } : undefined

      adjustments.push({
        employeeId: empId,
        targetMonthKey,
        appliedMonthKey: selectedMonth,
        adjustmentType,
        amount: finalAmount,
        reason,
        metadata,
        id: editingAdjustment?.id,
      })
    }

    const totalAmount = adjustments.reduce((sum, adj) => sum + adj.amount, 0)
    const confirmationText = editingAdjustment
      ? `Update ${adjustments.length} adjustment(s)?\n\nTotal Amount: ${formatCurrency(totalAmount)}\nEmployees: ${employeesToProcess.length}\nMonth: ${targetMonthKey}`
      : `Create ${adjustments.length} adjustment(s)?\n\nTotal Amount: ${formatCurrency(totalAmount)}\nEmployees: ${employeesToProcess.length}\nTarget Month: ${targetMonthKey}`

    const result = await Swal.fire({
      title: editingAdjustment ? "Update Adjustments" : "Confirm Adjustments",
      text: confirmationText,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: editingAdjustment ? "Yes, Update All" : "Yes, Create All",
    })

    if (result.isConfirmed) {
      if (editingAdjustment) {
        // Update single adjustment
        onCreateAdjustment(adjustments[0])
      } else {
        // Create multiple adjustments
        adjustments.forEach(adj => onCreateAdjustment(adj))
      }
      resetForm()
      toast.success(`${adjustments.length} adjustment(s) ${editingAdjustment ? 'updated' : 'created'} successfully`)
    }
  }

  const resetForm = () => {
    setEmployeeId("")
    setSelectedEmployees([])
    setTargetMonthKey("")
    setAdjustmentType("partial_salary")
    setAmount("")
    setReason("")
    setProrationMode("dayRange")
    setStartDay("1")
    setEndDay("15")
    setPaidDays("15")
    setEditingAdjustment(null)
    setIsBulkMode(false)
    setIsDialogOpen(false)
  }

  const handleEdit = (adjustment: any) => {
    if (adjustment.status !== "Pending") {
      toast.error("Can only edit pending adjustments")
      return
    }

    setEditingAdjustment(adjustment)
    setEmployeeId(adjustment.employeeId)
    setTargetMonthKey(adjustment.targetMonthKey)
    setAdjustmentType(adjustment.adjustmentType)
    setAmount(adjustment.amount.toString())
    setReason(adjustment.reason)
    
    if (adjustment.metadata?.prorationMode) {
      setProrationMode(adjustment.metadata.prorationMode)
      setStartDay(adjustment.metadata.startDay?.toString() || "1")
      setEndDay(adjustment.metadata.endDay?.toString() || "15")
      setPaidDays(adjustment.metadata.paidDays?.toString() || "15")
    }
    
    setIsDialogOpen(true)
    toast.info("Editing adjustment - make changes and save")
  }

  const handleDelete = async (adjustment: any) => {
    if (adjustment.status !== "Pending") {
      toast.error("Can only delete pending adjustments")
      return
    }

    const result = await Swal.fire({
      title: "Delete Adjustment?",
      text: `Delete adjustment for ${formatCurrency(adjustment.amount)}? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
    })

    if (result.isConfirmed) {
      onDeleteAdjustment(adjustment.id)
      toast.success("Adjustment deleted")
    }
  }

  const handleApplyAll = async () => {
    if (pendingAdjustments.length === 0) {
      toast.error("No pending adjustments to apply")
      return
    }

    const result = await Swal.fire({
      title: "Apply All Pending Adjustments?",
      html: `
        <div class="text-left">
          <p><strong>${pendingAdjustments.length}</strong> adjustment(s) will be applied to <strong>${selectedMonth}</strong></p>
          <p><strong>Total Amount:</strong> ${formatCurrency(pendingAdjustments.reduce((sum, adj) => sum + adj.amount, 0))}</p>
          <p class="mt-2 text-sm text-gray-600">These adjustments will be added to the current month's payslips.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Apply All",
    })

    if (result.isConfirmed) {
      onApplyAdjustments(selectedMonth)
      toast.success("Adjustments applied successfully! Check payslips to see the changes.")
    }
  }

  const handleExport = () => {
    const dataToExport = activeTab === "pending" ? pendingAdjustments : allAdjustments
    
    const csvContent = [
      ["Employee", "Target Month", "Applied Month", "Type", "Amount", "Status", "Reason", "Created At"].join(","),
      ...dataToExport.map((adj: any) => [
        `${adj.employee?.firstName} ${adj.employee?.lastName}`,
        adj.targetMonthKey,
        adj.appliedMonthKey,
        adj.adjustmentType,
        adj.amount,
        adj.status,
        `"${adj.reason}"`,
        new Date(adj.createdAt).toLocaleDateString(),
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `adjustments-${activeTab}-${selectedMonth}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Report exported successfully")
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      Pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
      Applied: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
      Cancelled: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
    }
    const variant = variants[status as keyof typeof variants] || variants.Pending
    const Icon = variant.icon
    
    return (
      <Badge variant="outline" className={cn("gap-1", variant.color)}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const filteredAdjustments = allAdjustments.filter((adj: any) => {
    if (activeTab === "pending") return adj.status === "Pending"
    if (activeTab === "applied") return adj.status === "Applied"
    return true
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Cross-Month Salary Adjustments
            </CardTitle>
            <CardDescription>
              Adjust previous months' salaries in current payroll cycle
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isBulkMode ? "Bulk Create" : "Create Adjustment"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingAdjustments.length})
            </TabsTrigger>
            <TabsTrigger value="applied" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Applied
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              All
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredAdjustments.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Adjustments</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "pending" 
                    ? "No pending adjustments. Create one to get started."
                    : "No adjustments found."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Target Month</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdjustments.map((adj: any) => (
                    <TableRow key={adj.id}>
                      <TableCell className="font-medium">
                        {adj.employee?.firstName} {adj.employee?.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {adj.targetMonthKey}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {adj.adjustmentType === "partial_salary" ? "Partial" : adj.adjustmentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(adj.amount)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {adj.reason}
                      </TableCell>
                      <TableCell>{getStatusBadge(adj.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(adj.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {adj.status === "Pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(adj)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(adj)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {adj.status === "Applied" && (
                            <Badge variant="outline" className="text-green-600">
                              Applied to {adj.appliedMonthKey}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        {activeTab === "pending" && pendingAdjustments.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">
                  {pendingAdjustments.length} pending adjustment(s)
                </p>
                <p className="text-sm text-blue-700">
                  Total: {formatCurrency(pendingAdjustments.reduce((sum, adj) => sum + adj.amount, 0))}
                </p>
              </div>
              <Button 
                onClick={handleApplyAll} 
                disabled={isApplying || cycleStatus !== "Draft"}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApplying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {cycleStatus === "Draft" ? "Apply All to Current Month" : "Cycle Must Be Draft"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingAdjustment ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingAdjustment ? "Edit Adjustment" : isBulkMode ? "Bulk Create Adjustments" : "Create Salary Adjustment"}
            </DialogTitle>
            <DialogDescription>
              {editingAdjustment 
                ? "Modify the adjustment details below"
                : "Adjust previous month's salary in current payroll cycle"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Bulk Mode Toggle */}
            {!editingAdjustment && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="bulkMode"
                  checked={isBulkMode}
                  onCheckedChange={(checked) => setIsBulkMode(checked as boolean)}
                />
                <Label htmlFor="bulkMode" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Apply to multiple employees
                </Label>
              </div>
            )}

            {/* Employee Selection */}
            {isBulkMode && !editingAdjustment ? (
              <div className="space-y-2">
                <Label>Select Employees ({selectedEmployees.length} selected)</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {employees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedEmployees.includes(emp.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmployees([...selectedEmployees, emp.id])
                          } else {
                            setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id))
                          }
                        }}
                      />
                      <Label className="cursor-pointer flex-1">
                        {emp.firstName} {emp.lastName} - {emp.employeeId}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : !editingAdjustment ? (
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} - {emp.employeeId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* Target Month */}
            <div className="space-y-2">
              <Label>Target Month (Month to Adjust)</Label>
              <Input
                type="month"
                value={targetMonthKey}
                onChange={(e) => setTargetMonthKey(e.target.value)}
                max={selectedMonth}
              />
            </div>

            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial_salary">Partial Salary (Remaining Days)</SelectItem>
                  <SelectItem value="addition">Addition (Bonus, Arrears)</SelectItem>
                  <SelectItem value="deduction">Deduction (Advance, Penalty)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Partial Salary Options */}
            {adjustmentType === "partial_salary" && (
              <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Label>Proration Mode</Label>
                <Select value={prorationMode} onValueChange={(v) => setProrationMode(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dayRange">By Day Range (e.g., Day 1-15)</SelectItem>
                    <SelectItem value="paidDays">By Paid Days Count</SelectItem>
                  </SelectContent>
                </Select>

                {prorationMode === "dayRange" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start Day</Label>
                      <Input
                        type="number"
                        min="1"
                        max={targetMonthKey ? getDaysInMonth(targetMonthKey) : 31}
                        value={startDay}
                        onChange={(e) => setStartDay(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Day</Label>
                      <Input
                        type="number"
                        min="1"
                        max={targetMonthKey ? getDaysInMonth(targetMonthKey) : 31}
                        value={endDay}
                        onChange={(e) => setEndDay(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {prorationMode === "paidDays" && (
                  <div className="space-y-2">
                    <Label>Paid Days</Label>
                    <Input
                      type="number"
                      min="0"
                      max={targetMonthKey ? getDaysInMonth(targetMonthKey) : 31}
                      value={paidDays}
                      onChange={(e) => setPaidDays(e.target.value)}
                    />
                  </div>
                )}

                {/* Preview */}
                {employeeId && targetMonthKey && (
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm font-semibold mb-1">Preview:</p>
                    <p className="text-sm">
                      Deduction: {formatCurrency(calculatePartialAmount(
                        employees.find(e => e.id === employeeId)?.salary?.basicSalary || 0,
                        targetMonthKey
                      ))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Days in {targetMonthKey}: {getDaysInMonth(targetMonthKey)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Amount (for addition/deduction) */}
            {adjustmentType !== "partial_salary" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount (BDT)
                </Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Remaining salary payment for May 16-31"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingAdjustment ? "Update Adjustment" : "Create Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
