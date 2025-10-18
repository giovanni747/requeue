"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  markNotificationsAsRead, 
  acceptRoomInvitation, 
  declineRoomInvitation,
  getFollowers,
  getFollowing,
  acceptFollowRequest,
  declineFollowRequest,
  toggleFollow,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "@/lib/actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AnimatedList from "@/components/ui/AnimatedList";
import { AnimatedListNotifications } from "@/components/ui/animated-list-notifications";
import { 
  Bell, 
  UserPlus, 
  Users, 
  Check, 
  X, 
  Loader2,
  Heart,
  Star,
  MessageCircle,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  UserMinus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { useSocket } from "@/contexts/SocketContext";

type UserNotifications = Awaited<ReturnType<typeof getUserNotifications>>;
type Notification = UserNotifications[number];
type Followers = Awaited<ReturnType<typeof getFollowers>>;
type Following = Awaited<ReturnType<typeof getFollowing>>;

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "ROOM_INVITATION":
      return <Users className="size-5 text-blue-500" />;
    case "FOLLOW":
      return <UserPlus className="size-5 text-green-500" />;
    case "TASK_ASSIGNED":
      return <Calendar className="size-5 text-purple-500" />;
    case "TASK_COMPLETED":
      return <Check className="size-5 text-emerald-500" />;
    case "COMMENT":
      return <MessageCircle className="size-5 text-orange-500" />;
    case "LIKE":
      return <Heart className="size-5 text-red-500" />;
    case "mention":
      return <MessageCircle className="size-5 text-cyan-500" />;
    default:
      return <Bell className="size-5 text-gray-500" />;
  }
};

const getNotificationMessage = (notification: Notification) => {
  switch (notification.type) {
    case "ROOM_INVITATION":
      const roomName = notification.metadata?.roomName || 'a room';
      return `invited you to join "${roomName}"`;
    case "FOLLOW":
      return "started following you";
    case "TASK_ASSIGNED":
      return "assigned you a task";
    case "TASK_COMPLETED":
      return "completed a task";
    case "COMMENT":
      return "commented on your post";
    case "LIKE":
      return "liked your post";
    case "mention":
      return "mentioned you";
    default:
      return "sent you a notification";
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "ROOM_INVITATION":
      return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800";
    case "FOLLOW":
      return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800";
    case "TASK_ASSIGNED":
      return "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800";
    case "TASK_COMPLETED":
      return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800";
    case "COMMENT":
      return "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800";
    case "LIKE":
      return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800";
    case "mention":
      return "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-800";
    default:
      return "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800";
  }
};

