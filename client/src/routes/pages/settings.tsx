import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { currentUser, UserAvatar } from "@/components/common/user-avatar"
import { Bell, Shield, Palette, LayoutGrid } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { theme, setTheme, sidebarSize, setSidebarSize } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 shadow-none border border-border/40">
          <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Alerts</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <UserAvatar user={currentUser} size="lg" />
                <div>
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  <Button variant="outline" size="sm" className="mt-2 text-xs h-8">Change Avatar</Button>
                </div>
              </div>
              <Separator className="bg-border/30" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">First Name</Label>
                  <Input defaultValue="Alex" className="text-xs h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Last Name</Label>
                  <Input defaultValue="Johnson" className="text-xs h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email</Label>
                  <Input defaultValue="alex.johnson@company.com" type="email" className="text-xs h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Phone</Label>
                  <Input defaultValue="+1 (555) 123-4567" className="text-xs h-9" />
                </div>
              </div>
              <Button className="text-xs h-9">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Email notifications", desc: "Receive updates via email" },
                { label: "Leave request alerts", desc: "Get notified when employees submit leave requests" },
                { label: "Payroll reminders", desc: "Reminders before payroll deadlines" },
                { label: "Task assignments", desc: "Notifications when tasks are assigned to you" },
                { label: "System updates", desc: "Important system announcements" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Current Password</Label>
                  <Input type="password" placeholder="Enter current password" className="text-xs h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">New Password</Label>
                  <Input type="password" placeholder="Enter new password" className="text-xs h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm new password" className="text-xs h-9" />
                </div>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div>
                  <p className="text-sm font-medium">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-8">Enable</Button>
              </div>
              <Button className="text-xs h-9">Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Scheme */}
              <div className="space-y-2">
                <Label className="text-xs">Color Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-md border p-3 hover:border-primary/50 transition-all capitalize cursor-pointer",
                        theme === mode ? "border-primary bg-primary/5" : "border-border/40"
                      )}
                    >
                      <div className={`h-12 w-full rounded ${mode === "dark" ? "bg-gray-900" : mode === "light" ? "bg-white border border-border/30" : "bg-gradient-to-r from-white to-gray-900"}`} />
                      <span className="text-xs font-medium">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Sidebar layout sizing */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4" />
                  Sidebar Layout Density
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "small", name: "Compact (Small)", desc: "Show only icons to maximize work area", preview: "w-10 bg-muted" },
                    { id: "large", name: "Standard (Large)", desc: "Show icons with names and full details", preview: "w-24 bg-muted" },
                  ].map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSidebarSize(size.id as any)}
                      className={cn(
                        "flex flex-col items-start gap-2 text-left rounded-md border p-3.5 hover:border-primary/50 transition-all cursor-pointer",
                        sidebarSize === size.id ? "border-primary bg-primary/5" : "border-border/40"
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

