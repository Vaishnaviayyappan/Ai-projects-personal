import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { Cloud, CloudRain, Sun, Wind, Thermometer, MapPin, Droplets, ArrowUpRight } from "lucide-react-native";
import Animated, { FadeInUp, FadeInRight, FadeIn } from "react-native-reanimated";
import { useEffect, useState } from "react";
import Config from "../../constants/Config";
import AppHeader from "../../components/AppHeader";

export default function WeatherScreen() {
    const router = useRouter();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await fetch(`${Config.API_URL}/features/weather`);
                const data = await response.json();
                setWeather(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 bg-[#0f172a] flex-col items-center justify-center">
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text className="text-sky-400 mt-4 font-bold tracking-widest text-xs uppercase">Initializing Satellite Link...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#0f172a]">
            {/* Header with Dark Mode override */}
            <AppHeader title="Weather" />

            <ScrollView className="flex-1 bg-[#0f172a]" contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <View className="max-w-7xl self-center w-full">

                    {/* Premium Header */}
                    <View className="mb-10 items-start">
                        <View className="flex-row items-center gap-3 mb-2">
                            <View className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <Text className="text-sky-400 font-bold uppercase tracking-widest text-xs">Live Satellite Feed</Text>
                        </View>
                        <Text className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">Atmospheric <Text className="text-sky-400">Intelligence</Text></Text>
                        <Text className="text-slate-400 text-lg max-w-xl">Precision hyper-local forecasting powered by AI to help you plan irrigation, sowing, and harvesting.</Text>
                    </View>

                    {/* Main Glass Weather Card */}
                    <Animated.View entering={FadeIn.duration(800)} className="bg-white/5 rounded-[40px] border border-white/10 p-8 md:p-12 mb-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                        {/* Background Gradient/Mesh */}
                        <View className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                        <View className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] -ml-32 -mb-32" />

                        <View className="flex-col md:flex-row justify-between items-center relative z-10 gap-10">

                            {/* Left: Big Temp */}
                            <View className="items-center md:items-start">
                                <View className="flex-row items-center bg-white/10 px-5 py-2 rounded-full mb-6 border border-white/5 backdrop-blur-md">
                                    <MapPin size={16} color="#38bdf8" />
                                    <Text className="text-sky-200 ml-2 font-bold tracking-wide">{weather.location}</Text>
                                </View>
                                <View className="flex-row items-start">
                                    <Text className="text-[120px] font-black text-white leading-[1] tracking-tighter shadow-xl">
                                        {weather.temp ? String(weather.temp).replace("°C", "") : "--"}
                                    </Text>
                                    <Text className="text-4xl font-light text-sky-400 mt-4">°C</Text>
                                </View>
                                <Text className="text-3xl text-sky-100 font-medium mt-2 capitalize">{weather.condition}</Text>
                            </View>

                            {/* Right: Grid Details */}
                            <View className="flex-row gap-4 md:gap-6 flex-wrap justify-center">
                                <GlassDetail label="Humidity" value={weather.humidity} icon={Droplets} color="#38bdf8" />
                                <GlassDetail label="Wind Speed" value={weather.wind} icon={Wind} color="#94a3b8" />
                                <GlassDetail label="Rainfall" value={weather.rainfall || '0mm'} icon={CloudRain} color="#818cf8" />
                            </View>
                        </View>
                    </Animated.View>

                    <View className="flex-col lg:flex-row gap-8">
                        {/* Dark Forecast Column */}
                        <View className="flex-1 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-lg">
                            <View className="flex-row items-center justify-between mb-8">
                                <Text className="text-2xl font-bold text-white font-serif">5-Day Outlook</Text>
                                <Sun size={24} color="#fbbf24" />
                            </View>
                            {weather.forecast.map((day, i) => (
                                <ForecastRow key={i} day={day.day} temp={day.temp} icon={Sun} delay={100 + (i * 100)} />
                            ))}
                        </View>

                        {/* Advisory Column */}
                        <View className="flex-1 gap-6">
                            <Animated.View entering={FadeInUp.delay(200)} className="bg-red-500/10 p-8 rounded-3xl border border-red-500/20">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-red-500/20 p-3 rounded-xl mr-3">
                                        <Thermometer size={24} color="#f87171" />
                                    </View>
                                    <Text className="text-red-400 font-bold text-xl uppercase tracking-wider">Heat Alert</Text>
                                </View>
                                <Text className="text-red-200 text-lg leading-relaxed font-medium opacity-90">
                                    Temperatures rising. Irrigation recommended for wheat crops to prevent heat stress and ensure optimal grain filling.
                                </Text>
                            </Animated.View>

                            <Animated.View entering={FadeInUp.delay(300)} className="bg-emerald-500/10 p-8 rounded-3xl border border-emerald-500/20">
                                <View className="flex-row items-center mb-4">
                                    <View className="bg-emerald-500/20 p-3 rounded-xl mr-3">
                                        <CloudRain size={24} color="#34d399" />
                                    </View>
                                    <Text className="text-emerald-400 font-bold text-xl uppercase tracking-wider">Field Note</Text>
                                </View>
                                <Text className="text-emerald-200 text-lg leading-relaxed font-medium opacity-90">
                                    Optimal conditions for paddy nursery preparation. Ensure drainage channels are clear before the expected showers.
                                </Text>
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function GlassDetail({ label, value, icon: Icon, color }) {
    return (
        <View className="bg-white/5 hover:bg-white/10 transition-colors p-6 rounded-3xl items-center w-32 border border-white/10 backdrop-blur-sm shadow-lg">
            <Icon size={32} color={color} className="mb-4 shadow-lg" />
            <Text className="font-bold text-white text-xl mb-1">{value}</Text>
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</Text>
        </View>
    );
}

function ForecastRow({ day, temp, icon: Icon, delay }) {
    return (
        <Animated.View entering={FadeInRight.delay(delay)} className="flex-row justify-between items-center py-5 border-b border-white/5 last:border-0 hover:bg-white/5 px-4 rounded-xl transition-colors cursor-pointer group">
            <Text className="text-slate-300 w-24 font-bold text-lg group-hover:text-white transition-colors">{day}</Text>
            <View className="flex-row items-center bg-white/5 px-3 py-1 rounded-full border border-white/5">
                <Icon size={16} color="#fbbf24" />
                <Text className="text-slate-400 text-xs ml-2 font-bold uppercase">Clear Sky</Text>
            </View>
            <Text className="text-white font-black text-2xl tracking-tight">{temp}</Text>
        </Animated.View>
    );
}
