import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { API_URL } from '../../constants/Api';

export default function SignupScreen() {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
    });
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const formatPkPhone = (digitsOnly: string) => {
        const d = digitsOnly.replace(/\D/g, '').slice(0, 10);
        const partA = d.slice(0, 3);
        const partB = d.slice(3, 10);
        return [partA, partB].filter(Boolean).join(partB ? ' ' : '');
    };

    const phoneDisplayToBackend = (display: string) => {
        const d = display.replace(/\D/g, '');
        return d.length ? `+92${d}` : '';
    };

    const validate = () => {
        const e: any = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneDisplayRegex = /^3\d{2}\s\d{7}$/;
        if (!form.firstName.trim()) e.firstName = 'First name is required.';
        if (!form.lastName.trim()) e.lastName = 'Last name is required.';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!emailRegex.test(form.email.trim())) e.email = 'Please enter a valid email (e.g., user@example.com)';
        if (!form.phone.trim()) e.phone = 'Phone is required';
        else if (!phoneDisplayRegex.test(form.phone.trim())) e.phone = 'Phone must match +92 3XX XXXXXXX';
        if (!form.password) e.password = 'Password is required';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        if (!acceptTerms) e.terms = 'Please accept terms and policy';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const recomputeValid = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneDisplayRegex = /^3\d{2}\s\d{7}$/;
        const ok =
            !!form.firstName.trim() &&
            !!form.lastName.trim() &&
            !!form.email.trim() &&
            emailRegex.test(form.email.trim()) &&
            !!form.phone.trim() &&
            phoneDisplayRegex.test(form.phone.trim()) &&
            !!form.password &&
            form.password === form.confirmPassword &&
            acceptTerms;
        setIsValid(ok);
    };

    const onChangeFirst = (t: string) => {
        const v = t;
        setForm(prev => ({ ...prev, firstName: v }));
        setErrors((prev: any) => ({ ...prev, firstName: v.trim() ? '' : 'First name is required.' }));
        recomputeValid();
    };
    const onChangeLast = (t: string) => {
        const v = t;
        setForm(prev => ({ ...prev, lastName: v }));
        setErrors((prev: any) => ({ ...prev, lastName: v.trim() ? '' : 'Last name is required.' }));
        recomputeValid();
    };
    const onChangeEmail = (t: string) => {
        const v = t;
        setForm(prev => ({ ...prev, email: v }));
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setErrors((prev: any) => ({ ...prev, email: v.trim() && emailRegex.test(v.trim()) ? '' : 'Please enter a valid email (e.g., user@example.com)' }));
        recomputeValid();
    };
    const onChangePhone = (t: string) => {
        const formatted = formatPkPhone(t);
        setForm(prev => ({ ...prev, phone: formatted }));
        const phoneDisplayRegex = /^3\d{2}\s\d{7}$/;
        setErrors((prev: any) => ({ ...prev, phone: formatted && phoneDisplayRegex.test(formatted) ? '' : 'Phone must match +92 3XX XXXXXXX' }));
        recomputeValid();
    };
    const onChangePassword = (t: string) => {
        setForm(prev => ({ ...prev, password: t }));
        setErrors((prev: any) => ({ ...prev, password: t ? '' : 'Password is required', confirmPassword: prev.confirmPassword && prev.confirmPassword !== t ? 'Passwords do not match' : '' }));
        recomputeValid();
    };
    const onChangeConfirmPassword = (t: string) => {
        setForm(prev => ({ ...prev, confirmPassword: t }));
        setErrors((prev: any) => ({ ...prev, confirmPassword: t === form.password ? '' : 'Passwords do not match' }));
        recomputeValid();
    };

    const handleSignup = async () => {
        if (!validate()) return;
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    email: form.email.trim(),
                    phone: phoneDisplayToBackend(form.phone),
                    password: form.password,
                    confirmPassword: form.confirmPassword,
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setErrors({ server: data?.message || 'Signup failed' });
                return;
            }
            setErrors({});
            Alert.alert('Success', 'Account created successfully. Please log in.', [
                {
                    text: 'OK',
                    onPress: () => {
                        router.replace({ pathname: '/(auth)/login', params: { role: 'customer', prefillEmail: form.email.trim() } });
                    }
                }
            ]);
        } catch (err: any) {
            setErrors({ server: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        recomputeValid();
    }, [form, acceptTerms]);

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

        

                    <View style={styles.form}>
                        <View style={styles.row}>
                            <Input
                                placeholder="First Name"
                                value={form.firstName}
                                onChangeText={onChangeFirst}
                                containerStyle={styles.halfInput}
                                inputContainerStyle={styles.roundedInput}
                            />
                            {!!errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                            <Input
                                placeholder="Last Name"
                                value={form.lastName}
                                onChangeText={onChangeLast}
                                containerStyle={styles.halfInput}
                                inputContainerStyle={styles.roundedInput}
                            />
                            {!!errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                        </View>

                        <Input
                            placeholder="Email"
                            keyboardType="email-address"
                            value={form.email}
                            onChangeText={onChangeEmail}
                            inputContainerStyle={styles.roundedInput}
                        />
                        {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        <Input
                            placeholder="3XX XXXXXXX"
                            keyboardType="number-pad"
                            value={form.phone}
                            onChangeText={onChangePhone}
                            inputContainerStyle={styles.roundedInput}
                            prefix="+92"
                        />
                        {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                        <Input
                            placeholder="Password"
                            secureTextEntry={!showPassword}
                            value={form.password}
                            onChangeText={onChangePassword}
                            inputContainerStyle={styles.roundedInput}
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="password"
                            suffix={
                                <TouchableOpacity
                                    onPress={() => setShowPassword(v => !v)}
                                    accessibilityRole="button"
                                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ paddingHorizontal: 12 }}
                                >
                                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                                </TouchableOpacity>
                            }
                        />
                        {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                        <Input
                            placeholder="Confirm Password"
                            secureTextEntry={!showConfirmPassword}
                            value={form.confirmPassword}
                            onChangeText={onChangeConfirmPassword}
                            inputContainerStyle={styles.roundedInput}
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="password"
                            suffix={
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(v => !v)}
                                    accessibilityRole="button"
                                    accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ paddingHorizontal: 12 }}
                                >
                                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                                </TouchableOpacity>
                            }
                        />
                        {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setAcceptTerms(!acceptTerms)}
                        >
                            <View style={[styles.checkbox, acceptTerms && styles.checkboxSelected]}>
                                {acceptTerms && <Ionicons name="checkmark" size={12} color="#FFF" />}
                            </View>
                            <Text style={styles.checkboxLabel}>Accept terms and policy</Text>
                        </TouchableOpacity>
                        {!!errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
                        {!!errors.server && <Text style={styles.serverErrorText}>{errors.server}</Text>}

                        <Button
                            text="Sign Up"
                            onPress={handleSignup}
                            style={styles.signupButton}
                            textStyle={styles.signupButtonText}
                            loading={loading}
                            disabled={!isValid}
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
        color: '#1F41BB',
        marginTop: 40,
        alignSelf: 'center',// Keep title centered if that's preferred, or let it follow header
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
    errorText: {
        color: '#DC2626',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 10,
    },
    serverErrorText: {
        color: '#B91C1C',
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '600',
    },
    helperText: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 10,
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
