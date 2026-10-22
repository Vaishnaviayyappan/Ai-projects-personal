import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator, ImageBackground, Linking, Platform, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Shield, CheckCircle, FileText, Landmark, Banknote, ChevronRight, ExternalLink } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useEffect, useState } from "react";
import Config from "../../constants/Config";
import AppHeader from "../../components/AppHeader";

export default function SchemesScreen() {
    const router = useRouter();
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const openLink = (url) => {
        if (!url) {
            alert("Link Unavailable");
            return;
        }
        if (Platform.OS === 'web') {
            window.open(url, '_blank');
        } else {
            Linking.openURL(url);
        }
    };

    const fetchSchemes = async () => {
        try {
            console.log("Fetching schemes from:", `${Config.API_URL}/features/schemes`);
            const response = await fetch(`${Config.API_URL}/features/schemes`);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            setSchemes(data);
            setError(null);
        } catch (error) {
            console.error('Fetch Schemes Error:', error);
            setError("Unable to load schemes.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchSchemes();
    };

    useEffect(() => {
        fetchSchemes();
    }, []);

    return (
        <View className="flex-1 bg-[#fcfbf9]">
            <AppHeader title="Schemes" />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d9488']} />
                }
            >
                <View className="max-w-7xl self-center w-full">


                    {/* Rustic Banner Header */}
                    <View className="mb-10 relative bg-[#134e4a] rounded-3xl p-8 overflow-hidden shadow-2xl">
                        <ImageBackground
                            source={{ uri: "https://www.transparenttextures.com/patterns/wall-4-light.png" }}
                            resizeMode="repeat"
                            className="absolute inset-0 opacity-10"
                        />
                        <View className="flex-row items-center justify-between relative z-10">
                            <View className="flex-1">
                                <View className="flex-row items-center gap-2 mb-3">
                                    <Landmark size={20} color="#2dd4bf" />
                                    <Text className="text-teal-400 font-bold uppercase tracking-widest text-xs">Ministry of Agriculture</Text>
                                </View>
                                <Text className="text-4xl font-serif font-bold text-white mb-4 leading-tight">Policy & <Text className="text-teal-400">Subsidies</Text></Text>
                                <Text className="text-teal-100 max-w-xl text-lg leading-relaxed mb-6">Government support designed for your growth. Access funding, insurance, and equipment subsidies directly.</Text>
                            </View>
                            <View className="hidden md:flex bg-white/10 p-6 rounded-full border border-white/20">
                                <FileText size={48} color="white" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Eligibility "Check" Card */}
                <View className="mb-10 bg-[#fff] p-8 rounded-xl border-2 border-dashed border-stone-300 relative shadow-sm hover:shadow-md transition-all">
                    <View className="absolute top-0 right-0 bg-green-100 px-4 py-2 rounded-bl-xl border-b border-l border-green-200">
                        <View className="flex-row items-center gap-2">
                            <CheckCircle size={16} color="#15803d" />
                            <Text className="text-green-800 font-bold text-xs uppercase tracking-wider">Eligible Verified</Text>
                        </View>
                    </View>

                    <View className="flex-row flex-wrap items-center justify-between gap-8 pt-4">
                        <View>
                            <Text className="text-stone-400 font-bold text-sm uppercase tracking-widest mb-1">Pre-Approved Grant Amount</Text>
                            <Text className="text-5xl font-serif font-black text-stone-800">₹1,50,000</Text>
                            <Text className="text-stone-500 text-sm mt-2 max-w-md">Based on your land holding (5 Acres) and crop history (Wheat/Rice). Subject to final document verification.</Text>
                        </View>
                        <TouchableOpacity className="bg-stone-900 hover:bg-stone-800 px-8 py-4 rounded-lg flex-row items-center gap-3 shadow-lg">
                            <Banknote size={20} color="white" />
                            <Text className="text-white font-bold text-lg">Claim Subsidy</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text className="text-2xl font-serif font-bold text-stone-800 mb-6 border-b border-stone-200 pb-2 self-start">Active Schemes</Text>

                {loading ? (
                    <ActivityIndicator color="#0d9488" size="large" className="mt-10" />
                ) : error ? (
                    <View className="items-center py-10">
                        <Text className="text-red-500 font-bold mb-4">{error}</Text>
                        <TouchableOpacity onPress={fetchSchemes} className="bg-teal-600 px-6 py-2 rounded-lg">
                            <Text className="text-white font-bold">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : schemes.length === 0 ? (
                    <View className="items-center py-10">
                        <Text className="text-stone-400 font-bold text-lg">No active schemes found.</Text>
                        <Text className="text-stone-400 text-sm">Check back later for updates.</Text>
                    </View>
                ) : (
                    <View className="grid gap-4">
                        {Array.isArray(schemes) && schemes.map((scheme, i) => (
                            <Animated.View key={scheme.id} entering={FadeInDown.delay(i * 100).springify()}>
                                <TouchableOpacity
                                    onPress={() => openLink(scheme.link)}
                                    className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex-row justify-between items-center group cursor-pointer"
                                >
                                    <View className="flex-1 pr-8">
                                        <View className="flex-row items-center mb-2 gap-3">
                                            <Text className="font-serif font-bold text-stone-900 text-xl group-hover:text-teal-700 transition-colors">{scheme.title}</Text>
                                            <View className="bg-stone-100 px-3 py-1 rounded border border-stone-200">
                                                <Text className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">{scheme.type}</Text>
                                            </View>
                                        </View>
                                        <Text className="text-stone-500 leading-relaxed font-medium">{scheme.benefit}</Text>
                                    </View>

                                    <View className="bg-stone-50 p-3 rounded-full group-hover:bg-teal-50 group-hover:translate-x-1 transition-all">
                                        <ExternalLink size={20} color="#78716c" className="group-hover:text-teal-600" />
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>
                )}

                <Text className="text-xs text-stone-300 text-center mt-10">
                    Server: {Config.API_URL}
                </Text>
            </ScrollView >
        </View >
    );
}
