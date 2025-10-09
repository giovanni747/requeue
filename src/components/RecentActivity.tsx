"use client"

import { useState, useEffect } from "react"
import { getMonthlyTaskAnalytics } from "@/lib/actions"
import { CheckSquare, Target, Flame } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface TaskAnalytics {
  completedThisMonth: number;
  totalCompleted: number;
  totalAssigned: number;
  dailyCompletions: Array<{
    date: string;
    tasksCompleted: number;
    totalTasks: number;
  }>;
  weeklyCompletions: Array<{
    week: number;
    tasksCompleted: number;
  }>;
  currentStreak: number;
  currentMonth: number;
  currentYear: number;
}

export default function RecentActivity() {
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const analyticsData = await getMonthlyTaskAnalytics();
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="items-center">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading your task data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="items-center">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Your task completion progress this month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckSquare className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-lg font-semibold text-green-400">{analytics?.completedThisMonth || 0}</div>
              <div className="text-xs text-muted-foreground">Completed This Month</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Target className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-lg font-semibold text-blue-400">{analytics?.totalAssigned || 0}</div>
              <div className="text-xs text-muted-foreground">Total Tasks Assigned</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <Flame className="w-5 h-5 text-orange-400" />
            <div>
              <div className="text-lg font-semibold text-orange-400">{analytics?.currentStreak || 0}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}