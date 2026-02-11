import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="role-selection" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="laborer-login" />
            <Stack.Screen name="laborer-signup" />
            <Stack.Screen name="verification" />
        </Stack>
    );
}
