import { Separator } from "@/components/ui/separator"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="sticky bottom-0 z-20 border-t border-border/10 bg-sidebar/95 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 lg:px-6">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/85">
          <span className="font-medium text-foreground/80">Sadoshima HR</span>
          <Separator orientation="vertical" className="h-2.5" />
          <span>v2.4.0</span>
        </div>
        <p className="text-[10px] text-muted-foreground/80">
          &copy; {currentYear} Sadoshima. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
