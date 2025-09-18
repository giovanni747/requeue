"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { toggleFollow } from "@/lib/actions";

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
}

export default function FollowButton({ userId, initialFollowing = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const result = await toggleFollow(userId);
      if (result.success) {
        // Let the spinner complete before updating state
        setTimeout(() => {
          setIsFollowing(!isFollowing);
          toast.success(result.action === 'followed' ? "User followed successfully" : "User unfollowed successfully", {
            duration: 3000,
            position: "top-center",
            style: {
              background: "#1f2937",
              color: "#f9fafb",
              border: "1px solid #374151",
            },
          });
        }, 500); // Wait for spinner to complete
      } else {
        toast.error(result.error || "Error following user", {
          duration: 3000,
          position: "top-center",
          style: {
            background: "#dc2626",
            color: "#f9fafb",
            border: "1px solid #b91c1c",
          },
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error("Error following user", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#dc2626",
          color: "#f9fafb",
          border: "1px solid #b91c1c",
        },
      });
    } finally {
      // Keep loading state for the full duration
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <Button
      size="sm"
      variant={isFollowing ? "default" : "outline"}
      onClick={handleFollow}
      disabled={isLoading}
      className={`w-20 transition-all duration-200 ${
        isFollowing 
          ? "bg-foreground text-background hover:bg-foreground/90" 
          : "bg-background text-foreground border-foreground hover:bg-foreground hover:text-background"
      }`}
    >
      {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : (isFollowing ? "Following" : "Follow")}
    </Button>
  );
}
