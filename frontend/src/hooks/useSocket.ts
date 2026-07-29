import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function useSocket(onEvent: (event: string, data: unknown) => void) {
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    }

    const handler = (event: string) => (data: unknown) => cbRef.current(event, data);
    const leadNew = handler('lead:new');
    const outreachSent = handler('outreach:sent');
    const agentAction = handler('agent:action');

    socket.on('lead:new', leadNew);
    socket.on('outreach:sent', outreachSent);
    socket.on('agent:action', agentAction);

    return () => {
      socket?.off('lead:new', leadNew);
      socket?.off('outreach:sent', outreachSent);
      socket?.off('agent:action', agentAction);
    };
  }, []);
}
