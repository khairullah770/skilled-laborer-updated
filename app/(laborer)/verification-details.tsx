import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { API_URL } from '../../constants/Api';
// Removed static CATEGORIES import as we will fetch from API
// import { CATEGORIES } from '../../constants/Categories'; 

interface Category {
    _id: string; // Backend uses _id
    name: string; // Backend uses name
    icon: string; // Backend returns file path
    subcategories: any[];
}

export default function VerificationDetailsScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [dobDate, setDobDate] = useState(new Date()); // For DatePicker
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [address, setAddress] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
    
    const [experience, setExperience] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [idCardImage, setIdCardImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

    const [status, setStatus] = useState<'unverified' | 'pending' | 'approved' | 'rejected'>('unverified');
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    useEffect(() => {
        fetchUserProfile();
        fetchCategories();
        
        // Poll for status updates if pending
        const interval = setInterval(() => {
            fetchUserProfile(true);
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchCategories = async () => {
        setIsCategoriesLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            } else {
                console.log('Failed to fetch categories');
                Alert.alert('Error', 'Failed to load categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            Alert.alert('Error', 'Network error while fetching categories');
        } finally {
            setIsCategoriesLoading(false);
        }
    };

    const formatPhoneNumber = (text: string) => {
        // Strip non-digits
        let cleaned = text.replace(/\D/g, '');
        
        // Remove leading 0 if present
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        // Remove 92 prefix if user typed it
        if (cleaned.startsWith('92')) {
            cleaned = cleaned.substring(2);
        }

        // Limit to 10 digits
        const limited = cleaned.slice(0, 10);
        
        // Format as 300 1234567
        if (limited.length > 3) {
            return `${limited.slice(0, 3)} ${limited.slice(3)}`;
        }
        return limited;
    };

    const handlePhoneChange = (text: string) => {
        const formatted = formatPhoneNumber(text);
        setPhone(formatted);
        // Real-time validation
        if (formatted.replace(/\s/g, '').length === 10) {
            setErrors(prev => ({ ...prev, phone: '' }));
        } else {
             setErrors(prev => ({ ...prev, phone: 'Phone number must be exactly 10 digits' }));
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDobDate(selectedDate);
            // Format DD/MM/YYYY
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDate.getFullYear();
            setDob(`${day}/${month}/${year}`);
            setErrors(prev => ({ ...prev, dob: '' }));
        }
    };

    const getMinDate = () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 100);
        return d;
    };

    const getMaxDate = () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d;
    };

    const fetchUserProfile = async (isPolling = false) => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            const userToken = await AsyncStorage.getItem('userToken');
            const parsedUser = userData ? JSON.parse(userData) : null;
            
            if (parsedUser) {
                // If fetching via polling, get fresh data from API
                if (isPolling && parsedUser._id) {
                    try {
                        const headers: any = {};
                        if (userToken) {
                            headers['Authorization'] = `Bearer ${userToken}`;
                        }

                        const response = await fetch(`${API_URL}/api/users/${parsedUser._id}`, {
                            headers
                        });
                        if (response.ok) {
                            const latestUser = await response.json();
                            // Update local state if status changed
                            if (latestUser.status !== parsedUser.status) {
                                const updatedUser = { ...parsedUser, ...latestUser };
                                await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
                                setStatus(latestUser.status || 'unverified');
                                
                                // Update rejection reason
                                if (latestUser.verificationHistory && latestUser.verificationHistory.length > 0) {
                                    const lastEntry = latestUser.verificationHistory[latestUser.verificationHistory.length - 1];
                                    if (lastEntry.status === 'rejected' && lastEntry.reason) {
                                        setRejectionReason(lastEntry.reason);
                                    }
                                }
                            }
                        }
                    } catch (apiError) {
                        console.log('Polling error:', apiError);
                    }
                } else {
                     setFullName(parsedUser.name || '');
                     if (parsedUser.phone) {
                        setPhone(formatPhoneNumber(parsedUser.phone));
                     }
                     setEmail(parsedUser.email || '');
                     setStatus(parsedUser.status || 'unverified');
                     
                     // Get latest rejection reason if available
                     if (parsedUser.verificationHistory && parsedUser.verificationHistory.length > 0) {
                        const lastEntry = parsedUser.verificationHistory[parsedUser.verificationHistory.length - 1];
                        if (lastEntry.status === 'rejected' && lastEntry.reason) {
                            setRejectionReason(lastEntry.reason);
                        }
                     }
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleCategory = (id: string) => {
        if (selectedCategoryIds.includes(id)) {
            setSelectedCategoryIds([]);
            setErrors(prev => ({ ...prev, categories: '' }));
        } else {
            // Restrict to single selection
            setSelectedCategoryIds([id]);
            setErrors(prev => ({ ...prev, categories: '' }));
        }
    };

    const getSelectedCategoryNames = () => {
        const names = categories
            .filter(cat => selectedCategoryIds.includes(cat._id))
            .map(cat => cat.name);

        if (names.length === 0) return '';
        return names.join(', ');
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const pickIdCardImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setIdCardImage(result.assets[0].uri);
        }
    };

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async () => {
        const newErrors: {[key: string]: string} = {};
        
        if (!profileImage) {
            Alert.alert('Error', 'Profile picture is missing');
            return;
        }

        if (!fullName) {
            Alert.alert('Error', 'Full Name is missing');
            setErrors({ fullName: 'Full Name is required' });
            return;
        }
        
        if (!email) {
            Alert.alert('Error', 'Email address is missing');
            setErrors({ email: 'Email address is required' });
            return;
        } else if (!validateEmail(email)) {
            Alert.alert('Error', 'Invalid email address');
            setErrors({ email: 'Please enter a valid email address' });
            return;
        }

        if (!phone) {
            Alert.alert('Error', 'Phone Number is missing');
            setErrors({ phone: 'Phone Number is required' });
            return;
        } else if (phone.replace(/\s/g, '').length !== 10) {
            Alert.alert('Error', 'Phone number must be exactly 10 digits');
            setErrors({ phone: 'Phone number must be exactly 10 digits' });
            return;
        }

        if (!dob) {
            Alert.alert('Error', 'Date of Birth is missing');
            setErrors({ dob: 'Date of Birth is required' });
            return;
        }

        if (!address) {
            Alert.alert('Error', 'Address is missing');
            setErrors({ address: 'Address is required' });
            return;
        }

        if (selectedCategoryIds.length === 0) {
            Alert.alert('Error', 'Category selection is missing');
            setErrors({ categories: 'Please select at least one category' });
            return;
        }

        if (!experience) {
            Alert.alert('Error', 'Experience is missing');
            setErrors({ experience: 'Experience is required' });
            return;
        }

        if (!idCardImage) {
            Alert.alert('Error', 'ID Card / Passport image is missing');
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            const userData = await AsyncStorage.getItem('userData');
            const userToken = await AsyncStorage.getItem('userToken');
            
            console.log('Submitting verification details...');
            console.log('User Token present:', !!userToken);

            const parsedUser = userData ? JSON.parse(userData) : null;
            
            if (!parsedUser || !parsedUser._id) {
                Alert.alert('Error', 'User not found');
                return;
            }

            if (!userToken) {
                Alert.alert('Error', 'Session expired. Please login again.');
                // Redirect to login
                router.replace('/(auth)/laborer-login'); 
                return;
            }

            const formData = new FormData();
            formData.append('name', fullName);
            formData.append('email', email);
            formData.append('phone', `+92${phone.replace(/\s/g, '')}`);
            formData.append('dob', dob);
            formData.append('address', address);
            formData.append('experience', experience);
            formData.append('categories', JSON.stringify(selectedCategoryIds));

            if (profileImage) {
                const filename = profileImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                
                formData.append('profileImage', {
                    uri: profileImage,
                    name: filename || 'profile.jpg',
                    type,
                } as any);
            }

            if (idCardImage) {
                const filename = idCardImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                
                formData.append('idCardImage', {
                    uri: idCardImage,
                    name: filename || 'idcard.jpg',
                    type,
                } as any);
            }

            const response = await fetch(`${API_URL}/api/users/${parsedUser._id}/verification`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    // 'Content-Type': 'multipart/form-data', // Do NOT set this manually
                    'Authorization': `Bearer ${userToken}`
                },
                body: formData,
            });
            
            const data = await response.json();
            
            if (response.ok) {
                 // Do NOT update userData with the full data returned from verification submission
                 // Only update the status to 'pending' in the local storage so the UI reflects the submission
                 const updatedUser = { ...parsedUser, status: 'pending' };
                 await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
                 setStatus('pending');
                 
                Alert.alert(
                    "Submission Successful",
                    "Your verification details have been submitted for review. Admin will be notified immediately.",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            } else {
                throw new Error(data.message || 'Submission failed');
            }
        } catch (error: any) {
             console.error('Submission Error:', error);
             Alert.alert(
                'Submission Failed',
                `Error: ${error.message}. Would you like to try again?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Retry', onPress: () => handleSubmit() }
                ]
             );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F41BB" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Verification Details</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {status === 'pending' && (
                        <View style={{ backgroundColor: '#FEF3C7', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                            <Text style={{ color: '#D97706', fontWeight: 'bold', fontSize: 16 }}>Verification Pending</Text>
                            <Text style={{ color: '#92400E', marginTop: 5 }}>
                                Your verification request is currently under review by our admin team. You cannot make changes or submit a new request at this time.
                            </Text>
                        </View>
                    )}

                    {status === 'approved' && (
                        <View style={{ backgroundColor: '#D1FAE5', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                            <Text style={{ color: '#059669', fontWeight: 'bold', fontSize: 16 }}>Verified Account</Text>
                            <Text style={{ color: '#065F46', marginTop: 5 }}>
                                Congratulations! Your account has been verified.
                            </Text>
                        </View>
                    )}

                    {status === 'rejected' && (
                        <View style={{ backgroundColor: '#FEE2E2', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                            <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 16 }}>Verification Rejected</Text>
                            <Text style={{ color: '#991B1B', marginTop: 5 }}>
                                Your previous verification request was rejected. Please review your details and submit again.
                            </Text>
                            {rejectionReason && (
                                <Text style={{ color: '#991B1B', marginTop: 10, fontStyle: 'italic' }}>
                                    Reason: "{rejectionReason}"
                                </Text>
                            )}
                        </View>
                    )}

                    {(status === 'unverified' || status === 'rejected') ? (
                    <>
                    <Text style={styles.description}>
                        Please provide your accurate details as per your official documents for verification.
                    </Text>

                    <View style={styles.profileImageContainer}>
                        <TouchableOpacity onPress={pickImage} style={styles.profileImageButton}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.profileImage} />


                            ) : (
                                <View style={styles.profileImagePlaceholder}>
                                    <Ionicons name="camera" size={40} color="#1F41BB" />
                                    <Text style={styles.addPhotoText}>Add Photo</Text>
                                </View>
                            )}
                            <View style={styles.editIconContainer}>
                                <Ionicons name="pencil" size={16} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formSection}>
                        <Input
                            label="Full Name (as per ID)"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter full name"
                        />
                        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

                        <Input
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email address"
                            editable={true}
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        <Input
                            label="Phone Number"
                            value={phone}
                            onChangeText={handlePhoneChange}
                            placeholder="300 1234567"
                            keyboardType="phone-pad"
                            prefix="+92"
                            maxLength={11} // 10 digits + space
                        />
                        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                             <View pointerEvents="none">
                                <Input
                                    label="Date of Birth"
                                    value={dob}
                                    placeholder="DD/MM/YYYY"
                                    editable={false}
                                    suffix={<Ionicons name="calendar" size={20} color="#666" style={{ marginRight: 15 }} />}
                                />
                             </View>
                        </TouchableOpacity>
                        {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
                        
                        {showDatePicker && Platform.OS === 'android' && (
                            <RNDateTimePicker
                                value={dobDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                maximumDate={getMaxDate()}
                                minimumDate={getMinDate()}
                            />
                        )}
                        {showDatePicker && Platform.OS === 'ios' && (
                             <Modal
                                visible={showDatePicker}
                                transparent={true}
                                animationType="slide"
                             >
                                <View style={styles.modalOverlay}>
                                    <View style={[styles.modalContent, { padding: 0 }]}>
                                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', padding: 10, backgroundColor: '#f0f0f0', borderTopLeftRadius: 20, borderTopRightRadius: 20}}>
                                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                <Text style={{color: '#007AFF', fontSize: 16, fontWeight: 'bold'}}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <RNDateTimePicker
                                            value={dobDate}
                                            mode="date"
                                            display="spinner"
                                            onChange={handleDateChange}
                                            maximumDate={getMaxDate()}
                                            minimumDate={getMinDate()}
                                            style={{height: 200, backgroundColor: 'white'}}
                                        />
                                    </View>
                                </View>
                             </Modal>
                        )}

                        <Input
                            label="Address"
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Enter full address"
                            multiline
                            inputContainerStyle={{ height: 100, alignItems: 'flex-start', paddingTop: 10 }}
                            style={{ textAlignVertical: 'top' }}
                        />
                        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Category / Skill</Text>
                            <TouchableOpacity
                                onPress={() => setIsCategoryModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <View pointerEvents="none">
                                    <Input
                                        placeholder="Select Category / Skill"
                                        value={getSelectedCategoryNames()}
                                        editable={false}
                                        suffix={<Ionicons name="chevron-down" size={20} color="#666" style={{ marginRight: 15 }} />}
                                    />
                                </View>
                            </TouchableOpacity>
                            <Text style={{fontSize: 12, color: '#666', marginTop: 5, marginLeft: 5}}>
                                {selectedCategoryIds.length} of 1 category selected
                            </Text>
                        </View>
                        {errors.categories && <Text style={styles.errorText}>{errors.categories}</Text>}

                        <Input
                            label="Years of Experience"
                            value={experience}
                            onChangeText={setExperience}
                            placeholder="Enter years of experience"
                            keyboardType="numeric"
                        />
                        {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}

                        <View style={styles.uploadSection}>
                            <Text style={styles.uploadLabel}>Identification Documents</Text>
                            <TouchableOpacity style={styles.uploadButton} onPress={pickIdCardImage}>
                                <Ionicons name={idCardImage ? "checkmark-circle" : "cloud-upload-outline"} size={24} color={idCardImage ? "#10B981" : "#1F41BB"} />
                                <Text style={[styles.uploadButtonText, idCardImage && { color: '#10B981' }]}>
                                    {idCardImage ? "ID Card Selected" : "Upload ID Card / Passport"}
                                </Text>
                            </TouchableOpacity>
                            {idCardImage && (
                                <Image source={{ uri: idCardImage }} style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 8, resizeMode: 'cover' }} />
                            )}
                        </View>
                    </View>

                    <Button
                        text={loading ? "Submitting..." : "Submit for Verification"}
                        onPress={handleSubmit}
                        disabled={loading}
                        style={{ marginTop: 20, marginBottom: 40 }}
                    />
                    </>
                    ) : null}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Category Modal */}
            <Modal
                visible={isCategoryModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsCategoryModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Your Skill</Text>
                            <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {isCategoriesLoading ? (
                            <ActivityIndicator size="large" color="#1F41BB" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={categories}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item }) => {
                                    const isSelected = selectedCategoryIds.includes(item._id);
                                    const isAnyOtherSelected = selectedCategoryIds.length > 0 && !isSelected;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.categoryItem, 
                                                isSelected && styles.categoryItemSelected,
                                                isAnyOtherSelected && { opacity: 0.5 }
                                            ]}
                                            onPress={() => toggleCategory(item._id)}
                                            disabled={isAnyOtherSelected}
                                        >
                                            <View style={[styles.categoryIconBox, isSelected && styles.categoryIconBoxSelected]}>
                                                {item.icon && (item.icon.includes('/') || item.icon.includes('\\')) ? (
                                                    <Image 
                                                        source={{ uri: `${API_URL}/${item.icon.replace(/\\/g, '/')}` }} 
                                                        style={{ width: 24, height: 24, tintColor: isSelected ? '#FFF' : '#1F41BB' }}
                                                        resizeMode="contain"
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name={(item.icon as any) || 'briefcase-outline'}
                                                        size={20}
                                                        color={isSelected ? '#FFF' : '#1F41BB'}
                                                    />
                                                )}
                                            </View>
                                            <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                                                {item.name}
                                            </Text>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={20} color="#1F41BB" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 30, // Reduced from 60 to improve vertical alignment
        paddingBottom: 15, // Reduced from 20
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F41BB',
        marginTop: 2, // Slight adjustment for vertical alignment
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 20,
        marginBottom: 20,
        lineHeight: 20,
    },
    formSection: {
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: '#1F41BB',
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 10,
    },
    uploadSection: {
        marginTop: 10,
        marginBottom: 10,
    },
    uploadLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    uploadButton: {
        borderWidth: 1,
        borderColor: '#1F41BB',
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F4FF',
        flexDirection: 'row',
        gap: 10,
    },
    uploadButtonText: {
        color: '#1F41BB',
        fontWeight: '600',
        marginLeft: 10,
    },
    footer: {
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoryIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    categoryText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    categoryItemSelected: {
        backgroundColor: '#F0F4FF',
    },
    categoryIconBoxSelected: {
        backgroundColor: '#1F41BB',
    },
    categoryTextSelected: {
        fontWeight: '600',
        color: '#1F41BB',
    },
    modalDoneButton: {
        backgroundColor: '#1F41BB',
        margin: 24,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalDoneButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileImageButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1F41BB',
        position: 'relative',
        overflow: 'visible',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    profileImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    addPhotoText: {
        marginTop: 5,
        color: '#1F41BB',
        fontSize: 12,
        fontWeight: '600',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#1F41BB',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: -5,
        marginBottom: 10,
        marginLeft: 5,
    },
});
