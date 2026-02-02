import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function LoginScreen() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Implement auth logic here
        // For now, simple navigation
        router.replace('/(tabs)');
    };

    const handleCreateAccount = () => {
        router.push('/(auth)/signup');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.logoSection}>
                        <Image
                            source={require('../../assets/images/login-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.title}>WELCOME BACK</Text>

                    <View style={styles.form}>
                        <Input
                            label="Enter phone number"
                            prefix="+92"
                            placeholder=""
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />

                        <Input
                            label="Enter password"
                            placeholder=""
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <View style={styles.spacer} />

                        <Button text="login" onPress={handleLogin} />

                        <Button
                            text="Register"
                            type="secondary"
                            onPress={() => router.push('/(auth)/role-selection')}
                            style={styles.createButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
        flexGrow: 1,
    },
    header: {
        alignItems: 'flex-start',
    },
    backButton: {
        padding: 10,
        marginLeft: -10,
    },
    logoSection: {
        alignItems: 'center',
        marginVertical: 0,   // reduce vertical space
        marginTop: -20,     // move upward
        height: 200,        // give more room for bigger logo
    },
    logo: {
        width: 240,
        height: 240,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F41BB',
        textAlign: 'center',
        marginBottom: 40,
    },
    form: {
        width: '100%',
    },
    spacer: {
        height: 20,
    },
    createButton: {
        backgroundColor: '#E5E7EB',
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
        textAlign: 'left',   // <-- force left
        alignSelf: 'flex-start',
        paddingLeft: 6,
    }

});
