import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Printer } from "lucide-react"

interface LetterPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  previewLetter: any
  onPrint: (id: string) => void
}

export function LetterPreviewDialog({
  isOpen,
  onClose,
  previewLetter,
  onPrint,
}: LetterPreviewDialogProps) {
  if (!previewLetter) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-base font-bold flex items-center justify-between">
            <span>Document Preview Statement</span>
            <span className="text-[10px] text-muted-foreground mr-4">Reference: {previewLetter.id}</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] uppercase font-bold tracking-wider text-primary">Sadoshima Global Corp</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 border-t border-b border-border/40 py-4 text-xs">
          {/* Visual template details in dialog */}
          <div className="space-y-1 pb-4 border-b border-border">
            <h1 className="text-base font-extrabold uppercase tracking-widest text-center text-foreground">Sadoshima Global Corp</h1>
            <p className="text-[9px] text-center text-muted-foreground">OFFICIAL CORRESPONDENCE AND RECORD</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg">
            <div>
              <p className="text-[10px] text-muted-foreground">Recipient Name</p>
              <p className="font-semibold mt-0.5">{previewLetter.employeeName}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Effective Date</p>
              <p className="font-semibold mt-0.5">{previewLetter.effectiveDate}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-[10px] uppercase tracking-wider text-indigo-600">Letter Subject</p>
            <p className="font-bold text-sm text-foreground">{previewLetter.subject}</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/20">
            <p className="font-bold text-[10px] uppercase tracking-wider text-indigo-600">Content</p>
            <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{previewLetter.body}</p>
          </div>

          {Object.keys(previewLetter.fields || {}).length > 0 && (
            <div className="p-3 bg-muted/20 rounded-lg space-y-1.5 mt-2">
              <p className="font-bold text-[10px] uppercase text-indigo-600 tracking-wide">Placeholder Mapping</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                {Object.entries(previewLetter.fields).map(([key, val]) => (
                  <div key={key}>
                    <span className="font-medium text-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>{" "}
                    <span className="text-muted-foreground">{(val as string) || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Close</Button>
          <Button size="sm" className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-none" onClick={() => onPrint(previewLetter.id)}>
            <Printer className="h-4 w-4" />
            Print Letter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
