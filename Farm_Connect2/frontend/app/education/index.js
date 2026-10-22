import { View, ScrollView, TouchableOpacity, Image, Text, ImageBackground, ActivityIndicator, Linking, RefreshControl, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { PlayCircle, GraduationCap, Video, Users, BookOpen, Clock, Youtube } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useEffect, useState } from "react";
import Config from "../../constants/Config";
import AppHeader from "../../components/AppHeader";

export default function EducationScreen() {
    const router = useRouter();
    const [tutorials, setTutorials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const openVideo = (url) => {
        console.log("Attempting to open URL:", url);
        if (!url) {
            alert("Video Link Unavailable");
            return;
        }
        if (Platform.OS === 'web') {
            window.open(url, '_blank');
        } else {
            Linking.openURL(url);
        }
    };

    const fetchTutorials = async () => {
        try {
            const response = await fetch(`${Config.API_URL}/features/tutorials`);
            const data = await response.json();
            setTutorials(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTutorials();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTutorials();
    };

    return (
        <View className="flex-1 bg-[#fcfbf9]">
            <AppHeader title="Knowledge" />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
                }
            >
                <View className="max-w-7xl self-center w-full">

                    {/* Rustic Banner Header */}
                    <View className="mb-10 relative bg-[#1e293b] rounded-3xl p-8 overflow-hidden shadow-2xl">
                        <ImageBackground
                            source={{ uri: "https://www.transparenttextures.com/patterns/cubes.png" }}
                            resizeMode="repeat"
                            className="absolute inset-0 opacity-10"
                        />
                        <View className="flex-col md:flex-row items-center justify-between relative z-10 gap-8">
                            <View className="flex-1">
                                <View className="flex-row items-center gap-2 mb-3">
                                    <BookOpen size={20} color="#60a5fa" />
                                    <Text className="text-blue-400 font-bold uppercase tracking-widest text-xs">Farm Academy</Text>
                                </View>
                                <Text className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">Master the Art of <Text className="text-blue-400">Modern Farming</Text></Text>
                                <Text className="text-slate-300 max-w-xl text-lg leading-relaxed mb-6">Access a library of expert-led video tutorials, read guides on new government policies, and connect with other farmers to share wisdom.</Text>

                                <View className="flex-row gap-4">
                                    <TouchableOpacity className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full flex-row items-center gap-2">
                                        <Youtube size={18} color="white" />
                                        <Text className="text-white font-bold">Browse Video Library</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full border border-white/20">
                                        <Text className="text-white font-bold">Reading Materials</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Decorative Feature Card */}
                            <View className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 max-w-sm hidden md:flex">
                                <Text className="text-white font-bold text-lg mb-2">Did You Know?</Text>
                                <Text className="text-slate-300 italic mb-4">"Drip irrigation can save up to 80% of water usage compared to flood irrigation while increasing yield by 30%."</Text>
                                <View className="flex-row items-center gap-3">
                                    <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center">
                                        <GraduationCap size={16} color="white" />
                                    </View>
                                    <Text className="text-blue-200 text-xs font-bold uppercase">Agri-Fact #42</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between mb-8 border-b border-stone-200 pb-4">
                        <Text className="text-2xl font-serif font-bold text-stone-800">Featured Tutorials</Text>
                        <TouchableOpacity>
                            <Text className="text-amber-600 font-bold">View All</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
                    ) : (
                        <View className="flex-row flex-wrap gap-6">
                            {tutorials.map((vid, i) => (
                                <Animated.View key={vid.id} entering={FadeInDown.delay(i * 100).springify()} className="w-full md:w-[48%] lg:w-[32%]">
                                    <TouchableOpacity
                                        onPress={() => openVideo(vid.video_url)}
                                        className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden group h-full flex-col"
                                    >
                                        {/* Thumbnail */}
                                        <View className="h-56 relative bg-stone-900 justify-center items-center overflow-hidden">
                                            <Image
                                                source={{ uri: `${vid.image_url}?q=80&w=800&auto=format&fit=crop` }}
                                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <View className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

                                            <View className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-full items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                                                <PlayCircle size={32} color="white" fill="white" />
                                            </View>

                                            <View className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-white text-xs font-bold flex-row items-center gap-1">
                                                <Clock size={10} color="white" />
                                                <Text className="text-white text-xs font-bold">{vid.duration}</Text>
                                            </View>
                                        </View>

                                        {/* Content */}
                                        <View className="p-5 flex-1 justify-between">
                                            <View>
                                                <View className="flex-row justify-between items-start mb-3">
                                                    <View className="bg-blue-50 px-2 py-1 rounded text-blue-700 border border-blue-100 self-start">
                                                        <Text className="text-blue-700 text-[10px] font-bold uppercase tracking-wider">{vid.category}</Text>
                                                    </View>
                                                    <View className="flex-row items-center gap-1">
                                                        <Users size={12} color="#94a3b8" />
                                                        <Text className="text-slate-400 text-xs font-medium">{vid.views}</Text>
                                                    </View>
                                                </View>
                                                <Text className="text-lg font-bold text-stone-800 leading-tight mb-2 font-serif group-hover:text-blue-700 transition-colors">{vid.title}</Text>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => openVideo(vid.video_url)}
                                                className="mt-4 flex-row items-center"
                                            >
                                                <Text className="text-stone-500 font-bold text-xs uppercase hover:text-stone-800 transition-colors">Watch Video</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
