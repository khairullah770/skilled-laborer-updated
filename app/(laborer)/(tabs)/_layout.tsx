import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { useColorScheme } from '../../../components/useColorScheme';
import { useSocket } from '../../../context/SocketContext';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
}) {
    return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

function NotificationTabIcon(props: { color: string }) {
    const [unread, setUnread] = useState(0);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const load = async () => {
                try {
                    const stored = await AsyncStorage.getItem('laborerUnreadCount');
                    if (!isActive) return;
                    const count = stored ? parseInt(stored, 10) || 0 : 0;
                    setUnread(count);
                } catch {
                    if (!isActive) return;
                    setUnread(0);
                }
            };
            load();
            return () => {
                isActive = false;
            };
        }, [])
    );

    return (
        <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons size={28} style={{ marginBottom: -3 }} name="notifications" color={props.color} />
            {unread > 0 && (
                <View
                    style={{
                        position: 'absolute',
                        top: -2,
                        right: -6,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: '#EF4444',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 2,
                    }}
                >
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                        {unread > 9 ? '9+' : unread}
                    </Text>
                </View>
            )}
        </View>
    );
}

function ChatTabIcon(props: { color: string }) {
    const { totalUnread } = useSocket();

    return (
        <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons size={28} style={{ marginBottom: -3 }} name="chatbubbles" color={props.color} />
            {totalUnread > 0 && (
                <View
                    style={{
                        position: 'absolute',
                        top: -2,
                        right: -6,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: '#EF4444',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 2,
                    }}
                >
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                        {totalUnread > 9 ? '9+' : totalUnread}
                    </Text>
                </View>
            )}
        </View>
    );
}

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const { reconnect } = useSocket();

    React.useEffect(() => {
        reconnect();
    }, []);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#A0B3F0',
                tabBarStyle: {
                    backgroundColor: '#1F41BB',
                    borderTopWidth: 0,
                    height: 60,
                    paddingBottom: 5,
                    paddingTop: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                headerShown: false,
            }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: 'Jobs',
                    tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
                }}
            />
            <Tabs.Screen
                name="service"
                options={{
                    title: 'Services',
                    tabBarIcon: ({ color }) => <TabBarIcon name="construct" color={color} />,
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chats',
                    tabBarIcon: ({ color }) => <ChatTabIcon color={color} />,
                }}
            />
            <Tabs.Screen
                name="notification"
                options={{
                    title: 'Notification',
                    tabBarIcon: ({ color }) => <NotificationTabIcon color={color} />,
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
                }}
            />
             <Tabs.Screen
                name="dashboard"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                     href: null,
                }}
            />
        </Tabs>
    );
}
