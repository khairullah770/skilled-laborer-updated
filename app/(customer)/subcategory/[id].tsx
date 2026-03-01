
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LaborerCard from '../../../components/LaborerCard';
import { API_URL } from '../../../constants/Api';

/* ── filter options ─────────────────────────────────────── */
const sortOptions = [
    { id: 'price_high_low', label: 'Price: High to Low', icon: 'arrow-up-circle-outline' as const },
    { id: 'price_low_high', label: 'Price: Low to High', icon: 'arrow-down-circle-outline' as const },
    { id: 'ratings', label: 'Ratings', icon: 'star-outline' as const },
];
const PRICE_IDS = ['price_high_low', 'price_low_high'];

export default function SubCategoryDetailsScreen() {
    const { id, title, customerLat, customerLng } = useLocalSearchParams();
    const router = useRouter();

    /* ── list state ───────────────────────────────────────── */
    const [items, setItems] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const nearRef = useRef<{ lat?: number; lng?: number }>({});
    const [locationLoaded, setLocationLoaded] = useState(false);
    const loadingRef = useRef(false);

    /* ── filter state ─────────────────────────────────────── */
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const filtersRef = useRef<string[]>([]);

    const toggleFilter = useCallback((filterId: string) => {
        setSelectedFilters(prev => {
            let next: string[];
            if (PRICE_IDS.includes(filterId)) {
                // Price options are mutually exclusive
                const withoutPrice = prev.filter(f => !PRICE_IDS.includes(f));
                next = prev.includes(filterId) ? withoutPrice : [...withoutPrice, filterId];
            } else {
                next = prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId];
            }
            filtersRef.current = next;
            return next;
        });
    }, []);

    const applyFilters = useCallback(() => {
        setIsFilterVisible(false);
        // Re-fetch with new filters
        setItems([]);
        setPage(1);
        setHasMore(true);
        fetchPage(1, true);
    }, []);

    /* ── load customer location ───────────────────────────── */
    useEffect(() => {
        const loadNear = async () => {
            let loc: { lat?: number; lng?: number } = {};
            if (customerLat && customerLng) {
                loc = { lat: Number(customerLat), lng: Number(customerLng) };
            } else {
                try {
                    const saved = await AsyncStorage.getItem('customerLocation');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        loc = { lat: parsed.latitude, lng: parsed.longitude };
                    }
                } catch {}
            }
            nearRef.current = loc;
            setLocationLoaded(true);
        };
        loadNear();
    }, []);

    /* ── fetch laborers once location is ready ────────────── */
    useEffect(() => {
        if (!locationLoaded) return;
        setItems([]);
        setPage(1);
        setHasMore(true);
        fetchPage(1, true);
    }, [id, locationLoaded]);

    const fetchPage = async (targetPage: number, reset = false) => {
        if (!id || loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const loc = nearRef.current;
            const activeFilters = filtersRef.current;
            const params = new URLSearchParams();
            params.append('subcategory', String(id));
            params.append('page', String(targetPage));
            params.append('limit', '20');
            if (loc.lat != null && loc.lng != null) {
                params.append('nearLat', String(loc.lat));
                params.append('nearLng', String(loc.lng));
                params.append('radiusKm', '5');
            }
            // Always sort by nearest first, then user‑selected sorts
            const sortParts: string[] = ['nearest'];
            if (activeFilters.includes('price_high_low')) sortParts.push('price_high_low');
            if (activeFilters.includes('price_low_high')) sortParts.push('price_low_high');
            if (activeFilters.includes('ratings')) sortParts.push('ratings');
            params.append('sortBy', sortParts.join(','));
            params.append('onlineOnly', 'false');
            params.append('includeUnapproved', 'true');
            const res = await fetch(`${API_URL}/api/services/search-laborers?${params.toString()}`);
            const data = await res.json();
            const mapped = (data.results || []).map((r: any) => ({
                id: r.laborerId,
                name: r.profile?.name || 'Laborer',
                image: r.profile?.profileImage
                    ? `${API_URL}${r.profile.profileImage}`
                    : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
                hourlyRate: r.price || 0,
                distance: typeof r.distanceKm === 'number' ? r.distanceKm : 0,
                verified: !!r.profile?.online,
                rating: r.profile?.rating || 0,
                experience: r.profile?.experience || '',
                completedJobs: r.profile?.completedJobs ?? 0,
            }));
            setItems(prev => (reset ? mapped : [...prev, ...mapped]));
            setHasMore((data.results || []).length === 20);
            setPage(targetPage);
        } catch {
        } finally {
            loadingRef.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPage(1, true);
    };

    const onEndReached = () => {
        if (hasMore && !loading) fetchPage(page + 1);
    };

    /* ── render ────────────────────────────────────────────── */
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || 'Laborers'}</Text>
                <TouchableOpacity onPress={() => setIsFilterVisible(true)} style={styles.filterButton}>
                    <Ionicons name="options-outline" size={22} color="#1F41BB" />
                </TouchableOpacity>
            </View>

            {/* Active filter chips */}
            {selectedFilters.length > 0 && (
                <View style={styles.chipRow}>
                    {selectedFilters.map(f => {
                        const opt = sortOptions.find(o => o.id === f);
                        return opt ? (
                            <View key={f} style={styles.chip}>
                                <Text style={styles.chipText}>{opt.label}</Text>
                                <TouchableOpacity onPress={() => { toggleFilter(f); setTimeout(() => applyFilters(), 0); }}>
                                    <Ionicons name="close-circle" size={16} color="#1F41BB" />
                                </TouchableOpacity>
                            </View>
                        ) : null;
                    })}
                </View>
            )}

            {/* List */}
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
                    ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No laborers found.</Text> : null}
                />
            )}

            {/* ── Filter Modal ────────────────────────────── */}
            <Modal visible={isFilterVisible} transparent animationType="slide" onRequestClose={() => setIsFilterVisible(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setIsFilterVisible(false)}>
                    <Pressable style={styles.filterSheet} onPress={() => {}}>
                        {/* Modal header */}
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>Filter & Sort</Text>
                            <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {/* Price section */}
                        <Text style={styles.filterSectionLabel}>Sort by Price</Text>
                        {sortOptions.filter(o => PRICE_IDS.includes(o.id)).map(option => {
                            const selected = selectedFilters.includes(option.id);
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.sortOption, selected && styles.sortOptionSelected]}
                                    onPress={() => toggleFilter(option.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.optionLeft}>
                                        <Ionicons name={option.icon} size={20} color={selected ? '#1F41BB' : '#444'} />
                                        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                                            {option.label}
                                        </Text>
                                    </View>
                                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                        {selected && <View style={styles.radioInner} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Ratings section */}
                        <Text style={[styles.filterSectionLabel, { marginTop: 16 }]}>Other</Text>
                        {sortOptions.filter(o => !PRICE_IDS.includes(o.id)).map(option => {
                            const selected = selectedFilters.includes(option.id);
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.sortOption, selected && styles.sortOptionSelected]}
                                    onPress={() => toggleFilter(option.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.optionLeft}>
                                        <Ionicons name={option.icon} size={20} color={selected ? '#1F41BB' : '#444'} />
                                        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                                            {option.label}
                                        </Text>
                                    </View>
                                    <View style={[styles.checkboxOuter, selected && styles.checkboxOuterSelected]}>
                                        {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Apply button */}
                        <TouchableOpacity style={styles.applyButton} onPress={applyFilters} activeOpacity={0.8}>
                            <Text style={styles.applyButtonText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

/* ── styles ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: { padding: 5, marginLeft: -5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    filterButton: { padding: 5 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 8, gap: 8 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF1FF',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
    },
    chipText: { fontSize: 12, color: '#1F41BB', fontWeight: '600' },
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: 15 },
    columnWrapper: { justifyContent: 'space-between' },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },

    /* filter modal */
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    filterSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 30,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    filterTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    filterSectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8, marginTop: 4 },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 6,
        backgroundColor: '#F5F5F5',
    },
    sortOptionSelected: { backgroundColor: '#EEF1FF', borderWidth: 1, borderColor: '#1F41BB' },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    optionLabel: { fontSize: 15, color: '#333' },
    optionLabelSelected: { color: '#1F41BB', fontWeight: '600' },
    applyButton: {
        backgroundColor: '#1F41BB',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    applyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CCC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: { borderColor: '#1F41BB' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1F41BB' },
    checkboxOuter: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CCC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxOuterSelected: { borderColor: '#1F41BB', backgroundColor: '#1F41BB' },
});
