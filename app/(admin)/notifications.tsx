import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../constants/Api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${API_URL}/api/users/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            setNotifications(data);
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  const onRefresh = () => {
      setRefreshing(true);
      fetchNotifications();
  };

  const renderItem = ({ item }: any) => (
    <View style={[styles.card, !item.isRead && styles.unreadCard]}>
        <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={24} color="#1F41BB" />
        </View>
        <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Notifications</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#1F41BB" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item: any) => item._id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No notifications</Text>
                </View>
            }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', margin: 20, color: '#1F41BB' },
  list: { padding: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  unreadCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#1F41BB'
  },
  iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#EBF4FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  message: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  time: { fontSize: 12, color: '#9CA3AF' },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#6B7280', fontSize: 16 }
});
