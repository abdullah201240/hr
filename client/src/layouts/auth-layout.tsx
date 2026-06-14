import { Outlet } from "react-router"
import { Briefcase } from "lucide-react"

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 right-0 h-[600px] w-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sadoshima HR
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enterprise Management System
            </p>
          </div>
        </div>

        {/* Auth card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Sadoshima. All rights reserved.
        </p>
      </div>
    </div>
  )
}
