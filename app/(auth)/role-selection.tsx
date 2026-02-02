import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen() {
    const router = useRouter();

    const handleSelectRole = (role: 'customer' | 'laborer') => {
        router.push({ pathname: '/(auth)/signup', params: { role } });
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>

            <Text style={styles.title}>Register as</Text>

            <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleSelectRole('customer')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="person" size={40} color="#0284C7" />
                    </View>
                    <Text style={styles.optionText}>Customer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleSelectRole('laborer')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="construct" size={40} color="#D97706" />
                    </View>
                    <Text style={styles.optionText}>Skilled Laborer</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    backButton: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F41BB',
        textAlign: 'center',
        marginBottom: 50,
    },
    optionsContainer: {
        gap: 20,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
});
