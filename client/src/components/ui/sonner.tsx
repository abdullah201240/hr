import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      richColors={false}
      icons={{
        success: <CircleCheckIcon className="size-[18px] stroke-[2.5]" />,
        info: <InfoIcon className="size-[18px] stroke-[2.5]" />,
        warning: <TriangleAlertIcon className="size-[18px] stroke-[2.5]" />,
        error: <OctagonXIcon className="size-[18px] stroke-[2.5]" />,
        loading: <Loader2Icon className="size-[18px] animate-spin stroke-[2.5]" />,
      }}
      style={
        {
          /* Base / default toast */
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "0.625rem",

          /* Success — emerald green */
          "--success-bg": "oklch(0.962 0.044 156.7)",
          "--success-text": "oklch(0.270 0.072 132.1)",
          "--success-border": "oklch(0.792 0.128 146.5)",

          /* Error — red */
          "--error-bg": "oklch(0.955 0.040 17.7)",
          "--error-text": "oklch(0.396 0.141 25.7)",
          "--error-border": "oklch(0.704 0.191 22.2)",

          /* Warning — amber */
          "--warning-bg": "oklch(0.962 0.059 95.6)",
          "--warning-text": "oklch(0.408 0.098 62.6)",
          "--warning-border": "oklch(0.795 0.184 86.0)",

          /* Info — sky blue */
          "--info-bg": "oklch(0.956 0.045 203.4)",
          "--info-text": "oklch(0.380 0.100 208.8)",
          "--info-border": "oklch(0.707 0.165 231.3)",

          /* Loading — neutral */
          "--loading-bg": "var(--popover)",
          "--loading-text": "var(--popover-foreground)",
          "--loading-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          title: "cn-toast-title",
          description: "cn-toast-desc",
          closeButton: "cn-toast-close",
          success: "cn-toast-success",
          error: "cn-toast-error",
          warning: "cn-toast-warning",
          info: "cn-toast-info",
          loading: "cn-toast-loading",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
