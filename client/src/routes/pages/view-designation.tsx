import { useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { SectionCard, SectionTitle, StepHeader, ReviewItem } from "@/components/employee/form-ui"
import { Briefcase, ArrowLeft, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { useDesignationQuery } from "@/hooks/useDesignations"

export default function ViewDesignationPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  // Fetch designation details
  const { data: desg, isLoading, isError } = useDesignationQuery(id || "")

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !desg) {
    Swal.fire("Error", "Designation not found", "error").then(() => navigate("/departments?tab=designations"))
    return null
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/departments?tab=designations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <StepHeader 
          title="Designation Details" 
          description="Read-only view of designation details and statistics."
          icon={Briefcase}
        />
      </div>

      <div className="space-y-6">
        <SectionCard>
          <SectionTitle icon={Briefcase}>Designation Information</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
            <ReviewItem label="Designation Title" value={desg.name} />
            <ReviewItem label="Designation Code" value={desg.code} />
            <ReviewItem label="Pay Grade" value={`Grade ${desg.grade || "—"}`} />
            <ReviewItem label="Total Occupants" value={`${desg.employeeCount || 0} active officers`} />
            <ReviewItem label="Status" value={desg.isActive ? "Active" : "Inactive"} />
            <ReviewItem label="Description" value={desg.description || "No description provided"} />
          </div>
        </SectionCard>

        <div className="flex items-center justify-end pt-2">
          <Button type="button" onClick={() => navigate("/departments?tab=designations")}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
