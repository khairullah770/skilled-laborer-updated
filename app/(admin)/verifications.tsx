import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../constants/Api';

export default function AdminVerifications() {
  const router = useRouter();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        // Fetch users with status 'pending'
        const response = await fetch(`${API_URL}/api/users?status=pending&role=laborer`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setVerifications(data);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
                {item.profileImage ? (
                    <Image source={{ uri: `${API_URL}${item.profileImage}` }} style={styles.avatar} />
                ) : (
                    <Ionicons name="person-circle-outline" size={50} color="#ccc" />
                )}
            </View>
            <View>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userDate}>Submitted: {new Date(item.updatedAt).toLocaleDateString()}</Text>
            </View>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.badge}>
            <Text style={styles.badgeText}>Pending Review</Text>
        </View>
        <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => router.push(`/(admin)/verification-details/${item._id}`)}
        >
            <Text style={styles.detailsButtonText}>View Details</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Verifications</Text>
        <TouchableOpacity onPress={fetchVerifications}>
            <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1F41BB" />
      ) : (
        <FlatList
          data={verifications}
          renderItem={renderItem}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
                <Text style={styles.emptyText}>All caught up!</Text>
                <Text style={styles.emptySubtext}>No pending verifications found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  userName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  userEmail: { fontSize: 14, color: '#6B7280' },
  userDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#D97706', fontSize: 12, fontWeight: '600' },
  detailsButton: {
    backgroundColor: '#1F41BB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});
