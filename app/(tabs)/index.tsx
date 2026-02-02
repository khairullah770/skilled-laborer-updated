import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ServiceCard from '../../components/ServiceCard';

import { useRouter } from 'expo-router';
import { CATEGORIES, Category } from '../../constants/Categories';
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const AD_IMAGES = [
  { id: '1', image: require('../../assets/images/advertisement/Gemini_Generated_Image_1zajeb1zajeb1zaj.png') },
  { id: '2', image: require('../../assets/images/advertisement/Gemini_Generated_Image_2pg7m12pg7m12pg7.png') },
  { id: '3', image: require('../../assets/images/advertisement/Gemini_Generated_Image_3fy37q3fy37q3fy3.png') },
  { id: '4', image: require('../../assets/images/advertisement/Gemini_Generated_Image_2pg7m12pg7m12pg7.png') },
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

  const renderItem = ({ item }: { item: Category }) => (
    <ServiceCard
      title={item.title}
      iconName={item.icon}
      onPress={() => router.push({ pathname: '/category/[id]', params: { id: item.id } })}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#1F41BB' }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerImageContainer}>
          <Image
            source={require('../../assets/images/laborer_header.png')}
            style={styles.headerImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.branding}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>
            Schedule trusted{'\n'}experts for repairs.
          </Text>
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
        data={CATEGORIES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
    paddingTop: 5,
    paddingBottom: 20,
    minHeight: 100,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1, // Ensure search bar stays on top
  },
  headerContent: {
    zIndex: 2,
    marginTop: 10,
  },
  headerImageContainer: {
    position: 'absolute',
    right: -30,
    top: 10,
    width: 190,
    height: 210,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle highlight
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: -50, // Reset manual offset
  },
  logo: {
    width: 140,
    height: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 25,
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 55,
    marginBottom: -45,
    marginTop: 5, // Floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
    padding: 10,
    paddingTop: 60, // Space for floating search bar
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  adSection: {
    marginVertical: 15,
    marginHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adSlide: {
    width: width - 20, // container padding
    height: 200,
  },
  adImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
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
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F41BB',
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
