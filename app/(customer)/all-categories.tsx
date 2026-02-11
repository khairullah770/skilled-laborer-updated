import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ServiceCard from '../../components/ServiceCard';
import { API_URL } from '../../constants/Api';

interface BackendCategory {
    _id: string;
    name: string;
    icon: string;
}

export default function AllCategoriesScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<BackendCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/api/categories`);
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return undefined;
        const normalizedPath = path.replace(/\\/g, '/');
        return `${API_URL}/${normalizedPath}`;
    };

    const renderItem = ({ item }: { item: BackendCategory }) => (
        <ServiceCard
            title={item.name}
            imageUrl={getImageUrl(item.icon)}
            onPress={() => router.push({ pathname: '/category/[id]', params: { id: item._id } })}
        />
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F41BB" />
                    </TouchableOpacity>
                    <Text style={styles.title}>All Categories</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1F41BB" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F41BB" />
                </TouchableOpacity>
                <Text style={styles.title}>All Categories</Text>
                <View style={{ width: 40 }} /> {/* Spacing balance */}
            </View>

            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                numColumns={3}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F41BB',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingTop: 20,
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
});
