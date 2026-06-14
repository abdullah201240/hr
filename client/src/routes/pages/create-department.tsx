import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionCard, SectionTitle, Field, StepHeader } from "@/components/employee/form-ui"
import { Building2, ArrowLeft } from "lucide-react"
import Swal from "sweetalert2"
import { z } from "zod"

const initialDepartments = [
  { name: "Engineering", head: "Michael Torres", count: 64, openRoles: 5, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { name: "Product", head: "Sarah Chen", count: 32, openRoles: 2, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { name: "Marketing", head: "Anna Williams", count: 28, openRoles: 3, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  { name: "Sales", head: "Robert Davis", count: 45, openRoles: 8, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { name: "Human Resources", head: "Patricia Lee", count: 12, openRoles: 1, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { name: "Finance", head: "Thomas Wright", count: 18, openRoles: 2, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
]

const departmentSchema = z.object({
  name: z.string().trim().min(1, "Department Name is required"),
  head: z.string().trim().min(1, "Head of Department is required"),
  count: z.preprocess((val) => Number(val) || 0, z.number().min(0, "Count must be 0 or more")),
  openRoles: z.preprocess((val) => Number(val) || 0, z.number().min(0, "Open roles must be 0 or more")),
})

export default function CreateDepartmentPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [head, setHead] = useState("")
  const [count, setCount] = useState("0")
  const [openRoles, setOpenRoles] = useState("0")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Zod validation
    const result = departmentSchema.safeParse({ name, head, count, openRoles })
    
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

    const data = result.data;

    const newDept = {
      name: data.name,
      head: data.head,
      count: data.count,
      openRoles: data.openRoles,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    }

    const stored = localStorage.getItem("departments_list")
    const currentList = stored ? JSON.parse(stored) : initialDepartments
    const updatedList = [newDept, ...currentList]
    localStorage.setItem("departments_list", JSON.stringify(updatedList))

    Swal.fire({
      title: "Created!",
      text: "Department has been created successfully.",
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
          title="Create Department" 
          description="Add a new business unit or department to the organization directory."
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
            Create Department
          </Button>
        </div>
      </form>
    </div>
  )
}
