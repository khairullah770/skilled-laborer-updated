import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, apiFetchJson } from '../../../../constants/Api';
import Colors from '../../../../constants/Colors';
import { useTheme } from '../../../../context/ThemeContext';

export default function BookingDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [booking, setBooking] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [tempDate, setTempDate] = useState<Date | null>(null);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const { data } = await apiFetchJson<any>(`/api/bookings/${id}`, {
                token,
                timeoutMs: 10000,
                retries: 2,
            });
            setBooking(data);
            try {
                await AsyncStorage.setItem(`bookingDetail:${id}`, JSON.stringify(data));
            } catch {}
        } catch (e: any) {
            const message =
                e?.body?.message ||
                e?.message ||
                'Failed to load booking details.';
            setError(message);
            try {
                const cached = await AsyncStorage.getItem(`bookingDetail:${id}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setBooking(parsed);
                }
            } catch {}
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const handleCancel = async () => {
        if (!booking) return;
        const statusNorm = (booking.status || '').toString().toLowerCase();
        if (statusNorm === 'accepted' || statusNorm === 'in progress' || statusNorm === 'completed') {
            return;
        }
        try {
            setCancelLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            await apiFetchJson(`/api/bookings/${id}/cancel`, {
                method: 'PUT',
                token,
                timeoutMs: 10000,
                retries: 1,
            });
            Alert.alert('Cancelled', 'Your booking has been cancelled.', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) {
            const message =
                e?.body?.message ||
                e?.message ||
                'Failed to cancel booking.';
            Alert.alert('Error', message);
        } finally {
            setCancelLoading(false);
        }
    };

    const handleReschedule = async (newDate: Date) => {
        if (!booking) return;
        const statusNorm = (booking.status || '').toString().toLowerCase();
        if (statusNorm === 'accepted' || statusNorm === 'in progress' || statusNorm === 'completed') {
            return;
        }
        try {
            setRescheduleLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            await apiFetchJson(`/api/bookings/${id}/reschedule`, {
                method: 'PUT',
                token,
                body: { scheduledAt: newDate.toISOString() },
                timeoutMs: 10000,
                retries: 1,
            });
            Alert.alert('Rescheduled', 'Your booking has been rescheduled.');
            load();
        } catch (e: any) {
            const message =
                e?.body?.message ||
                e?.message ||
                'Failed to reschedule booking.';
            Alert.alert('Error', message);
        } finally {
            setRescheduleLoading(false);
        }
    };

    const openWhatsApp = async () => {
        if (!booking?.laborer?.phone) {
            Alert.alert('Unavailable', 'Laborer phone number is not available.');
            return;
        }
        const raw = booking.laborer.phone.toString();
        const phone = raw.replace(/[^\d+]/g, '');
        try {
            await Linking.openURL(`tel:${phone}`);
        } catch {
            Alert.alert('Error', 'Unable to make a call.');
        }
    };

    const statusNorm = (booking?.status || '').toString().toLowerCase();
    const isAccepted = statusNorm === 'accepted';
    const isInProgress = statusNorm === 'in progress';
    const isCompleted = statusNorm === 'completed';
    const hasExistingRating = !!booking?.myRating;

    const steps = [
        { title: 'Booking Accepted', key: 'Accepted' },
        { title: 'Booking In progress', key: 'In Progress' },
        { title: 'Booking Completed', key: 'Completed' }
    ];

    const handleSubmitRating = async () => {
        if (!booking || !isCompleted) {
            return;
        }
        if (!ratingValue) {
            Alert.alert('Rating required', 'Please select a star rating.');
            return;
        }
        const trimmed = ratingComment.trim();
        if (trimmed && trimmed.length < 10) {
            Alert.alert('Comment too short', 'Please enter at least 10 characters.');
            return;
        }
        try {
            setRatingSubmitting(true);
            const token = await AsyncStorage.getItem('userToken');
            const { data } = await apiFetchJson<any>(`/api/bookings/${booking._id}/rate`, {
                method: 'POST',
                token,
                body: {
                    rating: ratingValue,
                    comment: trimmed,
                },
                timeoutMs: 10000,
                retries: 1,
            });
            setRatingSubmitted(true);
            setBooking((prev: any) =>
                prev
                    ? {
                          ...prev,
                          myRating: {
                              rating: data.rating,
                              comment: data.comment || trimmed,
                              createdAt: data.createdAt,
                          },
                      }
                    : prev
            );
            Alert.alert('Thank you', 'Thank you for your feedback!');
        } catch (e: any) {
            const message =
                e?.body?.message ||
                e?.message ||
                'Failed to submit rating.';
            Alert.alert('Error', message);
        } finally {
            setRatingSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{booking?.status || 'Booking'}</Text>
                <View style={{ width: 40 }} />
            </View>
            {loading && !booking ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#1F41BB" />
                </View>
            ) : null}
            {!!error && !booking && !loading && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                    <Text style={{ color: colorScheme === 'dark' ? '#FCA5A5' : '#B91C1C', textAlign: 'center', marginBottom: 16 }}>{error}</Text>
                    <TouchableOpacity onPress={load} style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1F41BB' }}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Try again</Text>
                    </TouchableOpacity>
                </View>
            )}
            {booking ? (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={[styles.infoRow, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#F0F0F0' }]}>
                        <View style={styles.infoSection}>
                            <Text style={[styles.infoLabel, { color: colors.text }]}>{new Date(booking.scheduledAt).toLocaleDateString()}</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <View style={styles.infoSection}>
                            <Text style={[styles.infoLabel, { color: colors.text }]}>Address</Text>
                            <Text style={[styles.infoValue, { color: colorScheme === 'dark' ? '#9CA3AF' : '#757575' }]}>{booking.location?.address || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.laborerSection}>
                        <Image source={{ uri: booking.laborer?.profileImage ? `${API_URL}${booking.laborer.profileImage}` : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} style={styles.laborerImage} />
                        <View style={styles.laborerDetails}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.laborerName, { color: colors.text }]}>{booking.laborer?.name || 'Laborer'}</Text>
                            </View>
                            <Text style={[styles.serviceFeeLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#757575' }]}>Service Fee</Text>
                            <Text style={[styles.rateText, { color: '#1F41BB' }]}>{`Rs ${booking.compensation}`}</Text>
                        </View>
                        <View style={styles.actionIcons}>
                            {(isAccepted || isInProgress) ? (
                                <>
                                    <TouchableOpacity
                                        style={[styles.iconCircle, { backgroundColor: '#EBF0FF' }]}
                                        onPress={openWhatsApp}
                                    >
                                        <Ionicons name="call" size={22} color="#1F41BB" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.iconCircle, { backgroundColor: '#EBF0FF' }]}
                                        onPress={() => {
                                            const bId = booking._id;
                                            const lName = encodeURIComponent(booking.laborer?.name || 'Laborer');
                                            router.push(`/(customer)/conversation/${bId}?bookingId=${bId}&name=${lName}` as any);
                                        }}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={22} color="#1F41BB" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={styles.contactLockedBadge}>
                                    <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                                </View>
                            )}
                        </View>
                    </View>

                    {isAccepted ? (
                        <View style={styles.acceptedBadgeContainer}>
                            <Text style={styles.acceptedBadgeText}>Booking Accepted</Text>
                        </View>
                    ) : isInProgress ? (
                        <View style={[styles.acceptedBadgeContainer, { backgroundColor: '#FFFFFF' }]}>
                            <Text style={[styles.acceptedBadgeText, { color: '#164EA3' }]}>In Progress</Text>
                        </View>
                    ) : isCompleted ? (
                        <View style={styles.acceptedBadgeContainer}>
                            <Text style={styles.acceptedBadgeText}>Booking Completed</Text>
                        </View>
                    ) : (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.cancelButton,
                                    cancelLoading && styles.actionButtonDisabled,
                                ]}
                                disabled={cancelLoading}
                                onPress={handleCancel}
                            >
                                {cancelLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.rescheduleButton,
                                    rescheduleLoading && styles.actionButtonDisabled,
                                ]}
                                disabled={rescheduleLoading}
                                onPress={() => {
                                    const current = booking.scheduledAt
                                        ? new Date(booking.scheduledAt)
                                        : new Date();
                                    setTempDate(current);
                                    setShowDatePicker(true);
                                }}
                            >
                                {rescheduleLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {showDatePicker && tempDate && (
                        <RNDateTimePicker
                            value={tempDate}
                            mode="date"
                            display="default"
                            minimumDate={new Date()}
                            onChange={(_, selectedDate) => {
                                if (!selectedDate) {
                                    setShowDatePicker(false);
                                    return;
                                }
                                const updated = new Date(tempDate);
                                updated.setFullYear(
                                    selectedDate.getFullYear(),
                                    selectedDate.getMonth(),
                                    selectedDate.getDate()
                                );
                                setTempDate(updated);
                                setShowDatePicker(false);
                                setShowTimePicker(true);
                            }}
                        />
                    )}

                    {showTimePicker && tempDate && (
                        <RNDateTimePicker
                            value={tempDate}
                            mode="time"
                            display="default"
                            onChange={(_, selectedTime) => {
                                if (!selectedTime) {
                                    setShowTimePicker(false);
                                    return;
                                }
                                const updated = new Date(tempDate);
                                updated.setHours(
                                    selectedTime.getHours(),
                                    selectedTime.getMinutes(),
                                    0,
                                    0
                                );
                                setShowTimePicker(false);
                                handleReschedule(updated);
                            }}
                        />
                    )}

                    {isCompleted && !hasExistingRating && (
                        <View style={styles.ratingSection}>
                            <Text style={[styles.ratingTitle, { color: colors.text }]}>Rate your experience</Text>
                            <View style={styles.ratingStarsRow}>
                                {[1, 2, 3, 4, 5].map((star) => {
                                    const fill = ratingValue - (star - 1);
                                    const isFull = fill >= 0.75;
                                    const isHalf = !isFull && fill >= 0.25;
                                    return (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setRatingValue(star)}
                                            activeOpacity={0.7}
                                            style={[styles.ratingStarButton, { width: 38, height: 38 }]}
                                        >
                                            <Ionicons
                                                name={isFull ? 'star' : isHalf ? 'star-half' : 'star-outline'}
                                                size={36}
                                                color={isFull || isHalf ? '#FBBF24' : '#D1D5DB'}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <TouchableOpacity
                                    onPress={() => setRatingValue(Math.max(0.5, Math.round((ratingValue - 0.1) * 10) / 10))}
                                    disabled={ratingValue <= 0.5}
                                    activeOpacity={0.6}
                                    style={{ padding: 6 }}
                                >
                                    <Ionicons name="remove-circle-outline" size={30} color={ratingValue <= 0.5 ? '#D1D5DB' : '#3B82F6'} />
                                </TouchableOpacity>
                                <Text style={{ fontSize: 18, fontWeight: '600', marginHorizontal: 14, color: '#374151', minWidth: 60, textAlign: 'center' }}>
                                    {ratingValue > 0 ? ratingValue.toFixed(1) : '0.0'} / 5
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setRatingValue(Math.min(5, Math.round((ratingValue + 0.1) * 10) / 10))}
                                    disabled={ratingValue >= 5}
                                    activeOpacity={0.6}
                                    style={{ padding: 6 }}
                                >
                                    <Ionicons name="add-circle-outline" size={30} color={ratingValue >= 5 ? '#D1D5DB' : '#3B82F6'} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.ratingCommentBox}>
                                <Text style={styles.ratingCommentLabel}>Feedback (optional)</Text>
                                <View style={styles.ratingCommentInputWrapper}>
                                    <TextInput
                                        style={styles.ratingCommentInput}
                                        placeholder="Share your experience with this laborer"
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        value={ratingComment}
                                        onChangeText={setRatingComment}
                                        maxLength={500}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.ratingSubmitButton,
                                    (!ratingValue || ratingSubmitting) && styles.ratingSubmitButtonDisabled,
                                ]}
                                disabled={!ratingValue || ratingSubmitting}
                                onPress={handleSubmitRating}
                            >
                                {ratingSubmitting ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.ratingSubmitButtonText}>Submit Rating</Text>
                                )}
                            </TouchableOpacity>
                            {ratingSubmitted && (
                                <Text style={styles.ratingThankYouText}>Thank you for your feedback!</Text>
                            )}
                        </View>
                    )}

                    <View style={styles.statusSection}>
                        <Text style={[styles.statusTitle, { color: colors.text }]}>Booking Status</Text>
                        <View style={styles.timelineContainer}>
                            {steps.map((s, index) => {
                                const completed = ['Accepted', 'In Progress', 'Completed'].indexOf(booking.status) >= index;
                                return (
                                    <View key={s.key} style={styles.timelineItem}>
                                        <View style={styles.timelineLeading}>
                                            <View style={[styles.timelineDot, { backgroundColor: completed ? '#1F41BB' : '#D1D5DB' }]} />
                                            {index !== steps.length - 1 && (
                                                <View style={[styles.timelineLine, { backgroundColor: '#D1D5DB' }]} />
                                            )}
                                        </View>
                                        <View style={styles.timelineContent}>
                                            <Text style={[styles.statusItemText, { color: completed ? colors.text : (colorScheme === 'dark' ? '#9CA3AF' : '#757575') }, completed && { fontWeight: '600' }]}>{s.title}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            ) : null}
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
    contactLockedBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    acceptedBadgeContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    acceptedBadgeText: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: '#E0F2FE',
        color: '#1F41BB',
        fontSize: 16,
        fontWeight: 'bold',
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
    actionButtonDisabled: {
        opacity: 0.6,
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
    ratingSection: {
        marginTop: 30,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#F3F4FF',
    },
    ratingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    ratingStarsRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    ratingStarButton: {
        marginRight: 6,
    },
    ratingCommentBox: {
        marginBottom: 16,
    },
    ratingCommentLabel: {
        fontSize: 14,
        marginBottom: 6,
        color: '#4B5563',
    },
    ratingCommentInputWrapper: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        padding: 8,
        backgroundColor: '#FFF',
    },
    ratingCommentInput: {
        minHeight: 80,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#111827',
    },
    ratingSubmitButton: {
        height: 50,
        borderRadius: 12,
        backgroundColor: '#1F41BB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ratingSubmitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    ratingSubmitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    ratingThankYouText: {
        marginTop: 10,
        fontSize: 14,
        color: '#16A34A',
        fontWeight: '500',
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
