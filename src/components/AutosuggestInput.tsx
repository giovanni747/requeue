'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mail, 
  X, 
  Star,
  Check
} from 'lucide-react';
import { searchUsers } from '@/lib/actions';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  image?: string;
  clerkId: string;
  isFollowing: boolean;
}

interface AutosuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectedUsers: (User | { email: string; type: 'email' })[];
  onUserSelect: (user: User | { email: string; type: 'email' }) => void;
  onUserRemove: (user: User | { email: string; type: 'email' }) => void;
  className?: string;
  disabled?: boolean;
}

export function AutosuggestInput({
  value,
  onChange,
  placeholder = "Search users or enter email...",
  selectedUsers,
  onUserSelect,
  onUserRemove,
  className,
  disabled = false
}: AutosuggestInputProps) {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async () => {
    if (!value.trim()) return;
    
    try {
      setIsLoading(true);
      const results = await searchUsers(value);
      
      // Filter out already selected users
      const selectedUserIds = selectedUsers
        .filter((u): u is User => 'id' in u)
        .map(u => u.id);
      
      const filteredResults = results
        .filter(user => !selectedUserIds.includes(user.id))
        .sort((a, b) => {
          if (a.isFollowing && !b.isFollowing) return -1;
          if (!a.isFollowing && b.isFollowing) return 1;
          return 0;
        });
      
      setSearchResults(filteredResults);
      setIsOpen(true);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [value, selectedUsers]);

  // Search users when value changes
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (value.trim() && value.length > 2) {
        handleSearch();
      } else {
        setSearchResults([]);
        setIsOpen(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimer);
  }, [value, handleSearch]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isEmailValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isEmailAlreadySelected = (email: string) => {
    return selectedUsers.some(u => 'email' in u && u.email === email);
  };

  const getDropdownItems = () => {
    const items = [...searchResults];
    
    // Add email option if it's a valid email and not already selected
    if (isEmailValid(value) && !isEmailAlreadySelected(value)) {
      return [...items, { type: 'email', email: value }];
    }
    
    return items;
  };

  const handleItemSelect = (item: User | { type: 'email'; email: string }) => {
    if ('type' in item && item.type === 'email') {
      onUserSelect({ email: item.email, type: 'email' });
    } else {
      onUserSelect(item as User);
    }
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const items = getDropdownItems();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && items[highlightedIndex]) {
          handleItemSelect(items[highlightedIndex] as User | { type: 'email'; email: string });
        } else if (isEmailValid(value) && !isEmailAlreadySelected(value)) {
          onUserSelect({ email: value, type: 'email' });
          onChange('');
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user, index) => (
            <Badge 
              key={`selected-${index}`}
              variant={'id' in user ? "secondary" : "outline"}
              className="flex items-center gap-2 pr-1 py-1 transition-all hover:shadow-md"
            >
              {'id' in user ? (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{user.name}</span>
                  {user.isFollowing && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                </>
              ) : (
                <>
                  <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium">{user.email}</span>
                </>
              )}
              <button
                onClick={() => onUserRemove(user)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with Dropdown */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim() && searchResults.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
        />

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : getDropdownItems().length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                {value.trim() ? 'No users found' : 'Start typing to search'}
              </div>
            ) : (
              getDropdownItems().map((item, index) => {
                const isHighlighted = index === highlightedIndex;
                const isEmail = 'type' in item && item.type === 'email';
                
                return (
                  <div
                    key={isEmail ? `email-${item.email}` : `user-${(item as User).id}`}
                    onClick={() => handleItemSelect(item as User | { type: 'email'; email: string })}
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                      isHighlighted 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-accent/50"
                    )}
                  >
                    {isEmail ? (
                      <>
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{item.email}</div>
                          <div className="text-sm text-muted-foreground">Invite by email</div>
                        </div>
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Mail className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={(item as User).image} alt={(item as User).name} />
                          <AvatarFallback>
                            {(item as User).name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{(item as User).name}</span>
                            {(item as User).isFollowing && (
                              <Badge size="sm" variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
                                Following
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">@{(item as User).username}</div>
                        </div>
                        
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      {selectedUsers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} selected
        </p>
      )}
    </div>
  );
}
