import { Ionicons } from '@expo/vector-icons';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../../constants/Colors';
import { LABORERS } from '../../../constants/Laborers';
import { useTheme } from '../../../context/ThemeContext';

export default function BookingDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    // For demonstration, we'll try to find the laborer by id, or default to James Bond if not found
    const laborer = LABORERS.find(l => l.id === id) || LABORERS[0];

    // Check if the booking ID corresponds to the accepted job (ID '3')
    const isJobAccepted = id === '3'; 
    const isJobCompleted = ['2', '4', '5'].includes(id as string);

    const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleCancel = () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'No', style: 'cancel' },
                { 
                    text: 'Yes', 
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Cancelled', 'Your booking has been cancelled.');
                        router.back();
                    }
                }
            ]
        );
    };

    const handleReschedule = () => {
        setIsRescheduleModalVisible(true);
    };

    const confirmReschedule = () => {
        setIsRescheduleModalVisible(false);
        Alert.alert(
            'Success', 
            `Booking rescheduled to:\nDate: ${tempDate.toDateString()}\nTime: ${tempDate.toLocaleTimeString()}`
        );
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const currentDate = tempDate;
            selectedDate.setHours(currentDate.getHours());
            selectedDate.setMinutes(currentDate.getMinutes());
            setTempDate(selectedDate);
        }
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const currentDate = tempDate;
            const newDate = new Date(currentDate);
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
            setTempDate(newDate);
        }
    };

    const jobStatus = [
        { title: 'Booking Accepted', completed: isJobAccepted || isJobCompleted },
        { title: 'Booking In progress', completed: isJobCompleted },
        { title: 'Booking Completed', completed: isJobCompleted },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                    {isJobCompleted ? 'Booking Details' : 'Upcoming Booking'}
                </Text>
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
                        {!isJobCompleted && (
                            <>
                                <TouchableOpacity style={[styles.iconCircle, { backgroundColor: '#EBF0FF' }]}>
                                    <Ionicons name="call" size={22} color="#1F41BB" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.iconCircle, { backgroundColor: '#EBF0FF' }]}>
                                    <Ionicons name="chatbubble-ellipses" size={22} color="#1F41BB" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                {isJobCompleted ? (
                    <View style={styles.completedSection}>
                        <View style={styles.ratingContainer}>
                            <Text style={[styles.ratingLabel, { color: colors.text }]}>Your Rating</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons key={star} name="star" size={24} color="#FFD700" style={{ marginRight: 5 }} />
                                ))}
                            </View>
                            <Text style={[styles.reviewText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#757575' }]}>
                                "Great service! Very professional and on time."
                            </Text>
                        </View>
                        <View style={[styles.acceptedContainer, { backgroundColor: '#E0F2F1' }]}>
                            <Text style={[styles.acceptedText, { color: '#00695C' }]}>Booking Completed</Text>
                        </View>
                    </View>
                ) : !isJobAccepted ? (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText} numberOfLines={1} adjustsFontSizeToFit>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.rescheduleButton]}
                            onPress={handleReschedule}
                        >
                            <Text style={styles.rescheduleButtonText} numberOfLines={1} adjustsFontSizeToFit>Reschedule</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.acceptedContainer}>
                        <Text style={styles.acceptedText}>Booking Accepted</Text>
                    </View>
                )}

                {/* Job Status Timeline */}
                <View style={styles.statusSection}>
                    <Text style={[styles.statusTitle, { color: colors.text }]}>Booking Status</Text>
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

            {/* Reschedule Modal */}
            <Modal
                visible={isRescheduleModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsRescheduleModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Reschedule Booking</Text>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Date Picker */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Date</Text>
                            <TouchableOpacity 
                                style={[styles.inputField, { borderColor: colorScheme === 'dark' ? '#333' : '#E5E7EB' }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={{ color: colors.text }}>{tempDate.toDateString()}</Text>
                                <Ionicons name="calendar-outline" size={20} color={colors.text} />
                            </TouchableOpacity>

                            {/* Time Picker */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Time</Text>
                            <TouchableOpacity 
                                style={[styles.inputField, { borderColor: colorScheme === 'dark' ? '#333' : '#E5E7EB' }]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text style={{ color: colors.text }}>{tempDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                <Ionicons name="time-outline" size={20} color={colors.text} />
                            </TouchableOpacity>
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => setIsRescheduleModalVisible(false)}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalConfirmButton]}
                                onPress={confirmReschedule}
                            >
                                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {showDatePicker && (
                <RNDateTimePicker
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                />
            )}

            {showTimePicker && (
                <RNDateTimePicker
                    value={tempDate}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                />
            )}
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
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
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
        fontSize: 13,
        fontWeight: 'bold',
    },
    rescheduleButtonText: {
        color: '#FFF',
        fontSize: 13,
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
    acceptedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        paddingVertical: 15,
        backgroundColor: '#EBF0FF',
        borderRadius: 12,
    },
    acceptedText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F41BB',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 10,
    },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 20,
    },
    modalButton: {
        flex: 1,
        height: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#F3F4F6',
        marginRight: 10,
    },
    modalConfirmButton: {
        backgroundColor: '#1F41BB',
        marginLeft: 10,
    },
    modalCancelButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    modalConfirmButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    completedSection: {
        marginBottom: 30,
    },
    ratingContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    ratingLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    starsRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    reviewText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
