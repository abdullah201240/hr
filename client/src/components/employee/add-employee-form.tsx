import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, CheckCircle2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import {
  employeeFormSchema,
  STEPS,
  PERSONAL_FIELDS,
  WORK_FIELDS,
  FAMILY_FIELDS,
  DOCUMENTS_FIELDS,
  DEFAULT_VALUES,
  type EmployeeFormInput,
  type StepKey,
} from "./form-schema"
import PersonalInfoStep from "./personal-info-step"
import EmploymentStep from "./employment-step"
import FamilyInfoStep from "./family-info-step"
import NomineeStep from "./nominee-step"
import BankingStep from "./banking-step"
import DocumentsStep from "./documents-step"
import ReviewStep from "./review-step"

const FIELD_LABELS: Record<string, string> = {
  employeeId: "Employee ID",
  fullNameEnglish: "Full Name (English)",
  email: "Work Email",
  personalEmail: "Personal Email",
  phone: "Phone",
  religion: "Religion",
  gender: "Gender",
  employeePhoto: "Photo",
  nidNumber: "NID Number",
  joinDate: "Join Date",
  dateOfBirth: "Date of Birth",
  designation: "Designation",
  department: "Department",
  password: "Password",
  confirmPassword: "Confirm Password",
  employeeType: "Employee Type",
}

interface AddEmployeeFormProps {
  onCancel: () => void
  onSubmit: (data: EmployeeFormInput) => void
  initialData?: Partial<EmployeeFormInput>
  isEdit?: boolean
  isView?: boolean
}

