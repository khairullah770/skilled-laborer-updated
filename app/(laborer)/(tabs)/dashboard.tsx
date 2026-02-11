
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function LaborerDashboard() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Laborer Dashboard</Text>
            <Text>Welcome back! You are now in the laborer app.</Text>
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
