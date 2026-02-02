import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Colors from '../constants/Colors';

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        // Simulate loading or check auth
        const timer = setTimeout(() => {
            router.replace('/(auth)/login');
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.tint, // Primary Blue
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        width: 200,
        height: 200,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 10,
        lineHeight: 50,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FFFFFF',
        letterSpacing: 4,
        marginTop: 5,
    },
});
