
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LABORERS } from '../../../constants/Laborers';

export default function LaborerProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'About' | 'Reviews'>('About');

    const laborer = LABORERS.find(l => l.id === id);

    if (!laborer) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text>Laborer not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <Image source={{ uri: laborer.image }} style={styles.profileImage} />
                    <View style={styles.profileDetails}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{laborer.name}</Text>
                            {laborer.verified ? (
                                <Ionicons name="checkmark-circle" size={18} color="#00C853" style={styles.verifiedIcon} />
                            ) : null}
                        </View>
                        <Text style={styles.rate}>₹{laborer.hourlyRate}/hour</Text>
                        <View style={styles.ratingRow}>
                            <Text style={styles.rating}>{laborer.rating}</Text>
                            <Ionicons name="star" size={16} color="#FFD700" />
                        </View>
                        <Text style={styles.distance}>{laborer.distance.toFixed(2)} km away</Text>
                    </View>
                </View>

                {/* Actions */}


                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'About' && styles.activeTab]}
                        onPress={() => setActiveTab('About')}
                    >
                        <Text style={[styles.tabText, activeTab === 'About' && styles.activeTabText]}>About</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'Reviews' && styles.activeTab]}
                        onPress={() => setActiveTab('Reviews')}
                    >
                        <Text style={[styles.tabText, activeTab === 'Reviews' && styles.activeTabText]}>Reviews</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.tabContentBg}>
                    {activeTab === 'About' ? (
                        <View style={styles.aboutContent}>
                            <Text style={styles.sectionHeader}>Experienced</Text>
                            {/* Visual design implies just the word "Experienced" or detail? 
                                Screenshot just shows "Experienced" then space then "Services" 
                                Let's assume description or label. 
                                Actually screenshot shows "Experienced" as a label? No it looks like headers.
                            */}

                            <View style={{ height: 20 }} />

                            <Text style={styles.sectionHeader}>Services</Text>
                            <Text style={styles.servicesText}>
                                {laborer.services ? laborer.services.join(', ') : 'General Labor'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.aboutContent}>
                            <Text>Reviews content placeholder</Text>
                        </View>
                    )}
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => router.push({ pathname: '/booking/[laborerId]', params: { laborerId: laborer.id } })}
                >
                    <Text style={styles.bookButtonText}>Book now</Text>
                </TouchableOpacity>
            </View>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    scrollContent: {
        paddingBottom: 100, // Space for footer
    },
    profileSection: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
    },
    profileImage: {
        width: 100,
        height: 100, // Square image
        borderRadius: 8, // Slightly rounded
        marginRight: 20,
        backgroundColor: '#eee',
    },
    profileDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginRight: 5,
    },
    verifiedIcon: {
        marginTop: 2,
    },
    rate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F41BB', // Blue like screenshot
        marginBottom: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        position: 'absolute', // Floating to the right based on screenshot?
        right: 0,
        top: 10,
    },
    rating: {
        fontSize: 16,
        color: '#FFD700',
        fontWeight: 'bold',
        marginRight: 2,
    },
    distance: {
        fontSize: 14,
        color: '#555',
    },

    tabs: {
        flexDirection: 'row',
        backgroundColor: '#E0E0E0', // Gray background for tabs strip
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#1F41BB', // Active blue underline
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    activeTabText: {
        color: '#1F41BB',
    },
    tabContentBg: {
        backgroundColor: '#FFFFFF', // White content
        minHeight: 200,
    },
    aboutContent: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#757575',
        marginBottom: 10,
    },
    servicesText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    bookButton: {
        backgroundColor: '#2A3B8F', // Deep blue
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
