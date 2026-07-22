import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionCard, SectionTitle, Field, StepHeader } from "@/components/employee/form-ui"
import { Building2, ArrowLeft, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { z } from "zod"
import { useDepartmentQuery, useUpdateDepartmentMutation } from "@/hooks/useDepartments"
import { useEmployeeOptionsQuery } from "@/hooks/useEmployees"

const departmentSchema = z.object({
  name: z.string().trim().min(1, "Department Name is required"),
  code: z.string().trim().min(2, "Code must be at least 2 characters").max(50, "Code cannot exceed 50 characters"),
  description: z.string().trim().optional(),
  headEmployeeId: z.string().trim().uuid("Invalid Head Employee ID").or(z.literal("")).optional(),
  isActive: z.boolean().optional(),
})

export default function EditDepartmentPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [headEmployeeId, setHeadEmployeeId] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Fetch department details
  const { data: department, isLoading } = useDepartmentQuery(id || "")

  // Fetch employees list to populate Head of Department dropdown options
  const { data: employeesList = [] } = useEmployeeOptionsQuery()

  const updateMutation = useUpdateDepartmentMutation(id || "")

  useEffect(() => {
    if (department) {
      setName(department.name || "")
      setCode(department.code || "")
      setDescription(department.description || "")
      setHeadEmployeeId(department.headEmployeeId || "")
      setIsActive(department.isActive ?? true)
    }
  }, [department])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Zod validation
    const result = departmentSchema.safeParse({ name, code, description, headEmployeeId, isActive })
    
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

    const data = result.data

    updateMutation.mutate(
      {
        name: data.name,
        code: data.code,
        description: data.description || "",
        headEmployeeId: data.headEmployeeId || null,
        isActive: data.isActive,
      },
      {
        onSuccess: () => {
          Swal.fire({
            title: "Saved!",
            text: "Department changes saved successfully.",
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary hover:bg-primary/90 text-white font-semibold rounded-md px-4 py-2"
            }
          }).then(() => {
            navigate("/departments")
          })
        },
        onError: (err: any) => {
          Swal.fire({
            title: "Error",
            text: err.message || "Failed to update department",
            icon: "error",
            confirmButtonText: "Ok",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary hover:bg-primary/90 text-white font-semibold rounded-md px-4 py-2"
            }
          })
        }
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/departments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <StepHeader 
          title="Edit Department" 
          description="Update department details, leadership, or status."
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

            <Field label="Department Code" required error={errors.code}>
              <Input 
                value={code} 
                onChange={(e) => {
                  setCode(e.target.value)
                  if (errors.code) setErrors(prev => ({ ...prev, code: "" }))
                }}
                placeholder="e.g. QA" 
              />
            </Field>

            <Field label="Head of Department" error={errors.headEmployeeId}>
              <select
                value={headEmployeeId}
                onChange={(e) => {
                  setHeadEmployeeId(e.target.value)
                  if (errors.headEmployeeId) setErrors(prev => ({ ...prev, headEmployeeId: "" }))
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Head of Department (Optional)</option>
                {employeesList.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullNameEnglish} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Description">
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Brief details about the department operations..."
              />
            </Field>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Department is Active
              </label>
            </div>
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/departments")} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
