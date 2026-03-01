import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../constants/Api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  totalUnread: number;
  refreshUnread: () => void;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  totalUnread: 0,
  refreshUnread: () => {},
  reconnect: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const res = await fetch(`${API_URL}/api/chat/my-chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const chats = await res.json();
        const userDataStr = await AsyncStorage.getItem('userData');
        const role = userDataStr ? JSON.parse(userDataStr).role : null;
        let count = 0;
        for (const chat of chats) {
          count += role === 'customer' ? (chat.unreadCustomer || 0) : (chat.unreadLaborer || 0);
        }
        if (mountedRef.current) setTotalUnread(count);
      }
    } catch {}
  }, []);

  const connectSocket = useCallback(async () => {
    // Already connected — just refresh unread counts
    if (socketRef.current?.connected) {
      refreshUnread();
      return;
    }

    const token = await AsyncStorage.getItem('userToken');
    if (!token) return;

    // Disconnect stale socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const s = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      if (mountedRef.current) setIsConnected(true);
      console.log('Socket.IO connected');
    });

    s.on('disconnect', () => {
      if (mountedRef.current) setIsConnected(false);
      console.log('Socket.IO disconnected');
    });

    s.on('chatUpdate', () => {
      // A new message came in on some chat — refresh unread count
      if (mountedRef.current) refreshUnread();
    });

    socketRef.current = s;
    if (mountedRef.current) refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    mountedRef.current = true;
    connectSocket();

    return () => {
      mountedRef.current = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, totalUnread, refreshUnread, reconnect: connectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};
