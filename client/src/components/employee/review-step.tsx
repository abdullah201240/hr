import { useFormContext } from "react-hook-form"
import { ReviewItem, ReviewSection, SectionCard } from "./form-ui"
import { User,HeartHandshake, FileUser, Landmark, MapPin, Shield, Phone } from "lucide-react"
import type { EmployeeFormInput } from "./form-schema"

interface ReviewStepProps {
  photoPreview: string | null
  nidPdfName: string | null
}

export default function ReviewStep({ photoPreview, nidPdfName }: ReviewStepProps) {
  const { watch } = useFormContext<EmployeeFormInput>()
  const v = watch()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-500/10 shrink-0 mt-0.5">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">Review & Submit</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Please verify all information before creating the employee profile.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <SectionCard className="!p-5">
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <div className="size-16 sm:size-20 rounded-2xl overflow-hidden border-2 border-border shrink-0 shadow-sm">
              <img src={photoPreview} alt="Employee" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="size-16 sm:size-20 rounded-2xl border-2 border-border bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary text-xl font-bold shrink-0">
              {v.fullNameEnglish ? v.fullNameEnglish.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "EM"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-base sm:text-lg truncate">{v.fullNameEnglish || "No Name"}</h4>
            <p className="text-sm text-muted-foreground">{v.designation} · {v.department}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {v.employeeType}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/50">
                {v.employeeId || "No ID"}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Core Information */}
      <SectionCard>
        <ReviewSection title="Personal Information" icon={User}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
            <ReviewItem label="Employee ID" value={v.employeeId} />
            <ReviewItem label="NID Number" value={v.nidNumber} />
            <ReviewItem label="Date of Birth" value={v.dateOfBirth} />
            <ReviewItem label="Join Date" value={v.joinDate} />
            <ReviewItem label="Religion" value={v.religion} />
            <ReviewItem label="Gender" value={v.gender} />
            <ReviewItem label="Blood Group" value={v.bloodGroup} />
            {v.tinNumber && <ReviewItem label="TIN Number" value={v.tinNumber} />}
            {nidPdfName && <ReviewItem label="NID PDF" value={nidPdfName} />}
          </div>
        </ReviewSection>
      </SectionCard>

      {/* Contact */}
      <SectionCard>
        <ReviewSection title="Contact" icon={Phone}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
            <ReviewItem label="Work Email" value={v.email} />
            <ReviewItem label="Phone" value={v.phone} />
            {v.personalEmail && <ReviewItem label="Personal Email" value={v.personalEmail} />}
            {v.personalMobileNumber && <ReviewItem label="Personal Mobile" value={v.personalMobileNumber} />}
          </div>
        </ReviewSection>
      </SectionCard>

      {/* Family Lineage */}
      {(v.fatherNameEnglish || v.motherNameEnglish) && (
        <SectionCard>
          <ReviewSection title="Family Lineage" icon={User}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
              <ReviewItem label="Father (EN)" value={v.fatherNameEnglish} />
              <ReviewItem label="Mother (EN)" value={v.motherNameEnglish} />
              <ReviewItem label="Father (BN)" value={v.fatherNameBangla} />
              <ReviewItem label="Mother (BN)" value={v.motherNameBangla} />
            </div>
          </ReviewSection>
        </SectionCard>
      )}

      {/* Emergency Contact */}
      {v.emergencyContactName && (
        <SectionCard>
          <ReviewSection title="Emergency Contact" icon={Shield}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
              <ReviewItem label="Contact Name" value={v.emergencyContactName} />
              <ReviewItem label="Relation" value={v.emergencyContactRelation} />
              <ReviewItem label="Number" value={v.emergencyContactNumber} />
            </div>
          </ReviewSection>
        </SectionCard>
      )}

      {/* Address */}
      {(v.currentAddress || v.permanentAddress) && (
        <SectionCard>
          <ReviewSection title="Address" icon={MapPin}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">Current Address</span>
                <span className="text-xs text-foreground">{v.currentAddress || "—"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">Permanent Address</span>
                <span className="text-xs text-foreground">{v.permanentAddress || "—"}</span>
              </div>
            </div>
          </ReviewSection>
        </SectionCard>
      )}

      {/* Marital & Family */}
      <SectionCard>
        <ReviewSection title="Family Status" icon={HeartHandshake}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
            <ReviewItem label="Marital Status" value={v.maritalStatus} />
          </div>
        </ReviewSection>

        {v.spouses && v.spouses.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border/40">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">Spouse(s)</h5>
            <div className="space-y-2">
              {v.spouses.map((spouse: any, i: number) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 p-3 rounded-lg bg-muted/20">
                  <ReviewItem label={`Spouse ${i + 1} Name`} value={spouse.name} />
                  <ReviewItem label="NID" value={spouse.nid} />
                  <ReviewItem label="Phone" value={spouse.phone} />
                  <ReviewItem label="Occupation" value={spouse.occupation} />
                  <ReviewItem label="Marriage Date" value={spouse.marriageDate} />
                </div>
              ))}
            </div>
          </div>
        )}

        {v.children && v.children.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border/40">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">Children</h5>
            <div className="space-y-2">
              {v.children.map((child: any, i: number) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 p-3 rounded-lg bg-muted/20">
                  <ReviewItem label={`Child ${i + 1} Name`} value={child.name} />
                  <ReviewItem label="Date of Birth" value={child.dateOfBirth} />
                  <ReviewItem label="Gender" value={child.gender} />
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Nominees */}
      {v.nominees && v.nominees.length > 0 && (
        <SectionCard>
          <ReviewSection title="Nominees" icon={FileUser}>
            <div className="space-y-2">
              {v.nominees.map((nominee: any, i: number) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 p-3 rounded-lg bg-muted/20">
                  <ReviewItem label={`Nominee ${i + 1}`} value={nominee.name} />
                  <ReviewItem label="Relation" value={nominee.relation} />
                  <ReviewItem label="NID Number" value={nominee.nidNumber} />
                </div>
              ))}
            </div>
          </ReviewSection>
        </SectionCard>
      )}

      {/* Banking */}
      {(v.bankName || v.accountNumber) && (
        <SectionCard>
          <ReviewSection title="Banking" icon={Landmark}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
              <ReviewItem label="Bank Name" value={v.bankName} />
              <ReviewItem label="Branch" value={v.bankBranch} />
              <ReviewItem label="Account Number" value={v.accountNumber} />
              <ReviewItem label="Account Type" value={v.accountType} />
              <ReviewItem label="Routing Number" value={v.routingNumber} />
              <ReviewItem label="SWIFT Code" value={v.swiftCode} />
              <ReviewItem label="IBAN Number" value={v.ibanNumber} />
            </div>
          </ReviewSection>
        </SectionCard>
      )}

      {/* Confirmation Note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <svg className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Before submitting</p>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-300/80 mt-0.5">
            Please double-check all details. Once submitted, an admin must approve changes to critical fields like NID, banking, and employment type.
          </p>
        </div>
      </div>
    </div>
  )
}
