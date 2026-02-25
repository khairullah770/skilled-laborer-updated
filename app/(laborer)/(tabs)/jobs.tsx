import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';

// Dummy data types
interface Job {
  id: string;
  customerName: string;
  serviceType: string;
  date: string;
  time: string;
  address: string;
  status: 'upcoming' | 'completed' | 'in_progress' | 'accepted';
  image: string;
}

const UPCOMING_JOBS: Job[] = [];
const COMPLETED_JOBS: Job[] = [];

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [upcoming, setUpcoming] = useState<Job[]>([]);
  const [completed, setCompleted] = useState<Job[]>([]);
  const fetchJobs = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/bookings/laborer`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const mapJob = (b: any): Job => ({
          id: b._id,
          customerName: b.customer?.name || 'Customer',
          serviceType: b.service,
          date: new Date(b.scheduledAt).toLocaleDateString(),
          time: new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          address: b.location?.address || '',
          status: (b.status?.toLowerCase().replace(' ', '_') as any) || 'upcoming',
          image: b.customer?.profileImage ? `${API_URL}${b.customer.profileImage}` : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
        });
        setUpcoming((data.upcoming || []).map(mapJob));
        setCompleted((data.completed || []).map(mapJob));
      }
    } catch {}
  }, []);
  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));
  const router = useRouter();

  const renderJobItem = ({ item }: { item: Job }) => (
    <View style={styles.jobCard}>
      <Image source={{ uri: item.image }} style={styles.avatar} />
      <View style={styles.jobInfo}>
        <Text style={styles.serviceType}>{item.serviceType}</Text>
        <Text style={styles.dateTime}>{item.date}</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/(laborer)/job-details/[id]', params: { id: item.id } })}>
          <Text style={styles.viewJobText}>View job</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const data = activeTab === 'upcoming' ? upcoming : completed;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>completed</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          activeTab === 'completed' ? (
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>
                Total Jobs Completed: <Text style={styles.totalCount}>{completed.length}</Text>
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {activeTab} jobs found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  totalContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalCount: {
    color: '#1F41BB',
    fontWeight: 'bold',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1F41BB',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    paddingHorizontal: 4, // Prevent clipping
  },
  activeTabText: {
    color: '#1F41BB',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  jobCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FE', // Light blue background from image
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#ccc',
  },
  jobInfo: {
    flex: 1,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
    fontWeight: '500',
  },
  viewJobText: {
    fontSize: 14,
    color: '#1F41BB',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
