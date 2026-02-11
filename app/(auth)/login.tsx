import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function LoginScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ role?: string }>();

    const initialRole: 'customer' | 'laborer' =
        params.role === 'laborer' ? 'laborer' : 'customer';

    // Role comes from previous screen; UI is designed for customer login style
    const [selectedRole] = useState<'customer' | 'laborer'>(initialRole);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Implement auth logic here
        // Navigate based on selected role
        if (selectedRole === 'customer') {
            router.replace('/(customer)/(tabs)/home');
        } else {
            // Laborer flow (placeholder route for now)
            router.replace('/(laborer)');
        }
    };

    const handleCreateAccount = () => {
        router.push('/(auth)/signup');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <View style={styles.logoSection}>
                            <Image
                                source={require('../../assets/images/login-logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.continueText}>CONTINUE WITH</Text>

                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={22} color="#DB4437" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                            </TouchableOpacity>

                        </View>

                        <View style={styles.form}>
                            <Input
                                label="Email"
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />

                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />

                            <TouchableOpacity style={styles.forgotPasswordContainer}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <View style={styles.spacer} />

                            <Button
                                text="Login"
                                onPress={handleLogin}
                                style={styles.loginButton}
                            />
                        </View>

                        <View style={styles.footerTextContainer}>
                            <Text style={styles.footerText}>
                                Don&apos;t have an account?{' '}
                                <Text style={styles.footerLink} onPress={handleCreateAccount}>
                                    Sign Up Here
                                </Text>
                            </Text>
                        </View>
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
        paddingHorizontal: 24,
        paddingVertical: 32,
        flexGrow: 1,
        justifyContent: 'center',
    },
    card: {
        width: '100%',
        borderRadius: 0,
        paddingHorizontal: 0,
        paddingVertical: 0,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logo: {
        width: 210,
        height: 210,
    },
    appTitle: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#111827',
        textAlign: 'center',
    },
    appSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F41BB',
        textAlign: 'center',
        marginBottom: 24,
    },
    continueText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    socialButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    form: {
        width: '100%',
    },
    spacer: {
        height: 20,
    },
    loginButton: {
        marginTop: 4,
        borderRadius: 24,
    },
    footerTextContainer: {
        marginTop: 16,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    footerLink: {
        color: '#1f41bb',
        fontWeight: '600',
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginTop: 8,
        marginBottom: 8,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#1F41BB',
        fontWeight: '600',
    },
});
