'use client';

import { useSocket } from '@/contexts/SocketContext';

export default function SocketStatus() {
  const { connected } = useSocket();

  const dotClass = connected
    ? 'absolute bottom-0 right-0 size-2 bg-green-500 rounded-full ring-2 ring-zinc-900'
    : 'absolute bottom-0 right-0 size-2 bg-transparent rounded-full ring-2 ring-zinc-900/60';

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`}>
          <div className={dotClass}>
            {connected && (
              <div className="absolute inset-0 bg-green-500 rounded-full animate-slow-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
