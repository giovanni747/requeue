'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth, useUser } from '@clerk/nextjs';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: OnlineUser[];
  currentRoomUsers: OnlineUser[];
  currentRoomId: string | null;
  joinRoom: (roomId: string, userName?: string) => void;
  leaveRoom: (roomId: string) => void;
  emitTaskCreated: (data: any) => void;
  emitTaskUpdated: (data: any) => void;
  emitTaskDeleted: (data: any) => void;
  emitTaskMoved: (data: any) => void;
  emitTaskCompleted: (data: any) => void;
  emitNotification: (data: any) => void;
  emitUserFollowed: (data: any) => void;
  emitUserUnfollowed: (data: any) => void;
  emitCursorMove: (data: { x: number; y: number; userName: string }) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  onlineUsers: [],
  currentRoomUsers: [],
  currentRoomId: null,
  joinRoom: () => {},
  leaveRoom: () => {},
  emitTaskCreated: () => {},
  emitTaskUpdated: () => {},
  emitTaskDeleted: () => {},
  emitTaskMoved: () => {},
  emitTaskCompleted: () => {},
  emitNotification: () => {},
  emitUserFollowed: () => {},
  emitUserUnfollowed: () => {},
  emitCursorMove: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [currentRoomUsers, setCurrentRoomUsers] = useState<OnlineUser[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isSignedIn || !userId || !user) return;

    // Add a small delay to ensure auth is fully ready
    const connectTimeout = setTimeout(() => {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
      
      const newSocket = io(socketUrl, {
        query: { 
          userId,
          userName: user.fullName || user.username || 'Anonymous'
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('🔌 Connected to socket server');
        setConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from socket server:', reason);
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error);
        setConnected(false);
        
        // Retry connection after a delay
        setTimeout(() => {
          if (newSocket.disconnected) {
            newSocket.connect();
          }
        }, 2000);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔌 Reconnected to socket server after', attemptNumber, 'attempts');
        setConnected(true);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('🔌 Socket reconnection error:', error);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('🔌 Socket reconnection failed');
        setConnected(false);
      });

      // Listen for room users updates
      newSocket.on('room-users', (users: OnlineUser[]) => {
        console.log('🔌 Room users updated:', users);
        console.log('🔌 Mapped users:', users.map(u => ({ userId: u.userId, userName: u.userName, socketId: u.socketId })));
        setCurrentRoomUsers(users);
      });

      newSocket.on('user-joined', (data: { userId: string; userName: string; socketId: string }) => {
        console.log('🔌 User joined:', data.userName);
        setCurrentRoomUsers(prev => {
          // Check if user already exists
          if (prev.find(u => u.socketId === data.socketId)) return prev;
          return [...prev, data];
        });
      });

      newSocket.on('user-left', (data: { userId: string; userName: string; socketId: string }) => {
        console.log('🔌 User left:', data.userName);
        setCurrentRoomUsers(prev => prev.filter(u => u.socketId !== data.socketId));
      });

      // Listen for global online users updates (optional)
      newSocket.on('online-users', (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      setSocket(newSocket);

      // Ensure connection is attempted
      if (newSocket.disconnected) {
        newSocket.connect();
      }
    }, 500); // 500ms delay

    return () => {
      clearTimeout(connectTimeout);
      if (socket) {
        console.log('🔌 Cleaning up socket connection');
        socket.off('room-users');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('online-users');
        socket.close();
        setSocket(null);
        setConnected(false);
        setCurrentRoomUsers([]);
        setOnlineUsers([]);
      }
    };
  }, [isSignedIn, userId, user]);

  const joinRoom = useCallback((roomId: string, userName?: string) => {
    if (socket && connected) {
      const payload = {
        roomId,
        userId,
        userName: userName || user?.fullName || user?.username || 'Anonymous'
      };
      console.log(`🔌 Joining room with payload:`, payload);
      socket.emit('join-room', payload);
      setCurrentRoomId(roomId);
      console.log(`🔌 Joined room: ${roomId}`);
    }
  }, [socket, connected, userId, user]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socket && connected) {
      socket.emit('leave-room', roomId);
      console.log(`🔌 Left room: ${roomId}`);
      // Clear current room users when leaving
      setCurrentRoomUsers([]);
      setCurrentRoomId(null); // Clear current room ID
    }
  }, [socket, connected]);

  const emitTaskCreated = useCallback((data: any) => {
    if (socket && connected) {
      socket.emit('task:created', data);
      console.log('🔌 Emitted task:created', data);
    }
  }, [socket, connected]);

  const emitTaskUpdated = useCallback((data: any) => {
    if (socket && connected) {
      socket.emit('task:updated', data);
      console.log('🔌 Emitted task:updated', data);
    }
  }, [socket, connected]);

  const emitTaskDeleted = useCallback((data: any) => {
    if (socket && connected) {
      socket.emit('task:deleted', data);
      console.log('🔌 Emitted task:deleted', data);
    }
  }, [socket, connected]);

  const emitTaskMoved = useCallback((data: any) => {
    if (socket && connected) {
      socket.emit('task:moved', data);
      console.log('🔌 Emitted task:moved', data);
    }
  }, [socket, connected]);

  const emitTaskCompleted = useCallback((data: any) => {
    if (socket && connected) {
      socket.emit('task:completed', data);
      console.log('🔌 Emitted task:completed', data);
    }
  }, [socket, connected]);

  const emitNotification = useCallback((data: any) => {
    if (socket && connected) {
      socket.emit('notification:new', data);
      console.log('🔌 Emitted notification:new', data);
    }
  }, [socket, connected]);

  const emitUserFollowed = useCallback((data: any) => {
    if (socket && connected) {
      socket.emit('user:followed', data);
      console.log('🔌 Emitted user:followed', data);
    }
  }, [socket, connected]);

  const emitUserUnfollowed = useCallback((data: any) => {
    if (socket && connected) {
      socket.emit('user:unfollowed', data);
      console.log('🔌 Emitted user:unfollowed', data);
    }
  }, [socket, connected]);

  const emitCursorMove = useCallback((data: { x: number; y: number; userName: string }) => {
    if (socket && connected && currentRoomId) {
      socket.emit('cursor:move', {
        roomId: currentRoomId,
        x: data.x,
        y: data.y,
        userName: data.userName
      });
    }
  }, [socket, connected, currentRoomId]);

  const value: SocketContextType = {
    socket,
    connected,
    onlineUsers,
    currentRoomUsers,
    currentRoomId,
    joinRoom,
    leaveRoom,
    emitTaskCreated,
    emitTaskUpdated,
    emitTaskDeleted,
    emitTaskMoved,
    emitTaskCompleted,
    emitNotification,
    emitUserFollowed,
    emitUserUnfollowed,
    emitCursorMove,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