// Individual Skeleton Components
const NotificationsListSkeleton = () => (
  <Card className="shadow-lg">
    <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="max-h-[calc(100vh-20rem)] overflow-y-auto p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-4 p-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-3 w-32" />
              <div className="flex items-center gap-2 mt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const FollowersSkeleton = () => (
  <Card className="shadow-lg">
    <CardHeader className="border-b">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-5 w-8" />
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="max-h-[240px] overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const FollowingSkeleton = () => (
  <Card className="shadow-lg">
    <CardHeader className="border-b">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-5 w-8" />
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="max-h-[240px] overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function NotificationsPage() {
  const router = useRouter();
  const { socket, connected, emitNotification, emitUserFollowed, emitUserUnfollowed } = useSocket();
  const [notifications, setNotifications] = useState<UserNotifications>([]);
  const [followers, setFollowers] = useState<Followers>([]);
  const [following, setFollowing] = useState<Following>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  const [processingInvitationAction, setProcessingInvitationAction] = useState<{id: string, action: 'accept' | 'decline'} | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingFollowId, setProcessingFollowId] = useState<string | null>(null);
  const [processingFollowAction, setProcessingFollowAction] = useState<{id: string, action: 'accept' | 'decline'} | null>(null);
  const [unfollowDialogOpen, setUnfollowDialogOpen] = useState(false);
  const [userToUnfollow, setUserToUnfollow] = useState<Following[0] | null>(null);

  // Derived: pending follow requests (typed as any to tolerate optional fields)
  const pendingFollowers = (followers as any[]).filter((f: any) => (
    f && (f.requestStatus === 'pending' || f.isPending === true)
  ));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifData, followersData, followingData] = await Promise.all([
          getUserNotifications(),
          getFollowers(),
          getFollowing()
        ]);
        
        setNotifications(notifData);
        setFollowers(followersData);
        setFollowing(followingData);
        
        // Count unread notifications
        const unreadNotifications = notifData.filter(notification => !notification.read);
        setUnreadCount(unreadNotifications.length);
        
        // Auto-mark as read when viewing
        const unreadIds = unreadNotifications.map(notification => notification.id);
        if (unreadIds.length > 0) {
          await markNotificationsAsRead(unreadIds);
          // Update local state to reflect read status
          setNotifications(prev => 
            prev.map(notif => 
              unreadIds.includes(notif.id) 
                ? { ...notif, read: true }
                : notif
            )
          );
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // WebSocket event listeners for real-time notifications
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewNotification = (data: any) => {
      console.log('🔌 Received notification:new event:', data);
      
      // Add new notification to local state and sort by creation date
      setNotifications(prev => 
        [data.notification, ...prev]
          .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          })
      );
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast.success(data.notification.message || 'New notification received');
    };

    const handleUserFollowed = (data: any) => {
      console.log('🔌 Received user:followed event:', data);
      
      // Add to followers list
      setFollowers(prev => [...prev, data.follower]);
    };

    const handleUserUnfollowed = (data: any) => {
      console.log('🔌 Received user:unfollowed event:', data);
      
      // Remove from followers list
      setFollowers(prev => prev.filter(follower => follower.id !== data.unfollowerId));
      
      // Show toast notification
      toast(`${data.unfollowerName} stopped following you`);
    };

    // Register event listeners
    socket.on('notification:new', handleNewNotification);
    socket.on('user:followed', handleUserFollowed);
    socket.on('user:unfollowed', handleUserUnfollowed);

    // Cleanup function
    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('user:followed', handleUserFollowed);
      socket.off('user:unfollowed', handleUserUnfollowed);
    };
  }, [socket, connected]);

  const handleAcceptInvitation = async (invitationId: string, notificationId: string) => {
    setProcessingInvitationAction({id: invitationId, action: 'accept'});
    try {
      const result = await acceptRoomInvitation(invitationId);
      if (result.success) {
        toast.success("Invitation accepted! Redirecting to room...");
        // Update notification status locally
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, invitationStatus: 'accepted' } 
              : n
          )
        );
        // Refresh data so the new room appears in the rooms list
        try { router.refresh(); } catch {}
        setTimeout(() => {
          router.push(`/room/${result.roomId}`);
        }, 1000);
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setProcessingInvitationAction(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string, notificationId: string) => {
    setProcessingInvitationAction({id: invitationId, action: 'decline'});
    try {
      const result = await declineRoomInvitation(invitationId);
      if (result.success) {
        toast.success("Invitation declined");
        // Update notification status locally
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, invitationStatus: 'declined' } 
              : n
          )
        );
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Failed to decline invitation");
    } finally {
      setProcessingInvitationAction(null);
    }
  };

  // Handle follow request actions
  const handleAcceptFollower = async (followerId: string) => {
    try {
      setProcessingFollowAction({id: followerId, action: 'accept'});
      
      // Call server action to accept follow request
      const result = await acceptFollowRequest(followerId);
      
      if (result.success) {
        // Reload followers data from server to get updated status
        const updatedFollowers = await getFollowers();
        setFollowers(updatedFollowers);

        // Emit WebSocket event for real-time updates
        emitUserFollowed({
          targetUserId: followerId,
          follower: { id: followerId, name: 'User' } // Basic follower data
        });
        
        toast.success('Follow request accepted');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to accept follow request');
    } finally {
      setProcessingFollowAction(null);
    }
  };

  const handleDeclineFollower = async (followerId: string) => {
    try {
      setProcessingFollowAction({id: followerId, action: 'decline'});
      
      // Call server action to decline follow request
      const result = await declineFollowRequest(followerId);
      
      if (result.success) {
        // Reload followers data from server to remove declined follower
        const updatedFollowers = await getFollowers();
        setFollowers(updatedFollowers);
        
        toast.success('Follow request declined');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to decline follow request');
    } finally {
      setProcessingFollowAction(null);
    }
  };

  const handleUnfollowUser = async () => {
    if (!userToUnfollow) return;
    
    try {
      setProcessingFollowId(userToUnfollow.id);
      
      // Call server action to unfollow
      const result = await toggleFollow(userToUnfollow.id);
      
      if (result.success && result.action === 'unfollowed') {
        // Update following list in real-time (remove the user immediately)
        setFollowing(prevFollowing => 
          prevFollowing.filter(user => user.id !== userToUnfollow.id)
        );

        // Emit WebSocket event for real-time updates
        emitUserUnfollowed({
          targetUserId: userToUnfollow.id,
          unfollowerId: userToUnfollow.id, // This would be the current user's ID
          unfollowerName: userToUnfollow.name || userToUnfollow.username
        });
        
        toast.success(`Unfollowed ${userToUnfollow.name || userToUnfollow.username}`);
        setUnfollowDialogOpen(false);
        setUserToUnfollow(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to unfollow user');
    } finally {
      setProcessingFollowId(null);
    }
  };

  const openUnfollowDialog = (user: Following[0]) => {
    setUserToUnfollow(user);
    setUnfollowDialogOpen(true);
  };

  // Don't return early - show skeletons in each section

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <h1 className="text-xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        <div className="space-y-6">
          {/* Desktop Header */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Bell className="h-8 w-8" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount} unread
                    </Badge>
                  )}
                </h1>
                <p className="text-muted-foreground mt-2">
                  Stay updated with room invitations and followers
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Notifications */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Activity
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                          {unreadCount} unread
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {notifications.length} total
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <NotificationsListSkeleton />
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
                      <p className="text-sm">You'll see notifications here when someone invites you to a room or follows you.</p>
                    </div>
                  ) : (
                    <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
                      <AnimatedListNotifications delay={200} className="p-4">
                        {notifications
                          .sort((a, b) => {
                            const dateA = new Date(a.createdAt);
                            const dateB = new Date(b.createdAt);
                            return dateB.getTime() - dateA.getTime();
                          })
                          .map((notification, index) => (
                        <div
                          key={notification.id}
                          className={`group relative flex items-start gap-4 p-4 border-b hover:bg-muted/25 transition-all duration-200 ${
                            !notification.read 
                              ? "bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-l-primary" 
                              : "hover:bg-muted/10"
                          } ${getNotificationColor(notification.type)}`}
                        >
                          {/* Unread indicator */}
                          {!notification.read && (
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                          )}
                          
                          <Avatar className="mt-1 ring-2 ring-background shadow-sm">
                            <AvatarImage src={notification.creator.image || "/avatar.png"} />
                            <AvatarFallback className="font-semibold">
                              {(notification.creator.name || notification.creator.email || 'U')?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* For mention notifications, use title and message from database */}
                                {notification.type === "mention" ? (
                                  <>
                                    <p className="text-sm leading-relaxed">
                                      <span className="text-foreground">
                                        {notification.title || `${notification.creator?.name || 'Someone'} mentioned you`}
                                      </span>
                                    </p>
                                    {notification.message && (
                                      <div className="mt-2 p-3 bg-muted/30 rounded-lg border">
                                        <div className="flex items-start gap-2">
                                          <MessageCircle className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1">
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                              "{notification.message}"
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-sm leading-relaxed">
                                    <span className="font-semibold text-foreground">
                                      {notification.creator?.name || notification.creator?.email?.split('@')[0] || 'Unknown User'}
                                    </span>{" "}
                                    <span className="text-muted-foreground">
                                      {getNotificationMessage(notification)}
                                    </span>
                                  </p>
                                )}
                                
                                {/* Rich content for different notification types */}
                                {notification.type === "ROOM_INVITATION" && notification.metadata?.roomName && (
                                  <div className="mt-2 p-3 bg-muted/30 rounded-lg border">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-blue-500" />
                                      <span className="font-medium text-sm">{notification.metadata.roomName}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action buttons for room invitations */}
                            {notification.type === "ROOM_INVITATION" && 
                             (notification.metadata?.invitationStatus !== "accepted" && notification.metadata?.invitationStatus !== "declined") && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptInvitation(
                                    notification.metadata?.invitationId!,
                                    notification.id
                                  )}
                                  disabled={processingInvitationAction?.id === notification.metadata?.invitationId}
                                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                >
                                  {processingInvitationAction?.id === notification.metadata?.invitationId && processingInvitationAction?.action === 'accept' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeclineInvitation(
                                    notification.metadata?.invitationId!,
                                    notification.id
                                  )}
                                  disabled={processingInvitationAction?.id === notification.metadata?.invitationId}
                                  className="hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  {processingInvitationAction?.id === notification.metadata?.invitationId && processingInvitationAction?.action === 'decline' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="h-4 w-4 mr-1" />
                                      Decline
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}

                            {/* Action buttons for follow requests (in activity list) */}
                            {notification.type === "FOLLOW" && (
                              (() => {
                                const follower = followers.find((f: any) => f.id === notification.creator.id);
                                const anyFollower: any = follower as any;
                                const isPending = anyFollower && (anyFollower.requestStatus === 'pending' || anyFollower.isPending === true);
                                const isAccepted = anyFollower && anyFollower.requestStatus === 'accepted';
                                
                                // Don't show buttons if already accepted or if not in followers list
                                if (!follower || isAccepted) return null;
                                
                                // Only show controls if explicitly pending
                                if (!isPending) return null;
                                
                                return (
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      onClick={() => handleAcceptFollower(notification.creator.id as any)}
                                      disabled={processingFollowAction?.id === (notification.creator.id as any)}
                                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                    >
                                      {processingFollowAction?.id === (notification.creator.id as any) && processingFollowAction?.action === 'accept' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Check className="h-4 w-4 mr-1" />
                                          Accept
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeclineFollower(notification.creator.id as any)}
                                      disabled={processingFollowAction?.id === (notification.creator.id as any)}
                                      className="hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                      {processingFollowAction?.id === (notification.creator.id as any) && processingFollowAction?.action === 'decline' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <X className="h-4 w-4 mr-1" />
                                          Decline
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })()
                            )}

                            {/* Status badges */}
                            {notification.metadata?.invitationStatus === "accepted" && (
                              <Badge variant="default" className="bg-green-600 text-white">
                                <Check className="h-3 w-3 mr-1" />
                                Accepted
                              </Badge>
                            )}

                            {notification.metadata?.invitationStatus === "declined" && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                <X className="h-3 w-3 mr-1" />
                                Declined
                              </Badge>
                            )}

                            {/* Time stamp */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                        ))}
                      </AnimatedListNotifications>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar - Follow Requests, Followers & Following */}
            <motion.div
              className="space-y-6 h-fit lg:sticky lg:top-6 lg:self-start"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              {/* Follow Requests */}
              {pendingFollowers.length > 0 && (
                <Card className="shadow-lg flex flex-col">
                  <CardHeader className="border-b flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">Follow Requests</span>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {followers.filter((f: any) => f?.requestStatus === 'pending' || f?.isPending).length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 -mt-2 flex-1 overflow-hidden">
                    <AnimatedList
                      className="w-full -mt-1 max-h-48 overflow-y-auto"
                      showGradients={true}
                      enableArrowNavigation={false}
                      displayScrollbar={true}
                    >
                      {pendingFollowers.map((follower: any) => (
                        <div
                          key={`req-${follower.id}`}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors w-full"
                        >
                          <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                            <AvatarImage src={follower.image || "/avatar.png"} />
                            <AvatarFallback className="font-semibold">
                              {follower.name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{follower.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{follower.username || follower.email?.split('@')[0] || 'user'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="default" disabled={processingFollowAction?.id === follower.id} onClick={() => handleAcceptFollower(follower.id)}>
                              {processingFollowAction?.id === follower.id && processingFollowAction?.action === 'accept' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button size="sm" variant="outline" disabled={processingFollowAction?.id === follower.id} onClick={() => handleDeclineFollower(follower.id)}>
                              {processingFollowAction?.id === follower.id && processingFollowAction?.action === 'decline' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </AnimatedList>
                  </CardContent>
                </Card>
              )}
              {/* Followers */}
              <Card className="shadow-lg flex flex-col">
                <CardHeader className="border-b flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">Followers</span>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {followers.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 -mt-2 flex-1 overflow-hidden">
                  {isLoading ? (
                    <FollowersSkeleton />
                  ) : followers.length === 0 ? (
                    <div className="text-center py-6 px-4">
                      <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No followers yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Share your profile to get followers!</p>
                    </div>
                  ) : (
                    <AnimatedList
                      className="w-full -mt-1 max-h-48 overflow-y-auto"
                      showGradients={true}
                      enableArrowNavigation={false}
                      displayScrollbar={true}
                      onItemSelect={(item, index) => {
                        const follower = followers[index];
                        if (follower) {
                          console.log('Selected follower:', follower);
                        }
                      }}
                    >
                        {followers.map((follower, index) => (
                        <div
                          key={follower.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors w-full"
                        >
                          <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                            <AvatarImage src={follower.image || "/avatar.png"} />
                            <AvatarFallback className="font-semibold">
                              {follower.name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{follower.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{follower.username || follower.email?.split('@')[0] || 'user'}
                            </p>
                          </div>
                        </div>
                        ))}
                    </AnimatedList>
                  )}
                </CardContent>
              </Card>

              {/* Following */}
              <Card className="shadow-lg flex flex-col">
                <CardHeader className="border-b flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">Following</span>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {following.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 -mt-2 flex-1 overflow-hidden">
                  {isLoading ? (
                    <FollowingSkeleton />
                  ) : following.length === 0 ? (
                    <div className="text-center py-6 px-4">
                      <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Not following anyone yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Discover people to follow!</p>
                    </div>
                  ) : (
                    <AnimatedList
                      className="w-full -mt-1 max-h-48 overflow-y-auto"
                      showGradients={true}
                      enableArrowNavigation={false}
                      displayScrollbar={true}
                      onItemSelect={(item, index) => {
                        const user = following[index];
                        if (user) {
                          openUnfollowDialog(user);
                        }
                      }}
                    >
                        {following.map((user, index) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors w-full cursor-pointer"
                          onClick={() => openUnfollowDialog(user)}
                        >
                          <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                            <AvatarImage src={user.image || "/avatar.png"} />
                            <AvatarFallback className="font-semibold">
                              {user.name?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{user.username || user.email?.split('@')[0] || 'user'}
                            </p>
                          </div>
                        </div>
                        ))}
                    </AnimatedList>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Unfollow Modal */}
      {unfollowDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setUnfollowDialogOpen(false);
              setUserToUnfollow(null);
            }}
          />
          
          {/* Modal Content */}
          <div className="relative bg-background border rounded-lg shadow-lg max-w-md w-full mx-4">
            {/* Header */}
            <div className="border-b p-4">
              <div className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold">Unfollow User</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Are you sure you want to unfollow {userToUnfollow?.name || userToUnfollow?.username || 'this user'}? 
                You will no longer see their updates.
              </p>
            </div>
            
            {/* User Info */}
            {userToUnfollow && (
              <div className="p-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                    <AvatarImage src={userToUnfollow.image || "/avatar.png"} />
                    <AvatarFallback className="font-semibold">
                      {userToUnfollow.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{userToUnfollow.name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{userToUnfollow.username || userToUnfollow.email?.split('@')[0] || 'user'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t p-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUnfollowDialogOpen(false);
                  setUserToUnfollow(null);
                }}
                disabled={processingFollowId === userToUnfollow?.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnfollowUser}
                disabled={processingFollowId === userToUnfollow?.id}
              >
                {processingFollowId === userToUnfollow?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Unfollowing...
                  </>
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unfollow
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
