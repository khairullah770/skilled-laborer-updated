import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../../constants/Colors';
import { useTheme } from '../../../context/ThemeContext';
import { useBookings } from '../../context/BookingsContext';

export default function BookingsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const { upcoming, past, refreshing, refresh, lastError } = useBookings();

    useFocusEffect(useCallback(() => {
        refresh();
    }, [refresh]));

    const statusLabel = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'pending' || s === 'waiting for laborer approval' || s === 'waiting_for_laborer_approval' || s === 'waiting for approval') {
            return 'Pending';
        }
        if (s === 'accepted') {
            return 'Accepted';
        }
        if (s === 'in progress') {
            return 'Job in progress';
        }
        if (s === 'completed') {
            return 'Job completed';
        }
        if (s === 'cancelled') {
            return 'Cancelled';
        }
        return status;
    };

    const bookings = activeTab === 'Upcoming' ? upcoming : past;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Tabs */}
            <View style={[styles.tabContainer, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#F0F0F0' }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Upcoming' && { borderBottomColor: colors.tint, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('Upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'Upcoming' && { color: colors.tint, fontWeight: 'bold' }]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Past' && { borderBottomColor: colors.tint, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('Past')}
                >
                    <Text style={[styles.tabText, activeTab === 'Past' && { color: colors.tint, fontWeight: 'bold' }]}>Past Bookings</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            >
                {!!lastError && (
                    <View style={{ paddingTop: 10, paddingHorizontal: 5 }}>
                        <Text style={{ color: '#D97706' }}>{lastError}</Text>
                    </View>
                )}
                {refreshing && upcoming.length === 0 && activeTab === 'Upcoming' ? (
                    <View style={{ paddingTop: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#1F41BB" />
                    </View>
                ) : null}
                {activeTab === 'Past' && (
                    <View style={styles.totalContainer}>
                        <Text style={[styles.totalText, { color: colors.text }]}>
                            Total Bookings: <Text style={{ fontWeight: 'bold', color: colors.tint }}>{past.length}</Text>
                        </Text>
                    </View>
                )}

                {bookings.map((booking) => (
                    <View key={booking._id} style={[styles.bookingCard, { backgroundColor: colorScheme === 'dark' ? '#1f1f1f' : '#F0F4FF' }]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.dateSection}>
                                <Text style={[styles.dateText, { color: colors.text }]}>{new Date(booking.scheduledAt).toLocaleDateString()}</Text>
                                <Text style={[styles.dayText, { color: colors.text }]}>{new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                <View style={styles.detailRow}>
                                    <View style={[styles.dot, { backgroundColor: colorScheme === 'dark' ? '#9CA3AF' : '#757575' }]} />
                                    <Text style={[styles.detailText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#757575' }]}>{booking.location?.address || 'No address'}</Text>
                                </View>
                            </View>
                            <View style={styles.serviceSection}>
                                <Text style={[styles.serviceText, { color: colors.text }]}>{booking.service} · {statusLabel(booking.status)}</Text>
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <TouchableOpacity
                                style={[styles.viewDetailsButton, { borderColor: colors.tint }]}
                                onPress={() => router.push(`/booking/details/${booking._id}`)}
                            >
                                <Text style={[styles.viewDetailsButtonText, { color: colors.tint }]}>View details</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
                {bookings.length === 0 && !refreshing ? (
                    <View style={{ paddingTop: 40, alignItems: 'center' }}>
                        <Text style={{ color: colors.text, opacity: 0.6 }}>No {activeTab.toLowerCase()} bookings</Text>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 7.8,
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 16,
        color: '#757575',
        fontWeight: '500',
        lineHeight: 24,
        paddingHorizontal: 4, // Prevent clipping of last character
    },
    scrollContent: {
        padding: 20,
    },
    totalContainer: {
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    totalText: {
        fontSize: 16,
        fontWeight: '500',
    },
    bookingCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dateSection: {
        flex: 1.5,
    },
    dateText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    dayText: {
        fontSize: 16,
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginRight: 8,
    },
    detailText: {
        fontSize: 14,
        flex: 1,
    },
    serviceSection: {
        flex: 1,
        alignItems: 'flex-end',
    },
    serviceText: {
        fontSize: 14,
        textAlign: 'right',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    viewDetailsButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewDetailsButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
