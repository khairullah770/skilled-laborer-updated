import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';
import Colors from '../../../constants/Colors';
import { useTheme } from '../../../context/ThemeContext';

export default function HomeScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const computeDisplayName = (u: any) => {
    try {
      const raw = (u?.name ?? '').toString().trim();
      if (raw.length > 0) {
        const first = raw.split(/\s+/)[0];
        return first.length > 0 ? first : 'Laborer';
      }
      const email = (u?.email ?? '').toString();
      if (email.includes('@')) {
        return email.split('@')[0] || 'Laborer';
      }
      const phone = (u?.phone ?? '').toString();
      if (phone.length >= 4) {
        return `User-${phone.slice(-4)}`;
      }
      return 'Laborer';
    } catch {
      return 'Laborer';
    }
  };
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    todayEarnings: 0,
    completedJobsToday: 0,
    shiftHours: 0,
    currentRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const userToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAvailable(parsedUser.isAvailable !== false);
      }

      if (userToken) {
        const headers: any = { 'Authorization': `Bearer ${userToken}` };

        // Fetch User Profile for Status/Location/Availability
        const userRes = await fetch(`${API_URL}/api/users/profile`, { headers });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          setIsAvailable(userData.isAvailable !== false);
          
          // Sync with storage
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        }

        // Fetch Laborer Stats
        const statsRes = await fetch(`${API_URL}/api/dashboard/laborer-stats`, { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const toggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      setIsAvailable(newStatus);

      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        const response = await fetch(`${API_URL}/api/users/availability`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ isAvailable: newStatus })
        });

        if (!response.ok) {
          throw new Error('Failed to update availability');
        }

        // Update local user state as well
        if (user) {
          const updatedUser = { ...user, isAvailable: newStatus };
          setUser(updatedUser);
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      // Revert local state if API fails
      setIsAvailable(isAvailable);
    }
  };

  if (loading && !user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#1F41BB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9FAFB' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1F41BB" />}
      >
        {/* Modern Header Section */}
        <View style={styles.header}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.greeting, { color: colors.text, opacity: 0.6 }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={2}>
              {computeDisplayName(user)}
            </Text>
          </View>
        </View>

        {/* Combined Shift & Status Card */}
        <View style={[styles.shiftCard, { backgroundColor: '#1F41BB' }]}>
          <View style={styles.shiftHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.shiftTitle}>Your Shift</Text>
              <Text style={[styles.shiftSubtitle, { flexShrink: 1, flexWrap: 'wrap' }]}>
                {isAvailable ? 'You are currently Online' : 'You are currently Offline'}
              </Text>
            </View>
            <TouchableOpacity
                style={[styles.statusToggle, { backgroundColor: isAvailable ? '#4ADE80' : '#F87171' }]}
                onPress={toggleAvailability}
                activeOpacity={0.8}
            >
                <Text style={styles.statusToggleText}>
                    {isAvailable ? 'Go Offline' : 'Go Online'}
                </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.shiftDivider} />
          
          <TouchableOpacity 
            style={styles.locationSummary}
            onPress={() => router.push('/(laborer)/location/edit')}
          >
            <Ionicons name="location-sharp" size={18} color="#FFFFFF" />
            <Text style={styles.locationSummaryText} numberOfLines={1}>
              {user?.currentLocation?.address || "Location not set"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        

        {/* Quick Stats Grid */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FFFFFF' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="wallet" size={20} color="#059669" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {loading ? '...' : `Rs ${stats.todayEarnings.toFixed(0)}`}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text, opacity: 0.5 }]}>Earnings</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FFFFFF' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="checkmark-done" size={20} color="#7C3AED" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {loading ? '...' : stats.completedJobsToday}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text, opacity: 0.5 }]}>Jobs Done</Text>
            </View>
          </View>
        </View>

        {/* Improved Rating Section */}
        <TouchableOpacity 
          style={[styles.ratingCard, { backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FFFFFF' }]}
          onPress={() => router.push('/(laborer)/(tabs)/account')}
        >
          <View style={styles.ratingHeader}>
            <Text style={[styles.ratingTitle, { color: colors.text }]}>Your Ratings</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingBadgeText}>{stats.currentRating.toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.ratingContent}>
            <View style={styles.ratingInfo}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name={star <= Math.round(stats.currentRating) ? "star" : "star-outline"} 
                    size={20} 
                    color="#F59E0B" 
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
            </View>
            <View style={styles.circularProgress}>
              <View style={[styles.progressInner, { borderColor: '#F59E0B' }]}>
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {((stats.currentRating / 5) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    paddingHorizontal: 2, // Added to prevent clipping
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 2, // Added to prevent clipping
    flexWrap: 'wrap',
    flexShrink: 1,
    maxWidth: '100%',
  },
  shiftCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#1F41BB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shiftSubtitle: {
    color: '#E0E7FF',
    fontSize: 13,
    marginTop: 2,
  },
  statusToggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statusToggleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  shiftDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 15,
  },
  locationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationSummaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextJobCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  nextJobContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  ratingBadgeText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingInfo: {
    flex: 1,
  },
  ratingDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  circularProgress: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  progressInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
