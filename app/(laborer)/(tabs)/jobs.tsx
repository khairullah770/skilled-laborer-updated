import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const UPCOMING_JOBS: Job[] = [
  {
    id: '1',
    customerName: 'Khairullah khaliq',
    serviceType: 'Wiring and Rewiring',
    date: '10 Dec, Tuesday',
    time: '6:30 PM',
    address: 'Khayban e sir syed',
    status: 'accepted', // or upcoming
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: '2',
    customerName: 'John Doe',
    serviceType: 'Pipe Fitting',
    date: '12 Dec, Thursday',
    time: '2:00 PM',
    address: 'Gulshan e Iqbal',
    status: 'upcoming',
    image: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
];

const COMPLETED_JOBS: Job[] = [
  {
    id: '3',
    customerName: 'Jane Smith',
    serviceType: 'Furniture Assembly',
    date: '05 Dec, Sunday',
    time: '10:00 AM',
    address: 'DHA Phase 6',
    status: 'completed',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
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

  const data = activeTab === 'upcoming' ? UPCOMING_JOBS : COMPLETED_JOBS;

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
                Total Jobs Completed: <Text style={styles.totalCount}>{COMPLETED_JOBS.length}</Text>
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
    marginTop: 40,
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
  },
  activeTabText: {
    color: '#1F41BB',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
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
