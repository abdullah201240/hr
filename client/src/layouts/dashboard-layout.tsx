import { useState, Suspense } from "react"
import { Outlet } from "react-router"
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

  return (
    <div className="min-h-screen bg-background">
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
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:ml-[60px]" : "lg:ml-[240px]"
        )}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 p-3 pb-12 lg:p-5 lg:pb-14">
          <div className="mx-auto w-full">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
