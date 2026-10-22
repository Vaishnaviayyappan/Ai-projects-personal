import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { User, Mail, Lock, Sprout, ArrowLeft, Phone, MapPin } from "lucide-react-native";
import { useState } from "react";
import Config from "../constants/Config";

export default function SignupScreen() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const handleSignup = async () => {
        setStatusMessage("");
        console.log("🟢 Signup Button Pressed");
        console.log("🌍 API Request URL:", `${Config.API_URL}/api/v1/auth/signup`);

        if (!name || !email || !password || !phone) {
            setStatusMessage("Error: Please fill in all required fields");
            return;
        }

        setLoading(true);
        setStatusMessage("Creating Account...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            setStatusMessage("Error: Request Timeout (10s)");
        }, 10000); // 10s timeout

        try {
            console.log("⏳ Sending Request...");
            // Config.API_URL already ends with /api/v1
            const response = await fetch(`${Config.API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: name,
                    role: "farmer",
                    location: location || "Punjab"
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            console.log("✅ Response Status:", response.status);
            const data = await response.json();
            console.log("📦 Response Data:", data);

            if (response.ok) {
                console.log("✅ Signup Successful. Navigating...");
                setStatusMessage("Success! Navigating...");

                // Store User Info for Personalization
                if (Platform.OS === 'web') {
                    localStorage.setItem('user_name', data.user_name);
                    localStorage.setItem('user_email', data.user_email);
                }

                // Attempt 1: Router Replace
                try {
                    router.replace("/portal");
                } catch (e) {
                    console.error("Router Replace Failed:", e);
                    setStatusMessage(`Nav Error: ${e.message}`);
                }

                // Attempt 2: Web Fallback (if router fails or hangs)
                if (Platform.OS === 'web') {
                    setTimeout(() => {
                        console.log("⚠️ Router hanging? Forcing window location...");
                        if (window.location.pathname !== '/portal') {
                            window.location.href = '/portal';
                        }
                    }, 500);
                }
            } else {
                setStatusMessage(`Failed: ${data.detail || "Could not create account."}`);
            }
        } catch (error) {
            console.error("❌ Signup Error:", error);
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
                    <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-6 bg-white/50 p-2 rounded-full z-10">
                        <ArrowLeft size={24} color="#064e3b" />
                    </TouchableOpacity>

                    <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md border border-emerald-50">
                        <View className="items-center mb-8">
                            <View className="w-16 h-16 bg-amber-500 rounded-full items-center justify-center mb-4 shadow-lg border-2 border-white/20">
                                <Sprout size={32} color="white" />
                            </View>
                            <Text className="text-3xl font-bold text-emerald-950 text-center">Join Farm Connect</Text>
                            <Text className="text-gray-500 text-center mt-2">Start your journey with AI-powered farming</Text>
                        </View>

                        <View className="space-y-4">
                            <InputField label="Full Name" icon={User} placeholder="Rajesh Kumar" value={name} onChangeText={setName} />
                            <InputField label="Email Address" icon={Mail} placeholder="farmer@example.com" value={email} onChangeText={setEmail} />
                            <InputField label="Phone Number" icon={Phone} placeholder="+91 98765 43210" value={phone} onChangeText={setPhone} />
                            <InputField label="Location" icon={MapPin} placeholder="Punjab, India" value={location} onChangeText={setLocation} />
                            <InputField label="Password" icon={Lock} placeholder="••••••••" secure value={password} onChangeText={setPassword} />

                            {/* Status Message Area */}
                            {statusMessage ? (
                                <View className={`mt-6 p-3 rounded-lg ${statusMessage.includes("Success") ? "bg-green-100 border-green-200" : "bg-red-50 border-red-100"} border`}>
                                    <Text className={`text-center text-xs font-bold ${statusMessage.includes("Success") ? "text-green-800" : "text-red-800"}`}>
                                        {statusMessage}
                                    </Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                onPress={handleSignup}
                                className="mt-8 shadow-lg shadow-emerald-200"
                                activeOpacity={0.9}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#10b981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="py-4 rounded-xl items-center"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-bold text-lg">Create Account</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View className="flex-row justify-center mt-6">
                                <Text className="text-gray-500">Already have an account? </Text>
                                <TouchableOpacity onPress={() => router.push("/login")}>
                                    <Text className="text-emerald-600 font-bold">Sign in</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function InputField({ label, icon: Icon, placeholder, secure, value, onChangeText }) {
    return (
        <View className="mt-3">
            <Text className="text-emerald-900 font-semibold mb-2 ml-1">{label}</Text>
            <View className="flex-row items-center bg-[#F9FAEF] border border-emerald-100 rounded-xl px-4 py-3.5">
                <Icon size={20} color="#059669" />
                <TextInput
                    className="flex-1 ml-3 text-emerald-900"
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={secure}
                    value={value}
                    onChangeText={onChangeText}
                />
            </View>
        </View>
    );
}
