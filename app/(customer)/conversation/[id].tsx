import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../../../constants/Api';

interface Message {
  _id: string;
  chat: string;
  senderId: string;
  senderRole: 'customer' | 'laborer';
  text: string;
  read: boolean;
  createdAt: string;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    bookingId?: string;
    chatId?: string;
    name?: string;
  }>();
  const bookingId = params.bookingId || params.id;
  const paramChatId = params.chatId;
  const otherName = params.name;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(paramChatId || null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chatActive, setChatActive] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const headerName = otherName || 'Chat';
  const insets = useSafeAreaInsets();

  // Initialize: get auth, resolve chat, connect socket
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userDataStr = await AsyncStorage.getItem('userData');
        if (!token || !userDataStr) {
          router.back();
          return;
        }
        const userData = JSON.parse(userDataStr);
        const id = userData._id;
        const role = userData.role;
        if (!id) {
          router.back();
          return;
        }

        if (mounted) {
          setUserId(id);
          setUserRole(role);
        }

        // Resolve chat ID from booking if needed
        let resolvedChatId = paramChatId || null;
        if (!resolvedChatId && bookingId) {
          const res = await fetch(`${API_URL}/api/chat/by-booking/${bookingId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('Failed to get chat:', err);
            if (mounted) setLoading(false);
            return;
          }
          const chat = await res.json();
          resolvedChatId = chat._id;
        }

        if (!resolvedChatId) {
          if (mounted) setLoading(false);
          return;
        }
        if (mounted) setChatId(resolvedChatId);

        // Fetch initial messages
        const msgsRes = await fetch(`${API_URL}/api/chat/${resolvedChatId}/messages?page=1&limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (msgsRes.ok) {
          const data = await msgsRes.json();
          if (mounted) {
            setMessages(data.messages || []);
            setHasMore(data.hasMore || false);
            setPage(1);
            if (data.isActive === false) setChatActive(false);
          }
        }

        // Connect Socket.IO
        const socket = io(API_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
        });

        socket.on('connect', () => {
          socket.emit('joinChat', resolvedChatId);
          socket.emit('markRead', resolvedChatId);
        });

        socket.on('newMessage', (msg: Message) => {
          if (mounted) {
            setMessages(prev => {
              // Prevent duplicates
              if (prev.some(m => m._id === msg._id)) return prev;
              return [...prev, msg];
            });
            // Mark as read since we're in the chat
            socket.emit('markRead', resolvedChatId);
          }
        });

        socket.on('messagesRead', () => {
          if (mounted) {
            setMessages(prev => prev.map(m => ({ ...m, read: true })));
          }
        });

        socketRef.current = socket;
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (socketRef.current) {
        if (chatId) socketRef.current.emit('leaveChat', chatId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [bookingId, paramChatId]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !chatId || sending) return;

    setInputText('');
    setSending(true);

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit('sendMessage', { chatId, text });
      } else {
        // REST fallback
        const token = await AsyncStorage.getItem('userToken');
        await fetch(`${API_URL}/api/chat/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        });
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  }, [inputText, chatId, sending]);

  const loadMore = useCallback(async () => {
    if (!chatId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const nextPage = page + 1;
      const res = await fetch(`${API_URL}/api/chat/${chatId}/messages?page=${nextPage}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...(data.messages || []), ...prev]);
        setPage(nextPage);
        setHasMore(data.hasMore || false);
      }
    } catch {}
    setLoadingMore(false);
  }, [chatId, page, hasMore, loadingMore]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === userId;
    return (
      <View style={[styles.messageBubbleRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe ? styles.myTime : styles.otherTime]}>
              {formatTime(item.createdAt)}
            </Text>
            {isMe && (
              <Ionicons
                name={item.read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.read ? '#34D399' : 'rgba(255,255,255,0.5)'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{headerName}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F41BB" />
        </View>
      ) : !chatId ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#C7D2FE" />
          <Text style={styles.emptyText}>Chat is not available yet</Text>
          <Text style={styles.emptySubText}>Chat becomes active once the booking is accepted</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            onLayout={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListHeaderComponent={
              hasMore ? (
                <TouchableOpacity onPress={loadMore} style={styles.loadMoreBtn}>
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#1F41BB" />
                  ) : (
                    <Text style={styles.loadMoreText}>Load older messages</Text>
                  )}
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Ionicons name="chatbubble-outline" size={48} color="#C7D2FE" />
                <Text style={styles.emptyMessagesText}>No messages yet</Text>
                <Text style={styles.emptyMessagesSubText}>Send a message to start the conversation</Text>
              </View>
            }
          />

          {chatActive ? (
            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || sending}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.closedBanner, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <Ionicons name="lock-closed" size={16} color="#6B7280" />
              <Text style={styles.closedBannerText}>This chat is closed. The job has been completed.</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F41BB',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubbleRow: {
    marginVertical: 3,
    flexDirection: 'row',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: '#1F41BB',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myTime: {
    color: 'rgba(255,255,255,0.6)',
  },
  otherTime: {
    color: '#9CA3AF',
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  loadMoreText: {
    color: '#1F41BB',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyMessagesSubText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1F2937',
  },
  sendBtn: {
    backgroundColor: '#1F41BB',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  closedBannerText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});
