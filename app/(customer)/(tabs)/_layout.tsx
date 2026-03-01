import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useColorScheme } from '../../../components/useColorScheme';
import { useSocket } from '../../../context/SocketContext';

function ChatTabIcon(props: { color: string }) {
    const { totalUnread } = useSocket();

    return (
        <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons size={24} name="chatbubbles" color={props.color} />
            {totalUnread > 0 && (
                <View
                    style={{
                        position: 'absolute',
                        top: -4,
                        right: -8,
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
        tabBarInactiveTintColor: '#C7D2FE',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1F41BB',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Ionicons name="clipboard" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notification',
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
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
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
