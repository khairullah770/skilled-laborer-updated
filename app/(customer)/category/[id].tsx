
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';

interface BackendSubcategory {
    _id: string;
    name: string;
    description?: string;
}

interface BackendCategory {
    _id: string;
    name: string;
    icon: string;
    subcategories: BackendSubcategory[];
}

export default function CategoryDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [category, setCategory] = useState<BackendCategory | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchCategory();
        }
    }, [id]);

    const fetchCategory = async () => {
        try {
            console.log('Fetching category with ID:', id);
            const response = await fetch(`${API_URL}/api/categories/${id}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched category data:', JSON.stringify(data, null, 2));
                setCategory(data);
            } else {
                console.error('Category not found');
            }
        } catch (error) {
            console.error('Error fetching category:', error);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return undefined;
        const normalizedPath = path.replace(/\\/g, '/');
        return `${API_URL}/${normalizedPath}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1F41BB" />
                </View>
            </SafeAreaView>
        );
    }

    if (!category) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
                <View style={styles.center}>
                    <Text>Category not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderItem = ({ item }: { item: BackendSubcategory }) => (
        <TouchableOpacity style={styles.item} onPress={() => {
            router.push({
                pathname: '/subcategory/[id]',
                params: { id: item._id, title: item.name }
            });
        }}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={24} color="#000" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.titleSection}>
                <Image 
                    source={{ uri: getImageUrl(category.icon) }} 
                    style={styles.categoryIcon}
                    resizeMode="contain"
                />
                <Text style={styles.title}>{category.name}</Text>
            </View>

            <FlatList
                data={category.subcategories}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No subcategories available</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 10,
    },
    categoryIcon: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    listContent: {
        paddingHorizontal: 0,
        flexGrow: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    itemText: {
        fontSize: 16,
        color: '#555',
    },
    separator: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginTop: 20,
    },
});
