import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';

export default function VerificationScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams();
    const [code, setCode] = useState(['', '', '', '']);
    const inputs = useRef<Array<TextInput | null>>([]);

    const handleVerify = () => {
        // Verify logic
        router.replace('/(tabs)');
    };

    const handleChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        if (text.length === 1 && index < 3) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerSpacer} />

                <Text style={styles.title}>Enter verification code</Text>

                <Text style={styles.subtitle}>
                    We have sent you a 4 digit verification code on
                </Text>
                <Text style={styles.phoneNumber}>+92 3475644055</Text>

                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputs.current[index] = ref; }}
                            style={styles.codeInput}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(text) => handleChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            textAlign="center"
                        />
                    ))}
                </View>

                <View style={styles.spacer} />

                <Button text="Verify" onPress={handleVerify} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    headerSpacer: {
        height: 100, // Push content down
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 5,
    },
    phoneNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 40,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: 40,
    },
    codeInput: {
        width: 60,
        height: 60,
        borderWidth: 1,
        borderColor: '#D1D5DB', // Gray-300
        borderRadius: 12, // Rounded corners
        fontSize: 24,
        color: '#000',
        backgroundColor: '#FFFFFF', // White bg
    },
    spacer: {
        height: 20,
        width: '100%',
    }
});
