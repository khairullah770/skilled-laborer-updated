import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        // Simulate loading or check auth
        const timer = setTimeout(() => {
            router.replace('/(auth)/role-selection');
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
        backgroundColor: '#1F41BB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        width: 300,
        height: 300,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
});
