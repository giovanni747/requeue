'use client';

import { useRef, useState, useEffect, useCallback } from "react";
import { Image, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/contexts/SocketContext";
import toast from "react-hot-toast";
import { getRoomMembers } from "@/lib/actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  clerkId: string;
}

interface MessageInputProps {
  onSendMessage: (data: { 
    text?: string; 
    imageUrl?: string; 
    imagePublicId?: string;
    mentionedUserIds?: string[];
  }) => Promise<void>;
  disabled?: boolean;
  roomId: string;
}

export default function MessageInput({ onSendMessage, disabled = false, roomId }: MessageInputProps) {
  const { user } = useUser();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);
  const [roomMembers, setRoomMembers] = useState<User[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const { emitTyping } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch room members for mentions
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await getRoomMembers(roomId);
        // Map the members to match our User interface
        const mappedMembers = members.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          image: member.image,
          clerkId: member.clerkId
        }));
        setRoomMembers(mappedMembers);
      } catch (error) {
        console.error('Error fetching room members:', error);
      }
    };

    fetchMembers();
  }, [roomId]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'chat-messages');
      formData.append('tags', 'message-image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImagePreview(result.secureUrl);
        setImagePublicId(result.publicId);
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImagePublicId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Typing detection
  const handleTypingStart = useCallback(() => {
    emitTyping({ roomId, isTyping: true });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping({ roomId, isTyping: false });
    }, 2000);
  }, [emitTyping, roomId]);


  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    // Stop typing when sending message
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTyping({ roomId, isTyping: false });

    setSending(true);

    try {
      // Extract user IDs from mentions
      const mentionedUserIds = mentionedUsers.map(user => user.id);

      await onSendMessage({
        text: text.trim() || undefined,
        imageUrl: imagePreview || undefined,
        imagePublicId: imagePublicId || undefined,
        mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      setImagePublicId(null);
      setMentionedUsers([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 border-t bg-background">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
              type="button"
              disabled={uploading || sending}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            {/* Display layer with formatted mentions */}
            <div className="absolute inset-0 px-3 py-2 pointer-events-none overflow-hidden whitespace-pre-wrap break-words text-sm">
              {text.split(/(@\[[^\]]+\]\([^)]+\))/).map((part, idx) => {
                const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
                if (mentionMatch) {
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium"
                    >
                      @{mentionMatch[1]}
                    </span>
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
              {/* Cursor indicator - only show when input is focused */}
              {isFocused && (
                <span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5"></span>
              )}
            </div>
            
            {/* Actual input (hidden text) */}
            <Input
              ref={textInputRef}
              type="text"
              value={text}
              onChange={(e) => {
                const newText = e.target.value;
                setText(newText);
                
                // Parse valid mentions from text
                const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
                const foundMentions: User[] = [];
                let match;
                
                while ((match = mentionRegex.exec(newText)) !== null) {
                  const userId = match[2];
                  const user = roomMembers.find(u => u.id === userId);
                  if (user && !foundMentions.find(u => u.id === user.id)) {
                    foundMentions.push(user);
                  }
                }
                setMentionedUsers(foundMentions);
                
                if (newText.trim().length > 0) {
                  handleTypingStart();
                } else {
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }
                  emitTyping({ roomId, isTyping: false });
                }
              }}
              onKeyDown={(e) => {
                // Handle backspace and delete to manage mentions
                if (e.key === 'Backspace' || e.key === 'Delete') {
                  const cursorPosition = e.currentTarget.selectionStart || 0;
                  const textBeforeCursor = text.substring(0, cursorPosition);
                  const textAfterCursor = text.substring(cursorPosition);
                  
                  // Check if cursor is inside or at the boundary of a mention
                  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
                  let match;
                  let isInsideMention = false;
                  let mentionToDelete = null;
                  let mentionStart = 0;
                  let mentionEnd = 0;
                  
                  // Reset regex
                  mentionPattern.lastIndex = 0;
                  
                  while ((match = mentionPattern.exec(text)) !== null) {
                    mentionStart = match.index;
                    mentionEnd = match.index + match[0].length;
                    
                    // Check if cursor is inside or at the end of this mention
                    if (e.key === 'Backspace' && cursorPosition > mentionStart && cursorPosition <= mentionEnd) {
                      isInsideMention = true;
                      mentionToDelete = match[0];
                      break;
                    } else if (e.key === 'Delete' && cursorPosition >= mentionStart && cursorPosition < mentionEnd) {
                      isInsideMention = true;
                      mentionToDelete = match[0];
                      break;
                    }
                  }
                  
                  if (isInsideMention && mentionToDelete) {
                    e.preventDefault();
                    // Delete the entire mention
                    const beforeMention = text.substring(0, mentionStart);
                    const afterMention = text.substring(mentionEnd);
                    setText(beforeMention + afterMention);
                    
                    // Update cursor position
                    setTimeout(() => {
                      if (textInputRef.current) {
                        textInputRef.current.setSelectionRange(beforeMention.length, beforeMention.length);
                      }
                    }, 0);
                  }
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onClick={(e) => {
                // Prevent cursor from being placed inside a mention
                const cursorPosition = e.currentTarget.selectionStart || 0;
                const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
                let match;
                
                while ((match = mentionPattern.exec(text)) !== null) {
                  const mentionStart = match.index;
                  const mentionEnd = match.index + match[0].length;
                  
                  // If cursor is inside a mention, move it to the end
                  if (cursorPosition > mentionStart && cursorPosition < mentionEnd) {
                    e.currentTarget.setSelectionRange(mentionEnd, mentionEnd);
                    break;
                  }
                }
              }}
              placeholder="Type a message... (use @username)"
              disabled={disabled || uploading || sending}
              className="flex-1 relative bg-transparent caret-foreground"
              style={{ color: 'transparent', caretColor: 'currentColor' }}
            />
            
            {/* Simple mention suggestions */}
            {text.includes('@') && (() => {
              const lastAtIndex = text.lastIndexOf('@');
              const textAfterAt = text.substring(lastAtIndex + 1);
              // Stop at space or special character
              const searchTerm = textAfterAt.match(/^[\w\s-]*/)?.[0] || '';
              // Filter out current user and apply search
              const filtered = roomMembers.filter(u => 
                searchTerm.length > 0 && 
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                u.clerkId !== user?.id // Exclude current user
              ).slice(0, 5);
              
              if (filtered.length > 0) {
                return (
                  <div className="absolute bottom-full left-0 mb-1 w-64 bg-popover border rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {filtered.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            const beforeAt = text.substring(0, lastAtIndex);
                            const afterSearch = text.substring(lastAtIndex + searchTerm.length + 1);
                            const mention = `@[${user.name}](${user.id})`;
                            const newText = beforeAt + mention + afterSearch;
                            setText(newText);
                            if (!mentionedUsers.find(u => u.id === user.id)) {
                              setMentionedUsers(prev => [...prev, user]);
                            }
                            // Restart typing indicator after mention
                            handleTypingStart();
                            // Focus back to input after a short delay
                            setTimeout(() => {
                              if (textInputRef.current) {
                                textInputRef.current.focus();
                                // Position cursor at the end
                                const endPosition = newText.length;
                                textInputRef.current.setSelectionRange(endPosition, endPosition);
                              }
                            }, 10);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-accent transition-colors text-left"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.image || '/avatar.png'} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {user.name[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{user.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
          
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={disabled || uploading || sending}
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className={imagePreview ? "text-emerald-500" : "text-muted-foreground"}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading || sending}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Image className="h-5 w-5" />
            )}
          </Button>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={(!text.trim() && !imagePreview) || disabled || uploading || sending}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}

