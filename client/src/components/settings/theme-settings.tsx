import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Palette, LayoutGrid } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

export function ThemeSettings() {
  const { theme, setTheme, sidebarSize, setSidebarSize } = useTheme()

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>Customize the look and feel of your workspace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Theme */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Theme Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Choose between light and dark mode</p>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-muted rounded-lg p-1">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all",
                    theme === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Width */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Sidebar Size
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">Adjust sidebar width to your preference</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { name: "Compact", size: "small", preview: "w-3", desc: "Narrow sidebar" },
              { name: "Spacious", size: "large", preview: "w-5", desc: "Wide sidebar" }
            ] as const).map((size) => (
              <button
                key={size.size}
                onClick={() => setSidebarSize(size.size)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-left",
                  sidebarSize === size.size
                    ? "border-primary bg-primary/5"
                    : "border-border/40 hover:border-border/60"
                )}
              >
                <div className="h-10 w-full rounded bg-background border border-border/20 flex gap-1 p-1">
                  <div className={cn("h-full rounded-sm transition-all duration-300", size.preview)} />
                  <div className="flex-1 flex flex-col gap-1 py-1">
                    <div className="h-2 w-3/4 rounded bg-muted/60" />
                    <div className="h-2 w-1/2 rounded bg-muted/30" />
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-xs font-medium text-foreground block">{size.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">{size.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
