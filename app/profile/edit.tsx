import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function ProfileEditScreen() {
    const router = useRouter();
    const [name, setName] = useState('Khair Ullah');
    const [email, setEmail] = useState('khairullah770@gmail.com');
    const [phone, setPhone] = useState('03475644055');
    const [password, setPassword] = useState('********');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                "Profile Updated",
                "Your profile details have been successfully updated.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F41BB" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 40 }} /> {/* Spacer */}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Profile Picture Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: 'https://i.pravatar.cc/150?u=user123' }}
                                style={styles.avatar}
                            />
                            <TouchableOpacity style={styles.cameraBadge}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.changePhotoText}>Change Profile Picture</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <Input
                            label="Full Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your full name"
                        />
                        <Input
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            label="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter your phone number"
                            keyboardType="phone-pad"
                        />
                        <View style={styles.passwordContainer}>
                            <Input
                                label="New Password"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter new password"
                                secureTextEntry={!showPassword}
                                style={{ flex: 1 }}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={24}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Action Button */}
                    <View style={styles.footer}>
                        <Button
                            text={loading ? "Saving..." : "Save Changes"}
                            onPress={handleSave}
                            disabled={loading}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F41BB',
        marginTop: 35,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 30,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#F0F4FF',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#1F41BB',
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    changePhotoText: {
        marginTop: 12,
        fontSize: 14,
        color: '#1F41BB',
        fontWeight: '600',
    },
    formSection: {
        marginBottom: 20,
    },
    passwordContainer: {
        position: 'relative',
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        bottom: 12,
        height: 50,
        justifyContent: 'center',
    },
    footer: {
        marginTop: 10,
    },
});
