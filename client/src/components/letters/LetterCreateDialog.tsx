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

import { useDepartmentOptionsQuery } from "@/hooks/useDepartments"
import { useDesignationOptionsQuery } from "@/hooks/useDesignations"
import { useEmployeeQuery } from "@/hooks/useEmployees"

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
    templateFields: ["presentAddress", "designation", "department", "employmentType", "reportingTo", "dutyStation", "proposedJoiningDate", "monthlyGrossSalary", "offerExpiryDate"],
  },
  {
    id: "appointment",
    name: "Appointment Letter",
    category: "hiring",
    icon: UserCheck,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    description: "Official appointment confirmation",
    templateFields: ["presentAddress", "designation", "department", "startDate", "offerLetterDate", "reportingManager", "officeLocation", "salary"],
  },
  {
    id: "confirmation",
    name: "Confirmation Letter",
    category: "employment",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Post-probation employment confirmation",
    templateFields: ["confirmedDesignation", "department", "reportingTo", "workLocation"],
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
    templateFields: ["currentDesignation", "newDesignation", "currentGrade", "newGrade", "currentReportingTo", "newReportingTo", "currentGrossSalary", "revGrossSalary", "revBasic", "revHouseRent", "revMedical", "revConveyance", "revOtherAllowance"],
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
    name: "Salary Revision",
    category: "employment",
    icon: Coins,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Salary revision notification",
    templateFields: ["reasonForRevision", "prevBasic", "revBasic", "prevHouseRent", "revHouseRent", "prevMedical", "revMedical", "prevConveyance", "revConveyance", "prevOtherAllowance", "revOtherAllowance", "prevGross", "revGross"],
  },
  {
    id: "warning",
    name: "Show Cause Notice",
    category: "discipline",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Disciplinary show cause notice",
    templateFields: ["incidentDate", "incidentLocation", "relevantPolicy", "description", "deadline"],
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
    name: "Resignation Acceptance",
    category: "exit",
    icon: LogOut,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
    description: "Resignation acceptance and relieving",
    templateFields: ["resignationDate", "noticePeriod", "lastWorkingDay", "reasonForLeaving", "reportingManager"],
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
  {
    id: "inquiry_committee",
    name: "Inquiry Committee Appointment",
    category: "discipline",
    icon: ShieldCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Inquiry committee appointment letter",
    templateFields: ["committeeMemberDesignation", "accusedEmployeeName", "accusedEmployeeId", "briefAllegation", "committeeChair", "committeeMembers", "reportDueDate"],
  },
  {
    id: "domestic_inquiry",
    name: "Domestic Inquiry Notice",
    category: "discipline",
    icon: ShieldCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Notice to attend domestic inquiry",
    templateFields: ["explanationDate", "incidentDate", "incidentLocation", "summaryOfAllegation", "inquiryDate", "inquiryTime", "inquiryVenue", "inquiryOfficer"],
  },
  {
    id: "suspension",
    name: "Suspension Pending Investigation",
    category: "discipline",
    icon: Ban,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Suspension pending investigation letter",
    templateFields: ["incidentDate", "natureOfAllegation", "reasonForSuspension"],
  },
  {
    id: "final_warning",
    name: "Final Written Warning",
    category: "discipline",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Final written warning letter",
    templateFields: ["previousWarningDate", "incidentDate", "incidentLocation", "description", "verbalCounselingDate", "firstWarningDate", "employeeExplanationDate", "policyViolated"],
  },
  {
    id: "first_warning",
    name: "First Written Warning",
    category: "discipline",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "First written warning letter",
    templateFields: ["incidentDate", "incidentLocation", "description", "previousCounseling", "policyBreach"],
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
  letterToEdit?: any
}

export function LetterCreateDialog({
  isOpen,
  onClose,
  employeeOptions,
  onSubmit,
  isPending,
  letterToEdit,
}: LetterCreateDialogProps) {
  const [selectedType, setSelectedType] = useState<string>("")
  const [formEmployeeId, setFormEmployeeId] = useState("")
  const [formEmployeeName, setFormEmployeeName] = useState("")
  const [formEmployeeEmail, setFormEmployeeEmail] = useState("")
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [showManagerDropdown, setShowManagerDropdown] = useState(false)
  const [formSignatoryId, setFormSignatoryId] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formIssueDate, setFormIssueDate] = useState("")
  const [formEffectiveDate, setFormEffectiveDate] = useState("")
  const [formFields, setFormFields] = useState<Record<string, string>>({})
  const [formBody, setFormBody] = useState("")
  const [formStatus, setFormStatus] = useState<"Draft" | "Sent" | "Signed">("Draft")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: departments = [] } = useDepartmentOptionsQuery()
  const { data: designations = [] } = useDesignationOptionsQuery()
  const { data: employeeDetails } = useEmployeeQuery(formEmployeeId)

  // Autofill fields when employee is selected
  useEffect(() => {
    if (employeeDetails && !letterToEdit) {
      setFormFields((prev) => ({
        ...prev,
        department: employeeDetails.departmentName || "",
        designation: employeeDetails.designationName || "",
        presentAddress: employeeDetails.currentAddress || "",
        startDate: employeeDetails.joinDate ? new Date(employeeDetails.joinDate).toISOString().split('T')[0] : "",
      }))
    }
  }, [employeeDetails, letterToEdit])

  const resetForm = () => {
    setSelectedType("")
    setFormEmployeeId("")
    setFormEmployeeName("")
    setFormEmployeeEmail("")
    setShowEmployeeDropdown(false)
    setShowManagerDropdown(false)
    setFormSignatoryId("")
    setFormSubject("")
    setFormIssueDate("")
    setFormEffectiveDate("")
    setFormFields({})
    setFormBody("")
    setFormStatus("Draft")
    setErrors({})
  }

  // Pre-fill form when editing an existing letter
  useEffect(() => {
    if (isOpen) {
      if (letterToEdit) {
        setSelectedType(letterToEdit.type || "")
        setFormEmployeeId(letterToEdit.employeeId || "")
        setFormEmployeeName(letterToEdit.employeeName || "")
        setFormEmployeeEmail(letterToEdit.employeeEmail || "")
        setFormSubject(letterToEdit.subject || "")
        setFormIssueDate(letterToEdit.issueDate ? new Date(letterToEdit.issueDate).toISOString().split('T')[0] : "")
        setFormEffectiveDate(letterToEdit.effectiveDate ? new Date(letterToEdit.effectiveDate).toISOString().split('T')[0] : "")
        setFormFields(letterToEdit.fields || {})
        setFormBody(letterToEdit.body || "")
        setFormStatus(letterToEdit.status || "Draft")
        if (letterToEdit.fields?.signatoryName) {
          const sig = employeeOptions.find(o => o.fullNameEnglish === letterToEdit.fields.signatoryName)
          if (sig) setFormSignatoryId(sig.id)
        }
      } else {
        resetForm()
      }
    }
  }, [isOpen, letterToEdit, employeeOptions])

  // Pre-fill body template when letter type or employee is selected
  useEffect(() => {
    if (letterToEdit) return
    if (!selectedType) return
    const config = getLetterTypeConfig(selectedType)
    if (!config) return

    const employeeName = formEmployeeName || "[Employee Name]"
    
    let defaultBody = ""
    switch (selectedType) {
      case "offer":
        defaultBody = `Following the selection process and our subsequent discussions, we are pleased to offer you employment with Sadoshima Corporation – Bangladesh Liaison Office for the position of ${formFields.designation || "[Designation]"}.`
        break
      case "appointment":
        defaultBody = `We are pleased to appoint you as ${formFields.designation || "[Designation]"} in the ${formFields.department || "[Department Name]"} of Sadoshima Corporation – Bangladesh Liaison Office effective from ${formFields.startDate || "[Joining Date]"}. Your appointment is made based on your acceptance of our Offer Letter dated ${formFields.offerLetterDate || "[Offer Letter Date]"} and is governed by the following terms and conditions.`
        break
      case "confirmation":
        defaultBody = `We are pleased to inform you that, following the successful completion of your probationary period and a satisfactory performance evaluation, your employment with Sadoshima Corporation – Bangladesh Liaison Office is hereby confirmed.`
        break
      case "promotion":
        defaultBody = `Dear ${employeeName},\n\nCongratulations! We are delighted to promote you to the position of ${formFields.newDesignation || "[New Designation]"} effective from ${formFields.effectiveDate || "[Effective Date]"}. Your revised monthly salary will be ৳${formFields.salaryChange || "[Salary]"}.\n\nThank you for your valuable contributions.`
        break
      case "experience":
        defaultBody = `TO WHOM IT MAY CONCERN\n\nThis is to certify that ${employeeName} was employed with us as a ${formFields.designation || "[Designation]"} from ${formFields.joiningDate || "[Joining Date]"} to ${formFields.relievingDate || "[Relieving Date]"}.\n\nDuring their tenure, they demonstrated excellent professional commitment. We wish them success in their future endeavors.`
        break
      case "relieving":
        defaultBody = `We acknowledge receipt of your resignation letter dated ${formFields.resignationDate || "[Resignation Date]"}. After due consideration, Management has accepted your resignation from the position of ${formFields.designation || "[Designation]"} with effect from ${formFields.lastWorkingDay || "[Last Working Date]"}.`
        break
      case "inquiry_committee":
        defaultBody = `You are hereby appointed as the Inquiry Officer / a member of the Inquiry Committee to conduct a domestic inquiry regarding the alleged misconduct involving ${formFields.accusedEmployeeName || "[Employee Name]"}, Employee ID ${formFields.accusedEmployeeId || "[ID]"}.`
        break
      case "domestic_inquiry":
        defaultBody = `Following the preliminary investigation into the alleged misconduct and after consideration of your written explanation dated ${formFields.explanationDate ? new Date(formFields.explanationDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "[Explanation Date]"} (or your failure to submit an explanation within the stipulated time), Management has decided to conduct a Domestic Inquiry to determine the facts of the matter before any disciplinary decision is made.`
        break
      case "suspension":
        defaultBody = `Following a preliminary assessment of an alleged incident that may constitute serious misconduct, the Company has decided to place you under suspension pending completion of an investigation and/or domestic inquiry. This action is administrative in nature and shall not be construed as a finding of guilt.`
        break
      case "final_warning":
        defaultBody = `Despite previous counseling and/or the First Written Warning issued on ${formFields.previousWarningDate ? new Date(formFields.previousWarningDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "[Date]"}, it has been observed that satisfactory improvement has not been achieved, or a similar incident has reoccurred. Accordingly, this letter serves as your Final Written Warning.`
        break
      case "first_warning":
        defaultBody = `This letter serves as a First Written Warning regarding the matter described below.`
        break
      case "warning":
        defaultBody = `It has been reported that you were allegedly involved in the following incident(s), which, if established, may constitute misconduct and/or a breach of the Company's HR Policy, Code of Conduct and/or your terms of employment.`
        break
      case "promotion":
        defaultBody = `We are pleased to inform you that, in recognition of your performance, commitment, and contribution to Sadoshima Corporation, Management has approved your promotion and revision of compensation with effect from ${formEffectiveDate ? new Date(formEffectiveDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "[Effective Date]"}.`
        break
      case "salary_increment":
        defaultBody = `We are pleased to inform you that Management has approved a revision of your monthly salary in recognition of ${formFields.reasonForRevision || "[Annual Performance / Exceptional Performance / Market Salary Adjustment / Retention / Special Achievement / Other]"}. The revised salary shall be effective from ${formEffectiveDate ? new Date(formEffectiveDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "[Effective Date]"}.`
        break
      default:
        defaultBody = `Dear ${employeeName},\n\nThis letter is to confirm official updates regarding your employment records at Sadoshima Global Corp.\n\nDetails:\n- Reference Field: ${Object.values(formFields)[0] || "Update"}\n- Effective Date: ${formEffectiveDate || "[Date]"}\n\nPlease feel free to contact HR if you have any questions.`
    }
    setFormBody(defaultBody)
  }, [selectedType, formEmployeeName, formFields, formEffectiveDate, letterToEdit])

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    setFormFields({})
    const config = getLetterTypeConfig(typeId)
    if (config) {
      if (typeId === "relieving") {
        setFormSubject("Acceptance of Resignation")
      } else if (typeId === "confirmation") {
        setFormSubject("Confirmation of Employment")
      } else if (typeId === "offer") {
        setFormSubject("Offer of Employment")
      } else if (typeId === "inquiry_committee") {
        setFormSubject("Appointment as Inquiry Officer / Member of Inquiry Committee")
      } else if (typeId === "domestic_inquiry") {
        setFormSubject("Notice to Attend Domestic Inquiry")
      } else if (typeId === "suspension") {
        setFormSubject("Suspension Pending Investigation")
      } else if (typeId === "final_warning") {
        setFormSubject("Final Written Warning")
      } else if (typeId === "first_warning") {
        setFormSubject("First Written Warning")
      } else if (typeId === "salary_increment") {
        setFormSubject("Salary Revision")
      } else if (typeId === "promotion") {
        setFormSubject("Promotion and Revision of Compensation")
      } else {
        setFormSubject(`Official Correspondence: ${config.name}`)
      }
    }
    if (errors.selectedType) setErrors((prev) => ({ ...prev, selectedType: "" }))
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!selectedType) newErrors.selectedType = "Please select a letter type"
    if (!formEmployeeName.trim()) newErrors.formEmployeeName = "Employee name is required"
    if (!formSubject.trim()) newErrors.formSubject = "Subject is required"
    if (!formIssueDate) newErrors.formIssueDate = "Issue date is required"
    if (!formEffectiveDate) newErrors.formEffectiveDate = "Effective date is required"
    if (!formBody.trim()) newErrors.formBody = "Letter content body is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await onSubmit({
      employeeId: formEmployeeId || undefined,
      employeeName: formEmployeeName.trim(),
      employeeEmail: formEmployeeEmail.trim() || undefined,
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
          <DialogTitle>{letterToEdit ? "Edit HR Letter" : "Create HR Letter"}</DialogTitle>
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
                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-semibold">Employee Name *</Label>
                  <Input
                    placeholder="Enter Employee / Candidate Name"
                    value={formEmployeeName}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormEmployeeName(val)
                      setShowEmployeeDropdown(true)
                      setFormEmployeeId("")
                      if (errors.formEmployeeName) setErrors(prev => ({ ...prev, formEmployeeName: "" }))
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowEmployeeDropdown(false), 200)
                    }}
                    required
                    className="text-xs h-9"
                  />
                  {showEmployeeDropdown && employeeOptions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-md max-h-48 overflow-y-auto">
                      {employeeOptions
                        .filter(emp => emp.fullNameEnglish.toLowerCase().includes(formEmployeeName.toLowerCase()))
                        .map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setFormEmployeeId(emp.id)
                              setFormEmployeeName(emp.fullNameEnglish)
                              setFormEmployeeEmail(emp.email || "")
                              setShowEmployeeDropdown(false)
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          >
                            {emp.fullNameEnglish} ({emp.employeeId})
                          </button>
                        ))
                      }
                    </div>
                  )}
                  {errors.formEmployeeName && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors.formEmployeeName}</p>
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

              {/* Signatory Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Signatory / Signed By *</Label>
                  <select
                    value={formSignatoryId}
                    onChange={(e) => {
                      const id = e.target.value
                      setFormSignatoryId(id)
                      const emp = employeeOptions.find(o => o.id === id)
                      if (emp) {
                        setFormFields(prev => ({
                          ...prev,
                          signatoryName: emp.fullNameEnglish,
                          signatoryDesignation: emp.designationName || "Authorized Signatory",
                        }))
                      } else {
                        setFormFields(prev => {
                          const updated = { ...prev }
                          delete updated.signatoryName
                          delete updated.signatoryDesignation
                          return updated
                        })
                      }
                    }}
                    required
                    className="w-full bg-background border border-border hover:border-primary transition-colors text-xs h-9 rounded-md px-2"
                  >
                    <option value="">Select Signatory</option>
                    {employeeOptions.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullNameEnglish} ({emp.designationName || "Staff"})
                      </option>
                    ))}
                  </select>
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
                      {field === "department" ? (
                        <select
                          value={formFields[field] || ""}
                          onChange={(e) => setFormFields({ ...formFields, [field]: e.target.value })}
                          className="w-full bg-background border border-border hover:border-primary transition-colors text-xs h-8 rounded-md px-2"
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      ) : ["designation", "confirmedDesignation", "oldDesignation", "newDesignation", "fromRole", "toRole", "currentDesignation"].includes(field) ? (
                        <select
                          value={formFields[field] || ""}
                          onChange={(e) => setFormFields({ ...formFields, [field]: e.target.value })}
                          className="w-full bg-background border border-border hover:border-primary transition-colors text-xs h-8 rounded-md px-2"
                        >
                          <option value="">Select Designation</option>
                          {designations.map((desg) => (
                            <option key={desg.id} value={desg.name}>
                              {desg.name}
                            </option>
                          ))}
                        </select>
                      ) : ["reportingManager", "reportingTo", "committeeChair", "inquiryOfficer", "currentReportingTo", "newReportingTo"].includes(field) ? (
                        <div className="relative">
                          <Input
                            placeholder="Enter Reporting Manager Name"
                            value={formFields[field] || ""}
                            onChange={(e) => {
                              const val = e.target.value
                              setFormFields({ ...formFields, [field]: val })
                              setShowManagerDropdown(true)
                            }}
                            onFocus={() => setShowManagerDropdown(true)}
                            onBlur={() => {
                              setTimeout(() => setShowManagerDropdown(false), 200)
                            }}
                            className="text-xs h-8"
                          />
                          {showManagerDropdown && employeeOptions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-md max-h-48 overflow-y-auto">
                              {employeeOptions
                                .filter(emp => emp.fullNameEnglish.toLowerCase().includes((formFields[field] || "").toLowerCase()))
                                .map((emp) => (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => {
                                      setFormFields({ ...formFields, [field]: emp.fullNameEnglish })
                                      setShowManagerDropdown(false)
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                  >
                                    {emp.fullNameEnglish} ({emp.employeeId})
                                  </button>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      ) : (field.toLowerCase().includes("date") || field.toLowerCase().includes("deadline")) && field !== "incidentDate" && field !== "deadline" ? (
                        <Input
                          type="date"
                          value={formFields[field] || ""}
                          onChange={(e) => setFormFields({ ...formFields, [field]: e.target.value })}
                          className="text-xs h-8"
                        />
                      ) : (
                        <Input
                          placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").trim().toLowerCase()}`}
                          value={formFields[field] || ""}
                          onChange={(e) => setFormFields({ ...formFields, [field]: e.target.value })}
                          className="text-xs h-8"
                        />
                      )}
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
              {isPending ? (letterToEdit ? "Saving..." : "Creating...") : (letterToEdit ? "Save Changes" : "Create Letter")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
