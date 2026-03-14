import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { apiFetchJson } from '../../constants/Api';

export default function LaborerSignupScreen() {
    const router = useRouter();
    const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);

    // Validation State
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');

    // Visibility State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Regex Patterns
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const PHONE_REGEX = /^\d{3} \d{7}$/; // Matches 321 6755499 format (10 digits with space)
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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

    // Password Validation
    const validatePassword = (text: string) => {
        setPassword(text);
        
        if (text.length === 0) {
            setPasswordStrength('');
            setPasswordError('');
            return;
        }

        let strength = 'Weak';
        let color = '#EF4444'; // Red

        const hasLower = /[a-z]/.test(text);
        const hasUpper = /[A-Z]/.test(text);
        const hasNumber = /\d/.test(text);
        const hasSpecial = /[@$!%*?&]/.test(text);
        const isLength = text.length >= 8;

        const checks = [hasLower, hasUpper, hasNumber, hasSpecial, isLength].filter(Boolean).length;

        if (checks === 5) {
            strength = 'Strong';
            color = '#10B981'; // Green
        } else if (checks >= 3) {
            strength = 'Medium';
            color = '#F59E0B'; // Yellow
        }

        setPasswordStrength(strength);

        if (!PASSWORD_REGEX.test(text)) {
            setPasswordError('Min 8 chars, 1 upper, 1 lower, 1 number, 1 special char');
        } else {
            setPasswordError('');
        }

        // Check confirm match immediately if it has value
        if (confirmPassword && text !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
        } else if (confirmPassword && text === confirmPassword) {
            setConfirmPasswordError('');
        }
    };

    const validateConfirmPassword = (text: string) => {
        setConfirmPassword(text);
        if (text !== password) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError('');
        }
    };

    const handleSignup = async () => {
        // Final Validation Check
        let isValid = true;

        if (signupMethod === 'email') {
            if (!EMAIL_REGEX.test(email)) {
                setEmailError('Invalid email format');
                isValid = false;
            }
        } else {
            const rawPhone = phone.replace(/\s/g, '');
            if (rawPhone.length !== 10) {
                setPhoneError('Invalid phone number length');
                isValid = false;
            }
        }

        if (!PASSWORD_REGEX.test(password)) {
            setPasswordError('Password does not meet requirements');
            isValid = false;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            isValid = false;
        }

        if (!acceptTerms) {
            Alert.alert('Error', 'Please accept terms and policy');
            return;
        }

        if (!isValid) {
            Alert.alert('Error', 'Please fix the errors in the form');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                password,
                role: 'laborer',
            };
            if (signupMethod === 'email') {
                payload.email = email;
            } else {
                payload.phone = `+92${phone.replace(/\s/g, '')}`;
            }

            const { data } = await apiFetchJson<any>('/api/users', {
                method: 'POST',
                body: payload,
                timeoutMs: 10000,
                retries: 1,
            });

            Alert.alert('Success', 'Account created! Please log in.');
            router.replace('/(auth)/laborer-login');
        } catch (error: any) {
            const message =
                error?.body?.message ||
                error?.message ||
                'Unable to sign up. Please try again.';
            Alert.alert('Error', message);
            console.error('Laborer signup error', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        router.replace('/(auth)/laborer-login');
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
                        <Text style={styles.title}>LABORER SIGN UP</Text>
                    </View>

                    <View style={styles.form}>
                        {/* Method Toggle */}
                        <View style={styles.methodToggleContainer}>
                            <TouchableOpacity
                                style={[styles.methodToggleButton, signupMethod === 'email' && styles.methodToggleButtonActive]}
                                onPress={() => {
                                    setSignupMethod('email');
                                    setPhoneError('');
                                    setEmailError('');
                                }}
                            >
                                <Text style={[styles.methodToggleText, signupMethod === 'email' && styles.methodToggleTextActive]}>Email</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.methodToggleButton, signupMethod === 'phone' && styles.methodToggleButtonActive]}
                                onPress={() => {
                                    setSignupMethod('phone');
                                    setEmailError('');
                                    setPhoneError('');
                                }}
                            >
                                <Text style={[styles.methodToggleText, signupMethod === 'phone' && styles.methodToggleTextActive]}>Phone</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Email / Phone Input */}
                        {signupMethod === 'email' ? (
                            <View style={styles.inputWrapper}>
                                <Input
                                    placeholder="Email (e.g., user@gmail.com)"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={validateEmail}
                                    inputContainerStyle={emailError ? [styles.roundedInput, styles.inputError] : styles.roundedInput}
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
                                    maxLength={11} // 3 digits + space + 7 digits = 11 chars
                                    inputContainerStyle={[styles.roundedInput, phoneError ? styles.inputError : null]}
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
                                onChangeText={validatePassword}
                                inputContainerStyle={[styles.roundedInput, passwordError ? styles.inputError : null]}
                                suffix={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                }
                            />
                            {passwordStrength ? (
                                <Text style={[
                                    styles.strengthText, 
                                    { color: passwordStrength === 'Strong' ? '#10B981' : passwordStrength === 'Medium' ? '#F59E0B' : '#EF4444' }
                                ]}>
                                    Strength: {passwordStrength}
                                </Text>
                            ) : null}
                            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputWrapper}>
                            <Input
                                placeholder="Confirm Password"
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={validateConfirmPassword}
                                inputContainerStyle={[styles.roundedInput, confirmPasswordError ? styles.inputError : null]}
                                suffix={
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                }
                            />
                            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                        </View>

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
                            loading={loading}
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
        width: 60,
        height: 60,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F41BB',
        marginTop: 10,
        letterSpacing: 1,
        alignSelf: 'center',
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
    strengthText: {
        fontSize: 12,
        marginLeft: 10,
        marginTop: 4,
        fontWeight: '600',
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
        borderColor: '#E5E7EB',
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
        fontSize: 16,
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
        paddingHorizontal: 10,
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
});
