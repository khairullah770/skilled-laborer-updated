import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { API_URL } from '../../../constants/Api';

export default function ProfileEditScreen() {
    const router = useRouter();
    const [customer, setCustomer] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changing, setChanging] = useState(false);

    useEffect(() => {
        const load = async () => {
            const t = await AsyncStorage.getItem('userToken');
            setToken(t);
            if (t) {
                const res = await fetch(`${API_URL}/api/customers/me`, { headers: { Authorization: `Bearer ${t}` } });
                if (res.ok) {
                    const data = await res.json();
                    setCustomer(data);
                }
            }
        };
        load();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        } as any);
        if (!result.canceled) {
            const uri = (result as any).assets?.[0]?.uri;
            if (uri) setAvatarUri(uri);
        }
    };

    const uploadProfileImage = async () => {
        if (!token || !avatarUri) {
            Alert.alert('Select an image first');
            return;
        }
        try {
            setUploading(true);
            const form = new FormData();
            const filename = avatarUri.split('/').pop() || 'profile.jpg';
            form.append('profileImage', {
                uri: avatarUri,
                name: filename,
                type: 'image/jpeg',
            } as any);
            const res = await fetch(`${API_URL}/api/customers/me/profile-image`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: form,
            });
            const data = await res.json();
            if (res.ok) {
                const updated = { ...customer, profileImage: data.profileImage };
                setCustomer(updated);
                await AsyncStorage.setItem('userData', JSON.stringify(updated));
                Alert.alert('Success', 'Profile picture updated');
            } else {
                Alert.alert('Error', data?.message || 'Upload failed');
            }
        } catch (e: any) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!token) return;
        if (!newPassword || newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        try {
            setChanging(true);
            const res = await fetch(`${API_URL}/api/customers/me/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ oldPassword: currentPassword, newPassword, confirmPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                Alert.alert('Success', 'Password updated');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Error', data?.message || 'Failed to update password');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setChanging(false);
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
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 40 }} /> {/* Spacer */}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Profile Picture Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: avatarUri || (customer?.profileImage ? `${API_URL}${customer.profileImage}` : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png') }}
                                style={styles.avatar}
                            />
                            <TouchableOpacity style={styles.cameraBadge} onPress={pickImage}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.changePhotoText}>Change Profile Picture</Text>
                        <Button text={uploading ? 'Uploading...' : 'Update Profile Picture'} onPress={uploadProfileImage} disabled={uploading || !avatarUri} />
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <Input label="Full Name" value={customer?.name || ''} editable={false} />
                        <Input label="Email Address" value={customer?.email || ''} editable={false} />
                        <Input label="Phone Number" value={customer?.phone || ''} editable={false} />

                        <View style={{ height: 20 }} />
                        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#030f39ff' }}>Change Password</Text>
                        <Input label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter current password" secureTextEntry />
                        <Input label="New Password" value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" secureTextEntry />
                        <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" secureTextEntry />
                        <Button text={changing ? 'Updating...' : 'Change Password'} onPress={handleChangePassword} disabled={changing} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingVertical: 20,
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
        marginTop: 9,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 30,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#F0F4FF',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#1F41BB',
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    changePhotoText: {
        marginTop: 12,
        fontSize: 14,
        color: '#1F41BB',
        fontWeight: '600',
    },
    formSection: {
        marginBottom: 20,
    },
    passwordContainer: {
        position: 'relative',
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        bottom: 12,
        height: 50,
        justifyContent: 'center',
    },
    footer: {
        marginTop: 10,
    },
});
