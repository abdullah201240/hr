import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/types"

export const currentUser: User = {
  name: "Alex Johnson",
  email: "alex.johnson@sadoshima.com",
  avatar: "",
  role: "hr",
}

export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user: User
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizeMap = {
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Avatar className={`${sizeMap[size]} ${className ?? ""}`}>
      {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
