import { useState, useMemo } from "react"
import { useLocation, useNavigate } from "react-router"
import {
  Search,
  Sun,
  Moon,
  Monitor,
  Plus,
  Menu,
  User,
  Settings,
  KeyRound,
  LogOut,
  ChevronRight,
  X,
  UserPlus,
  FilePlus,
  CalendarPlus,
  Megaphone,
  Clock,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/hooks/use-theme"
import { UserAvatar } from "@/components/common/user-avatar"
import { navGroups } from "@/components/navigation/nav-data"

function getPageTitle(pathname: string): string {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href))) {
        return item.title
      }
    }
  }
  return "Dashboard"
}

import { useAuthStore } from "@/store/useAuthStore"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { usePermissions } from "@/hooks/usePermissions"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useTasksQuery } from "@/hooks/useTasks"

export function Header({ onMobileMenuToggle }: { sidebarCollapsed?: boolean; onMobileMenuToggle: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const { user, logout } = useAuthStore()

  interface SearchItem {
    id: string
    title: string
    subtitle?: string
    url: string
    category: "Pages" | "Actions" | "Employees" | "Tasks"
  }

  const [searchQuery, setSearchQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const { canAccessNavItem, hasPermission } = usePermissions()

  // Dynamic search data queries
  const { data: employeesData } = useEmployeesQuery({ limit: 100 }, { enabled: isFocused || showMobileSearch })
  const { data: tasksData } = useTasksQuery({}, { enabled: isFocused || showMobileSearch })

  // Compile searchable pages, actions, and dynamic database objects
  const searchableItems = useMemo(() => {
    const items: SearchItem[] = []

    // 1. Pages/Routes pre-filtered by permission
    navGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (canAccessNavItem(item)) {
          items.push({
            id: `nav-${item.href}`,
            title: item.title,
            subtitle: `Page in ${group.label}`,
            url: item.href,
            category: "Pages",
          })
        }
        if (item.items) {
          item.items.forEach((subItem) => {
            if (canAccessNavItem(subItem)) {
              items.push({
                id: `nav-sub-${subItem.href}`,
                title: subItem.title,
                subtitle: `Page in ${item.title}`,
                url: subItem.href,
                category: "Pages",
              })
            }
          })
        }
      })
    })

    // 2. Allowed quick actions
    const actionTemplates = [
      {
        id: "act-leave",
        title: "Apply for Leave",
        subtitle: "Submit a new leave application request",
        url: "/leave",
        category: "Actions" as const,
        perms: [] as string[],
      },
      {
        id: "act-task",
        title: "Create Task",
        subtitle: "Add new task to tracking board",
        url: "/tasks",
        category: "Actions" as const,
        perms: [] as string[],
      },
      {
        id: "act-emp",
        title: "Onboard Employee",
        subtitle: "Add new employee record",
        url: "/employees",
        category: "Actions" as const,
        perms: ["employees:create"],
      },
      {
        id: "act-bonus",
        title: "Create Festival Bonus Cycle",
        subtitle: "Create new bonus payouts cycle",
        url: "/payroll/festival-bonus",
        category: "Actions" as const,
        perms: ["bonus:create"],
      },
      {
        id: "act-reg",
        title: "Apply for Regulation Adjustment",
        subtitle: "Request policy exception or adjustment",
        url: "/regulations",
        category: "Actions" as const,
        perms: ["regulations:apply"],
      },
    ]

    actionTemplates.forEach((act) => {
      if (act.perms.length === 0 || act.perms.some(p => hasPermission(p))) {
        items.push({
          id: act.id,
          title: act.title,
          subtitle: act.subtitle,
          url: act.url,
          category: act.category,
        })
      }
    })

    // 3. Dynamic Employees
    if (employeesData?.data && hasPermission("employees:read")) {
      employeesData.data.forEach((emp) => {
        items.push({
          id: `emp-${emp.id}`,
          title: emp.fullNameEnglish,
          subtitle: `${emp.designationName || "Employee"} • ${emp.departmentName || ""}`,
          url: "/employees",
          category: "Employees",
        })
      })
    }

    // 4. Dynamic Tasks
    if (tasksData) {
      tasksData.forEach((task) => {
        items.push({
          id: `task-${task.id}`,
          title: task.title,
          subtitle: `Task - Status: ${task.status} | Priority: ${task.priority}`,
          url: "/tasks",
          category: "Tasks",
        })
      })
    }

    return items
  }, [employeesData, tasksData, canAccessNavItem, hasPermission])

  // Pre-build prefix-based Inverted Index Map for fast O(1) lookups
  const indexMap = useMemo(() => {
    const map = new Map<string, Set<SearchItem>>()

    searchableItems.forEach((item) => {
      const tokenString = `${item.title} ${item.subtitle || ""}`.toLowerCase()
      const tokens = tokenString.split(/[^a-z0-9]+/);
      
      tokens.forEach((token) => {
        if (!token) return
        for (let l = 1; l <= Math.min(token.length, 8); l++) {
          const prefix = token.substring(0, l)
          if (!map.has(prefix)) {
            map.set(prefix, new Set())
          }
          map.get(prefix)!.add(item)
        }
      })
    })

    return map
  }, [searchableItems])

  // O(1) instant search query runner
  const filteredResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return []

    const queryTokens = normalizedQuery.split(/[^a-z0-9]+/);
    const matchedSets: Set<SearchItem>[] = []

    for (const token of queryTokens) {
      if (!token) continue
      const set = indexMap.get(token)
      if (set) {
        matchedSets.push(set)
      } else {
        return [] // one token did not match anything
      }
    }

    if (matchedSets.length === 0) return []

    // Intersect matches
    let currentResults = Array.from(matchedSets[0])
    for (let i = 1; i < matchedSets.length; i++) {
      const nextSet = matchedSets[i]
      currentResults = currentResults.filter(item => nextSet.has(item))
    }

    return currentResults.slice(0, 10) // Limit to top 10 results
  }, [searchQuery, indexMap])

  const groupAndRenderResults = (results: SearchItem[], onSelect: (url: string) => void) => {
    const categories: Record<string, SearchItem[]> = {}
    results.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = []
      }
      categories[item.category].push(item)
    })

    return Object.entries(categories).map(([cat, items]) => (
      <div key={cat} className="space-y-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75 px-3 py-1.5 bg-muted/10 rounded-md">
          {cat}
        </div>
        <div className="space-y-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.url)}
              className="w-full flex items-center justify-between p-2 text-left text-xs rounded-lg hover:bg-primary/5 hover:text-primary transition-all group cursor-pointer"
            >
              <div className="flex-grow min-w-0 pr-4">
                <p className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {item.subtitle}
                  </p>
                )}
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/35 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>
    ))
  }

  const pageTitle = getPageTitle(location.pathname)

  const mappedUser = useMemo(() => ({
    name: user?.fullNameEnglish || "Employee",
    email: user?.email || "",
    avatar: user?.employeePhotoUrl || "",
  }), [user?.fullNameEnglish, user?.email, user?.employeePhotoUrl])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/10 bg-sidebar/95 backdrop-blur-sm px-4 lg:px-6 transition-all">
      {/* Mobile Search Overlay */}
      {showMobileSearch ? (
        <div className="absolute inset-0 flex flex-col bg-background px-4 z-40 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 border-b border-border/20 h-14 shrink-0">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 h-9 bg-transparent border-none focus-visible:ring-0 shadow-none px-0 text-sm"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground shrink-0"
              onClick={() => {
                setShowMobileSearch(false)
                setSearchQuery("")
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-grow overflow-y-auto py-2 space-y-3">
            {searchQuery.trim() && (
              filteredResults.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-8">
                  No matching results found
                </div>
              ) : (
                groupAndRenderResults(filteredResults, (url) => {
                  setSearchQuery("")
                  setShowMobileSearch(false)
                  navigate(url)
                })
              )
            )}
          </div>
        </div>
      ) : null}

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8 text-muted-foreground shrink-0"
        onClick={onMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <h1 className="text-base font-medium text-foreground truncate">
          {pageTitle}
        </h1>
        {location.pathname !== "/" && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-normal shrink-0">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="capitalize text-muted-foreground/80">
              {location.pathname.split("/").filter(Boolean).join(" / ")}
            </span>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1 md:hidden" />

      {/* Search Bar - Desktop */}
      <div className="hidden md:flex relative flex-1 max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search employees, tasks, reports..."
          className="pl-9 h-8.5 bg-muted/40 hover:bg-muted/60 dark:bg-muted/20 dark:hover:bg-muted/30 focus:bg-background focus:ring-1 focus:ring-primary/20 border-none transition-all text-xs"
        />

        {/* Search Results Dropdown Popover */}
        {isFocused && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-[380px] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/40 rounded-xl shadow-lg z-50 p-2 space-y-3">
            {filteredResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No matching results found
              </div>
            ) : (
              groupAndRenderResults(filteredResults, (url) => {
                setSearchQuery("")
                setIsFocused(false)
                navigate(url)
              })
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-auto md:ml-0 shrink-0">
        {/* Mobile Search Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 text-muted-foreground"
          onClick={() => setShowMobileSearch(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Quick Action */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="hidden sm:flex gap-1.5 h-8 text-xs px-3 font-normal bg-primary text-primary-foreground hover:bg-primary/95 border-none shadow-none cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              <span>Quick Action</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 shadow-none border-border/50 text-xs">
            <DropdownMenuLabel className="py-1.5 font-semibold text-foreground">Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer py-1.5" onClick={() => navigate("/employees/create")}>
              <UserPlus className="h-3.5 w-3.5 text-indigo-500" />
              <span>Add Employee</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer py-1.5" onClick={() => navigate("/letters")}>
              <FilePlus className="h-3.5 w-3.5 text-emerald-500" />
              <span>Create HR Letter</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer py-1.5" onClick={() => navigate("/leave")}>
              <CalendarPlus className="h-3.5 w-3.5 text-amber-500" />
              <span>Apply for Leave</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer py-1.5" onClick={() => navigate("/claims/medical")}>
              <CreditCard className="h-3.5 w-3.5 text-sky-500" />
              <span>File Medical Claim</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer py-1.5" onClick={() => navigate("/announcements")}>
              <Megaphone className="h-3.5 w-3.5 text-violet-500" />
              <span>Post Announcement</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer py-1.5" onClick={() => navigate("/attendance")}>
              <Clock className="h-3.5 w-3.5 text-rose-500" />
              <span>View Attendance</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Bell */}
        <NotificationBell />

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 shadow-none border-border/50 text-xs">
            <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer py-1.5">
              <Sun className="h-3.5 w-3.5" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer py-1.5">
              <Moon className="h-3.5 w-3.5" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer py-1.5">
              <Monitor className="h-3.5 w-3.5" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 outline-none rounded-full transition-all focus:ring-1 focus:ring-primary/20">
              <UserAvatar user={mappedUser} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 shadow-none border-border/50 text-xs">
            <DropdownMenuLabel className="py-2">
              <div className="flex flex-col space-y-0.5">
                <p className="font-semibold text-foreground">{mappedUser.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{mappedUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
             <DropdownMenuItem
              className="gap-2 cursor-pointer py-1.5"
              onClick={() => navigate("/profile")}
            >
              <User className="h-3.5 w-3.5" />
              My Profile
            </DropdownMenuItem>
            {user?.permissions?.includes('settings:read') && (
              <DropdownMenuItem
                className="gap-2 cursor-pointer py-1.5"
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-3.5 w-3.5" />
                Account Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="gap-2 cursor-pointer py-1.5"
              onClick={() => navigate("/profile?tab=security")}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer py-1.5 text-destructive" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

