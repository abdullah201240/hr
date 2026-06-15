import { useState } from "react"
import { useLocation, useNavigate } from "react-router"
import {
  Search,
  Bell,
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
import { Badge } from "@/components/ui/badge"
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

export function Header({ onMobileMenuToggle }: { sidebarCollapsed?: boolean; onMobileMenuToggle: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const { user, logout } = useAuthStore()

  const pageTitle = getPageTitle(location.pathname)

  const mappedUser = {
    name: user?.fullNameEnglish || "Employee",
    email: user?.email || "",
    avatar: user?.employeePhotoUrl || "",
    role: user?.role || "",
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/10 bg-sidebar/95 backdrop-blur-sm px-4 lg:px-6 transition-all">
      {/* Mobile Search Overlay */}
      {showMobileSearch ? (
        <div className="absolute inset-0 flex items-center gap-2 bg-background px-4 z-40 animate-in fade-in slide-in-from-top-1 duration-200">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search..."
            className="flex-1 h-9 bg-transparent border-none focus-visible:ring-0 shadow-none px-0"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground shrink-0"
            onClick={() => setShowMobileSearch(false)}
          >
            <X className="h-4 w-4" />
          </Button>
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
          placeholder="Search employees, tasks, reports..."
          className="pl-9 h-8.5 bg-muted/40 hover:bg-muted/60 dark:bg-muted/20 dark:hover:bg-muted/30 focus:bg-background focus:ring-1 focus:ring-primary/20 border-none transition-all text-xs"
        />
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

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-muted-foreground"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 shadow-none border-border/50 text-xs">
            <DropdownMenuLabel className="flex items-center justify-between py-1.5">
              <span className="font-semibold text-foreground">Notifications</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                5 new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { title: "Leave request pending", desc: "Sarah M. requested 3 days off", time: "2m ago" },
              { title: "Payroll processed", desc: "June payroll completed successfully", time: "1h ago" },
              { title: "New employee onboarded", desc: "John D. joined Engineering", time: "3h ago" },
              { title: "Performance review due", desc: "Q2 reviews end this Friday", time: "5h ago" },
              { title: "Policy update", desc: "Remote work policy has been updated", time: "1d ago" },
            ].map((notification, i) => (
              <DropdownMenuItem key={i} className="flex flex-col items-start gap-0.5 p-2.5 cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-foreground">{notification.title}</span>
                  <span className="text-[10px] text-muted-foreground">{notification.time}</span>
                </div>
                <span className="text-muted-foreground">{notification.desc}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center cursor-pointer font-medium text-primary py-2">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
            <DropdownMenuItem
              className="gap-2 cursor-pointer py-1.5"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-3.5 w-3.5" />
              Account Settings
            </DropdownMenuItem>
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

