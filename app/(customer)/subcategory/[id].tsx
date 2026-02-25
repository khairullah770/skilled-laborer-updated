
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LaborerCard from '../../../components/LaborerCard';
import { API_URL } from '../../../constants/Api';

export default function SubCategoryDetailsScreen() {
    const { id, title } = useLocalSearchParams();
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [near, setNear] = useState<{ lat?: number; lng?: number }>({});

    useEffect(() => {
        const loadNear = async () => {
            const saved = await AsyncStorage.getItem('customerLocation');
            if (saved) {
                const loc = JSON.parse(saved);
                setNear({ lat: loc.latitude, lng: loc.longitude });
            }
        };
        loadNear();
    }, []);

    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        fetchPage(1, true);
    }, [id]);

    const fetchPage = async (targetPage: number, reset = false) => {
        if (!id || loading) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('subcategory', String(id));
            params.append('page', String(targetPage));
            params.append('limit', '20');
            if (near.lat != null && near.lng != null) {
                params.append('nearLat', String(near.lat));
                params.append('nearLng', String(near.lng));
            }
            params.append('onlineOnly', 'false');
            params.append('includeUnapproved', 'true');
            const res = await fetch(`${API_URL}/api/services/search-laborers?${params.toString()}`);
            const data = await res.json();
            const mapped = (data.results || []).map((r: any) => ({
                id: r.laborerId,
                name: r.profile?.name || 'Laborer',
                image: r.profile?.profileImage ? `${API_URL}${r.profile.profileImage}` : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
                hourlyRate: r.price || 0,
                distance: typeof r.distanceKm === 'number' ? r.distanceKm : 0,
                verified: !!r.profile?.online,
                rating: r.profile?.rating || 0,
                experience: r.profile?.experience || '',
                completedJobs: r.profile?.completedJobs ?? 0
            }));
            setItems(reset ? mapped : [...items, ...mapped]);
            setHasMore((data.results || []).length === 20);
            setPage(targetPage);
        } catch (e) {
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPage(1, true);
    };

    const onEndReached = () => {
        if (hasMore && !loading) {
            fetchPage(page + 1);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || 'Laborers'}</Text>
                <View style={{ width: 24 }} />
            </View>

            {page === 1 && loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#1F41BB" />
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={({ item }) => (
                        <LaborerCard
                            laborer={item}
                            onPress={() => router.push({ pathname: '/laborer/[id]', params: { id: item.id } })}
                        />
                    )}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    onEndReachedThreshold={0.3}
                    onEndReached={onEndReached}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1F41BB" />}
                    ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 20 }}>No laborers found.</Text> : null}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: {
        padding: 15,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
});
