'use client';

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import MessageInput from "./MessageInput";
import { getRoomMessages, sendMessage, getRoomMembers } from "@/lib/actions";
import { useSocket } from "@/contexts/SocketContext";
import { MessageLoading } from "@/components/ui/message-loading";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  text: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  mentionedUserIds?: string[];
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    clerkId: string;
  };
}

interface RoomChatProps {
  roomId: string;
}

export default function RoomChat({ roomId }: RoomChatProps) {
  const { user } = useUser();
  const { socket, connected, typingUsers } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roomMembers, setRoomMembers] = useState<Map<string, { name: string; id: string }>>(new Map());
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Fetch room members for mention display
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await getRoomMembers(roomId);
        const membersMap = new Map();
        members.forEach(member => {
          membersMap.set(member.id, { name: member.name, id: member.id });
        });
        setRoomMembers(membersMap);
      } catch (error) {
        console.error('Error fetching room members:', error);
      }
    };

    fetchMembers();
  }, [roomId]);

  // Fetch messages on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const fetchedMessages = await getRoomMessages(roomId);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [roomId]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewMessage = (data: { message: Message; roomId: string }) => {
      console.log('🔌 Received message:new event:', data);
      
      // Only add if it's for this room and not already in the list
      if (data.roomId === roomId) {
        setMessages(prev => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, connected, roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (data: { 
    text?: string; 
    imageUrl?: string; 
    imagePublicId?: string;
    mentionedUserIds?: string[];
  }) => {
    try {
      const result = await sendMessage(
        roomId, 
        data.text, 
        data.imageUrl, 
        data.imagePublicId,
        data.mentionedUserIds
      );
      
      if (result.success && result.message) {
        // Add message to local state immediately (optimistic update)
        setMessages(prev => [...prev, result.message]);
        
        // Broadcast to other users via WebSocket
        if (socket && connected) {
          socket.emit('message:new', {
            roomId: roomId,
            message: result.message
          });
          console.log('🔌 Emitted message:new event', result.message);
        }
      } else {
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Render text with highlighted mentions
  const renderTextWithMentions = (text: string) => {
    if (!text) return null;

    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add highlighted mention - just show @username with background
      const userName = match[1];
      const userId = match[2];

      parts.push(
        <span
          key={`mention-${key++}`}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-sm"
        >
          @{userName}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Room Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Room Chat
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="text-sm">Be the first to send a message in this room!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.sender.clerkId === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={message.sender.image || "/avatar.png"} />
                      <AvatarFallback>
                        {message.sender.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {isCurrentUser ? "You" : message.sender.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                      
                      <div
                        className={`rounded-lg p-3 max-w-full overflow-hidden ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary/80 border border-border"
                        }`}
                      >
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl}
                            alt="Attachment"
                            className="max-w-[200px] rounded-md mb-2"
                          />
                        )}
                        {message.text && (
                          <p className="text-sm break-words whitespace-pre-wrap word-break">
                            {renderTextWithMentions(message.text)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage 
                      src={typingUsers[0]?.userName === 'Gio San' ? '/avatar.png' : '/avatar.png'} 
                      alt={typingUsers[0]?.userName || 'User'} 
                    />
                    <AvatarFallback>
                      {typingUsers[0]?.userName?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <div className="text-xs text-muted-foreground mb-1">
                      {typingUsers.length === 1 
                        ? `${typingUsers[0].userName} is typing...`
                        : `${typingUsers.length} people are typing...`
                      }
                    </div>
                    <div className="bg-secondary/80 border border-border rounded-lg p-3">
                      <div className="flex items-center gap-1">
                        <MessageLoading />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messageEndRef} />
          </>
        )}
      </CardContent>

      <div className="flex-shrink-0">
        <MessageInput onSendMessage={handleSendMessage} roomId={roomId} />
      </div>
    </Card>
  );
}

