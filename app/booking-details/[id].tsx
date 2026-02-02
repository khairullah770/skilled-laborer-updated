import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { LABORERS } from '../../constants/Laborers';
import { useTheme } from '../../context/ThemeContext';

export default function BookingDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    // For demonstration, we'll try to find the laborer by id, or default to James Bond if not found
    const laborer = LABORERS.find(l => l.id === id) || LABORERS[0];

    const jobStatus = [
        { title: 'Job Accepted', completed: true },
        { title: 'Job In progress', completed: false },
        { title: 'Job Completed', completed: false },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Upcoming Booking</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Booking Info Row */}
                <View style={[styles.infoRow, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#F0F0F0' }]}>
                    <View style={styles.infoSection}>
                        <Text style={[styles.infoLabel, { color: colors.text }]}>10</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>Dec, Tuesday 6:30 PM</Text>
                    </View>
                    <View style={styles.infoSection}>
                        <Text style={[styles.infoLabel, { color: colors.text }]}>Address</Text>
                        <Text style={[styles.infoValue, { color: colorScheme === 'dark' ? '#9CA3AF' : '#757575' }]}>Khayban e sir syed</Text>
                    </View>
                </View>

                {/* Laborer Section */}
                <View style={styles.laborerSection}>
                    <Image source={{ uri: laborer.image }} style={styles.laborerImage} />
                    <View style={styles.laborerDetails}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.laborerName, { color: colors.text }]}>{laborer.name}</Text>
                            {laborer.verified && (
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" style={styles.verifiedIcon} />
                            )}
                        </View>
                        <Text style={[styles.serviceFeeLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#757575' }]}>Service Fee</Text>
                        <Text style={[styles.rateText, { color: '#1F41BB' }]}>{`₹${laborer.hourlyRate} /hour`}</Text>
                    </View>
                    <View style={styles.actionIcons}>
                        <TouchableOpacity style={[styles.iconCircle, { backgroundColor: '#EBF0FF' }]}>
                            <Ionicons name="call" size={22} color="#1F41BB" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconCircle, { backgroundColor: '#EBF0FF' }]}>
                            <Ionicons name="chatbubble-ellipses" size={22} color="#1F41BB" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]}>
                        <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                    </TouchableOpacity>
                </View>

                {/* Job Status Timeline */}
                <View style={styles.statusSection}>
                    <Text style={[styles.statusTitle, { color: colors.text }]}>Job Status</Text>
                    <View style={styles.timelineContainer}>
                        {jobStatus.map((status, index) => (
                            <View key={index} style={styles.timelineItem}>
                                <View style={styles.timelineLeading}>
                                    <View style={[
                                        styles.timelineDot,
                                        { backgroundColor: status.completed ? '#1F41BB' : '#D1D5DB' }
                                    ]} />
                                    {index !== jobStatus.length - 1 && (
                                        <View style={[
                                            styles.timelineLine,
                                            { backgroundColor: '#D1D5DB' }
                                        ]} />
                                    )}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={[
                                        styles.statusItemText,
                                        { color: status.completed ? colors.text : (colorScheme === 'dark' ? '#9CA3AF' : '#757575') },
                                        status.completed && { fontWeight: '600' }
                                    ]}>
                                        {status.title}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 25,
        borderBottomWidth: 1,
        marginBottom: 20,
    },
    infoSection: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    laborerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    laborerImage: {
        width: 70,
        height: 80,
        borderRadius: 8,
        marginRight: 15,
    },
    laborerDetails: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    laborerName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 6,
    },
    verifiedIcon: {
        marginTop: 2,
    },
    serviceFeeLabel: {
        fontSize: 14,
        marginBottom: 2,
    },
    rateText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionIcons: {
        flexDirection: 'row',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    actionButton: {
        flex: 1,
        height: 55,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#000',
        marginRight: 15,
    },
    rescheduleButton: {
        backgroundColor: '#1F41BB',
    },
    cancelButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rescheduleButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusSection: {
        marginTop: 10,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    timelineContainer: {
        paddingLeft: 10,
    },
    timelineItem: {
        flexDirection: 'row',
        height: 80,
    },
    timelineLeading: {
        alignItems: 'center',
        marginRight: 20,
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        zIndex: 1,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginTop: -2,
    },
    timelineContent: {
        paddingTop: -2,
    },
    statusItemText: {
        fontSize: 16,
    },
});
