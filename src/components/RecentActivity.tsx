"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
export const description = "A radar chart with dots"

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 273 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

export default function RecentActivity() {
  return (
    <Card className="w-full">
      <CardHeader className="items-center">
        <CardTitle>Activity Analytics</CardTitle>
        <CardDescription>
          Room engagement for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="w-full h-[250px] flex items-center justify-center">
          <RadarChart 
            data={chartData}
            width={300}
            height={250}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <PolarAngleAxis dataKey="month" />
            <PolarGrid />
            <Radar
              dataKey="desktop"
              fill="var(--chart-1)"
              fillOpacity={0.9}
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">
          January - June 2024
        </div>
      </CardFooter>
    </Card>
  )
}