import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { API_URL } from '../../../constants/Api';

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'password'>('personal');
    
    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwordLoading, setPasswordLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchUserProfile();
        }, [])
    );

    const fetchUserProfile = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            const userToken = await AsyncStorage.getItem('userToken');
            
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                
                // Fetch fresh data
                if (parsedUser._id && userToken) {
                    try {
                        const response = await fetch(`${API_URL}/api/users/${parsedUser._id}`, {
                            headers: { 'Authorization': `Bearer ${userToken}` }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            setUser(data);
                            await AsyncStorage.setItem('userData', JSON.stringify(data));
                        }
                    } catch (err) {
                        console.log('Error fetching fresh user data:', err);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePassword = async () => {
        const trimmedCurrent = currentPassword.trim();
        const trimmedNew = newPassword.trim();
        const trimmedConfirm = confirmPassword.trim();

        if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
            Alert.alert("Error", "Please fill in all password fields.");
            return;
        }
        if (trimmedNew !== trimmedConfirm) {
            Alert.alert("Error", "New passwords do not match.");
            return;
        }
        if (trimmedNew.length < 6) {
            Alert.alert("Error", "New password must be at least 6 characters long.");
            return;
        }

        setPasswordLoading(true);
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/api/users/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    currentPassword: trimmedCurrent,
                    newPassword: trimmedNew
                })
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(
                    "Success",
                    "Password updated successfully.",
                    [{ text: "OK", onPress: () => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setActiveTab('personal');
                    }}]
                );
            } else {
                Alert.alert("Error", data.message || "Failed to update password.");
            }
        } catch (error) {
            console.error('Password update error:', error);
            Alert.alert("Error", "Network error. Please try again later.");
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#1F41BB" />
            </SafeAreaView>
        );
    }

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
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Profile Picture */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {user?.profileImage ? (
                                <Image
                                    source={{ uri: `${API_URL}${user.profileImage}` }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <Image
                                    source={{ uri: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                                    style={styles.avatar}
                                />
                            )}
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            onPress={() => setActiveTab('personal')} 
                            style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
                                Personal information
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setActiveTab('password')} 
                            style={[styles.tab, activeTab === 'password' && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                                Change password
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'personal' ? (
                        <View style={styles.sectionContainer}>
                            <Input
                                label="Full Name"
                                value={user?.name}
                                editable={false}
                                placeholder="Enter full name"
                            />
                            <Input
                                label="Email Address"
                                value={user?.email}
                                editable={false}
                                placeholder="Enter email"
                            />
                            <Input
                                label="Phone Number"
                                value={user?.phone}
                                editable={false}
                                placeholder="Enter phone number"
                            />
                            <Input
                                label="Date of Birth"
                                value={user?.dob}
                                editable={false}
                                placeholder="DD/MM/YYYY"
                            />
                            <Input
                                label="Address"
                                value={user?.address}
                                editable={false}
                                placeholder="Enter full address"
                                multiline
                                inputContainerStyle={{ height: 80, alignItems: 'flex-start', paddingTop: 10 }}
                                style={{ textAlignVertical: 'top' }}
                            />
                             <Input
                                label="Categories / Skills"
                                value={user?.categories && user.categories.length > 0
                                    ? user.categories.map((cat: any) => typeof cat === 'object' ? cat.name : cat).join(', ')
                                    : (user?.category?.name || (typeof user?.category === 'string' ? user.category : ''))}
                                editable={false}
                                placeholder="Categories"
                            />
                            <Input
                                label="Years of Experience"
                                value={user?.experience}
                                editable={false}
                                placeholder="Enter experience"
                            />
                        </View>
                    ) : (
                        <View style={styles.sectionContainer}>
                            <View style={styles.passwordContainer}>
                                <Input
                                    label="Current Password"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Enter current password"
                                    secureTextEntry={!showCurrentPassword}
                                    style={{ flex: 1 }}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    <Ionicons
                                        name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                                        size={24}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.passwordContainer}>
                                <Input
                                    label="New Password"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter new password"
                                    secureTextEntry={!showNewPassword}
                                    style={{ flex: 1 }}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Ionicons
                                        name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                                        size={24}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.passwordContainer}>
                                <Input
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm new password"
                                    secureTextEntry={!showConfirmPassword}
                                    style={{ flex: 1 }}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        size={24}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.footer}>
                                <Button
                                    text={passwordLoading ? "Updating..." : "Change Password"}
                                    onPress={handleSavePassword}
                                    disabled={passwordLoading}
                                />
                            </View>
                        </View>
                    )}
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 20,
        paddingBottom: 20,
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
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#F0F4FF',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginHorizontal: 10,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#1F41BB',
    },
    tabText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#1F41BB',
        fontWeight: 'bold',
    },
    sectionContainer: {
        marginBottom: 10,
    },
    passwordContainer: {
        position: 'relative',
        marginBottom: 0, 
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: 48,
        zIndex: 10,
    },
    footer: {
        marginTop: 20,
    },
});
