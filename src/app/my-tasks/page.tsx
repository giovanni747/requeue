"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getMyTasks, updateTaskStatus, updateTaskPriority } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskProgress } from "@/components/ui/task-progress";
import { 
  CheckCircle, 
  Clock, 
  Circle, 
  XCircle, 
  Calendar,
  ArrowRight,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  dueDate: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  estimatedHours: number | null;
  actualHours: number | null;
  room: {
    id: string;
    title: string;
    image: string | null;
  };
  createdBy: {
    id: string;
    name: string;
    avatar: string | null;
    clerkId: string;
  };
}


const statusConfig = {
  todo: { label: 'To Do', icon: Circle, color: 'bg-gray-500' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-500' },
  // Default fallback
  default: { label: 'To Do', icon: Circle, color: 'bg-gray-500' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  high: { label: 'High', color: 'bg-red-100 text-red-800 border-red-200' },
  // Default fallback
  default: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
};

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function MyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todo');
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [taskPriorityDropdowns, setTaskPriorityDropdowns] = useState<Record<string, boolean>>({});
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const userTasks = await getMyTasks();
        setTasks(userTasks);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close main priority filter dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      
      // Close task priority dropdowns
      const target = event.target as HTMLElement;
      const isTaskPriorityDropdown = target.closest('[data-task-priority-dropdown]');
      if (!isTaskPriorityDropdown) {
        setTaskPriorityDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProgressChange = (taskId: string, progress: number) => {
    setTaskProgress(prev => ({
      ...prev,
      [taskId]: progress
    }));
  };

  const handleProgressComplete = async (taskId: string) => {
    await handleStatusUpdate(taskId, 'completed');
  };

  const handleStatusUpdate = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const result = await updateTaskStatus(taskId, newStatus);
      
      if (newStatus === 'completed') {
        // Update task status to completed and switch to completed view
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: 'completed' } : task
        ));
        
        // Switch to completed filter to show the completed task
        setFilterStatus('completed');
        
        // Show success toast
        if (result && typeof result === 'object' && 'taskTitle' in result) {
          toast.success(`✅ Task "${result.taskTitle}" completed!`, {
            duration: 4000,
            style: {
              background: '#10b981',
              color: 'white',
            },
          });
        } else {
          toast.success('✅ Task completed successfully!', {
            duration: 3000,
            style: {
              background: '#10b981',
              color: 'white',
            },
          });
        }
      } else {
        // Update task status for non-completion statuses
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Failed to update task status. Please try again.');
    }
  };

  const handleNavigateToRoom = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  const handlePriorityUpdate = async (taskId: string, priority: 'low' | 'medium' | 'high') => {
    try {
      await updateTaskPriority(taskId, priority);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, priority } : task
      ));
      setTaskPriorityDropdowns(prev => ({ ...prev, [taskId]: false }));
    } catch (err) {
      console.error('Error updating task priority:', err);
    }
  };

  const toggleTaskPriorityDropdown = (taskId: string) => {
    setTaskPriorityDropdowns(prev => ({ 
      ...prev, 
      [taskId]: !prev[taskId] 
    }));
  };

  const handleTaskDoubleClick = async (taskId: string) => {
    try {
      const result = await updateTaskStatus(taskId, 'completed');
      
      // Update task status to completed and switch to completed view
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'completed' } : task
      ));
      
      // Switch to completed filter to show the completed task
      setFilterStatus('completed');
      
      // Show success toast
      if (result && typeof result === 'object' && 'taskTitle' in result) {
        toast.success(`✅ Task "${result.taskTitle}" completed!`, {
          duration: 4000,
          style: {
            background: '#10b981',
            color: 'white',
          },
        });
      } else {
        toast.success('✅ Task completed successfully!', {
          duration: 3000,
          style: {
            background: '#10b981',
            color: 'white',
          },
        });
      }
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task. Please try again.');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = task.status === filterStatus;
    const priorityMatch = !selectedPriority || task.priority === selectedPriority;
    return statusMatch && priorityMatch;
  });

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Tasks</h1>
            <p className="text-muted-foreground">Loading your assigned tasks...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-muted rounded mb-3"></div>
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Tasks</h1>
            <p className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Tasks</h1>
          <p className="text-muted-foreground">
            {taskStats.total} total tasks assigned to you
          </p>
        </div>


        

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filterStatus === 'todo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('todo')}
          >
            To Do ({taskStats.todo})
          </Button>
          <Button
            variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('in_progress')}
          >
            In Progress ({taskStats.in_progress})
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('completed')}
          >
            Completed ({taskStats.completed})
          </Button>
        </div>

        {/* Priority Filter */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground mr-2">Filter by Priority:</span>
          <div className="relative inline-block" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              className="h-8"
            >
              {selectedPriority ? (priorityConfig[selectedPriority as keyof typeof priorityConfig]?.label || 'Select Priority') : 'All Priorities'}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            
            {showPriorityDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[140px]">
                <div className="p-1">
                  <button
                    onClick={() => {
                      setSelectedPriority(null);
                      setShowPriorityDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                      !selectedPriority 
                        ? "bg-accent text-accent-foreground" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    All Priorities
                  </button>
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedPriority(option.value);
                        setShowPriorityDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                        selectedPriority === option.value
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {`No ${filterStatus} tasks`}
              </h3>
              <p className="text-muted-foreground">
                {`You don't have any ${filterStatus} tasks.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                💡 Double-click any task to mark it as completed
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              const StatusIcon = statusConfig[task.status]?.icon || statusConfig.default.icon;
              const statusInfo = statusConfig[task.status] || statusConfig.default;
              const priorityInfo = priorityConfig[task.priority] || priorityConfig.default;
              
              return (
                <Card 
                  key={task.id} 
                  className="hover:bg-accent/50 transition-all duration-200 group cursor-pointer"
                  onDoubleClick={() => handleTaskDoubleClick(task.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-foreground text-lg leading-tight">
                        {task.title}
                      </CardTitle>
                      <div className="relative" data-task-priority-dropdown>
                        <Badge 
                          className={cn("text-xs cursor-pointer hover:opacity-80 transition-opacity", priorityInfo.color)}
                          onClick={() => toggleTaskPriorityDropdown(task.id)}
                        >
                          {priorityInfo.label}
                        </Badge>
                        {taskPriorityDropdowns[task.id] && (
                          <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[100px]">
                            <div className="p-1">
                              {priorityOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handlePriorityUpdate(task.id, option.value as 'low' | 'medium' | 'high')}
                                  className={cn(
                                    "w-full text-left px-2 py-1 text-xs rounded-md transition-colors",
                                    task.priority === option.value
                                      ? "bg-accent text-accent-foreground"
                                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                  )}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Room Info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{task.room.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNavigateToRoom(task.room.id)}
                        className="ml-auto p-1 h-6 w-6 text-muted-foreground hover:text-foreground"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Status */}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium w-fit",
                        statusInfo.color === 'bg-gray-500' && "bg-gray-100 text-gray-700 border-gray-200",
                        statusInfo.color === 'bg-blue-500' && "bg-blue-100 text-blue-700 border-blue-200",
                        statusInfo.color === 'bg-green-500' && "bg-green-100 text-green-700 border-green-200",
                        statusInfo.color === 'bg-red-500' && "bg-red-100 text-red-700 border-red-200"
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </Badge>

                    {/* Progress Bar - Only show for in_progress tasks */}
                    {task.status === 'in_progress' && (
                      <TaskProgress
                        taskId={task.id}
                        currentProgress={taskProgress[task.id] || 0}
                        onComplete={handleProgressComplete}
                        isCompleted={false}
                        className="py-2"
                      />
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {task.status === 'todo' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(task.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(task.id, 'todo')}
                          >
                            Pause
                          </Button>
                        </>
                      )}
                      {task.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>

                    {/* Creator Info */}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Created by {task.createdBy.name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
