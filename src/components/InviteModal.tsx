'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Modal, 
  ModalTrigger, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose
} from '@/components/ui/modal';
import { 
  Search, 
  Mail, 
  Users, 
  UserPlus, 
  X, 
  Check,
  Star,
  Heart
} from 'lucide-react';
import { 
  searchUsers, 
  getFollowers, 
  getFollowing, 
  sendEmailInvitation, 
  inviteUsersToRoom 
} from '@/lib/actions';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  image?: string;
  clerkId: string;
  isFollowing: boolean;
}

interface InviteModalProps {
  children: React.ReactNode;
  roomId?: string;
  onInviteComplete?: (invitedUsers: User[], emailInvites: string[]) => void;
}

export function InviteModal({ children, roomId, onInviteComplete }: InviteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [emailInvites, setEmailInvites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'followers' | 'following'>('search');

  // Load followers and following when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFollowersAndFollowing();
    }
  }, [isOpen]);

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFollowersAndFollowing = async () => {
    try {
      const [followersData, followingData] = await Promise.all([
        getFollowers(),
        getFollowing()
      ]);
      setFollowers(followersData);
      setFollowing(followingData);
    } catch (error) {
      console.error('Error loading followers/following:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleUserSelect = (user: User) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleEmailAdd = () => {
    const email = searchQuery.trim();
    if (isEmailValid(email) && !emailInvites.includes(email)) {
      setEmailInvites(prev => [...prev, email]);
      setSearchQuery('');
    }
  };

  const removeEmailInvite = (email: string) => {
    setEmailInvites(prev => prev.filter(e => e !== email));
  };

  const handleInvite = async () => {
    try {
      setIsLoading(true);
      
      const promises = [];
      
      // Invite selected users to room
      if (selectedUsers.length > 0 && roomId) {
        promises.push(inviteUsersToRoom(selectedUsers.map(u => u.id), roomId));
      }
      
      // Send email invitations
      if (emailInvites.length > 0) {
        promises.push(...emailInvites.map(email => sendEmailInvitation(email, roomId)));
      }
      
      await Promise.all(promises);
      
      // Call completion callback
      onInviteComplete?.(selectedUsers, emailInvites);
      
      // Reset state and close modal
      setSelectedUsers([]);
      setEmailInvites([]);
      setSearchQuery('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsersToDisplay = () => {
    switch (activeTab) {
      case 'followers':
        return followers;
      case 'following':
        return following;
      default:
        return searchResults;
    }
  };

  const isUserSelected = (user: User) => selectedUsers.some(u => u.id === user.id);

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger asChild>
        {children}
      </ModalTrigger>
      
      <ModalContent className="max-w-2xl max-h-[80vh]">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite People
          </ModalTitle>
          <ModalDescription>
            Search for users by name or username, select your followers, or invite by email
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users or enter email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && isEmailValid(searchQuery)) {
                  handleEmailAdd();
                }
              }}
            />
            {isEmailValid(searchQuery) && (
              <Button
                size="sm"
                onClick={handleEmailAdd}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7"
              >
                <Mail className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'search' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Search className="h-4 w-4" />
              Search Results
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'followers' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart className="h-4 w-4" />
              Followers ({followers.length})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === 'following' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className="h-4 w-4" />
              Following ({following.length})
            </button>
          </div>

          {/* Selected Users & Email Invites */}
          {(selectedUsers.length > 0 || emailInvites.length > 0) && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Selected ({selectedUsers.length + emailInvites.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge 
                    key={user.id}
                    variant="secondary" 
                    className="flex items-center gap-2 pr-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                    <button
                      onClick={() => handleUserSelect(user)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {emailInvites.map((email) => (
                  <Badge 
                    key={email}
                    variant="outline" 
                    className="flex items-center gap-2 pr-1"
                  >
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      onClick={() => removeEmailInvite(email)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {isLoading && activeTab === 'search' ? (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            ) : getUsersToDisplay().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {activeTab === 'search' 
                  ? (searchQuery ? 'No users found' : 'Start typing to search users')
                  : `No ${activeTab} found`
                }
              </div>
            ) : (
              getUsersToDisplay().map((user) => {
                const selected = isUserSelected(user);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      selected 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-accent"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        {user.isFollowing && (
                          <Badge size="sm" variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Following
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    
                    {selected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ModalBody>

        <ModalFooter className="flex justify-between">
          <ModalClose asChild>
            <Button variant="outline">Cancel</Button>
          </ModalClose>
          
          <Button 
            onClick={handleInvite}
            disabled={selectedUsers.length === 0 && emailInvites.length === 0 || isLoading}
          >
            {isLoading ? 'Sending...' : `Invite ${selectedUsers.length + emailInvites.length} ${selectedUsers.length + emailInvites.length === 1 ? 'Person' : 'People'}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
