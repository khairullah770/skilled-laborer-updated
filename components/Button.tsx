import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import Colors from '../constants/Colors';

interface ButtonProps extends TouchableOpacityProps {
    text: string;
    type?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({ text, type = 'primary', style, textStyle, ...props }) => {
    const getBackgroundColor = () => {
        switch (type) {
            case 'primary':
                return Colors.light.tint; // or use standard primary
            case 'secondary':
                return '#E5E7EB'; // Light gray
            case 'outline':
                return 'transparent';
            default:
                return Colors.light.tint;
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'primary':
                return '#FFFFFF';
            case 'secondary':
                return '#000000';
            case 'outline':
                return Colors.light.tint;
            default:
                return '#FFFFFF';
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: getBackgroundColor() },
                type === 'outline' && styles.outline,
                style,
            ]}
            activeOpacity={0.8}
            {...props}
        >
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                {text}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginVertical: 10,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    outline: {
        borderWidth: 1,
        borderColor: Colors.light.tint,
    },
});

export default Button;
