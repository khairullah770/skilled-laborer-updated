import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['nearest']);
  const flatListRef = useRef<FlatList>(null);

  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const sortOptions = [
    { id: 'price_high_low', label: 'Price (High to Low)', icon: 'trending-down' },
    { id: 'price_low_high', label: 'Price (Low to High)', icon: 'trending-up' },
    { id: 'ratings', label: 'Ratings (Highest to Lowest)', icon: 'star' },
    { id: 'nearest', label: 'Nearest Location', icon: 'location' },
  ];

  const toggleFilter = (id: string) => {
    setSelectedFilters(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    fetchCategories();
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
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
          />
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
          onChangeText={setSearch}
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterVisible(true)}>
          <Ionicons name="options-outline" size={20} color="#1F41BB" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={isFilterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsFilterVisible(false)}
        />
        <View style={styles.filterSheet}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Sort & Filter</Text>
            <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortOption,
                selectedFilters.includes(option.id) && styles.sortOptionSelected
              ]}
              onPress={() => toggleFilter(option.id)}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={selectedFilters.includes(option.id) ? '#1F41BB' : '#6B7280'}
                  style={styles.optionIcon}
                />
                <Text style={[
                  styles.optionLabel,
                  selectedFilters.includes(option.id) && styles.optionLabelSelected
                ]}>{option.label}</Text>
              </View>
              {selectedFilters.includes(option.id) && (
                <Ionicons name="checkmark-circle" size={20} color="#1F41BB" />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setIsFilterVisible(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters ({selectedFilters.length})</Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
  filterButton: {
    padding: 5,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  sortOptionSelected: {
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#1F41BB',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#374151',
  },
  optionLabelSelected: {
    color: '#1F41BB',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#1F41BB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
