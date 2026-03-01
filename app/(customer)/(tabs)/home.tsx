import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import ServiceCard from '../../../components/ServiceCard';

import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/Api';
import Colors from '../../../constants/Colors';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface BackendCategory {
  _id: string;
  name: string;
  icon: string;
  subcategories: any[];
}

const AD_IMAGES = [
  { id: '1', image: require('../../../assets/images/advertisement/Gemini_Generated_Image_1zajeb1zajeb1zaj.png') },
  { id: '2', image: require('../../../assets/images/advertisement/Gemini_Generated_Image_2pg7m12pg7m12pg7.png') },
  { id: '3', image: require('../../../assets/images/advertisement/Gemini_Generated_Image_3fy37q3fy37q3fy3.png') },
  { id: '4', image: require('../../../assets/images/advertisement/Gemini_Generated_Image_2pg7m12pg7m12pg7.png') },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState({ latitude: 33.6844, longitude: 73.0479 });
  const [address, setAddress] = useState<string>('');
  const mapRef = useRef<MapView>(null);
  const locationSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationAbortRef = useRef<AbortController | null>(null);



  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const saved = await AsyncStorage.getItem('customerLocation');
        if (saved) {
          const loc = JSON.parse(saved);
          setSelectedLocation({ latitude: loc.latitude, longitude: loc.longitude });
          setAddress(loc.address || '');
        }
      } catch { }
    };
    loadSaved();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced subcategory search
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/subcategories/search?q=${encodeURIComponent(text.trim())}`);
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const getImageUrl = (path: string) => {
    if (!path) return undefined;
    const normalizedPath = path.replace(/\\/g, '/');
    return `${API_URL}/${normalizedPath}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = (activeAdIndex + 1) % AD_IMAGES.length;
      setActiveAdIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeAdIndex]);

  const onAdScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveAdIndex(Math.round(index));
  };

  const renderItem = ({ item }: { item: BackendCategory }) => (
    <ServiceCard
      title={item.name}
      imageUrl={getImageUrl(item.icon)}
      onPress={() => router.push({ pathname: '/category/[id]', params: { id: item._id } })}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#1F41BB' }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerImageContainer}>
          <Image
            source={require('../../../assets/images/laborer_header.png')}
            style={styles.headerImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
            />
            <TouchableOpacity
              accessible accessibilityRole="button" accessibilityLabel="Select location"
              style={styles.locationPill}
              onPress={() => setShowLocationPicker(true)}
            >
              <Ionicons name="location-outline" size={16} color="#1F41BB" />
              <Text style={styles.locationText} numberOfLines={1}>
                {address || 'Select location'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>
            Schedule trusted{'\n'}experts for repairs.
          </Text>
        </View>

      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for service"
          value={search}
          onChangeText={handleSearchChange}
          placeholderTextColor="#9CA3AF"
        />

      </View>

      {/* Search Results Dropdown */}
      {search.trim().length > 0 && (searchResults.length > 0 || searchLoading) && (
        <View style={styles.searchDropdown}>
          {searchLoading ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#1F41BB" />
            </View>
          ) : (
            searchResults.map((item: any) => (
              <TouchableOpacity
                key={item._id}
                style={styles.searchResultItem}
                onPress={() => {
                  setSearch('');
                  setSearchResults([]);
                  router.push({
                    pathname: '/(customer)/subcategory/[id]',
                    params: {
                      id: item._id,
                      title: item.name,
                      customerLat: String(selectedLocation.latitude),
                      customerLng: String(selectedLocation.longitude),
                    },
                  });
                }}
              >
                {item.picture ? (
                  <Image
                    source={{ uri: getImageUrl(item.picture) }}
                    style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10, backgroundColor: '#F3F4F6' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="construct-outline" size={18} color="#1F41BB" style={{ marginRight: 10 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchResultName}>{item.name}</Text>
                  {item.category?.name && (
                    <Text style={styles.searchResultCategory}>{item.category.name}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}



      <FlatList
        style={{ backgroundColor: colorScheme === 'dark' ? '#121212' : '#F3F4F6' }}
        data={categories.slice(0, 6)}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <>
            <View style={styles.adSection}>
              <FlatList
                ref={flatListRef}
                data={AD_IMAGES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onScroll={onAdScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <View style={styles.adSlide}>
                    <Image source={item.image} style={styles.adImage} />
                  </View>
                )}
              />
              <View style={styles.pagination}>
                {AD_IMAGES.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      activeAdIndex === index && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.tint }]}>Categories</Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/all-categories')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {loading && (
              <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1F41BB" />
              </View>
            )}
          </>
        }
        ListFooterComponent={
          <>
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Text style={[styles.sectionTitle, { color: colors.tint }]}>Nearby Workers</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.placeholderWorkers}>
              <View style={styles.placeholderCard} />
              <View style={styles.placeholderCard} />
            </View>
          </>
        }
      />

      <Modal visible={showLocationPicker} animationType="slide" onRequestClose={() => setShowLocationPicker(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowLocationPicker(false)} style={styles.closeMapButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.mapHeaderTitle}>Select Location</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={{ marginLeft: 10 }} />
              <TextInput
                style={styles.locationSearch}
                placeholder="Search location..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  // Clear previous timer & request
                  if (locationSearchTimer.current) clearTimeout(locationSearchTimer.current);
                  if (locationAbortRef.current) locationAbortRef.current.abort();

                  if (!text.trim() || text.length < 3) {
                    setSuggestions([]);
                    setIsSearching(false);
                    return;
                  }
                  setIsSearching(true);
                  locationSearchTimer.current = setTimeout(async () => {
                    const controller = new AbortController();
                    locationAbortRef.current = controller;
                    const timeout = setTimeout(() => controller.abort(), 8000);
                    try {
                      const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5&addressdetails=1&countrycodes=pk&accept-language=en`,
                        {
                          signal: controller.signal,
                          headers: { 'User-Agent': 'SkilledLaborApp/1.0 (contact@skilledlabor.pk)', 'Accept': 'application/json' },
                        }
                      );
                      if (!response.ok) throw new Error(`HTTP ${response.status}`);
                      const data = await response.json();
                      if (!controller.signal.aborted) {
                        setSuggestions(data || []);
                      }
                    } catch (e: any) {
                      if (e?.name !== 'AbortError') {
                        console.error('[LocationSearch] Error:', e?.message);
                        // Fallback: try expo-location geocoding
                        try {
                          const geo = await Location.geocodeAsync(text);
                          if (geo.length > 0) {
                            setSuggestions(geo.map((g, i) => ({
                              place_id: Date.now() + i,
                              display_name: `${text} (${g.latitude.toFixed(4)}, ${g.longitude.toFixed(4)})`,
                              lat: String(g.latitude),
                              lon: String(g.longitude),
                            })));
                          } else {
                            setSuggestions([]);
                          }
                        } catch {
                          setSuggestions([]);
                        }
                      }
                    } finally {
                      clearTimeout(timeout);
                      if (!controller.signal.aborted) setIsSearching(false);
                    }
                  }, 800);
                }}
                returnKeyType="search"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color="#1F41BB" style={{ marginRight: 8 }} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => { setSearchQuery(''); setSuggestions([]); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
                </TouchableOpacity>
              ) : null}
            </View>
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s.place_id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      const lat = parseFloat(s.lat);
                      const lon = parseFloat(s.lon);
                      const region = { latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 } as Region;
                      mapRef.current?.animateToRegion(region, 1000);
                      setSelectedLocation({ latitude: lat, longitude: lon });
                      setSearchQuery(s.display_name);
                      setSuggestions([]);
                    }}
                  >
                    <Ionicons name="location-outline" size={16} color="#1F41BB" />
                    <Text style={styles.suggestionText} numberOfLines={1}>{s.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{ latitude: selectedLocation.latitude, longitude: selectedLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              onRegionChangeComplete={(r) => setSelectedLocation({ latitude: r.latitude, longitude: r.longitude })}
              showsUserLocation={locationPermission}
              showsMyLocationButton={false}
            />
            <View style={styles.markerFixed}>
              <Ionicons name="location" size={40} color="#1F41BB" />
            </View>
          </View>

          {!!locationError && <Text style={{ color: '#DC2626', padding: 12 }}>{locationError}</Text>}

          <View style={{ padding: 16 }}>
            <TouchableOpacity
              style={styles.currentLocationBtn}
              onPress={async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  setLocationPermission(false);
                  setLocationError('Location permission denied');
                  return;
                }
                setLocationPermission(true);
                try {
                  const loc = await Location.getCurrentPositionAsync({});
                  const region = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 } as Region;
                  mapRef.current?.animateToRegion(region, 1000);
                  setSelectedLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                } catch {
                  setLocationError('Could not fetch current location');
                }
              }}
            >
              <Ionicons name="locate-outline" size={18} color="#1F41BB" />
              <Text style={styles.currentLocationText}>Use Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={async () => {
                setLocationLoading(true);
                setLocationError(null);
                try {
                  let displayAddress = address;
                  try {
                    const result = await Location.reverseGeocodeAsync(selectedLocation);
                    if (result.length > 0) {
                      const addr = result[0];
                      const parts = [addr.street, addr.district, addr.city, addr.region].filter(Boolean);
                      displayAddress = parts.join(', ') || displayAddress;
                    }
                  } catch { }

                  const token = await AsyncStorage.getItem('userToken');
                  if (token) {
                    await fetch(`${API_URL}/api/customers/me/location`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                        address: displayAddress
                      })
                    });
                  }
                  setAddress(displayAddress || `${selectedLocation.latitude.toFixed(5)}, ${selectedLocation.longitude.toFixed(5)}`);
                  await AsyncStorage.setItem('customerLocation', JSON.stringify({
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    address: displayAddress
                  }));
                  setShowLocationPicker(false);
                } catch (e: any) {
                  setLocationError('Failed to save location');
                } finally {
                  setLocationLoading(false);
                }
              }}
            >
              {locationLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmText}>Confirm Location</Text>}
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
    backgroundColor: '#F3F4F6', // Light gray background
  },
  header: {
    backgroundColor: '#1F41BB', // Brand Blue from logo
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    minHeight: 150,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#1F41BB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 1, // Ensure search bar stays on top
    overflow: 'hidden',
  },
  headerContent: {
    zIndex: 2,
    marginTop: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EEFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: -60,
    marginLeft: 4,
    maxWidth: '55%',
  },
  locationText: {
    color: '#1F41BB',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 11,
    maxWidth: '75%',
  },
  headerImageContainer: {
    position: 'absolute',
    right: -30,
    top: -8,
    width: 190,
    height: 210,
    borderRadius: 125,
    backgroundColor: '#1F41BB', // Match header background
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeMapButton: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6'
  },
  mapHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  markerFixed: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    height: 44,
    marginTop: 8,
  },
  locationSearch: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 160,
    elevation: 10,
    zIndex: 999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: {
    marginLeft: 8,
    color: '#111827',
    flexShrink: 1,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EEFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  currentLocationText: { color: '#1F41BB', marginLeft: 8, fontWeight: '600' },
  confirmBtn: {
    backgroundColor: '#1F41BB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '700' },
  headerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  logo: {
    width: 60,
    height: 70,
    marginTop: -63,
    marginLeft: -20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 25,
    lineHeight: 36,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  searchContainer: {
    position: 'absolute',
    left: 0,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    top: 175, // Position so it overlaps the blue header and white background like the reference
    marginHorizontal: 20, // Since it's no longer inside the padded header
    shadowColor: '#1F41BB', // Color shadow for premium feel
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#374151',
  },
  searchDropdown: {
    position: 'absolute',
    top: 235, // Positioned just below the search bar
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 10,
    maxHeight: 300,
    zIndex: 100,
    elevation: 15,
    shadowColor: '#1F41BB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  searchResultCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  adSection: {
    marginVertical: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 210,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  adSlide: {
    width: width - 30, // match listContent horizontal padding
    height: '100%',
  },
  adImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFF',
    width: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#1F41BB',
    fontWeight: '600',
  },
  placeholderWorkers: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 15,
    marginTop: 10,
    marginBottom: 100,
  },
  placeholderCard: {
    flex: 1,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

});
