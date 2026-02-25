
import { Stack } from 'expo-router';
import React from 'react';
import { BookingsProvider } from '../context/BookingsContext';

export default function CustomerLayout() {
    return (
        <BookingsProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="booking/[laborerId]" options={{ headerShown: false }} />
                <Stack.Screen name="booking/details/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="booking-details/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="laborer/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
                <Stack.Screen name="subcategory/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="all-categories" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
            </Stack>
        </BookingsProvider>
    );
}
