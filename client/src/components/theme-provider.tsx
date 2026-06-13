import { useEffect, useMemo, useState } from "react"
import { ThemeProviderContext, type Theme, type SidebarSize } from "@/hooks/use-theme"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultSidebarSize?: SidebarSize
  storageKey?: string
  sidebarStorageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultSidebarSize = "large",
  storageKey = "hr-theme",
  sidebarStorageKey = "hr-sidebar-size",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme
    }
    return defaultTheme
  })

  const [sidebarSize, setSidebarSizeState] = useState<SidebarSize>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(sidebarStorageKey) as SidebarSize) || defaultSidebarSize
    }
    return defaultSidebarSize
  })

  const resolvedTheme = useMemo(() => {
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      return systemTheme
    }
    return theme
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    // Only update if the theme actually changed
    if (!root.classList.contains(resolvedTheme)) {
      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)
    }
  }, [resolvedTheme])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(mediaQuery.matches ? "dark" : "light")
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  const setSidebarSize = (newSize: SidebarSize) => {
    localStorage.setItem(sidebarStorageKey, newSize)
    setSidebarSizeState(newSize)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme, sidebarSize, setSidebarSize }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
