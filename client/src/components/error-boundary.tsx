import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled rendering crash:", error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = "/"
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            An unexpected client-side error occurred. We have logged the issue and are ready to recover.
          </p>
          {this.state.error && (
            <pre className="mt-4 p-4 max-w-lg overflow-auto rounded-xl bg-muted text-[11px] font-mono text-left text-muted-foreground border border-border/40">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={this.handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset App State
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
