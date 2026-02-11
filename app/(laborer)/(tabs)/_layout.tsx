import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '../../../components/useColorScheme';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
}) {
    return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
    const colorScheme = useColorScheme();

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
                headerShown: false,
            }}>
            <Tabs.Screen
                name="jobs"
                options={{
                    title: 'Jobs',
                    tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
                }}
            />
            <Tabs.Screen
                name="reviews"
                options={{
                    title: 'Reviews',
                    tabBarIcon: ({ color }) => <TabBarIcon name="star" color={color} />,
                }}
            />
            <Tabs.Screen
                name="notification"
                options={{
                    title: 'Notification',
                    tabBarIcon: ({ color }) => <TabBarIcon name="notifications" color={color} />,
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
