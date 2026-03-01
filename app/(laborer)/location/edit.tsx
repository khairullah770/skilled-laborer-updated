import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../components/Button';
import { API_URL } from '../../../constants/Api';
import { useUser } from '../../../context/UserContext';

type LocationSuggestion = {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
};

export default function EditLocationScreen() {
    const router = useRouter();
    const { userData, updateUserData } = useUser();
    const [loading, setLoading] = useState(false);
    const [locationPermission, setLocationPermission] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const mapRef = useRef<MapView>(null);
    
    // Initial region from user context or default
    const [initialRegion] = useState<Region>({
        latitude: userData.location.latitude,
        longitude: userData.location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    const [selectedLocation, setSelectedLocation] = useState({
        latitude: userData.location.latitude,
        longitude: userData.location.longitude,
    });

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }
            setLocationPermission(true);
            
            // If user location is default/empty, fetch current location
            // But we already have a default in context. 
            // Let's just stick to the context location unless explicit "current location" is requested.
        })();
    }, []);

    const onRegionChangeComplete = (newRegion: Region) => {
        setSelectedLocation({
            latitude: newRegion.latitude,
            longitude: newRegion.longitude,
        });
    };

    const fetchSuggestions = async (query: string) => {
        if (!query.trim()) {
            setSuggestions([]);
            setSearchError(null);
            return;
        }

        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Auto-abort after 8 seconds
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        setSearching(true);
        setSearchError(null);
        try {
            // Using OpenStreetMap Nominatim API for free autocomplete suggestions
            // Restricted to Pakistan (countrycodes=pk)
            // NOTE: Nominatim REQUIRES a valid User-Agent identifying the app
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=pk&accept-language=en`;
            console.log('[LocationSearch] Fetching:', url);
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'SkilledLaborApp/1.0 (contact@skilledlabor.pk)',
                    'Accept': 'application/json',
                },
            });
            console.log('[LocationSearch] Status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            console.log('[LocationSearch] Results:', data?.length ?? 0);
            if (!controller.signal.aborted) {
                if (data && data.length > 0) {
                    setSuggestions(data);
                    setSearchError(null);
                } else {
                    setSuggestions([]);
                    setSearchError('No results found. Try a different search.');
                }
            }
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                // Request was cancelled — ignore
                return;
            }
            console.error('[LocationSearch] Nominatim error:', error?.message || error);

            // Fallback: use expo-location geocodeAsync
            console.log('[LocationSearch] Trying fallback geocodeAsync...');
            try {
                const geoResults = await Location.geocodeAsync(query);
                if (geoResults.length > 0) {
                    const fallbackSuggestions: LocationSuggestion[] = geoResults.map((g, i) => ({
                        place_id: Date.now() + i,
                        display_name: `${query} (${g.latitude.toFixed(4)}, ${g.longitude.toFixed(4)})`,
                        lat: String(g.latitude),
                        lon: String(g.longitude),
                    }));
                    setSuggestions(fallbackSuggestions);
                    setSearchError(null);
                } else {
                    setSuggestions([]);
                    setSearchError('Search failed. Check your internet connection.');
                }
            } catch (fallbackErr) {
                console.error('Fallback geocode error:', fallbackErr);
                setSuggestions([]);
                setSearchError('Search failed. Check your internet connection.');
            }
        } finally {
            clearTimeout(timeoutId);
            if (!controller.signal.aborted) {
                setSearching(false);
            }
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
            }, 800); // 800ms debounce (Nominatim requires ≤1 req/sec)
        } else {
            setSuggestions([]);
            setSearchError(null);
        }
    };
    
    // Handled submitting via keyboard "Search" button
    const handleSearchSubmit = () => {
        Keyboard.dismiss();
        if (suggestions.length > 0) {
            // Select the first suggestion if available
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

    // Removed old handleSearch since we now use handleSearchChange and selection
    // const handleSearch = async () => ... 
    
    const handleCurrentLocation = async () => {
        if (!locationPermission) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            setLocationPermission(true);
        }

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

    const handleSaveLocation = async () => {
        setLoading(true);
        try {
            // Reverse geocode to get address string
            const addressResult = await Location.reverseGeocodeAsync({
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude
            });

            let addressString = '';
            if (addressResult.length > 0) {
                const addr = addressResult[0];
                const parts = [
                    addr.street,
                    addr.district,
                    addr.city,
                    addr.region,
                    addr.country
                ].filter(Boolean);
                addressString = parts.join(', ');
            } else {
                addressString = `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`;
            }

            // Get token
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                throw new Error('No auth token found');
            }

            // Update Backend (Live Location)
            const response = await fetch(`${API_URL}/api/users/location`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    address: addressString
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update location on server');
            }

            const data = await response.json();

            // Update local storage to keep it in sync with backend
            const storedUser = await AsyncStorage.getItem('userData');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                parsedUser.currentLocation = data.currentLocation;
                await AsyncStorage.setItem('userData', JSON.stringify(parsedUser));
            }

            // Update Global State
            // We update the 'location' coordinates but NOT the permanent 'address'
            updateUserData({
                location: selectedLocation
            });

            setLoading(false);
            Alert.alert(
                "Live Location Updated",
                "Your current location has been shared.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error(error);
            setLoading(false);
            Alert.alert("Error", "Failed to save location details.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F41BB" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Location</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={initialRegion}
                    onRegionChangeComplete={onRegionChangeComplete}
                    showsUserLocation={locationPermission}
                    showsMyLocationButton={false} // We implement custom button
                />
                
                {/* Fixed marker in the center of the screen */}
                <View style={styles.markerFixed}>
                    <Ionicons name="location" size={40} color="#1F41BB" />
                </View>

                {/* Search Bar Overlay */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#6B7280" style={{ marginLeft: 10 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search location in Pakistan..."
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            onSubmitEditing={handleSearchSubmit}
                            returnKeyType="search"
                        />
                        {searching ? (
                             <ActivityIndicator size="small" color="#1F41BB" style={{ marginRight: 10 }} />
                        ) : searchQuery.length > 0 ? (
                            <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); setSearchError(null); }}>
                                <Ionicons name="close-circle" size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    
                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            <FlatList
                                data={suggestions}
                                keyExtractor={(item) => String(item.place_id)}
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
                                keyboardShouldPersistTaps="always"
                                nestedScrollEnabled
                            />
                        </View>
                    )}
                    {searchError && suggestions.length === 0 && !searching && (
                        <View style={styles.searchErrorContainer}>
                            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                            <Text style={styles.searchErrorText}>{searchError}</Text>
                        </View>
                    )}
                </View>

                {/* Current Location Button */}
                <TouchableOpacity style={styles.currentLocationButton} onPress={handleCurrentLocation}>
                    <Ionicons name="locate" size={24} color="#1F41BB" />
                </TouchableOpacity>

                {/* Info Overlay */}
                <View style={styles.infoOverlay}>
                    <Text style={styles.infoText}>
                        {searching ? "Searching..." : "Drag map to pin exact location"}
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Button
                    text={loading ? "Saving..." : "Save Location"}
                    onPress={handleSaveLocation}
                    disabled={loading}
                />
            </View>
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
        paddingHorizontal: 15,
        paddingTop: 10, // Further reduced from 44 to move header up more
        paddingBottom: 10, // Reduced from 15 for a slimmer header
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFF',
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F41BB',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        width: Dimensions.get('window').width,
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
    searchContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 999,
        elevation: 10,
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
        elevation: 10,
        zIndex: 999,
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
    searchErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        marginTop: 5,
        borderRadius: 10,
        padding: 12,
    },
    searchErrorText: {
        flex: 1,
        fontSize: 13,
        color: '#EF4444',
        marginLeft: 8,
    },
    currentLocationButton: {
        position: 'absolute',
        bottom: 80, // Above info overlay if needed, or adjust
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
    infoOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoText: {
        color: '#374151',
        fontSize: 14,
        textAlign: 'center',
    },
    footer: {
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
});
