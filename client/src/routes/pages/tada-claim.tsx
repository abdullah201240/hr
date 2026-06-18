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
  Car, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Coins,
  MapPin,
  Upload,
  Receipt,
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

const tadaClaimSchema = z.object({
  travelType: z.string().min(1, "Travel Type is required"),
  from: z.string().min(1, "Origin (From) is required"),
  to: z.string().min(1, "Destination (To) is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ message: "Amount must be a number" })
      .positive("Amount must be greater than 0")
  ),
  purpose: z.string().min(1, "Purpose of travel is required"),
}).refine((data: any) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate)
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"],
})

export default function TADAClaimPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === "admin" || user?.role === "hr"

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const { data, isLoading } = useClaimsQuery({
    claimType: "tada",
    search: searchTerm || undefined,
    status: filterStatus !== "all" ? (filterStatus as ClaimStatus) : undefined,
    limit: 100,
  })

  const claims = data?.data ?? []

  const [formData, setFormData] = useState({
    travelType: "",
    from: "",
    to: "",
    startDate: "",
    endDate: "",
    amount: "",
    purpose: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const createMutation = useCreateClaimMutation()
  const statusMutation = useUpdateClaimStatusMutation()

  const pendingClaims = claims.filter(c => c.status === "Pending").length
  const approvedClaims = claims.filter(c => c.status === "Approved").length
  const rejectedClaims = claims.filter(c => c.status === "Rejected").length
  const totalAmount = claims.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0)
  const approvedAmount = claims.filter(c => c.status === "Approved").reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = tadaClaimSchema.safeParse({
      travelType: formData.travelType,
      from: formData.from,
      to: formData.to,
      startDate: formData.startDate,
      endDate: formData.endDate,
      amount: formData.amount,
      purpose: formData.purpose,
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
        claimType: "tada",
        amount: parseFloat(formData.amount),
        description: formData.purpose,
        details: {
          travelType: formData.travelType,
          from: formData.from,
          to: formData.to,
          startDate: formData.startDate,
          endDate: formData.endDate,
          purpose: formData.purpose,
        },
      },
      {
        onSuccess: () => {
          toast.success("TA/DA claim submitted successfully")
          setFormData({ travelType: "", from: "", to: "", startDate: "", endDate: "", amount: "", purpose: "" })
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
            <Car className="h-6 w-6 text-blue-500" />
            TA/DA Claims
          </h2>
          <p className="text-muted-foreground">Travel allowance and daily allowance claims</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(val) => {
          setDialogOpen(val)
          if (!val) {
            setFormData({ travelType: "", from: "", to: "", startDate: "", endDate: "", amount: "", purpose: "" })
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
              <DialogTitle>Submit TA/DA Travel Claim</DialogTitle>
              <DialogDescription>
                Fill in the details for your travel and daily allowance claim
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="travelType" className="text-xs">Travel Type *</Label>
                  <Select value={formData.travelType} onValueChange={(value) => setFormData({ ...formData, travelType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Domestic Flight">Domestic Flight</SelectItem>
                      <SelectItem value="International Flight">International Flight</SelectItem>
                      <SelectItem value="Train">Train</SelectItem>
                      <SelectItem value="Bus">Bus</SelectItem>
                      <SelectItem value="Personal Vehicle">Personal Vehicle</SelectItem>
                      <SelectItem value="Taxi/Rideshare">Taxi/Rideshare</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.travelType && <p className="text-[10px] text-red-500">{errors.travelType}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs">Total Amount (৳) *</Label>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="from" className="text-xs">From *</Label>
                  <Input
                    id="from"
                    type="text"
                    placeholder="Departure city"
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  />
                  {errors.from && <p className="text-[10px] text-red-500">{errors.from}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="to" className="text-xs">To *</Label>
                  <Input
                    id="to"
                    type="text"
                    placeholder="Destination city"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  />
                  {errors.to && <p className="text-[10px] text-red-500">{errors.to}</p>}
                </div>
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
                <Label htmlFor="purpose" className="text-xs">Purpose of Travel *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe the purpose of your travel..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
                {errors.purpose && <p className="text-[10px] text-red-500">{errors.purpose}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Upload Travel Documents</Label>
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <Upload className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground font-medium">Drag & drop or click to browse</p>
                    <p className="text-[10px] text-muted-foreground/60">PDF, JPG, PNG up to 10MB (tickets, receipts, invoices)</p>
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
            placeholder="Search by employee, claim ID, or route..."
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
            <Car className="mx-auto h-10 w-10 mb-3 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">No travel claims found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try modifying your search or filter keywords</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border/30">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="font-semibold text-xs text-muted-foreground">Claim Info</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Travel Type</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Route</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Duration</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Amount</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="w-36 font-semibold text-xs text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => {
                const d = claim.details || {}
                return (
                <TableRow key={claim.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                  <TableCell className="py-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{claim.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Receipt className="h-3 w-3" /> {new Date(claim.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="font-semibold text-sm">{claim.employeeName}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="secondary" className="text-[10px] font-bold tracking-wide uppercase">
                      {d.travelType || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{d.from || "?"} → {d.to || "?"}</span>
                    </div>
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
                  <TableCell className="py-3 font-bold text-sm">
                    ৳{parseFloat(claim.amount || "0").toLocaleString()}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      className={claim.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : claim.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10" : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"}
                    >
                      {claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {isAdmin && claim.status === "Pending" ? (
                      <div className="inline-flex gap-2 justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                          disabled={statusMutation.isPending}
                          onClick={() => handleStatusChange(claim.id, "Approved")}
                        >
                          Approve
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
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {claim.status === "Pending" && !isAdmin ? "Pending Review" : "Processed"}
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
