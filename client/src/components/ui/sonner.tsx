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
          "--normal-border": "transparent",
          "--border-radius": "0.625rem",

          /* Success — solid emerald */
          "--success-bg": "oklch(0.527 0.154 150)",
          "--success-text": "#ffffff",
          "--success-border": "transparent",

          /* Error — solid red */
          "--error-bg": "oklch(0.537 0.200 25)",
          "--error-text": "#ffffff",
          "--error-border": "transparent",

          /* Warning — solid amber */
          "--warning-bg": "oklch(0.650 0.170 55)",
          "--warning-text": "#ffffff",
          "--warning-border": "transparent",

          /* Info — solid sky blue */
          "--info-bg": "oklch(0.550 0.150 230)",
          "--info-text": "#ffffff",
          "--info-border": "transparent",

          /* Loading — neutral */
          "--loading-bg": "var(--popover)",
          "--loading-text": "var(--popover-foreground)",
          "--loading-border": "transparent",
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
