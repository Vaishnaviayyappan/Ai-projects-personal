import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Mail, Lock, Sprout, ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import Config from "../constants/Config";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const handleLogin = async () => {
        setStatusMessage("");
        console.log("🟢 Login Button Pressed");
        console.log("🌍 API Request URL:", `${Config.API_URL}/api/v1/auth/login/access-token`);

        if (!email || !password) {
            setStatusMessage("Error: Please fill in all fields");
            // Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        setStatusMessage("Sending Request...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            setStatusMessage("Error: Request Timeout (10s)");
        }, 10000); // 10s timeout

        try {
            console.log("⏳ Sending Request...");
            // Config.API_URL already ends with /api/v1
            const response = await fetch(`${Config.API_URL}/auth/login/access-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            console.log("✅ Response Status:", response.status);
            const data = await response.json();
            console.log("📦 Response Data:", data);

            if (response.ok) {
                console.log("✅ Login Successful. Navigating...");
                setStatusMessage("Success! Redirecting...");

                // Store User Info for Personalization
                if (Platform.OS === 'web') {
                    localStorage.setItem('user_name', data.user_name);
                    localStorage.setItem('user_email', data.user_email);
                }

                try {
                    router.replace("/portal");
                } catch (e) {
                    console.error("Router Replace Failed:", e);
                    setStatusMessage(`Nav Error: ${e.message}`);
                }

                if (Platform.OS === 'web') {
                    setTimeout(() => {
                        console.log("⚠️ Router hanging? Forcing window location...");
                        if (window.location.pathname !== '/portal') {
                            window.location.href = '/portal';
                        }
                    }, 500);
                }
            } else {
                setStatusMessage(`Failed: ${data.detail || "Invalid credentials"}`);
                // Alert.alert("Login Failed", data.detail || "Invalid credentials");
            }
        } catch (error) {
            console.error("❌ Login Error:", error);
            if (error.name === 'AbortError') {
                setStatusMessage("Error: Server Timeout. Is Backend Running?");
            } else {
                setStatusMessage(`Network Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-[#F9FAEF]">
                <View className="flex-1 justify-center items-center px-6 py-12">
                    {/* Back Button */}
                    <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-6 bg-white/50 p-2 rounded-full">
                        <ArrowLeft size={24} color="#064e3b" />
                    </TouchableOpacity>

                    <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md border border-emerald-50">
                        <View className="items-center mb-8">
                            <View className="w-16 h-16 bg-amber-500 rounded-full items-center justify-center mb-4 shadow-lg border-2 border-white/20">
                                <Sprout size={32} color="white" />
                            </View>
                            <Text className="text-3xl font-bold text-emerald-950 text-center">Welcome Back</Text>
                            <Text className="text-gray-500 text-center mt-2">Sign in to access your Farm Connect dashboard</Text>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text className="text-emerald-900 font-semibold mb-2 ml-1">Email Address</Text>
                                <View className="flex-row items-center bg-[#F9FAEF] border border-emerald-100 rounded-xl px-4 py-3.5">
                                    <Mail size={20} color="#059669" />
                                    <TextInput
                                        className="flex-1 ml-3 text-emerald-900"
                                        placeholder="farmer@example.com"
                                        placeholderTextColor="#9ca3af"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View className="mt-4">
                                <Text className="text-emerald-900 font-semibold mb-2 ml-1">Password</Text>
                                <View className="flex-row items-center bg-[#F9FAEF] border border-emerald-100 rounded-xl px-4 py-3.5">
                                    <Lock size={20} color="#059669" />
                                    <TextInput
                                        className="flex-1 ml-3 text-emerald-900"
                                        placeholder="••••••••"
                                        placeholderTextColor="#9ca3af"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            {/* Status Message Area */}
                            {statusMessage ? (
                                <View className={`p-3 rounded-lg mb-4 ${statusMessage.includes("Success") ? "bg-green-100 border-green-200" : "bg-red-50 border-red-100"} border`}>
                                    <Text className={`text-center text-xs font-bold ${statusMessage.includes("Success") ? "text-green-800" : "text-red-800"}`}>
                                        {statusMessage}
                                    </Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                onPress={handleLogin}
                                className="mt-2 shadow-lg shadow-emerald-200"
                                activeOpacity={0.9}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#10b981', '#059669']} // Emerald Gradient
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-4 rounded-xl items-center"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-bold text-lg">Sign In</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View className="flex-row justify-center mt-6">
                                <Text className="text-gray-500">Don't have an account? </Text>
                                <TouchableOpacity onPress={() => router.push("/signup")}>
                                    <Text className="text-emerald-600 font-bold">Sign up</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="mt-6 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <Text className="text-emerald-800 text-center text-sm">
                                    <Text className="font-bold">Demo:</Text> Use any email and password to sign in
                                </Text>
                            </View>

                            {/* EMERGENCY DEBUG BUTTON */}
                            <TouchableOpacity
                                onPress={() => {
                                    console.log("🚀 FORCE NAVIGATION TRIGGERED");
                                    if (Platform.OS === 'web') window.location.href = '/portal';
                                    else router.replace("/portal");
                                }}
                                className="mt-4 bg-red-500 p-2 rounded"
                            >
                                <Text className="text-white text-center font-bold">⚠️ DEBUG: FORCE ENTER PORTAL</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
