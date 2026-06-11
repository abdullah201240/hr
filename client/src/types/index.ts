import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  roles?: string[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface User {
  name: string
  email: string
  avatar: string
  role: string
}
