import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView, Platform } from "react-native";

import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Sparkles, Bot, Search, Wind, TrendingUp, CheckCircle, AlertCircle } from "lucide-react-native";
import { API_URL } from "../../constants/Config";
import AppHeader from "../../components/AppHeader";

export default function CropDoctor() {
    const router = useRouter();
    const [image, setImage] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analysisSteps, setAnalysisSteps] = useState([]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            analyzeImage(result.assets[0].uri);
        }
    };

    // Web support for simple File Input if ImagePicker behaves oddly in browser preview
    // But Expo Image Picker works on web usually.

    const analyzeImage = async (uri) => {
        setLoading(true);
        setReport(null);
        setAnalysisSteps(["Initializing Neural Vision...", "Correlating Local Weather...", "Analyzing Market Viability..."]);

        try {
            const formData = new FormData();

            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                const file = new File([blob], "crop_image.jpg", { type: "image/jpeg" });
                formData.append("file", file);
            } else {
                // Native (Android/iOS)
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('file', {
                    uri: uri,
                    name: filename,
                    type: type,
                });
            }

            console.log("📤 Sending Image to:", `${API_URL}/features/analyze/crop`);
            const apiRes = await fetch(`${API_URL}/features/analyze/crop`, {
                method: "POST",
                body: formData,
            });

            console.log("📥 Response Status:", apiRes.status);
            if (!apiRes.ok) {
                const errText = await apiRes.text();
                throw new Error(`Server Error (${apiRes.status}): ${errText}`);
            }

            const data = await apiRes.json();
            setReport(data);
        } catch (error) {
            console.error("Analysis Error Details:", error);
            alert(`Analysis Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <AppHeader title="AI Farm Doctor" />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                <View className="items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-3xl bg-gray-50 mb-8">
                    {image ? (
                        <Image source={{ uri: image }} className="w-64 h-64 rounded-xl" />
                    ) : (
                        <View className="items-center">
                            <Ionicons name="scan" size={64} color="#ccc" />
                            <Text className="text-gray-400 mt-4 text-center">Upload Image of Crop, Animal, or Equipment</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={pickImage}
                        className="mt-6 bg-nature-green px-8 py-3 rounded-full flex-row items-center shadow-lg"
                    >
                        <Ionicons name="camera" size={24} color="white" />
                        <Text className="text-white font-bold ml-2">Select Image</Text>
                    </TouchableOpacity>
                </View>

                {loading && (
                    <View className="mb-10 bg-stone-900 p-6 rounded-[2rem] border border-white/10 shadow-xl">
                        <View className="flex-row items-center gap-4 mb-6">
                            <ActivityIndicator size="small" color="#fbbf24" />
                            <View>
                                <Text className="text-amber-400 font-bold uppercase tracking-widest text-xs">Autonomous Analysis Active</Text>
                                <Text className="text-white text-lg font-serif">Deep Reasoning in progress...</Text>
                            </View>
                        </View>

                        <View className="space-y-3">
                            {analysisSteps.map((step, i) => (
                                <View key={i} className="flex-row items-center gap-3">
                                    <View className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse" />
                                    <Text className="text-stone-400 font-mono text-xs">{step}</Text>
                                </View>
                            ))}
                        </View>

                        <View className="mt-6 pt-4 border-t border-white/5 opacity-50">
                            <Text className="text-stone-500 italic text-[10px]">Utilizing: Vision-LLM + Real-time Enviro-API</Text>
                        </View>
                    </View>
                )}

                {report && (
                    <View className="bg-white rounded-[2rem] border border-stone-200 shadow-xl shadow-stone-200 overflow-hidden mb-12">
                        {/* Header */}
                        <View className="bg-stone-50 p-6 border-b border-stone-200 flex-row justify-between items-center">
                            <View className="flex-row items-center gap-3">
                                <View className="bg-amber-500 p-2 rounded-lg">
                                    <Bot size={20} color="black" />
                                </View>
                                <Text className="text-xl font-serif font-bold text-stone-800">Agentic Analysis Report</Text>
                            </View>
                            <View className="bg-green-100 px-3 py-1 rounded-full flex-row items-center gap-1">
                                <CheckCircle size={12} color="#15803d" />
                                <Text className="text-green-800 font-bold text-[10px] uppercase">Verified AI</Text>
                            </View>
                        </View>

                        <View className="p-8">
                            {/* Main Diagnosis */}
                            <View className="mb-8 items-center bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                <Text className="text-stone-400 font-black uppercase tracking-[0.2em] text-[10px] mb-2">Primary Diagnosis</Text>
                                <Text className="text-3xl font-serif font-bold text-stone-900 text-center">{report.issue_detected}</Text>
                                <View className="mt-4 flex-row items-center gap-2">
                                    <View className="h-1 w-32 bg-stone-200 rounded-full overflow-hidden">
                                        <View className="h-full bg-lime-500 w-[95%]" />
                                    </View>
                                    <Text className="text-stone-500 font-bold text-xs">{(report.confidence * 100).toFixed(0)}% Match</Text>
                                </View>
                            </View>

                            {/* Detailed Response */}
                            <View className="space-y-6">
                                <View>
                                    <View className="flex-row items-center gap-2 mb-3">
                                        <Sparkles size={16} color="#d97706" />
                                        <Text className="text-amber-700 font-bold uppercase tracking-wider text-xs">Autonomous Findings & Plan</Text>
                                    </View>
                                    <View className="bg-[#fdfbf6] p-6 rounded-2xl border border-amber-100">
                                        <Text className="text-stone-800 font-serif text-lg leading-relaxed">
                                            {report.solution}
                                        </Text>
                                    </View>
                                </View>

                                {/* Disclaimer */}
                                <View className="flex-row items-start gap-3 bg-stone-50 p-4 rounded-xl">
                                    <AlertCircle size={16} color="#78716c" />
                                    <Text className="text-stone-500 text-[10px] leading-relaxed flex-1">
                                        This report was generated autonomously by correlating vision data with current weather ({new Date().toLocaleDateString()}) and market trends. Please consult a human expert for high-stakes decisions.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>

    );
}
