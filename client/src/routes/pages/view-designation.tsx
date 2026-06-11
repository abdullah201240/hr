import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { SectionCard, SectionTitle, StepHeader, ReviewItem } from "@/components/employee/form-ui"
import { Briefcase, ArrowLeft } from "lucide-react"
import Swal from "sweetalert2"

const initialDesignations = [
  { name: "Software Engineer", grade: "L1", department: "Engineering", count: 24, openRoles: 2 },
  { name: "Senior Software Engineer", grade: "L2", department: "Engineering", count: 18, openRoles: 1 },
  { name: "Tech Lead", grade: "L3", department: "Engineering", count: 8, openRoles: 1 },
  { name: "Engineering Manager", grade: "L4", department: "Engineering", count: 4, openRoles: 1 },
  { name: "Product Manager", grade: "L3", department: "Product", count: 12, openRoles: 1 },
  { name: "Designer", grade: "L2", department: "Product", count: 14, openRoles: 2 },
  { name: "HR Specialist", grade: "L2", department: "HR", count: 6, openRoles: 0 },
  { name: "Finance Analyst", grade: "L2", department: "Finance", count: 8, openRoles: 1 },
  { name: "Marketing Lead", grade: "L3", department: "Marketing", count: 10, openRoles: 2 },
  { name: "Sales Rep", grade: "L1", department: "Sales", count: 20, openRoles: 5 },
]

export default function ViewDesignationPage() {
  const navigate = useNavigate()
  const { name: paramName } = useParams()
  const [desg, setDesg] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem("designations_list")
    const currentList = stored ? JSON.parse(stored) : initialDesignations
    const found = currentList.find((d: any) => d.name === decodeURIComponent(paramName || ""))
    if (found) {
      setDesg(found)
    } else {
      Swal.fire("Error", "Designation not found", "error").then(() => navigate("/departments"))
    }
  }, [paramName, navigate])

  if (!desg) return null

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/departments")}>
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
            <ReviewItem label="Department" value={desg.department} />
            <ReviewItem label="Pay Grade" value={`Grade ${desg.grade}`} />
            <ReviewItem label="Active Occupants" value={`${desg.count || 0} officers`} />
            <ReviewItem label="Open Vacancies" value={`${desg.openRoles || 0} positions`} />
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
