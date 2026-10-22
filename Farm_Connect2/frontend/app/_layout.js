import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { View } from "react-native";
import { useEffect } from "react";

export default function RootLayout() {
    const [loaded, error] = useFonts({});

    useEffect(() => {
        if (error) console.error("Font Error:", error);
    }, [error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <View className="flex-1 bg-nature-white">
            <StatusBar style="dark" />
            <View className="flex-1 w-full">
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: "#FAF9F6" },
                        animation: 'fade'
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="portal" />
                    <Stack.Screen name="weather/index" />
                    <Stack.Screen name="marketplace/index" />
                    <Stack.Screen name="chat" />
                    <Stack.Screen name="education/index" />
                    {/* Add schemes/index if it exists */}
                    <Stack.Screen name="schemes/index" />
                </Stack>
            </View>
        </View>
    );
}
