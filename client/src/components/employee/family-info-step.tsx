import { useEffect, useRef } from "react"
import { useFormContext, Controller, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, HeartHandshake, Users, Baby } from "lucide-react"
import { Field, SectionTitle, SectionCard, StepHeader, EmptyState } from "./form-ui"
import type { EmployeeFormInput } from "./form-schema"

export default function FamilyInfoStep({ isView = false }: { isView?: boolean }) {
  const { register, control, watch, setValue } =
    useFormContext<EmployeeFormInput>()

  const maritalStatus = watch("maritalStatus")
  const showSpouse = maritalStatus === "Married"
  const prevStatusRef = useRef(maritalStatus)

  const {
    fields: spouseFields,
    append: appendSpouse,
    remove: removeSpouse,
  } = useFieldArray({ control, name: "spouses" })

  const {
    fields: childFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({ control, name: "children" })

  // Clear spouses and children when switching away from Married
  useEffect(() => {
    if (prevStatusRef.current === "Married" && maritalStatus !== "Married") {
      setValue("spouses", [])
      setValue("children", [])
    }
    prevStatusRef.current = maritalStatus
  }, [maritalStatus, setValue])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
      <StepHeader
        title="Family Information"
        description={isView ? "View marital status, spouse, and dependents for HR records." : "Marital status, spouse, and dependents for HR records and benefits."}
        icon={HeartHandshake}
      />

      {/* Marital Status */}
      <SectionCard>
        <SectionTitle icon={HeartHandshake}>Marital Status</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Marital Status">
            <Controller name="maritalStatus" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </Field>
        </div>
      </SectionCard>

      {/* Spouse(s) - only shown when married */}
      {showSpouse && (
        <SectionCard>
          <div className="flex items-center justify-between">
            <SectionTitle icon={Users}>Spouse Information</SectionTitle>
            {!isView && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => appendSpouse({ name: "", nid: "", phone: "", occupation: "", marriageDate: "" })}
              >
                <Plus className="h-3.5 w-3.5" /> Add Spouse
              </Button>
            )}
          </div>

          {spouseFields.length === 0 ? (
            isView ? (
              <p className="text-xs text-muted-foreground italic py-2">No spouse details recorded.</p>
            ) : (
              <EmptyState
                message="No spouse added yet. Add spouse details for HR records."
                actionLabel="+ Add Spouse"
                onAction={() => appendSpouse({ name: "", nid: "", phone: "", occupation: "", marriageDate: "" })}
              />
            )
          ) : (
            <div className="space-y-4">
              {spouseFields.map((spouse, index) => (
                <div key={spouse.id} className="relative p-4 rounded-xl border border-border/60 bg-background/50 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">{index + 1}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground/70">
                        Spouse {index + 1}
                      </span>
                    </div>
                    {!isView && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeSpouse(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Full Name">
                      <Input placeholder="Spouse's full name" {...register(`spouses.${index}.name`)} />
                    </Field>
                    <Field label="NID Number">
                      <Input placeholder="NID number" {...register(`spouses.${index}.nid`)} />
                    </Field>
                    <Field label="Phone">
                      <Input placeholder="+880XXXXXXXXXX" {...register(`spouses.${index}.phone`)} />
                    </Field>
                    <Field label="Occupation">
                      <Input placeholder="Occupation" {...register(`spouses.${index}.occupation`)} />
                    </Field>
                    <Field label="Marriage Date">
                      <Input type="date" {...register(`spouses.${index}.marriageDate`)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Children - only shown when married */}
      {showSpouse && (
        <SectionCard>
          <div className="flex items-center justify-between">
            <SectionTitle icon={Baby}>Children</SectionTitle>
            {!isView && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => appendChild({ name: "", dateOfBirth: "", gender: "Not Specified" })}
              >
                <Plus className="h-3.5 w-3.5" /> Add Child
              </Button>
            )}
          </div>

          {childFields.length === 0 ? (
            isView ? (
              <p className="text-xs text-muted-foreground italic py-2">No children details recorded.</p>
            ) : (
              <EmptyState
                message="No children added yet. Add dependent children for benefit records."
                actionLabel="+ Add Child"
                onAction={() => appendChild({ name: "", dateOfBirth: "", gender: "Not Specified" })}
              />
            )
          ) : (
            <div className="space-y-4">
              {childFields.map((child, index) => (
                <div key={child.id} className="relative p-4 rounded-xl border border-border/60 bg-background/50 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">{index + 1}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground/70">
                        Child {index + 1}
                      </span>
                    </div>
                    {!isView && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeChild(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Full Name">
                      <Input placeholder="Child's full name" {...register(`children.${index}.name`)} />
                    </Field>
                    <Field label="Date of Birth">
                      <Input type="date" {...register(`children.${index}.dateOfBirth`)} />
                    </Field>
                    <Field label="Gender">
                      <Controller name={`children.${index}.gender`} control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Not Specified">Not Specified</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  )
}
