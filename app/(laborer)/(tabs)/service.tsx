import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';
import Colors from '../../../constants/Colors';
import { useTheme } from '../../../context/ThemeContext';

export default function ServiceScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [categoryWithSubcategories, setCategoryWithSubcategories] = useState<any>(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [myOfferings, setMyOfferings] = useState<any[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [descLayout, setDescLayout] = useState<{ y: number; height: number }>({ y: 0, height: 0 });
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const descRef = useRef<TextInput | null>(null);
  const ensureDescriptionVisible = useCallback(() => {
    const windowH = Dimensions.get('window').height;
    const available = windowH - keyboardHeight - 24;
    const bottom = descLayout.y + descLayout.height;
    const viewBottom = scrollY + available;
    if (descLayout.y < scrollY) {
      const target = Math.max(0, descLayout.y - 12);
      scrollRef.current?.scrollTo({ y: target, animated: true });
    } else if (bottom > viewBottom) {
      const target = scrollY + (bottom - viewBottom) + 12;
      scrollRef.current?.scrollTo({ y: target, animated: true });
    }
  }, [keyboardHeight, descLayout, scrollY]);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, e => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
      setTimeout(ensureDescriptionVisible, 50);
    });
    const h = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    const d = Dimensions.addEventListener('change', () => setTimeout(ensureDescriptionVisible, 50));
    return () => {
      s.remove();
      h.remove();
      // @ts-ignore
      d?.remove?.();
    };
  }, [ensureDescriptionVisible]);

  const currentOffering = useMemo(() => {
    if (!activeSub) return null;
    return myOfferings.find(o => (o.subcategory?._id || o.subcategory) === activeSub._id) || null;
  }, [myOfferings, activeSub]);

  const availableSubs = useMemo(() => {
    if (!categoryWithSubcategories) return [];
    const offered = new Set(
      myOfferings.map((o) => (o.subcategory?._id || o.subcategory))
    );
    return (categoryWithSubcategories.subcategories || []).filter(
      (s: any) => !offered.has(s._id)
    );
  }, [categoryWithSubcategories, myOfferings]);

  React.useEffect(() => {
    if (!categoryWithSubcategories) return;
    const offered = new Set(myOfferings.map((o) => (o.subcategory?._id || o.subcategory)));
    if (activeSub && offered.has(activeSub._id)) {
      setActiveSub(null);
      setPrice('');
      setDescription('');
    } else if (!activeSub && availableSubs.length > 0) {
      setActiveSub(availableSubs[0]);
    }
  }, [categoryWithSubcategories, myOfferings]); 

  const fetchData = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (userToken) {
        const headers: any = { 'Authorization': `Bearer ${userToken}` };

        // Fetch User Profile
        const userRes = await fetch(`${API_URL}/api/users/profile`, { headers });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          
          if (userData.subcategories) {
            setSelectedSubcategories(userData.subcategories.map((s: any) => s._id || s));
          }

          // Fetch full category details
          if (userData.status === 'approved' && (userData.category?._id || userData.category)) {
            const catId = userData.category?._id || userData.category;
            const catRes = await fetch(`${API_URL}/api/categories/${catId}`, { headers });
            if (catRes.ok) {
              const catData = await catRes.json();
              setCategoryWithSubcategories(catData);
              // Preselect first subcategory for convenience
              if (!activeSub && catData.subcategories && catData.subcategories.length > 0) {
                setActiveSub(catData.subcategories[0]);
              }
            }
          }

          // Load my existing offerings
          if (userData.status === 'approved') {
            const offRes = await fetch(`${API_URL}/api/services/mine`, { headers });
            if (offRes.ok) {
              const offData = await offRes.json();
              setMyOfferings(offData || []);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching service data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const toggleSubcategory = async (subId: string) => {
    try {
      setError(null);
      const sub = categoryWithSubcategories?.subcategories?.find((s: any) => s._id === subId);
      if (sub) {
        setActiveSub(sub);
        // If we already have an offering, preload its values
        const existing = myOfferings.find(o => o.subcategory?._id === subId || o.subcategory === subId);
        setPrice(existing ? String(existing.price) : '');
        setDescription(existing ? (existing.description || '') : '');
      }

      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        // Keep legacy selection list synced for discoverability
        const newSelection = Array.from(new Set([...selectedSubcategories, subId]));
        setSelectedSubcategories(newSelection);
        const response = await fetch(`${API_URL}/api/users/subcategories`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ subcategories: newSelection })
        });

        if (!response.ok) {
          throw new Error('Failed to update subcategories');
        }
      }
    } catch (error) {
      console.error('Error toggling subcategory:', error);
    }
  };

  const withinRange = (p: number) => {
    if (!activeSub) return false;
    return p >= activeSub.minPrice && p <= activeSub.maxPrice;
  };

  const saveService = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      if (!activeSub) {
        setError('Please select a service');
        return;
      }
      const p = Number(price);
      if (Number.isNaN(p)) {
        setError('Please enter a valid price');
        return;
      }
      if (!withinRange(p)) {
        setError(`Price must be between ${activeSub.minPrice} and ${activeSub.maxPrice}`);
        return;
      }
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        setError('Not authenticated');
        return;
      }
      const res = await fetch(`${API_URL}/api/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          subcategoryId: activeSub._id,
          price: p,
          description
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to save service');
      }
      // Merge/update local offerings
      setMyOfferings(prev => {
        const idx = prev.findIndex(o => (o.subcategory?._id || o.subcategory) === activeSub._id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = data;
          return copy;
        }
        return [...prev, data];
      });
      setSuccess('Service saved successfully');
      setActiveSub(null);
      setPrice('');
      setDescription('');
      setEditingId(null);
    } catch (e: any) {
      setError(e.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };
  
  const startEdit = (off: any) => {
    const sub = off.subcategory;
    const subObj = typeof sub === 'object' ? sub : categoryWithSubcategories?.subcategories?.find((s: any) => s._id === sub);
    if (subObj) {
      setActiveSub(subObj);
      setPrice(String(off.price));
      setDescription(off.description || '');
      setEditingId(off._id);
    }
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setActiveSub(null);
    setPrice('');
    setDescription('');
  };
  
  const deleteOffering = async (id: string) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) return;
      const res = await fetch(`${API_URL}/api/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to delete service');
      }
      setMyOfferings(prev => prev.filter(o => (o._id || '') !== id));
      if (editingId === id) {
        cancelEdit();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to delete service');
    }
  };

  if (loading && !user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#1F41BB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9FAFB' }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + keyboardHeight }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1F41BB" />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Service Management</Text>
          <Text style={[styles.subtitle, { color: colors.text, opacity: 0.6 }]}>
            Manage the services you provide to customers
          </Text>
        </View>

        {user?.status === 'approved' ? (
          categoryWithSubcategories ? (
            <>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FFFFFF' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconContainer, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F0F4FF' }]}>
                  <Ionicons name="construct" size={20} color="#1F41BB" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Category: {categoryWithSubcategories.name}</Text>
              </View>
              
              <Text style={[styles.sectionSubtitle, { color: colors.text, opacity: 0.6, marginBottom: 15, paddingHorizontal: 5 }]}>
                Select the specific services you want to provide:
              </Text>

              <View style={styles.subcategoriesGrid}>
                {availableSubs.map((sub: any) => {
                  const isSelected = activeSub?._id === sub._id;
                  return (
                    <TouchableOpacity
                      key={sub._id}
                      style={[
                        styles.subcategoryChip,
                        { 
                          backgroundColor: isSelected ? '#1F41BB' : (colorScheme === 'dark' ? '#2A2A2A' : '#F3F4F6'),
                          borderColor: isSelected ? '#1F41BB' : (colorScheme === 'dark' ? '#333' : '#E5E7EB')
                        }
                      ]}
                      onPress={() => toggleSubcategory(sub._id)}
                    >
                      <Text style={[
                        styles.subcategoryChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text }
                      ]}>
                        {sub.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 5 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {availableSubs.length === 0 && (
                <Text style={[styles.infoText, { color: colors.text, opacity: 0.7, marginTop: 6 }]}>
                  All subcategories are already configured below.
                </Text>
              )}
              
              {activeSub && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ marginBottom: 6, color: colors.text, opacity: 0.7 }}>
                    Allowed price range: {activeSub.minPrice} - {activeSub.maxPrice}
                  </Text>
                  {currentOffering && (
                    <Text style={{ marginBottom: 8, fontSize: 12, color: currentOffering.isActive ? '#065F46' : '#991B1B' }}>
                      Status: {currentOffering.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  )}
                  {editingId && (
                    <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 12, flex: 1, marginRight: 8 }}>Editing: {activeSub.name}</Text>
                      <TouchableOpacity onPress={cancelEdit} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F3F4F6' }}>
                        <Text style={{ color: '#111827', fontWeight: '700' }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={{ backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}>
                    <Text style={{ fontSize: 12, color: colors.text, opacity: 0.6, marginBottom: 6 }}>Service Price (PKR)</Text>
                    <TextInput
                      accessibilityLabel="Service price input"
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                      placeholder={`${activeSub.minPrice} - ${activeSub.maxPrice}`}
                      placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      style={styles.input}
                    />
                  </View>
                  <View onLayout={e => setDescLayout({ y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })} style={{ marginTop: 10, backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}>
                    <Text style={{ fontSize: 12, color: colors.text, opacity: 0.6, marginBottom: 6 }}>Description</Text>
                    <TextInput
                      ref={ref => { descRef.current = ref; }}
                      accessibilityLabel="Service description input"
                      value={description}
                      onChangeText={setDescription}
                      onFocus={ensureDescriptionVisible}
                      onContentSizeChange={ensureDescriptionVisible}
                      placeholder="Describe the service you will provide"
                      placeholderTextColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      multiline
                      style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    />
                  </View>
                  {error && (
                    <View style={styles.warningContainer}>
                      <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                      <Text style={styles.warningText}>{error}</Text>
                    </View>
                  )}
                  {success && (
                    <View style={[styles.warningContainer, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                      <Text style={[styles.warningText, { color: '#065F46' }]}>{success}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Save service"
                    onPress={saveService}
                    disabled={saving}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Service'}</Text>
                  </TouchableOpacity>
                </View>
              )}
              
            </View>
            
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FFFFFF' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconContainer, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#E0F2FE' }]}>
                  <Ionicons name="list" size={20} color="#1F41BB" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>My Services</Text>
              </View>
              {myOfferings.length === 0 ? (
                <Text style={[styles.infoText, { color: colors.text, opacity: 0.7 }]}>
                  No services saved yet. Configure a service above and save it.
                </Text>
              ) : (
                <View style={{ gap: 12 }}>
                  {myOfferings.map((off) => {
                    const sub = off.subcategory?.name || off.subcategory;
                    const active = !!off.isActive;
                    return (
                      <View key={(off._id || sub) as string} style={styles.serviceRow}>
                        <View style={styles.serviceHeader}>
                          <Text style={[styles.serviceTitle, { color: colors.text }]}>{sub}</Text>
                          <View style={[styles.statusPill, !active && styles.statusPillInactive]}>
                            <Text style={styles.statusPillText}>{active ? 'Active' : 'Inactive'}</Text>
                          </View>
                        </View>
                        <Text style={styles.priceText}>PKR {off.price}</Text>
                        {off.description ? (
                          <Text numberOfLines={3} style={[styles.descText, { color: colors.text, opacity: 0.8 }]}>{off.description}</Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                          <TouchableOpacity onPress={() => startEdit(off)} style={styles.rowButtonPrimary}>
                            <Text style={styles.rowButtonPrimaryText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteOffering(off._id)} style={styles.rowButtonDanger}>
                            <Text style={styles.rowButtonDangerText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
            </>
          ) : (
             <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FFFFFF' }]}>
                <Text style={[styles.infoText, { color: colors.text }]}>No category assigned. Please contact support.</Text>
             </View>
          )
        ) : (
          <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FFFFFF' }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="alert-circle" size={20} color="#D97706" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Verification Required</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text, opacity: 0.7 }]}>
              Please complete verification to add services.
            </Text>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIconImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    resizeMode: 'cover',
    backgroundColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  subcategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  subcategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '100%',
  },
  subcategoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#1F41BB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  serviceRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB'
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#DCFCE7'
  },
  statusPillInactive: {
    backgroundColor: '#FEE2E2'
  },
  statusPillText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700'
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  descText: {
    fontSize: 13,
    lineHeight: 18
  },
  rowButtonPrimary: {
    backgroundColor: '#1F41BB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  rowButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  rowButtonDanger: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  rowButtonDangerText: {
    color: '#991B1B',
    fontWeight: '700'
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  }
});