export default function AddEmployeeForm({ onCancel, onSubmit, initialData, isEdit = false, isView = false }: AddEmployeeFormProps) {
  const [activeTab, setActiveTab] = useState<StepKey>("personal")
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(() => {
    if (initialData?.employeePhoto) {
      if (typeof initialData.employeePhoto === "string") return initialData.employeePhoto
      if (initialData.employeePhoto instanceof File) return URL.createObjectURL(initialData.employeePhoto)
    }
    return null
  })

  const [nidPdfName, setNidPdfName] = useState<string | null>(() => {
    if (initialData?.nidPdf) {
      if (typeof initialData.nidPdf === "string") return initialData.nidPdf
      if (initialData.nidPdf instanceof File) return initialData.nidPdf.name
      return "nid_document.pdf"
    }
    return null
  })

  const [nomineeFiles, setNomineeFiles] = useState<
    Record<number, { nidPdfName: string | null; photoPreview: string | null }>
  >(() => {
    const initial: Record<number, { nidPdfName: string | null; photoPreview: string | null }> = {}
    if (initialData?.nominees) {
      initialData.nominees.forEach((nom: Record<string, unknown>, index: number) => {
        let nPdf: string | null = null
        let pPrev: string | null = null
        if (nom.nidPdf) {
          nPdf = nom.nidPdf instanceof File ? nom.nidPdf.name : typeof nom.nidPdf === "string" ? nom.nidPdf : "nid_document.pdf"
        }
        if (nom.photo) {
          pPrev = nom.photo instanceof File ? URL.createObjectURL(nom.photo) : typeof nom.photo === "string" ? nom.photo : null
        }
        initial[index] = { nidPdfName: nPdf, photoPreview: pPrev }
      })
    }
    return initial
  })

  const [bankPdfName, setBankPdfName] = useState<string | null>(() => {
    if (initialData?.bankStatementPdf) {
      if (typeof initialData.bankStatementPdf === "string") return initialData.bankStatementPdf
      if (initialData.bankStatementPdf instanceof File) return initialData.bankStatementPdf.name
      return "bank_statement.pdf"
    }
    return null
  })

  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set())

  const methods = useForm<EmployeeFormInput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: initialData || DEFAULT_VALUES,
    mode: "all",
    criteriaMode: "all",
  })

  const { handleSubmit, trigger } = methods

  const currentStepIndex = STEPS.findIndex((s) => s.key === activeTab)
  const progressPercent = Math.round(((currentStepIndex) / (STEPS.length - 1)) * 100)

  const markComplete = (step: StepKey) => {
    setCompletedSteps((prev) => new Set([...prev, step]))
  }

  const handleValidationFailure = (fieldsToTrigger: (keyof EmployeeFormInput)[]) => {
    const activeErrors = fieldsToTrigger.filter(field => methods.formState.errors[field])
    const errorNames = activeErrors.map(field => FIELD_LABELS[field] || String(field))

    const description = errorNames.length > 0
      ? `Please complete the following fields: ${errorNames.join(", ")}`
      : "Please fill in all required fields highlighted in red."

    toast.error("Form Validation Failed", {
      description,
      duration: 5000,
    })

    setTimeout(() => {
      // Find elements with error indicators (has-error, aria-invalid)
      const errorElements = document.querySelectorAll('.has-error, [aria-invalid="true"]');
      if (errorElements.length > 0) {
        // Scroll first error element to the center of the viewport smoothly
        const firstErrorEl = errorElements[0];
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Try to focus any input, textarea, or button inside it
        const inputInside = firstErrorEl.querySelector('input, textarea, button');
        if (inputInside instanceof HTMLElement) {
          inputInside.focus();
        } else if (firstErrorEl instanceof HTMLElement) {
          firstErrorEl.focus();
        }

        // Add a temporary subtle pulsing ring highlight
        firstErrorEl.classList.add('ring-4', 'ring-destructive/30', 'transition-all', 'duration-300');
        setTimeout(() => {
          firstErrorEl.classList.remove('ring-4', 'ring-destructive/30');
        }, 2500);
      }
    }, 100);
  }

  const nextStep = async () => {
    let isValid = false
    let fieldsToTrigger: (keyof EmployeeFormInput)[] = []

    if (activeTab === "personal") {
      fieldsToTrigger = PERSONAL_FIELDS
      isValid = await trigger(PERSONAL_FIELDS, { shouldFocus: false })
      if (isValid) {
        markComplete("personal")
        setActiveTab("work")
      }
    } else if (activeTab === "work") {
      fieldsToTrigger = WORK_FIELDS
      isValid = await trigger(WORK_FIELDS, { shouldFocus: false })
      if (isValid) {
        markComplete("work")
        setActiveTab("family")
      }
    } else if (activeTab === "family") {
      fieldsToTrigger = FAMILY_FIELDS
      isValid = await trigger(FAMILY_FIELDS, { shouldFocus: false })
      if (isValid) {
        markComplete("family")
        setActiveTab("nominee")
      }
    } else if (activeTab === "nominee") {
      isValid = true
      markComplete("nominee")
      setActiveTab("banking")
    } else if (activeTab === "banking") {
      isValid = true
      markComplete("banking")
      setActiveTab("documents")
    } else if (activeTab === "documents") {
      fieldsToTrigger = DOCUMENTS_FIELDS
      isValid = await trigger(DOCUMENTS_FIELDS, { shouldFocus: false })
      if (isValid) {
        markComplete("documents")
        setActiveTab("review")
      }
    }

    if (!isValid && fieldsToTrigger.length > 0) {
      handleValidationFailure(fieldsToTrigger)
    }
  }

  const prevStep = () => {
    if (activeTab === "work") setActiveTab("personal")
    else if (activeTab === "family") setActiveTab("work")
    else if (activeTab === "nominee") setActiveTab("family")
    else if (activeTab === "banking") setActiveTab("nominee")
    else if (activeTab === "documents") setActiveTab("banking")
    else if (activeTab === "review") setActiveTab("documents")
  }

  const goToStep = async (step: StepKey) => {
    if (step === "personal") { setActiveTab("personal"); return }
    if (step === "work") {
      if (await trigger(PERSONAL_FIELDS, { shouldFocus: false })) {
        markComplete("personal")
        setActiveTab("work")
      } else {
        handleValidationFailure(PERSONAL_FIELDS)
      }
      return
    }
    if (step === "family") {
      const v1 = await trigger(PERSONAL_FIELDS, { shouldFocus: false })
      const v2 = await trigger(WORK_FIELDS, { shouldFocus: false })
      if (v1 && v2) {
        markComplete("personal")
        markComplete("work")
        setActiveTab("family")
      } else {
        const failed: (keyof EmployeeFormInput)[] = []
        if (!v1) failed.push(...PERSONAL_FIELDS)
        if (!v2) failed.push(...WORK_FIELDS)
        handleValidationFailure(failed)
      }
      return
    }
    if (step === "nominee") {
      const v1 = await trigger(PERSONAL_FIELDS, { shouldFocus: false })
      const v2 = await trigger(WORK_FIELDS, { shouldFocus: false })
      if (v1 && v2) {
        markComplete("personal")
        markComplete("work")
        setActiveTab("nominee")
      } else {
        const failed: (keyof EmployeeFormInput)[] = []
        if (!v1) failed.push(...PERSONAL_FIELDS)
        if (!v2) failed.push(...WORK_FIELDS)
        handleValidationFailure(failed)
      }
      return
    }
    if (step === "banking") {
      const v1 = await trigger(PERSONAL_FIELDS, { shouldFocus: false })
      const v2 = await trigger(WORK_FIELDS, { shouldFocus: false })
      if (v1 && v2) {
        markComplete("personal")
        markComplete("work")
        setActiveTab("banking")
      } else {
        const failed: (keyof EmployeeFormInput)[] = []
        if (!v1) failed.push(...PERSONAL_FIELDS)
        if (!v2) failed.push(...WORK_FIELDS)
        handleValidationFailure(failed)
      }
      return
    }
    if (step === "documents") {
      const v1 = await trigger(PERSONAL_FIELDS, { shouldFocus: false })
      const v2 = await trigger(WORK_FIELDS, { shouldFocus: false })
      if (v1 && v2) {
        markComplete("personal")
        markComplete("work")
        setActiveTab("documents")
      } else {
        const failed: (keyof EmployeeFormInput)[] = []
        if (!v1) failed.push(...PERSONAL_FIELDS)
        if (!v2) failed.push(...WORK_FIELDS)
        handleValidationFailure(failed)
      }
      return
    }
    const v1 = await trigger(PERSONAL_FIELDS, { shouldFocus: false })
    const v2 = await trigger(WORK_FIELDS, { shouldFocus: false })
    const v3 = await trigger(DOCUMENTS_FIELDS, { shouldFocus: false })
    if (v1 && v2 && v3) {
      markComplete("personal")
      markComplete("work")
      markComplete("documents")
      setActiveTab("review")
    } else {
      const failed: (keyof EmployeeFormInput)[] = []
      if (!v1) failed.push(...PERSONAL_FIELDS)
      if (!v2) failed.push(...WORK_FIELDS)
      if (!v3) failed.push(...DOCUMENTS_FIELDS)
      handleValidationFailure(failed)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isView ? "Employee Profile" : isEdit ? "Edit Employee" : "New Employee"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isView ? "View details of the employee record" : isEdit ? "Update details in the employee record" : "Complete all steps to create a new employee profile"}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 sm:w-32 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
              {progressPercent}%
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={onCancel} className="hidden sm:flex">
            Cancel
          </Button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <nav className="relative">
        {/* Background connector line */}
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-border/60 hidden sm:block" />
        <div
          className="absolute top-5 left-0 h-[2px] bg-primary transition-all duration-500 ease-out hidden sm:block"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="flex items-start justify-between gap-1 relative z-10">
          {STEPS.map(({ key, label, icon: Icon }, i) => {
            const isActive = activeTab === key
            const isCompleted = completedSteps.has(key)
            const isPast = i < currentStepIndex

            return (
              <button
                key={key}
                type="button"
                onClick={() => goToStep(key)}
                className="flex flex-col items-center gap-1.5 group flex-1 min-w-0"
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all duration-300",
                    isActive && "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110",
                    isCompleted && !isActive && "bg-emerald-500 border-emerald-500 text-white",
                    isPast && !isCompleted && !isActive && "bg-muted border-border text-muted-foreground",
                    !isActive && !isCompleted && !isPast && "bg-background border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-primary/70",
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] font-medium transition-colors text-center leading-tight",
                    isActive && "text-primary font-semibold",
                    isCompleted && !isActive && "text-emerald-600",
                    !isActive && !isCompleted && "text-muted-foreground",
                  )}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Form Content */}
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            if (activeTab !== "review") {
              e.preventDefault()
              nextStep()
            } else {
              handleSubmit(onSubmit)(e)
            }
          }}
          className="space-y-6"
        >
          <fieldset disabled={isView} className="min-h-[400px] disabled:opacity-95">
            {activeTab === "personal" && (
              <PersonalInfoStep
                photoPreview={photoPreview}
                setPhotoPreview={setPhotoPreview}
                isView={isView}
              />
            )}
            {activeTab === "work" && (
              <EmploymentStep
                nidPdfName={nidPdfName}
                setNidPdfName={setNidPdfName}
                isView={isView}
                isEdit={isEdit}
              />
            )}
            {activeTab === "family" && <FamilyInfoStep isView={isView} />}
            {activeTab === "nominee" && (
              <NomineeStep
                nomineeFiles={nomineeFiles}
                setNomineeFiles={setNomineeFiles}
                isView={isView}
              />
            )}
            {activeTab === "banking" && (
              <BankingStep
                bankPdfName={bankPdfName}
                setBankPdfName={setBankPdfName}
                isView={isView}
              />
            )}
            {activeTab === "documents" && (
              <DocumentsStep
                isView={isView}
              />
            )}
            {activeTab === "review" && (
              <ReviewStep photoPreview={photoPreview} nidPdfName={nidPdfName} />
            )}
          </fieldset>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div>
              {activeTab !== "personal" && (
                <Button type="button" variant="outline" size="default" onClick={prevStep} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="default" onClick={onCancel} className="text-muted-foreground">
                {isView ? "Close" : "Cancel"}
              </Button>
              {activeTab !== "review" ? (
                <Button key="btn-continue" type="button" size="default" onClick={nextStep} className="gap-2 px-6">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                isView ? (
                  <Button key="btn-done" type="button" size="default" onClick={onCancel} className="gap-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25">
                    <CheckCircle2 className="h-4 w-4" />
                    Done
                  </Button>
                ) : (
                  <Button key="btn-submit" type="submit" size="default" className="gap-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25">
                    <CheckCircle2 className="h-4 w-4" />
                    {isEdit ? "Save Changes" : "Create Employee"}
                  </Button>
                )
              )}
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
