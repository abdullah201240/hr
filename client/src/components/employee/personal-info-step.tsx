import { useState, useCallback } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {X, Copy, User, Camera, MapPin, Phone, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { Field, SectionTitle, SectionCard, StepHeader } from "./form-ui"
import type { EmployeeFormInput } from "./form-schema"

interface PersonalInfoStepProps {
  photoPreview: string | null
  setPhotoPreview: React.Dispatch<React.SetStateAction<string | null>>
  isView?: boolean
}

export default function PersonalInfoStep({ photoPreview, setPhotoPreview, isView = false }: PersonalInfoStepProps) {
  const { register, control, setValue, watch, formState: { errors } } =
    useFormContext<EmployeeFormInput>()

  const [sameAddress, setSameAddress] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const currentAddressVal = watch("currentAddress")

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue("employeePhoto", file, { shouldValidate: true })
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setValue("employeePhoto", file, { shouldValidate: true })
      setPhotoPreview(URL.createObjectURL(file))
    }
  }, [setValue, setPhotoPreview])

  const removePhoto = () => {
    setValue("employeePhoto", null, { shouldValidate: true })
    setPhotoPreview(null)
  }

  const handleAddressSync = (checked: boolean) => {
    setSameAddress(checked)
    if (checked) setValue("permanentAddress", currentAddressVal)
  }

  const handleCurrentAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setValue("currentAddress", value)
    if (sameAddress) setValue("permanentAddress", value)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
      <StepHeader
        title="Personal Information"
        description={isView ? "View personal identification and contact details for the employee." : "Basic identification and contact details for the employee record."}
        icon={User}
      />

      {/* Photo + Core ID */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Photo Upload */}
          <div className={cn("shrink-0 flex flex-col items-center gap-2 self-center sm:self-start", errors.employeePhoto && "has-error")}>
            {photoPreview ? (
              <div className={cn(
                "relative size-24 sm:size-28 rounded-2xl overflow-hidden border-2 group shadow-sm transition-all duration-200",
                errors.employeePhoto ? "border-destructive ring-3 ring-destructive/20" : "border-border"
              )}>
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                {!isView && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button type="button" onClick={removePhoto} className="text-white flex flex-col items-center gap-1">
                      <X className="h-5 w-5" />
                      <span className="text-[9px] font-medium">Remove</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              isView ? (
                <div className="flex flex-col items-center justify-center size-24 sm:size-28 rounded-2xl border-2 border-dashed border-border/70 bg-muted/10">
                  <User className="h-8 w-8 text-muted-foreground/30 mb-1" />
                  <span className="text-[10px] text-muted-foreground/60 font-medium">No Photo</span>
                </div>
              ) : (
                <label
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "flex flex-col items-center justify-center size-24 sm:size-28 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200",
                    isDragOver
                      ? "border-primary bg-primary/5 scale-105"
                      : errors.employeePhoto
                        ? "border-destructive bg-destructive/5 ring-3 ring-destructive/20"
                        : "border-border/70 bg-muted/10 hover:border-primary/50 hover:bg-muted/20",
                  )}
                >
                  <Camera className={cn("h-6 w-6 mb-1 transition-colors", errors.employeePhoto ? "text-destructive" : "text-muted-foreground/60")} />
                  <span className={cn("text-[10px] font-medium transition-colors", errors.employeePhoto ? "text-destructive" : "text-muted-foreground")}>Upload Photo</span>
                  <span className={cn("text-[9px] transition-colors", errors.employeePhoto ? "text-destructive/80" : "text-muted-foreground/60")}>or drag & drop</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              )
            )}
            {errors.employeePhoto && (
              <p className="text-[10px] text-destructive font-medium">{errors.employeePhoto.message as string}</p>
            )}
          </div>

          {/* Core ID Fields */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Employee ID" required error={errors.employeeId?.message} hint="Unique identifier">
              <Input id="employeeId" placeholder="EMP-1002" className={cn(errors.employeeId && "border-destructive")} {...register("employeeId")} />
            </Field>
            <Field label="NID Number" required error={errors.nidNumber?.message} hint="National ID">
              <Input id="nidNumber" placeholder="19958217342918" className={cn(errors.nidNumber && "border-destructive")} {...register("nidNumber")} />
            </Field>
            <Field label="Date of Birth" required error={errors.dateOfBirth?.message}>
              <Input id="dateOfBirth" type="date" className={cn(errors.dateOfBirth && "border-destructive")} {...register("dateOfBirth")} />
            </Field>
            <Field label="Join Date" required error={errors.joinDate?.message}>
              <Input id="joinDate" type="date" className={cn(errors.joinDate && "border-destructive")} {...register("joinDate")} />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Personal Details */}
      <SectionCard>
        <SectionTitle icon={User}>Personal Details</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Full Name (English)" required error={errors.fullNameEnglish?.message} className="sm:col-span-2">
            <Input id="fullNameEnglish" placeholder="John Doe" className={cn(errors.fullNameEnglish && "border-destructive")} {...register("fullNameEnglish")} />
          </Field>
          <Field label="Full Name (Bangla)" className="sm:col-span-2">
            <Input id="fullNameBangla" placeholder="জন ডো" {...register("fullNameBangla")} />
          </Field>
          <Field label="Religion" required error={errors.religion?.message}>
            <Controller name="religion" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={cn("w-full", errors.religion && "border-destructive")}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Islam">Islam</SelectItem>
                  <SelectItem value="Hinduism">Hinduism</SelectItem>
                  <SelectItem value="Christianity">Christianity</SelectItem>
                  <SelectItem value="Buddhism">Buddhism</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </Field>
          <Field label="Gender" required error={errors.gender?.message}>
            <Controller name="gender" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={cn("w-full", errors.gender && "border-destructive")}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Not Specified">Not Specified</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </Field>
        </div>
      </SectionCard>

      {/* Contact */}
      <SectionCard>
        <SectionTitle icon={Phone}>Contact Information</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Work Email" required error={errors.email?.message}>
            <Input id="email" type="email" placeholder="john@sadoshima.com" className={cn(errors.email && "border-destructive")} {...register("email")} />
          </Field>
          <Field label="Personal Email" error={errors.personalEmail?.message}>
            <Input id="personalEmail" type="email" placeholder="john@gmail.com" className={cn(errors.personalEmail && "border-destructive")} {...register("personalEmail")} />
          </Field>
          <Field label="Phone" required error={errors.phone?.message}>
            <Input id="phone" placeholder="+88017XXXXXXXX" className={cn(errors.phone && "border-destructive")} {...register("phone")} />
          </Field>
          <Field label="Personal Mobile">
            <Input id="personalMobileNumber" placeholder="+88015XXXXXXXX" {...register("personalMobileNumber")} />
          </Field>
        </div>
      </SectionCard>

      {/* Family Lineage */}
      <SectionCard>
        <SectionTitle>Family Lineage</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Father's Name (EN)"><Input id="fatherNameEnglish" placeholder="Father's name" {...register("fatherNameEnglish")} /></Field>
          <Field label="Father's Name (BN)"><Input id="fatherNameBangla" placeholder="পিতার নাম" {...register("fatherNameBangla")} /></Field>
          <Field label="Mother's Name (EN)"><Input id="motherNameEnglish" placeholder="Mother's name" {...register("motherNameEnglish")} /></Field>
          <Field label="Mother's Name (BN)"><Input id="motherNameBangla" placeholder="মাতার নাম" {...register("motherNameBangla")} /></Field>
        </div>
      </SectionCard>

      {/* Emergency Contact */}
      <SectionCard>
        <SectionTitle icon={Shield}>Emergency Contact</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Contact Name"><Input id="emergencyContactName" placeholder="Jane Doe" {...register("emergencyContactName")} /></Field>
          <Field label="Relation"><Input id="emergencyContactRelation" placeholder="Spouse, Brother" {...register("emergencyContactRelation")} /></Field>
          <Field label="Phone Number"><Input id="emergencyContactNumber" placeholder="+88019XXXXXXXX" {...register("emergencyContactNumber")} /></Field>
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard>
        <SectionTitle icon={MapPin}>Address</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground/80">Current Address</Label>
            <Textarea
              rows={3}
              placeholder="House no, street, city, postcode..."
              className="resize-none text-sm"
              value={currentAddressVal}
              onChange={handleCurrentAddressChange}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground/80">Permanent Address</Label>
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => handleAddressSync(!sameAddress)}>
                <Checkbox id="sameAddressCheck" checked={sameAddress} onCheckedChange={handleAddressSync} />
                <Label htmlFor="sameAddressCheck" className="text-[11px] cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="h-3 w-3" /> Same as current
                </Label>
              </div>
            </div>
            <Textarea
              rows={3}
              placeholder="Permanent address..."
              className="resize-none text-sm"
              disabled={sameAddress}
              {...register("permanentAddress")}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
