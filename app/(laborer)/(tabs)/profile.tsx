
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function LaborerProfile() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Profile</Text>
            <Text>Profile settings and details.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});
