"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

// Chart Container
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: Record<string, { label: string; color?: string }>
  }
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

// Chart Tooltip
const ChartTooltip = RechartsPrimitive.Tooltip

// Chart Tooltip Content
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  {
    active?: boolean
    payload?: Array<{
      color?: string
      name?: string
      value?: string | number
    }>
    label?: string
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    className?: string
  }
>(({ active, payload, label, hideLabel, hideIndicator, indicator = "dot", className, ...props }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    >
      {!hideLabel && label && (
        <div className="text-sm font-medium">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            {!hideIndicator && (
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  indicator === "dot" && "bg-current"
                )}
                style={{ color: item.color }}
              />
            )}
            <span className="font-medium">{item.name}:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export type ChartConfig = Record<string, {
  label: string
  color?: string
}>

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
}
