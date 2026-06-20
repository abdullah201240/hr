import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileCheck,
  UserCheck,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ArrowRightLeft,
  Coins,
  AlertTriangle,
  Ban,
  Award,
  LogOut,
  ShieldCheck,
} from "lucide-react"

interface LetterTypeConfig {
  id: string
  name: string
  category: "hiring" | "employment" | "discipline" | "exit" | "general"
  icon: any
  color: string
  bgColor: string
  description: string
  templateFields: string[]
}

const letterTypes: LetterTypeConfig[] = [
  {
    id: "offer",
    name: "Offer Letter",
    category: "hiring",
    icon: FileCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Job offer with terms and conditions",
    templateFields: ["designation", "department", "salary", "startDate", "probationPeriod", "benefits"],
  },
  {
    id: "appointment",
    name: "Appointment Letter",
    category: "hiring",
    icon: UserCheck,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    description: "Official appointment confirmation",
    templateFields: ["designation", "department", "salary", "startDate", "reportingManager"],
  },
  {
    id: "confirmation",
    name: "Confirmation Letter",
    category: "employment",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Post-probation employment confirmation",
    templateFields: ["probationStart", "probationEnd", "confirmedDesignation"],
  },
  {
    id: "probation_extension",
    name: "Probation Extension",
    category: "employment",
    icon: Calendar,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Extend probation period",
    templateFields: ["reason", "extensionDuration", "newEndDate"],
  },
  {
    id: "promotion",
    name: "Promotion Letter",
    category: "employment",
    icon: TrendingUp,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    description: "Employee promotion notification",
    templateFields: ["oldDesignation", "newDesignation", "salaryChange", "effectiveDate"],
  },
  {
    id: "transfer",
    name: "Transfer Letter",
    category: "employment",
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    description: "Role or location transfer",
    templateFields: ["fromLocation", "toLocation", "fromRole", "toRole", "effectiveDate"],
  },
  {
    id: "salary_increment",
    name: "Salary Increment",
    category: "employment",
    icon: Coins,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Salary revision notification",
    templateFields: ["currentSalary", "newSalary", "effectiveDate", "incrementPercentage"],
  },
  {
    id: "warning",
    name: "Warning Letter",
    category: "discipline",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Disciplinary warning notice",
    templateFields: ["violationType", "description", "actionRequired", "deadline"],
  },
  {
    id: "termination",
    name: "Termination Letter",
    category: "discipline",
    icon: Ban,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    description: "Employment termination notice",
    templateFields: ["reason", "lastWorkingDay", "severanceDetails"],
  },
  {
    id: "experience",
    name: "Experience Letter",
    category: "exit",
    icon: Award,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    description: "Employment experience certificate",
    templateFields: ["joiningDate", "relievingDate", "designation", "responsibilities"],
  },
  {
    id: "relieving",
    name: "Relieving Letter",
    category: "exit",
    icon: LogOut,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
    description: "Resignation acceptance and relieving",
    templateFields: ["resignationDate", "lastWorkingDay", "noticePeriod"],
  },
  {
    id: "proof_of_employment",
    name: "Proof of Employment",
    category: "general",
    icon: ShieldCheck,
    color: "text-teal-600",
    bgColor: "bg-teal-500/10",
    description: "Employment verification document",
    templateFields: ["designation", "salary", "joiningDate", "employmentType"],
  },
]

const getLetterTypeConfig = (typeId: string): LetterTypeConfig | undefined =>
  letterTypes.find((lt) => lt.id === typeId)

const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case "hiring": return "Hiring & Offers"
    case "employment": return "Employment Terms"
    case "discipline": return "Disciplinary"
    case "exit": return "Separation & Offboarding"
    default: return "General Records"
  }
}

interface LetterCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  employeeOptions: any[]
  onSubmit: (data: any) => Promise<void>
  isPending: boolean
}

