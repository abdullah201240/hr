import { useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { SectionCard, SectionTitle, StepHeader, ReviewItem } from "@/components/employee/form-ui"
import { Building2, ArrowLeft, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { useDepartmentQuery } from "@/hooks/useDepartments"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

export default function ViewDepartmentPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  // Fetch department details
  const { data: dept, isLoading, isError } = useDepartmentQuery(id || "")

  // Fetch head employee name if headEmployeeId exists
  const { data: headEmployee } = useQuery<any>({
    queryKey: ["employees", dept?.headEmployeeId],
    queryFn: () => apiClient.get<any>(`employees/${dept?.headEmployeeId}`),
    enabled: !!dept?.headEmployeeId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !dept) {
    Swal.fire("Error", "Department not found", "error").then(() => navigate("/departments"))
    return null
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/departments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <StepHeader 
          title="Department Profile" 
          description="Read-only view of department details and statistics."
          icon={Building2}
        />
      </div>

      <div className="space-y-6">
        <SectionCard>
          <SectionTitle icon={Building2}>Department Information</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
            <ReviewItem label="Department Name" value={dept.name} />
            <ReviewItem label="Department Code" value={dept.code} />
            <ReviewItem 
              label="Head of Department" 
              value={headEmployee ? `${headEmployee.fullNameEnglish} (${headEmployee.employeeId})` : "Not Assigned"} 
            />
            <ReviewItem label="Total Members" value={`${dept.employeeCount || 0} members`} />
            <ReviewItem label="Status" value={dept.isActive ? "Active" : "Inactive"} />
            <ReviewItem label="Description" value={dept.description || "No description provided"} />
          </div>
        </SectionCard>

        <div className="flex items-center justify-end pt-2">
          <Button type="button" onClick={() => navigate("/departments")}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
