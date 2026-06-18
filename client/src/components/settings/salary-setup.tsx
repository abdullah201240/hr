import { useState, useEffect } from "react"
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
import {
  useFestivalBonusRulesQuery,
  useCreateFestivalBonusRuleMutation,
  useUpdateFestivalBonusRuleMutation,
  useDeleteFestivalBonusRuleMutation,
} from "@/hooks/useFestivalBonus"
import {
  useProvidentFundSettingsQuery,
  useUpdateProvidentFundSettingsMutation,
} from "@/hooks/useProvidentFund"
import type { FestivalBonusRule } from "@/types"



interface SalaryComponent {
  id: string
  name: string
  type: "earning"
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
  basicSalary: number
  components: SalaryComponent[]
  totalEarnings: number
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
    amount: 25000,
    percentage: 50,
    isFixed: false,
    icon: "Building2",
    description: "50% of basic salary"
  },
  {
    id: "medical",
    name: "Medical Allowance",
    type: "earning",
    category: "Allowance",
    amount: 10000,
    percentage: 20,
    isFixed: false,
    icon: "HeartPulse",
    description: "20% of basic salary"
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
  }
]

const initialTemplates: SalaryTemplate[] = [
  {
    id: "template-1",
    name: "Software Engineer",
    grade: "L3",
    basicSalary: 50000,
    components: defaultComponents,
    totalEarnings: 105000,
    netSalary: 105000
  }
]

