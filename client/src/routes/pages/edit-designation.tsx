import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
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
import { Briefcase, ArrowLeft, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { z } from "zod"
import { useDesignationQuery, useUpdateDesignationMutation } from "@/hooks/useDesignations"

const designationSchema = z.object({
  name: z.string().trim().min(1, "Designation Title is required"),
  code: z.string().trim().min(2, "Code must be at least 2 characters").max(50, "Code cannot exceed 50 characters"),
  grade: z.string().trim().min(1, "Pay Grade is required"),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
})

export default function EditDesignationPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [grade, setGrade] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Fetch designation details
  const { data: designation, isLoading } = useDesignationQuery(id || "")

  const updateMutation = useUpdateDesignationMutation(id || "")

  useEffect(() => {
    if (designation) {
      setName(designation.name || "")
      setCode(designation.code || "")
      setGrade(designation.grade || "")
      setDescription(designation.description || "")
      setIsActive(designation.isActive ?? true)
    }
  }, [designation])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Zod validation
    const result = designationSchema.safeParse({ name, code, grade, description, isActive })
    
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
        grade: data.grade,
        description: data.description || "",
        isActive: data.isActive,
      },
      {
        onSuccess: () => {
          Swal.fire({
            title: "Saved!",
            text: "Designation changes saved successfully.",
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary hover:bg-primary/90 text-white font-semibold rounded-md px-4 py-2"
            }
          }).then(() => {
            navigate("/departments?tab=designations")
          })
        },
        onError: (err: any) => {
          Swal.fire({
            title: "Error",
            text: err.message || "Failed to update designation",
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
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/departments?tab=designations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <StepHeader 
          title="Edit Designation" 
          description="Update designation details, code or grade standard."
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

            <Field label="Designation Code" required error={errors.code}>
              <Input 
                value={code} 
                onChange={(e) => {
                  setCode(e.target.value)
                  if (errors.code) setErrors(prev => ({ ...prev, code: "" }))
                }}
                placeholder="e.g. LQE" 
              />
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

            <Field label="Description">
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Brief details about the designation responsibilities..."
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
                Designation is Active
              </label>
            </div>
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/departments?tab=designations")} disabled={updateMutation.isPending}>
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
