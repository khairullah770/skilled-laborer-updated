import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function SignupScreen() {
    const router = useRouter();
    const [form, setForm] = useState({
        fullName: 'Khairullah khaliq',
        phone: '3475644055',
        address: 'house # 3 ,street 2 , i-10/4, islamabad',
        password: '',
        confirmPassword: '',
    });

    const handleSignup = () => {
        router.push({ pathname: '/(auth)/verification', params: { phone: form.phone } });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header if needed, or simple back button */}
                    {/* Screenshot doesn't confirm header presence but likely has one to go back */}

                    <Input
                        label="Enter Full Name"
                        placeholder="Khairullah khaliq"
                        value={form.fullName}
                        onChangeText={(t) => setForm({ ...form, fullName: t })}
                    />

                    <Input
                        label="Enter Phone"
                        prefix="+92"
                        placeholder="3475644055"
                        keyboardType="phone-pad"
                        value={form.phone}
                        onChangeText={(t) => setForm({ ...form, phone: t })}
                    />

                    <Input
                        label="Enter Address"
                        placeholder="Address"
                        value={form.address}
                        onChangeText={(t) => setForm({ ...form, address: t })}
                        multiline
                    />

                    <TouchableOpacity style={styles.mapLink}>
                        <Ionicons name="location-sharp" size={24} color="#000" />
                        <Text style={styles.mapLinkText}>choose from map</Text>
                    </TouchableOpacity>

                    <Input
                        label="Enter password"
                        placeholder="***********"
                        secureTextEntry
                        value={form.password}
                        onChangeText={(t) => setForm({ ...form, password: t })}
                    />

                    <Input
                        label="confrim password"
                        placeholder="***********"
                        secureTextEntry
                        value={form.confirmPassword}
                        onChangeText={(t) => setForm({ ...form, confirmPassword: t })}
                    />

                    <View style={styles.spacer} />

                    <Button text="Signup" onPress={handleSignup} />

                    <Button
                        text="Already Account"
                        type="secondary"
                        onPress={() => router.replace('/(auth)/login')}
                    />

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
        paddingTop: 40,
    },
    mapLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Image shows left aligned or center? Screenshot 3 shows centered below address field? No, "choose from map" is aligned left under the address box in the screenshot.
        // Wait, Screenshot 3: "house # 3..." input -> then "choose from map" BELOW it, aligned left with icon.
        alignSelf: 'flex-start',
        marginLeft: 5,
        marginVertical: 10,
    },
    mapLinkText: {
        color: '#1F41BB', // Blue link
        marginLeft: 5,
        fontWeight: '500',
    },
    spacer: {
        height: 30,
    },
});
