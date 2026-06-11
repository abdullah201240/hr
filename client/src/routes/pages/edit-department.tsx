import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionCard, SectionTitle, Field, StepHeader } from "@/components/employee/form-ui"
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

export default function EditDepartmentPage() {
  const navigate = useNavigate()
  const { name: paramName } = useParams()
  const [name, setName] = useState("")
  const [head, setHead] = useState("")
  const [count, setCount] = useState("0")
  const [openRoles, setOpenRoles] = useState("0")
  const [color, setColor] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const stored = localStorage.getItem("departments_list")
    const currentList = stored ? JSON.parse(stored) : initialDepartments
    const dept = currentList.find((d: any) => d.name === decodeURIComponent(paramName || ""))
    if (dept) {
      setName(dept.name)
      setHead(dept.head)
      setCount(String(dept.count || 0))
      setOpenRoles(String(dept.openRoles || 0))
      setColor(dept.color || "")
    } else {
      Swal.fire("Error", "Department not found", "error").then(() => navigate("/departments"))
    }
  }, [paramName, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple validation
    const nextErrors: { [key: string]: string } = {}
    if (!name.trim()) nextErrors.name = "Department Name is required"
    if (!head.trim()) nextErrors.head = "Head of Department is required"
    
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const stored = localStorage.getItem("departments_list")
    const currentList = stored ? JSON.parse(stored) : initialDepartments
    
    const updatedList = currentList.map((d: any) => {
      if (d.name === decodeURIComponent(paramName || "")) {
        return {
          name: name.trim(),
          head: head.trim(),
          count: parseInt(count) || 0,
          openRoles: parseInt(openRoles) || 0,
          color: color || "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        }
      }
      return d
    })

    localStorage.setItem("departments_list", JSON.stringify(updatedList))

    Swal.fire({
      title: "Saved!",
      text: "Department changes saved successfully.",
      icon: "success",
      confirmButtonText: "Done",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled"
      }
    }).then(() => {
      navigate("/departments")
    })
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/departments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <StepHeader 
          title="Edit Department" 
          description="Update department details, leadership, or headcount."
          icon={Building2}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard>
          <SectionTitle icon={Building2}>Department Details</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Department Name" required error={errors.name}>
              <Input 
                value={name} 
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors(prev => ({ ...prev, name: "" }))
                }}
                placeholder="e.g. Quality Assurance" 
              />
            </Field>

            <Field label="Head of Department" required error={errors.head}>
              <Input 
                value={head} 
                onChange={(e) => {
                  setHead(e.target.value)
                  if (errors.head) setErrors(prev => ({ ...prev, head: "" }))
                }}
                placeholder="e.g. John Doe" 
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Total Members" hint="Number of current team members">
                <Input 
                  type="number" 
                  value={count} 
                  onChange={(e) => setCount(e.target.value)} 
                />
              </Field>

              <Field label="Open Roles" hint="Number of active vacancies">
                <Input 
                  type="number" 
                  value={openRoles} 
                  onChange={(e) => setOpenRoles(e.target.value)} 
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/departments")}>
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
