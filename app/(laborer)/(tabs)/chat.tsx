import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../../constants/Api';
import { useSocket } from '../../../context/SocketContext';

interface ChatItem {
    _id: string;
    booking: { _id: string; service: string; status: string };
    customer: { _id: string; name: string; firstName?: string; lastName?: string; profileImage?: string };
    laborer: { _id: string; name: string; profileImage?: string };
    lastMessage?: {
        text: string;
        senderRole: string;
        createdAt: string;
    };
    unreadLaborer: number;
    updatedAt: string;
}

export default function LaborerChatInbox() {
    const router = useRouter();
    const { refreshUnread } = useSocket();
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadChats = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;
            const res = await fetch(`${API_URL}/api/chat/my-chats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (err) {
            console.error('Failed to load chats:', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadChats();
            refreshUnread();
        }, [])
    );

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const renderChat = ({ item }: { item: ChatItem }) => {
        const customerName = item.customer?.name ||
            `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}`.trim() ||
            'Customer';
        const customerImg = item.customer?.profileImage
            ? `${API_URL}${item.customer.profileImage}`
            : null;
        const unread = item.unreadLaborer || 0;
        const lastMsg = item.lastMessage;

        return (
            <TouchableOpacity
                style={styles.chatItem}
                activeOpacity={0.7}
                onPress={() => {
                    const bId = item.booking?._id || item._id;
                    const cId = item._id;
                    const n = encodeURIComponent(customerName);
                    router.push(`/(laborer)/conversation/${bId}?bookingId=${bId}&chatId=${cId}&name=${n}` as any);
                }}
            >
                {customerImg ? (
                    <Image source={{ uri: customerImg }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>{customerName.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.chatName, unread > 0 && styles.chatNameUnread]} numberOfLines={1}>
                            {customerName}
                        </Text>
                        <Text style={[styles.chatTime, unread > 0 && styles.chatTimeUnread]}>
                            {lastMsg?.createdAt ? formatTime(lastMsg.createdAt) : ''}
                        </Text>
                    </View>
                    <View style={styles.chatBottom}>
                        <Text style={styles.chatService} numberOfLines={1}>
                            {item.booking?.service || 'Service'}
                        </Text>
                    </View>
                    <View style={styles.chatBottom}>
                        <Text
                            style={[styles.chatPreview, unread > 0 && styles.chatPreviewUnread]}
                            numberOfLines={1}
                        >
                            {lastMsg
                                ? `${lastMsg.senderRole === 'laborer' ? 'You: ' : ''}${lastMsg.text}`
                                : 'No messages yet'}
                        </Text>
                        {unread > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chats</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1F41BB" />
                </View>
            ) : chats.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#C7D2FE" />
                    <Text style={styles.emptyTitle}>No Conversations</Text>
                    <Text style={styles.emptySubtitle}>
                        Your chats with customers will appear here once you accept a booking.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => item._id}
                    renderItem={renderChat}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    list: {
        paddingVertical: 4,
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarPlaceholder: {
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F41BB',
    },
    chatContent: {
        flex: 1,
        marginLeft: 14,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    chatNameUnread: {
        fontWeight: '700',
    },
    chatTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    chatTimeUnread: {
        color: '#1F41BB',
        fontWeight: '600',
    },
    chatBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 3,
    },
    chatService: {
        fontSize: 12,
        color: '#1F41BB',
        fontWeight: '500',
    },
    chatPreview: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
        marginRight: 8,
    },
    chatPreviewUnread: {
        color: '#374151',
        fontWeight: '600',
    },
    unreadBadge: {
        backgroundColor: '#1F41BB',
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 82,
    },
});
