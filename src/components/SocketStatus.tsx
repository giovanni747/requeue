'use client';

import { useSocket } from '@/contexts/SocketContext';
import { usePathname } from 'next/navigation';
import { Users } from 'lucide-react';

export default function SocketStatus() {
  const { connected, currentRoomUsers, onlineUsers } = useSocket();
  const pathname = usePathname();

  const isInRoom = pathname.startsWith('/room/');
  const onlineCount = isInRoom ? currentRoomUsers.length : onlineUsers.length;
  const dotClass = connected
    ? 'absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse'
    : 'absolute -top-1 -right-1 w-2 h-2 bg-transparent rounded-full border border-white/60';

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className="relative">
        <Users className="h-3 w-3 text-green-500" />
        <div className={dotClass} />
      </div>
      <span className={connected ? 'text-green-500 font-medium' : 'text-white/70'}>{onlineCount}</span>
    </div>
  );
}
