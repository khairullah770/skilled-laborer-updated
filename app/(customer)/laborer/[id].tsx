
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';

export default function LaborerProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'About' | 'Reviews'>('About');
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hasAcceptedBooking, setHasAcceptedBooking] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            console.log('[LaborerProfile] init id=', id);

            // Check whether customer has an accepted booking with this laborer
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    const checkRes = await fetch(`${API_URL}/api/bookings/check-accepted/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (checkRes.ok) {
                        const checkData = await checkRes.json();
                        setHasAcceptedBooking(!!checkData.hasAcceptedBooking);
                    }
                }
            } catch (e) {
                console.warn('[LaborerProfile] booking check failed', e);
            }

            const cacheKey = `laborerProfile:v2:${id}`;
            const cached = await AsyncStorage.getItem(cacheKey);
            let useCached = false;
            if (cached) {
                const obj = JSON.parse(cached);
                if (Date.now() - obj.ts < 5 * 60 * 1000 && obj.data && obj.data.name) {
                    setProfile(obj.data);
                    setLoading(false);
                    useCached = true;
                }
            }
            if (!useCached) {
                try {
                    const url = `${API_URL}/api/users/${id}/public?includeUnapproved=true`;
                    console.log('[LaborerProfile] fetching', url);
                    const res = await fetch(url);
                    console.log('[LaborerProfile] status', res.status);
                    if (!res.ok) {
                        const text = await res.text().catch(() => '');
                        console.warn('[LaborerProfile] non-OK response', res.status, text);
                        setProfile(null);
                        return;
                    }
                    const data = await res.json();
                    console.log('[LaborerProfile] data keys', Object.keys(data || {}));
                    setProfile(data);
                    await AsyncStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
                } catch (e) {
                    console.error('[LaborerProfile] fetch error', e);
                } finally {
                    setLoading(false);
                }
            }
        };
        load();
    }, [id]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1F41BB" />
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.center}>
                    <Text>Laborer not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const img = profile.profileImage ? `${API_URL}${profile.profileImage}` : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileSection}>
                    <Image source={{ uri: img }} style={styles.profileImage} />
                    <View style={styles.profileDetails}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{profile.name || 'Laborer'}</Text>
                            {profile.online ? (
                                <Ionicons name="checkmark-circle" size={18} color="#00C853" style={styles.verifiedIcon} />
                            ) : null}
                        </View>
                        <Text style={styles.rate}>{profile.offerings && profile.offerings[0] ? `Rs ${profile.offerings[0].price}` : ''}</Text>
                        <View style={styles.ratingRow}>
                            <Text style={styles.rating}>{profile.rating || 0}</Text>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.totalRatingsText}>{` (${profile.totalReviews || 0})`}</Text>
                        </View>
                        {hasAcceptedBooking && profile.phone ? (
                            <TouchableOpacity onPress={() => {
                                const phone = String(profile.phone).replace(/[^\d+]/g, '');
                                const url = `whatsapp://send?phone=${phone}`;
                                Linking.openURL(url).catch(() => {
                                    Linking.openURL(`https://wa.me/${phone}`);
                                });
                            }}>
                                <Text style={styles.phoneText}>{profile.phone}</Text>
                            </TouchableOpacity>
                        ) : null}
                        <Text style={styles.distance}>{profile.currentLocation && profile.currentLocation.address ? profile.currentLocation.address : ''}</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    {hasAcceptedBooking ? (
                        <>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                                <Text style={styles.actionText}>Chat</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => {
                                if (profile.phone) {
                                    const phone = String(profile.phone).replace(/[^\d+]/g, '');
                                    const url = `whatsapp://send?phone=${phone}`;
                                    Linking.openURL(url).catch(() => {
                                        Linking.openURL(`https://wa.me/${phone}`);
                                    });
                                }
                            }}>
                                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                                <Text style={styles.actionText}>WhatsApp</Text>
                            </TouchableOpacity>
                        </>
                    ) : null}
                </View>

                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'About' && styles.activeTab]}
                        onPress={() => setActiveTab('About')}
                    >
                        <Text style={[styles.tabText, activeTab === 'About' && styles.activeTabText]}>About</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'Reviews' && styles.activeTab]}
                        onPress={() => setActiveTab('Reviews')}
                    >
                        <Text style={[styles.tabText, activeTab === 'Reviews' && styles.activeTabText]}>Reviews</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.tabContentBg}>
                    {activeTab === 'About' ? (
                        <View style={styles.aboutContent}>
                            <Text style={styles.sectionHeader}>Experience</Text>
                            <Text style={styles.servicesText}>{profile.experience || ''} years </Text>
                            <View style={{ height: 20 }} />
                            <Text style={styles.sectionHeader}>Services ({Array.isArray(profile.offerings) ? profile.offerings.length : 0})</Text>
                            {profile.offerings && profile.offerings.length > 0 ? (
                                profile.offerings.map((o: any) => (
                                    <View key={o.subcategory?._id || o.subcategory} style={{ marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 }}>{o.subcategory?.name || 'Service'}</Text>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Rs {o.price}</Text>
                                        </View>
                                        {o.description ? (
                                            <Text style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>{o.description}</Text>
                                        ) : null}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.servicesText}>No services listed</Text>
                            )}
                            <View style={{ height: 20 }} />
                            <Text style={styles.sectionHeader}>Service Area</Text>
                            {profile.currentLocation && profile.currentLocation.latitude != null ? (
                                <MapView
                                    style={{ height: 180, borderRadius: 8 }}
                                    initialRegion={{
                                        latitude: profile.currentLocation.latitude,
                                        longitude: profile.currentLocation.longitude,
                                        latitudeDelta: 0.05,
                                        longitudeDelta: 0.05
                                    }}
                                >
                                    <Marker coordinate={{ latitude: profile.currentLocation.latitude, longitude: profile.currentLocation.longitude }} />
                                </MapView>
                            ) : null}
                        </View>
                    ) : (
                        <View style={styles.aboutContent}>
                            {Array.isArray(profile.reviews) && profile.reviews.length > 0 ? (
                                profile.reviews.map((rev: any) => (
                                    <View key={rev.id} style={{ marginBottom: 14 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                            <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{rev.customerName}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                                <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>{rev.rating}</Text>
                                                <Ionicons name="star" size={14} color="#FFD700" />
                                            </View>
                                        </View>
                                        {rev.comment ? <Text style={{ color: '#333' }}>{rev.comment}</Text> : null}
                                        <Text style={{ color: '#777', fontSize: 12, marginTop: 2 }}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text>No reviews yet</Text>
                            )}
                        </View>
                    )}
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => router.push({ pathname: '/booking/[laborerId]', params: { laborerId: id as string } })}
                >
                    <Text style={styles.bookButtonText}>Book now</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    profileSection: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 20,
        backgroundColor: '#eee',
    },
    profileDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginRight: 5,
    },
    verifiedIcon: {
        marginTop: 2,
    },
    rate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F41BB',
        marginBottom: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        position: 'absolute',
        right: 0,
        top: 10,
    },
    rating: {
        fontSize: 16,
        color: '#FFD700',
        fontWeight: 'bold',
        marginRight: 2,
    },
    totalRatingsText: {
        fontSize: 13,
        color: '#777',
        marginLeft: 4
    },
    phoneText: {
        fontSize: 14,
        color: '#1F41BB',
        marginBottom: 4
    },
    distance: {
        fontSize: 14,
        color: '#555',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 12
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1F41BB',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10
    },
    actionText: { color: '#fff', fontWeight: '700' },
    contactLockedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        flex: 1,
        justifyContent: 'center',
    },
    contactLockedText: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#E0E0E0',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#1F41BB',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    activeTabText: {
        color: '#1F41BB',
    },
    tabContentBg: {
        backgroundColor: '#FFFFFF',
        minHeight: 200,
    },
    aboutContent: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#757575',
        marginBottom: 10,
    },
    servicesText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    bookButton: {
        backgroundColor: '#2A3B8F',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
