import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer();
  
  // Create Socket.io server with CORS configuration
  const io = new Server(server, {
    cors: {
      origin: dev ? "http://localhost:3000" : false,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Store connected users by room
  const roomUsers = new Map();
  // Store global online users keyed by socket.id
  const onlineUsers = new Map();

  // Handle socket.io connections
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    // Optional identity from connection query
    const { userId: queryUserId, userName: queryUserName } = socket.handshake.query || {};
    if (queryUserId) {
      onlineUsers.set(socket.id, { userId: String(queryUserId), userName: String(queryUserName || 'Anonymous') });
      // Broadcast global online users list
      io.emit('online-users', Array.from(onlineUsers.values()));
    }
    
    // Join room when user connects to a specific room
    socket.on("join-room", (data) => {
      const { roomId, userId, userName } = data;
      socket.join(roomId);
      
      // Track users in room with socketId
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      roomUsers.get(roomId).set(socket.id, { userId, userName, socketId: socket.id });
      
      console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);
      
      // Notify room about new user
      socket.to(roomId).emit("user-joined", {
        userId,
        userName,
        socketId: socket.id
      });
      
      // Send updated room users to everyone in the room (including new user)
      const currentUsers = Array.from(roomUsers.get(roomId).values());
      io.to(roomId).emit("room-users", currentUsers);
    });

    // Leave room when user disconnects from a specific room
    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      
      // Remove user from room tracking
      if (roomUsers.has(roomId)) {
        const userInfo = roomUsers.get(roomId).get(socket.id);
        if (userInfo) {
          roomUsers.get(roomId).delete(socket.id);
          
          // Notify room about user leaving
          socket.to(roomId).emit("user-left", {
            userId: userInfo.userId,
            userName: userInfo.userName,
            socketId: socket.id
          });
          
          console.log(`User ${userInfo.userName} left room ${roomId}`);
          // Emit updated room users list
          const currentUsers = Array.from(roomUsers.get(roomId).values());
          io.to(roomId).emit("room-users", currentUsers);
        }
      }
    });

    // Handle task events
    socket.on("task:created", (data) => {
      console.log("Task created:", data);
      socket.to(data.roomId).emit("task:created", data);
    });

    socket.on("task:updated", (data) => {
      console.log("Task updated:", data);
      socket.to(data.roomId).emit("task:updated", data);
    });

    socket.on("task:deleted", (data) => {
      console.log("Task deleted:", data);
      socket.to(data.roomId).emit("task:deleted", data);
    });

    socket.on("task:moved", (data) => {
      console.log("Task moved:", data);
      socket.to(data.roomId).emit("task:moved", data);
    });

    socket.on("task:completed", (data) => {
      console.log("Task completed:", data);
      socket.to(data.roomId).emit("task:completed", data);
    });

    // Handle notification events
    socket.on("notification:new", (data) => {
      console.log("New notification:", data);
      // Send notification to specific user
      socket.to(data.targetUserId).emit("notification:new", data);
    });

    socket.on("notification:read", (data) => {
      console.log("Notification read:", data);
      socket.to(data.roomId).emit("notification:read", data);
    });

    // Handle follow/unfollow events
    socket.on("user:followed", (data) => {
      console.log("User followed:", data);
      socket.to(data.targetUserId).emit("user:followed", data);
    });

    socket.on("user:unfollowed", (data) => {
      console.log("User unfollowed:", data);
      socket.to(data.targetUserId).emit("user:unfollowed", data);
    });

    // Handle cursor/pointer events for collaborative features
    socket.on("cursor:move", (data) => {
      socket.to(data.roomId).emit("cursor:move", {
        ...data,
        socketId: socket.id
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      
      // Clean up user from all rooms
      for (const [roomId, users] of roomUsers.entries()) {
        if (users.has(socket.id)) {
          const userInfo = users.get(socket.id);
          users.delete(socket.id);
          
          socket.to(roomId).emit("user-left", {
            userId: userInfo.userId,
            userName: userInfo.userName,
            socketId: socket.id
          });
          
          console.log(`User ${userInfo.userName} disconnected from room ${roomId}`);
          // Emit updated room users list
          const currentUsers = Array.from(users.values());
          io.to(roomId).emit("room-users", currentUsers);
        }
      }

      // Remove from global online users and broadcast
      if (onlineUsers.has(socket.id)) {
        onlineUsers.delete(socket.id);
        io.emit('online-users', Array.from(onlineUsers.values()));
      }
    });
  });

  // Handle Next.js requests
  server.on('request', (req, res) => {
    handle(req, res);
  });

  // Start server
  server.listen(port, () => {
    console.log(`🚀 Server running on http://${hostname}:${port}`);
    console.log(`🔌 Socket.io server ready for connections`);
  });
});
