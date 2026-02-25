import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';
import Colors from '../../../constants/Colors';
import { useTheme } from '../../../context/ThemeContext';

export default function AccountScreen() {
    const router = useRouter();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [user, setUser] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            const fetchUser = async () => {
                try {
                    const storedUser = await AsyncStorage.getItem('userData');
                    const userToken = await AsyncStorage.getItem('userToken');
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        setUser(parsedUser);
                        
                        // Fetch fresh data
                        try {
                            const headers: any = {};
                            if (userToken) {
                                headers['Authorization'] = `Bearer ${userToken}`;
                            }

                            const response = await fetch(`${API_URL}/api/users/${parsedUser._id}`, {
                                headers
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
                } catch (error) {
                    console.error('Error loading user:', error);
                }
            };
            fetchUser();
        }, [])
    );

    const getVerificationBadge = () => {
        const status = user?.status || 'unverified';
        if (status === 'approved') {
            return (
                <View style={[styles.unverifiedBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.unverifiedText, { color: '#166534' }]}>Verified</Text>
                </View>
            );
        }
        if (status === 'pending') {
             return (
                 <View style={[styles.unverifiedBadge, { backgroundColor: '#FEF3C7' }]}>
                     <Text style={[styles.unverifiedText, { color: '#D97706' }]}>Pending</Text>
                 </View>
             );
        }
        if (status === 'rejected') {
            return (
                <View style={[styles.unverifiedBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.unverifiedText, { color: '#DC2626' }]}>Rejected</Text>
                </View>
            );
       }
        return (
            <View style={styles.unverifiedBadge}>
                <Text style={styles.unverifiedText}>Unverified</Text>
            </View>
        );
    };

    const menuItems = [
        { id: 'jobs', title: 'My Jobs', icon: 'briefcase-outline', action: () => router.push('/(laborer)/(tabs)/jobs') },
        { 
            id: 'verification', 
            title: 'Verifications', 
            icon: 'shield-checkmark-outline', 
            action: () => router.push('/(laborer)/verification-details'), 
            rightElement: getVerificationBadge() 
        },
        { id: 'settings', title: 'Settings', icon: 'settings-outline', action: () => router.push('/(laborer)/settings') },
        {
            id: 'share', title: 'Share App', icon: 'share-social-outline', action: async () => {
                try {
                    await Share.share({
                        message: 'Check out the Skilled Labor App! Find the best experts for your repairs: https://skilledlabor.com',
                    });
                } catch (error: any) {
                    Alert.alert(error.message);
                }
            }
        },
    ];

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: () => router.replace('/(auth)/role-selection') }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9FAFB' }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Header */}
                <TouchableOpacity
                    style={styles.profileHeader}
                    onPress={() => router.push('/(laborer)/profile/edit')}
                    activeOpacity={0.9}
                >
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user?.profileImage ? `${API_URL}${user.profileImage}` : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.userName}>{user?.name || 'Your Name'}</Text>
                    <Text style={styles.userEmail}>
                        {`${(user?.role || 'laborer').toString().toUpperCase()} • ${
                            user?.categories && user.categories.length > 0
                                ? user.categories.map((cat: any) => typeof cat === 'object' ? cat.name : cat).join(', ')
                                : (user?.category?.name || (typeof user?.category === 'string' ? user.category : 'service'))
                        }`}
                    </Text>
                </TouchableOpacity>

                {/* Menu Section */}
                <View style={[styles.menuContainer, { backgroundColor: colors.background, shadowColor: colorScheme === 'dark' ? '#000' : '#000' }]}>
                    {menuItems.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.action}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconBackground, { backgroundColor: colorScheme === 'dark' ? '#1f1f1f' : '#F0F4FF' }]}>
                                    <Ionicons name={item.icon as any} size={22} color={colors.tint} />
                                </View>
                                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
                            </View>
                            <View style={styles.menuItemRight}>
                                {(item as any).rightElement}
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>
                    ))}

                    <View style={[styles.separator, { backgroundColor: colorScheme === 'dark' ? '#333' : '#F3F4F6' }]} />

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.menuIconBackground, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                            </View>
                            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Logout</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* App Version Info */}
                <Text style={styles.versionText}>Version 1.0.0 (Build 342)</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileHeader: {
        backgroundColor: '#1F41BB',
        paddingVertical: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        shadowColor: '#1F41BB',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#C7D2FE',
    },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unverifiedBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    unverifiedText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
    },
    menuIconBackground: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F0F4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 10,
        marginHorizontal: 15,
    },
    versionText: {
        textAlign: 'center',
        marginTop: 30,
        fontSize: 12,
        color: '#9CA3AF',
    },
});
