import { useState } from "react"
import { useSearchParams } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/common/user-avatar"
import { useAuthStore } from "@/store/useAuthStore"
import { useDepartmentQuery } from "@/hooks/useDepartments"
import { useDesignationQuery } from "@/hooks/useDesignations"
import { useEmployeeQuery, useEmployeeOptionsQuery } from "@/hooks/useEmployees"
import { apiClient } from "@/lib/api"
import { useMyPayslipsQuery } from "@/hooks/usePayroll"
import { DetailedPayslipDialog } from "@/components/payroll/DetailedPayslipDialog"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Loader2,
  Printer,
  FileText,
  Heart,
  Landmark,
  Shield,
  Baby,
  FileUser,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data: any) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

function InfoField({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="text-xs font-semibold">{value || "—"}</p>
    </div>
  )
}

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "personal"

  const { user } = useAuthStore()

  const { data: employee, isLoading: isEmployeeLoading } = useEmployeeQuery(user?.id || "")
  const { data: department } = useDepartmentQuery(user?.departmentId || "")
  const { data: designation } = useDesignationQuery(user?.designationId || "")
  const { data: employeeOptions } = useEmployeeOptionsQuery()

  const lineManagerName = employee?.lineManagerId
    ? employeeOptions?.find((e) => e.id === employee.lineManagerId)?.fullNameEnglish || "Assigned"
    : null

  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data: payslips, isLoading: isPayslipsLoading } = useMyPayslipsQuery()

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)

  const formatMonthKey = (monthKey?: string) => {
    if (!monthKey) return "—"
    const [year, month] = monthKey.split("-")
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
  }

  const formatDate = (d?: string | null) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
    setErrors({})
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const result = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword })
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {}
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message
      })
      setErrors(fieldErrors)
      return
    }
    setIsUpdatingPassword(true)
    try {
      await apiClient.patch("auth/change-password", { currentPassword, newPassword })
      toast.success("Password updated successfully!", { description: "Your credentials have been refreshed." })
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message || "Failed to update password. Please check your current password.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (!user || isEmployeeLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const mappedUser = { name: user.fullNameEnglish, email: user.email, avatar: user.employeePhotoUrl || "" }
  const statusText = employee?.status ? employee.status.charAt(0).toUpperCase() + employee.status.slice(1) : "Active"

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="overflow-hidden bg-card/40 border-none relative">
        <CardContent className="p-6 flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
            <div className="relative border-4 border-background rounded-full overflow-hidden bg-background">
              <UserAvatar user={mappedUser} size="lg" className="h-20 w-20 text-xl" />
            </div>
            <div className="space-y-1 pb-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-xl font-bold">{employee?.fullNameEnglish || user.fullNameEnglish}</h2>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 font-bold border-none text-[10px] h-5">
                  {statusText}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 justify-center md:justify-start">
                <Building className="h-3.5 w-3.5 text-indigo-500" />
                {designation?.name || "Employee"} • {department?.name || "Human Resources"}
              </p>
              {employee?.fullNameBangla && (
                <p className="text-[10px] text-muted-foreground">{employee.fullNameBangla}</p>
              )}
            </div>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p className="text-[10px] text-muted-foreground font-mono">Employee ID: {employee?.employeeId || user.employeeId}</p>
            <p className="text-[10px] text-muted-foreground">Joined: {formatDate(employee?.joinDate || user.joinDate)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 shadow-none border border-border/40 bg-muted/20 max-w-[900px]">
          <TabsTrigger value="personal" className="text-[11px]">Personal</TabsTrigger>
          <TabsTrigger value="employment" className="text-[11px]">Employment</TabsTrigger>
          <TabsTrigger value="family" className="text-[11px]">Family</TabsTrigger>
          <TabsTrigger value="nominee" className="text-[11px]">Nominee</TabsTrigger>
          <TabsTrigger value="banking" className="text-[11px]">Banking</TabsTrigger>
          <TabsTrigger value="documents" className="text-[11px]">Documents</TabsTrigger>
          <TabsTrigger value="payslips" className="text-[11px]">Payslips</TabsTrigger>
          <TabsTrigger value="security" className="text-[11px]">Security</TabsTrigger>
        </TabsList>

        {/* ─── Personal Info ─── */}
        <TabsContent value="personal" className="space-y-6">
          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                Personal Information
              </CardTitle>
              <CardDescription>Identification and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField label="Full Name (English)" value={employee?.fullNameEnglish} icon={User} />
                <InfoField label="Full Name (Bangla)" value={employee?.fullNameBangla} />
                <InfoField label="Work Email" value={employee?.email} icon={Mail} />
                <InfoField label="Personal Email" value={employee?.personalEmail} icon={Mail} />
                <InfoField label="Phone" value={employee?.phone} icon={Phone} />
                <InfoField label="Personal Mobile" value={employee?.personalMobileNumber} icon={Phone} />
                <InfoField label="Date of Birth" value={formatDate(employee?.dateOfBirth)} icon={Calendar} />
                <InfoField label="Gender" value={employee?.gender} />
                <InfoField label="Religion" value={employee?.religion} />
                <InfoField label="Blood Group" value={employee?.bloodGroup} />
                <InfoField label="Marital Status" value={employee?.maritalStatus} icon={Heart} />
                <InfoField label="NID Number" value={employee?.nidNumber} icon={Shield} />
                <InfoField label="TIN Number" value={employee?.tinNumber} />
              </div>

              {employee?.nidPdfUrl && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">NID Document</p>
                  <a href={employee.nidPdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline font-semibold">View NID PDF</a>
                </div>
              )}

              {employee?.employeePhotoUrl && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Employee Photo</p>
                  <img src={employee.employeePhotoUrl} alt="Employee" className="h-24 w-24 rounded-lg object-cover border" />
                </div>
              )}

              <Separator className="bg-border/20" />

              <div className="grid gap-6 sm:grid-cols-2">
                <InfoField label="Father's Name (English)" value={employee?.fatherNameEnglish} />
                <InfoField label="Father's Name (Bangla)" value={employee?.fatherNameBangla} />
                <InfoField label="Mother's Name (English)" value={employee?.motherNameEnglish} />
                <InfoField label="Mother's Name (Bangla)" value={employee?.motherNameBangla} />
              </div>

              <Separator className="bg-border/20" />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> Current Address</p>
                  <p className="text-xs font-semibold">{employee?.currentAddress || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> Permanent Address</p>
                  <p className="text-xs font-semibold">{employee?.permanentAddress || "—"}</p>
                </div>
              </div>

              <Separator className="bg-border/20" />

              <div className="grid gap-6 sm:grid-cols-3">
                <InfoField label="Emergency Contact Name" value={employee?.emergencyContactName} />
                <InfoField label="Emergency Contact Relation" value={employee?.emergencyContactRelation} />
                <InfoField label="Emergency Contact Number" value={employee?.emergencyContactNumber} icon={Phone} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Employment ─── */}
        <TabsContent value="employment" className="space-y-6">
          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                Employment Information
              </CardTitle>
              <CardDescription>Company position and work details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField label="Employee ID" value={employee?.employeeId} icon={Shield} />
                <InfoField label="Department" value={department?.name} icon={Building} />
                <InfoField label="Designation" value={designation?.name} />
                <InfoField label="Employment Type" value={employee?.employeeType} />
                <InfoField label="Date of Joining" value={formatDate(employee?.joinDate)} icon={Calendar} />
                <InfoField label="Line Manager" value={lineManagerName || "None"} icon={UserCheck} />
                <InfoField label="Status" value={statusText} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Family ─── */}
        <TabsContent value="family" className="space-y-6">
          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Spouse Information
              </CardTitle>
              <CardDescription>Marital and spouse details</CardDescription>
            </CardHeader>
            <CardContent>
              {employee?.spouses && employee.spouses.length > 0 ? (
                <div className="space-y-4">
                  {employee.spouses.map((spouse, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                      <p className="text-xs font-bold text-muted-foreground">Spouse {idx + 1}</p>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <InfoField label="Name" value={spouse.name} />
                        <InfoField label="NID" value={spouse.nid} />
                        <InfoField label="Phone" value={spouse.phone} icon={Phone} />
                        <InfoField label="Occupation" value={spouse.occupation} />
                        <InfoField label="Marriage Date" value={formatDate(spouse.marriageDate)} icon={Calendar} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No spouse information recorded.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Baby className="h-4 w-4 text-sky-500" />
                Children Information
              </CardTitle>
              <CardDescription>Details of children</CardDescription>
            </CardHeader>
            <CardContent>
              {employee?.children && employee.children.length > 0 ? (
                <div className="space-y-4">
                  {employee.children.map((child, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                      <p className="text-xs font-bold text-muted-foreground">Child {idx + 1}</p>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <InfoField label="Name" value={child.name} />
                        <InfoField label="Date of Birth" value={formatDate(child.dateOfBirth)} icon={Calendar} />
                        <InfoField label="Gender" value={child.gender} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No children information recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Nominee ─── */}
        <TabsContent value="nominee" className="space-y-6">
          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileUser className="h-4 w-4 text-amber-500" />
                Nominee Information
              </CardTitle>
              <CardDescription>Nominated beneficiaries</CardDescription>
            </CardHeader>
            <CardContent>
              {employee?.nominees && employee.nominees.length > 0 ? (
                <div className="space-y-4">
                  {employee.nominees.map((nominee, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                      <p className="text-xs font-bold text-muted-foreground">Nominee {idx + 1}</p>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <InfoField label="Name" value={nominee.name} />
                        <InfoField label="Relation" value={nominee.relation} />
                        <InfoField label="NID Number" value={nominee.nidNumber} />
                      </div>
                      <div className="flex gap-4">
                        {nominee.nidPdfUrl && (
                          <a href={nominee.nidPdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View NID PDF</a>
                        )}
                        {nominee.photoUrl && (
                          <a href={nominee.photoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View Photo</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No nominee information recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Banking ─── */}
        <TabsContent value="banking" className="space-y-6">
          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Landmark className="h-4 w-4 text-blue-500" />
                Bank Details
              </CardTitle>
              <CardDescription>Salary account and banking information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee?.bankDetails ? (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoField label="Bank Name" value={employee.bankDetails.bankName} icon={Landmark} />
                    <InfoField label="Branch" value={employee.bankDetails.branch} />
                    <InfoField label="Account Number" value={employee.bankDetails.accountNumber} />
                    <InfoField label="Account Type" value={employee.bankDetails.accountType} />
                    <InfoField label="Routing Number" value={employee.bankDetails.routingNumber} />
                    <InfoField label="SWIFT Code" value={employee.bankDetails.swiftCode} />
                    <InfoField label="IBAN" value={employee.bankDetails.ibanNumber} />
                  </div>
                  {employee.bankDetails.bankStatementPdfUrl && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-medium">Bank Statement</p>
                      <a href={employee.bankDetails.bankStatementPdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline font-semibold">View Bank Statement PDF</a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No banking information recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Documents ─── */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-500" />
                Documents
              </CardTitle>
              <CardDescription>Uploaded employee documents</CardDescription>
            </CardHeader>
            <CardContent>
              {employee?.documents && employee.documents.length > 0 ? (
                <div className="space-y-4">
                  {employee.documents.map((doc, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold">{doc.title}</p>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline flex items-center gap-1">
                            <Eye className="h-3 w-3" /> View File
                          </a>
                        )}
                      </div>
                      {doc.description && <p className="text-[11px] text-muted-foreground">{doc.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No documents uploaded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Security ─── */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card/30 border-none max-w-lg">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-rose-500" />
                Security Settings
              </CardTitle>
              <CardDescription>Change password to secure your personal account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Current Password</Label>
                  <div className="relative">
                    <Input type={showCurrent ? "text" : "password"} value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: "" })) }}
                      placeholder="Enter current password" className="pr-10 text-xs h-9 bg-secondary" required />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.currentPassword && <p className="text-[10px] text-destructive mt-0.5">{errors.currentPassword}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <div className="relative">
                    <Input type={showNew ? "text" : "password"} value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: "" })) }}
                      placeholder="Min. 6 characters" className="pr-10 text-xs h-9 bg-secondary" required />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-[10px] text-destructive mt-0.5">{errors.newPassword}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Confirm New Password</Label>
                  <div className="relative">
                    <Input type={showConfirm ? "text" : "password"} value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" })) }}
                      placeholder="Repeat new password" className="pr-10 text-xs h-9 bg-secondary" required />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] text-destructive mt-0.5">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full gap-2 text-xs h-9" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Payslips ─── */}
        <TabsContent value="payslips" className="space-y-6">
          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                My Payslips
              </CardTitle>
              <CardDescription>View and print your published salary statements</CardDescription>
            </CardHeader>
            <CardContent>
              {isPayslipsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : payslips && payslips.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                        <th className="pb-3 pt-2">Salary Period</th>
                        <th className="pb-3 pt-2">Basic Salary</th>
                        <th className="pb-3 pt-2">Net Pay</th>
                        <th className="pb-3 pt-2">Payment Status</th>
                        <th className="pb-3 pt-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {payslips.map((slip) => (
                        <tr key={slip.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 font-medium font-mono">{formatMonthKey(slip.monthKey)}</td>
                          <td className="py-3 font-semibold">{formatCurrency(slip.basicSalary)}</td>
                          <td className="py-3 font-bold text-primary">{formatCurrency(slip.netPay)}</td>
                          <td className="py-3">
                            <Badge variant="secondary"
                              className={slip.paymentStatus === "Paid"
                                ? "bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]"
                                : "bg-amber-500/10 text-amber-600 border-none font-bold text-[10px]"}>
                              {slip.paymentStatus}
                            </Badge>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                              onClick={() => { setSelectedPayslip(slip); setIsDialogOpen(true) }}>
                              <Eye className="h-3.5 w-3.5" /> Details
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                              onClick={() => window.open(`/payroll/print/${slip.monthKey}/${slip.id}`, "_blank")}>
                              <Printer className="h-3.5 w-3.5" /> Print
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">No Payslips Found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your monthly statements will appear here after payroll distribution.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedPayslip && (
        <DetailedPayslipDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setSelectedPayslip(null) }}
          viewPayslip={selectedPayslip}
          empPfRate={10}
          selectedMonth={selectedPayslip.monthKey}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  )
}
