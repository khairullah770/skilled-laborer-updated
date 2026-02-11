import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../constants/Api';
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsScreen() {
    const router = useRouter();
    const { theme, setTheme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchUserProfile();
        }, [])
    );

    const fetchUserProfile = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            const parsedUser = userData ? JSON.parse(userData) : null;
            
            if (parsedUser && parsedUser._id) {
                 const response = await fetch(`${API_URL}/api/users?_id=${parsedUser._id}`);
                 const data = await response.json();
                 if (data && data.length > 0) {
                     setUser(data[0]);
                     // Update AsyncStorage to keep it fresh
                     const updatedUserData = { ...parsedUser, ...data[0] };
                     await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
                 }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const themeOptions = [
        { id: 'light', title: 'Light Mode', icon: 'sunny-outline' },
        { id: 'dark', title: 'Dark Mode', icon: 'moon-outline' },
        { id: 'system', title: 'Use System Settings', icon: 'phone-portrait-outline' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#10B981';
            case 'rejected': return '#EF4444';
            case 'pending': return '#F59E0B';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved': return 'Verified';
            case 'rejected': return 'Rejected';
            case 'pending': return 'Verification Pending';
            default: return 'Unverified';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Settings', headerShown: false }} />

            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]}>
                    <Ionicons name="arrow-back" size={24} color={colors.tint} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.tint }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 20 }} />
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account Status</Text>
                        <View style={[styles.statusContainer, { backgroundColor: colorScheme === 'dark' ? '#1f1f1f' : '#F9FAFB' }]}>
                            <View style={styles.statusHeader}>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user?.status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(user?.status) }]}>
                                        {getStatusText(user?.status)}
                                    </Text>
                                </View>
                            </View>
                            
                            <Text style={[styles.statusDescription, { color: colors.text }]}>
                                {user?.status === 'unverified' 
                                    ? 'Complete your profile verification to start accepting jobs.' 
                                    : user?.status === 'pending'
                                    ? 'Your documents are under review. We will notify you once approved.'
                                    : user?.status === 'approved'
                                    ? 'Your account is verified. You can now accept jobs.'
                                    : 'Your verification was rejected. Please contact support.'}
                            </Text>

                            {user?.status === 'unverified' && (
                                <TouchableOpacity 
                                    style={[styles.verifyButton, { backgroundColor: colors.tint }]}
                                    onPress={() => router.push('/(laborer)/verification-details')}
                                >
                                    <Text style={styles.verifyButtonText}>Submit for Verification</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                    <View style={[styles.optionsContainer, { backgroundColor: colorScheme === 'dark' ? '#1f1f1f' : '#F9FAFB' }]}>
                        {themeOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionItem,
                                    theme === option.id && styles.optionItemSelected,
                                    theme === option.id && colorScheme === 'dark' && { backgroundColor: '#333' }
                                ]}
                                onPress={() => setTheme(option.id as any)}
                            >
                                <View style={styles.optionLeft}>
                                    <View style={[
                                        styles.iconBackground,
                                        theme === option.id && styles.iconBackgroundSelected,
                                        theme !== option.id && colorScheme === 'dark' && { backgroundColor: '#444' }
                                    ]}>
                                        <Ionicons
                                            name={option.icon as any}
                                            size={22}
                                            color={theme === option.id ? '#FFFFFF' : colors.tint}
                                        />
                                    </View>
                                    <Text style={[
                                        styles.optionText,
                                        { color: colorScheme === 'dark' ? '#fff' : '#374151' },
                                        theme === option.id && styles.optionTextSelected,
                                        theme === option.id && { color: colors.tint }
                                    ]}>
                                        {option.title}
                                    </Text>
                                </View>
                                {theme === option.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background, borderColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]}>
                        <Text style={[styles.menuItemText, { color: colors.text }]}>Push Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background, borderColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]}>
                        <Text style={[styles.menuItemText, { color: colors.text }]}>Email Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background, borderColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]}>
                        <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.background, borderColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]}>
                        <Text style={[styles.menuItemText, { color: colors.text }]}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        marginTop: 35,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
        marginLeft: 5,
    },
    optionsContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 15,
        marginBottom: 5,
    },
    optionItemSelected: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#1F41BB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBackground: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F0F4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    iconBackgroundSelected: {
        backgroundColor: '#1F41BB',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    optionTextSelected: {
        color: '#1F41BB',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
    statusContainer: {
        borderRadius: 20,
        padding: 20,
        backgroundColor: '#F9FAFB',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    statusDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 15,
    },
    verifyButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
