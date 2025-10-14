"use client";

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Status } from '@/components/ui/status';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import { MagicCard } from '@/components/ui/magic-card';
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
  Loader2,
  Trash2
} from 'lucide-react';

// Import the new component
import { InviteModal } from '@/components/InviteModal';
import RoomImageUpload from '@/components/RoomImageUpload';
import { getRoomMembers, getRoomData, getRoomTasks, createTask, updateTaskPosition, assignTaskToUser, deleteTask, getRoomTaskStats, transferRoomOwnership, promoteMemberToOwner, banUserFromRoom, getBannedUsers, updateRoomImage } from '@/lib/actions';
import { useSocket } from '@/contexts/SocketContext';
import toast from 'react-hot-toast';
import CollaborativeCursors from '@/components/CollaborativeCursor';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { socket, connected, joinRoom, leaveRoom, emitTaskCreated, emitTaskUpdated, emitTaskMoved, emitTaskCompleted, currentRoomUsers, emitCursorMove } = useSocket();
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
    image_url?: string;
    image_public_id?: string;
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
    createdBy?: {
      id: string;
      name: string;
      avatar: string | null;
    };
  }>>([]);

  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const roomId = params.id as string;
  const onlineCount = currentRoomUsers?.length || 0;
  const processedUserJoins = useRef(new Set<string>());
  const doubleClickHandled = useRef(false);

  // WebSocket event listeners
  useEffect(() => {
    if (!socket || !connected || !roomId || !user) return;

    // Join room when component mounts
    joinRoom(roomId, user.fullName || user.username || 'Anonymous');

    // Listen for real-time task events
    const handleTaskCreated = (data: any) => {
      if (data.roomId === roomId) {
        console.log('🔌 Received task:created event:', data);
        
        // Add new task to local state
        setCreatedTasks(prev => {
          // Check if task already exists to avoid duplicates
          if (prev.find(task => task.id === data.task.id)) return prev;
          return [...prev, {
            id: data.task.id,
            title: data.task.title,
            description: data.task.description,
            createdAt: data.task.createdAt,
            position: data.task.position,
            assignedTo: data.task.assignedTo || null
          }];
        });

        // Show toast notification
        toast.success(`${data.task.createdBy} created a new task: ${data.task.title}`);
      }
    };

    const handleTaskUpdated = (data: any) => {
      if (data.roomId === roomId) {
        console.log('🔌 Received task:updated event:', data);
        
        // Update task in local state
        setCreatedTasks(prev => prev.map(task => 
          task.id === data.task.id 
            ? { ...task, ...data.task }
            : task
        ));

        // Show toast notification
        toast.success(`${data.task.updatedBy} updated task: ${data.task.title}`);
      }
    };

    const handleTaskMoved = (data: any) => {
      if (data.roomId === roomId) {
        console.log('🔌 Received task:moved event:', data);
        
        // Update task position in local state
        setCreatedTasks(prev => prev.map(task => 
          task.id === data.taskId 
            ? { ...task, position: data.newPosition }
            : task
        ));

        // Update visual position with a slight delay to ensure DOM is updated
        setTimeout(() => {
          const taskCard = document.querySelector(`[data-task-id="${data.taskId}"]`) as HTMLElement;
          if (taskCard) {
            gsap.killTweensOf(taskCard);
            gsap.to(taskCard, {
              left: data.newPosition.x,
              top: data.newPosition.y,
              duration: 0.3,
              ease: "power2.out"
            });
          } else {
            console.warn(`🔌 Task card not found for ID: ${data.taskId}`);
          }
        }, 50);
      }
    };

    const handleTaskCompleted = (data: any) => {
      if (data.roomId === roomId) {
        console.log('🔌 Received task:completed event:', data);
        
        // Remove completed task from local state
        setCreatedTasks(prev => prev.filter(task => task.id !== data.taskId));

        // Show toast notification
        toast.success(`${data.completedBy} completed task: ${data.taskTitle}`);
      }
    };

    const handleTaskDeleted = (data: any) => {
      if (data.roomId === roomId) {
        console.log('🔌 Received task:deleted event:', data);
        
        // Remove deleted task from local state
        setCreatedTasks(prev => prev.filter(task => task.id !== data.taskId));

        // Show toast notification
        toast(`${data.deletedBy} deleted a task`, {
          style: {
            background: "#000000",
            color: "#ffffff",
            border: "1px solid #333333",
          }
        });
      }
    };

    const handleUserJoined = (data: any) => {
      console.log('🔌 User joined room:', data);
      
      // Create a unique key for this user join event
      const joinKey = `${data.userId}-${data.socketId}`;
      
      // Check if we've already processed this join event
      if (!processedUserJoins.current.has(joinKey)) {
        processedUserJoins.current.add(joinKey);
        toast.success(`${data.userName} joined the room`);
        
        // Clean up old entries after a delay to prevent memory leaks
        setTimeout(() => {
          processedUserJoins.current.delete(joinKey);
        }, 5000);
      }
    };

    const handleUserLeft = (data: any) => {
      console.log('🔌 User left room:', data);
      toast(`${data.userName} left the room`);
    };

    // Register event listeners
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:completed', handleTaskCompleted);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    // Cleanup function
    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:completed', handleTaskCompleted);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      
      // Leave room when component unmounts
      leaveRoom(roomId);
    };
  }, [socket, connected, roomId, user?.id]);

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
        
        // Find current user's database ID and role from the members list
        const currentUserMember = members.find(member => member.clerkId === user.id);
        if (currentUserMember) {
          setCurrentUserDbId(currentUserMember.id);
          setCurrentUserRole(currentUserMember.role);
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

  // Track mouse movement for collaborative cursors
  useEffect(() => {
    if (!connected || !roomId || !user) return;

    const handleMouseMove = (e: MouseEvent) => {
      emitCursorMove({
        x: e.clientX,
        y: e.clientY,
        userName: user.fullName || user.username || 'Anonymous'
      });
    };

    // Throttle cursor updates (send max 60fps)
    let lastSent = 0;
    const throttledMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSent > 16) { // ~60fps
        handleMouseMove(e);
        lastSent = now;
      }
    };

    document.addEventListener('mousemove', throttledMouseMove);
    return () => document.removeEventListener('mousemove', throttledMouseMove);
  }, [connected, roomId, emitCursorMove, user]);

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
    
    // Create progress toast
    const toastId = toast.loading('Creating task...', {
      duration: Infinity,
      style: {
        background: "#000000",
        color: "#ffffff",
        border: "1px solid #333333",
      }
    });
    
    try {
      const positionX = Math.round(Math.random() * 200 + 20); // Random position between 20-220px from left
      const positionY = Math.round(Math.random() * 200 + 20); // Random position between 20-220px from top

      // Update toast progress
      toast.loading('Adding task to workspace...', {
        id: toastId,
        duration: Infinity,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #333333",
        }
      });

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

      // Emit WebSocket event for real-time updates
      emitTaskCreated({
        roomId,
        task: newTask,
        createdBy: user?.fullName || user?.username || 'Anonymous'
      });
      
      // Update toast to success
      toast.success(`✅ Task "${taskTitle}" created successfully!`, {
        id: toastId,
        duration: 3000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #333333",
        }
      });
      
      // Mark this task as new for animation
      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem(`task-${newTask.id}-animated`, 'false');
      }
      
      // Reset form immediately
      setTaskTitle("");
      setTaskDescription("");
      setShowStickerCard(false);
      setIsCreatingTask(false);
      
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Update toast to error
      toast.error('❌ Failed to create task', {
        id: toastId,
        duration: 3000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #dc2626",
        }
      });
      
      setIsCreatingTask(false);
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
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedTaskForView, setSelectedTaskForView] = useState<any>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Ban management state
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [userToBan, setUserToBan] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [banExpires, setBanExpires] = useState('');
  const [showBannedUsers, setShowBannedUsers] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  
  // Room image editing state
  const [newRoomImage, setNewRoomImage] = useState<string | null>(null);
  const [newRoomImagePublicId, setNewRoomImagePublicId] = useState<string | null>(null);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [transferringOwnership, setTransferringOwnership] = useState(false);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    
    setDraggedTask(taskId);
    setIsDragging(true);
    
    // Smooth pickup animation with bounce
    const draggedCard = document.querySelector(`[data-task-id="${CSS.escape(taskId)}"]`) as HTMLElement;
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
    const draggedCard = document.querySelector(`[data-task-id="${CSS.escape(taskId)}"]`) as HTMLElement;
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

      // Emit WebSocket event for real-time updates
      emitTaskMoved({
        roomId,
        taskId,
        newPosition: { x: roundedX, y: roundedY },
        movedBy: user?.fullName || user?.username || 'Anonymous'
      });
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
        
        // Emit WebSocket event for real-time updates
        emitTaskUpdated({
          roomId,
          task: {
            id: taskId,
            assignedTo: result.assignedUser
          },
          updatedBy: user?.fullName || user?.username || 'Anonymous'
        });
        
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
        
        // Emit WebSocket event for real-time updates
        emitTaskUpdated({
          roomId,
          task: {
            id: taskId,
            assignedTo: null
          },
          updatedBy: user?.fullName || user?.username || 'Anonymous'
        });
        
        // Refresh task stats when assignment changes
        const stats = await getRoomTaskStats(roomId);
        setTaskStats(stats);
      }
    } catch (error) {
      console.error('Error unassigning task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const toastId = toast.loading('Deleting task...', {
      duration: Infinity,
      style: {
        background: "#000000",
        color: "#ffffff",
        border: "1px solid #333333",
      }
    });
    
    try {
      await deleteTask(taskId);
      
      // Update local state
      setCreatedTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Emit WebSocket event for real-time updates
      if (socket) {
        socket.emit('task:deleted', {
          roomId,
          taskId,
          deletedBy: user?.fullName || user?.username || 'Anonymous'
        });
      }
      
      // Update toast to success
      toast.success('✅ Task deleted successfully!', {
        id: toastId,
        duration: 3000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #333333",
        }
      });
      
      // Refresh task stats
      const stats = await getRoomTaskStats(roomId);
      setTaskStats(stats);
      
      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      
      // Update toast to error
      toast.error(error instanceof Error ? error.message : '❌ Failed to delete task', {
        id: toastId,
        duration: 3000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #dc2626",
        }
      });
      
      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

  const handleCardClick = (task: any) => {
    // Add a small delay to distinguish from double-click
    setTimeout(() => {
      // Check if this is still the most recent click (not overridden by double-click)
      if (!doubleClickHandled.current) {
        setSelectedTaskForView(task);
        setShowDescriptionModal(true);
      }
    }, 200);
  };

  const [promotingUsers, setPromotingUsers] = useState<Set<string>>(new Set());

  const handleBanUser = (memberId: string, memberName: string) => {
    setUserToBan({ id: memberId, name: memberName });
    setShowBanDialog(true);
  };

  const handleConfirmBan = async () => {
    if (!userToBan) return;

    const toastId = toast.loading('Banning user...', {
      duration: Infinity,
      style: {
        background: "#000000",
        color: "#ffffff",
        border: "1px solid #333333",
      }
    });

    try {
      const result = await banUserFromRoom(roomId, userToBan.id, banReason || undefined, banExpires || undefined);

      if (result.success) {
        toast.success(`✅ ${userToBan.name} has been banned`, {
          id: toastId,
          duration: 3000,
          style: {
            background: "#000000",
            color: "#ffffff",
            border: "1px solid #333333",
          }
        });

        // Refresh room members
        const members = await getRoomMembers(roomId);
        setRoomMembers(members);

        setShowBanDialog(false);
        setUserToBan(null);
        setBanReason('');
        setBanExpires('');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '❌ Failed to ban user', {
        id: toastId,
        duration: 3000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #dc2626",
        }
      });
    }
  };

  const handlePromoteToOwner = async (memberId: string, memberName: string) => {
    setPromotingUsers(prev => new Set([...prev, memberId]));
    const toastId = toast.loading(`Promoting ${memberName} to owner...`, {
      duration: Infinity,
      style: {
        background: "#000000",
        color: "#ffffff",
        border: "1px solid #333333",
      }
    });

    try {
      const result = await promoteMemberToOwner(roomId, memberId);
      
      toast.success(`✅ ${memberName} promoted to owner successfully!`, {
        id: toastId,
        duration: 3000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #333333",
        }
      });

      // Refresh room members to update roles
      const members = await getRoomMembers(roomId);
      setRoomMembers(members);
    } catch (error) {
      console.error('Error promoting member:', error);
      toast.error(error instanceof Error ? error.message : '❌ Failed to promote member', {
        id: toastId,
        duration: 3000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #dc2626",
        }
      });
    } finally {
      setPromotingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const handleRoomImageUpload = (url: string, publicId: string) => {
    setNewRoomImage(url);
    setNewRoomImagePublicId(publicId);
  };

  const handleUpdateRoomImage = async () => {
    if (!newRoomImagePublicId) return;

    setIsUpdatingImage(true);
    const toastId = toast.loading('Updating room image...', {
      duration: Infinity,
      style: {
        background: "#000000",
        color: "#ffffff",
        border: "1px solid #333333",
      }
    });

    try {
      const result = await updateRoomImage(roomId, newRoomImage || undefined, newRoomImagePublicId || undefined);

      toast.success('✅ Room image updated successfully!', {
        id: toastId,
        duration: 3000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #333333",
        }
      });

      // Update the room data
      setRoomData(prev => prev ? {
        ...prev,
        image_url: newRoomImage || undefined,
        image_public_id: newRoomImagePublicId || undefined
      } : null);

      // Reset state
      setNewRoomImage(null);
      setNewRoomImagePublicId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '❌ Failed to update room image', {
        id: toastId,
        duration: 3000,
        style: {
          background: "#000000",
          color: "#ffffff",
          border: "1px solid #dc2626",
        }
      });
    } finally {
      setIsUpdatingImage(false);
    }
  };

  // Draggable Task Card Component with Bounce Effect - Memoized to prevent re-renders
  const DraggableTaskCard = React.memo(({ task, index, currentUserDbId, currentUserRole }: { task: any; index: number; currentUserDbId: string | null; currentUserRole: string | null }) => {
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            ref={cardRef}
            className="sticky-note cursor-pointer"
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
            onClick={() => handleCardClick(task)}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              doubleClickHandled.current = true;
              setTimeout(() => {
                doubleClickHandled.current = false;
              }, 300);
              handleTaskDoubleClick(task.id);
            }}
          >
        <div className="sticky-note-content relative h-full">
          {/* Owner indicator - show delete hint */}
          {currentUserRole === 'owner' && (
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-yellow-400 opacity-60" title="Right-click to delete (Owner only)"></div>
          )}
          {/* Unassign button - only show if task is assigned to current user */}
          {assignment && currentUserDbId && assignment.id === currentUserDbId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnassignTask(task.id, e);
              }}
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
          
          <div className="flex flex-col items-center justify-center text-center h-full px-4">
            <div className="sticky-note-title font-bold text-lg">
              {task.title}
            </div>
          </div>
          
          <div className="sticky-note-date absolute bottom-2 left-2 text-xs">
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
                <div className={`absolute bottom-0 right-0 size-2 rounded-full ring-1 ring-zinc-900 ${currentRoomUsers?.some(u => u.userId === assignment.clerkId) ? 'bg-green-500' : 'bg-gray-400'}`}>
                  {currentRoomUsers?.some(u => u.userId === assignment.clerkId) && (
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-slow-pulse"></div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
          </motion.div>
        </ContextMenuTrigger>
        {currentUserRole === 'owner' && (
          <ContextMenuContent className="w-48">
            <ContextMenuItem 
              onClick={() => {
                setTaskToDelete(task.id);
                setShowDeleteConfirm(true);
              }}
              className="text-red-600"
            >
              Delete Task
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.position.x === nextProps.task.position.x &&
      prevProps.task.position.y === nextProps.task.position.y &&
      prevProps.task.assignedTo?.id === nextProps.task.assignedTo?.id &&
      prevProps.index === nextProps.index &&
      prevProps.currentUserDbId === nextProps.currentUserDbId &&
      prevProps.currentUserRole === nextProps.currentUserRole
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
      {/* Collaborative Cursors */}
      <CollaborativeCursors />
      
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
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => setShowSettingsModal(true)}
              >
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
                  src={roomData?.image_url || roomData?.img || '/img.png'} 
                  alt={roomData?.name}
                  className="w-20 h-20 rounded-full object-cover border-2 dark:border-white/40 bg-white/30 dark:bg-white/50 shadow-lg"
                />
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
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Status 
                    variant="online" 
                    label={`${onlineCount} online`}
                    showDot={true}
                    showPing={onlineCount > 0}
                    size="md"
                  />
                  <Status 
                    variant="offline" 
                    label={`Created ${roomData?.createdAt}`}
                    showDot={false}
                    size="md"
                  />
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
                className={`bounceCardsContainer relative w-full h-[500px] rounded-lg overflow-hidden bg-black mb-6 transition-colors duration-200 ${
                  activeDropZone ? 'bg-neutral-800/50 ring-2 ring-white' : 'bg-black'
                }`}
                style={{ width: '100%', height: '500px' }}
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
                  <DraggableTaskCard key={task.id} task={task} index={index} currentUserDbId={currentUserDbId} currentUserRole={currentUserRole} />
                ))}

                {/* New Task Dialog */}
                {showStickerCard && (
                  <>
                    {/* Click-away overlay to close */}
                    <div
                      className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-20"
                      onClick={() => setShowStickerCard(false)}
                    />
                    <div className="absolute inset-4 flex items-center justify-center z-30" onClick={(e) => e.stopPropagation()}>
                      <MagicCard className="max-w-sm w-full rounded-2xl">
                        <div className="p-6 rounded-2xl">
                          <h3 className="text-center text-lg font-semibold mb-6">
                            New Task
                          </h3>
                          <form onSubmit={handleTaskSubmit} className="space-y-5">
                            <div className="space-y-3">
                              <Label htmlFor="taskTitle" className="text-sm font-medium">Title</Label>
                              <Input
                                id="taskTitle"
                                type="text"
                                placeholder="Enter task title..."
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                required
                                className="rounded-lg"
                              />
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="taskDescription" className="text-sm font-medium">Description</Label>
                              <textarea
                                id="taskDescription"
                                placeholder="Add task details..."
                                rows={2}
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                              />
                            </div>
                            <div className="flex gap-3 pt-3">
                              <Button 
                                type="button"
                                variant="outline"
                                onClick={() => setShowStickerCard(false)}
                                className="flex-1 rounded-lg"
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit" 
                                className="flex-1 rounded-lg"
                                disabled={isCreatingTask}
                              >
                                {isCreatingTask ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  'Create'
                                )}
                              </Button>
                            </div>
                          </form>
                        </div>
                      </MagicCard>
                    </div>
                  </>
                )}
                
                {/* StarBorder Button at bottom */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
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
                      roomMembers.map((member, index) => {
                        // Check if user is online by looking at currentRoomUsers
                        const isOnline = currentRoomUsers?.some(u => u.userId === member.clerkId) || false;
                        
                        return (
                          <ContextMenu key={member.id}>
                            <ContextMenuTrigger asChild>
                              <motion.div
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                              >
                                <div className="relative">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={member.avatar || ''} alt={member.name} />
                                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute bottom-0 right-0 size-3 rounded-full ring-2 ring-zinc-900 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
                                    {isOnline && (
                                      <div className="absolute inset-0 bg-green-500 rounded-full animate-slow-pulse"></div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{member.name}</p>
                                  <Badge size="sm" className={getRoleColor(member.role)}>
                                    {member.role}
                                  </Badge>
                                </div>
                              </motion.div>
                            </ContextMenuTrigger>
                            {currentUserRole === 'owner' && member.role !== 'owner' && (
                              <ContextMenuContent className="w-48">
                                <ContextMenuItem 
                                  onClick={() => handleBanUser(member.id, member.name)}
                                  className="text-red-600"
                                >
                                  Ban {member.name}
                                </ContextMenuItem>
                              </ContextMenuContent>
                            )}
                          </ContextMenu>
                        );
                      })
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

      {/* Task Description Modal */}
      <Dialog open={showDescriptionModal} onOpenChange={setShowDescriptionModal}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {selectedTaskForView?.title}
            </DialogTitle>
            {selectedTaskForView?.description && (
              <DialogDescription className="text-center text-lg mt-4 whitespace-pre-wrap">
                {selectedTaskForView.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-4 space-y-3 px-2">
            {selectedTaskForView?.createdAt && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(selectedTaskForView.createdAt).toLocaleString()}</span>
              </div>
            )}
            {selectedTaskForView?.assignedTo && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Assigned to:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedTaskForView.assignedTo.avatar || ''} />
                    <AvatarFallback>{selectedTaskForView.assignedTo.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{selectedTaskForView.assignedTo.name}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Task?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setTaskToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (taskToDelete) {
                  handleDeleteTask(taskToDelete);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-md p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Ban User
            </DialogTitle>
            <DialogDescription>
              Ban {userToBan?.name} from this room. They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 px-2">
            <div className="space-y-2">
              <Label htmlFor="banReason">Reason (Optional)</Label>
              <Input
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Why is this user being banned?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banExpires">Expires (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="banExpires"
                  type="datetime-local"
                  value={banExpires}
                  onChange={(e) => setBanExpires(e.target.value)}
                  className="flex-1"
                />
                {banExpires && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBanExpires('')}
                    className="px-3"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for permanent ban
              </p>
            </div>
          </div>
          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowBanDialog(false);
                setUserToBan(null);
                setBanReason('');
                setBanExpires('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBan}
              className="bg-red-500 hover:bg-red-600"
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-3xl max-h-[80vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Room Settings
            </DialogTitle>
            <DialogDescription>
              Manage room settings and permissions
            </DialogDescription>
          </DialogHeader>

          {currentUserRole === 'owner' && (
            <div className="mt-6 space-y-6 px-2">
              {/* Room Image Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Room Image</h3>
                <p className="text-sm text-muted-foreground">
                  Upload or change the room's cover image.
                </p>
                
                <RoomImageUpload
                  onUploadComplete={handleRoomImageUpload}
                  currentImage={roomData?.image_url}
                  currentImagePublicId={roomData?.image_public_id}
                />

                {newRoomImagePublicId && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpdateRoomImage}
                      disabled={isUpdatingImage}
                      className="flex-1"
                    >
                      {isUpdatingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Room Image'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewRoomImage(null);
                        setNewRoomImagePublicId(null);
                      }}
                      disabled={isUpdatingImage}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold">Promote to Owner</h3>
                <p className="text-sm text-muted-foreground">
                  Promote members to owners. Multiple owners can manage this room.
                </p>
                
                <div className="space-y-3 mt-4">
                {roomMembers
                  .filter(member => member.clerkId !== user?.id)
                  .map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-4 mx-2 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar || ''} alt={member.name} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => {
                          if (member.role === 'owner') {
                            return; // Already an owner, no action needed
                          }
                          if (confirm(`Are you sure you want to promote ${member.name} to owner?`)) {
                            handlePromoteToOwner(member.id, member.name);
                          }
                        }}
                        disabled={promotingUsers.has(member.id) || member.role === 'owner'}
                      >
                        {promotingUsers.has(member.id) ? 'Promoting...' : member.role === 'owner' ? 'Owner' : 'Make Owner'}
                      </Button>
                    </div>
                  ))}
                
                {roomMembers.filter(m => m.clerkId !== user?.id).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No other members to promote.
                  </p>
                )}
                </div>
              </div>
            </div>
          )}

          {currentUserRole !== 'owner' && (
            <div className="mt-6 text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Only the room owner can access settings.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
