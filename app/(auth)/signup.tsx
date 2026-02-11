import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function SignupScreen() {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        password: '',
        confirmPassword: '',
    });
    const [acceptTerms, setAcceptTerms] = useState(false);

    const handleSignup = () => {
        // Validation logic can go here
        router.push({
            pathname: '/(auth)/verification',
            params: {
                email: form.email,
                target: '/(customer)/(tabs)/home'
            }
        });
    };

    const handleLogin = () => {
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/login-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>SIGN UP HERE</Text>
                    </View>

                    <Text style={styles.continueText}>CONTINUE WITH</Text>
                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialIcon}>
                            <Ionicons name="logo-google" size={28} color="#EA4335" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}>
                            <Ionicons name="logo-facebook" size={28} color="#1877F2" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}>
                            <Ionicons name="mail" size={28} color="#4285F4" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.row}>
                            <Input
                                placeholder="First Name"
                                value={form.firstName}
                                onChangeText={(t) => setForm({ ...form, firstName: t })}
                                containerStyle={styles.halfInput}
                                inputContainerStyle={styles.roundedInput}
                            />
                            <Input
                                placeholder="Last Name"
                                value={form.lastName}
                                onChangeText={(t) => setForm({ ...form, lastName: t })}
                                containerStyle={styles.halfInput}
                                inputContainerStyle={styles.roundedInput}
                            />
                        </View>

                        <Input
                            placeholder="Email"
                            keyboardType="email-address"
                            value={form.email}
                            onChangeText={(t) => setForm({ ...form, email: t })}
                            inputContainerStyle={styles.roundedInput}
                        />

                        <Input
                            placeholder="Address"
                            value={form.address}
                            onChangeText={(t) => setForm({ ...form, address: t })}
                            inputContainerStyle={styles.roundedInput}
                        />

                        <Input
                            placeholder="Password"
                            secureTextEntry
                            value={form.password}
                            onChangeText={(t) => setForm({ ...form, password: t })}
                            inputContainerStyle={styles.roundedInput}
                        />

                        <Input
                            placeholder="Confirm Password"
                            secureTextEntry
                            value={form.confirmPassword}
                            onChangeText={(t) => setForm({ ...form, confirmPassword: t })}
                            inputContainerStyle={styles.roundedInput}
                        />

                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setAcceptTerms(!acceptTerms)}
                        >
                            <View style={[styles.checkbox, acceptTerms && styles.checkboxSelected]}>
                                {acceptTerms && <Ionicons name="checkmark" size={12} color="#FFF" />}
                            </View>
                            <Text style={styles.checkboxLabel}>Accept terms and policy</Text>
                        </TouchableOpacity>

                        <Button
                            text="Sign Up"
                            onPress={handleSignup}
                            style={styles.signupButton}
                            textStyle={styles.signupButtonText}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={handleLogin}>
                                <Text style={styles.loginLink}> Login Here</Text>
                            </TouchableOpacity>
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
        paddingBottom: 40,
    },
    header: {
        alignItems: 'flex-start',
        marginTop: 20,
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
        marginLeft: -10, // Adjust for logo padding if needed
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginTop: 10,
        alignSelf: 'center', // Keep title centered if that's preferred, or let it follow header
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
        gap: 20,
        marginBottom: 25,
    },
    socialIcon: {
        padding: 5,
    },
    form: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    halfInput: {
        width: '48%',
    },
    roundedInput: {
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#333',
        height: 50,
        paddingHorizontal: 20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
        marginLeft: 10,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 3,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#1F41BB',
        borderColor: '#1F41BB',
    },
    checkboxLabel: {
        fontSize: 12,
        color: '#666',
    },
    signupButton: {
        backgroundColor: '#1F41BB',
        borderRadius: 30,
        height: 55,
        marginTop: 10,
    },
    signupButtonText: {
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 25,
    },
    footerText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    loginLink: {
        fontSize: 14,
        color: '#1F41BB',
        fontWeight: '700',
        marginTop: 5,
    },
});
