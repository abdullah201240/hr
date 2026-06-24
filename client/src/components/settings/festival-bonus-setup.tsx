import { useState, useEffect } from "react"
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
  ShieldCheck,
  Loader2,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  useFestivalBonusSettingsQuery,
  useUpdateFestivalBonusSettingsMutation,
} from "@/hooks/useFestivalBonus"

const FORMULA_LABELS: Record<string, string> = {
  one_month_basic: "One Month Basic",
  pro_rata_service_months: "Pro-rata Service",
  earned_festival_bonus: "Earned Bonus",
}

export function FestivalBonusSetup() {
  const { data: settings, isLoading } = useFestivalBonusSettingsQuery()
  const updateMutation = useUpdateFestivalBonusSettingsMutation()

  // Form states
  const [bonusesPerYear, setBonusesPerYear] = useState<number>(2)
  const [minServiceMonths, setMinServiceMonths] = useState<number>(6)
  const [amountFormula, setAmountFormula] = useState<string>("one_month_basic")
  const [allowSpecialApproval, setAllowSpecialApproval] = useState<boolean>(true)
  const [newType, setNewType] = useState<string>("")
  const [eligibleTypes, setEligibleTypes] = useState<string[]>(["Permanent"])

  useEffect(() => {
    if (settings) {
      setBonusesPerYear(settings.bonusesPerYear)
      setMinServiceMonths(settings.minServiceMonths)
      setAmountFormula(settings.amountFormula)
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
            <p className="text-[10px] text-muted-foreground">Annual payouts</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center">
            <CalendarHeart className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Min Service</span>
            <p className="text-3xl font-bold tracking-tight">{minServiceMonths}<span className="text-base font-semibold text-muted-foreground ml-1">mo</span></p>
            <p className="text-[10px] text-muted-foreground">Eligibility tenure</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-500 flex items-center justify-center">
            <Clock3 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Special Approval</span>
            <p className="text-3xl font-bold tracking-tight">{allowSpecialApproval ? "On" : "Off"}</p>
            <p className="text-[10px] text-muted-foreground">Manual exceptions</p>
          </div>
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              allowSpecialApproval
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                : "bg-muted text-muted-foreground"
            )}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eligible Types</span>
            <p className="text-3xl font-bold tracking-tight">{eligibleTypes.length}</p>
            <p className="text-[10px] text-muted-foreground">{eligibleTypes.join(", ") || "None"}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-500 flex items-center justify-center">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ─── Main Grid ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Rules Configuration */}
        <Card className="shadow-none border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-primary" />
              Bonus Rules Configuration
            </CardTitle>
            <CardDescription>Define payout frequency, eligibility, and calculation method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
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
                <p className="text-[10px] text-muted-foreground">Standard compliance specifies two (2) per year.</p>
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
                <p className="text-[10px] text-muted-foreground">Minimum tenure before eligibility.</p>
              </div>
            </div>

            <Separator className="bg-border/30" />

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Amount Calculation Formula</Label>
              <Select value={amountFormula} onValueChange={setAmountFormula}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select formula" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_month_basic">One Month Basic Salary</SelectItem>
                  <SelectItem value="pro_rata_service_months">Pro-rata (Basic × Service Months / 12)</SelectItem>
                  <SelectItem value="earned_festival_bonus">Earned Festival Bonus (Basic × Service Months)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Formula used to calculate individual festival payouts.</p>
            </div>

            <Separator className="bg-border/30" />

            <div className="flex items-center justify-between border border-border/40 p-4 rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Special Approval Clause</Label>
                <p className="text-[10px] text-muted-foreground">
                  Allow manual exceptions for employees with service &lt; 6 months.
                </p>
              </div>
              <Switch
                checked={allowSpecialApproval}
                onCheckedChange={setAllowSpecialApproval}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full gap-2 h-10 mt-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Right: Eligible Types + Calculation Model */}
        <div className="space-y-6">
          <Card className="shadow-none border border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5 text-primary" />
                Eligible Employee Types
              </CardTitle>
              <CardDescription>Choose which employee categories qualify for festival bonuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Permanent, Contract, Probation"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddType()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddType} variant="secondary" className="gap-1 shrink-0">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 min-h-[2rem]">
                {eligibleTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1.5 px-3 py-1 text-xs">
                    {type}
                    <button
                      type="button"
                      onClick={() => handleRemoveType(type)}
                      className="text-muted-foreground hover:text-rose-500 transition-colors"
                    >
                      &times;
                    </button>
                  </Badge>
                ))}
                {eligibleTypes.length === 0 && (
                  <span className="text-xs text-rose-500 font-medium flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4" /> No employee types selected — no bonuses will be processed.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border border-border/40 bg-muted/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BadgeInfo className="h-4 w-4 text-primary" />
                Calculation Model
              </CardTitle>
              <CardDescription>How the earned festival bonus is derived</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-primary/20 pl-4 space-y-4 text-xs">
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="font-bold text-foreground">Service Days</p>
                  <p className="text-muted-foreground mt-0.5">Separation Date &minus; Joining Date</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="font-bold text-foreground">Service Months</p>
                  <p className="text-muted-foreground mt-0.5">Service Days &divide; 30</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="font-bold text-foreground">Earned Festival Bonus</p>
                  <p className="text-muted-foreground mt-0.5">Basic Salary &times; Service Months</p>
                </div>
              </div>

              <Separator className="bg-border/30 my-4" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Formula</span>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">
                  {FORMULA_LABELS[amountFormula] ?? amountFormula}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
