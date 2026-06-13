import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Building2,
  HeartPulse,
  Bus,
  Coffee,
  BookOpen,
  Gift,
  Calculator,
  Trash2,
  CircleDollarSign
} from "lucide-react"
import { toast } from "sonner"

interface SalaryComponent {
  id: string
  name: string
  type: "earning" | "deduction"
  category: string
  amount: number
  percentage?: number
  isFixed: boolean
  icon: string
  description: string
}

interface SalaryTemplate {
  id: string
  name: string
  grade: string
  components: SalaryComponent[]
  totalEarnings: number
  totalDeductions: number
  netSalary: number
}

const defaultComponents: SalaryComponent[] = [
  {
    id: "basic",
    name: "Basic Salary",
    type: "earning",
    category: "Fixed",
    amount: 50000,
    isFixed: true,
    icon: "DollarSign",
    description: "Base salary component"
  },
  {
    id: "house_rent",
    name: "House Rent Allowance",
    type: "earning",
    category: "Allowance",
    amount: 20000,
    percentage: 40,
    isFixed: false,
    icon: "Building2",
    description: "40% of basic salary"
  },
  {
    id: "medical",
    name: "Medical Allowance",
    type: "earning",
    category: "Allowance",
    amount: 5000,
    percentage: 10,
    isFixed: false,
    icon: "HeartPulse",
    description: "10% of basic salary"
  },
  {
    id: "conveyance",
    name: "Conveyance Allowance",
    type: "earning",
    category: "Allowance",
    amount: 3000,
    isFixed: true,
    icon: "Bus",
    description: "Transportation allowance"
  },
  {
    id: "special",
    name: "Special Allowance",
    type: "earning",
    category: "Allowance",
    amount: 12000,
    isFixed: true,
    icon: "Gift",
    description: "Additional special allowance"
  },
  {
    id: "education",
    name: "Education Allowance",
    type: "earning",
    category: "Allowance",
    amount: 5000,
    isFixed: true,
    icon: "BookOpen",
    description: "Education support allowance"
  },
  {
    id: "provident_fund",
    name: "Provident Fund",
    type: "deduction",
    category: "Statutory",
    amount: 6000,
    percentage: 12,
    isFixed: false,
    icon: "TrendingUp",
    description: "12% of basic salary"
  },
  {
    id: "tax",
    name: "Income Tax",
    type: "deduction",
    category: "Statutory",
    amount: 8000,
    isFixed: false,
    icon: "Calculator",
    description: "Monthly income tax deduction"
  },
  {
    id: "professional_tax",
    name: "Professional Tax",
    type: "deduction",
    category: "Statutory",
    amount: 200,
    isFixed: true,
    icon: "Coffee",
    description: "State professional tax"
  }
]

const initialTemplates: SalaryTemplate[] = [
  {
    id: "template-1",
    name: "Software Engineer",
    grade: "L3",
    components: defaultComponents,
    totalEarnings: 95000,
    totalDeductions: 14200,
    netSalary: 80800
  }
]

