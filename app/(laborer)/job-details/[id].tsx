import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Simulate job data based on ID (mock)
  // In a real app, this would come from an API or global state
  const [status, setStatus] = useState<'pending' | 'accepted' | 'in_progress' | 'completed'>('pending');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const jobDetails = {
    customerName: "Khairullah khaliq",
    date: "10 Dec, Tuesday",
    time: "6:30 PM",
    address: "Khayban e sir syed",
    category: "Wiring and Rewiring",
    description: "I need to rewire my living room. The switch board is sparking and needs immediate attention. Please bring your own tools.",
    images: [
        'https://picsum.photos/200/300',
        'https://picsum.photos/200/301',
        'https://picsum.photos/200/302'
    ]
  };
  
  // Initialize status based on some logic if needed, for now default to pending for demo
  // or randomize it if id matches certain values
  useEffect(() => {
    if (id === '3') setStatus('completed');
    else if (id === '1') setStatus('pending'); // Reset to pending for demo of flow
    // else setStatus('pending');
  }, [id]);

  const handleAccept = () => setStatus('accepted');
  const handleCancel = () => {
    Alert.alert("Job Cancelled", "You have cancelled this job.");
    router.back();
  };
  const handleStart = () => setStatus('in_progress');
  const handleEnd = () => setStatus('completed');

  const renderStep = (label: string, isCompleted: boolean, isLast: boolean) => (
    <View style={styles.stepContainer}>
      <View style={styles.stepIndicatorContainer}>
        {isCompleted ? (
            <View style={styles.checkedCircle}>
                <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
        ) : (
            <View style={styles.uncheckedCircle} />
        )}
        {!isLast && <View style={[styles.stepLine, isCompleted ? styles.stepLineActive : null]} />}
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );

  const isAccepted = status === 'accepted' || status === 'in_progress' || status === 'completed';
  const isInProgress = status === 'in_progress' || status === 'completed';
  const isCompleted = status === 'completed';

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Info */}
        <View style={styles.customerCard}>
          <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.avatar} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>Khairullah khaliq</Text>
            <Text style={styles.dateText}>10</Text>
            <Text style={styles.dateText}>Dec, Tuesday 6:30 PM</Text>
          </View>
          <View style={styles.contactIcons}>
            <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
            {isAccepted && (
                 <TouchableOpacity style={[styles.iconButton, styles.chatButton]}>
                    <Ionicons name="chatbubble" size={20} color="#fff" />
                </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Address</Text>
            <Text style={styles.addressText}>Khayban e sir syed</Text>
            <Ionicons name="location" size={24} color="#1F2937" />
        </View>

        {/* View Details Button (Only in pending state per image 1) */}
        {status === 'pending' && (
            <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => setDetailsModalVisible(true)}
            >
                <Text style={styles.viewDetailsText}>view details</Text>
            </TouchableOpacity>
        )}

        {/* Status Banner */}
        {status === 'in_progress' && (
             <View style={styles.statusBanner}>
                <Text style={styles.statusBannerText}>job started</Text>
             </View>
        )}
        {status === 'completed' && (
             <View style={[styles.statusBanner, styles.completedBanner]}>
                <Text style={styles.statusBannerText}>Job Completed</Text>
             </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
            {status === 'pending' && (
                <>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                        <Text style={styles.acceptButtonText}>Accept Job</Text>
                    </TouchableOpacity>
                </>
            )}
            {status === 'accepted' && (
                 <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                    <Text style={styles.startButtonText}>Start job</Text>
                </TouchableOpacity>
            )}
            {status === 'in_progress' && (
                 <TouchableOpacity style={styles.endButton} onPress={handleEnd}>
                    <Text style={styles.endButtonText}>End job</Text>
                </TouchableOpacity>
            )}
             {/* No buttons for completed state */}
        </View>

        {/* Stepper */}
        <View style={styles.stepperContainer}>
            <Text style={styles.stepperTitle}>Job Status</Text>
            <View style={styles.stepsWrapper}>
                {renderStep("Job Accepted", isAccepted, false)}
                {renderStep("Job In progress", isInProgress, false)}
                {renderStep("Job Completed", isCompleted, true)}
            </View>
        </View>

      </ScrollView>

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
                            <Text style={styles.categoryText}>{jobDetails.category}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Description</Text>
                        <Text style={styles.detailText}>{jobDetails.description}</Text>
                    </View>

                    {/* Date & Time */}
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Date & Time</Text>
                        <View style={styles.dateTimeRow}>
                            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                            <Text style={styles.dateTimeText}>{jobDetails.date} at {jobDetails.time}</Text>
                        </View>
                    </View>

                    {/* Address */}
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Location</Text>
                        <View style={styles.dateTimeRow}>
                            <Ionicons name="location-outline" size={18} color="#6B7280" />
                            <Text style={styles.dateTimeText}>{jobDetails.address}</Text>
                        </View>
                    </View>

                    {/* Images */}
                    <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Images</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                            {jobDetails.images.map((img, index) => (
                                <Image key={index} source={{ uri: img }} style={styles.detailImage} />
                            ))}
                        </ScrollView>
                    </View>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
    backgroundColor: '#3B82F6', // Blue color for phone
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  chatButton: {
      backgroundColor: '#6366F1', // Indigo for chat
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
  viewDetailsButton: {
      backgroundColor: '#1E40AF', // Dark blue
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
      backgroundColor: '#9CA3AF', // Gray
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
  },
  completedBanner: {
      backgroundColor: '#9CA3AF', // Or maybe green/blue based on design? Image shows gray background similar to "job started"
  },
  statusBannerText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '500',
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
  startButton: {
      flex: 1,
      backgroundColor: '#1E40AF',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
  },
  startButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
  endButton: {
      flex: 1,
      backgroundColor: '#1E40AF',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
  },
  endButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
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
      height: 80, // Height for line
  },
  stepIndicatorContainer: {
      alignItems: 'center',
      marginRight: 15,
  },
  checkedCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#84CC16', // Green
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
  },
  uncheckedCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#E5E7EB', // Gray
      zIndex: 1,
  },
  stepLine: {
      width: 2,
      flex: 1,
      backgroundColor: '#E5E7EB',
      marginTop: -2, // Connect to circle
      marginBottom: -2,
  },
  stepLineActive: {
      backgroundColor: '#E5E7EB',
  },
  stepLabel: {
      fontSize: 16,
      color: '#000',
      fontWeight: '500',
      marginTop: 2, // Align with circle
  },
});
