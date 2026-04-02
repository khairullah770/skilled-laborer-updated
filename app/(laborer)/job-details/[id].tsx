import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';

const { width } = Dimensions.get('window');

type JobStatus = 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

type PickupRecommendation = {
  spareParts: string[];
  requiredTools: string[];
  optionalSafetyItems: string[];
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<JobStatus>('pending');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);
  const [pickupRecommendation, setPickupRecommendation] = useState<PickupRecommendation | null>(null);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Missing booking id.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/bookings/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          if (res.status === 404) {
            setStatus('cancelled');
            setBooking(null);
            setLoading(false);
            return;
          }
          const txt = await res.text();
          setError(txt || 'Failed to load job details.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setBooking(data);
        const normalized = normalizeStatus(data.status);
        setStatus(normalized);
      } catch (e) {
        setError('Network error while loading job.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAccept = async () => {
    if (!id || !booking) return;
    if (status !== 'pending') {
      Alert.alert('Cannot accept', 'Only pending jobs can be accepted.');
      return;
    }
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Not signed in', 'Please sign in again to accept jobs.');
        return;
      }
      const res = await fetch(`${API_URL}/api/bookings/${id}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        Alert.alert('Error', txt || 'Failed to accept booking.');
        return;
      }
      const updated = await res.json();
      setBooking(updated);
      const normalized = normalizeStatus(updated.status);
      setStatus(normalized);
      Alert.alert('Job Accepted', 'You have accepted this job.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Network error while accepting booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    if (!id || !booking) return;
    Alert.alert(
      'Cancel Job',
      'Are you sure you want to cancel this job?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                Alert.alert('Not signed in', 'Please sign in again to cancel jobs.');
                return;
              }
              const res = await fetch(`${API_URL}/api/bookings/${id}/decline`, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
              });
              if (!res.ok) {
                const txt = await res.text();
                Alert.alert('Error', txt || 'Failed to cancel job.');
                return;
              }
              const updated = await res.json();
              setBooking(updated);
              const normalized = normalizeStatus(updated.status);
              setStatus(normalized);
              Alert.alert('Job Cancelled', 'You have cancelled this job.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (e) {
              Alert.alert('Error', 'Network error while cancelling job.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleGo = async () => {
    if (!id || !booking) return;
    if (status !== 'accepted') {
      Alert.alert('Cannot start travel', 'Only accepted jobs can be set to on the way.');
      return;
    }
    try {
      setPickupLoading(true);
      setPickupModalVisible(true);
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/bookings/${id}/pickup-recommendations`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load AI pickup recommendations.');
      }

      const data = await res.json();
      setPickupRecommendation({
        spareParts: Array.isArray(data?.spareParts) ? data.spareParts : [],
        requiredTools: Array.isArray(data?.requiredTools) ? data.requiredTools : [],
        optionalSafetyItems: Array.isArray(data?.optionalSafetyItems)
          ? data.optionalSafetyItems
          : [],
      });
    } catch (err: any) {
      setPickupRecommendation(
        getPickupRecommendation(booking?.service, booking?.serviceDescription),
      );
      Alert.alert('AI recommendation unavailable', 'Using default pickup checklist for this service.');
    } finally {
      setPickupLoading(false);
    }
  };

  const handlePickupConfirmed = async () => {
    if (!id || !booking) return;
    if (status !== 'accepted') {
      Alert.alert('Cannot start travel', 'Only accepted jobs can be set to on the way.');
      return;
    }
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Not signed in', 'Please sign in again.');
        return;
      }
      const res = await fetch(`${API_URL}/api/bookings/${id}/go`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        Alert.alert('Error', txt || 'Failed to update status.');
        return;
      }
      const updated = await res.json();
      setBooking(updated);
      const normalized = normalizeStatus(updated.status);
      setStatus(normalized);
      setPickupModalVisible(false);
      Alert.alert('On the Way', 'You are now on the way to the customer.');
    } catch (e) {
      Alert.alert('Error', 'Network error while updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrived = async () => {
    if (!id || !booking) return;
    if (status !== 'on_the_way') {
      Alert.alert('Cannot mark arrived', 'Only on-the-way jobs can be marked as arrived.');
      return;
    }
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Not signed in', 'Please sign in again.');
        return;
      }
      const res = await fetch(`${API_URL}/api/bookings/${id}/arrived`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        Alert.alert('Error', txt || 'Failed to update status.');
        return;
      }
      const updated = await res.json();
      setBooking(updated);
      const normalized = normalizeStatus(updated.status);
      setStatus(normalized);
      Alert.alert('Arrived', 'You have arrived at the customer location.');
    } catch (e) {
      Alert.alert('Error', 'Network error while updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    if (!id || !booking) return;
    if (status !== 'arrived') {
      Alert.alert('Cannot start', 'Only arrived jobs can be started.');
      return;
    }
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Not signed in', 'Please sign in again to start jobs.');
        return;
      }
      const res = await fetch(`${API_URL}/api/bookings/${id}/start`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        Alert.alert('Error', txt || 'Failed to start job.');
        return;
      }
      const updated = await res.json();
      setBooking(updated);
      const normalized = normalizeStatus(updated.status);
      setStatus(normalized);
      Alert.alert('Job Started', 'You have started this job.');
    } catch (e) {
      Alert.alert('Error', 'Network error while starting job.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = () => {
    if (!id || !booking) return;
    if (status !== 'in_progress') {
      Alert.alert('Cannot complete', 'Only in-progress jobs can be completed.');
      return;
    }
    Alert.alert(
      'Complete Job',
      'Are you sure you want to complete this job and get paid?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              setActionLoading(true);
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                Alert.alert('Not signed in', 'Please sign in again to complete jobs.');
                return;
              }
              const res = await fetch(`${API_URL}/api/bookings/${id}/complete`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) {
                const txt = await res.text();
                Alert.alert('Error', txt || 'Failed to complete job.');
                return;
              }
              const updated = await res.json();
              setBooking(updated);
              const normalized = normalizeStatus(updated.status);
              setStatus(normalized);
              Alert.alert('Job Completed', 'You have completed this job and will get paid.');
            } catch (e) {
              Alert.alert('Error', 'Network error while completing job.');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderStep = (label: string, isCompleted: boolean, isActive: boolean, isLast: boolean) => {
    const isCompletedStatusStep = label === 'Job Completed' && (isActive || isCompleted);

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepIndicatorContainer}>
          {isCompletedStatusStep ? (
            <View style={styles.completedActiveCircle}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          ) : isCompleted ? (
            <View style={styles.checkedCircle}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          ) : isActive ? (
            <View style={styles.activeCircle}>
              <View style={styles.activeCircleInner} />
            </View>
          ) : (
            <View style={styles.uncheckedCircle} />
          )}
          {!isLast && <View style={[styles.stepLine, (isCompleted || isCompletedStatusStep) ? styles.stepLineActive : null]} />}
        </View>
        <Text
          style={[
            styles.stepLabel,
            isActive && styles.stepLabelActive,
            isCompleted && styles.stepLabelCompleted,
            isCompletedStatusStep && styles.stepLabelCompletedGreen,
          ]}
        >
          {label}
        </Text>
      </View>
    );
  };

  // Step completion logic for the 5-step stepper
  const stepStatuses: JobStatus[] = ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'];
  const currentStepIndex = stepStatuses.indexOf(status);

  const isStepCompleted = (stepStatus: JobStatus) => {
    const stepIdx = stepStatuses.indexOf(stepStatus);
    return currentStepIndex > stepIdx;
  };
  const isStepActive = (stepStatus: JobStatus) => {
    return status === stepStatus;
  };

  // For showing contact icons
  const showContactIcons = ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(status);

  const customer = booking?.customer;
  const location = booking?.location || {};
  const scheduledAt = booking?.scheduledAt ? new Date(booking.scheduledAt) : null;
  const serviceDescription = booking?.serviceDescription || '';
  const category = booking?.service || '';

  const formattedDate = scheduledAt
    ? scheduledAt.toLocaleDateString(undefined, { day: '2-digit', month: 'short', weekday: 'short' })
    : '';
  const formattedTime = scheduledAt
    ? scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const handleOpenMap = () => {
    if (!location.latitude || !location.longitude) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(url).catch(() => { });
  };

  const handleOpenWhatsApp = async () => {
    const raw = customer?.phone as string | undefined;
    if (!raw) {
      Alert.alert('No phone number', 'Customer phone number is not available.');
      return;
    }
    const digits = raw.replace(/[^\d+]/g, '');
    if (!digits) {
      Alert.alert('Invalid phone', 'Customer phone number is invalid.');
      return;
    }
    try {
      await Linking.openURL(`tel:${digits}`);
    } catch {
      Alert.alert('Error', 'Unable to make a call.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: "Job Detail",
        headerTitleAlign: 'center',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </TouchableOpacity>
        ),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#fff' }
      }} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F41BB" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : !booking && status === 'cancelled' ? (
        <View style={styles.errorContainer}>
          <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 16 }}>
            <Text style={{ color: '#DC2626', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Cancelled</Text>
          </View>
          <Text style={[styles.errorText, { color: '#6B7280' }]}>This booking was cancelled by the customer before it was approved.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : !booking ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Job not found.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Customer Info */}
            <View style={styles.customerCard}>
              <Image
                source={{
                  uri: customer?.profileImage ? `${API_URL}${customer.profileImage}` : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
                }}
                style={styles.avatar}
              />
              <View style={styles.customerInfo}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.customerName}>{customer?.name || 'Customer'}</Text>
                <Text style={styles.dateText}>{formattedDate}</Text>
                <Text style={styles.dateText}>{formattedTime}</Text>
              </View>
              <View style={styles.contactIcons}>
                {showContactIcons && (
                  <TouchableOpacity style={styles.iconButton} onPress={handleOpenWhatsApp} activeOpacity={0.7}>
                    <Ionicons name="call" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
                {showContactIcons && (
                  <TouchableOpacity
                    style={[styles.iconButton, styles.chatButton]}
                    activeOpacity={0.7}
                    onPress={() => {
                      router.push({
                        pathname: '/(laborer)/conversation/[id]',
                        params: { id: String(id), bookingId: String(id), name: customer?.name || 'Customer' },
                      } as any);
                    }}
                  >
                    <Ionicons name="chatbubble" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Address</Text>
              <Text style={styles.addressText}>{location.address || 'No address provided'}</Text>
              <TouchableOpacity onPress={handleOpenMap}>
                <Ionicons name="location" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Service & Price Info */}
            <View style={styles.serviceInfoContainer}>
              <View style={styles.serviceInfoRow}>
                <Ionicons name="construct-outline" size={20} color="#6B7280" />
                <Text style={styles.serviceInfoLabel}>Service</Text>
                <Text style={styles.serviceInfoValue}>{category || 'N/A'}</Text>
              </View>
              <View style={styles.serviceInfoDivider} />
              <View style={styles.serviceInfoRow}>
                <Ionicons name="cash-outline" size={20} color="#6B7280" />
                <Text style={styles.serviceInfoLabel}>Total Price</Text>
                <Text style={styles.serviceInfoPrice}>Rs. {booking?.compensation ?? booking?.price ?? '—'}</Text>
              </View>
            </View>

            {/* Cancelled Banner */}
            {status === 'cancelled' && (
              <View style={[styles.statusBanner, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.statusBannerText, { color: '#DC2626' }]}>Cancelled</Text>
              </View>
            )}

            {/* View Details Button (Only in pending state) */}
            {status === 'pending' && (
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => setDetailsModalVisible(true)}
              >
                <Text style={styles.viewDetailsText}>view details</Text>
              </TouchableOpacity>
            )}

            {/* Status Banners */}
            {status === 'on_the_way' && (
              <View style={[styles.statusBanner, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="car-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.statusBannerText}>On the Way</Text>
              </View>
            )}
            {status === 'arrived' && (
              <View style={[styles.statusBanner, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="location-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.statusBannerText}>Arrived at Location</Text>
              </View>
            )}
            {status === 'in_progress' && (
              <View style={[styles.statusBanner, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="hammer-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.statusBannerText}>Job In Progress</Text>
              </View>
            )}
            {status === 'completed' && (
              <View style={[styles.statusBanner, styles.completedBanner]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.statusBannerText}>Job Completed</Text>
              </View>
            )}

            {/* Action Buttons - hidden for cancelled and completed bookings */}
            {status !== 'cancelled' && status !== 'completed' && (
              <View style={styles.actionButtonsContainer}>
                {status === 'pending' && (
                  <>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={actionLoading}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.acceptButton, actionLoading ? { opacity: 0.6 } : null]}
                      onPress={handleAccept}
                      disabled={actionLoading}
                    >
                      <Text style={styles.acceptButtonText}>Accept Job</Text>
                    </TouchableOpacity>
                  </>
                )}
                {status === 'accepted' && (
                  <TouchableOpacity
                    style={[styles.goButton, actionLoading ? { opacity: 0.6 } : null]}
                    onPress={handleGo}
                    disabled={actionLoading}
                  >
                    <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.goButtonText}>GO</Text>
                  </TouchableOpacity>
                )}
                {status === 'on_the_way' && (
                  <TouchableOpacity
                    style={[styles.arrivedButton, actionLoading ? { opacity: 0.6 } : null]}
                    onPress={handleArrived}
                    disabled={actionLoading}
                  >
                    <Ionicons name="location" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.arrivedButtonText}>Arrived</Text>
                  </TouchableOpacity>
                )}
                {status === 'arrived' && (
                  <TouchableOpacity
                    style={[styles.startButton, actionLoading ? { opacity: 0.6 } : null]}
                    onPress={handleStart}
                    disabled={actionLoading}
                  >
                    <Ionicons name="play" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.startButtonText}>Start Job</Text>
                  </TouchableOpacity>
                )}
                {status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.endButton, actionLoading ? { opacity: 0.6 } : null]}
                    onPress={handleEnd}
                    disabled={actionLoading}
                  >
                    <Ionicons name="checkmark-done" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.endButtonText}>Complete Job</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 5-Step Stepper */}
            <View style={styles.stepperContainer}>
              <Text style={styles.stepperTitle}>Job Status</Text>
              <View style={styles.stepsWrapper}>
                {renderStep("Job Accepted", isStepCompleted('accepted'), isStepActive('accepted'), false)}
                {renderStep("On the Way", isStepCompleted('on_the_way'), isStepActive('on_the_way'), false)}
                {renderStep("Arrived", isStepCompleted('arrived'), isStepActive('arrived'), false)}
                {renderStep("Job In Progress", isStepCompleted('in_progress'), isStepActive('in_progress'), false)}
                {renderStep("Job Completed", isStepCompleted('completed'), isStepActive('completed'), true)}
              </View>
            </View>

          </ScrollView>

          <Modal
            animationType="fade"
            transparent={true}
            visible={pickupModalVisible}
            onRequestClose={() => {
              if (!actionLoading) setPickupModalVisible(false);
            }}
          >
            <View style={styles.pickupModalOverlay}>
              <View style={styles.pickupModalContent}>
                <Text style={styles.pickupModalTitle}>AI Pickup Recommendation</Text>
                <Text style={styles.pickupModalSubtitle}>
                  Service: {booking?.service || 'General Service'}
                </Text>

                {pickupLoading ? (
                  <View style={styles.pickupLoadingContainer}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.pickupLoadingText}>Getting AI recommendations...</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.pickupListWrapper} showsVerticalScrollIndicator={false}>
                    <Text style={styles.pickupSectionTitle}>Suggested Spare Parts</Text>
                    {(pickupRecommendation?.spareParts || []).map((item, index) => (
                      <Text key={`spare-${index}`} style={styles.pickupListItem}>• {item}</Text>
                    ))}

                    <Text style={styles.pickupSectionTitle}>Required Tools</Text>
                    {(pickupRecommendation?.requiredTools || []).map((item, index) => (
                      <Text key={`tool-${index}`} style={styles.pickupListItem}>• {item}</Text>
                    ))}

                    <Text style={styles.pickupSectionTitle}>Optional Safety Items</Text>
                    {(pickupRecommendation?.optionalSafetyItems || []).map((item, index) => (
                      <Text key={`safety-${index}`} style={styles.pickupListItem}>• {item}</Text>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.pickupButtonsRow}>
                  <TouchableOpacity
                    style={[styles.pickupButton, styles.pickupCancelButton, actionLoading ? { opacity: 0.6 } : null]}
                    onPress={() => setPickupModalVisible(false)}
                    disabled={actionLoading || pickupLoading}
                  >
                    <Text style={styles.pickupCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickupButton, styles.pickupConfirmButton, (actionLoading || pickupLoading) ? { opacity: 0.7 } : null]}
                    onPress={handlePickupConfirmed}
                    disabled={actionLoading || pickupLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.pickupConfirmText}>Picked Up</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Job Details Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={detailsModalVisible}
            onRequestClose={() => setDetailsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Job Details</Text>
                  <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Category */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{category}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailText}>{serviceDescription || 'No description provided.'}</Text>
                  </View>

                  {/* Date & Time */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <View style={styles.dateTimeRow}>
                      <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                      <Text style={styles.dateTimeText}>{formattedDate} {formattedTime ? `at ${formattedTime}` : ''}</Text>
                    </View>
                  </View>

                  {/* Address */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <View style={styles.dateTimeRow}>
                      <Ionicons name="location-outline" size={18} color="#6B7280" />
                      <Text style={styles.dateTimeText}>{location.address || 'No address provided'}</Text>
                    </View>
                  </View>

                  {/* Work Photos */}
                  {Array.isArray(booking?.workPhotos) && booking.workPhotos.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Work Photos</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                        {booking.workPhotos.map((photo: string, idx: number) => (
                          <Image
                            key={idx}
                            source={{ uri: `${API_URL}${photo}` }}
                            style={styles.detailImage}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    </View>
                  )}

                </ScrollView>

                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Text style={styles.closeModalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}

    </SafeAreaView>
  );
}

const normalizeStatus = (status: string): JobStatus => {
  const s = (status || '').toLowerCase();
  if (s === 'pending' || s === 'waiting for laborer approval' || s === 'waiting_for_laborer_approval' || s === 'waiting for approval') {
    return 'pending';
  }
  if (s === 'accepted') return 'accepted';
  if (s === 'on the way' || s === 'on_the_way') return 'on_the_way';
  if (s === 'arrived') return 'arrived';
  if (s === 'in progress' || s === 'in_progress') return 'in_progress';
  if (s === 'completed') return 'completed';
  if (s === 'cancelled' || s === 'declined') return 'cancelled';
  return 'pending';
};

const getPickupRecommendation = (service?: string, serviceDescription?: string): PickupRecommendation => {
  const selectedService = (service || serviceDescription || 'selected service').trim();

  return {
    spareParts: [
      `${selectedService} compatible replacement parts`,
      `${selectedService} installation consumables`,
      'Extra connectors, sealants, and fasteners',
    ],
    requiredTools: [
      `${selectedService} standard toolkit`,
      'Primary diagnostic tool for this service',
      'Adjustment and installation tools',
    ],
    optionalSafetyItems: [
      'Work gloves',
      'Protective eyewear',
      'Task-specific safety mask',
    ],
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1F41BB',
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickupModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickupModalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  pickupModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pickupModalSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  pickupListWrapper: {
    maxHeight: 340,
  },
  pickupSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 10,
    marginBottom: 6,
  },
  pickupLoadingContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupLoadingText: {
    marginTop: 10,
    color: '#475569',
    fontSize: 14,
  },
  pickupListItem: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  pickupButtonsRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  pickupButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupCancelButton: {
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  pickupConfirmButton: {
    backgroundColor: '#2563EB',
  },
  pickupCancelText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 15,
  },
  pickupConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  categoryText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 15,
    flex: 1,
  },
  imagesContainer: {
    flexDirection: 'row',
  },
  detailImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#E5E7EB',
  },
  closeModalButton: {
    backgroundColor: '#1F41BB',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  scrollContent: {
    padding: 20,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#ccc',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  contactIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  chatButton: {
    backgroundColor: '#6366F1',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
  },
  serviceInfoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfoLabel: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  serviceInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
    textAlign: 'right',
  },
  serviceInfoPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  serviceInfoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  viewDetailsButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBanner: {
    backgroundColor: '#9CA3AF',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
  },
  completedBanner: {
    backgroundColor: '#10B981',
  },
  statusBannerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  goButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  goButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrivedButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  arrivedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  endButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepperContainer: {
    marginTop: 10,
  },
  stepperTitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
  },
  stepsWrapper: {
    paddingLeft: 10,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 65,
  },
  stepIndicatorContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  checkedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#84CC16',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  completedActiveCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  uncheckedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: -2,
    marginBottom: -2,
  },
  stepLineActive: {
    backgroundColor: '#84CC16',
  },
  stepLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  stepLabelActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  stepLabelCompleted: {
    color: '#000',
    fontWeight: '500',
  },
  stepLabelCompletedGreen: {
    color: '#16A34A',
    fontWeight: '700',
  },
});
