import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Progress } from "@/components/ui/progress"
import { 
  Car, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  MapPin,
  Upload,
  Receipt
} from "lucide-react"

interface TADAClaim {
  id: string
  employee: string
  travelType: string
  from: string
  to: string
  startDate: string
  endDate: string
  amount: number
  status: "Pending" | "Approved" | "Rejected"
  purpose: string
}

const initialClaims: TADAClaim[] = [
  {
    id: "TA-001",
    employee: "Sarah Mitchell",
    travelType: "Domestic Flight",
    from: "New York",
    to: "Boston",
    startDate: "2026-06-15",
    endDate: "2026-06-17",
    amount: 450,
    status: "Pending",
    purpose: "Client meeting and project presentation"
  },
  {
    id: "TA-002",
    employee: "David Kim",
    travelType: "Train",
    from: "Chicago",
    to: "Milwaukee",
    startDate: "2026-06-10",
    endDate: "2026-06-10",
    amount: 85,
    status: "Approved",
    purpose: "Vendor visit and contract negotiation"
  },
  {
    id: "TA-003",
    employee: "Emily Zhang",
    travelType: "International Flight",
    from: "San Francisco",
    to: "Toronto",
    startDate: "2026-06-20",
    endDate: "2026-06-25",
    amount: 1200,
    status: "Pending",
    purpose: "International conference and networking"
  },
  {
    id: "TA-004",
    employee: "Marcus Brown",
    travelType: "Personal Vehicle",
    from: "Seattle",
    to: "Portland",
    startDate: "2026-06-08",
    endDate: "2026-06-09",
    amount: 180,
    status: "Approved",
    purpose: "Site inspection and team coordination"
  },
  {
    id: "TA-005",
    employee: "Lisa Johnson",
    travelType: "Bus",
    from: "Washington DC",
    to: "Baltimore",
    startDate: "2026-06-05",
    endDate: "2026-06-05",
    amount: 45,
    status: "Rejected",
    purpose: "Training session attendance"
  },
]

export default function TADAClaimPage() {
  const [claims, setClaims] = useState<TADAClaim[]>(initialClaims)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const [formData, setFormData] = useState({
    travelType: "",
    from: "",
    to: "",
    startDate: "",
    endDate: "",
    amount: "",
    purpose: "",
  })

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.to.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || claim.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const pendingClaims = claims.filter(c => c.status === "Pending").length
  const approvedClaims = claims.filter(c => c.status === "Approved").length
  const rejectedClaims = claims.filter(c => c.status === "Rejected").length
  const totalAmount = claims.reduce((sum, c) => sum + c.amount, 0)
  const approvedAmount = claims.filter(c => c.status === "Approved").reduce((sum, c) => sum + c.amount, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newClaim: TADAClaim = {
      id: `TA-${String(claims.length + 1).padStart(3, '0')}`,
      employee: "Current User",
      travelType: formData.travelType,
      from: formData.from,
      to: formData.to,
      startDate: formData.startDate,
      endDate: formData.endDate,
      amount: parseFloat(formData.amount),
      status: "Pending",
      purpose: formData.purpose,
    }
    setClaims([newClaim, ...claims])
    setFormData({ travelType: "", from: "", to: "", startDate: "", endDate: "", amount: "", purpose: "" })
    setDialogOpen(false)
  }

  const handleStatusChange = (id: string, status: "Approved" | "Rejected") => {
    setClaims(claims.map(claim => 
      claim.id === id ? { ...claim, status } : claim
    ))
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="travelType">Travel Type *</Label>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Total Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from">From *</Label>
                  <Input
                    id="from"
                    type="text"
                    placeholder="Departure city"
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">To *</Label>
                  <Input
                    id="to"
                    type="text"
                    placeholder="Destination city"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Travel *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe the purpose of your travel..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Travel Documents</Label>
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
                  <div className="flex-1">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      PDF, JPG, PNG up to 10MB (tickets, receipts, invoices)
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Claim</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" /> Total Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{claims.length} total claims</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClaims}</div>
            <Progress value={(pendingClaims / claims.length) * 100} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${approvedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{approvedClaims} claims</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" /> Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedClaims}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((rejectedClaims / claims.length) * 100).toFixed(1)}% rejection rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Travel Claims</CardTitle>
          <CardDescription>Track and manage TA/DA reimbursement requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by employee, claim ID, or route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredClaims.map((claim) => (
              <div key={claim.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border p-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{claim.id}</span>
                    <Badge variant="secondary" className="text-[10px]">{claim.travelType}</Badge>
                  </div>
                  <p className="text-sm font-medium">{claim.employee}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{claim.from} → {claim.to}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(claim.startDate).toLocaleDateString()} - {new Date(claim.endDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      Documents attached
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{claim.purpose}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-lg font-bold">${claim.amount}</p>
                  </div>
                  {claim.status === "Pending" ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600"
                        onClick={() => handleStatusChange(claim.id, "Approved")}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => handleStatusChange(claim.id, "Rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant={claim.status === "Approved" ? "default" : "destructive"}
                      className={claim.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : ""}
                    >
                      {claim.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredClaims.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No travel claims found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
