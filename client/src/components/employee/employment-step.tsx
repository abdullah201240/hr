import { useState, useMemo } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff, FileText, X, Briefcase, Lock, FileCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Field, SectionTitle, SectionCard, StepHeader } from "./form-ui"
import type { EmployeeFormInput } from "./form-schema"
import { useDepartmentOptionsQuery } from "@/hooks/useDepartments"
import { useDesignationOptionsQuery } from "@/hooks/useDesignations"
import { useEmployeesQuery } from "@/hooks/useEmployees"

interface EmploymentStepProps {
  nidPdfName: string | null
  setNidPdfName: React.Dispatch<React.SetStateAction<string | null>>
  isView?: boolean
  isEdit?: boolean
}

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Lowercase", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Special char", pass: /[^A-Za-z0-9]/.test(password) },
  ], [password])

  const score = checks.filter((c) => c.pass).length
  const barColor = score <= 1 ? "bg-destructive" : score <= 3 ? "bg-amber-500" : "bg-emerald-500"
  const strengthLabel = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score <= 4 ? "Good" : "Strong"

  if (!password) return null

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn("flex-1 rounded-full transition-colors", i < score ? barColor : "bg-muted")} />
          ))}
        </div>
        <span className={cn("text-[10px] font-semibold", score <= 1 ? "text-destructive" : score <= 3 ? "text-amber-500" : "text-emerald-500")}>
          {strengthLabel}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={cn("text-[10px] flex items-center gap-1", c.pass ? "text-emerald-600" : "text-muted-foreground")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", c.pass ? "bg-emerald-500" : "bg-muted-foreground/30")} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function EmploymentStep({ nidPdfName, setNidPdfName, isView = false, isEdit = false }: EmploymentStepProps) {
  const { register, control, setValue, watch, formState: { errors } } =
    useFormContext<EmployeeFormInput>()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showTin, setShowTin] = useState(false)

  const passwordValue = watch("password") || ""

  // Fetch real list options
  const { data: deptOptions } = useDepartmentOptionsQuery()
  const { data: desigOptions } = useDesignationOptionsQuery()
  const { data: employeesData } = useEmployeesQuery({ limit: 100, status: "active" })

  const handleNidPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue("nidPdf", file)
      setNidPdfName(file.name)
    }
  }

  const removeNidPdf = () => {
    setValue("nidPdf", null)
    setNidPdfName(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
      <StepHeader
        title="Employment Setup"
        description="Configure work role, credentials, and documentation for this employee."
        icon={Briefcase}
      />

      {/* Work Details */}
      <SectionCard>
        <SectionTitle icon={Briefcase}>Work Details</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Designation" required error={errors.designation?.message}>
            <Controller name="designation" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                <SelectTrigger className={cn("w-full", errors.designation && "border-destructive")}><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>
                  {desigOptions?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </Field>
          <Field label="Department" required error={errors.department?.message}>
            <Controller name="department" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                <SelectTrigger className={cn("w-full", errors.department && "border-destructive")}><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {deptOptions?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </Field>
          <Field label="Employee Type" required error={errors.employeeType?.message}>
            <Controller name="employeeType" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                <SelectTrigger className={cn("w-full", errors.employeeType && "border-destructive")}><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Probation">Probation</SelectItem>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </Field>
          <Field label="Blood Group">
            <Controller name="bloodGroup" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Specified">Not Specified</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Field label="Line Manager" hint="Reporting manager (optional)">
            <Controller name="lineManager" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select reporting manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {employeesData?.data?.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.fullNameEnglish} ({emp.employeeId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </Field>
        </div>
      </SectionCard>

      {/* Account Credentials */}
      {!isEdit && !isView && (
        <SectionCard>
          <SectionTitle icon={Lock}>Account Credentials</SectionTitle>
          <p className="text-[11px] text-muted-foreground -mt-2">
            Set up login credentials for the employee portal. Password must meet all security requirements.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Field label="Password" required error={errors.password?.message}>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    className={cn("pr-10", errors.password && "border-destructive")}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <PasswordStrength password={passwordValue} />
            </div>
            <Field label="Confirm Password" required error={errors.confirmPassword?.message}>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className={cn("pr-10", errors.confirmPassword && "border-destructive")}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>
        </SectionCard>
      )}

      {/* Documents & Tax */}
      <SectionCard>
        <SectionTitle icon={FileCheck}>Documents & Tax</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="TIN Number" hint="Tax Identification Number (optional)">
            <div className="relative">
              <Input
                id="tinNumber"
                type={showTin ? "text" : "password"}
                placeholder="Enter TIN number"
                className="pr-14"
                {...register("tinNumber")}
              />
              <button
                type="button"
                onClick={() => setShowTin(!showTin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showTin ? "Hide" : "Show"}
              </button>
            </div>
          </Field>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground/80">NID Document (PDF)</Label>
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-colors",
              nidPdfName ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-muted/5 hover:border-primary/30",
            )}>
              {nidPdfName ? (
                <>
                  <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{nidPdfName}</p>
                    <p className="text-[10px] text-muted-foreground">PDF Document</p>
                  </div>
                  {!isView && (
                    <button type="button" onClick={removeNidPdf} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                isView ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <span className="text-[11px] font-medium text-muted-foreground/60">No Document Uploaded</span>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 cursor-pointer w-full">
                    <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Choose File</p>
                      <p className="text-[10px] text-muted-foreground">PDF format, max 5MB</p>
                    </div>
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleNidPdfChange} />
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
