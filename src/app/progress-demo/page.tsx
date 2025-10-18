"use client";

import ProgressDemo from "@/components/ui/progress-demo";
import { TaskProgress } from "@/components/ui/task-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProgressDemoPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Progress Component Demo</h1>
          <p className="text-muted-foreground">
            Interactive progress bars with click-to-increase functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Progress Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Progress Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressDemo />
            </CardContent>
          </Card>

          {/* Task Progress Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Task Progress Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">In Progress Task</h4>
                  <TaskProgress
                    taskId="demo-1"
                    currentProgress={30}
                    onComplete={(taskId) => {
                      console.log(`Task ${taskId} completed!`);
                    }}
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-3">Almost Complete Task</h4>
                  <TaskProgress
                    taskId="demo-2"
                    currentProgress={85}
                    onComplete={(taskId) => {
                      console.log(`Task ${taskId} completed!`);
                    }}
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-3">Completed Task</h4>
                  <TaskProgress
                    taskId="demo-3"
                    currentProgress={100}
                    isCompleted={true}
                    onComplete={(taskId) => {
                      console.log(`Task ${taskId} completed!`);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Click the progress bar to increase progress by 10%</li>
              <li>• Use +/- buttons for fine control</li>
              <li>• Dynamic colors based on progress level</li>
              <li>• Auto-complete when reaching 100%</li>
              <li>• Responsive design with hover effects</li>
              <li>• TypeScript support with proper typing</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
