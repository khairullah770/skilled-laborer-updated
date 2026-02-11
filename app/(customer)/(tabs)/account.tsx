import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../../constants/Colors';
import { useTheme } from '../../../context/ThemeContext';

export default function AccountScreen() {
    const router = useRouter();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const menuItems = [
        { id: 'orders', title: 'My Orders', icon: 'cart-outline', action: () => router.push('/(customer)/(tabs)/bookings') },
        { id: 'settings', title: 'Settings', icon: 'settings-outline', action: () => router.push('/settings') },
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
                    onPress={() => router.push('/profile/edit')}
                    activeOpacity={0.9}
                >
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://i.pravatar.cc/150?u=user123' }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editBadge} onPress={() => router.push('/profile/edit')}>
                            <Ionicons name="pencil" size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>KhairUllah</Text>
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
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981',
        padding: 6,
        borderRadius: 15,
        borderWidth: 3,
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
        marginTop: -25, // Overlap the header
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