export function SalarySetup() {
  const [templates, setTemplates] = useState<SalaryTemplate[]>(initialTemplates)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SalaryTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("template-1")

  // Festival Bonus Rules (Clause 7.6.1) from Database
  const { data: rules = [], isLoading: isLoadingRules } = useFestivalBonusRulesQuery()
  const createRuleMutation = useCreateFestivalBonusRuleMutation()
  const updateRuleMutation = useUpdateFestivalBonusRuleMutation()
  const deleteRuleMutation = useDeleteFestivalBonusRuleMutation()

  // Rule dialog / form state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<FestivalBonusRule | null>(null)
  const [ruleMinMonths, setRuleMinMonths] = useState<number>(0)
  const [ruleMaxMonths, setRuleMaxMonths] = useState<number>(12)
  const [rulePercentage, setRulePercentage] = useState<number>(100)
  const [ruleIsProRata, setRuleIsProRata] = useState<boolean>(false)
  const [ruleDescription, setRuleDescription] = useState<string>("")

  // Simulation Calculator State
  const [simBasic, setSimBasic] = useState(50000)
  const [simDays, setSimDays] = useState(180)

  const simMonths = simDays / 30

  // Match rule from database
  const matchedRule = rules.find(r => simMonths >= r.minServiceMonths && simMonths <= r.maxServiceMonths)

  let simBonus = 0
  let isEligible = false
  let simFormulaLabel = ""

  if (matchedRule) {
    isEligible = matchedRule.bonusPercentage > 0 || matchedRule.isProRata
    if (matchedRule.isProRata) {
      const effectivePercentage = matchedRule.bonusPercentage || 100
      simBonus = simBasic * (simMonths / 12) * (effectivePercentage / 100)
      simFormulaLabel = `৳${simBasic.toLocaleString()} × (${simDays} Days ÷ 30) ÷ 12 Months × ${effectivePercentage}%`
    } else {
      simBonus = simBasic * (matchedRule.bonusPercentage / 100)
      simFormulaLabel = `৳${simBasic.toLocaleString()} × ${matchedRule.bonusPercentage}%`
    }
  }

  const handleOpenAddRule = () => {
    setEditingRule(null)
    setRuleMinMonths(0)
    setRuleMaxMonths(12)
    setRulePercentage(100)
    setRuleIsProRata(false)
    setRuleDescription("")
    setRuleDialogOpen(true)
  }

  const handleOpenEditRule = (rule: FestivalBonusRule) => {
    setEditingRule(rule)
    setRuleMinMonths(rule.minServiceMonths)
    setRuleMaxMonths(rule.maxServiceMonths)
    setRulePercentage(rule.bonusPercentage)
    setRuleIsProRata(rule.isProRata)
    setRuleDescription(rule.description || "")
    setRuleDialogOpen(true)
  }

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        await updateRuleMutation.mutateAsync({
          id: editingRule.id,
          payload: {
            minServiceMonths: ruleMinMonths,
            maxServiceMonths: ruleMaxMonths,
            bonusPercentage: rulePercentage,
            isProRata: ruleIsProRata,
            description: ruleDescription,
          }
        })
        toast.success("Festival bonus rule updated successfully!")
      } else {
        await createRuleMutation.mutateAsync({
          minServiceMonths: ruleMinMonths,
          maxServiceMonths: ruleMaxMonths,
          bonusPercentage: rulePercentage,
          isProRata: ruleIsProRata,
          description: ruleDescription,
        })
        toast.success("Festival bonus rule created successfully!")
      }
      setRuleDialogOpen(false)
    } catch (error: any) {
      toast.error(error?.message || "Failed to save rule")
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      try {
        await deleteRuleMutation.mutateAsync(id)
        toast.success("Rule deleted successfully")
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete rule")
      }
    }
  }

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
            Configure salary components, festival bonus rules, and provident fund settings
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
                        {template.name} - Grade {template.grade}
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
            {templates.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
                <Calculator className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No salary templates configured yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Click "New Template" to create your first salary structure.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                  const templateTotal = template.components.reduce((sum, c) => {
                    const amt = c.id === "basic" ? template.basicSalary : 
                                c.isFixed ? c.amount : 
                                Math.round((template.basicSalary * (c.percentage || 0)) / 100)
                    return sum + amt
                  }, 0)
                  
                  return (
                    <Card key={template.id} className="shadow-none border border-border/40 hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold">{template.name}</CardTitle>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="outline" className="text-[10px] h-5">
                                  Grade: {template.grade}
                                </Badge>
                              </div>
                            </div>
                          </div>
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
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Basic Salary</p>
                          <p className="text-lg font-bold text-foreground">৳{template.basicSalary.toLocaleString()}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="space-y-1.5">
                          {template.components.map((component) => {
                            const amt = component.id === "basic" ? template.basicSalary : 
                                        component.isFixed ? component.amount : 
                                        Math.round((template.basicSalary * (component.percentage || 0)) / 100)
                            return (
                              <div key={component.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center shrink-0">
                                    {getIcon(component.icon)}
                                  </Badge>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate">{component.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {component.id === "basic" ? (
                                        "Base"
                                      ) : component.isFixed ? (
                                        `Fixed: ৳${component.amount.toLocaleString()}`
                                      ) : (
                                        `${component.percentage}% of Basic`
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 ml-2">
                                  ৳{amt.toLocaleString()}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                        <div className="pt-2 mt-2 border-t-2 border-emerald-500/20 bg-emerald-500/5 -mx-6 px-6 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gross Salary</span>
                            <span className="text-base font-bold text-emerald-600">৳{templateTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">Annual</span>
                            <span className="text-xs font-semibold text-muted-foreground">৳{(templateTotal * 12).toLocaleString()}</span>
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

        {/* Bottom Row: Festival Bonus & PF (Two Column) */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-none border border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="h-5 w-5 text-primary" />
                Festival Bonus Policy
              </CardTitle>
              <CardDescription>Configure bonus entitlement rules (Clause 7.6.1)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Dynamic Rules Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Active Rules</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 text-xs gap-1.5"
                    onClick={handleOpenAddRule}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Rule
                  </Button>
                </div>

                {isLoadingRules ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">Loading rules...</div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                    No rules configured yet
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="h-9 text-[10px] uppercase font-bold px-3">Service Range</TableHead>
                          <TableHead className="h-9 text-[10px] uppercase font-bold px-3">Payout</TableHead>
                          <TableHead className="h-9 text-[10px] uppercase font-bold px-3 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rules.map((rule) => (
                          <TableRow key={rule.id} className="hover:bg-muted/20">
                            <TableCell className="py-2.5 px-3 text-xs">
                              <div className="font-semibold">{rule.minServiceMonths}–{rule.maxServiceMonths >= 999 ? '∞' : `${rule.maxServiceMonths}`} Months</div>
                              {rule.description && (
                                <div className="text-[10px] text-muted-foreground mt-0.5">{rule.description}</div>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-xs">
                              <div className="font-semibold text-emerald-600">{rule.bonusPercentage}%</div>
                              {rule.isProRata && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold mt-1">Pro-rata</Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleOpenEditRule(rule)}
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteRule(rule.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Calculator Simulation */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-primary" />
                  Pro-rata Calculator
                </Label>
                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/40 space-y-3.5">
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Basic Salary (৳)</Label>
                      <Input
                        type="number"
                        value={simBasic}
                        onChange={(e) => setSimBasic(parseInt(e.target.value) || 0)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Service Days</Label>
                      <Input
                        type="number"
                        value={simDays}
                        onChange={(e) => setSimDays(parseInt(e.target.value) || 0)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Service Months:</span>
                      <span className="font-mono font-medium">{simDays} Days ÷ 30 = {simMonths.toFixed(2)} Months</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Eligibility:</span>
                      <span>
                        {isEligible ? (
                          matchedRule?.isProRata ? (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-bold">Pro-rata (Pending)</Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">Eligible (Full)</Badge>
                          )
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">Not Eligible</Badge>
                        )}
                      </span>
                    </div>
                    {simFormulaLabel && (
                      <div className="flex justify-between text-[10px] text-muted-foreground italic">
                        <span>Formula:</span>
                        <span className="font-mono">{simFormulaLabel}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t border-border/40 text-sm font-semibold">
                      <span className="text-foreground">Calculated Bonus:</span>
                      <span className="text-blue-600 text-base">৳{simBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provident Fund (PF) Settings Card */}
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

      {/* Festival Bonus Rule Dialog Form */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit" : "Add"} Festival Bonus Rule</DialogTitle>
            <DialogDescription>
              Configure the service duration threshold and bonus payout percentage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minMonths">Min Service (Months)</Label>
                <Input
                  id="minMonths"
                  type="number"
                  value={ruleMinMonths}
                  onChange={(e) => setRuleMinMonths(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMonths">Max Service (Months)</Label>
                <Input
                  id="maxMonths"
                  type="number"
                  value={ruleMaxMonths}
                  onChange={(e) => setRuleMaxMonths(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage">Bonus Percentage of Basic (%)</Label>
              <Input
                id="percentage"
                type="number"
                value={rulePercentage}
                onChange={(e) => setRulePercentage(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isProRata"
                checked={ruleIsProRata}
                onChange={(e) => setRuleIsProRata(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isProRata" className="cursor-pointer">Enable Pro-rata calculation based on service months</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                placeholder="e.g. One Month Basic Salary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} className="gap-2">
              <Save className="h-4 w-4" />
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      basicSalary: 50000,
      components: [
        {
          id: "basic",
          name: "Basic Salary",
          type: "earning",
          category: "Fixed",
          amount: 50000,
          isFixed: true,
          icon: "DollarSign",
          description: "Base salary component"
        }
      ],
      totalEarnings: 50000,
      netSalary: 50000
    }
  )
  const [showAddComponent, setShowAddComponent] = useState(false)

  const presetComponents = [
    { id: "basic", name: "Basic Salary", category: "Fixed", icon: "CircleDollarSign" },
    { id: "house_rent", name: "House Rent Allowance", category: "Allowance", icon: "Building2" },
    { id: "medical", name: "Medical Allowance", category: "Allowance", icon: "HeartPulse" },
    { id: "conveyance", name: "Conveyance Allowance", category: "Allowance", icon: "Bus" },
    { id: "special", name: "Special Allowance", category: "Allowance", icon: "Gift" },
    { id: "education", name: "Education Allowance", category: "Allowance", icon: "BookOpen" },
    { id: "health_insurance", name: "Health Insurance", category: "Benefits", icon: "HeartPulse" },
    { id: "bonus", name: "Performance Bonus", category: "Variable", icon: "Gift" },
    { id: "others", name: "Others", category: "Other", icon: "CircleDollarSign" },
  ]

  const availablePresets = presetComponents.filter(
    preset => !formData.components.find(comp => comp.id === preset.id)
  )

  const calculateTotals = (components: SalaryComponent[]) => {
    const basic = formData.basicSalary || 50000
    const getCompAmt = (comp: SalaryComponent) => {
      if (comp.id === "basic") return basic
      if (comp.isFixed) return comp.amount
      return Math.round((basic * (comp.percentage || 0)) / 100)
    }
    const earnings = components.reduce((sum, c) => sum + getCompAmt(c), 0)
    return { earnings, net: earnings }
  }

  const handleAddComponent = (presetId: string) => {
    const preset = presetComponents.find(p => p.id === presetId)
    if (!preset) return

    const isPercentageBased = ["house_rent", "medical"].includes(preset.id)
    const defaultPercentage = preset.id === "house_rent" ? 50 : preset.id === "medical" ? 20 : undefined
    
    const newComponent: SalaryComponent = {
      id: preset.id,
      name: preset.name,
      type: "earning" as const,
      category: preset.category,
      amount: isPercentageBased ? 0 : 3000,
      percentage: defaultPercentage,
      isFixed: !isPercentageBased,
      icon: preset.icon,
      description: preset.name
    }

    setFormData({ ...formData, components: [...formData.components, newComponent] })
    setShowAddComponent(false)
  }

  const handleRemoveComponent = (id: string) => {
    if (id === "basic") return
    setFormData({ ...formData, components: formData.components.filter(c => c.id !== id) })
    toast.success("Component removed")
  }

  const handleComponentChange = (index: number, field: keyof SalaryComponent, value: any) => {
    const newComponents = [...formData.components]
    newComponents[index] = { ...newComponents[index], [field]: value }
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
        <div className="grid gap-4 sm:grid-cols-3">
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
          <div className="space-y-2">
            <Label htmlFor="basicSalary">Reference Basic Salary *</Label>
            <Input
              id="basicSalary"
              type="number"
              value={formData.basicSalary || ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0
                setFormData({ ...formData, basicSalary: val })
              }}
              placeholder="e.g., 50000"
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
              <CardTitle className="text-sm">Select Component to Add</CardTitle>
              <CardDescription className="text-xs">Choose an earning component to add to this template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <span className="text-sm font-medium">{component.name}</span>
                  <Badge variant="outline" className="text-xs">{component.category}</Badge>
                </div>
                {component.id !== "basic" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveComponent(component.id)}
                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {component.id === "basic" ? (
                <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
                  Basic Salary is configured as the reference amount at the top.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Calculation Rule</Label>
                    <Select 
                      value={component.isFixed ? "fixed" : "variable"} 
                      onValueChange={(value) => handleComponentChange(index, "isFixed", value === "fixed")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="variable">Percentage-based (% of Basic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {component.isFixed ? (
                    <div className="space-y-2">
                      <Label className="text-xs">Fixed Amount (৳)</Label>
                      <Input
                        type="number"
                        value={component.amount}
                        onChange={(e) => handleComponentChange(index, "amount", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs">Percentage of Basic (%)</Label>
                      <Input
                        type="number"
                        value={component.percentage || 0}
                        onChange={(e) => handleComponentChange(index, "percentage", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">Preview Value</Label>
                    <Input
                      type="text"
                      disabled
                      className="bg-muted/40 cursor-not-allowed text-xs font-semibold"
                      value={component.isFixed ? 
                        `৳${component.amount.toLocaleString()}` : 
                        `৳${Math.round(((formData.basicSalary || 50000) * (component.percentage || 0)) / 100).toLocaleString()}`
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold">Gross Salary:</span>
            <span className="font-bold text-emerald-600 text-lg">৳{totals.earnings.toLocaleString()}</span>
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
