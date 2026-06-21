import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  HeartPulse, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Coins,
  Calendar,
  FileText,
  Upload,
  Filter,
  Loader2
} from "lucide-react"
import { z } from "zod"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"
import {
  useClaimsQuery,
  useCreateClaimMutation,
  useUpdateClaimStatusMutation,
} from "@/hooks/useClaims"
import type { ClaimStatus } from "@/types"

const medicalClaimSchema = z.object({
  type: z.string().min(1, "Claim Type is required"),
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ message: "Amount must be a number" })
      .positive("Amount must be greater than 0")
  ),
  date: z.string().min(1, "Date of Service is required"),
  description: z.string().min(1, "Description is required"),
})

export default function MedicalReimbursementPage() {
  const user = useAuthStore((s) => s.user)
  const hasApprovePerm = user?.permissions?.includes("claims:approve") || !user?.customRoleId;

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const { data, isLoading } = useClaimsQuery({
    claimType: "medical_reimbursement",
    search: searchTerm || undefined,
    status: filterStatus !== "all" ? (filterStatus as ClaimStatus) : undefined,
    limit: 100,
  })

  const claims = data?.data ?? []

  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    date: "",
    description: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const createMutation = useCreateClaimMutation()
  const statusMutation = useUpdateClaimStatusMutation()

  const pendingClaims = claims.filter(c => c.status === "Pending" || c.status === "Pending_2nd").length
  const approvedClaims = claims.filter(c => c.status === "Approved").length
  const rejectedClaims = claims.filter(c => c.status === "Rejected").length
  const totalAmount = claims.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0)
  const approvedAmount = claims.filter(c => c.status === "Approved").reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = medicalClaimSchema.safeParse({
      type: formData.type,
      amount: formData.amount,
      date: formData.date,
      description: formData.description,
    })

    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {}
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    createMutation.mutate(
      {
        claimType: "medical_reimbursement",
        amount: parseFloat(formData.amount),
        description: formData.description,
        details: {
          type: formData.type,
          serviceDate: formData.date,
        },
      },
      {
        onSuccess: () => {
          toast.success("Claim submitted successfully")
          setFormData({ type: "", amount: "", date: "", description: "" })
          setErrors({})
          setDialogOpen(false)
        },
        onError: (err: any) => {
          toast.error("Failed to submit claim", {
            description: err?.message || "Please try again",
          })
        },
      }
    )
  }

  const handleStatusChange = (id: string, status: "Approved" | "Rejected") => {
    statusMutation.mutate(
      { id, payload: { status } },
      {
        onSuccess: () => {
          toast.success(`Claim ${status.toLowerCase()} successfully`)
        },
        onError: (err: any) => {
          toast.error(`Failed to ${status.toLowerCase()} claim`, {
            description: err?.message || "Please try again",
          })
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-rose-500" />
            Medical Reimbursement
          </h2>
          <p className="text-muted-foreground">Medical test and healthcare reimbursement claims</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(val) => {
          setDialogOpen(val)
          if (!val) {
            setFormData({ type: "", amount: "", date: "", description: "" })
            setErrors({})
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Claim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Medical Reimbursement Claim</DialogTitle>
              <DialogDescription>
                Fill in the details for your medical reimbursement request
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs">Medical Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Health Checkup">Health Checkup</SelectItem>
                      <SelectItem value="Medical Test">Medical Test</SelectItem>
                      <SelectItem value="Dental Treatment">Dental Treatment</SelectItem>
                      <SelectItem value="Vision Care">Vision Care</SelectItem>
                      <SelectItem value="Prescription">Prescription</SelectItem>
                      <SelectItem value="Hospitalization">Hospitalization</SelectItem>
                      <SelectItem value="Surgery">Surgery</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-[10px] text-red-500">{errors.type}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs">Amount (৳) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                  {errors.amount && <p className="text-[10px] text-red-500">{errors.amount}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">Date of Service *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
                {errors.date && <p className="text-[10px] text-red-500">{errors.date}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about the medical service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                {errors.description && <p className="text-[10px] text-red-500">{errors.description}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Upload Medical Documents</Label>
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <Upload className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground font-medium">Drag & drop or click to browse</p>
                    <p className="text-[10px] text-muted-foreground/60">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Claim
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Claims</span>
            <p className="text-3xl font-bold tracking-tight">৳{totalAmount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{claims.length} total claims</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Coins className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</span>
            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{pendingClaims}</p>
            <p className="text-[10px] text-muted-foreground">Awaiting review</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved</span>
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">৳{approvedAmount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{approvedClaims} claims approved</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rejected</span>
            <p className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">{rejectedClaims}</p>
            <p className="text-[10px] text-muted-foreground">{claims.length > 0 ? ((rejectedClaims / claims.length) * 100).toFixed(1) : "0.0"}% rejection rate</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by employee, claim ID, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 text-xs h-9 bg-transparent border-border/60">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              <SelectItem value="Pending" className="text-xs">Pending Only</SelectItem>
              <SelectItem value="Pending_2nd" className="text-xs">Awaiting 2nd Approval</SelectItem>
              <SelectItem value="Approved" className="text-xs">Approved Only</SelectItem>
              <SelectItem value="Rejected" className="text-xs">Rejected Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="w-full overflow-x-auto bg-transparent">
            {isLoading ? (
              <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/5">
                <Loader2 className="mx-auto h-8 w-8 mb-4 animate-spin text-muted-foreground" />
                <p className="text-sm font-semibold text-muted-foreground">Loading claims...</p>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/5">
                <HeartPulse className="mx-auto h-12 w-12 mb-4 opacity-20 text-muted-foreground" />
                <p className="text-sm font-semibold text-muted-foreground">No medical claims found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try modifying your search or filter keywords</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground">Claim Info</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Type</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Description</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Amount</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="w-36 font-semibold text-xs text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <TableCell className="py-3">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{claim.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {claim.details?.serviceDate
                              ? new Date(claim.details.serviceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : new Date(claim.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-semibold text-sm">{claim.employeeName}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="secondary" className="text-[10px] font-bold tracking-wide uppercase">
                          {claim.details?.type || "Medical"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 max-w-xs truncate text-xs text-muted-foreground" title={claim.description}>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{claim.description}</span>
                          {claim.attachments.length > 0 && (
                            <Badge variant="outline" className="text-[9px] bg-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-500/20 shrink-0">
                              <FileText className="h-2.5 w-2.5 mr-0.5 inline" /> Docs
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-bold text-sm">
                        ৳{parseFloat(claim.amount || "0").toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={
                            claim.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
                              : claim.status === "Pending"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10"
                              : claim.status === "Pending_2nd"
                              ? "bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/10"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"
                          }
                        >
                          {claim.status === "Pending_2nd" ? "Pending 2nd Step" : claim.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {(() => {
                          const isLineManager = claim.employeeLineManagerId === user?.id;
                          const isPending1st = claim.status === "Pending";
                          const isPending2nd = claim.status === "Pending_2nd";
                          const canAction = (isPending1st && (isLineManager || (!claim.employeeLineManagerId && hasApprovePerm))) ||
                                            (isPending2nd && hasApprovePerm);

                          if (canAction) {
                            return (
                              <div className="inline-flex gap-2 justify-end">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-8 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                                  disabled={statusMutation.isPending}
                                  onClick={() => handleStatusChange(claim.id, "Approved")}
                                >
                                  {isPending2nd ? "Approve (2nd)" : "Approve"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-semibold border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                                  disabled={statusMutation.isPending}
                                  onClick={() => handleStatusChange(claim.id, "Rejected")}
                                >
                                  Reject
                                </Button>
                              </div>
                            );
                          }

                          return (
                            <span className="text-xs text-muted-foreground italic">
                              {claim.status === "Pending" ? "Pending Line Manager" : claim.status === "Pending_2nd" ? "Pending Final Approval" : "Processed"}
                            </span>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
      </div>
    </div>
  )
}
