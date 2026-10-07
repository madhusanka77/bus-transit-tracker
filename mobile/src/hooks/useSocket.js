import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

/** Maintains a single Socket.io connection for the given server URL. */
export default function useSocket(serverUrl) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!serverUrl) return undefined;

    const s = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 8000,
    });

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onDisconnect);
    setSocket(s);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onDisconnect);
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [serverUrl]);

  return { socket, connected };
}
