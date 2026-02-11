import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';

export default function VerificationDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${API_URL}/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setUser(data);
    } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to fetch user details');
    } finally {
        setLoading(false);
    }
  };

  const handleApprove = async () => {
    Alert.alert(
        'Confirm Approval',
        'Are you sure you want to approve this laborer?',
        [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Approve', 
                onPress: () => updateStatus('approved')
            }
        ]
    );
  };

  const handleReject = () => {
    setRejectModalVisible(true);
  };

  const confirmReject = () => {
      if (!rejectionReason.trim()) {
          Alert.alert('Error', 'Please provide a reason for rejection');
          return;
      }
      updateStatus('rejected', rejectionReason);
      setRejectModalVisible(false);
  };

  const updateStatus = async (status: string, reason?: string) => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${API_URL}/api/users/${id}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ status, rejectionReason: reason })
        });

        if (response.ok) {
            Alert.alert('Success', `Laborer has been ${status}`);
            router.back();
        } else {
            const error = await response.json();
            Alert.alert('Error', error.message || 'Failed to update status');
        }
      } catch (error) {
          console.error(error);
          Alert.alert('Error', 'Network error occurred');
      } finally {
          setLoading(false);
      }
  };

  if (loading) {
      return (
          <SafeAreaView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1F41BB" />
          </SafeAreaView>
      );
  }

  if (!user) {
      return (
          <SafeAreaView style={styles.loadingContainer}>
              <Text>User not found</Text>
          </SafeAreaView>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
            <View style={styles.profileHeader}>
                {user.profileImage ? (
                    <Image source={{ uri: `${API_URL}${user.profileImage}` }} style={styles.avatar} />
                ) : (
                    <Ionicons name="person-circle" size={80} color="#ccc" />
                )}
                <View style={styles.profileInfo}>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.role}>{user.role}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: user.status === 'approved' ? '#D1FAE5' : '#FEF3C7' }]}>
                        <Text style={[styles.statusText, { color: user.status === 'approved' ? '#065F46' : '#D97706' }]}>
                            {user.status?.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phone} />
            <InfoRow label="Date of Birth" value={user.dob} />
            <InfoRow label="Address" value={user.address} />
        </View>

        {/* Professional Info */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <InfoRow label="Experience" value={user.experience} />
            <View style={styles.row}>
                <Text style={styles.label}>Categories:</Text>
                <View style={styles.categoriesContainer}>
                    {user.categories && user.categories.map((cat: any, index: number) => (
                        <View key={index} style={styles.categoryChip}>
                            <Text style={styles.categoryText}>{cat.name || cat}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <Text style={styles.subTitle}>ID Card / Passport</Text>
            {user.idCardImage ? (
                <Image 
                    source={{ uri: `${API_URL}${user.idCardImage}` }} 
                    style={styles.documentImage} 
                    resizeMode="contain"
                />
            ) : (
                <View style={styles.noDoc}>
                    <Text>No ID Card uploaded</Text>
                </View>
            )}
        </View>

        {/* History */}
        {user.verificationHistory && user.verificationHistory.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>History</Text>
                {user.verificationHistory.map((item: any, index: number) => (
                    <View key={index} style={styles.historyItem}>
                        <Text style={styles.historyStatus}>{item.status}</Text>
                        <Text style={styles.historyReason}>{item.reason}</Text>
                        <Text style={styles.historyDate}>{new Date(item.timestamp).toLocaleString()}</Text>
                    </View>
                ))}
            </View>
        )}

      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={handleReject}>
            <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={handleApprove}>
            <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>

      {/* Rejection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rejectModalVisible}
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Reject Verification</Text>
                <Text style={styles.modalSubtitle}>Please provide a reason for rejection:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Reason (e.g., ID card blurry)"
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                />
                <View style={styles.modalButtons}>
                    <TouchableOpacity 
                        style={[styles.modalButton, styles.cancelButton]} 
                        onPress={() => setRejectModalVisible(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.modalButton, styles.confirmButton]} 
                        onPress={confirmReject}
                    >
                        <Text style={styles.confirmButtonText}>Confirm Rejection</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: any) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  content: { padding: 16, paddingBottom: 100 },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16 },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  role: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  subTitle: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  label: { width: 100, fontSize: 14, color: '#6B7280', fontWeight: '500' },
  value: { flex: 1, fontSize: 14, color: '#1F2937' },
  categoriesContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  categoryChip: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  categoryText: { color: '#4F46E5', fontSize: 12 },
  documentImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#F3F4F6' },
  noDoc: { width: '100%', height: 100, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: { flex: 1, padding: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rejectButton: { backgroundColor: '#EF4444' },
  approveButton: { backgroundColor: '#10B981' },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  cancelButton: { backgroundColor: '#F3F4F6' },
  confirmButton: { backgroundColor: '#EF4444' },
  cancelButtonText: { color: '#374151', fontWeight: '600' },
  confirmButtonText: { color: '#FFF', fontWeight: '600' },
  
  historyItem: { borderLeftWidth: 2, borderLeftColor: '#E5E7EB', paddingLeft: 12, marginBottom: 12 },
  historyStatus: { fontWeight: '600', fontSize: 14 },
  historyReason: { color: '#6B7280', fontSize: 13 },
  historyDate: { color: '#9CA3AF', fontSize: 12 },
});
