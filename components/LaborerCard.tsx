import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Laborer } from '../constants/Laborers';

interface LaborerCardProps {
    laborer: Laborer;
    onPress?: () => void;
}

const LaborerCard: React.FC<LaborerCardProps> = ({ laborer, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: laborer.image }} style={styles.image} />
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{laborer.name}</Text>
                    {laborer.verified ? (
                        <Ionicons name="checkmark-circle" size={16} color="#00C853" style={styles.verifiedIcon} />
                    ) : null}
                </View>

                <Text style={styles.rate}>{`₹${laborer.hourlyRate} /hour`}</Text>
                <Text style={styles.distance}>{`${laborer.distance.toFixed(2)} km away`}</Text>

                <View style={styles.footer}>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.rating}>{laborer.rating}</Text>
                        <Ionicons name="star" size={14} color="#FFD700" />
                    </View>
                    <Ionicons name="clipboard-outline" size={20} color="#4C6BC2" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
    },
    imageContainer: {
        width: 80,
        height: 100,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    infoContainer: {
        alignItems: 'center',
        width: '100%',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        marginRight: 4,
        textAlign: 'center',
    },
    verifiedIcon: {
        marginTop: 2,
    },
    rate: {
        fontSize: 14,
        color: '#4C6BC2',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    distance: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 15,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
        marginRight: 2,
    },
});

export default LaborerCard;
