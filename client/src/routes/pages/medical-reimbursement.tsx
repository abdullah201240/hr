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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
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
  Upload
} from "lucide-react"
import { z } from "zod"

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
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

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
    setErrors({})
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
                  {errors.type && <p className="text-[10px] text-red-500">{errors.type}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (৳) *</Label>
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
              <div className="space-y-2">
                <Label htmlFor="date">Date of Service *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
                {errors.date && <p className="text-[10px] text-red-500">{errors.date}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about the medical service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                {errors.description && <p className="text-[10px] text-red-500">{errors.description}</p>}
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold mt-1">৳{totalAmount.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{claims.length} total claims</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Coins className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1">{pendingClaims}</p>
                <Progress value={(pendingClaims / claims.length) * 100} className="h-1 mt-1.5 w-16" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold mt-1">৳{approvedAmount.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{approvedClaims} claims</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold mt-1">{rejectedClaims}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{((rejectedClaims / claims.length) * 100).toFixed(1)}% rate</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
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

          <div className="w-full overflow-x-auto bg-transparent">
            {filteredClaims.length === 0 ? (
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
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <TableCell className="py-3">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{claim.id}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(claim.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-semibold text-sm">{claim.employee}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="secondary" className="text-[10px] font-bold tracking-wide uppercase">
                          {claim.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 max-w-xs truncate text-xs text-muted-foreground" title={claim.description}>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{claim.description}</span>
                          <Badge variant="outline" className="text-[9px] bg-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-500/20 shrink-0">
                            <FileText className="h-2.5 w-2.5 mr-0.5 inline" /> Docs
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-bold text-sm">
                        ৳{claim.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={claim.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : claim.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10" : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"}
                        >
                          {claim.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {claim.status === "Pending" ? (
                          <div className="inline-flex gap-2 justify-end">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                              onClick={() => handleStatusChange(claim.id, "Approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                              onClick={() => handleStatusChange(claim.id, "Rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Processed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
