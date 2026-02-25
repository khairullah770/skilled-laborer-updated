import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../../constants/Api';

type Booking = any;

type BookingsContextType = {
  upcoming: Booking[];
  past: Booking[];
  loading: boolean;
  refreshing: boolean;
  lastError?: string | null;
  refresh: () => Promise<void>;
  addUpcoming: (b: Booking) => void;
  clear: () => void;
};

const BookingsContext = createContext<BookingsContextType>({
  upcoming: [],
  past: [],
  loading: false,
  refreshing: false,
  lastError: null,
  refresh: async () => {},
  addUpcoming: () => {},
  clear: () => {}
});

export const BookingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('bookingsCache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.upcoming)) setUpcoming(parsed.upcoming);
          if (Array.isArray(parsed.past)) setPast(parsed.past);
        }
      } catch {}
    };
    loadCache();
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    let controller: AbortController | undefined;
    let timeoutId: any;
    try {
      if (typeof AbortController !== 'undefined') {
        controller = new AbortController();
        timeoutId = setTimeout(() => {
          controller?.abort();
        }, 10000);
      }
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/bookings/my`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        ...(controller ? { signal: controller.signal } : {})
      });
      if (res.ok) {
        const data = await res.json();
        const nextUpcoming = sortByDateAsc(data.upcoming || []);
        const nextPast = (data.past || []).sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        setUpcoming(nextUpcoming);
        setPast(nextPast);
        setLastError(null);
        try {
          await AsyncStorage.setItem('bookingsCache', JSON.stringify({
            upcoming: nextUpcoming,
            past: nextPast,
            cachedAt: new Date().toISOString()
          }));
        } catch {}
      } else {
        const txt = await res.text();
        console.log('Bookings refresh failed', txt);
        setLastError('Failed to load bookings. Pull to refresh to try again.');
        try {
          const cached = await AsyncStorage.getItem('bookingsCache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed.upcoming)) setUpcoming(parsed.upcoming);
            if (Array.isArray(parsed.past)) setPast(parsed.past);
          }
        } catch {}
      }
    } catch (e: any) {
      console.log('Bookings refresh error', e);
      if (e?.name === 'AbortError') {
        setLastError('Request timed out while loading bookings.');
      } else {
        setLastError('Network error while loading bookings.');
      }
      try {
        const cached = await AsyncStorage.getItem('bookingsCache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.upcoming)) setUpcoming(parsed.upcoming);
          if (Array.isArray(parsed.past)) setPast(parsed.past);
        }
      } catch {}
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  const addUpcoming = (b: Booking) => {
    console.log('Adding booking to upcoming', b?._id, b?.scheduledAt);
    setUpcoming(prev => insertSorted(prev, b));
  };

  const clear = () => {
    setUpcoming([]);
    setPast([]);
  };

  const value = useMemo(() => ({
    upcoming,
    past,
    loading,
    refreshing,
    lastError,
    refresh,
    addUpcoming,
    clear
  }), [upcoming, past, loading, refreshing, lastError]);

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => useContext(BookingsContext);

function sortByDateAsc(list: Booking[]) {
  return [...list].sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}
function insertSorted(list: Booking[], b: Booking) {
  const arr = [...list, b];
  return sortByDateAsc(arr);
}
