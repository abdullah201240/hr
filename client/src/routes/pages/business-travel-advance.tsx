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
  Plane, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  CircleDollarSign,
  Calendar,
  Briefcase,
  Upload,
  Clock
} from "lucide-react"

interface TravelAdvance {
  id: string
  employee: string
  destination: string
  purpose: string
  startDate: string
  endDate: string
  requestedAmount: number
  approvedAmount: number
  status: "Pending" | "Approved" | "Rejected" | "Settled"
  justification: string
}

const initialAdvances: TravelAdvance[] = [
  {
    id: "ADV-001",
    employee: "Sarah Mitchell",
    destination: "Boston, MA",
    purpose: "Client Presentation",
    startDate: "2026-06-15",
    endDate: "2026-06-17",
    requestedAmount: 2000,
    approvedAmount: 1800,
    status: "Approved",
    justification: "Annual contract renewal meeting with key client"
  },
  {
    id: "ADV-002",
    employee: "David Kim",
    destination: "Chicago, IL",
    purpose: "Vendor Negotiation",
    startDate: "2026-06-20",
    endDate: "2026-06-22",
    requestedAmount: 1500,
    approvedAmount: 0,
    status: "Pending",
    justification: "Quarterly vendor review and contract renegotiation"
  },
  {
    id: "ADV-003",
    employee: "Emily Zhang",
    destination: "Toronto, Canada",
    purpose: "International Conference",
    startDate: "2026-07-01",
    endDate: "2026-07-05",
    requestedAmount: 3500,
    approvedAmount: 3000,
    status: "Approved",
    justification: "Speaking at international tech conference"
  },
  {
    id: "ADV-004",
    employee: "Marcus Brown",
    destination: "Portland, OR",
    purpose: "Site Inspection",
    startDate: "2026-06-10",
    endDate: "2026-06-11",
    requestedAmount: 800,
    approvedAmount: 800,
    status: "Settled",
    justification: "New office location inspection and assessment"
  },
  {
    id: "ADV-005",
    employee: "Lisa Johnson",
    destination: "Washington, DC",
    purpose: "Training Program",
    startDate: "2026-06-25",
    endDate: "2026-06-28",
    requestedAmount: 1200,
    approvedAmount: 0,
    status: "Rejected",
    justification: "Professional development training attendance"
  },
]

export default function BusinessTravelAdvancePage() {
  const [advances, setAdvances] = useState<TravelAdvance[]>(initialAdvances)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const [formData, setFormData] = useState({
    destination: "",
    purpose: "",
    startDate: "",
    endDate: "",
    requestedAmount: "",
    justification: "",
  })

  const filteredAdvances = advances.filter(advance => {
    const matchesSearch = advance.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         advance.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         advance.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         advance.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || advance.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const pendingAdvances = advances.filter(a => a.status === "Pending").length
  const approvedAdvances = advances.filter(a => a.status === "Approved").length
  const settledAdvances = advances.filter(a => a.status === "Settled").length
  const totalRequested = advances.reduce((sum, a) => sum + a.requestedAmount, 0)
  const totalApproved = advances.filter(a => a.status === "Approved" || a.status === "Settled")
    .reduce((sum, a) => sum + a.approvedAmount, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newAdvance: TravelAdvance = {
      id: `ADV-${String(advances.length + 1).padStart(3, '0')}`,
      employee: "Current User",
      destination: formData.destination,
      purpose: formData.purpose,
      startDate: formData.startDate,
      endDate: formData.endDate,
      requestedAmount: parseFloat(formData.requestedAmount),
      approvedAmount: 0,
      status: "Pending",
      justification: formData.justification,
    }
    setAdvances([newAdvance, ...advances])
    setFormData({ destination: "", purpose: "", startDate: "", endDate: "", requestedAmount: "", justification: "" })
    setDialogOpen(false)
  }

  const handleStatusChange = (id: string, status: "Approved" | "Rejected", approvedAmount?: number) => {
    setAdvances(advances.map(advance => 
      advance.id === id ? { 
        ...advance, 
        status,
        approvedAmount: status === "Approved" ? (approvedAmount || advance.requestedAmount) : 0
      } : advance
    ))
  }

  const handleSettle = (id: string) => {
    setAdvances(advances.map(advance => 
      advance.id === id ? { ...advance, status: "Settled" } : advance
    ))
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="City, State/Country"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Travel *</Label>
                <Input
                  id="purpose"
                  type="text"
                  placeholder="e.g., Client Meeting, Conference"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                />
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
                <Label htmlFor="requestedAmount">Requested Amount ($) *</Label>
                <Input
                  id="requestedAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.requestedAmount}
                  onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="justification">Justification *</Label>
                <Textarea
                  id="justification"
                  placeholder="Provide detailed justification for the advance request..."
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Supporting Documents</Label>
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
                  <div className="flex-1">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      PDF, JPG, PNG up to 10MB (itinerary, invitation letters, etc.)
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-emerald-500" /> Total Requested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalRequested.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{advances.length} total requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAdvances}</div>
            <Progress value={(pendingAdvances / advances.length) * 100} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalApproved.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{approvedAdvances} approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" /> Settled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settledAdvances}</div>
            <p className="text-xs text-muted-foreground mt-1">{settledAdvances} settled</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Travel Advance Requests</CardTitle>
          <CardDescription>Track and manage business travel advance payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by employee, advance ID, or destination..."
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
                <SelectItem value="Settled">Settled</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredAdvances.map((advance) => (
              <div key={advance.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border p-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{advance.id}</span>
                    {advance.status === "Approved" && (
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                        Approved: ${advance.approvedAmount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{advance.employee}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    <span>{advance.purpose} - {advance.destination}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(advance.startDate).toLocaleDateString()} - {new Date(advance.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{advance.justification}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Requested</p>
                    <p className="text-lg font-bold">৳{advance.requestedAmount.toLocaleString()}</p>
                  </div>
                  {advance.status === "Pending" ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600"
                        onClick={() => handleStatusChange(advance.id, "Approved")}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => handleStatusChange(advance.id, "Rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : advance.status === "Approved" ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => handleSettle(advance.id)}
                    >
                      Mark Settled
                    </Button>
                  ) : (
                    <Badge
                      variant={advance.status === "Settled" ? "default" : "destructive"}
                      className={advance.status === "Settled" ? "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10" : ""}
                    >
                      {advance.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAdvances.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Plane className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No travel advance requests found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
