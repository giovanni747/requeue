"use client";

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Particles } from '@/components/magicui/particles';
import NoiseBackground from '@/components/ui/noise-background';
import StarBorder from '@/components/ui/star-border';
import { StickerPeel } from '@/components/ui/sticker-peel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import '@/components/ui/BounceCards.css';
import { 
  Users, 
  Settings, 
  MessageSquare, 
  Calendar,
  Activity,
  Shield,
  Star,
  Plus,
  Clock,
  Hash,
  Loader2
} from 'lucide-react';

// Import the new component
import { InviteModal } from '@/components/InviteModal';
import { getRoomMembers, getRoomData, getRoomTasks, createTask, updateTaskPosition, assignTaskToUser, deleteTask, getRoomTaskStats } from '@/lib/actions';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [roomData, setRoomData] = useState<{ 
    id: string; 
    name: string; 
    img: string;
    description: string;
    memberCount: number;
    isPrivate: boolean;
    createdAt: string;
    status: 'active' | 'archived' | 'paused';
    creator: {
      name: string;
      image: string | null;
    };
  } | null>(null);

  const [roomDataLoading, setRoomDataLoading] = useState(false);
  const [roomDataError, setRoomDataError] = useState<string | null>(null);

  const [roomMembers, setRoomMembers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    joined_at: string;
    clerkId: string;
    status: 'online' | 'away' | 'offline';
  }>>([]);

  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  
  // Sticker peel card state
  const [showStickerCard, setShowStickerCard] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createdTasks, setCreatedTasks] = useState<Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
    position: { x: number; y: number };
    assignedTo?: {
      id: string;
      name: string;
      avatar: string | null;
    } | null;
  }>>([]);

  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const roomId = params.id as string;

  // Mock recent activity
  const mockActivity = [
    { id: '1', action: 'joined the room', user: 'Alice Johnson', time: '2 min ago', type: 'join' },
    { id: '2', action: 'shared a document', user: 'Bob Smith', time: '15 min ago', type: 'share' },
    { id: '3', action: 'started a discussion', user: 'Carol Davis', time: '1 hour ago', type: 'message' },
    { id: '4', action: 'updated room settings', user: 'Alice Johnson', time: '2 hours ago', type: 'settings' },
  ];

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/');
    }
  }, [isLoaded, user, router]);

  // Fetch room data from database
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!isLoaded || !user || !roomId) return;
      
      setRoomDataLoading(true);
      setRoomDataError(null);
      
      try {
        const roomData = await getRoomData(roomId);
        setRoomData(roomData);
      } catch (error) {
        console.error('Error fetching room data:', error);
        setRoomDataError(error instanceof Error ? error.message : 'Failed to load room data');
      } finally {
        setRoomDataLoading(false);
      }
    };

    fetchRoomData();
  }, [isLoaded, user, roomId]);

  // Fetch room members from database and get current user's DB ID
  useEffect(() => {
    const fetchRoomMembers = async () => {
      if (!isLoaded || !user || !roomId) return;
      
      setMembersLoading(true);
      setMembersError(null);
      
      try {
        const members = await getRoomMembers(roomId);
        setRoomMembers(members);
        
        // Find current user's database ID from the members list
        const currentUserMember = members.find(member => member.clerkId === user.id);
        if (currentUserMember) {
          setCurrentUserDbId(currentUserMember.id);
        }
      } catch (error) {
        console.error('Error fetching room members:', error);
        setMembersError(error instanceof Error ? error.message : 'Failed to load members');
      } finally {
        setMembersLoading(false);
      }
    };

    fetchRoomMembers();
  }, [isLoaded, user, roomId]);

  // Fetch room tasks from database
  useEffect(() => {
    const fetchRoomTasks = async () => {
      if (!isLoaded || !user || !roomId) return;
      
      setTasksLoading(true);
      setTasksError(null);
      
      try {
        const tasks = await getRoomTasks(roomId);
        setCreatedTasks(tasks);
      } catch (error) {
        console.error('Error fetching room tasks:', error);
        setTasksError(error instanceof Error ? error.message : 'Failed to load tasks');
      } finally {
        setTasksLoading(false);
      }
    };

    fetchRoomTasks();
  }, [isLoaded, user, roomId]);

  // Fetch task statistics - only on mount and when assignments change
  useEffect(() => {
    const fetchTaskStats = async () => {
      if (!isLoaded || !user || !roomId) return;
      
      setTaskStatsLoading(true);
      
      try {
        const stats = await getRoomTaskStats(roomId);
        setTaskStats(stats);
      } catch (error) {
        console.error('Error fetching task stats:', error);
      } finally {
        setTaskStatsLoading(false);
      }
    };

    fetchTaskStats();
  }, [isLoaded, user, roomId]); // Only re-fetch on mount, not when tasks change

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Owner': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'Admin': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || isCreatingTask) return;

    setIsCreatingTask(true);
    
    try {
      const positionX = Math.round(Math.random() * 200 + 20); // Random position between 20-220px from left
      const positionY = Math.round(Math.random() * 200 + 20); // Random position between 20-220px from top

      // Create task in database
      const newTask = await createTask(roomId, taskTitle, taskDescription, positionX, positionY);
      
      // Add to local state
      setCreatedTasks(prev => [...prev, {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        createdAt: newTask.createdAt,
        position: newTask.position,
        assignedTo: null
      }]);
      
      setSubmitted(true);
      
      // Mark this task as new for animation
      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem(`task-${newTask.id}-animated`, 'false');
      }
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSubmitted(false);
        setTaskTitle("");
        setTaskDescription("");
        setShowStickerCard(false);
        setIsCreatingTask(false);
      }, 2000);
    } catch (error) {
      console.error('Error creating task:', error);
      setIsCreatingTask(false);
      // You could add a toast notification here
    }
  };

  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartTime, setDragStartTime] = useState(0);
  const [hasScaled, setHasScaled] = useState(false);
  const [activeDropZone, setActiveDropZone] = useState(false);
  const [taskStats, setTaskStats] = useState<Array<{
    id: string;
    name: string;
    avatar: string | null;
    totalTasks: number;
    assignedTasks: number;
    completedTasks: number;
  }>>([]);
  const [taskStatsLoading, setTaskStatsLoading] = useState(false);
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    
    setDraggedTask(taskId);
    setIsDragging(true);
    
    // Smooth pickup animation with bounce
    const draggedCard = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    if (draggedCard) {
      gsap.killTweensOf(draggedCard);
      
      gsap.to(draggedCard, {
        scale: 1.1,
        rotation: 3,
        y: -8,
        duration: 0.25,
        ease: "back.out(1.5)",
        zIndex: 1000
      });
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData("text/plain");
    
    // Smooth settle animation with bounce
    const draggedCard = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    if (draggedCard) {
      gsap.killTweensOf(draggedCard);
      
      gsap.to(draggedCard, {
        scale: 1,
        rotation: 0,
        y: 0,
        duration: 0.4,
        ease: "elastic.out(1, 0.6)",
        zIndex: 20
      });
    }
    
    setDraggedTask(null);
    setIsDragging(false);
    setActiveDropZone(false);
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setActiveDropZone(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set inactive if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setActiveDropZone(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    
    if (!taskId) return;
    
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    // Calculate new position based on drop location
    const newX = e.clientX - rect.left - 70; // Center the card (half of 140px width)
    const newY = e.clientY - rect.top - 70; // Center the card (half of 140px height)
    
    // Constrain to container bounds
    const maxX = rect.width - 140;
    const maxY = rect.height - 140;
    
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));
    
    // Round to integers to avoid decimal precision issues
    const roundedX = Math.round(constrainedX);
    const roundedY = Math.round(constrainedY);
    
    // Instant position update
    const draggedCard = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    if (draggedCard) {
      gsap.to(draggedCard, {
        left: roundedX,
        top: roundedY,
        duration: 0.1,
        ease: "power1.out"
      });
    }
    
    setActiveDropZone(false);
    
    // Update database in background without triggering re-render
    try {
      await updateTaskPosition(taskId, roundedX, roundedY);
      
      // Silently update state without causing re-render
      setCreatedTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, position: { x: roundedX, y: roundedY } }
          : task
      ));
    } catch (error) {
      console.error('Error updating task position:', error);
      // Revert position on error
      if (draggedCard) {
        const originalTask = createdTasks.find(t => t.id === taskId);
        if (originalTask) {
          gsap.to(draggedCard, {
            left: originalTask.position.x,
            top: originalTask.position.y,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      }
    }
  };

  const handleTaskDoubleClick = async (taskId: string) => {
    if (!user) return;
    
    try {
      // Assign current user to the task in database
      const result = await assignTaskToUser(taskId);
      
      if (result.success && result.assignedUser) {
        // Update local state
        setCreatedTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, assignedTo: result.assignedUser }
            : task
        ));
        
        // Refresh task stats when assignment changes
        const stats = await getRoomTaskStats(roomId);
        setTaskStats(stats);
        
        // Quick pulse feedback
        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
        if (taskCard) {
          gsap.killTweensOf(taskCard);
          
          gsap.to(taskCard, {
            scale: 1.05,
            duration: 0.08,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              gsap.set(taskCard, { scale: 1 });
            }
          });
        }
      }
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleUnassignTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent double-click event
    
    try {
      // Unassign by passing null as the user ID
      const result = await assignTaskToUser(taskId, null);
      
      if (result.success) {
        // Update local state
        setCreatedTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, assignedTo: null }
            : task
        ));
        
        // Refresh task stats when assignment changes
        const stats = await getRoomTaskStats(roomId);
        setTaskStats(stats);
      }
    } catch (error) {
      console.error('Error unassigning task:', error);
    }
  };

  // Draggable Task Card Component with Bounce Effect - Memoized to prevent re-renders
  const DraggableTaskCard = React.memo(({ task, index, currentUserDbId }: { task: any; index: number; currentUserDbId: string | null }) => {
    const isCurrentlyDragging = draggedTask === task.id && isDragging;
    const cardRef = React.useRef<HTMLDivElement>(null);
    const hasAnimated = React.useRef(false);
    const dragAnimation = React.useRef<gsap.core.Tween | null>(null);
    const assignment = task.assignedTo;
    
    // Use task ID to ensure animation only runs once per task
    const animationKey = `task-${task.id}-animated`;
    const hasRunInitialAnimation = React.useRef(
      typeof window !== 'undefined' && window.sessionStorage?.getItem(animationKey) === 'true'
    );
    
    React.useEffect(() => {
      if (cardRef.current && !hasRunInitialAnimation.current && !hasAnimated.current) {
        // Only animate new tasks, not existing ones
        const isNewTask = Date.now() - new Date(task.createdAt).getTime() < 5000; // 5 seconds
        
        if (isNewTask) {
          gsap.fromTo(cardRef.current, 
            { scale: 0, opacity: 0 },
            { 
              scale: 1, 
              opacity: 1,
              duration: 0.6,
              delay: index * 0.1,
              ease: "elastic.out(1, 0.8)",
              onComplete: () => {
                hasAnimated.current = true;
                hasRunInitialAnimation.current = true;
                if (typeof window !== 'undefined') {
                  window.sessionStorage?.setItem(animationKey, 'true');
                }
              }
            }
          );
        } else {
          // For existing tasks, just ensure they're visible
          gsap.set(cardRef.current, { scale: 1, opacity: 1 });
          hasAnimated.current = true;
          hasRunInitialAnimation.current = true;
        }
      }
    }, [task.id, index, animationKey]);
    
    // Cleanup animations on unmount
    React.useEffect(() => {
      return () => {
        if (cardRef.current) {
          gsap.killTweensOf(cardRef.current);
        }
        if (dragAnimation.current) {
          dragAnimation.current.kill();
        }
      };
    }, []);
    
    return (
      <motion.div
        ref={cardRef}
        className="sticky-note cursor-grab active:cursor-grabbing"
        data-task-id={task.id}
        draggable
        style={{
          left: task.position.x,
          top: task.position.y,
          zIndex: isCurrentlyDragging ? 30 : 20,
          background: 'linear-gradient(135deg, #ffffff, #f5f5f5, #e5e7eb)',
        }}
        whileDrag={{
          scale: 1.1,
          boxShadow: "0px 10px 30px rgba(0,0,0,0.3)",
          rotate: 2,
          transition: {
            duration: 0.2,
            ease: "easeOut"
          }
        }}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={(e: any) => handleDragStart(e, task.id)}
        onDragEnd={(e: any) => handleDragEnd(e)}
        onDoubleClick={() => handleTaskDoubleClick(task.id)}
      >
        <div className="sticky-note-content">
          {/* Unassign button - only show if task is assigned to current user */}
          {assignment && currentUserDbId && assignment.id === currentUserDbId && (
            <button
              onClick={(e) => handleUnassignTask(task.id, e)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-md z-10 cursor-pointer"
              style={{ backgroundColor: '#ef4444' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              title="Unassign task"
            >
              <svg 
                className="w-3 h-3" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          )}
          
          <div className="sticky-note-title">
            {task.title}
          </div>
          {task.description && (
            <div className="sticky-note-description">
              {task.description}
            </div>
          )}
          <div className="sticky-note-date">
            {new Date(task.createdAt).toLocaleDateString()}
          </div>
          <div className="sticky-note-handle"></div>
          
          {/* Assigned User Avatar */}
          {assignment && (
            <div className="absolute bottom-2 right-2">
              <div className="relative">
                <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                  <AvatarImage src={assignment.avatar || ''} alt={assignment.name} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {assignment.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.position.x === nextProps.task.position.x &&
      prevProps.task.position.y === nextProps.task.position.y &&
      prevProps.task.assignedTo?.id === nextProps.task.assignedTo?.id &&
      prevProps.index === nextProps.index &&
      prevProps.currentUserDbId === nextProps.currentUserDbId
    );
  });
  
  DraggableTaskCard.displayName = 'DraggableTaskCard';

  if (!isLoaded || roomDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading room...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (roomDataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-destructive text-lg font-medium">
            {roomDataError}
          </div>
          <Button 
            onClick={() => {
              setRoomDataError(null);
              // Trigger refetch
              const fetchRoomData = async () => {
                setRoomDataLoading(true);
                try {
                  const roomData = await getRoomData(roomId);
                  setRoomData(roomData);
                } catch (error) {
                  setRoomDataError(error instanceof Error ? error.message : 'Failed to load room data');
                } finally {
                  setRoomDataLoading(false);
                }
              };
              fetchRoomData();
            }}
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Particles */}
      <Particles 
        quantity={80}
        staticity={60}
        ease={50}
        size={0.6}
        color="#ffffff"
        className="absolute inset-0 pointer-events-none opacity-20"
      />

      {/* Header with Hero Section */}
      <motion.div 
        className="relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Navigation Bar */}
        <div className="border-b bg-card/80 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-end">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-6">
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <img 
                  src={roomData?.img || '/img.png'} 
                  alt={roomData?.name}
                  className="w-20 h-20 rounded-2xl object-contain  dark:border-white/40 bg-white/30 dark:bg-white/50 shadow-lg p-2"
                />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-background"></div> {/*  add image icon */}
              </motion.div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <motion.h1 
                    className="text-3xl font-bold text-foreground"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {roomData?.name}
                  </motion.h1>
                </div>
                
                
                <motion.div 
                  className="flex items-center gap-6 text-sm text-muted-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {roomMembers.length} members
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {roomData?.createdAt}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Noise Background Section */}
              <div 
                className={`bounceCardsContainer relative w-full h-96 rounded-lg overflow-hidden bg-black mb-6 transition-colors duration-200 ${
                  activeDropZone ? 'bg-neutral-800/50 ring-2 ring-white' : 'bg-black'
                }`}
                style={{ width: '100%', height: '384px' }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <NoiseBackground />
                {/* Dots overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-60"></div>
                
                {/* Drop Indicator */}
                {activeDropZone && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-white opacity-70 animate-pulse"></div>
                    <div className="absolute bottom-4 left-4 right-4 h-0.5 bg-white opacity-70 animate-pulse"></div>
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-white opacity-70 animate-pulse"></div>
                    <div className="absolute right-4 top-4 bottom-4 w-0.5 bg-white opacity-70 animate-pulse"></div>
                  </div>
                )}

                {/* Created Tasks Notes */}
                {createdTasks.map((task, index) => (
                  <DraggableTaskCard key={task.id} task={task} index={index} currentUserDbId={currentUserDbId} />
                ))}

                {/* Sticker Peel Card */}
                {showStickerCard && (
                  <>
                    {/* Click-away overlay to close */}
                    <div
                      className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-20"
                      onClick={() => setShowStickerCard(false)}
                    />
                    <div className="absolute inset-4 flex items-center justify-center z-30" onClick={(e) => e.stopPropagation()}>
                    <StickerPeel 
                      isVisible={showStickerCard}
                      onClose={() => setShowStickerCard(false)}
                      className="max-w-md w-full"
                    >
                      <div className="space-y-4">
                        <h3 className="text-center text-xl font-semibold text-foreground">
                          📝 New Task
                        </h3>
                        {!submitted ? (
                          <form onSubmit={handleTaskSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="taskTitle" className="text-foreground">
                                Task Title
                              </Label>
                              <Input
                                id="taskTitle"
                                type="text"
                                placeholder="Enter task title..."
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                required
                                className="bg-white/90 dark:bg-white/10 border-white/40 dark:border-white/20 focus-visible:ring-[3px] focus-visible:ring-white/40"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="taskDescription" className="text-foreground">
                                Description
                              </Label>
                              <textarea
                                id="taskDescription"
                                placeholder="Add task details..."
                                rows={3}
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                className="flex w-full rounded-lg border border-white/40 dark:border-white/20 bg-white/90 dark:bg-white/10 px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                              />
                            </div>
                            <Button 
                              type="submit" 
                              className="w-full bg-white text-black hover:bg-white/90"
                              disabled={isCreatingTask}
                            >
                              {isCreatingTask ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                  Creating...
                                </div>
                              ) : (
                                'Create Task'
                              )}
                            </Button>
                          </form>
                        ) : (
                          <p className="text-center text-green-600 font-medium">
                            🎉 Task created successfully! It has been added to your workspace.
                          </p>
                        )}
                      </div>
                    </StickerPeel>
                    </div>
                  </>
                )}
                
                {/* StarBorder Button at bottom */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <StarBorder 
                      color="#ffffff" 
                      speed="5s" 
                      thickness={0.5}
                      className="hover:opacity-80 transition-opacity"
                      onClick={() => setShowStickerCard(true)}
                    >
                      Create Task
                    </StarBorder>
                </div>
              </div>

              {/* Task Tracker Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="bg-gradient-to-br from-primary/10 via-card/80 to-card/60 backdrop-blur-lg border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Task Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {membersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading members...</span>
                      </div>
                    ) : membersError ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-destructive mb-2">{membersError}</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setMembersError(null);
                            // Trigger refetch
                            const fetchData = async () => {
                              setMembersLoading(true);
                              try {
                                const [roomData, members] = await Promise.all([
                                  getRoomData(roomId),
                                  getRoomMembers(roomId)
                                ]);
                                setRoomData(roomData);
                                setRoomMembers(members);
                              } catch (error) {
                                setMembersError(error instanceof Error ? error.message : 'Failed to load members');
                              } finally {
                                setMembersLoading(false);
                              }
                            };
                            fetchData();
                          }}
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : taskStatsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading task stats...</span>
                      </div>
                    ) : taskStats.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No task statistics available</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">Avatar</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead className="text-center">Total Tasks</TableHead>
                            <TableHead className="text-center">Assigned</TableHead>
                            <TableHead className="text-center">Completed</TableHead>
                            <TableHead className="text-center">Progress</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {taskStats.map((stat, index) => (
                            <motion.tr
                              key={stat.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.9 + index * 0.1 }}
                              className="hover:bg-accent/50"
                            >
                              <TableCell>
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={stat.avatar || ''} alt={stat.name} />
                                  <AvatarFallback className="text-xs">
                                    {stat.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              </TableCell>
                              <TableCell className="font-medium">{stat.name}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">
                                  {stat.totalTasks}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="text-xs">
                                  {stat.assignedTasks}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="default" className="text-xs">
                                  {stat.completedTasks}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center">
                                  <div className="w-16 bg-muted rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${stat.assignedTasks > 0 ? (stat.completedTasks / stat.assignedTasks) * 100 : 0}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {stat.assignedTasks > 0 ? Math.round((stat.completedTasks / stat.assignedTasks) * 100) : 0}%
                                  </span>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              
              {/* Members */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="bg-card/80 backdrop-blur-lg border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Members
                      </div>
                      <Badge variant="secondary">{roomMembers.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {membersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading members...</span>
                      </div>
                    ) : membersError ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-destructive mb-2">{membersError}</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setMembersError(null);
                            // Trigger refetch
                            const fetchData = async () => {
                              setMembersLoading(true);
                              try {
                                const [roomData, members] = await Promise.all([
                                  getRoomData(roomId),
                                  getRoomMembers(roomId)
                                ]);
                                setRoomData(roomData);
                                setRoomMembers(members);
                              } catch (error) {
                                setMembersError(error instanceof Error ? error.message : 'Failed to load members');
                              } finally {
                                setMembersLoading(false);
                              }
                            };
                            fetchData();
                          }}
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : roomMembers.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No members found</p>
                      </div>
                    ) : (
                      roomMembers.map((member, index) => (
                        <motion.div
                          key={member.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar || ''} alt={member.name} />
                              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`}></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{member.name}</p>
                            <Badge size="sm" className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <InviteModal 
                      roomId={roomId}
                      onInviteComplete={async (users, emails) => {
                        console.log('Invited users:', users);
                        console.log('Email invites sent:', emails);
                        
                        // Refresh both room data and members list
                        if (users.length > 0) {
                          try {
                            const [roomData, members] = await Promise.all([
                              getRoomData(roomId),
                              getRoomMembers(roomId)
                            ]);
                            setRoomData(roomData);
                            setRoomMembers(members);
                          } catch (error) {
                            console.error('Error refreshing room data:', error);
                          }
                        }
                      }}
                    >
                      <Button variant="outline" className="w-full" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Invite Members
                      </Button>
                    </InviteModal>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card className="bg-card/80 backdrop-blur-lg border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        className="flex items-center gap-3 text-sm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.1 }}
                      >
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">
                            <span className="font-medium">{activity.user}</span> {activity.action}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{activity.time}</span>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
