import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    prefix?: string;
    containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({ label, prefix, containerStyle, style, ...props }) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputContainer}>
                {prefix && (
                    <View style={styles.prefixContainer}>
                        <Text style={styles.prefixText}>{prefix}</Text>
                    </View>
                )}
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor="#9CA3AF"
                    {...props}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
    },
    label: {
        fontSize: 14,
        color: '#030f39ff',
        marginBottom: 15,
        textAlign: 'left',   // <-- force left
        alignSelf: 'flex-start',
        paddingLeft: 6
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB', // Gray-300
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        height: 50,
    },
    prefixContainer: {
        paddingHorizontal: 16,
        borderRightWidth: 1,
        borderRightColor: '#D1D5DB',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#F9FAFB', // Light gray bg for prefix maybe? Or just white. Screenshot 2 has white bg.
    },
    prefixText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
        height: '100%',
    },
});

export default Input;
