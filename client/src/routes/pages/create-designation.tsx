import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { SectionCard, SectionTitle, Field, StepHeader } from "@/components/employee/form-ui"
import { Briefcase, ArrowLeft } from "lucide-react"
import Swal from "sweetalert2"

const initialDepartments = [
  { name: "Engineering", head: "Michael Torres", count: 64, openRoles: 5 },
  { name: "Product", head: "Sarah Chen", count: 32, openRoles: 2 },
  { name: "Marketing", head: "Anna Williams", count: 28, openRoles: 3 },
  { name: "Sales", head: "Robert Davis", count: 45, openRoles: 8 },
  { name: "Human Resources", head: "Patricia Lee", count: 12, openRoles: 1 },
  { name: "Finance", head: "Thomas Wright", count: 18, openRoles: 2 },
]

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

export default function CreateDesignationPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const [department, setDepartment] = useState("")
  const [count, setCount] = useState("0")
  const [openRoles, setOpenRoles] = useState("0")
  const [depts, setDepts] = useState<any[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const stored = localStorage.getItem("departments_list")
    setDepts(stored ? JSON.parse(stored) : initialDepartments)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple validation
    const nextErrors: { [key: string]: string } = {}
    if (!name.trim()) nextErrors.name = "Designation Title is required"
    if (!grade.trim()) nextErrors.grade = "Pay Grade is required"
    if (!department) nextErrors.department = "Department is required"
    
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const newDesg = {
      name: name.trim(),
      grade: grade.trim(),
      department,
      count: parseInt(count) || 0,
      openRoles: parseInt(openRoles) || 0,
    }

    const stored = localStorage.getItem("designations_list")
    const currentList = stored ? JSON.parse(stored) : initialDesignations
    const updatedList = [newDesg, ...currentList]
    localStorage.setItem("designations_list", JSON.stringify(updatedList))

    Swal.fire({
      title: "Created!",
      text: "Designation has been created successfully.",
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
          title="Create Designation" 
          description="Create a new designation/title with custom grading and department mapping."
          icon={Briefcase}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard>
          <SectionTitle icon={Briefcase}>Designation Details</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Designation Title" required error={errors.name}>
              <Input 
                value={name} 
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors(prev => ({ ...prev, name: "" }))
                }}
                placeholder="e.g. Lead QA Engineer" 
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Department" required error={errors.department}>
                <Select onValueChange={(val) => {
                  setDepartment(val)
                  if (errors.department) setErrors(prev => ({ ...prev, department: "" }))
                }} value={department}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {depts.map(d => (
                      <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Pay Grade" required error={errors.grade}>
                <Select onValueChange={(val) => {
                  setGrade(val)
                  if (errors.grade) setErrors(prev => ({ ...prev, grade: "" }))
                }} value={grade}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">L1 - Junior / Entry</SelectItem>
                    <SelectItem value="L2">L2 - Mid / Intermediate</SelectItem>
                    <SelectItem value="L3">L3 - Senior / Lead</SelectItem>
                    <SelectItem value="L4">L4 - Principal / Manager</SelectItem>
                    <SelectItem value="L5">L5 - Director / Executive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Active Occupants" hint="Number of employees with this role">
                <Input 
                  type="number" 
                  value={count} 
                  onChange={(e) => setCount(e.target.value)} 
                />
              </Field>

              <Field label="Open Vacancies" hint="Number of open recruitment openings">
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
            Create Designation
          </Button>
        </div>
      </form>
    </div>
  )
}
