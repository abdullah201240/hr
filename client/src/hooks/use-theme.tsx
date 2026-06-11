import { createContext, useContext } from "react"

export type Theme = "dark" | "light" | "system"
export type SidebarSize = "small" | "large"

export interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
  sidebarSize: SidebarSize
  setSidebarSize: (size: SidebarSize) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light",
  sidebarSize: "large",
  setSidebarSize: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
