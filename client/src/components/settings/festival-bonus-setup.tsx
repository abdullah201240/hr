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
import { Sparkles, Save, ShieldAlert, BadgeInfo, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import {
  useFestivalBonusSettingsQuery,
  useUpdateFestivalBonusSettingsMutation,
} from "@/hooks/useFestivalBonus"

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
          toast.success("Festival bonus settings updated", {
            icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
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
    if (!newType.trim()) return
    if (eligibleTypes.includes(newType.trim())) return
    setEligibleTypes([...eligibleTypes, newType.trim()])
    setNewType("")
  }

  const handleRemoveType = (typeToRemove: string) => {
    setEligibleTypes(eligibleTypes.filter((t) => t !== typeToRemove))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground mt-2">Loading festival bonus configurations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="border border-border/40 shadow-sm bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/80 via-emerald-500/80 to-amber-500/80 animate-gradient" />
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Festival Bonus Rules Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure legal and compliance rules for annual festival bonus distribution (Clause 7.6.1).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Grid rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bonusesPerYear" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bonuses Per Year
              </Label>
              <Input
                id="bonusesPerYear"
                type="number"
                min={1}
                max={12}
                value={bonusesPerYear}
                onChange={(e) => setBonusesPerYear(Number(e.target.value))}
                className="w-full focus:ring-primary focus:border-primary"
              />
              <span className="text-[10px] text-muted-foreground">Standard compliance specifies Two (2) per year.</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minServiceMonths" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Min Service Period (Months)
              </Label>
              <Input
                id="minServiceMonths"
                type="number"
                min={0}
                max={60}
                value={minServiceMonths}
                onChange={(e) => setMinServiceMonths(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-[10px] text-muted-foreground">Minimum tenure before employee is eligible for bonus calculation.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount Calculation Formula
              </Label>
              <Select value={amountFormula} onValueChange={setAmountFormula}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select formula" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_month_basic">One Month Basic Salary</SelectItem>
                  <SelectItem value="pro_rata_service_months">Pro-rata (Basic Salary × Service Months / 12)</SelectItem>
                  <SelectItem value="earned_festival_bonus">Earned Festival Bonus (Basic Salary × Service Months)</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[10px] text-muted-foreground">Formula used to calculate individual festival payouts.</span>
            </div>

            <div className="space-y-4">
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
            </div>
          </div>

          {/* Eligible types */}
          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Eligible Employee Types
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Permanent, Contract, Probation"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="max-w-xs focus:ring-primary focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddType()
                  }
                }}
              />
              <Button type="button" onClick={handleAddType} variant="secondary">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
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
                  <ShieldAlert className="h-4 w-4" /> No employee types selected. No bonuses will be processed.
                </span>
              )}
            </div>
          </div>

          {/* Formula info banner */}
          <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5 text-primary">
            <BadgeInfo className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">Calculated Earned Festival Bonus Model</p>
              <p className="text-muted-foreground leading-relaxed">
                Service Days = Separation Date &minus; Joining Date. <br />
                Service Months = Service Days &divide; 30. <br />
                Earned Festival Bonus = Basic Salary &times; Service Months.
              </p>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
