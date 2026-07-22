import { useState } from "react"
import { toast } from "sonner"
import Swal from "sweetalert2"
import { usePermissions } from "@/hooks/usePermissions"
import { useAuthStore } from "@/store/useAuthStore"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import {
  useAssetsQuery,
  useAssetDetailsQuery,
  useCreateAssetMutation,
  useAllocateAssetMutation,
  useReturnAssetMutation,
  useUpdateAssetConditionMutation,
} from "@/hooks/useAssets"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Laptop,
  Cpu,
  History,
  AlertCircle,
} from "lucide-react"

export default function PayrollAssetsPage() {
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermissions()
  const isAdmin = hasAnyPermission(["employees:update", "payroll:process", "employees:read"])

  const [activeTab, setActiveTab] = useState(isAdmin ? "inventory" : "my-assets")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Modal Control States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isAllocateOpen, setIsAllocateOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isConditionOpen, setIsConditionOpen] = useState(false)

  // Selected asset ID for operations
  const [selectedAssetId, setSelectedAssetId] = useState("")

  // Form Fields: Register Device
  const [newTag, setNewTag] = useState("")
  const [newName, setNewName] = useState("")
  const [newSerial, setNewSerial] = useState("")
  const [newCategory, setNewCategory] = useState("Laptop")
  const [newModel, setNewModel] = useState("")
  const [newPurchaseDate, setNewPurchaseDate] = useState("")
  const [newCost, setNewCost] = useState("")
  const [newRemarks, setNewRemarks] = useState("")

  // Form Fields: Allocate Device
  const [allocateEmployeeId, setAllocateEmployeeId] = useState("")
  const [allocateDueDate, setAllocateDueDate] = useState("")
  const [allocateNotes, setAllocateNotes] = useState("")

  // Form Fields: Condition Update
  const [updateConditionValue, setUpdateConditionValue] = useState<"New" | "Good" | "Damaged" | "Lost">("Good")
  const [updateNotes, setUpdateNotes] = useState("")

  // API Queries
  const { data: assetsList, isLoading: isAssetsLoading } = useAssetsQuery(
    isAdmin ? undefined : { employeeId: user?.id }
  )
  const { data: selectedAsset, isLoading: isDetailsLoading } = useAssetDetailsQuery(selectedAssetId)
  const { data: employeesData } = useEmployeesQuery({ status: "active", limit: 100 })

  // API Mutations
  const createAssetMutation = useCreateAssetMutation()
  const allocateAssetMutation = useAllocateAssetMutation()
  const returnAssetMutation = useReturnAssetMutation()
  const updateConditionMutation = useUpdateAssetConditionMutation()

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }

  // Filter logic
  const filteredAssets = assetsList?.filter((asset) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      asset.name.toLowerCase().includes(q) ||
      asset.assetTag.toLowerCase().includes(q) ||
      asset.serialNumber.toLowerCase().includes(q) ||
      (asset.assignedToName && asset.assignedToName.toLowerCase().includes(q))

    const matchesCategory = selectedCategory === "all" || asset.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || asset.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  }) || []

  // Submit device registration
  const handleRegisterDevice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim() || !newName.trim() || !newSerial.trim()) {
      toast.error("Please fill in all required fields (Tag, Name, Serial Number)")
      return
    }

    createAssetMutation.mutate({
      assetTag: newTag,
      name: newName,
      serialNumber: newSerial,
      category: newCategory,
      model: newModel || undefined,
      purchaseDate: newPurchaseDate || undefined,
      cost: newCost ? Number(newCost) : undefined,
      remarks: newRemarks || undefined,
    }, {
      onSuccess: () => {
        toast.success("Device registered successfully in hardware inventory!")
        setIsRegisterOpen(false)
        setNewTag("")
        setNewName("")
        setNewSerial("")
        setNewModel("")
        setNewPurchaseDate("")
        setNewCost("")
        setNewRemarks("")
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to register asset")
      }
    })
  }

  // Submit device allocation
  const handleAllocateDevice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocateEmployeeId) {
      toast.error("Please select an employee for allocation")
      return
    }

    allocateAssetMutation.mutate({
      id: selectedAssetId,
      assignedToId: allocateEmployeeId,
      returnDueDate: allocateDueDate || undefined,
      notes: allocateNotes,
    }, {
      onSuccess: () => {
        toast.success("Asset allocated successfully!")
        setIsAllocateOpen(false)
        setAllocateEmployeeId("")
        setAllocateDueDate("")
        setAllocateNotes("")
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to allocate asset")
      }
    })
  }

  // Submit device return
  const handleReturnDevice = (id: string) => {
    Swal.fire({
      title: "Return Asset to Inventory?",
      text: "Provide return details or remarks below:",
      input: "text",
      inputPlaceholder: "Optional return notes...",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Return Device",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-primary text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        returnAssetMutation.mutate({
          id,
          notes: result.value || "",
        }, {
          onSuccess: () => {
            toast.success("Device returned and marked as Available!")
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to return device")
          }
        })
      }
    })
  }

  // Submit device condition report
  const handleUpdateCondition = (e: React.FormEvent) => {
    e.preventDefault()
    updateConditionMutation.mutate({
      id: selectedAssetId,
      condition: updateConditionValue,
      notes: updateNotes,
    }, {
      onSuccess: () => {
        toast.success(`Device condition updated to ${updateConditionValue}`)
        setIsConditionOpen(false)
        setUpdateNotes("")
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update condition")
      }
    })
  }

  const openAllocate = (id: string) => {
    setSelectedAssetId(id)
    setIsAllocateOpen(true)
  }

  const openDetails = (id: string) => {
    setSelectedAssetId(id)
    setIsDetailsOpen(true)
  }

  const openCondition = (id: string, currentCond: "New" | "Good" | "Damaged" | "Lost") => {
    setSelectedAssetId(id)
    setUpdateConditionValue(currentCond)
    setIsConditionOpen(true)
  }

  // KPI aggregates
  const totalRegisteredCount = assetsList?.length || 0
  const activeAllocatedCount = assetsList?.filter(a => a.status === "Assigned").length || 0
  const maintenanceCount = assetsList?.filter(a => a.status === "Under Maintenance").length || 0

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">IT Asset & Device Inventory</h2>
          <p className="text-muted-foreground text-sm">Register company-owned hardware, manage employee allocations, and audit exit retrievals.</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="gap-2 text-xs cursor-pointer" onClick={() => setIsRegisterOpen(true)}>
            <Plus className="h-4 w-4" />
            Register New Device
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none border-border/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{isAdmin ? "Registered Assets" : "My Assigned Devices"}</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{isAdmin ? totalRegisteredCount : activeAllocatedCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Corporate hardware logged on system</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/5 flex items-center justify-center">
              <Laptop className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{isAdmin ? "Active Allocations" : "Total Assets Value"}</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">
                {isAdmin ? activeAllocatedCount : formatCurrency(assetsList?.reduce((sum, a) => sum + a.cost, 0) || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Devices currently in employee custody</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/5 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{isAdmin ? "Under Maintenance" : "Repairs & Maintenance"}</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">
                {isAdmin ? maintenanceCount : assetsList?.filter(a => a.condition === "Damaged").length || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Hardware flagged as damaged or in audit</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/5 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-[350px] shadow-none border border-border/40">
          {isAdmin ? (
            <>
              <TabsTrigger value="inventory" className="text-xs">Assets Ledger</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">Audit Logs</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="my-assets" className="text-xs">My Devices</TabsTrigger>
              <TabsTrigger value="exit-check" className="text-xs">Clearance Policies</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value={isAdmin ? "inventory" : "my-assets"} className="m-0 space-y-6">
          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold">Hardware Asset Inventory</CardTitle>
                <CardDescription className="text-xs">
                  {isAdmin ? "Track hardware specifications, serial codes, physical conditions, and allocators." : "IT assets currently allocated to your work profile."}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {isAdmin && (
                  <>
                    <select
                      className="border border-input bg-background h-9 px-2 text-xs rounded-md focus:outline-none"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Monitor">Monitor</option>
                      <option value="Access Card">Access Card</option>
                      <option value="Others">Others</option>
                    </select>
                    <select
                      className="border border-input bg-background h-9 px-2 text-xs rounded-md focus:outline-none"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </>
                )}
                <div className="relative w-full sm:w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search Tag / Serial..."
                    className="pl-9 text-xs h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isAssetsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-muted-foreground">Asset Tag</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Model & Specification</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Serial Number</TableHead>
                      {isAdmin && <TableHead className="text-xs font-semibold text-muted-foreground">Current Assignee</TableHead>}
                      <TableHead className="text-xs font-semibold text-muted-foreground">Condition</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-muted-foreground text-xs">
                          No hardware assets found in inventory.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssets.map((asset) => (
                        <tr key={asset.id} className="border-b border-border/20 hover:bg-muted/10">
                          <td className="p-3 font-semibold text-foreground">
                            {asset.assetTag}
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-foreground">{asset.name}</p>
                            {asset.model && <p className="text-[10px] text-muted-foreground font-medium">{asset.model}</p>}
                          </td>
                          <td className="p-3 capitalize font-medium text-muted-foreground">{asset.category}</td>
                          <td className="p-3 font-mono text-[10px] text-muted-foreground">{asset.serialNumber}</td>
                          {isAdmin && (
                            <td className="p-3">
                              {asset.assignedToName ? (
                                <div>
                                  <p className="font-semibold">{asset.assignedToName}</p>
                                  <p className="text-[9px] text-muted-foreground">ID: {asset.assignedToDisplayId}</p>
                                </div>
                              ) : <span className="text-muted-foreground italic text-[10px]">Unassigned</span>}
                            </td>
                          )}
                          <td className="p-3 capitalize font-medium">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              asset.condition === "New" || asset.condition === "Good" ? "bg-emerald-500/5 text-emerald-600 border border-emerald-500/10" :
                              asset.condition === "Damaged" ? "bg-amber-500/5 text-amber-600 border border-amber-500/10" :
                              "bg-rose-500/5 text-rose-600 border border-rose-500/10"
                            }`}>
                              {asset.condition}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 ${
                              asset.status === "Available" ? "bg-emerald-500/5 text-emerald-600 border border-emerald-500/10" :
                              asset.status === "Assigned" ? "bg-blue-500/5 text-blue-600 border border-blue-500/10" :
                              asset.status === "Retired" ? "bg-muted text-muted-foreground border border-border/40" :
                              "bg-amber-500/5 text-amber-600 border border-amber-500/10"
                            }`}>
                              {asset.status === "Available" && <CheckCircle2 className="h-3 w-3" />}
                              {asset.status === "Assigned" && <Clock className="h-3 w-3" />}
                              {asset.status === "Retired" && <XCircle className="h-3 w-3" />}
                              {asset.status === "Under Maintenance" && <AlertCircle className="h-3 w-3" />}
                              {asset.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-7 text-[10px] cursor-pointer"
                                onClick={() => openDetails(asset.id)}
                              >
                                History
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-7 text-[10px] cursor-pointer"
                                onClick={() => openCondition(asset.id, asset.condition)}
                              >
                                Condition
                              </Button>
                              {isAdmin && asset.status === "Available" && (
                                <Button
                                  size="xs"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] cursor-pointer"
                                  onClick={() => openAllocate(asset.id)}
                                >
                                  Allocate
                                </Button>
                              )}
                              {isAdmin && asset.status === "Assigned" && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="border-rose-500 text-rose-600 hover:bg-rose-500/10 h-7 text-[10px] cursor-pointer"
                                  onClick={() => handleReturnDevice(asset.id)}
                                >
                                  Return
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ADMIN ONLY: History overview --- */}
        {isAdmin && (
          <TabsContent value="history" className="m-0">
            <Card className="shadow-none border-border/40 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold border-b pb-2">IT Auditing Logs</h3>
                <p className="text-muted-foreground mt-1">
                  For individual device allocation records, click the **History** button on any asset in the ledger.
                </p>
              </div>
              <div className="bg-muted/10 p-6 rounded-lg border border-border/40 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="font-semibold text-xs">Device Allocation & Return Logs are tracked inside the specific asset history card.</p>
              </div>
            </Card>
          </TabsContent>
        )}

        {/* --- EMPLOYEE ONLY: Clearance rules --- */}
        {!isAdmin && (
          <TabsContent value="exit-check" className="m-0">
            <Card className="shadow-none border-border/40 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold border-b pb-2">Corporate Device Return Policy</h3>
                <p className="text-muted-foreground mt-1">Strict exit clearance regulations apply to all corporate hardware allocations:</p>
              </div>
              <div className="space-y-3 bg-muted/10 p-4 border border-border/40 rounded-lg">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>IT Department Clearance:</strong> Resigning employees must return all active devices (laptops, access cards, cables) to the IT department to receive a clearance signature.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Deduction Clause:</strong> Unreturned, lost, or unaccounted hardware values will be deducted from your final settlement balance under "Asset Recovery".</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Damaged Assets:</strong> Any accidental device damage must be reported using the condition portal promptly to ensure repair logging.</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* --- Register Device Dialog Modal --- */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-[450px] text-xs">
          <form onSubmit={handleRegisterDevice}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Register Hardware Device</DialogTitle>
              <DialogDescription className="text-[10px]">
                Add a new device, access card, or monitor to corporate IT inventory.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 border-t border-b border-border/30 py-4 my-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Asset Tag *</label>
                  <Input
                    placeholder="e.g. AST-082"
                    className="text-xs h-9"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Category *</label>
                  <select
                    className="w-full border border-input bg-background h-9 px-3 text-xs rounded-md focus:outline-none"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Access Card">Access Card</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Device Name / Brand *</label>
                <Input
                  placeholder="e.g. Dell Latitude 7440"
                  className="text-xs h-9"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Serial Number *</label>
                <Input
                  placeholder="e.g. Manufacturer serial / UUID"
                  className="text-xs h-9"
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Purchase Cost (BDT)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 120000"
                    className="text-xs h-9"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Purchase Date</label>
                  <Input
                    type="date"
                    className="text-xs h-9"
                    value={newPurchaseDate}
                    onChange={(e) => setNewPurchaseDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Model Specifications</label>
                <Input
                  placeholder="e.g. Core i7, 16GB RAM, 512GB SSD"
                  className="text-xs h-9"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Remarks</label>
                <Textarea
                  placeholder="Additional remarks..."
                  className="text-xs resize-none h-16"
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsRegisterOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs cursor-pointer" disabled={createAssetMutation.isPending}>
                {createAssetMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Registering...
                  </>
                ) : "Register Device"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Allocate Device Dialog Modal --- */}
      <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
        <DialogContent className="sm:max-w-[420px] text-xs">
          <form onSubmit={handleAllocateDevice}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Allocate IT Device</DialogTitle>
              <DialogDescription className="text-[10px]">
                Assign this device to an active employee profile.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 border-t border-b border-border/30 py-4 my-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Select Employee *</label>
                <select
                  className="w-full border border-input bg-background h-9 px-3 text-xs rounded-md focus:outline-none"
                  value={allocateEmployeeId}
                  onChange={(e) => setAllocateEmployeeId(e.target.value)}
                >
                  <option value="">-- Choose Employee --</option>
                  {employeesData?.data?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullNameEnglish} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Expected Return Date</label>
                <Input
                  type="date"
                  className="text-xs h-9"
                  value={allocateDueDate}
                  onChange={(e) => setAllocateDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Allocation Notes</label>
                <Textarea
                  placeholder="e.g. Provisioned for software developer remote workspace..."
                  className="text-xs resize-none h-20"
                  value={allocateNotes}
                  onChange={(e) => setAllocateNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsAllocateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs cursor-pointer" disabled={allocateAssetMutation.isPending}>
                {allocateAssetMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Allocating...
                  </>
                ) : "Allocate Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Audit History Dialog --- */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[550px] text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Allocation History & Audit Logs</DialogTitle>
            <DialogDescription className="text-[10px]">
              Full logs of who had custody of this hardware asset and device status updates.
            </DialogDescription>
          </DialogHeader>

          {isDetailsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selectedAsset ? (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 border border-border/40 rounded-lg">
                <div>
                  <p className="text-[10px] text-muted-foreground">Asset Tag</p>
                  <p className="text-sm font-bold text-foreground">{selectedAsset.assetTag}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{selectedAsset.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Custodian</p>
                  <p className="text-sm font-bold text-foreground">
                    {selectedAsset.assignedToName || "Available In Inventory"}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Status: {selectedAsset.status}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Audit Logs</h4>
                <div className="max-h-[220px] overflow-y-auto border border-border/40 rounded-md">
                  <Table>
                    <TableHeader className="bg-muted/10 border-b border-border/30">
                      <TableRow className="border-b-0 hover:bg-transparent">
                        <TableHead className="text-[10px] font-semibold p-2">Date</TableHead>
                        <TableHead className="text-[10px] font-semibold p-2">Action</TableHead>
                        <TableHead className="text-[10px] font-semibold p-2">Custodian / HR Actioned By</TableHead>
                        <TableHead className="text-[10px] font-semibold p-2">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!selectedAsset.history || selectedAsset.history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-[10px]">
                            No history logs found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedAsset.history.map((h) => (
                          <TableRow key={h.id} className="text-[10px] border-b border-border/10 hover:bg-transparent">
                            <TableCell className="p-2 font-mono text-[9px] text-muted-foreground">
                              {new Date(h.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="p-2 font-semibold capitalize text-foreground">{h.action}</TableCell>
                            <TableCell className="p-2">
                              <div>
                                {h.employeeName && <p className="font-medium text-foreground">Custodian: {h.employeeName}</p>}
                                <p className="text-[9px] text-muted-foreground">HR: {h.actionByName || "System"}</p>
                              </div>
                            </TableCell>
                            <TableCell className="p-2 text-muted-foreground italic max-w-xs">{h.notes || "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">Failed to load device log.</p>
          )}

          <DialogFooter className="mt-4">
            <Button size="sm" variant="outline" className="text-xs text-foreground cursor-pointer" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Update Condition Dialog Modal --- */}
      <Dialog open={isConditionOpen} onOpenChange={setIsConditionOpen}>
        <DialogContent className="sm:max-w-[400px] text-xs">
          <form onSubmit={handleUpdateCondition}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Update Device Condition</DialogTitle>
              <DialogDescription className="text-[10px]">
                Change the physical condition of this device. Reporting lost/retired status clears custodians.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 border-t border-b border-border/30 py-4 my-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Physical Condition *</label>
                <select
                  className="w-full border border-input bg-background h-9 px-3 text-xs rounded-md focus:outline-none"
                  value={updateConditionValue}
                  onChange={(e) => setUpdateConditionValue(e.target.value as any)}
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Lost">Lost (Retires device)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Condition Report Notes</label>
                <Textarea
                  placeholder="Provide logs or details (e.g. keyboard key broken, sent to service center)..."
                  className="text-xs resize-none h-20"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="text-xs cursor-pointer" onClick={() => setIsConditionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs cursor-pointer" disabled={updateConditionMutation.isPending}>
                {updateConditionMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Saving...
                  </>
                ) : "Save Condition"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
