import { z } from "zod"
import { User, Briefcase, HeartHandshake, FileUser, Landmark, CheckCircle2, FileText } from "lucide-react"

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^A-Za-z0-9]/, "At least one special character")

export const employeeFormSchema = z
  .object({
    // Personal
    employeeId: z.string().min(1, "Required"),
    fullNameEnglish: z.string().min(1, "Required"),
    fullNameBangla: z.string().default(""),
    email: z.string().min(1, "Required").email("Invalid email"),
    personalEmail: z.string().email("Invalid email").optional().or(z.literal("")).default(""),
    phone: z.string().min(1, "Required"),
    personalMobileNumber: z.string().default(""),
    religion: z.string().min(1, "Required"),
    gender: z.string().min(1, "Required"),
    fatherNameEnglish: z.string().default(""),
    fatherNameBangla: z.string().default(""),
    motherNameEnglish: z.string().default(""),
    motherNameBangla: z.string().default(""),
    employeePhoto: z.any().refine(
      (file) => file instanceof File || (typeof file === "string" && file.length > 0),
      "Photo required",
    ),
    nidNumber: z.string().min(1, "Required"),
    currentAddress: z.string().default(""),
    permanentAddress: z.string().default(""),
    joinDate: z.string().min(1, "Required"),
    dateOfBirth: z.string().min(1, "Required"),
    emergencyContactName: z.string().default(""),
    emergencyContactRelation: z.string().default(""),
    emergencyContactNumber: z.string().default(""),
    // Employment
    designation: z.string().min(1, "Required"),
    department: z.string().min(1, "Required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Required"),
    tinNumber: z.string().default(""),
    nidPdf: z.any().optional(),
    bloodGroup: z.string().default("Not Specified"),
    employeeType: z.string().min(1, "Required"),
    lineManager: z.string().default(""),
    // Family
    maritalStatus: z.string().default("Single"),
    spouses: z
      .array(
        z.object({
          name: z.string().default(""),
          nid: z.string().default(""),
          phone: z.string().default(""),
          occupation: z.string().default(""),
          marriageDate: z.string().default(""),
        }),
      )
      .default([]),
    children: z
      .array(
        z.object({
          name: z.string().default(""),
          dateOfBirth: z.string().default(""),
          gender: z.string().default("Not Specified"),
        }),
      )
      .default([]),
    // Nominee
    nominees: z
      .array(
        z.object({
          name: z.string().default(""),
          relation: z.string().default(""),
          nidNumber: z.string().default(""),
          nidPdf: z.any().optional(),
          photo: z.any().optional(),
        }),
      )
      .default([]),
    // Banking
    bankName: z.string().default(""),
    bankBranch: z.string().default(""),
    accountNumber: z.string().default(""),
    accountType: z.string().default(""),
    routingNumber: z.string().default(""),
    swiftCode: z.string().default(""),
    ibanNumber: z.string().default(""),
    bankStatementPdf: z.any().optional(),
    documents: z
      .array(
        z.object({
          title: z.string().min(1, "Title is required"),
          description: z.string().optional().default(""),
          file: z.any().refine(
            (file) => file instanceof File || (typeof file === "string" && file.length > 0),
            "File is required",
          ),
        })
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    }
  })

export type EmployeeFormInput = z.input<typeof employeeFormSchema>

export type StepKey = "personal" | "work" | "family" | "nominee" | "banking" | "documents" | "review"

export const STEPS = [
  { key: "personal" as const, label: "Personal", icon: User },
  { key: "work" as const, label: "Employment", icon: Briefcase },
  { key: "family" as const, label: "Family", icon: HeartHandshake },
  { key: "nominee" as const, label: "Nominee", icon: FileUser },
  { key: "banking" as const, label: "Banking", icon: Landmark },
  { key: "documents" as const, label: "Documents", icon: FileText },
  { key: "review" as const, label: "Review", icon: CheckCircle2 },
]

export const PERSONAL_FIELDS: (keyof EmployeeFormInput)[] = [
  "employeeId", "fullNameEnglish", "email", "personalEmail",
  "phone", "religion", "gender", "employeePhoto", "nidNumber", "joinDate", "dateOfBirth",
]

export const WORK_FIELDS: (keyof EmployeeFormInput)[] = [
  "designation", "department", "password", "confirmPassword", "employeeType", "lineManager",
]

export const FAMILY_FIELDS: (keyof EmployeeFormInput)[] = [
  "maritalStatus",
]

export const NOMINEE_FIELDS: (keyof EmployeeFormInput)[] = [
  "nominees",
]

export const BANKING_FIELDS: (keyof EmployeeFormInput)[] = [
  "bankName", "bankBranch", "accountNumber", "accountType", "routingNumber", "swiftCode", "ibanNumber",
]

export const DOCUMENTS_FIELDS: (keyof EmployeeFormInput)[] = [
  "documents",
]

export const DEFAULT_VALUES: EmployeeFormInput = {
  employeeId: "",
  fullNameEnglish: "",
  fullNameBangla: "",
  email: "",
  personalEmail: "",
  phone: "",
  personalMobileNumber: "",
  religion: "",
  gender: "Not Specified",
  fatherNameEnglish: "",
  fatherNameBangla: "",
  motherNameEnglish: "",
  motherNameBangla: "",
  employeePhoto: null,
  nidNumber: "",
  currentAddress: "",
  permanentAddress: "",
  joinDate: new Date().toISOString().split("T")[0],
  dateOfBirth: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactNumber: "",
  designation: "Software Engineer",
  department: "Engineering",
  password: "",
  confirmPassword: "",
  tinNumber: "",
  nidPdf: null,
  bloodGroup: "Not Specified",
  employeeType: "Probation",
  lineManager: "",
  maritalStatus: "Single",
  spouses: [],
  children: [],
  nominees: [],
  bankName: "",
  bankBranch: "",
  accountNumber: "",
  accountType: "",
  routingNumber: "",
  swiftCode: "",
  ibanNumber: "",
  bankStatementPdf: null,
  documents: [],
}
