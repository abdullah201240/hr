import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { SectionCard, SectionTitle, StepHeader, ReviewItem } from "@/components/employee/form-ui"
import { Building2, ArrowLeft } from "lucide-react"
import Swal from "sweetalert2"

const initialDepartments = [
  { name: "Engineering", head: "Michael Torres", count: 64, openRoles: 5, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { name: "Product", head: "Sarah Chen", count: 32, openRoles: 2, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { name: "Marketing", head: "Anna Williams", count: 28, openRoles: 3, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  { name: "Sales", head: "Robert Davis", count: 45, openRoles: 8, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { name: "Human Resources", head: "Patricia Lee", count: 12, openRoles: 1, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { name: "Finance", head: "Thomas Wright", count: 18, openRoles: 2, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
]

export default function ViewDepartmentPage() {
  const navigate = useNavigate()
  const { name: paramName } = useParams()
  const [dept, setDept] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem("departments_list")
    const currentList = stored ? JSON.parse(stored) : initialDepartments
    const found = currentList.find((d: any) => d.name === decodeURIComponent(paramName || ""))
    if (found) {
      setDept(found)
    } else {
      Swal.fire("Error", "Department not found", "error").then(() => navigate("/departments"))
    }
  }, [paramName, navigate])

  if (!dept) return null

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
            <ReviewItem label="Head of Department" value={dept.head} />
            <ReviewItem label="Total Members" value={`${dept.count || 0} members`} />
            <ReviewItem label="Open Vacancies" value={`${dept.openRoles || 0} positions`} />
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
