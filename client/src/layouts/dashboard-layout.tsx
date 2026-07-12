import { useState, Suspense } from "react"
import { Outlet, useLocation } from "react-router"
import { Sidebar } from "@/layouts/sidebar"
import { Header } from "@/layouts/header"
import { Footer } from "@/layouts/footer"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"
import { PageSkeleton } from "@/components/common/page-skeleton"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useNotificationSocket } from "@/hooks/useNotificationSocket"
import { useTasksWebSocket } from "@/hooks/useTasksWebSocket"
import { CallOverlay } from "@/components/chat/CallOverlay"

export function DashboardLayout() {
  useWebSocket()
  useNotificationSocket()
  useTasksWebSocket()
  const { sidebarSize, setSidebarSize } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const sidebarCollapsed = sidebarSize === "small"
  const toggleSidebar = () => {
    setSidebarSize(sidebarSize === "small" ? "large" : "small")
  }

  const location = useLocation()
  const isChatPage = location.pathname === "/chat"

  return (
    <div className={cn("bg-background", !isChatPage && "min-h-screen", isChatPage && "h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden")}>
      <CallOverlay />
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:block fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border/30 bg-sidebar transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[240px] p-0 border-r border-sidebar-border/30">
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileMenuOpen(false)}
            onLinkClick={() => setMobileMenuOpen(false)}
            className="h-full w-full"
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out",
          !isChatPage && "min-h-screen",
          sidebarCollapsed ? "lg:ml-[60px]" : "lg:ml-[240px]",
          isChatPage && "h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden"
        )}
      >
        {!isChatPage && (
          <Header
            sidebarCollapsed={sidebarCollapsed}
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        )}

        <main className={cn("flex-1 p-3 pb-12 lg:p-5 lg:pb-14", isChatPage && "p-0 pb-0 lg:p-0 lg:pb-0 h-full overflow-hidden")}>
          <div className={cn("mx-auto w-full", isChatPage && "max-w-none h-full")}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        {!isChatPage && <Footer />}
      </div>
    </div>
  )
}