export function LetterCreateDialog({
  isOpen,
  onClose,
  employeeOptions,
  onSubmit,
  isPending,
}: LetterCreateDialogProps) {
  const [selectedType, setSelectedType] = useState<string>("")
  const [formEmployeeId, setFormEmployeeId] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formIssueDate, setFormIssueDate] = useState("")
  const [formEffectiveDate, setFormEffectiveDate] = useState("")
  const [formFields, setFormFields] = useState<Record<string, string>>({})
  const [formBody, setFormBody] = useState("")
  const [formStatus, setFormStatus] = useState<"Draft" | "Sent" | "Signed">("Draft")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = () => {
    setSelectedType("")
    setFormEmployeeId("")
    setFormSubject("")
    setFormIssueDate("")
    setFormEffectiveDate("")
    setFormFields({})
    setFormBody("")
    setFormStatus("Draft")
    setErrors({})
  }

  // Pre-fill body template when letter type or employee is selected
  useEffect(() => {
    if (!selectedType) return
    const config = getLetterTypeConfig(selectedType)
    if (!config) return

    const employeeName = employeeOptions.find((e) => e.id === formEmployeeId)?.fullNameEnglish || "[Employee Name]"
    
    let defaultBody = ""
    switch (selectedType) {
      case "offer":
        defaultBody = `Dear ${employeeName},\n\nWe are pleased to offer you employment at Sadoshima Global Corp. Details of your offer are as follows:\n- Designation: ${formFields.designation || "[Designation]"}\n- Salary: ৳${formFields.salary || "[Salary]"}/month\n- Start Date: ${formFields.startDate || "[Start Date]"}\n\nPlease review and sign to confirm your acceptance.`
        break
      case "promotion":
        defaultBody = `Dear ${employeeName},\n\nCongratulations! We are delighted to promote you to the position of ${formFields.newDesignation || "[New Designation]"} effective from ${formFields.effectiveDate || "[Effective Date]"}. Your revised monthly salary will be ৳${formFields.salaryChange || "[Salary]"}.\n\nThank you for your valuable contributions.`
        break
      case "experience":
        defaultBody = `TO WHOM IT MAY CONCERN\n\nThis is to certify that ${employeeName} was employed with us as a ${formFields.designation || "[Designation]"} from ${formFields.joiningDate || "[Joining Date]"} to ${formFields.relievingDate || "[Relieving Date]"}.\n\nDuring their tenure, they demonstrated excellent professional commitment. We wish them success in their future endeavors.`
        break
      case "warning":
        defaultBody = `Dear ${employeeName},\n\nThis warning letter is issued to address the violation regarding ${formFields.violationType || "[Violation Type]"} on record.\n\nDescription: ${formFields.description || "[Description]"}\n\nPlease submit an explanation and rectify this issue by ${formFields.deadline || "[Deadline]"} to avoid formal disciplinary action.`
        break
      default:
        defaultBody = `Dear ${employeeName},\n\nThis letter is to confirm official updates regarding your employment records at Sadoshima Global Corp.\n\nDetails:\n- Reference Field: ${Object.values(formFields)[0] || "Update"}\n- Effective Date: ${formEffectiveDate || "[Date]"}\n\nPlease feel free to contact HR if you have any questions.`
    }
    setFormBody(defaultBody)
  }, [selectedType, formEmployeeId, formFields, formEffectiveDate, employeeOptions])

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    setFormFields({})
    const config = getLetterTypeConfig(typeId)
    if (config) {
      setFormSubject(`Official Correspondence: ${config.name}`)
    }
    if (errors.selectedType) setErrors((prev) => ({ ...prev, selectedType: "" }))
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!selectedType) newErrors.selectedType = "Please select a letter type"
    if (!formEmployeeId) newErrors.formEmployeeId = "Please select a recipient employee"
    if (!formSubject.trim()) newErrors.formSubject = "Subject is required"
    if (!formIssueDate) newErrors.formIssueDate = "Issue date is required"
    if (!formEffectiveDate) newErrors.formEffectiveDate = "Effective date is required"
    if (!formBody.trim()) newErrors.formBody = "Letter content body is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const employee = employeeOptions.find((e) => e.id === formEmployeeId)
    await onSubmit({
      employeeId: formEmployeeId,
      employeeName: employee?.fullNameEnglish || "",
      employeeEmail: employee?.email || "",
      type: selectedType,
      subject: formSubject,
      issueDate: formIssueDate,
      effectiveDate: formEffectiveDate,
      body: formBody,
      fields: formFields,
      status: formStatus,
    })

    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetForm() } }}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-6xl max-h-[90vh] overflow-y-auto text-xs">
        <DialogHeader>
          <DialogTitle>Create HR Letter</DialogTitle>
          <DialogDescription>
            Select a letter type and fill in the details to generate an HR letter
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmitForm} className="space-y-5">
          {/* Letter Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Letter Type *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {letterTypes.map((lt) => {
                const Icon = lt.icon
                return (
                  <button
                    key={lt.id}
                    type="button"
                    onClick={() => handleTypeSelect(lt.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      selectedType === lt.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg ${lt.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${lt.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{lt.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{getCategoryLabel(lt.category)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {errors.selectedType && (
              <p className="text-[10px] text-destructive mt-0.5">{errors.selectedType}</p>
            )}
          </div>

          {selectedType && (
            <>
              {/* Employee + Subject */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Employee Name *</Label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => {
                      setFormEmployeeId(e.target.value)
                      if (errors.formEmployeeId) setErrors(prev => ({ ...prev, formEmployeeId: "" }))
                    }}
                    required
                    className="w-full bg-background border border-border hover:border-primary transition-colors text-xs h-9 rounded-md px-2"
                  >
                    <option value="">Select Employee</option>
                    {employeeOptions.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullNameEnglish} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                  {errors.formEmployeeId && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors.formEmployeeId}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Subject *</Label>
                  <Input
                    placeholder="Letter subject"
                    value={formSubject}
                    onChange={(e) => {
                      setFormSubject(e.target.value)
                      if (errors.formSubject) setErrors(prev => ({ ...prev, formSubject: "" }))
                    }}
                    required
                    className="text-xs"
                  />
                  {errors.formSubject && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors.formSubject}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Issue Date *</Label>
                  <Input
                    type="date"
                    value={formIssueDate}
                    onChange={(e) => {
                      setFormIssueDate(e.target.value)
                      if (errors.formIssueDate) setErrors(prev => ({ ...prev, formIssueDate: "" }))
                    }}
                    required
                    className="text-xs"
                  />
                  {errors.formIssueDate && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors.formIssueDate}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Effective Date *</Label>
                  <Input
                    type="date"
                    value={formEffectiveDate}
                    onChange={(e) => {
                      setFormEffectiveDate(e.target.value)
                      if (errors.formEffectiveDate) setErrors(prev => ({ ...prev, formEffectiveDate: "" }))
                    }}
                    required
                    className="text-xs"
                  />
                  {errors.formEffectiveDate && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors.formEffectiveDate}</p>
                  )}
                </div>
              </div>

              {/* Dynamic Fields based on letter type */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Letter Details</Label>
                <div className="grid gap-3 sm:grid-cols-2 p-3 rounded-lg border border-border/50 bg-muted/10">
                  {getLetterTypeConfig(selectedType)?.templateFields.map((field) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground font-medium capitalize">
                        {field.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                      <Input
                        placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").trim().toLowerCase()}`}
                        value={formFields[field] || ""}
                        onChange={(e) => setFormFields({ ...formFields, [field]: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Letter Body */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Letter Body *</Label>
                <Textarea
                  placeholder="Enter letter content..."
                  value={formBody}
                  onChange={(e) => {
                    setFormBody(e.target.value)
                    if (errors.formBody) setErrors(prev => ({ ...prev, formBody: "" }))
                  }}
                  required
                  className="text-xs min-h-[120px] resize-y"
                />
                {errors.formBody && (
                  <p className="text-[10px] text-destructive mt-0.5">{errors.formBody}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as any)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Signed">Signed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); resetForm() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedType || isPending}>
              {isPending ? "Creating..." : "Create Letter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
