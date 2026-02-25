import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LaborerCardProps {
    laborer: {
        id: string;
        name: string;
        image: string;
        rating?: number;
        hourlyRate?: number;
        distance?: number;
        verified?: boolean;
        online?: boolean;
        experience?: string;
        completedJobs?: number;
    };
    onPress?: () => void;
}

const LaborerCard: React.FC<LaborerCardProps> = ({ laborer, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} accessibilityLabel={`Open profile for ${laborer.name}`}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: laborer.image }} style={styles.image} />
                <View style={[styles.statusDot, { backgroundColor: laborer.verified || laborer.online ? '#00C853' : '#9E9E9E' }]} />
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{laborer.name}</Text>
                    {laborer.verified || laborer.online ? (
                        <Ionicons name="checkmark-circle" size={16} color="#00C853" style={styles.verifiedIcon} />
                    ) : null}
                </View>

                <Text style={styles.rate}>{`Rs ${laborer.hourlyRate ?? 0}`}</Text>
                {typeof laborer.distance === 'number' && laborer.distance > 0 ? (
                    <Text style={styles.distance}>{`${laborer.distance.toFixed(2)} km away`}</Text>
                ) : null}
                {laborer.experience ? (
                    <Text style={styles.experience}>Experience {laborer.experience}</Text>
                ) : null}

                <View style={styles.footer}>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.rating}>{laborer.rating ?? 0}</Text>
                        <Ionicons name="star" size={14} color="#FFD700" />
                    </View>
                    <View style={styles.jobsContainer}>
                        <Ionicons name="briefcase-outline" size={16} color="#4C6BC2" />
                        <Text style={styles.jobsText}>Jobs {laborer.completedJobs ?? 0}</Text>
                    </View>
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
        position: 'relative'
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    statusDot: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        right: 6,
        top: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF'
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
    experience: {
        fontSize: 12,
        color: '#616161',
        marginBottom: 6,
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
    jobsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    jobsText: {
        fontSize: 13,
        color: '#4C6BC2',
        fontWeight: '600'
    },
});

export default LaborerCard;
