
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';

interface BackendSubcategory {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    picture?: string;
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

    const getSubcategoryIconName = (name: string): keyof typeof Ionicons.glyphMap => {
        const normalized = name.toLowerCase();
        if (normalized.includes('door') || normalized.includes('window')) return 'home-outline';
        if (normalized.includes('drawer') || normalized.includes('cabinet')) return 'file-tray-outline';
        if (normalized.includes('sofa') || normalized.includes('polish') || normalized.includes('furniture')) return 'construct-outline';
        if (normalized.includes('repair') || normalized.includes('install')) return 'hammer-outline';
        if (normalized.includes('paint')) return 'color-fill-outline';
        if (normalized.includes('electric')) return 'flash-outline';
        if (normalized.includes('plumb') || normalized.includes('pipe')) return 'water-outline';
        return 'layers-outline';
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
        <TouchableOpacity style={styles.item} onPress={async () => {
            // Load customer location for automatic nearest sorting
            let customerLat = '';
            let customerLng = '';
            try {
                const saved = await AsyncStorage.getItem('customerLocation');
                if (saved) {
                    const loc = JSON.parse(saved);
                    customerLat = String(loc.latitude);
                    customerLng = String(loc.longitude);
                }
            } catch {}
            router.push({
                pathname: '/subcategory/[id]',
                params: { id: item._id, title: item.name, customerLat, customerLng }
            });
        }}>
            <View style={styles.itemLeftSection}>
                <View style={styles.subcategoryIconBox}>
                    {item.picture || item.icon ? (
                        <Image
                            source={{ uri: getImageUrl(item.picture || item.icon || '') }}
                            style={styles.subcategoryIconImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <Ionicons name={getSubcategoryIconName(item.name)} size={18} color="#1F41BB" />
                    )}
                </View>
                <Text style={styles.itemText}>{item.name}</Text>
            </View>
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
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    itemLeftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    subcategoryIconBox: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    subcategoryIconImage: {
        width: 20,
        height: 20,
    },
    itemText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#555',
        flexShrink: 1,
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
