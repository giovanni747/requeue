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
    ? 'absolute bottom-0 right-0 size-2 bg-green-500 rounded-full ring-2 ring-zinc-900'
    : 'absolute bottom-0 right-0 size-2 bg-transparent rounded-full ring-2 ring-zinc-900/60';

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className="relative">
        <Users className="h-3 w-3 text-green-500" />
        <div className={dotClass}>
          {connected && (
            <div className="absolute inset-0 bg-green-500 rounded-full animate-slow-pulse"></div>
          )}
        </div>
      </div>
      <span className={connected ? 'text-green-500 font-medium' : 'text-white/70'}>{onlineCount}</span>
    </div>
  );
}
