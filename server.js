import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
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
      origin: dev ? "http://localhost:3000" : process.env.NEXT_PUBLIC_APP_URL,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Store connected users by room
  const roomUsers = new Map();
  // Store global online users keyed by socket.id
  const onlineUsers = new Map();
  // Store cursor positions by room
  const roomCursors = new Map(); // roomId -> Map<socketId, cursorData>

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
      const { roomId, x, y, userName } = data;
      
      // Store cursor position
      if (!roomCursors.has(roomId)) {
        roomCursors.set(roomId, new Map());
      }
      
      roomCursors.get(roomId).set(socket.id, {
        x,
        y,
        userName,
        socketId: socket.id,
        lastSeen: Date.now()
      });
      
      // Broadcast to other users in the room
      socket.to(roomId).emit("cursor:move", {
        x,
        y,
        userName,
        socketId: socket.id
      });
    });

    // Handle message events
    socket.on("message:new", (data) => {
      console.log("New message:", data);
      const { roomId, message } = data;
      
      // Broadcast message to all users in the room (including sender)
      io.to(roomId).emit("message:new", data);

      // If message has mentions, send mention notifications to mentioned users
      if (message && message.mentionedUserIds && message.mentionedUserIds.length > 0) {
        console.log("Message has mentions:", message.mentionedUserIds);
        console.log("Message sender:", message.sender);
        
        message.mentionedUserIds.forEach((mentionedUserId) => {
          // Find socket(s) for the mentioned user
          const userSockets = Array.from(onlineUsers.entries())
            .filter(([_, user]) => user.userId === mentionedUserId)
            .map(([socketId]) => socketId);

          // Emit mention notification to mentioned user's sockets
          userSockets.forEach((userSocketId) => {
            const senderName = message.sender?.name || 'Unknown User';
            console.log(`Sending mention notification to ${mentionedUserId} from ${senderName}`);
            
            // Clean the message text by removing mention markdown syntax
            // Converts "@[walter white](uuid)hello?" to "hello?"
            const cleanedText = message.text?.replace(/@\[([^\]]+)\]\([^)]+\)/g, '') || 'mentioned you';
            
            io.to(userSocketId).emit("mention:received", {
              messageId: message.id,
              roomId: roomId,
              senderId: message.senderId,
              senderName: senderName,
              text: cleanedText.substring(0, 100)
            });
          });
        });
      }
    });

    // Handle typing events
    socket.on("typing:start", (data) => {
      console.log("User started typing:", data);
      const { roomId, userId, userName } = data;
      // Broadcast typing start to all users in the room except sender
      socket.to(roomId).emit("typing:start", { userId, userName });
    });

    socket.on("typing:stop", (data) => {
      console.log("User stopped typing:", data);
      const { roomId, userId, userName } = data;
      // Broadcast typing stop to all users in the room except sender
      socket.to(roomId).emit("typing:stop", { userId, userName });
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

      // Clean up cursors from all rooms
      for (const [roomId, cursors] of roomCursors.entries()) {
        if (cursors.has(socket.id)) {
          cursors.delete(socket.id);
          socket.to(roomId).emit("cursor:leave", { socketId: socket.id });
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
