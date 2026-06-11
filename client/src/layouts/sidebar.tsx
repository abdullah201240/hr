import { Link, useLocation } from "react-router"
import { ChevronLeft, ChevronRight, Briefcase } from "lucide-react"
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
import { currentUser, UserAvatar } from "@/components/common/user-avatar"
import { cn } from "@/lib/utils"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onLinkClick?: () => void
  className?: string
}

export function Sidebar({ collapsed, onToggle, onLinkClick, className }: SidebarProps) {
  const location = useLocation()

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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground shadow-none">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-sidebar-foreground truncate tracking-wide">
                  HR Suite
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
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
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
                        collapsed && "justify-center px-1"
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
                      {!collapsed && (
                        <>
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
                        </>
                      )}
                    </Link>
                  )

                  if (collapsed) {
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
                <UserAvatar user={currentUser} size="sm" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-sidebar-foreground">
                    {currentUser.name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {currentUser.role}
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
                    <UserAvatar user={currentUser} size="sm" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs border-border/50 shadow-none">
                  <p>{currentUser.name}</p>
                  <p className="text-[10px] text-muted-foreground">{currentUser.role}</p>
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
