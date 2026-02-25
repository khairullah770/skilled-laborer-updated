import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen() {
    const router = useRouter();

    const goToCustomerLogin = () => {
        router.push({ pathname: '/(auth)/login', params: { role: 'customer' } });
    };

    const goToLaborerLogin = () => {
        router.push('/(auth)/laborer-login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/images/logo2.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.topBackground}>
                <Image
                    source={require('../../assets/images/laborer_header.png')}
                    style={styles.heroImage}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.bottomCard}>
                <Text style={styles.cardTitle}>Welcome to Skilled Labor Services</Text>

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={goToCustomerLogin}>
                        <Text style={styles.primaryButtonText}>I'm a customer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={goToLaborerLogin}>
                        <View style={styles.secondaryContent}>

                            <Text style={styles.secondaryButtonText}>I'm a Skilled Laborer</Text>
                        </View>
                    </TouchableOpacity>
                </View>


            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
        paddingBottom: 32,
    },
    logo: {
        width: 340,
        height: 170,
        maxWidth: 320,
        maxHeight: 140,
    },
    topBackground: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 24,
    },
    heroImage: {
        width: '115%',
        height: '115%',
    },
    bottomCard: {
        backgroundColor: '#1F41BB',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 0.3,
    },
    buttonsContainer: {
        width: '100%',
        gap: 12,
        marginTop: 8,
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#FFFFFF',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F41BB',
    },
    secondaryButton: {
        backgroundColor: '#1D3AA5',
    },
    secondaryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryIcon: {
        marginRight: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
