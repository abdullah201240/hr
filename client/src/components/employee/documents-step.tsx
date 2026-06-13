import { useRef } from "react"
import { useFormContext, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Upload, X, FileText, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Field, SectionCard, StepHeader, EmptyState } from "./form-ui"
import type { EmployeeFormInput } from "./form-schema"

interface DocumentsStepProps {
  isView?: boolean
}

export default function DocumentsStep({ isView = false }: DocumentsStepProps) {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext<EmployeeFormInput>()

  const {
    fields: documentFields,
    append: appendDocument,
    remove: removeDocument,
  } = useFieldArray({ control, name: "documents" })

  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const documentsValue = watch("documents") || []

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue(`documents.${index}.file`, file, { shouldValidate: true })
    }
  }

  const removeFile = (index: number) => {
    setValue(`documents.${index}.file`, null, { shouldValidate: true })
    if (fileRefs.current[index]) {
      fileRefs.current[index]!.value = ""
    }
  }

  const getFileName = (index: number) => {
    const fileObj = documentsValue[index]?.file
    if (!fileObj) return null
    if (fileObj instanceof File) return fileObj.name
    if (typeof fileObj === "string") {
      // If it's a URL path, extract the filename
      return fileObj.substring(fileObj.lastIndexOf("/") + 1)
    }
    return "Document File"
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <StepHeader
          title="Certificates & Compliance"
          description={isView ? "View uploaded certificates and compliance documents." : "Upload employee certificates, training records, and compliance files."}
          icon={FolderOpen}
        />
        {!isView && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs shrink-0"
            onClick={() => appendDocument({ title: "", description: "", file: null })}
          >
            <Plus className="h-3.5 w-3.5" /> Add Document
          </Button>
        )}
      </div>

      {documentFields.length === 0 ? (
        isView ? (
          <p className="text-xs text-muted-foreground italic py-2">No documents recorded.</p>
        ) : (
          <EmptyState
            message="No documents added yet. Add documents like certificates, resumes, or compliance forms."
            actionLabel="+ Add First Document"
            onAction={() => appendDocument({ title: "", description: "", file: null })}
          />
        )
      ) : (
        <div className="space-y-5">
          {documentFields.map((field, index) => {
            const fileName = getFileName(index)
            const documentError = errors.documents?.[index]

            return (
              <SectionCard key={field.id} className="relative !p-4 sm:!p-5 border-border/80 bg-background/40">
                <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-primary">{index + 1}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground/70">
                      Document {index + 1}
                    </span>
                  </div>
                  {!isView && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeDocument(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Form Fields */}
                  <div className="space-y-4">
                    <Field
                      label="Document Title"
                      required
                      error={documentError?.title?.message}
                      hint="e.g., BSc Certificate, NDA Agreement"
                    >
                      <Input
                        placeholder="Enter document title"
                        className={cn(documentError?.title && "border-destructive")}
                        {...register(`documents.${index}.title` as const)}
                      />
                    </Field>

                    <Field
                      label="Description"
                      hint="Brief summary or details about this document (optional)"
                    >
                      <Textarea
                        placeholder="Enter description..."
                        rows={2}
                        className="resize-none text-sm"
                        {...register(`documents.${index}.description` as const)}
                      />
                    </Field>
                  </div>

                  {/* Right Column: File Upload */}
                  <div className="flex flex-col justify-start">
                    <div className="space-y-1.5 h-full flex flex-col">
                      <Label className={cn(
                        "text-xs font-medium",
                        documentError?.file ? "text-destructive" : "text-foreground/80"
                      )}>
                        Document File <span className="text-destructive">*</span>
                      </Label>

                      <input
                        ref={(el) => { fileRefs.current[index] = el }}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, index)}
                      />

                      <div className={cn(
                        "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 flex-1 transition-all",
                        fileName ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 hover:border-primary/30",
                        documentError?.file ? "border-destructive bg-destructive/5" : ""
                      )}>
                        {fileName ? (
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="max-w-[200px]">
                              <p className="text-xs font-semibold truncate text-foreground">{fileName}</p>
                              <p className="text-[10px] text-muted-foreground">Document uploaded</p>
                            </div>
                            {!isView && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] gap-1 px-2.5 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-3 w-3" /> Remove File
                              </Button>
                            )}
                          </div>
                        ) : (
                          isView ? (
                            <div className="flex flex-col items-center justify-center text-muted-foreground py-4">
                              <FileText className="h-6 w-6 text-muted-foreground/40 mb-1" />
                              <span className="text-[11px] font-medium text-muted-foreground/60">No Document Uploaded</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-center space-y-2">
                              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground">Upload File</p>
                                <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG or DOCX</p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] px-3 gap-1.5"
                                onClick={() => fileRefs.current[index]?.click()}
                              >
                                <Upload className="h-3 w-3" /> Select File
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                      {documentError?.file && (
                        <p className="text-[11px] text-destructive mt-1 flex items-center gap-1 font-medium">
                          <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                          </svg>
                          {documentError.file.message as string}
                        </p>
                      )}
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
