'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  clerkId: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange: (mentions: User[]) => void;
  users: User[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

interface MentionData {
  user: User;
  startIndex: number;
  endIndex: number;
}

export default function MentionInput({
  value,
  onChange,
  onMentionsChange,
  users,
  placeholder,
  disabled,
  className,
  onKeyDown
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSearch, setSuggestionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentions, setMentions] = useState<MentionData[]>([]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(suggestionSearch.toLowerCase())
  );

  // Parse text to find all mentions
  const parseMentions = (text: string): MentionData[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const foundMentions: MentionData[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const userName = match[1];
      const userId = match[2];
      const user = users.find(u => u.id === userId);
      
      if (user) {
        foundMentions.push({
          user,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }

    return foundMentions;
  };

  // Update mentions when text changes
  useEffect(() => {
    const newMentions = parseMentions(value);
    setMentions(newMentions);
    onMentionsChange(newMentions.map(m => m.user));
  }, [value, users]);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(newCursorPosition);

    // Check if user is typing @ to trigger mention suggestions
    const textBeforeCursor = newValue.substring(0, newCursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      
      // Show suggestions if @ is at start or preceded by whitespace
      const charBeforeAt = lastAtSymbol === 0 ? ' ' : textBeforeCursor[lastAtSymbol - 1];
      if (/\s/.test(charBeforeAt) || lastAtSymbol === 0) {
        // Check if there's no closing bracket yet
        if (!textAfterAt.includes(']')) {
          setShowSuggestions(true);
          setSuggestionSearch(textAfterAt);
          setSelectedIndex(0);
          return;
        }
      }
    }
    
    setShowSuggestions(false);
  };

  // Insert mention
  const insertMention = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const beforeMention = value.substring(0, lastAtSymbol);
      const mention = `@[${user.name}](${user.id})`;
      const newValue = beforeMention + mention + ' ' + textAfterCursor;
      const newCursorPos = beforeMention.length + mention.length + 1;
      
      onChange(newValue);
      setShowSuggestions(false);
      setSuggestionSearch('');
      
      // Set cursor position after mention
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[selectedIndex]);
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Pass other key events to parent
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Render text with highlighted mentions
  const renderTextWithMentions = () => {
    if (!value) return null;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    mentions.forEach((mention, idx) => {
      // Add text before mention
      if (mention.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {value.substring(lastIndex, mention.startIndex)}
          </span>
        );
      }

      // Add highlighted mention
      parts.push(
        <span 
          key={`mention-${idx}`}
          className="text-primary font-medium"
        >
          @{mention.user.name}
        </span>
      );

      lastIndex = mention.endIndex;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(
        <span key="text-end">
          {value.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="relative w-full">
      {/* Hidden div with formatted text for display */}
      <div 
        className={`absolute inset-0 pointer-events-none whitespace-pre-wrap break-words px-3 py-2 text-transparent ${className}`}
        style={{ 
          font: 'inherit',
          lineHeight: 'inherit',
          wordBreak: 'break-word'
        }}
      >
        {renderTextWithMentions()}
      </div>

      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full resize-none bg-transparent relative z-10 ${className}`}
        style={{ caretColor: 'currentColor' }}
        rows={3}
      />

      {/* Mention suggestions dropdown */}
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border rounded-md shadow-lg z-50">
          <div className="py-1">
            {filteredUsers.slice(0, 5).map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer w-full hover:bg-accent transition-colors text-left ${
                  index === selectedIndex ? 'bg-accent' : ''
                }`}
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
      )}
    </div>
  );
}

