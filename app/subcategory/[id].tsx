
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LaborerCard from '../../components/LaborerCard';
import { LABORERS } from '../../constants/Laborers';

export default function SubCategoryDetailsScreen() {
    const { id, title } = useLocalSearchParams();
    const router = useRouter();

    // In a real app, we would filter by subCategory ID. 
    // For demo purposes, we might show all or filter if we assigned IDs in mock data.
    // Let's filter if possible, or show all if none match just to show data.
    const filteredLaborers = LABORERS.filter(l => l.subCategoryId === id);
    const displayLaborers = filteredLaborers.length > 0 ? filteredLaborers : LABORERS;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || 'Laborers'}</Text>
                <View style={{ width: 24 }} /> {/* Placeholder for balance */}
            </View>

            <FlatList
                data={displayLaborers}
                renderItem={({ item }) => (
                    <LaborerCard
                        laborer={item}
                        onPress={() => router.push({ pathname: '/laborer/[id]', params: { id: item.id } })}
                    />
                )}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
            />
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
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    listContent: {
        padding: 15,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
});
