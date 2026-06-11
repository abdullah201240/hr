import { useRef } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Upload, X, Landmark, FileText, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Field, SectionTitle, SectionCard, StepHeader } from "./form-ui"
import type { EmployeeFormInput } from "./form-schema"

interface BankingStepProps {
  bankPdfName: string | null
  setBankPdfName: (name: string | null) => void
  isView?: boolean
}

export default function BankingStep({ bankPdfName, setBankPdfName, isView = false }: BankingStepProps) {
  const { register, control, setValue } = useFormContext<EmployeeFormInput>()
  const pdfRef = useRef<HTMLInputElement | null>(null)

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue("bankStatementPdf", file)
      setBankPdfName(file.name)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
      <StepHeader
        title="Banking Information"
        description={isView ? "View bank account details for salary disbursement." : "Bank account details for salary disbursement and payroll processing."}
        icon={Landmark}
      />

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Payroll Account</p>
          <p className="text-[11px] text-blue-600/80 dark:text-blue-300/80 mt-0.5">
            Provide accurate bank details to ensure timely salary payments. Details will be verified during onboarding.
          </p>
        </div>
      </div>

      {/* Bank Details */}
      <SectionCard>
        <SectionTitle icon={Landmark}>Account Details</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Bank Name" hint="e.g., BRAC Bank, Dutch-Bangla">
            <Input placeholder="Enter bank name" {...register("bankName")} />
          </Field>
          <Field label="Bank Branch">
            <Input placeholder="Enter branch name" {...register("bankBranch")} />
          </Field>
          <Field label="Account Number">
            <Input placeholder="Enter account number" {...register("accountNumber")} />
          </Field>
          <Field label="Account Type">
            <Controller name="accountType" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select account type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Current">Current</SelectItem>
                  <SelectItem value="Salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </Field>
          <Field label="Routing Number" hint="9-digit bank routing code">
            <Input placeholder="Enter routing number" {...register("routingNumber")} />
          </Field>
          <Field label="SWIFT Code" hint="International wire transfer">
            <Input placeholder="Enter SWIFT code" {...register("swiftCode")} />
          </Field>
          <Field label="IBAN Number" hint="International bank account" className="sm:col-span-2 lg:col-span-1">
            <Input placeholder="Enter IBAN number" {...register("ibanNumber")} />
          </Field>
        </div>
      </SectionCard>

      {/* Bank Statement */}
      <SectionCard>
        <SectionTitle icon={FileText}>Bank Statement</SectionTitle>
        <p className="text-[11px] text-muted-foreground -mt-2">
          Upload a recent bank statement (last 3 months) for account verification.
        </p>
        <input
          ref={pdfRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handlePdfChange}
        />
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all",
          bankPdfName ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-muted/5 hover:border-primary/30 hover:bg-muted/10",
        )}>
          {bankPdfName ? (
            <>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{bankPdfName}</p>
                <p className="text-[10px] text-muted-foreground">PDF Document • Uploaded</p>
              </div>
              {!isView && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setValue("bankStatementPdf", null)
                    setBankPdfName(null)
                    if (pdfRef.current) pdfRef.current.value = ""
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            isView ? (
              <div className="flex items-center gap-3 text-muted-foreground py-1">
                <FileText className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">No bank statement uploaded</p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => pdfRef.current?.click()}
                className="flex items-center gap-4 w-full text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">Upload Bank Statement</p>
                  <p className="text-[10px] text-muted-foreground">PDF format, max 5MB</p>
                </div>
              </button>
            )
          )}
        </div>
      </SectionCard>
    </div>
  )
}
