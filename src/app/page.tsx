"use client";

import { ClerkLoaded, ClerkLoading, useUser } from '@clerk/nextjs';
import { Particles } from "@/components/magicui/particles";
import Stack from "@/components/Stack";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createRoom, getUserRooms, sendEmailInvitation, inviteUsersToRoom } from "@/lib/actions";
import ShinyText from '@/components/ui/ShinyText';
import SuggestedUsers from '@/components/SuggestedUsers';
import RecentActivity from '@/components/RecentActivity';
import { AutosuggestInput } from '@/components/AutosuggestInput';
import { HeroSection } from '@/components/hero-section';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  image?: string;
  clerkId: string;
  isFollowing: boolean;
}


export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [rooms, setRooms] = useState<Array<{id: string, name: string, img: string}>>([]);
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
  const [selectedInvitees, setSelectedInvitees] = useState<(User | { email: string; type: 'email' })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeavyUI, setShowHeavyUI] = useState(false);

  // Fetch user rooms from database
  useEffect(() => {
    const fetchRooms = async () => {
      if (isLoaded && user) {
        try {
          const userRooms = await getUserRooms();
          const roomsWithImages = userRooms.map((room, index) => ({
            id: room.id,
            name: room.name,
            img: room.image_url || `https://images.unsplash.com/photo-157212036061${index + 1}-d971b9d7767c?q=80&w=500&auto=format`
          }));
          setRooms(roomsWithImages);
        } catch (error) {
          console.error('Error fetching rooms:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRooms();
  }, [isLoaded, user]);

  // Defer heavy UI until main thread is idle after Clerk loads
  useEffect(() => {
    if (!isLoaded) return;
    const schedule = (cb: () => void): number =>
      (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback 
        ? (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(cb) 
        : (setTimeout(cb, 0) as unknown) as number;
    const cancel = (id: number) =>
      (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback 
        ? (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id) 
        : clearTimeout(id);
    const id = schedule(() => setShowHeavyUI(true));
    return () => cancel(id);
  }, [isLoaded]);

  const handleCreateRoom = async () => {
    if (roomName.trim()) {
      try {
        const newRoom = await createRoom(roomName.trim());
        const roomWithImage = {
          id: newRoom.id,
          name: newRoom.name,
          img: newRoom.image_url || `https://images.unsplash.com/photo-157212036061${rooms.length + 1}-d971b9d7767c?q=80&w=500&auto=format`
        };
        setRooms([roomWithImage, ...rooms]);
        setRoomName("");
        setUsername("");
        setSelectedInvitees([]);
        
        // Send invitations to selected users
        if (selectedInvitees.length > 0) {
          console.log('Sending invitations to:', selectedInvitees);
          
          try {
            // Separate users and email invites
            const userInvites = selectedInvitees.filter(invite => 'id' in invite) as User[];
            const emailInvites = selectedInvitees.filter(invite => 'email' in invite && 'type' in invite) as { email: string; type: 'email' }[];
            
            // Invite registered users to room
            if (userInvites.length > 0) {
              const userIds = userInvites.map(user => user.id);
              const userResult = await inviteUsersToRoom(userIds, newRoom.id);
              if (userResult.success) {
                console.log(`✅ Invited ${userInvites.length} registered users to room`);
              } else {
                console.error('❌ Error inviting users:', userResult.error);
              }
            }
            
            // Send email invitations
            if (emailInvites.length > 0) {
              const emailPromises = emailInvites.map(invite => 
                sendEmailInvitation(invite.email, newRoom.id)
              );
              const emailResults = await Promise.all(emailPromises);
              
              const successfulEmails = emailResults.filter(result => result.success);
              console.log(`✅ Sent ${successfulEmails.length}/${emailInvites.length} email invitations`);
              
              // Log any email failures
              emailResults.forEach((result, index) => {
                if (!result.success) {
                  console.error(`❌ Failed to send email to ${emailInvites[index].email}:`, result.error);
                }
              });
            }
            
          } catch (error) {
            console.error('❌ Error sending invitations:', error);
          }
        }
      } catch (error) {
        console.error('Error creating room:', error);
      }
    }
  }

  const handleUserSelect = (user: User | { email: string; type: 'email' }) => {
    setSelectedInvitees(prev => [...prev, user]);
  };

  const handleUserRemove = (userToRemove: User | { email: string; type: 'email' }) => {
    setSelectedInvitees(prev => 
      prev.filter(user => {
        if ('id' in user && 'id' in userToRemove) {
          return user.id !== userToRemove.id;
        }
        if ('email' in user && 'email' in userToRemove) {
          return user.email !== userToRemove.email;
        }
        return true;
      })
    );
  };

  // Show hero section for unauthenticated users
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <HeroSection />;
  }

  return (
    <div className="w-full h-full bg-background p-4 sm:p-8">
      <ClerkLoading>
        <div className="flex items-center justify-center min-h-screen">
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[calc(100vh-2rem)]">
          {/* Left Section - Cards and Particles */}
          <div className="lg:col-span-2 flex items-start justify-start ">
            <div className="w-full h-[600px] flex items-center justify-center rounded-3xl shadow-2xl bg-card border relative overflow-hidden">
              {showHeavyUI && (
                <Particles 
                  quantity={100}
                  staticity={50}
                  ease={50}
                  size={0.4}
                  color="#ffffff"
                  vx={0}
                  vy={0}
                />
              )}
              <div className="flex flex-col items-center justify-center space-y-8 p-8 relative z-10">
                <h1 className="text-sm md:text-4xl font-bold text-foreground text-center mb-8">
                  {rooms.length > 0 ? <ShinyText 
                                          text="Your Rooms" 
                                          disabled={false} 
                                          speed={3} 
                                          className="mx-auto max-w-2xl text-balance text-lg"
                                      /> : <ShinyText 
                                      text="No Rooms Yet" 
                                      disabled={false} 
                                      speed={3} 
                                      className="mx-auto max-w-2xl text-balance text-lg"
                                  />}
                </h1>
                
                {/* Stack Component - Centered */}
                {rooms.length > 0 && showHeavyUI ? (
                  <div className="flex justify-center">
                    <Stack
                      cardsData={rooms}
                      cardDimensions={{ width: 250, height: 200 }}
                      randomRotation={true}
                      sensitivity={150}
                      sendToBackOnClick={false}
                      animationConfig={{ stiffness: 260, damping: 20 }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg mb-4">Create your first room to get started!</p>
                  </div>
                )}

                {/* Create Room Dialog */}
                <div className="mt-8">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative">
                        <Button variant="outline" size="lg" className="relative z-10">
                          Create New Room
                        </Button>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create Room</DialogTitle>
                        <DialogDescription>
                          Create a new room and invite your team to start collaborating.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="grid gap-3 mx-auto w-full">
                          <Label htmlFor="name-1" className="mt-2">Room Name</Label>
                          <Input 
                            id="name-1" 
                            name="name" 
                            placeholder="Enter room name" 
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-3 mx-auto w-full">
                          <Label htmlFor="invitees" className="mt-2">
                            Invite People (Optional)
                          </Label>
                          <AutosuggestInput
                            value={username}
                            onChange={setUsername}
                            placeholder="Search followers or enter email..."
                            selectedUsers={selectedInvitees}
                            onUserSelect={handleUserSelect}
                            onUserRemove={handleUserRemove}
                          />
                          {selectedInvitees.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {selectedInvitees.length} {selectedInvitees.length === 1 ? 'person' : 'people'} will be invited to the room
                            </p>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button type="submit" onClick={handleCreateRoom}>
                            Create Room {selectedInvitees.length > 0 && `& Invite ${selectedInvitees.length}`}
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Suggested Users and Recent Activity */}
          <div className="lg:col-span-1 space-y-6">
            {/* Suggested Collaborators */}
            <SuggestedUsers />

            <RecentActivity />
          </div>
        </div>
      </ClerkLoaded>
    </div>
  );
}
