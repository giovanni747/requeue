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
import { createRoom, getUserRooms } from "@/lib/actions";
import ShinyText from '@/components/ui/ShinyText';
import SuggestedUsers from '@/components/SuggestedUsers';
import RecentActivity from '@/components/RecentActivity';

export default function WelcomePage() {
  const { user, isLoaded } = useUser();
  const [rooms, setRooms] = useState<Array<{id: string, name: string, img: string}>>([]);
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
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
    const schedule = (cb: () => void) =>
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb) : setTimeout(cb, 0);
    const cancel = (id: any) =>
      (window as any).cancelIdleCallback ? (window as any).cancelIdleCallback(id) : clearTimeout(id);
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
      } catch (error) {
        console.error('Error creating room:', error);
      }
    }
  };

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
                      sendToBackOnClick={true}
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
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create Room</DialogTitle>
                        <DialogDescription>
                          Create a new room to start collaborating with your team.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="grid gap-3 mx-auto w-3/4">
                          <Label htmlFor="name-1" className="mt-2">Room Name</Label>
                          <Input 
                            id="name-1" 
                            name="name" 
                            placeholder="Enter room name" 
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-3 mx-auto w-3/4">
                          <Label htmlFor="username-1" className="mt-2">Username</Label>
                          <Input 
                            id="username-1" 
                            name="username" 
                            placeholder="Your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button type="submit" onClick={handleCreateRoom}>
                            Create Room
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