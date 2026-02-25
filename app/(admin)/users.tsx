import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../constants/Api';

type Laborer = {
  _id: string;
  name: string;
  email?: string;
  role: 'laborer' | 'customer' | 'admin';
  status?: string;
  profileImage?: string;
  updatedAt?: string;
};

type Customer = {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  status?: string;
  createdAt?: string;
};

export default function AdminUsers() {
  const [tab, setTab] = useState<'laborers' | 'customers'>('laborers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [laborers, setLaborers] = useState<Laborer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      if (tab === 'laborers') {
        const url = `${API_URL}/api/users?role=laborer`;
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('Admin access required. Please sign in with an admin account.');
          }
          throw new Error(data.message || `Failed to load laborers (${res.status})`);
        }
        setLaborers(data);
      } else {
        const url = `${API_URL}/api/customers`;
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('Admin access required. Please sign in with an admin account.');
          }
          throw new Error(data.message || `Failed to load customers (${res.status})`);
        }
        setCustomers(data);
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLaborers = laborers.filter((u) => {
    const q = query.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });
  const filteredCustomers = customers.filter((c) => {
    const q = query.toLowerCase();
    const fullName = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim();
    return (
      fullName.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const renderLaborer = ({ item }: { item: Laborer }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        {item.profileImage ? (
          <Image source={{ uri: `${API_URL}${item.profileImage}` }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={48} color="#9CA3AF" />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.sub}>{item.email || '—'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'approved' ? '#DCFCE7' : item.status === 'pending' ? '#FEF3C7' : '#E5E7EB' }]}>
          <Text style={[styles.statusText, { color: item.status === 'approved' ? '#166534' : item.status === 'pending' ? '#D97706' : '#374151' }]}>{item.status || '—'}</Text>
        </View>
      </View>
    </View>
  );

  const renderCustomer = ({ item }: { item: Customer }) => {
    const fullName = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Customer';
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          {item.profileImage ? (
            <Image source={{ uri: `${API_URL}${item.profileImage}` }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={48} color="#9CA3AF" />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.sub}>{item.email || item.phone || '—'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#DCFCE7' : '#E5E7EB' }]}>
            <Text style={[styles.statusText, { color: item.status === 'active' ? '#166534' : '#374151' }]}>{item.status || '—'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'laborers' && styles.segmentBtnActive]}
            onPress={() => setTab('laborers')}
            accessibilityRole="button"
            accessibilityLabel="Show laborers"
          >
            <Text style={[styles.segmentText, tab === 'laborers' && styles.segmentTextActive]}>Laborers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'customers' && styles.segmentBtnActive]}
            onPress={() => setTab('customers')}
            accessibilityRole="button"
            accessibilityLabel="Show customers"
          >
            <Text style={[styles.segmentText, tab === 'customers' && styles.segmentTextActive]}>Customers</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, email, or phone"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1F41BB" style={{ marginTop: 20 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tab === 'laborers' ? (
        <FlatList
          data={filteredLaborers}
          keyExtractor={(item) => item._id}
          renderItem={renderLaborer}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No laborers found.</Text>}
        />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item._id}
          renderItem={renderCustomer}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No customers found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  segmentBtn: {
    paddingVertical: Platform.select({ ios: 8, android: 8, default: 6 }),
    paddingHorizontal: 14,
  },
  segmentBtnActive: {
    backgroundColor: '#1F41BB',
  },
  segmentText: { color: '#374151', fontWeight: '600' },
  segmentTextActive: { color: '#FFF' },
  searchBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#111827' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  errorBox: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: '#B91C1C', flex: 1 },
  retryBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#1F41BB', borderRadius: 8 },
  retryText: { color: '#FFF', fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 24, color: '#6B7280' },
});
