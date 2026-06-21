import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  roles?: string[]
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
  role: 'admin' | 'hr' | 'manager' | 'employee'
}

export * from "./org"
export * from "./leave"
export * from "./attendance"
export * from "./festival-bonus"
export * from "./provident-fund"
export * from "./salary"
export * from "./claims"



