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
  Plane, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Coins,
  Briefcase,
  Upload,
  Clock,
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

const travelAdvanceSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  purpose: z.string().min(1, "Purpose of Travel is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  requestedAmount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ message: "Requested Amount must be a number" })
      .positive("Amount must be greater than 0")
  ),
  justification: z.string().min(1, "Justification is required"),
}).refine((data: any) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate)
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"],
})

export default function BusinessTravelAdvancePage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.permissions?.includes("claims:approve") || user?.permissions?.includes("claims:read")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const { data, isLoading } = useClaimsQuery({
    claimType: "travel_advance",
    search: searchTerm || undefined,
    status: filterStatus !== "all" ? (filterStatus as ClaimStatus) : undefined,
    limit: 100,
  })

  const advances = data?.data ?? []

  const [formData, setFormData] = useState({
    destination: "",
    purpose: "",
    startDate: "",
    endDate: "",
    requestedAmount: "",
    justification: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const createMutation = useCreateClaimMutation()
  const statusMutation = useUpdateClaimStatusMutation()

  const pendingAdvances = advances.filter(a => a.status === "Pending").length
  const approvedAdvances = advances.filter(a => a.status === "Approved").length
  const settledAdvances = advances.filter(a => a.status === "Settled").length
  const totalRequested = advances.reduce((sum, a) => sum + parseFloat(a.amount || "0"), 0)
  const totalApproved = advances
    .filter(a => a.status === "Approved" || a.status === "Settled")
    .reduce((sum, a) => sum + parseFloat(a.approvedAmount || a.amount || "0"), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = travelAdvanceSchema.safeParse({
      destination: formData.destination,
      purpose: formData.purpose,
      startDate: formData.startDate,
      endDate: formData.endDate,
      requestedAmount: formData.requestedAmount,
      justification: formData.justification,
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
        claimType: "travel_advance",
        amount: parseFloat(formData.requestedAmount),
        description: formData.justification,
        details: {
          destination: formData.destination,
          purpose: formData.purpose,
          startDate: formData.startDate,
          endDate: formData.endDate,
          justification: formData.justification,
        },
      },
      {
        onSuccess: () => {
          toast.success("Travel advance request submitted")
          setFormData({ destination: "", purpose: "", startDate: "", endDate: "", requestedAmount: "", justification: "" })
          setErrors({})
          setDialogOpen(false)
        },
        onError: (err: any) => {
          toast.error("Failed to submit request", {
            description: err?.message || "Please try again",
          })
        },
      }
    )
  }

  const handleStatusChange = (id: string, status: "Approved" | "Rejected" | "Settled", approvedAmount?: number) => {
    statusMutation.mutate(
      {
        id,
        payload: {
          status,
          ...(status === "Approved" && approvedAmount !== undefined ? { approvedAmount } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            status === "Settled"
              ? "Advance marked as settled"
              : `Advance ${status.toLowerCase()} successfully`
          )
        },
        onError: (err: any) => {
          toast.error(`Failed to update advance`, {
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
            <Plane className="h-6 w-6 text-indigo-500" />
            Business Travel Advance
          </h2>
          <p className="text-muted-foreground">Request and manage travel advance payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(val) => {
          setDialogOpen(val)
          if (!val) {
            setFormData({ destination: "", purpose: "", startDate: "", endDate: "", requestedAmount: "", justification: "" })
            setErrors({})
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Advance Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Travel Advance Request</DialogTitle>
              <DialogDescription>
                Request advance payment for upcoming business travel
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="destination" className="text-xs">Destination *</Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="City, State/Country"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                />
                {errors.destination && <p className="text-[10px] text-red-500">{errors.destination}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purpose" className="text-xs">Purpose of Travel *</Label>
                <Input
                  id="purpose"
                  type="text"
                  placeholder="e.g., Client Meeting, Conference"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
                {errors.purpose && <p className="text-[10px] text-red-500">{errors.purpose}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  {errors.startDate && <p className="text-[10px] text-red-500">{errors.startDate}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-xs">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                  {errors.endDate && <p className="text-[10px] text-red-500">{errors.endDate}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="requestedAmount" className="text-xs">Requested Amount (৳) *</Label>
                <Input
                  id="requestedAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.requestedAmount}
                  onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                />
                {errors.requestedAmount && <p className="text-[10px] text-red-500">{errors.requestedAmount}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="justification" className="text-xs">Justification *</Label>
                <Textarea
                  id="justification"
                  placeholder="Provide detailed justification for the advance request..."
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                />
                {errors.justification && <p className="text-[10px] text-red-500">{errors.justification}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Upload Supporting Documents</Label>
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <Upload className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground font-medium">Drag & drop or click to browse</p>
                    <p className="text-[10px] text-muted-foreground/60">PDF, JPG, PNG up to 10MB (itinerary, invitation letters, etc.)</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Requested</span>
            <p className="text-3xl font-bold tracking-tight">৳{totalRequested.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{advances.length} total requests</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Coins className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</span>
            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{pendingAdvances}</p>
            <p className="text-[10px] text-muted-foreground">Awaiting review</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved</span>
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">৳{totalApproved.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{approvedAdvances} approved</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settled</span>
            <p className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{settledAdvances}</p>
            <p className="text-[10px] text-muted-foreground">{settledAdvances} advances settled</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by employee, advance ID, or destination..."
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
              <SelectItem value="Approved" className="text-xs">Approved Only</SelectItem>
              <SelectItem value="Settled" className="text-xs">Settled Only</SelectItem>
              <SelectItem value="Rejected" className="text-xs">Rejected Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advance Requests Table */}
      <div className="w-full overflow-x-auto bg-transparent">
        {isLoading ? (
          <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/5">
            <Loader2 className="mx-auto h-8 w-8 mb-4 animate-spin text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">Loading advance requests...</p>
          </div>
        ) : advances.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/5">
            <Plane className="mx-auto h-10 w-10 mb-3 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">No travel advance requests found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try modifying your search or filter keywords</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border/30">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="font-semibold text-xs text-muted-foreground">Request Info</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Purpose</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Destination</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Duration</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Amount</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="w-40 font-semibold text-xs text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advances.map((advance) => {
                const d = advance.details || {}
                const approvedAmt = advance.approvedAmount ? parseFloat(advance.approvedAmount) : 0
                const requestedAmt = parseFloat(advance.amount || "0")
                return (
                <TableRow key={advance.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                  <TableCell className="py-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{advance.id.slice(0, 8)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="font-semibold text-sm">{advance.employeeName}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[140px]" title={d.purpose || advance.description}>{d.purpose || advance.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="secondary" className="text-[10px] font-bold tracking-wide">
                      {d.destination || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="text-xs">
                      <p className="font-medium text-primary">
                        {d.startDate
                          ? new Date(d.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : "—"}{" — "}
                        {d.endDate
                          ? new Date(d.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div>
                      <p className="font-bold text-sm">৳{requestedAmt.toLocaleString()}</p>
                      {approvedAmt > 0 && approvedAmt !== requestedAmt && (
                        <p className="text-[10px] text-muted-foreground">Approved: ৳{approvedAmt.toLocaleString()}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      className={advance.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : advance.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10" : advance.status === "Settled" ? "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10" : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"}
                    >
                      {advance.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {isAdmin && advance.status === "Pending" ? (
                      <div className="inline-flex gap-2 justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                          disabled={statusMutation.isPending}
                          onClick={() => handleStatusChange(advance.id, "Approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-semibold border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                          disabled={statusMutation.isPending}
                          onClick={() => handleStatusChange(advance.id, "Rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : isAdmin && advance.status === "Approved" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
                        disabled={statusMutation.isPending}
                        onClick={() => handleStatusChange(advance.id, "Settled")}
                      >
                        Mark Settled
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {!isAdmin && advance.status === "Pending" ? "Pending Review" : "Processed"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
