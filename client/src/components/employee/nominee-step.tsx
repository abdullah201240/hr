import { useRef } from "react"
import { useFormContext, useFieldArray, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Upload, X, User as UserIcon, FileUser, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Field, SectionCard, StepHeader, EmptyState } from "./form-ui"
import type { EmployeeFormInput } from "./form-schema"

interface NomineeStepProps {
  nomineeFiles: Record<number, { nidPdfName: string | null; photoPreview: string | null }>
  setNomineeFiles: (
    files: Record<number, { nidPdfName: string | null; photoPreview: string | null }>,
  ) => void
  isView?: boolean
}

const RELATIONS = [
  "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Other",
]

export default function NomineeStep({ nomineeFiles, setNomineeFiles, isView = false }: NomineeStepProps) {
  const { register, control, setValue } = useFormContext<EmployeeFormInput>()

  const {
    fields: nomineeFields,
    append: appendNominee,
    remove: removeNominee,
  } = useFieldArray({ control, name: "nominees" })

  const nidPdfRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const photoRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const updateFile = (index: number, patch: Partial<{ nidPdfName: string | null; photoPreview: string | null }>) => {
    const current = nomineeFiles[index] ?? { nidPdfName: null, photoPreview: null }
    setNomineeFiles({ ...nomineeFiles, [index]: { ...current, ...patch } })
  }

  const handleNidPdfChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue(`nominees.${index}.nidPdf`, file)
      updateFile(index, { nidPdfName: file.name })
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue(`nominees.${index}.photo`, file)
      updateFile(index, { photoPreview: URL.createObjectURL(file) })
    }
  }

  const removeNomineeAt = (index: number) => {
    removeNominee(index)
    const updated = { ...nomineeFiles }
    delete updated[index]
    setNomineeFiles(updated)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <StepHeader
          title="Nominee Information"
          description={isView ? "View designated beneficiaries for insurance and benefits." : "Designate beneficiaries for insurance, provident fund, and gratuity."}
          icon={FileUser}
        />
        {!isView && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs shrink-0"
            onClick={() => appendNominee({ name: "", relation: "", nidNumber: "", nidPdf: null, photo: null })}
          >
            <Plus className="h-3.5 w-3.5" /> Add Nominee
          </Button>
        )}
      </div>

      {nomineeFields.length === 0 ? (
        isView ? (
          <p className="text-xs text-muted-foreground italic py-2">No nominee details recorded.</p>
        ) : (
          <EmptyState
            message="No nominee added yet. Nominees are beneficiaries for insurance and benefits."
            actionLabel="+ Add First Nominee"
            onAction={() => appendNominee({ name: "", relation: "", nidNumber: "", nidPdf: null, photo: null })}
          />
        )
      ) : (
        <div className="space-y-5">
          {nomineeFields.map((nominee, index) => {
            const files = nomineeFiles[index] ?? { nidPdfName: null, photoPreview: null }
            return (
              <SectionCard key={nominee.id} className="!p-4 sm:!p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-primary">{index + 1}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground/70">
                      Nominee {index + 1}
                    </span>
                  </div>
                  {!isView && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeNomineeAt(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                  {/* Photo */}
                  <div className="flex flex-col items-center gap-2 shrink-0 self-center sm:self-start">
                    <div className="size-20 sm:size-24 rounded-xl overflow-hidden border-2 border-border/60 bg-muted/20 flex items-center justify-center">
                      {files.photoPreview ? (
                        <img src={files.photoPreview} alt="Nominee" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    {!isView && (
                      <>
                        <input
                          ref={(el) => { photoRefs.current[index] = el }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoChange(e, index)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1.5 w-full"
                          onClick={() => photoRefs.current[index]?.click()}
                        >
                          <Upload className="h-3 w-3" /> Photo
                        </Button>
                        {files.photoPreview && (
                          <button
                            type="button"
                            className="text-[10px] text-destructive hover:underline font-medium"
                            onClick={() => {
                              setValue(`nominees.${index}.photo`, null)
                              updateFile(index, { photoPreview: null })
                              if (photoRefs.current[index]) photoRefs.current[index]!.value = ""
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Nominee Name">
                        <Input placeholder="Full name" {...register(`nominees.${index}.name`)} />
                      </Field>
                      <Field label="Relation">
                        <Controller
                          name={`nominees.${index}.relation`}
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-full"><SelectValue placeholder="Select relation" /></SelectTrigger>
                              <SelectContent>
                                {RELATIONS.map((r) => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </Field>
                      <Field label="NID Number">
                        <Input placeholder="NID number" {...register(`nominees.${index}.nidNumber`)} />
                      </Field>
                      {/* NID PDF */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground/80">NID Document (PDF)</Label>
                        <input
                          ref={(el) => { nidPdfRefs.current[index] = el }}
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleNidPdfChange(e, index)}
                        />
                        <div className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border-2 border-dashed transition-colors",
                          files.nidPdfName ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 hover:border-primary/30",
                        )}>
                          {files.nidPdfName ? (
                            <>
                              <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="text-[11px] font-medium truncate flex-1">{files.nidPdfName}</span>
                              {!isView && (
                                <button
                                  type="button"
                                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() => {
                                    setValue(`nominees.${index}.nidPdf`, null)
                                    updateFile(index, { nidPdfName: null })
                                    if (nidPdfRefs.current[index]) nidPdfRefs.current[index]!.value = ""
                                  }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            isView ? (
                              <div className="flex items-center gap-2 text-muted-foreground py-1">
                                <FileText className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                <span className="text-[11px] font-medium text-muted-foreground/60">No Document Uploaded</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="flex items-center gap-2 w-full text-left"
                                onClick={() => nidPdfRefs.current[index]?.click()}
                              >
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-[11px] text-muted-foreground">Choose PDF file</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
