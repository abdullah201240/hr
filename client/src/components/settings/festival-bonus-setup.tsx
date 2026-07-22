import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sparkles,
  Save,
  ShieldAlert,
  BadgeInfo,
  CalendarHeart,
  Clock3,
  UserCheck,
  Loader2,
  Plus,
  Trash2,
  Percent,
  Coins,
  Activity,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  useFestivalBonusSettingsQuery,
  useUpdateFestivalBonusSettingsMutation,
} from "@/hooks/useFestivalBonus"

const FORMULA_LABELS: Record<string, string> = {
  one_month_basic: "Flat Salary Base",
  pro_rata_service_months: "Legacy Pro-rata",
  earned_festival_bonus: "Legacy Earned Bonus",
  prorated_service: "Prorated Service-Based",
  tiered_ranges: "Tiered Tenure Ranges",
}

export function FestivalBonusSetup() {
  const { data: settings, isLoading } = useFestivalBonusSettingsQuery()
  const updateMutation = useUpdateFestivalBonusSettingsMutation()

  // Form states
  const [bonusesPerYear, setBonusesPerYear] = useState<number>(2)
  const [minServiceMonths, setMinServiceMonths] = useState<number>(6)
  const [amountFormula, setAmountFormula] = useState<string>("one_month_basic")
  const [salaryComponent, setSalaryComponent] = useState<string>("basic")
  const [prorataFullServiceMonths, setProrataFullServiceMonths] = useState<number>(12)
  const [tierRules, setTierRules] = useState<Array<{ minMonths: number; maxMonths: number | null; percentage: number }>>([])

  const [allowSpecialApproval, setAllowSpecialApproval] = useState<boolean>(true)
  const [newType, setNewType] = useState<string>("")
  const [eligibleTypes, setEligibleTypes] = useState<string[]>(["Permanent"])

  // Range editor states
  const [newMinMonths, setNewMinMonths] = useState<number>(6)
  const [newMaxMonths, setNewMaxMonths] = useState<number | "">(12)
  const [newPercentage, setNewPercentage] = useState<number>(50)

  // Test Calculator States (Live Preview)
  const [testTenure, setTestTenure] = useState<number>(7)
  const [testBasicSalary, setTestBasicSalary] = useState<number>(50000)

  useEffect(() => {
    if (settings) {
      setBonusesPerYear(settings.bonusesPerYear)
      setMinServiceMonths(settings.minServiceMonths)
      setAmountFormula(settings.amountFormula)
      setSalaryComponent(settings.salaryComponent || "basic")
      setProrataFullServiceMonths(settings.prorataFullServiceMonths || 12)
      setTierRules(settings.tierRules || [])
      setAllowSpecialApproval(settings.allowSpecialApproval)
      setEligibleTypes(settings.eligibleEmployeeTypes || [])
    }
  }, [settings])

  const handleSave = () => {
    updateMutation.mutate(
      {
        bonusesPerYear,
        minServiceMonths,
        amountFormula,
        salaryComponent,
        prorataFullServiceMonths,
        tierRules,
        allowSpecialApproval,
        eligibleEmployeeTypes: eligibleTypes,
      },
      {
        onSuccess: () => {
          toast.success("Festival bonus settings saved!", {
            description: "Rules configuration applied successfully.",
          })
        },
        onError: (err) => {
          toast.error(err.message || "Failed to save settings")
        },
      }
    )
  }

  const handleAddType = () => {
    const trimmed = newType.trim()
    if (!trimmed) return
    if (eligibleTypes.includes(trimmed)) {
      setNewType("")
      return
    }
    setEligibleTypes([...eligibleTypes, trimmed])
    setNewType("")
  }

  const handleRemoveType = (typeToRemove: string) => {
    setEligibleTypes(eligibleTypes.filter((t) => t !== typeToRemove))
  }

  // Manage custom range rules
  const handleAddTierRule = () => {
    if (newMinMonths < 0) {
      toast.error("Min months cannot be negative")
      return
    }
    if (newMaxMonths !== "" && Number(newMaxMonths) <= newMinMonths) {
      toast.error("Max months must be greater than min months")
      return
    }
    if (newPercentage < 0 || newPercentage > 200) {
      toast.error("Percentage should be between 0 and 200")
      return
    }

    const newRule = {
      minMonths: newMinMonths,
      maxMonths: newMaxMonths === "" ? null : Number(newMaxMonths),
      percentage: newPercentage,
    }

    // Sort rules by minMonths ascending
    const updatedRules = [...tierRules, newRule].sort((a, b) => a.minMonths - b.minMonths)
    setTierRules(updatedRules)

    // Reset default helper values
    setNewMinMonths(0)
    setNewMaxMonths("")
    setNewPercentage(100)
    toast.success("Tenure range rule added!")
  }

  const handleRemoveTierRule = (index: number) => {
    setTierRules(tierRules.filter((_, i) => i !== index))
  }

  // Simulated live preview calculator logic
  const testGrossSalary = useMemo(() => {
    // Gross = Basic + HRA (20%) + Transport (10%) + Medical (5%)
    return Math.round(testBasicSalary * 1.35)
  }, [testBasicSalary])

  const previewAmount = useMemo(() => {
    const baseVal = salaryComponent === "gross" ? testGrossSalary : testBasicSalary

    if (amountFormula === "one_month_basic") {
      return baseVal
    } else if (amountFormula === "pro_rata_service_months") {
      return Math.round(baseVal * (Math.min(12, testTenure) / 12))
    } else if (amountFormula === "earned_festival_bonus") {
      return Math.round(baseVal * testTenure)
    } else if (amountFormula === "prorated_service") {
      const full = prorataFullServiceMonths || 12
      return Math.round((baseVal / full) * Math.min(testTenure, full))
    } else if (amountFormula === "tiered_ranges") {
      const match = tierRules.find(
        (r) =>
          testTenure >= r.minMonths &&
          (r.maxMonths === null || r.maxMonths === undefined || testTenure < r.maxMonths)
      )
      if (match) {
        return Math.round(baseVal * (match.percentage / 100))
      }
      return 0
    }
    return 0
  }, [testBasicSalary, testGrossSalary, testTenure, amountFormula, salaryComponent, prorataFullServiceMonths, tierRules])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading festival bonus settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── KPI Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bonuses / Year</span>
            <p className="text-3xl font-bold tracking-tight">{bonusesPerYear}</p>
            <p className="text-[10px] text-muted-foreground">Frequency per annum</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center">
            <CalendarHeart className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Min Eligibility</span>
            <p className="text-3xl font-bold tracking-tight">
              {minServiceMonths}
              <span className="text-base font-semibold text-muted-foreground ml-1">mo</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Minimum tenure</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-500 flex items-center justify-center">
            <Clock3 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base Component</span>
            <p className="text-3xl font-bold tracking-tight capitalize">{salaryComponent}</p>
            <p className="text-[10px] text-muted-foreground">Component for payouts</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-500 flex items-center justify-center">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Formula</span>
            <p className="text-lg font-bold tracking-tight mt-1 line-clamp-1">{FORMULA_LABELS[amountFormula] || amountFormula}</p>
            <p className="text-[10px] text-muted-foreground">Current model applied</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ─── Main Grid ─── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Configuration Form (7/12 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-none border border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                Bonus Rules Configuration
              </CardTitle>
              <CardDescription>Setup rules, frequency, calculation options, and exclusions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Frequency and Basic Eligibility */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bonusesPerYear" className="text-xs font-semibold">
                    Bonuses Per Year
                  </Label>
                  <Input
                    id="bonusesPerYear"
                    type="number"
                    min={1}
                    max={12}
                    value={bonusesPerYear}
                    onChange={(e) => setBonusesPerYear(Number(e.target.value))}
                    className="h-10"
                  />
                  <p className="text-[10px] text-muted-foreground">Standard compliance specifies 2 bonuses per year.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="minServiceMonths" className="text-xs font-semibold">
                    Min Service Period (Months)
                  </Label>
                  <Input
                    id="minServiceMonths"
                    type="number"
                    min={0}
                    max={60}
                    value={minServiceMonths}
                    onChange={(e) => setMinServiceMonths(Number(e.target.value))}
                    className="h-10"
                  />
                  <p className="text-[10px] text-muted-foreground">Minimum months required for bonus eligibility.</p>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Salary Component selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Bonus Salary Basis Component</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSalaryComponent("basic")}
                    className={cn(
                      "p-3 rounded-xl border border-border/60 flex flex-col gap-1 cursor-pointer transition-all duration-200 select-none hover:bg-muted/10",
                      salaryComponent === "basic"
                        ? "border-primary bg-primary/5 shadow-sm text-primary"
                        : "text-foreground"
                    )}
                  >
                    <span className="text-xs font-bold">Basic Salary</span>
                    <span className="text-[9px] text-muted-foreground">Calculations use basic salary component only</span>
                  </div>
                  <div
                    onClick={() => setSalaryComponent("gross")}
                    className={cn(
                      "p-3 rounded-xl border border-border/60 flex flex-col gap-1 cursor-pointer transition-all duration-200 select-none hover:bg-muted/10",
                      salaryComponent === "gross"
                        ? "border-primary bg-primary/5 shadow-sm text-primary"
                        : "text-foreground"
                    )}
                  >
                    <span className="text-xs font-bold">Gross / Total Salary</span>
                    <span className="text-[9px] text-muted-foreground">Calculations use full gross salary base</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Amount Formula selection */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Calculation Formula / Model</Label>
                <Select value={amountFormula} onValueChange={setAmountFormula}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select calculation model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_month_basic">Flat Salary Payout (1 Month component value)</SelectItem>
                    <SelectItem value="prorated_service">Prorated Service-Based (Prorated up to N months)</SelectItem>
                    <SelectItem value="tiered_ranges">Tiered Tenure Ranges (Custom rules list)</SelectItem>
                    <SelectItem value="pro_rata_service_months">Legacy Pro-rata (Basic × Months / 12)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Choose the active model to compute individual festival bonus amounts.</p>
              </div>

              {/* Dynamic Sub-forms based on active formula */}
              {amountFormula === "prorated_service" && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02] space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <BadgeInfo className="h-4 w-4" /> Proration Parameters
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-primary/5 border-primary/20 text-primary">Active</Badge>
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <Label htmlFor="prorataFullMonths" className="text-xs font-semibold">Service Months for 100% Payout</Label>
                    <Input
                      id="prorataFullMonths"
                      type="number"
                      min={1}
                      max={60}
                      value={prorataFullServiceMonths}
                      onChange={(e) => setProrataFullServiceMonths(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                    <p className="text-[9px] text-muted-foreground">Tenure months required to receive the full 100% bonus (typically 12 months).</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground/80 leading-relaxed bg-background/50 p-2.5 rounded-lg border border-border/20">
                    <strong>Prorate Formula:</strong> <br />
                    <code>( {salaryComponent === "gross" ? "Gross Salary" : "Basic Salary"} &divide; {prorataFullServiceMonths} ) &times; Min(Service Months, {prorataFullServiceMonths})</code>
                  </div>
                </div>
              )}

              {amountFormula === "tiered_ranges" && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02] space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Percent className="h-4 w-4" /> Custom Tenure Ranges Rules
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-primary/5 border-primary/20 text-primary">Active</Badge>
                  </div>

                  {/* Add Range Inline Form */}
                  <div className="grid grid-cols-3 gap-2.5 items-end bg-background/60 p-3 rounded-lg border border-border/30">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Min Months</Label>
                      <Input
                        type="number"
                        min={0}
                        value={newMinMonths}
                        onChange={(e) => setNewMinMonths(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Max Months (or empty)</Label>
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        value={newMaxMonths}
                        onChange={(e) => setNewMaxMonths(e.target.value === "" ? "" : Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Payout Percentage (%)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={200}
                          value={newPercentage}
                          onChange={(e) => setNewPercentage(Number(e.target.value))}
                          className="h-8 text-xs flex-1"
                        />
                        <Button onClick={handleAddTierRule} size="sm" type="button" className="h-8 px-2 shrink-0">
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Ranges List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Configured Ranges</span>
                    <div className="border border-border/40 rounded-lg overflow-hidden bg-background">
                      {tierRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/20 last:border-b-0 text-xs hover:bg-muted/10">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">
                              {rule.minMonths} {rule.maxMonths === null ? "or more" : `to ${rule.maxMonths}`} months
                            </span>
                            <span className="text-muted-foreground">&mdash;</span>
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {rule.percentage}% of {salaryComponent}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => handleRemoveTierRule(idx)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {tierRules.length === 0 && (
                        <div className="p-6 text-center text-xs text-muted-foreground/60 italic">
                          No range rules configured. Click the plus button above to add one.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Separator className="bg-border/30" />

              {/* Special Approval Clause */}
              <div className="flex items-center justify-between border border-border/40 p-4 rounded-xl bg-muted/10">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-xs font-bold text-foreground">Special Approval Clause</Label>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Allow management to grant manual exceptions or overrides for employees below the minimum service tenure limit.
                  </p>
                </div>
                <Switch checked={allowSpecialApproval} onCheckedChange={setAllowSpecialApproval} />
              </div>

              {/* Save Settings Action Button */}
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="w-full gap-2 h-11 text-xs font-semibold shadow-sm transition-all duration-200 mt-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Rules Configuration
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Eligible types + Live Calculator (5/12 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Employee Types Card */}
          <Card className="shadow-none border border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5 text-primary" />
                Eligible Employee Categories
              </CardTitle>
              <CardDescription>Qualify specific hiring groups for festival bonuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Permanent, Probation, Contractual"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="h-10 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddType()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddType} variant="secondary" className="gap-1 shrink-0 h-10 text-xs font-semibold">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 min-h-[2rem]">
                {eligibleTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-lg">
                    {type}
                    <button
                      type="button"
                      onClick={() => handleRemoveType(type)}
                      className="text-muted-foreground hover:text-rose-500 transition-colors ml-0.5"
                    >
                      &times;
                    </button>
                  </Badge>
                ))}
                {eligibleTypes.length === 0 && (
                  <span className="text-xs text-rose-500 font-medium flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4" /> No employee types configured. No bonuses will be computed.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Real-time UX Calculator Preview */}
          <Card className="shadow-none border border-border/40 bg-muted/[0.04]">
            <CardHeader className="pb-3 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BadgeInfo className="h-4.5 w-4.5 text-primary animate-pulse" />
                    Live Calculation Calculator
                  </CardTitle>
                  <CardDescription className="text-[10px]">Test your active configuration logic in real-time</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-wider">Interactive</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Test Basic Salary</Label>
                  <Input
                    type="number"
                    step={1000}
                    value={testBasicSalary}
                    onChange={(e) => setTestBasicSalary(Number(e.target.value))}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Service Tenure (Months)</Label>
                  <Input
                    type="number"
                    step={0.5}
                    value={testTenure}
                    onChange={(e) => setTestTenure(Number(e.target.value))}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-background/50 p-4 space-y-3.5 text-xs">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground/80">
                  <span>Selected component base:</span>
                  <span className="font-semibold capitalize text-foreground">{salaryComponent} Salary</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground/80">
                  <span>Basic / Gross Value:</span>
                  <span className="font-semibold text-foreground">
                    {testBasicSalary.toLocaleString()} / {testGrossSalary.toLocaleString()} BDT
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground/80">
                  <span>Tenure input:</span>
                  <span className="font-semibold text-foreground">{testTenure} Months</span>
                </div>

                <Separator className="bg-border/30" />

                <div className="space-y-1 bg-primary/[0.03] p-3 rounded-lg border border-primary/10">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground text-xs">Calculated Bonus Payout:</span>
                    <span className="font-bold text-primary text-base">{previewAmount.toLocaleString()} BDT</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground italic mt-0.5">
                    {testTenure < minServiceMonths ? (
                      <span className="text-rose-500 font-semibold flex items-center gap-0.5">
                        <ShieldAlert className="h-3 w-3" /> Ineligible: Below min service requirement ({minServiceMonths} mo)
                      </span>
                    ) : (
                      "Tenure eligibility checked & passed"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
