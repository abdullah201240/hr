import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarDays, Clock, Megaphone } from "lucide-react"
import type { Announcement } from "./types"
import { formatDateStr } from "./types"

interface AnnouncementsCardProps {
  announcements: Announcement[]
}

export function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selected, setSelected] = useState<Announcement | null>(null)

  return (
    <>
      <Card className="shadow-none border-border/40 flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Megaphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Latest Announcements</CardTitle>
                <p className="text-[10px] text-muted-foreground">Recent updates and notices</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <div className="divide-y divide-border/20">
            {announcements.length > 0 ? (
              announcements.slice(0, 4).map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => {
                    setSelected(ann)
                    setIsViewOpen(true)
                  }}
                  className="p-4 hover:bg-muted/10 transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">{formatDateStr(ann.date)}</span>
                      <span className="text-[10px] font-medium text-muted-foreground/85">by {ann.author}</span>
                    </div>
                    <h5 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {ann.title}
                    </h5>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {ann.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-2">
                <Megaphone className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground">No announcements found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Announcement Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selected && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-center justify-end">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Published: {formatDateStr(selected.date)}
                  </span>
                </div>
                <DialogTitle className="text-base font-bold leading-snug">
                  {selected.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 border-t border-border/40 mt-2">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selected.content}
                </p>
                <div className="bg-muted/30 border border-border/20 rounded-xl p-3 flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Clock className="h-4 w-4" />
                    Author: {selected.author}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsViewOpen(false)} className="text-xs">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
