import { useState, useRef, useEffect } from "react"
import { useAddFestivalPayoutCommentMutation } from "@/hooks/useFestivalBonus"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send } from "lucide-react"
import type { FestivalBonusPayout } from "@/types"

interface PayoutCommentsDialogProps {
  isOpen: boolean
  onClose: () => void
  payout: FestivalBonusPayout | null
  cycleId: string
}

export function PayoutCommentsDialog({
  isOpen,
  onClose,
  payout,
  cycleId,
}: PayoutCommentsDialogProps) {
  const [commentText, setCommentText] = useState("")
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const addCommentMutation = useAddFestivalPayoutCommentMutation()

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [isOpen, payout?.comments])

  if (!payout) return null

  const comments = payout.comments || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    try {
      await addCommentMutation.mutateAsync({
        payoutId: payout.id,
        cycleId,
        text: commentText.trim(),
      })
      setCommentText("")
    } catch (error) {
      console.error("Failed to add comment:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[85vh] p-0 overflow-hidden bg-background border border-border/45">
        <DialogHeader className="p-4 border-b border-border/20 bg-muted/20">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Collaboration Notes: {payout.employeeName}</span>
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            Leave comments and discuss adjustments or eligibility exceptions for this payout.
          </DialogDescription>
        </DialogHeader>

        {/* Comments Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[250px] max-h-[400px] bg-muted/5">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 text-muted-foreground space-y-2">
              <div className="p-3 bg-muted rounded-full">
                <MessageSquare className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <p className="text-[11px] font-medium">No collaboration notes yet</p>
              <p className="text-[10px] text-muted-foreground/75 max-w-[250px]">
                Add notes or rejection feedback below to start discussion.
              </p>
            </div>
          ) : (
            comments.map((comment, index) => {
              const dateObj = new Date(comment.createdAt)
              const timeString = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              const dateString = dateObj.toLocaleDateString([], { month: "short", day: "numeric" })
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20 shrink-0">
                    {getInitials(comment.authorName)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-foreground">
                        {comment.authorName}
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        {dateString}, {timeString}
                      </span>
                    </div>
                    <div className="bg-background border border-border/30 rounded-lg p-2.5 shadow-sm text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {comment.text}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment input form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/20 bg-background space-y-3">
          <div className="relative">
            <Textarea
              placeholder="Type your comment or note here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[70px] resize-none text-[11px] pr-10 focus-visible:ring-1 focus-visible:ring-primary"
              disabled={addCommentMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2 w-7 h-7 rounded-md"
              disabled={!commentText.trim() || addCommentMutation.isPending}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
