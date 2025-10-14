"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusVariants = cva(
  "inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 shadow-sm",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        online: "bg-white border-gray-200",
        away: "bg-white border-gray-200",
        busy: "bg-white border-gray-200",
        offline: "bg-white border-gray-200",
      },
      size: {
        sm: "px-2 py-1",
        md: "px-3 py-1.5", 
        lg: "px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const statusDotVariants = cva(
  "relative flex items-center justify-center rounded-full",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-secondary",
        destructive: "bg-destructive",
        outline: "bg-muted",
        online: "bg-green-500",
        away: "bg-yellow-500",
        busy: "bg-red-500", 
        offline: "bg-gray-400",
      },
      size: {
        sm: "w-2 h-2",
        md: "w-2.5 h-2.5",
        lg: "w-3 h-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const statusTextVariants = cva(
  "font-medium",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        destructive: "text-destructive-foreground",
        outline: "text-foreground",
        online: "text-green-700",
        away: "text-yellow-700",
        busy: "text-red-700",
        offline: "text-gray-700",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface StatusProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusVariants> {
  label?: string
  showDot?: boolean
  showPing?: boolean
  customColor?: string
}

function Status({ 
  className, 
  variant = "online", 
  size = "md",
  label, 
  showDot = true, 
  showPing = true,
  customColor,
  ...props 
}: StatusProps) {
  const dotColor = customColor || (variant === "online" ? "bg-green-500" : 
                   variant === "away" ? "bg-yellow-500" :
                   variant === "busy" ? "bg-red-500" :
                   variant === "offline" ? "bg-gray-400" : "bg-primary")

  return (
    <div
      className={cn(statusVariants({ variant, size }), className)}
      {...props}
    >
      {showDot && (
        <div className={cn(statusDotVariants({ variant, size }), customColor && dotColor)}>
          {showPing && variant === "online" && (
            <div className={cn("absolute inset-0 rounded-full animate-slow-pulse", dotColor)}></div>
          )}
        </div>
      )}
      {label && <span className={cn(statusTextVariants({ variant, size }))}>{label}</span>}
    </div>
  )
}

export { Status, statusVariants }
