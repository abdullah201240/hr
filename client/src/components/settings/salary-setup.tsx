import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  Plus,
  Edit3,
  Save,
  TrendingUp,
  Calculator,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import {
  useProvidentFundSettingsQuery,
  useUpdateProvidentFundSettingsMutation,
} from "@/hooks/useProvidentFund"
import {
  useSalaryTemplatesQuery,
  useCreateSalaryTemplateMutation,
  useUpdateSalaryTemplateMutation,
  useDeleteSalaryTemplateMutation,
} from "@/hooks/useSalary"
import type { SalaryTemplate } from "@/types"

export function SalarySetup() {
  const { data: templates = [], isLoading: isLoadingTemplates } = useSalaryTemplatesQuery()
  const createTemplateMutation = useCreateSalaryTemplateMutation()
  const updateTemplateMutation = useUpdateSalaryTemplateMutation()
  const deleteTemplateMutation = useDeleteSalaryTemplateMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SalaryTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")

  // Simulation Calculator State
  const simBasic = 50000
  const simDays = 180

  const simMonths = simDays / 30

  // Initialize selectedTemplate automatically
  useEffect(() => {
    if (templates.length > 0 && (!selectedTemplate || !templates.some(t => t.id === selectedTemplate))) {
      setSelectedTemplate(templates[0].id)
    }
  }, [templates, selectedTemplate])

  const currentTemplate = templates.find(t => t.id === selectedTemplate) || templates[0]

  // Provident Fund Settings Hooks
  const { data: pfSettings, isLoading: isLoadingPF } = useProvidentFundSettingsQuery()
  const updatePFMutation = useUpdateProvidentFundSettingsMutation()

  // Provident Fund Form States
  const [pfMinMonths, setPfMinMonths] = useState<number>(12)
  const [pfEmployeeRate, setPfEmployeeRate] = useState<number>(10)
  const [pfEmployerRate, setPfEmployerRate] = useState<number>(10)
  const [pfFrequency, setPfFrequency] = useState<string>("monthly")
  const [pfBasis, setPfBasis] = useState<string>("basic_salary")
  const [pfWithdrawal, setPfWithdrawal] = useState<string>("As per PF Trust Rules and Labour Law")

  useEffect(() => {
    if (pfSettings) {
      setPfMinMonths(pfSettings.minServiceMonths)
      setPfEmployeeRate(pfSettings.employeeContributionRate)
      setPfEmployerRate(pfSettings.employerContributionRate)
      setPfFrequency(pfSettings.contributionFrequency)
      setPfBasis(pfSettings.calculationBasis)
      setPfWithdrawal(pfSettings.withdrawalRules)
    }
  }, [pfSettings])

  const handleSavePFSettings = async () => {
    try {
      await updatePFMutation.mutateAsync({
        minServiceMonths: pfMinMonths,
        employeeContributionRate: pfEmployeeRate,
        employerContributionRate: pfEmployerRate,
        contributionFrequency: pfFrequency,
        calculationBasis: pfBasis,
        withdrawalRules: pfWithdrawal,
      })
      toast.success("Provident Fund settings saved successfully!")
    } catch (error: any) {
      toast.error(error?.message || "Failed to save Provident Fund settings")
    }
  }

  const handleSaveTemplate = async (templateData: any) => {
    const payload = {
      name: templateData.name,
      description: templateData.description,
      components: templateData.components.map((c: any) => ({
        name: c.name,
        type: c.type,
        calculationType: c.calculationType,
        value: c.value,
        isTaxable: c.isTaxable ?? false,
      }))
    }

    try {
      if (editingTemplate) {
        await updateTemplateMutation.mutateAsync({
          id: editingTemplate.id,
          payload
        })
        toast.success("Salary template updated successfully!")
      } else {
        await createTemplateMutation.mutateAsync(payload)
        toast.success("Salary template created successfully!")
      }
      setDialogOpen(false)
      setEditingTemplate(null)
    } catch (error: any) {
      toast.error(error?.message || "Failed to save template")
    }
  }

  const handleDeleteTemplate = async (id: string, name: string) => {
    Swal.fire({
      title: `Delete "${name}"?`,
      text: "This will permanently remove the template and all its components.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "swal2-confirm swal2-styled bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton:
          "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTemplateMutation.mutateAsync(id)
          toast.success("Template deleted successfully")
          if (selectedTemplate === id) {
            setSelectedTemplate("")
          }
        } catch (error: any) {
          toast.error(error?.message || "Failed to delete template")
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Salary Structure & Policies
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure salary components and provident fund settings
          </p>
        </div>

        {/* Template Selector & Actions */}
        <Card className="shadow-none border border-border/40">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Salary Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate(currentTemplate)
                    setDialogOpen(true)
                  }}
                  disabled={!currentTemplate}
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Template
                </Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingTemplate(null)} className="gap-2 flex-1 sm:flex-initial">
                      <Plus className="h-4 w-4" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] !max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <SalaryTemplateForm
                      template={editingTemplate}
                      onSave={handleSaveTemplate}
                      onCancel={() => {
                        setDialogOpen(false)
                        setEditingTemplate(null)
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - Improved Layout */}
      <div className="grid gap-6">
        {/* Top Row: All Templates Salary Breakdown (Full Width) */}
        <Card className="shadow-none border border-border/40">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-emerald-500" />
                  Salary Breakdown - All Templates
                </CardTitle>
                <CardDescription>Compare salary components across all templates</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {templates.length} Template{templates.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* All Templates Card View */}
            {isLoadingTemplates ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : templates.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
                <Calculator className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No salary templates configured yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Click "New Template" to create your first salary structure.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                  let totalEarnings = simBasic
                  let totalDeductions = 0

                  template.components.forEach((c) => {
                    const amt =
                      c.calculationType === "percentage"
                        ? Math.round(simBasic * (c.value / 100))
                        : c.value
                    if (c.type === "earning") {
                      totalEarnings += amt
                    } else {
                      totalDeductions += amt
                    }
                  })

                  const netSalary = totalEarnings - totalDeductions

                  return (
                    <Card key={template.id} className="shadow-none border border-border/40 hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-sm font-bold truncate">{template.name}</CardTitle>
                              {template.description && (
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{template.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => {
                                setEditingTemplate(template)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                              onClick={() => handleDeleteTemplate(template.id, template.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Base Basic Salary</p>
                          <p className="text-lg font-bold text-foreground">৳{simBasic.toLocaleString()}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                          {template.components.map((component) => {
                            const amt =
                              component.calculationType === "percentage"
                                ? Math.round(simBasic * (component.value / 100))
                                : component.value
                            return (
                              <div key={component.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0 text-xs">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full shrink-0",
                                      component.type === "earning"
                                        ? "bg-emerald-500"
                                        : "bg-rose-500"
                                    )}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{component.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {component.calculationType === "percentage" ? (
                                        `${component.value}% of Basic`
                                      ) : (
                                        `Fixed Amount`
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={cn(
                                    "text-xs font-semibold ml-2 shrink-0",
                                    component.type === "earning" ? "text-emerald-600" : "text-rose-500"
                                  )}
                                >
                                  {component.type === "earning" ? "+" : "-"}৳{amt.toLocaleString()}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                        <div className="pt-2 mt-2 border-t border-border/20 bg-muted/10 -mx-6 px-6 py-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gross Salary</span>
                            <span className="text-base font-bold text-emerald-600">৳{totalEarnings.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/20">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Net Pay</span>
                            <span className="text-base font-bold text-primary">৳{netSalary.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provident Fund (PF) Settings Card */}
        <div className="grid gap-6">
          <Card className="shadow-none border border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" />
                Provident Fund Settings
              </CardTitle>
              <CardDescription>Configure employee/employer contributions and eligibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pfMinMonths" className="text-xs font-semibold">Eligibility (Months)</Label>
                    <Input
                      id="pfMinMonths"
                      type="number"
                      value={pfMinMonths}
                      onChange={(e) => setPfMinMonths(parseInt(e.target.value) || 0)}
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pfFrequency" className="text-xs font-semibold">Frequency</Label>
                    <Select value={pfFrequency} onValueChange={setPfFrequency}>
                      <SelectTrigger id="pfFrequency" className="h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pfEmployeeRate" className="text-xs font-semibold">Employee %</Label>
                    <Input
                      id="pfEmployeeRate"
                      type="number"
                      value={pfEmployeeRate}
                      onChange={(e) => setPfEmployeeRate(parseFloat(e.target.value) || 0)}
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pfEmployerRate" className="text-xs font-semibold">Employer %</Label>
                    <Input
                      id="pfEmployerRate"
                      type="number"
                      value={pfEmployerRate}
                      onChange={(e) => setPfEmployerRate(parseFloat(e.target.value) || 0)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pfBasis" className="text-xs font-semibold">Calculation Basis</Label>
                  <Select value={pfBasis} onValueChange={setPfBasis}>
                    <SelectTrigger id="pfBasis" className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic_salary">Basic Salary</SelectItem>
                      <SelectItem value="gross_salary">Gross Salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pfWithdrawal" className="text-xs font-semibold">Withdrawal Rules</Label>
                  <Input
                    id="pfWithdrawal"
                    value={pfWithdrawal}
                    onChange={(e) => setPfWithdrawal(e.target.value)}
                    className="h-10 text-xs"
                    placeholder="e.g. As per PF Trust Rules"
                  />
                </div>
              </div>

              <Button
                onClick={handleSavePFSettings}
                disabled={updatePFMutation.isPending || isLoadingPF}
                className="w-full h-10 gap-2"
              >
                {updatePFMutation.isPending ? "Saving..." : (
                  <>
                    <Save className="h-4 w-4" /> Save PF Settings
                  </>
                )}
              </Button>

              <Separator className="bg-border/30" />

              {/* Calculator Simulation */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-primary" />
                  PF Contribution Calculator
                </Label>
                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/40 space-y-3.5">
                  <div className="pt-1 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Basic Salary (Sim):</span>
                      <span className="font-mono font-medium">৳{simBasic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Service Months:</span>
                      <span className="font-mono font-medium">{simMonths.toFixed(2)} Months</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Eligibility:</span>
                      <span>
                        {simMonths >= pfMinMonths ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">Eligible</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">Ineligible (min {pfMinMonths}m)</Badge>
                        )}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-border/40 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Employee ({pfEmployeeRate}%):</span>
                        <span className="font-mono text-foreground font-medium">৳{((simBasic * pfEmployeeRate) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Employer ({pfEmployerRate}%):</span>
                        <span className="font-mono text-foreground font-medium">৳{((simBasic * pfEmployerRate) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="flex justify-between pt-3 border-t border-border/40 text-sm font-semibold">
                      <span className="text-foreground">Total Monthly Deposit:</span>
                      <span className="text-blue-600 text-base">৳{(((simBasic * pfEmployeeRate) / 100) + ((simBasic * pfEmployerRate) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface FormComponent {
  name: string
  type: "earning" | "deduction"
  calculationType: "percentage" | "fixed"
  value: number
  isTaxable: boolean
}

interface FormTemplate {
  name: string
  description: string
  components: FormComponent[]
}

function SalaryTemplateForm({
  template,
  onSave,
  onCancel
}: {
  template: SalaryTemplate | null
  onSave: (template: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<FormTemplate>(() => {
    if (template) {
      return {
        name: template.name,
        description: template.description || "",
        components: template.components.map((c) => ({
          name: c.name,
          type: c.type,
          calculationType: c.calculationType,
          value: c.value,
          isTaxable: c.isTaxable,
        })),
      }
    }
    return {
      name: "",
      description: "",
      components: [
        { name: "House Rent Allowance", type: "earning", calculationType: "percentage", value: 20, isTaxable: false },
        { name: "Transport Allowance", type: "earning", calculationType: "percentage", value: 10, isTaxable: false },
        { name: "Medical Allowance", type: "earning", calculationType: "percentage", value: 5, isTaxable: false },
      ],
    }
  })

  const handleAddComponent = () => {
    setFormData((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          name: "",
          type: "earning",
          calculationType: "percentage",
          value: 0,
          isTaxable: false,
        },
      ],
    }))
  }

  const handleRemoveComponent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((_, idx) => idx !== index),
    }))
  }

  const handleComponentChange = (
    index: number,
    field: keyof FormComponent,
    value: any
  ) => {
    setFormData((prev) => {
      const nextComponents = [...prev.components]
      nextComponents[index] = {
        ...nextComponents[index],
        [field]: value,
      }
      return { ...prev, components: nextComponents }
    })
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Template name is required")
      return
    }
    if (formData.components.length === 0) {
      toast.error("Please add at least one component")
      return
    }
    if (formData.components.some((c) => !c.name.trim())) {
      toast.error("All components must have a name")
      return
    }

    onSave(formData)
  }

  const previewBasic = 50000
  let previewEarnings = previewBasic
  let previewDeductions = 0

  formData.components.forEach((c) => {
    const amt =
      c.calculationType === "percentage"
        ? Math.round(previewBasic * (c.value / 100))
        : c.value
    if (c.type === "earning") {
      previewEarnings += amt
    } else {
      previewDeductions += amt
    }
  })

  const previewGross = previewEarnings
  const previewNet = previewEarnings - previewDeductions

  return (
    <>
      <DialogHeader>
        <DialogTitle>{template ? "Edit" : "Create"} Salary Template</DialogTitle>
        <DialogDescription>
          Configure name, description, and components for this salary template.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Standard Full-Time Package"
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              className="text-xs h-9"
            />
          </div>
        </div>

        <Separator className="my-2 bg-border/40" />

        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-foreground">Salary Components</Label>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={handleAddComponent}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Component
          </Button>
        </div>

        <div className="space-y-3">
          {formData.components.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg text-xs">
              No components added yet. Click "Add Component" to start.
            </div>
          ) : (
            formData.components.map((component, index) => (
              <div key={index} className="rounded-lg border border-border/40 p-3 bg-muted/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Component #{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveComponent(index)}
                    className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Name</Label>
                    <Input
                      value={component.name}
                      onChange={(e) => handleComponentChange(index, "name", e.target.value)}
                      placeholder="e.g. HRA"
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                    <select
                      value={component.type}
                      onChange={(e) => handleComponentChange(index, "type", e.target.value as any)}
                      className="w-full bg-background border border-border text-xs h-8 rounded-md px-2"
                    >
                      <option value="earning">Earning</option>
                      <option value="deduction">Deduction</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Calculation Rule</Label>
                    <select
                      value={component.calculationType}
                      onChange={(e) => handleComponentChange(index, "calculationType", e.target.value as any)}
                      className="w-full bg-background border border-border text-xs h-8 rounded-md px-2"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Value</Label>
                    <Input
                      type="number"
                      value={component.value || ""}
                      onChange={(e) => handleComponentChange(index, "value", parseFloat(e.target.value) || 0)}
                      placeholder={component.calculationType === 'percentage' ? "e.g. 10" : "e.g. 5000"}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Separator className="my-2 bg-border/40" />

        <div className="rounded-lg bg-muted/20 border border-border/40 p-4 space-y-2 text-xs">
          <p className="font-bold text-[10px] uppercase text-muted-foreground tracking-wide">Breakdown Preview (Based on ৳{previewBasic.toLocaleString()} Basic)</p>
          <div className="flex justify-between items-center pt-1">
            <span className="text-muted-foreground">Basic Reference Salary:</span>
            <span className="font-semibold text-foreground">৳{previewBasic.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Gross Salary:</span>
            <span className="font-bold text-emerald-600">৳{previewGross.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Net Pay:</span>
            <span className="font-bold text-primary">৳{previewNet.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
        <Button onClick={handleSave} size="sm" className="gap-2 text-xs">
          <Save className="h-4 w-4" />
          Save Template
        </Button>
      </DialogFooter>
    </>
  )
}
