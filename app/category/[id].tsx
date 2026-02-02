
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, SubCategory } from '../../constants/Categories';

export default function CategoryDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const category = CATEGORIES.find(c => c.id === id);

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

    const renderItem = ({ item }: { item: SubCategory }) => (
        <TouchableOpacity style={styles.item} onPress={() => {
            router.push({
                pathname: '/subcategory/[id]',
                params: { id: item.id, title: item.title }
            });
        }}>
            <Text style={styles.itemText}>{item.title}</Text>
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
                <Ionicons name={category.icon} size={80} color="#000" style={styles.icon} />
                <Text style={styles.title}>{category.title}</Text>
            </View>

            <FlatList
                data={category.subCategories}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 10,
    },
    icon: {
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    listContent: {
        paddingHorizontal: 0,
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
});
