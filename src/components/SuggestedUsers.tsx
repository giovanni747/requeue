"use client";

import { useState, useEffect } from "react";
import { getRandomUsers } from "@/lib/actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import FollowButton from "@/components/FollowButton";

interface User {
  id: string;
  name: string;
  username: string;
  image: string;
  clerkId: string;
}

export default function SuggestedUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('SuggestedUsers - Fetching users...');
        const fetchedUsers = await getRandomUsers();
        console.log('SuggestedUsers - Fetched users:', fetchedUsers);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border p-6 shadow-lg min-w-0">
        <h2 className="text-lg font-semibold text-foreground mb-4">Suggested Collaborators</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-16 rounded flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-card rounded-2xl border p-6 shadow-lg min-w-0">
        <h2 className="text-lg font-semibold text-foreground mb-4">Suggested Collaborators</h2>
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">No suggested collaborators available at the moment.</p>
          <p className="text-xs mt-2">Check back later for new collaboration opportunities!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border p-6 shadow-lg min-w-0">
      <h2 className="text-lg font-semibold text-foreground mb-4">Suggested Collaborators</h2>
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={user.image || "/avatar.png"} />
                <AvatarFallback>
                  {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{user.name || "Anonymous User"}</p>
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <FollowButton userId={user.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
