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
  HeartPulse, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Upload
} from "lucide-react"

interface MedicalClaim {
  id: string
  employee: string
  type: string
  amount: number
  date: string
  status: "Pending" | "Approved" | "Rejected"
  description: string
}

const initialClaims: MedicalClaim[] = [
  {
    id: "MED-001",
    employee: "Sarah Mitchell",
    type: "Health Checkup",
    amount: 250,
    date: "2026-06-10",
    status: "Pending",
    description: "Annual health screening and blood tests"
  },
  {
    id: "MED-002",
    employee: "David Kim",
    type: "Dental Treatment",
    amount: 450,
    date: "2026-06-08",
    status: "Approved",
    description: "Root canal treatment and crown"
  },
  {
    id: "MED-003",
    employee: "Emily Zhang",
    type: "Medical Test",
    amount: 180,
    date: "2026-06-12",
    status: "Pending",
    description: "MRI scan and consultation"
  },
  {
    id: "MED-004",
    employee: "Marcus Brown",
    type: "Prescription",
    amount: 95,
    date: "2026-06-05",
    status: "Approved",
    description: "Monthly prescription medications"
  },
  {
    id: "MED-005",
    employee: "Lisa Johnson",
    type: "Vision Care",
    amount: 320,
    date: "2026-06-01",
    status: "Rejected",
    description: "New prescription glasses"
  },
]

export default function MedicalReimbursementPage() {
  const [claims, setClaims] = useState<MedicalClaim[]>(initialClaims)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    date: "",
    description: "",
  })

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.type.toLowerCase().includes(searchTerm.toLowerCase())
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
    const newClaim: MedicalClaim = {
      id: `MED-${String(claims.length + 1).padStart(3, '0')}`,
      employee: "Current User",
      type: formData.type,
      amount: parseFloat(formData.amount),
      date: formData.date,
      status: "Pending",
      description: formData.description,
    }
    setClaims([newClaim, ...claims])
    setFormData({ type: "", amount: "", date: "", description: "" })
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
            <HeartPulse className="h-6 w-6 text-rose-500" />
            Medical Reimbursement
          </h2>
          <p className="text-muted-foreground">Medical test and healthcare reimbursement claims</p>
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
              <DialogTitle>Submit Medical Reimbursement Claim</DialogTitle>
              <DialogDescription>
                Fill in the details for your medical reimbursement request
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Medical Type *</Label>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($) *</Label>
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
              <div className="space-y-2">
                <Label htmlFor="date">Date of Service *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about the medical service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Medical Documents</Label>
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
                  <div className="flex-1">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      PDF, JPG, PNG up to 10MB
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
          <CardTitle>Medical Claims</CardTitle>
          <CardDescription>Track and manage medical reimbursement requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by employee, claim ID, or type..."
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
                    <Badge variant="secondary" className="text-[10px]">{claim.type}</Badge>
                  </div>
                  <p className="text-sm font-medium">{claim.employee}</p>
                  <p className="text-xs text-muted-foreground">{claim.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(claim.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Documents attached
                    </span>
                  </div>
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
              <HeartPulse className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No medical claims found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
