"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskProgressProps {
  taskId: string;
  currentProgress?: number;
  onComplete?: (taskId: string) => void;
  isCompleted?: boolean;
  className?: string;
}

export function TaskProgress({ 
  taskId, 
  currentProgress = 0, 
  onComplete,
  isCompleted = false,
  className 
}: TaskProgressProps) {
  const [progress, setProgress] = useState(currentProgress);

  useEffect(() => {
    setProgress(currentProgress);
  }, [currentProgress]);




  return (
    <div className={cn("space-y-3", className)}>


      {/* Complete Button */}
      {progress === 100 && !isCompleted && (
        <Button
          size="sm"
          onClick={() => onComplete?.(taskId)}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Complete
        </Button>
      )}

      {/* Completed State */}
      {isCompleted && (
        <Badge 
          variant="outline" 
          className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 border-green-200 w-fit mx-auto"
        >
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>
      )}
    </div>
  );
}
