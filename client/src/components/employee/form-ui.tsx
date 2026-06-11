import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
      </svg>
      {message}
    </p>
  )
}

export function SectionTitle({
  children,
  description,
  icon: Icon,
}: {
  children: React.ReactNode
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-2 pb-1">
      {Icon && (
        <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/70">
          {children}
        </h4>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}

export function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/50 p-4 sm:p-5 space-y-4 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className={cn("text-xs font-medium leading-none transition-colors", error ? "text-destructive" : "text-foreground/80")}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div 
        className={cn(
          "relative rounded-lg transition-all duration-200",
          error && "has-error [&_input]:!border-destructive [&_textarea]:!border-destructive [&_button]:!border-destructive [&_input]:!ring-3 [&_input]:!ring-destructive/20 [&_textarea]:!ring-3 [&_textarea]:!ring-destructive/20 [&_button]:!ring-3 [&_button]:!ring-destructive/20 [&_input]:!bg-destructive/5 [&_textarea]:!bg-destructive/5 [&_button]:!bg-destructive/5"
        )}
      >
        {children}
      </div>
      {hint && !error && (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      )}
      <FieldError message={error} />
    </div>
  )
}

export function ReviewItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[11px] text-muted-foreground font-medium block">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value || "—"}</span>
    </div>
  )
}

export function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary/70" />}
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
          {title}
        </h4>
      </div>
      {children}
    </div>
  )
}

export function StepHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-start gap-3 pb-1">
      {Icon && (
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 shrink-0 mt-0.5">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
      )}
      <div>
        <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-border/60 rounded-xl bg-muted/5">
      <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center mb-3">
        <svg className="h-5 w-5 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <p className="text-xs text-muted-foreground text-center">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
