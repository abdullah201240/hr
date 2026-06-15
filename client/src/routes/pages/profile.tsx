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
import { apiClient } from "@/lib/api"
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

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "info"

  const { user } = useAuthStore()

  // Fetch department and designation names dynamically
  const { data: department } = useDepartmentQuery(user?.departmentId || "")
  const { data: designation } = useDesignationQuery(user?.designationId || "")

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
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsUpdatingPassword(true)
    try {
      await apiClient.patch("auth/change-password", {
        currentPassword,
        newPassword,
      })

      toast.success("Password updated successfully!", {
        description: "Your credentials have been refreshed."
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message || "Failed to update password. Please check your current password.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const mappedUser = {
    name: user.fullNameEnglish,
    email: user.email,
    avatar: user.employeePhotoUrl || "",
    role: designation?.name || user.role,
  }

  const formattedBirthday = user.dateOfBirth 
    ? new Date(user.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—"

  const formattedJoiningDate = user.joinDate
    ? new Date(user.joinDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—"

  const statusText = user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : "Active"

  return (
    <div className="space-y-6">
      {/* Overview Card without gradient color banner */}
      <Card className="overflow-hidden bg-card/40 border-none relative">
        <CardContent className="p-6 flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
            <div className="relative border-4 border-background rounded-full overflow-hidden bg-background">
              <UserAvatar user={mappedUser} size="lg" className="h-20 w-20 text-xl" />
            </div>
            <div className="space-y-1 pb-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-xl font-bold">{user.fullNameEnglish}</h2>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 font-bold border-none text-[10px] h-5">
                  {statusText}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 justify-center md:justify-start">
                <Building className="h-3.5 w-3.5 text-indigo-500" />
                {designation?.name || user.role} • {department?.name || "Human Resources"}
              </p>
            </div>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p className="text-[10px] text-muted-foreground font-mono">Employee ID: {user.employeeId}</p>
            <p className="text-[10px] text-muted-foreground">Joined: {formattedJoiningDate}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 shadow-none border border-border/40 bg-muted/20 max-w-[450px]">
          <TabsTrigger value="info" className="text-xs">Personal Info</TabsTrigger>
          <TabsTrigger value="job" className="text-xs">Job Profile</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Security & Password</TabsTrigger>
        </TabsList>

        {/* Personal Details */}
        <TabsContent value="info" className="space-y-6">
          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                Personal Details
              </CardTitle>
              <CardDescription>Your personal profile contact and identity records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Work Email
                  </p>
                  <p className="text-xs font-semibold">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Personal Email
                  </p>
                  <p className="text-xs font-semibold">{user.personalEmail || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone Number
                  </p>
                  <p className="text-xs font-semibold">{user.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date of Birth
                  </p>
                  <p className="text-xs font-semibold">{formattedBirthday}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Blood Group</p>
                  <p className="text-xs font-semibold">{user.bloodGroup || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Primary Office Location
                  </p>
                  <p className="text-xs font-semibold">{user.currentAddress ? "Dhaka Office" : "—"}</p>
                </div>
              </div>

              <Separator className="bg-border/20" />

              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium">Home Address</p>
                <p className="text-xs font-semibold">{user.currentAddress || "No address specified"}</p>
              </div>

              <Separator className="bg-border/20" />

              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium">Emergency Contact</p>
                <p className="text-xs font-semibold">
                  {user.emergencyContactName 
                    ? `${user.emergencyContactName} (${user.emergencyContactRelation || "Relation"}) - ${user.emergencyContactNumber || ""}`
                    : "—"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job details */}
        <TabsContent value="job" className="space-y-6">
          <Card className="bg-card/30 border-none">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                Employment Information
              </CardTitle>
              <CardDescription>Company position details and alignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Department</p>
                  <p className="text-xs font-semibold">{department?.name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Designation</p>
                  <p className="text-xs font-semibold">{designation?.name || user.role}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Employment Status</p>
                  <p className="text-xs font-semibold">{user.employeeType || "Full-time"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Direct Report Manager</p>
                  <p className="text-xs font-semibold">{user.lineManagerId ? "Line Manager Assigned" : "Direct Report"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Date of Joining</p>
                  <p className="text-xs font-semibold">{formattedJoiningDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Work Shift Type</p>
                  <p className="text-xs font-semibold">Standard Day Shift (9:00 AM - 6:00 PM)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security & Password */}
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
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: "" }))
                      }}
                      placeholder="Enter current password"
                      className="pr-10 text-xs h-9 bg-secondary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors.currentPassword}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: "" }))
                      }}
                      placeholder="Min. 6 characters"
                      className="pr-10 text-xs h-9 bg-secondary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }))
                      }}
                      placeholder="Repeat new password"
                      className="pr-10 text-xs h-9 bg-secondary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[10px] text-destructive mt-0.5">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full gap-2 text-xs h-9" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
