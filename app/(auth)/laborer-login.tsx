import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { API_URL } from '../../constants/Api';

export default function LaborerLoginScreen() {
    const router = useRouter();

    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
    const [loading, setLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // Validation State
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Visibility State
    const [showPassword, setShowPassword] = useState(false);

    // Regex Patterns
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    
    // Email Validation
    const validateEmail = (text: string) => {
        setEmail(text);
        if (text.length > 0) {
            if (!EMAIL_REGEX.test(text)) {
                setEmailError('Email must be a valid @gmail.com address');
            } else {
                setEmailError('');
            }
        } else {
            setEmailError('');
        }
    };

    // Phone Validation & Masking
    const handlePhoneChange = (text: string) => {
        // Remove non-digits
        const cleaned = text.replace(/\D/g, '');
        
        // Limit to 10 digits
        const truncated = cleaned.slice(0, 10);
        
        // Format as XXX XXXXXXX
        let formatted = truncated;
        if (truncated.length > 3) {
            formatted = `${truncated.slice(0, 3)} ${truncated.slice(3)}`;
        }
        
        setPhone(formatted);

        if (truncated.length > 0 && truncated.length < 10) {
            setPhoneError('Phone number must have 10 digits after +92');
        } else if (truncated.length === 10) {
            setPhoneError('');
        } else {
            setPhoneError('');
        }
    };

    const handleLogin = async () => {
        // Validation Logic
        let isValid = true;

        if (loginMethod === 'email') {
            if (!email) {
                setEmailError('Email is required');
                isValid = false;
            } else if (!EMAIL_REGEX.test(email)) {
                setEmailError('Invalid email format');
                isValid = false;
            }
        } else {
            const rawPhone = phone.replace(/\s/g, '');
            if (!phone) {
                setPhoneError('Phone number is required');
                isValid = false;
            } else if (rawPhone.length !== 10) {
                setPhoneError('Invalid phone number length');
                isValid = false;
            }
        }

        if (!password) {
            setPasswordError('Password is required');
            isValid = false;
        } else {
            setPasswordError('');
        }

        if (!isValid) return;

        setLoading(true);
        try {
            const payload = {
                password: password,
                ...(loginMethod === 'email' 
                    ? { email: email } 
                    : { phone: `+92${phone.replace(/\s/g, '')}` })
            };

            const response = await fetch(`${API_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(data));

                if (data.role === 'admin') {
                    router.replace('/(admin)/dashboard');
                } else if (data.role === 'laborer') {
                    router.replace('/(laborer)/(tabs)/home');
                } else {
                    Alert.alert('Error', 'This account is not authorized');
                }
            } else {
                Alert.alert('Error', data.message || 'Login failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = () => {
        router.push('/(auth)/laborer-signup');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <View style={styles.logoSection}>
                            <Image
                                source={require('../../assets/images/login-logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.welcomeText}>Welcome Skilled Laborer</Text>

                        <View style={styles.form}>
                            {/* Method Toggle */}
                            <View style={styles.methodToggleContainer}>
                                <TouchableOpacity
                                    style={[styles.methodToggleButton, loginMethod === 'email' && styles.methodToggleButtonActive]}
                                    onPress={() => {
                                        setLoginMethod('email');
                                        setPhoneError('');
                                        setEmailError('');
                                    }}
                                >
                                    <Text style={[styles.methodToggleText, loginMethod === 'email' && styles.methodToggleTextActive]}>Email</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.methodToggleButton, loginMethod === 'phone' && styles.methodToggleButtonActive]}
                                    onPress={() => {
                                        setLoginMethod('phone');
                                        setEmailError('');
                                        setPhoneError('');
                                    }}
                                >
                                    <Text style={[styles.methodToggleText, loginMethod === 'phone' && styles.methodToggleTextActive]}>Phone</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Email / Phone Input */}
                            {loginMethod === 'email' ? (
                                <View style={styles.inputWrapper}>
                                    <Input
                                        placeholder="Email (e.g., user@gmail.com)"
                                        keyboardType="email-address"
                                        value={email}
                                        onChangeText={validateEmail}
                                        inputContainerStyle={[styles.roundedInput, emailError ? styles.inputError : undefined].filter(Boolean) as any}
                                    />
                                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                                </View>
                            ) : (
                                <View style={styles.inputWrapper}>
                                    <Input
                                        placeholder="3XX XXXXXXX"
                                        keyboardType="phone-pad"
                                        prefix="+92"
                                        value={phone}
                                        onChangeText={handlePhoneChange}
                                        maxLength={11}
                                        inputContainerStyle={[styles.roundedInput, phoneError ? styles.inputError : undefined].filter(Boolean) as any}
                                    />
                                    <Text style={styles.helperText}>Format: +92 3XX XXXXXXX</Text>
                                    {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                                </View>
                            )}

                            {/* Password Input */}
                            <View style={styles.inputWrapper}>
                                <Input
                                    placeholder="Password"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        setPasswordError('');
                                    }}
                                    inputContainerStyle={[styles.roundedInput, passwordError ? styles.inputError : undefined].filter(Boolean) as any}
                                    suffix={
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                                        </TouchableOpacity>
                                    }
                                />
                                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                            </View>

                            <TouchableOpacity style={styles.forgotPasswordContainer}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <View style={styles.spacer} />

                            <Button
                                text="Login"
                                onPress={handleLogin}
                                style={styles.loginButton}
                                loading={loading}
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
        marginBottom: 20,
    },
    logo: {
        width: 180,
        height: 180,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F41BB',
        textAlign: 'center',
        marginBottom: 18,
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
    // New Styles for Toggle & Inputs
    methodToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 30,
        padding: 4,
        marginBottom: 20,
    },
    methodToggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 25,
    },
    methodToggleButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    methodToggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    methodToggleTextActive: {
        color: '#1F41BB',
        fontWeight: '700',
    },
    inputWrapper: {
        marginBottom: 15,
    },
    roundedInput: {
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 50,
        paddingHorizontal: 20,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginLeft: 10,
        marginTop: 4,
    },
    helperText: {
        color: '#6B7280',
        fontSize: 12,
        marginLeft: 10,
        marginTop: 4,
    },
});
