import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  permissions?: string[]
  items?: NavItem[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface User {
  name: string
  email: string
  avatar: string
  customRoleId?: string | null
  departmentId?: string | null
  permissions?: string[]
}

export * from "./org"
export * from "./leave"
export * from "./attendance"
export * from "./provident-fund"
export * from "./salary"
export * from "./claims"


