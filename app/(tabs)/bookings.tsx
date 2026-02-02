import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

const UPCOMING_BOOKINGS = [
    {
        id: '1',
        date: '10 Dec, Tuesday',
        service: 'Wiring and Rewiring',
        details: ['lorem', 'lorem'],
        status: 'upcoming'
    },
];

const COMPLETED_BOOKINGS = [
    {
        id: '2',
        date: '05 Dec, Thursday',
        service: 'Full House Painting',
        details: ['Project finished', 'Quality check passed'],
        status: 'completed'
    },
];

export default function BookingsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed'>('Upcoming');
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const bookings = activeTab === 'Upcoming' ? UPCOMING_BOOKINGS : COMPLETED_BOOKINGS;

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
                    style={[styles.tab, activeTab === 'Completed' && { borderBottomColor: colors.tint, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('Completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'Completed' && { color: colors.tint, fontWeight: 'bold' }]}>Completed</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {bookings.map((booking) => (
                    <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colorScheme === 'dark' ? '#1f1f1f' : '#F0F4FF' }]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.dateSection}>
                                <Text style={[styles.dateText, { color: colors.text }]}>{booking.date.split(',')[0]}</Text>
                                <Text style={[styles.dayText, { color: colors.text }]}>{booking.date.split(',')[1]}</Text>
                                {booking.details.map((detail, index) => (
                                    <View key={index} style={styles.detailRow}>
                                        <View style={[styles.dot, { backgroundColor: colorScheme === 'dark' ? '#9CA3AF' : '#757575' }]} />
                                        <Text style={[styles.detailText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#757575' }]}>{detail}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.serviceSection}>
                                <Text style={[styles.serviceText, { color: colors.text }]}>{booking.service}</Text>
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <TouchableOpacity
                                style={[styles.viewDetailsButton, { borderColor: colors.tint }]}
                                onPress={() => router.push(`/booking-details/${booking.id}`)}
                            >
                                <Text style={[styles.viewDetailsButtonText, { color: colors.tint }]}>View details</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
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
        paddingTop: 50,
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
        lineHeight: 20,
    },
    scrollContent: {
        padding: 20,
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
        flex: 1,
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
