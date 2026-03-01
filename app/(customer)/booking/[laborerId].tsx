
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';
import { useBookings } from '../../context/BookingsContext';

type LocationSuggestion = {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
};

export default function BookingScreen() {
    const { laborerId } = useLocalSearchParams();
    const router = useRouter();
    const { addUpcoming } = useBookings();
    const [laborer, setLaborer] = useState<any | null>(null);
    const [loadingLaborer, setLoadingLaborer] = useState(true);

    // State for booking
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [address, setAddress] = useState('');
    const [appointmentMessage, setAppointmentMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [locationPermission, setLocationPermission] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    // Map state
    const [showMap, setShowMap] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const mapRef = useRef<MapView>(null);
    
    // Initial region (Default: Islamabad)
    const [initialRegion] = useState<Region>({
        latitude: 33.6844,
        longitude: 73.0479,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    const [selectedLocation, setSelectedLocation] = useState({
        latitude: 33.6844,
        longitude: 73.0479,
    });


    React.useEffect(() => {
        const load = async () => {
            if (!laborerId) return;
            setLoadingLaborer(true);
            try {
                const res = await fetch(`${API_URL}/api/users/${laborerId}/public?includeUnapproved=true`);
                if (res.ok) {
                    const data = await res.json();
                    const primaryOffering = Array.isArray(data.offerings) && data.offerings.length > 0 ? data.offerings[0] : null;
                    setLaborer({
                        id: laborerId,
                        name: data.name || 'Laborer',
                        image: data.profileImage ? `${API_URL}${data.profileImage}` : 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
                        rating: data.rating || 0,
                        hourlyRate: primaryOffering ? primaryOffering.price : 0,
                        distance: 0,
                        verified: data.online,
                        primaryOffering
                    });
                }
            } catch {}
            setLoadingLaborer(false);
        };
        load();
    }, [laborerId]);

    // Load customer's saved location from home screen
    React.useEffect(() => {
        const loadCustomerLocation = async () => {
            try {
                const saved = await AsyncStorage.getItem('customerLocation');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.address) setAddress(parsed.address);
                    if (parsed.latitude && parsed.longitude) {
                        setSelectedLocation({ latitude: parsed.latitude, longitude: parsed.longitude });
                    }
                }
            } catch {}
        };
        loadCustomerLocation();
    }, []);

    if (loadingLaborer) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
                    <ActivityIndicator size="large" color="#1F41BB" />
                </View>
            </SafeAreaView>
        );
    }

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

    const onRegionChangeComplete = (newRegion: Region) => {
        setSelectedLocation({
            latitude: newRegion.latitude,
            longitude: newRegion.longitude,
        });
    };

    const fetchSuggestions = async (query: string) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=pk&accept-language=en`,
                {
                    headers: {
                        'User-Agent': 'SkilledLaborApp/1.0',
                        'Accept-Language': 'en'
                    }
                }
            );
            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (text.length > 2) {
            searchTimeout.current = setTimeout(() => {
                fetchSuggestions(text);
            }, 500);
        } else {
            setSuggestions([]);
        }
    };

    const handleSearchSubmit = () => {
        Keyboard.dismiss();
        if (suggestions.length > 0) {
            handleSelectSuggestion(suggestions[0]);
        }
    };

    const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
        const latitude = parseFloat(suggestion.lat);
        const longitude = parseFloat(suggestion.lon);

        const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };

        mapRef.current?.animateToRegion(newRegion, 1000);
        setSelectedLocation({ latitude, longitude });
        setSearchQuery(suggestion.display_name);
        setSuggestions([]);
        Keyboard.dismiss();
    };

    const handleCurrentLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Allow location access to find your current position.');
            return;
        }
        setLocationPermission(true);

        try {
            const location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            mapRef.current?.animateToRegion(newRegion, 1000);
            setSelectedLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (error) {
            Alert.alert('Error', 'Could not fetch current location.');
        }
    };

    const handleMapConfirm = async () => {
        try {
            const result = await Location.reverseGeocodeAsync({
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
            });
            
            if (result.length > 0) {
                const addr = result[0];
                const parts = [
                    addr.street,
                    addr.district,
                    addr.city,
                    addr.region,
                ].filter(Boolean);
                const addressString = parts.join(', ');
                setAddress(addressString || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`);
            } else {
                setAddress(`${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`);
            }
        } catch (error) {
            setAddress(`${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`);
        }
        setShowMap(false);
        setSearchQuery('');
        setSuggestions([]);
    };

    const handleConfirm = async () => {
        const scheduled = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            selectedTime.getHours(),
            selectedTime.getMinutes(),
            0, 0
        ).toISOString();
        try {
            const primaryOffering = laborer?.primaryOffering;
            const serviceName = primaryOffering?.subcategory?.name || 'On-site service';
            const price = primaryOffering?.price ?? laborer?.hourlyRate ?? 0;
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    laborerId,
                    offeringId: primaryOffering?.id,
                    service: serviceName,
                    serviceDescription: appointmentMessage,
                    scheduledAt: scheduled,
                    address,
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    estimatedDurationMin: 45,
                    price
                })
            });
            if (!res.ok) {
                let errorMsg = 'Please try again later.';
                try {
                    const errData = await res.json();
                    errorMsg = errData.message || errorMsg;
                } catch {
                    const txt = await res.text();
                    if (txt) errorMsg = txt;
                }
                Alert.alert('Booking failed', errorMsg);
                return;
            }
            const booking = await res.json();
            console.log('Booking created', booking?._id, booking?.scheduledAt);

            // Upload work photos if the customer attached any
            if (images.length > 0 && booking?._id) {
                try {
                    const formData = new FormData();
                    images.forEach((uri, i) => {
                        const filename = uri.split('/').pop() || `photo_${i}.jpg`;
                        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
                        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
                        (formData as any).append('workPhotos', { uri, name: filename, type: mime });
                    });
                    await fetch(`${API_URL}/api/bookings/${booking._id}/photos`, {
                        method: 'POST',
                        headers: {
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            'Content-Type': 'multipart/form-data',
                        },
                        body: formData,
                    });
                } catch (photoErr) {
                    console.warn('Work photo upload failed:', photoErr);
                }
            }

            try { addUpcoming(booking); } catch {}
            setShowSuccess(true);
            router.replace('/(customer)/(tabs)/bookings');
        } catch (e) {
            Alert.alert('Error', 'Unable to create booking.');
        }
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

    const handleOpenMap = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            setLocationPermission(true);
        }
        setShowMap(true);
    };

    const pickImage = async () => {
        // Request permission if needed (Expo handles this mostly automatically now)
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant permission to access your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Book Service</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
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
                            <Text style={styles.rate}>{`Rs${laborer.hourlyRate} `}</Text>
                            <View style={styles.ratingRow}>
                                <Text style={styles.rating}>{laborer.rating}</Text>
                                <Ionicons name="star" size={16} color="#FFD700" />
                            </View>
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
                            <RNDateTimePicker
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
                            <RNDateTimePicker
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
                        <View style={[styles.addressField, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="location-outline" size={20} color="#1F41BB" style={styles.addressIcon} />
                            <Text style={address ? styles.addressText : styles.addressPlaceholder} numberOfLines={2}>
                                {address || 'No address saved. Please set your location on the home screen.'}
                            </Text>
                        </View>
                    </View>

                    {/* Work Photos */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Work Photos</Text>
                        <View style={styles.photosContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {images.map((uri, index) => (
                                    <View key={index} style={styles.photoWrapper}>
                                        <Image source={{ uri }} style={styles.photo} />
                                        <TouchableOpacity 
                                            style={styles.removePhotoButton}
                                            onPress={() => removeImage(index)}
                                        >
                                            <Ionicons name="close-circle" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                                    <Ionicons name="camera-outline" size={30} color="#1F41BB" />
                                    <Text style={styles.addPhotoText}>Add Photo</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
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
            </KeyboardAvoidingView>

            {/* Map Modal */}
            <Modal
                visible={showMap}
                animationType="slide"
                onRequestClose={() => setShowMap(false)}
            >
                <SafeAreaView style={styles.mapContainer}>
                    {/* Header */}
                    <View style={styles.mapHeader}>
                        <TouchableOpacity onPress={() => setShowMap(false)} style={styles.closeMapButton}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.mapHeaderTitle}>Select Location</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Map & Search */}
                    <View style={{ flex: 1, position: 'relative' }}>
                        <MapView
                            ref={mapRef}
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={initialRegion}
                            onRegionChangeComplete={onRegionChangeComplete}
                            showsUserLocation={locationPermission}
                            showsMyLocationButton={false}
                        />
                        
                        {/* Fixed Center Marker */}
                        <View style={styles.markerFixed}>
                            <Ionicons name="location" size={40} color="#1F41BB" />
                        </View>

                        {/* Search Bar Overlay */}
                        <View style={styles.searchOverlay}>
                            <View style={styles.searchInputContainer}>
                                <Ionicons name="search" size={20} color="#6B7280" style={{ marginLeft: 10 }} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search location..."
                                    value={searchQuery}
                                    onChangeText={handleSearchChange}
                                    onSubmitEditing={handleSearchSubmit}
                                    returnKeyType="search"
                                />
                                {isSearching ? (
                                    <ActivityIndicator size="small" color="#1F41BB" style={{ marginRight: 10 }} />
                                ) : searchQuery.length > 0 ? (
                                    <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); }}>
                                        <Ionicons name="close-circle" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                            
                            {suggestions.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    <FlatList
                                        data={suggestions}
                                        keyExtractor={(item) => item.place_id.toString()}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity 
                                                style={styles.suggestionItem}
                                                onPress={() => handleSelectSuggestion(item)}
                                            >
                                                <Ionicons name="location-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                                                <Text style={styles.suggestionText} numberOfLines={2}>
                                                    {item.display_name}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        keyboardShouldPersistTaps="handled"
                                    />
                                </View>
                            )}
                        </View>

                        {/* Current Location Button */}
                        <TouchableOpacity style={styles.currentLocationButton} onPress={handleCurrentLocation}>
                            <Ionicons name="locate" size={24} color="#1F41BB" />
                        </TouchableOpacity>
                    </View>

                    {/* Footer with Confirm Button */}
                    <View style={styles.mapFooter}>
                        <View style={styles.coordinatesContainer}>
                            <Text style={styles.coordinatesLabel}>Selected Location</Text>
                            <Text style={styles.coordinatesValue}>
                                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.mapConfirmButton} onPress={handleMapConfirm}>
                            <Text style={styles.mapConfirmButtonText}>Confirm Location</Text>
                        </TouchableOpacity>
                    </View>
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
                                router.push('/(customer)/(tabs)/bookings');
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
        paddingBottom: 20,
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
    photosContainer: {
        flexDirection: 'row',
        marginTop: 10,
    },
    photoWrapper: {
        position: 'relative',
        marginRight: 15,
    },
    photo: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    removePhotoButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFF',
        borderRadius: 10,
    },
    addPhotoButton: {
        width: 80,
        height: 80,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1F41BB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
    },
    addPhotoText: {
        fontSize: 10,
        color: '#1F41BB',
        marginTop: 4,
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
    mapContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFF',
        zIndex: 10,
    },
    closeMapButton: {
        padding: 5,
    },
    mapHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F41BB',
    },
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    markerFixed: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20, // Half of icon size
        marginTop: -40, // Full icon size (anchor at bottom)
        zIndex: 2,
    },
    searchOverlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 5,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    suggestionsContainer: {
        backgroundColor: '#FFFFFF',
        marginTop: 5,
        borderRadius: 10,
        maxHeight: 200,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
    },
    currentLocationButton: {
        position: 'absolute',
        bottom: 140,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 5,
    },
    mapFooter: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    coordinatesContainer: {
        marginBottom: 15,
        alignItems: 'center',
    },
    coordinatesLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    coordinatesValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F41BB',
    },
    mapConfirmButton: {
        backgroundColor: '#1F41BB',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    mapConfirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
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