export function SalarySetup() {
  const [templates, setTemplates] = useState<SalaryTemplate[]>(initialTemplates)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SalaryTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("template-1")

  const currentTemplate = templates.find(t => t.id === selectedTemplate) || templates[0]

  const handleSaveTemplate = (template: SalaryTemplate) => {
    const exists = templates.find(t => t.id === template.id)
    if (exists) {
      setTemplates(templates.map(t => t.id === template.id ? template : t))
      toast.success("Salary template updated!", {
        description: `${template.name} salary structure saved.`
      })
    } else {
      setTemplates([...templates, template])
      toast.success("Salary template created!", {
        description: `${template.name} structure added.`
      })
    }
    setDialogOpen(false)
    setEditingTemplate(null)
  }



  const totalEarnings = currentTemplate.components
    .filter(c => c.type === "earning")
    .reduce((sum, c) => sum + c.amount, 0)

  const totalDeductions = currentTemplate.components
    .filter(c => c.type === "deduction")
    .reduce((sum, c) => sum + c.amount, 0)

  const netSalary = totalEarnings - totalDeductions

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Salary Structure
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Configure salary components and breakdown structure
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} - {template.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTemplate(null)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] !max-w-[1200px] max-h-[90vh] overflow-y-auto">
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

      {/* Salary Breakdown Table */}
      <Card className="shadow-none border border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{currentTemplate.name} - {currentTemplate.grade}</CardTitle>
              <CardDescription>Monthly salary breakdown structure</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setEditingTemplate(currentTemplate)
                setDialogOpen(true)
              }}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit Structure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* All Components Table */}
            <div>
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTemplate.components.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {getIcon(component.icon)}
                            </Badge>
                            {component.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {component.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-600">
                          ৳{component.amount.toLocaleString()}
                          {component.percentage && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({component.percentage}%)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={component.isFixed ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {component.isFixed ? "Fixed" : "Variable"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate({
                                ...currentTemplate,
                                components: currentTemplate.components.map(c => 
                                  c.id === component.id ? { ...c, amount: c.amount } : c
                                )
                              })
                              setDialogOpen(true)
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-emerald-500/5 font-semibold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-emerald-600">৳{totalEarnings.toLocaleString()}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Net Salary Summary */}
            <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Monthly Salary</p>
                  <p className="text-xs text-muted-foreground mt-1">Take-home pay after deductions</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">৳{netSalary.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Annual: ৳{(netSalary * 12).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SalaryTemplateForm({ 
  template, 
  onSave, 
  onCancel 
}: { 
  template: SalaryTemplate | null
  onSave: (template: SalaryTemplate) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<SalaryTemplate>(
    template || {
      id: `template-${Date.now()}`,
      name: "",
      grade: "",
      components: [],
      totalEarnings: 0,
      totalDeductions: 0,
      netSalary: 0
    }
  )
  const [showAddComponent, setShowAddComponent] = useState(false)
  const [newComponentType, setNewComponentType] = useState<"earning" | "deduction">("earning")

  const presetComponents = [
    { id: "basic", name: "Basic Salary", category: "Fixed", icon: "CircleDollarSign" },
    { id: "house_rent", name: "House Rent Allowance", category: "Allowance", icon: "Building2" },
    { id: "medical", name: "Medical Allowance", category: "Allowance", icon: "HeartPulse" },
    { id: "conveyance", name: "Conveyance Allowance", category: "Allowance", icon: "Bus" },
    { id: "special", name: "Special Allowance", category: "Allowance", icon: "Gift" },
    { id: "education", name: "Education Allowance", category: "Allowance", icon: "BookOpen" },
    { id: "provident_fund", name: "Provident Fund", category: "Statutory", icon: "TrendingUp" },
    { id: "tax", name: "Income Tax", category: "Statutory", icon: "Calculator" },
    { id: "professional_tax", name: "Professional Tax", category: "Statutory", icon: "Coffee" },
    { id: "health_insurance", name: "Health Insurance", category: "Benefits", icon: "HeartPulse" },
    { id: "bonus", name: "Performance Bonus", category: "Variable", icon: "Gift" },
    { id: "others", name: "Others", category: "Other", icon: "CircleDollarSign" },
  ]

  const availablePresets = presetComponents.filter(
    preset => !formData.components.find(comp => comp.id === preset.id)
  )

  const calculateTotals = (components: SalaryComponent[]) => {
    const earnings = components.filter(c => c.type === "earning").reduce((sum, c) => sum + c.amount, 0)
    const deductions = components.filter(c => c.type === "deduction").reduce((sum, c) => sum + c.amount, 0)
    return { earnings, deductions, net: earnings - deductions }
  }

  const handleAddComponent = (presetId: string) => {
    const preset = presetComponents.find(p => p.id === presetId)
    if (!preset) return

    const basicSalary = formData.components.find(c => c.id === "basic")?.amount || 50000
    const isPercentageBased = ["house_rent", "medical", "provident_fund"].includes(preset.id)
    const defaultPercentage = preset.id === "house_rent" ? 40 : preset.id === "medical" ? 10 : preset.id === "provident_fund" ? 12 : undefined
    
    const newComponent: SalaryComponent = {
      id: preset.id,
      name: preset.name,
      type: newComponentType,
      category: preset.category,
      amount: isPercentageBased ? Math.round((basicSalary * (defaultPercentage || 10)) / 100) : 0,
      percentage: defaultPercentage,
      isFixed: !isPercentageBased,
      icon: preset.icon,
      description: preset.name
    }

    setFormData({ ...formData, components: [...formData.components, newComponent] })
    setShowAddComponent(false)
  }

  const handleRemoveComponent = (id: string) => {
    setFormData({ ...formData, components: formData.components.filter(c => c.id !== id) })
    toast.success("Component removed")
  }

  const handleComponentChange = (index: number, field: keyof SalaryComponent, value: any) => {
    const newComponents = [...formData.components]
    newComponents[index] = { ...newComponents[index], [field]: value }
    
    // Auto-calculate percentage-based amounts
    if (field === "percentage" && newComponents[index].percentage) {
      const basicSalary = newComponents.find(c => c.id === "basic")?.amount || 0
      if (basicSalary > 0) {
        newComponents[index].amount = Math.round((basicSalary * newComponents[index].percentage!) / 100)
      }
    }
    
    setFormData({ ...formData, components: newComponents })
  }

  const handleSave = () => {
    if (!formData.name || !formData.grade) {
      toast.error("Validation Error", {
        description: "Please fill in template name and grade."
      })
      return
    }
    
    const totals = calculateTotals(formData.components)
    onSave({
      ...formData,
      totalEarnings: totals.earnings,
      totalDeductions: totals.deductions,
      netSalary: totals.net
    })
  }

  const totals = calculateTotals(formData.components)

  return (
    <>
      <DialogHeader>
        <DialogTitle>{template ? "Edit" : "Create"} Salary Template</DialogTitle>
        <DialogDescription>
          Configure salary components and structure for this template
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">Grade/Level *</Label>
            <Input
              id="grade"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              placeholder="e.g., L3, Senior"
            />
          </div>
        </div>

        <Separator />

        {/* Add Component Button */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Salary Components</h4>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowAddComponent(true)}
          >
            <Plus className="h-4 w-4" />
            Add Component
          </Button>
        </div>

        {/* Add Component Dialog */}
        {showAddComponent && (
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm">Select Component Type</CardTitle>
              <CardDescription className="text-xs">Choose a component to add to this template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant={newComponentType === "earning" ? "default" : "outline"}
                  onClick={() => setNewComponentType("earning")}
                  className="w-full justify-start gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Earning
                </Button>
                <Button
                  variant={newComponentType === "deduction" ? "default" : "outline"}
                  onClick={() => setNewComponentType("deduction")}
                  className="w-full justify-start gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Deduction
                </Button>
              </div>
              
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {availablePresets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    className="justify-start gap-2 h-auto py-3"
                    onClick={() => handleAddComponent(preset.id)}
                  >
                    <div className="flex items-center gap-2">
                      {getIcon(preset.icon)}
                      <div className="text-left">
                        <div className="text-xs font-medium">{preset.name}</div>
                        <div className="text-[10px] text-muted-foreground">{preset.category}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {availablePresets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">All components have been added</p>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => setShowAddComponent(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Components List */}
        <div className="space-y-3">
          {formData.components.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No components added yet</p>
              <p className="text-xs mt-1">Click "Add Component" to start building your salary structure</p>
            </div>
          )}
          
          {formData.components.map((component, index) => (
            <div key={component.id} className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={component.type === "earning" ? "default" : "destructive"} className="text-[10px]">
                    {component.type === "earning" ? "Earning" : "Deduction"}
                  </Badge>
                  <span className="text-sm font-medium">{component.name}</span>
                  <Badge variant="outline" className="text-xs">{component.category}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveComponent(component.id)}
                  className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs">Amount (৳)</Label>
                  <Input
                    type="number"
                    value={component.amount}
                    onChange={(e) => handleComponentChange(index, "amount", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Percentage (%)</Label>
                  <Input
                    type="number"
                    value={component.percentage || ""}
                    onChange={(e) => handleComponentChange(index, "percentage", parseFloat(e.target.value) || undefined)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Calculation</Label>
                  <Select 
                    value={component.isFixed ? "fixed" : "variable"} 
                    onValueChange={(value) => handleComponentChange(index, "isFixed", value === "fixed")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="variable">Percentage-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Earnings:</span>
            <span className="font-semibold text-emerald-600">৳{totals.earnings.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Deductions:</span>
            <span className="font-semibold text-red-600">৳{totals.deductions.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold">Net Salary:</span>
            <span className="font-bold text-blue-600 text-lg">৳{totals.net.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Template
        </Button>
      </DialogFooter>
    </>
  )
}

function getIcon(iconName: string) {
  const icons: Record<string, any> = {
    DollarSign: <DollarSign className="h-3 w-3" />,
    CircleDollarSign: <CircleDollarSign className="h-3 w-3" />,
    Building2: <Building2 className="h-3 w-3" />,
    HeartPulse: <HeartPulse className="h-3 w-3" />,
    Bus: <Bus className="h-3 w-3" />,
    Gift: <Gift className="h-3 w-3" />,
    BookOpen: <BookOpen className="h-3 w-3" />,
    TrendingUp: <TrendingUp className="h-3 w-3" />,
    Calculator: <Calculator className="h-3 w-3" />,
    Coffee: <Coffee className="h-3 w-3" />
  }
  return icons[iconName] || <CircleDollarSign className="h-3 w-3" />
}
