import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../constants/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        // Fetch all users to calculate stats
        const response = await fetch(`${API_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const users = await response.json();
        
        const laborers = users.filter((u: any) => u.role === 'laborer');
        setStats({
            pending: laborers.filter((u: any) => u.status === 'pending').length,
            approved: laborers.filter((u: any) => u.status === 'approved').length,
            total: laborers.length
        });
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const StatCard = ({ title, value, color, icon }: any) => (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.cardValue, { color }]}>{value}</Text>
      </View>
      <Ionicons name={icon} size={32} color={color} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/laborer-login')}>
            <Ionicons name="log-out-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1F41BB" />
      ) : (
        <View style={styles.content}>
          <StatCard 
            title="Pending Verifications" 
            value={stats.pending} 
            color="#F59E0B" 
            icon="time-outline"
          />
          <StatCard 
            title="Approved Laborers" 
            value={stats.approved} 
            color="#10B981" 
            icon="checkmark-circle-outline"
          />
          <StatCard 
            title="Total Laborers" 
            value={stats.total} 
            color="#1F41BB" 
            icon="people-outline"
          />

            <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(admin)/verifications')}
            >
                <Text style={styles.actionButtonText}>Review Pending Requests</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
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
    backgroundColor: '#FFF' 
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F41BB' },
  content: { padding: 20 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  cardTitle: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  actionButton: {
      marginTop: 20,
      backgroundColor: '#1F41BB',
      padding: 16,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8
  },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});
