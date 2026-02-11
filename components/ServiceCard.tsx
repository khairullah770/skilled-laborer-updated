import { Ionicons } from '@expo/vector-icons'; // Or a custom icon component
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ServiceCardProps {
    title: string;
    iconName?: keyof typeof Ionicons.glyphMap; // Using Ionicons for now
    imageUrl?: string; // For remote images
    imageSource?: any; // For local require() images
    onPress?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, iconName, imageUrl, imageSource, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.iconContainer}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.iconImage} resizeMode="contain" />
                ) : imageSource ? (
                    <Image source={imageSource} style={styles.iconImage} resizeMode="contain" />
                ) : iconName ? (
                    <Ionicons name={iconName} size={32} color="#1F41BB" />
                ) : (
                    <Ionicons name="construct-outline" size={32} color="#1F41BB" />
                )}
            </View>
            <Text
                style={styles.title}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '30%', // Grid item
        minHeight: 110,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        marginHorizontal: '1.5%',
        shadowColor: '#1F41BB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F0F4FF',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F0F4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        overflow: 'hidden', // Ensure image doesn't bleed out
    },
    iconImage: {
        width: '70%',
        height: '70%',
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1F41BB',
    },
});

export default ServiceCard;
