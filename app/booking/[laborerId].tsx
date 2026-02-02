
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LABORERS } from '../../constants/Laborers';

export default function BookingScreen() {
    const { laborerId } = useLocalSearchParams();
    const router = useRouter();

    const laborer = LABORERS.find(l => l.id === laborerId);

    // State for booking
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [address, setAddress] = useState('');
    const [appointmentMessage, setAppointmentMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // Map state
    const [showMap, setShowMap] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef<any>(null);
    const [selectedLocation, setSelectedLocation] = useState({
        latitude: 33.6844,
        longitude: 73.0479,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [markerPosition, setMarkerPosition] = useState(selectedLocation);

    if (!laborer) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text>Laborer not found</Text>
            </SafeAreaView>
        );
    }

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleTimeChange = (event: any, time?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (time) {
            setSelectedTime(time);
        }
    };

    const handleMapConfirm = async () => {
        // Reverse geocode to get address
        try {
            const result = await Location.reverseGeocodeAsync({
                latitude: markerPosition.latitude,
                longitude: markerPosition.longitude,
            });
            if (result[0]) {
                const addr = `${result[0].street || ''}, ${result[0].city || ''}, ${result[0].region || ''}`.trim();
                setAddress(addr || `${markerPosition.latitude.toFixed(4)}, ${markerPosition.longitude.toFixed(4)}`);
            }
        } catch (error) {
            setAddress(`${markerPosition.latitude.toFixed(4)}, ${markerPosition.longitude.toFixed(4)}`);
        }
        setSearchQuery('');
        setShowMap(false);
    };


    const fetchSuggestions = async (query: string) => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        try {
            // Fetch multiple suggestions for autocomplete
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=pk`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SkilledLaborApp/1.0'
                }
            });
            const data = await response.json();

            if (data && data.length > 0) {
                setSuggestions(data);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            setSuggestions([]);
            setShowSuggestions(false);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);

        // Clear previous timeout
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // Debounce the search to avoid too many API calls
        if (text.trim().length > 2) {
            // Wait 500ms after user stops typing
            searchTimeout.current = setTimeout(() => {
                fetchSuggestions(text);
            }, 500);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (suggestion: any) => {
        const newRegion = {
            latitude: parseFloat(suggestion.lat),
            longitude: parseFloat(suggestion.lon),
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };

        setSelectedLocation(newRegion);
        setMarkerPosition(newRegion);
        setSearchQuery(suggestion.display_name);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };
            setSelectedLocation(newRegion);
            setMarkerPosition(newRegion);
        }
    };

    const handleConfirm = () => {
        console.log('Booking confirmed', {
            laborerId,
            date: selectedDate.toDateString(),
            time: selectedTime.toTimeString(),
            address,
            message: appointmentMessage,
        });
        setShowSuccess(true);
    };

    const formatDate = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    };

    const formatTime = (date: Date) => {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${strMinutes} ${ampm}`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Laborer Info */}
                <View style={styles.laborerSection}>
                    <Image source={{ uri: laborer.image }} style={styles.laborerImage} />
                    <View style={styles.laborerDetails}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{laborer.name}</Text>
                            {laborer.verified ? (
                                <Ionicons name="checkmark-circle" size={18} color="#00C853" />
                            ) : null}
                        </View>
                        <Text style={styles.rate}>{`₹${laborer.hourlyRate} /hour`}</Text>
                        <View style={styles.ratingRow}>
                            <Text style={styles.rating}>{laborer.rating}</Text>
                            <Ionicons name="star" size={16} color="#FFD700" />
                        </View>
                        <Text style={styles.distance}>{`${laborer.distance.toFixed(2)} km away`}</Text>
                    </View>
                </View>

                {/* Date and Time Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select date and time</Text>
                    <Text style={styles.sectionSubtitle}>Your service will take approx. 45 mins</Text>

                    {/* Date Selection */}
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>{formatDate(selectedDate)}</Text>
                        <Ionicons name="calendar-outline" size={20} color="#1F41BB" />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                            minimumDate={new Date()}
                        />
                    )}

                    {/* Time Selection */}
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>{formatTime(selectedTime)}</Text>
                        <Ionicons name="time-outline" size={20} color="#1F41BB" />
                    </TouchableOpacity>

                    {showTimePicker && (
                        <DateTimePicker
                            value={selectedTime}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleTimeChange}
                        />
                    )}
                </View>

                {/* Address */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Address</Text>
                    <TouchableOpacity
                        style={styles.addressField}
                        onPress={() => {
                            requestLocationPermission();
                            setShowMap(true);
                        }}
                    >
                        <Ionicons name="location-outline" size={20} color="#757575" style={styles.addressIcon} />
                        <Text style={address ? styles.addressText : styles.addressPlaceholder}>
                            {address || 'Select location from map'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Appointment Message */}
                <View style={styles.section}>
                    <TextInput
                        style={styles.messageInput}
                        placeholder="Appoinment message"
                        value={appointmentMessage}
                        onChangeText={setAppointmentMessage}
                        multiline
                    />
                </View>
            </ScrollView>

            {/* Confirm Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
            </View>

            {/* Map Modal */}
            <Modal
                visible={showMap}
                animationType="slide"
                onRequestClose={() => setShowMap(false)}
            >
                <SafeAreaView style={styles.mapModal}>
                    <View style={styles.mapHeader}>
                        <TouchableOpacity onPress={() => setShowMap(false)}>
                            <Ionicons name="close" size={28} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.mapHeaderTitle}>Select Location</Text>
                        <TouchableOpacity onPress={handleMapConfirm}>
                            <Text style={styles.mapConfirmText}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search in Pakistan: Islamabad, Rawalpindi, Lahore..."
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                returnKeyType="search"
                                autoFocus={true}
                            />
                            {isSearching ? (
                                <View style={styles.searchLoader}>
                                    <Text style={styles.searchingText}>...</Text>
                                </View>
                            ) : searchQuery.length > 0 ? (
                                <TouchableOpacity onPress={() => {
                                    setSearchQuery('');
                                    setShowSuggestions(false);
                                    setSuggestions([]);
                                }}>
                                    <Ionicons name="close-circle" size={20} color="#757575" />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Suggestions List */}
                        {showSuggestions && suggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                <ScrollView
                                    style={styles.suggestionsList}
                                    keyboardShouldPersistTaps="always"
                                    nestedScrollEnabled={true}
                                >
                                    {suggestions.map((suggestion, index) => (
                                        <TouchableOpacity
                                            key={`${suggestion.place_id}-${index}`}
                                            style={styles.suggestionItem}
                                            onPress={() => handleSelectSuggestion(suggestion)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="location" size={18} color="#1F41BB" style={styles.suggestionIcon} />
                                            <View style={styles.suggestionTextContainer}>
                                                <Text style={styles.suggestionTitle} numberOfLines={1}>
                                                    {suggestion.display_name.split(',')[0]}
                                                </Text>
                                                <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                                                    {suggestion.display_name}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        region={selectedLocation}
                        onPress={(e) => {
                            setMarkerPosition({
                                ...e.nativeEvent.coordinate,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            });
                            setShowSuggestions(false);
                        }}
                    >
                        <Marker coordinate={markerPosition} />
                    </MapView>
                </SafeAreaView>
            </Modal>

            {/* Success Modal */}
            <Modal
                visible={showSuccess}
                animationType="fade"
                transparent={false}
            >
                <SafeAreaView style={styles.successContainer}>
                    <TouchableOpacity
                        style={styles.closeSuccess}
                        onPress={() => setShowSuccess(false)}
                    >
                        <Ionicons name="close-circle" size={32} color="#E0E0E0" />
                    </TouchableOpacity>

                    <View style={styles.successContent}>
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
                        </View>
                        <Text style={styles.successTitle}>Booking Successful !</Text>
                    </View>

                    <View style={styles.successCard}>
                        <Image source={{ uri: laborer.image }} style={styles.successLaborerImage} />
                        <View style={styles.successDetails}>
                            <Text style={styles.successLaborerName}>{laborer.name}</Text>
                            <View style={styles.successInfoRow}>
                                <View style={styles.dot} />
                                <Text style={styles.successInfoText}>{formatDate(selectedDate)}</Text>
                            </View>
                            <View style={styles.successInfoRow}>
                                <View style={styles.dot} />
                                <Text style={styles.successInfoText}>{formatTime(selectedTime)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.successFooter}>
                        <TouchableOpacity
                            style={styles.viewBookingButton}
                            onPress={() => {
                                setShowSuccess(false);
                                router.push('/(tabs)/bookings');
                            }}
                        >
                            <Text style={styles.viewBookingText}>View Booking</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 5,
        marginLeft: -5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    laborerSection: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
    },
    laborerImage: {
        width: 80,
        height: 100,
        borderRadius: 8,
        marginRight: 20,
        backgroundColor: '#eee',
    },
    laborerDetails: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginRight: 5,
    },
    rate: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F41BB',
        marginBottom: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        right: 0,
        top: 5,
    },
    rating: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
        marginRight: 2,
    },
    distance: {
        fontSize: 12,
        color: '#555',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 15,
    },
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 10,
        backgroundColor: '#FFFFFF',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#000',
    },
    addressField: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    addressIcon: {
        marginRight: 10,
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        color: '#000',
    },
    addressPlaceholder: {
        flex: 1,
        fontSize: 14,
        color: '#999',
    },
    searchSection: {
        position: 'relative',
        zIndex: 1000,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginHorizontal: 15,
        marginVertical: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    searchLoader: {
        paddingHorizontal: 8,
    },
    searchingText: {
        fontSize: 12,
        color: '#1F41BB',
        fontWeight: '600',
    },
    suggestionsContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 15,
        marginTop: -5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    suggestionsList: {
        maxHeight: 250,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    suggestionIcon: {
        marginRight: 10,
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    suggestionSubtitle: {
        fontSize: 12,
        color: '#757575',
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    confirmButton: {
        backgroundColor: '#2A3B8F',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    mapModal: {
        flex: 1,
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    mapHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    mapConfirmText: {
        fontSize: 16,
        color: '#1F41BB',
        fontWeight: '600',
    },
    map: {
        flex: 1,
    },
    successContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    closeSuccess: {
        alignSelf: 'flex-end',
        padding: 10,
    },
    successContent: {
        flex: 0.6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successIconContainer: {
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    successCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        alignItems: 'center',
        position: 'absolute',
        bottom: 120,
        left: 20,
        right: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    successLaborerImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
        marginRight: 15,
    },
    successDetails: {
        flex: 1,
    },
    successLaborerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    successInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#757575',
        marginRight: 8,
    },
    successInfoText: {
        fontSize: 14,
        color: '#757575',
    },
    successFooter: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
    },
    viewBookingButton: {
        backgroundColor: '#2A3B8F',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    viewBookingText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
