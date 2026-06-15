import { useState } from "react"
import { Link, useLocation } from "react-router"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { navGroups } from "@/components/navigation/nav-data"
import { UserAvatar } from "@/components/common/user-avatar"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onLinkClick?: () => void
  className?: string
}

export function Sidebar({ collapsed, onToggle, onLinkClick, className }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuthStore()

  const mappedUser = {
    name: user?.fullNameEnglish || "Employee",
    email: user?.email || "",
    avatar: user?.employeePhotoUrl || "",
    role: user?.role || "",
  }

  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    // Auto-expand menus that contain the current route
    const initial = new Set<string>()
    navGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.items?.some(sub => location.pathname.startsWith(sub.href))) {
          initial.add(item.href)
        }
      })
    })
    return initial
  })

  const toggleMenu = (href: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev)
      if (next.has(href)) {
        next.delete(href)
      } else {
        next.add(href)
      }
      return next
    })
  }

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/"
    return location.pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full w-full flex-col bg-sidebar transition-all duration-300 ease-in-out shadow-none",
          className
        )}
      >
        {/* Logo Section */}
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border/30 px-4">
          <Link to="/" onClick={onLinkClick} className="flex items-center gap-2.5 min-w-0">
            <img src="/logo.png" alt="Sadoshima HR" className="h-8 w-8 shrink-0 rounded object-contain" />
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-sidebar-foreground truncate tracking-wide">
                  Sadoshima HR
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  Management System
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col gap-0.5 px-2">
            {navGroups.map((group, groupIndex) => (
              <div key={group.label} className="mb-2">
                {groupIndex > 0 && (
                  <Separator className="my-1.5 bg-sidebar-border/20 mx-2" />
                )}
                {!collapsed && (
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group.label}
                  </p>
                )}
                {group.items.filter(item => !item.roles || item.roles.includes(mappedUser.role)).map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  const hasSubItems = item.items && item.items.length > 0
                  const isExpanded = expandedMenus.has(item.href)

                  // Collapsed sidebar: show tooltip, no sub-menus
                  if (collapsed) {
                    const linkContent = (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onLinkClick}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                          active
                            ? "bg-primary/8 text-primary"
                            : "text-muted-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          "justify-center px-1"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            active
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-sidebar-foreground"
                          )}
                        />
                      </Link>
                    )
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-1.5 text-xs py-1 px-2.5 border-border/50 shadow-none">
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium">
                              {item.badge}
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  // Expanded sidebar with sub-items
                  if (hasSubItems) {
                    return (
                      <div key={item.href}>
                        <button
                          type="button"
                          onClick={() => toggleMenu(item.href)}
                          className={cn(
                            "group flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                            active
                              ? "bg-primary/8 text-primary"
                              : "text-muted-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              active
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-sidebar-foreground"
                            )}
                          />
                          <span className="truncate flex-1 text-left">{item.title}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "ml-auto inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[9px] font-medium",
                                active
                                  ? "bg-primary/20 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 shrink-0 transition-transform duration-200 text-muted-foreground",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                        {isExpanded && (
                          <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border/30 pl-2">
                            {item.items!.map((subItem) => {
                              const SubIcon = subItem.icon
                              const subActive = isActive(subItem.href)
                              return (
                                <Link
                                  key={subItem.href}
                                  to={subItem.href}
                                  onClick={onLinkClick}
                                  className={cn(
                                    "group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200",
                                    subActive
                                      ? "bg-primary/8 text-primary"
                                      : "text-muted-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                  )}
                                >
                                  <SubIcon
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0 transition-colors",
                                      subActive
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-sidebar-foreground"
                                    )}
                                  />
                                  <span className="truncate">{subItem.title}</span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Regular item (no sub-items)
                  const linkContent = (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onLinkClick}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        active
                          ? "bg-primary/8 text-primary"
                          : "text-muted-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-sidebar-foreground"
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "ml-auto inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[9px] font-medium",
                            active
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )

                  return linkContent
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User Profile + Collapse Toggle */}
        <div className="border-t border-sidebar-border/30 p-2">
          {!collapsed ? (
            <div className="flex items-center gap-2 rounded-md bg-sidebar-accent/30 p-1.5">
              <Link to="/settings" onClick={onLinkClick} className="flex items-center gap-2 flex-1 min-w-0">
                <UserAvatar user={mappedUser} size="sm" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-sidebar-foreground">
                    {mappedUser.name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {mappedUser.role}
                  </p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-sidebar-foreground"
                onClick={onToggle}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/settings" onClick={onLinkClick}>
                    <UserAvatar user={mappedUser} size="sm" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs border-border/50 shadow-none">
                  <p>{mappedUser.name}</p>
                  <p className="text-[10px] text-muted-foreground">{mappedUser.role}</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-sidebar-foreground"
                onClick={onToggle}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
