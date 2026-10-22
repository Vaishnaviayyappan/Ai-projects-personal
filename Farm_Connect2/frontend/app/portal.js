import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, useWindowDimensions, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    LayoutDashboard, AlertTriangle, CloudSun, Droplets, Wind, Camera,
    TrendingUp, TrendingDown, Minus, Sprout, Leaf, Users, ChevronRight, Activity,
    Bot, Sparkles, Terminal, Info
} from "lucide-react-native";
import { useState, useEffect } from "react";
import { API_URL } from "../constants/Config";
import AppHeader from "../components/AppHeader";

export default function PortalDashboard() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024;

    const [weather, setWeather] = useState(null);
    const [marketTrends, setMarketTrends] = useState([]);
    const [aiInsight, setAiInsight] = useState("Gathering Intelligence...");
    const [agentLog, setAgentLog] = useState([
        "Initializing Farm Neural Network...",
        "Scanning satellite data for Punjab...",
        "Evaluating soil moisture levels..."
    ]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Farmer");

    useEffect(() => {
        try {
            // Defensive check for Platform
            const isWeb = typeof Platform !== 'undefined' ? Platform.OS === 'web' : (typeof window !== 'undefined' && window.document);

            if (isWeb) {
                const storedName = localStorage.getItem('user_name');
                if (storedName) setUserName(storedName.split(' ')[0]);
            }
        } catch (e) {
            console.error("Storage Error:", e);
        }
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setAiInsight("Analyzing...");
            setAgentLog(prev => ["Syncing with AG-Node-X1...", ...prev.slice(0, 4)]);

            const weatherRes = await fetch(`${API_URL}/features/weather`);
            const weatherData = await weatherRes.json();
            setWeather(weatherData);

            const marketRes = await fetch(`${API_URL}/features/market/trends`);
            const marketData = await marketRes.json();
            setMarketTrends(marketData);

            const insightRes = await fetch(`${API_URL}/features/agent/insight`);
            const insightData = await insightRes.json();
            setAiInsight(insightData.insight);

            setAgentLog(prev => [
                "Strategic Plan Generated.",
                `Weather Correlated: ${weatherData.condition}`,
                "Market Volatility Assessed.",
                ...prev
            ].slice(0, 6));

        } catch (error) {
            console.error("Dashboard fetch error:", error);
            setAiInsight("Neural Link Interrupted.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-[#fcfbf9]">
                <ActivityIndicator size="large" color="#d97706" />
                <Text className="text-stone-600 mt-4 font-bold tracking-widest text-xs uppercase">Connecting to Farm Neural Network...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#fcfbf9]">
            <AppHeader title="Dashboard" />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <View className="max-w-7xl self-center w-full space-y-8">

                    {/* Welcome Section - Agentic Style */}
                    <Animated.View entering={FadeInDown.delay(100)} className="flex-row items-center justify-between">
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                                <View className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <Text className="text-stone-400 font-bold uppercase tracking-widest text-xs">Autonomous Agent Active</Text>
                            </View>
                            <Text className="text-4xl font-serif font-bold text-stone-800">Hello, {userName}!</Text>
                            <Text className="text-lg font-serif text-stone-500">My Farm Strategy</Text>
                        </View>
                        <TouchableOpacity onPress={fetchDashboardData} className="bg-amber-100 px-4 py-2 rounded-full border border-amber-200">
                            <Text className="text-amber-800 font-bold text-xs uppercase flex-row items-center">
                                <Activity size={12} className="mr-1" /> System Live
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* AGENTIC AI INSIGHT BANNER */}
                    <Animated.View entering={FadeInDown.delay(200)} className="bg-stone-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border border-white/10">
                        <View className="absolute top-0 right-0 p-8 opacity-20">
                            <Sparkles size={120} color="white" />
                        </View>
                        <View className="relative z-10">
                            <View className="flex-row items-center gap-2 mb-4">
                                <View className="bg-amber-500 p-2 rounded-lg">
                                    <Bot size={20} color="black" />
                                </View>
                                <Text className="text-amber-400 font-black uppercase tracking-[0.2em] text-sm">Strategic AI Insight</Text>
                            </View>
                            <Text className="text-amber-200 text-2xl font-medium leading-relaxed italic font-serif">
                                "{aiInsight}"
                            </Text>
                        </View>
                    </Animated.View>

                    {/* AGENTIC LOG & ALERTS */}
                    <View className={`flex-col ${isDesktop ? 'lg:flex-row' : ''} gap-6`}>
                        {/* Agent Log - Cyber/Minimalist */}
                        <Animated.View entering={FadeInDown.delay(250)} className="flex-1 bg-stone-900 rounded-[2rem] p-6 border border-white/5 relative overflow-hidden">
                            <View className="flex-row items-center gap-2 mb-4 border-b border-white/10 pb-2">
                                <Terminal size={14} color="#84cc16" />
                                <Text className="text-lime-500 font-bold uppercase tracking-widest text-[10px]">Autonomous Trace Log</Text>
                            </View>
                            <View className="space-y-2">
                                {agentLog.map((log, i) => (
                                    <View key={i} className="flex-row items-start gap-2">
                                        <Text className="text-stone-600 font-mono text-[10px]">{i + 1}#</Text>
                                        <Text className={`text-stone-300 font-medium text-xs ${i === 0 ? 'text-lime-400' : ''}`}>
                                            {log}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                            <View className="mt-4 flex-row items-center gap-1">
                                <View className="w-1.5 h-1.5 bg-lime-500 rounded-full" />
                                <Text className="text-lime-500/50 font-mono text-[9px] uppercase">Awaiting instruction...</Text>
                            </View>
                        </Animated.View>

                        {/* Alerts Section - Paper Style */}
                        <View className="flex-1 space-y-4">
                            <AlertBanner
                                type="urgent"
                                title="STORM WARNING"
                                time="1 hour ago"
                                desc="Heavy rainfall predicted in next 48 hours."
                                onPress={() => router.push("/weather")}
                            />
                            <AlertBanner
                                type="warning"
                                title="PEST DETECTED"
                                time="3 hours ago"
                                desc="Pest activity in nearby fields."
                                onPress={() => router.push("/chat")}
                            />
                        </View>
                    </View>

                    {/* Widgets Row 1 - Glass/Nature */}
                    <View className={`flex-col ${isDesktop ? 'lg:flex-row' : ''} gap-6`}>
                        {/* Weather Widget - Clickable */}
                        <TouchableOpacity onPress={() => router.push("/weather")} className="flex-1">
                            <View className="bg-blue-500 rounded-[2rem] p-0 shadow-xl shadow-blue-200 overflow-hidden relative min-h-[300px] h-full transition-transform hover:-translate-y-1">
                                <Image
                                    source={{ uri: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000&auto=format&fit=crop" }}
                                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                                />
                                <LinearGradient colors={['rgba(2, 132, 199, 0.8)', 'rgba(2, 132, 199, 1)']} className="absolute inset-0" />

                                <View className="p-8 relative z-10 h-full justify-between">
                                    <View className="flex-row justify-between items-start">
                                        <View>
                                            <View className="flex-row items-center gap-2 mb-2">
                                                <CloudSun size={20} color="#bae6fd" />
                                                <Text className="text-blue-100 font-bold uppercase tracking-widest text-xs">Live Forecast</Text>
                                            </View>
                                            <Text className="text-6xl font-black text-white">{weather?.temp || '--'}</Text>
                                            <Text className="text-blue-100 text-xl font-medium">{weather?.condition}</Text>
                                        </View>
                                        <View className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                                            <ChevronRight size={24} color="white" />
                                        </View>
                                    </View>

                                    <View className="flex-row gap-6 bg-black/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <WeatherStat icon={Droplets} label="Humidity" value={weather?.humidity} />
                                        <WeatherStat icon={CloudSun} label="Rain" value={weather?.rainfall || '0mm'} />
                                        <WeatherStat icon={Wind} label="Wind" value={weather?.wind} />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Crop Health Widget */}
                        <View className="flex-[1.5] bg-white rounded-[2rem] p-2 shadow-xl shadow-stone-200 border border-stone-100">
                            <View className="bg-[#f5f5f4] rounded-[1.5rem] p-6 h-full border border-stone-200 border-dashed relative overflow-hidden flex-col justify-between">
                                <View>
                                    <View className="flex-row justify-between items-center mb-6 relative z-10">
                                        <View className="flex-row items-center gap-3">
                                            <View className="bg-green-100 p-2 rounded-full">
                                                <Leaf size={20} color="#15803d" />
                                            </View>
                                            <Text className="text-xl font-serif font-bold text-stone-800">Crop Doctor</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => router.push("/doctor")} className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-full flex-row items-center shadow-lg shadow-green-200 transition-transform active:scale-95">

                                            <Camera size={16} color="white" />
                                            <Text className="text-white font-bold ml-2 text-xs uppercase tracking-wide">Scan Crop</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View className="flex-row gap-4 items-start relative z-10">
                                        <Image
                                            source={{ uri: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=400&auto=format&fit=crop" }}
                                            className="w-24 h-24 rounded-2xl border-4 border-white shadow-sm -rotate-3"
                                        />
                                        <View className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                                            <Text className="font-bold text-stone-800 text-lg mb-1">Wheat Field #2</Text>
                                            <View className="flex-row items-center gap-2 mb-2">
                                                <AlertTriangle size={14} color="#eab308" />
                                                <Text className="text-amber-600 text-xs font-bold uppercase">Attention Needed</Text>
                                            </View>
                                            <Text className="text-stone-500 text-sm leading-relaxed">Minor nitrogen deficiency detected. Recommended action: Top dressing urea.</Text>
                                        </View>
                                    </View>
                                </View>
                                <Sprout size={120} color="#e7e5e4" className="absolute -bottom-4 -right-4 z-0" />
                            </View>
                        </View>
                    </View>

                    {/* Row 2: Market + Chat Link */}
                    <View className={`flex-col ${isDesktop ? 'lg:flex-row' : ''} gap-6`}>

                        {/* Market Prices Widget - Clickable */}
                        <TouchableOpacity onPress={() => router.push("/marketplace")} className="flex-[2] bg-[#fffbeb] p-8 rounded-[2rem] border border-[#fcd34d] shadow-xl shadow-amber-100 relative overflow-hidden transition-transform hover:-translate-y-1">
                            <View className="absolute top-0 right-0 w-32 h-32 bg-amber-200/50 rounded-full blur-3xl -mr-10 -mt-10" />

                            <View className="flex-row justify-between items-center mb-8 relative z-10">
                                <View>
                                    <Text className="text-amber-800 font-bold text-xs uppercase tracking-widest mb-1">Live Mandi Rates</Text>
                                    <Text className="text-3xl font-serif font-bold text-stone-900">Market Watch</Text>
                                </View>
                                <View className="bg-stone-900 p-2 rounded-full">
                                    <ChevronRight size={20} color="white" />
                                </View>
                            </View>

                            <View className="flex-row flex-wrap gap-4 relative z-10">
                                {marketTrends.map((item, index) => (
                                    <MarketCard
                                        key={index}
                                        label={item.label}
                                        price={item.price}
                                        change={item.change}
                                        trend={item.trend}
                                    />
                                ))}
                            </View>
                        </TouchableOpacity>

                        {/* Expert Chat Link Card */}
                        <TouchableOpacity onPress={() => router.push("/chat")} className="flex-1 bg-white rounded-[2rem] p-8 shadow-xl shadow-stone-200 border border-stone-100 relative overflow-hidden group hover:border-green-300 transition-all">
                            <LinearGradient colors={['rgba(220, 252, 231, 0.3)', 'rgba(255, 255, 255, 0)']} className="absolute inset-0" />

                            <View className="flex-col justify-between h-full relative z-10">
                                <View>
                                    <View className="bg-green-100 w-12 h-12 rounded-2xl items-center justify-center mb-4">
                                        <Users size={24} color="#15803d" />
                                    </View>
                                    <Text className="text-2xl font-serif font-bold text-stone-800 mb-2">Need Advice?</Text>
                                    <Text className="text-stone-500 leading-relaxed font-medium">Chat with our AI Agronomist or schedule a video call with a human expert.</Text>
                                </View>
                                <View className="flex-row items-center mt-6">
                                    <Text className="text-green-700 font-bold uppercase tracking-wider text-xs">Open Chat</Text>
                                    <ChevronRight size={16} color="#15803d" className="ml-1" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

// --- Components ---

function AlertBanner({ type, title, time, desc, onPress }) {
    const isUrgent = type === 'urgent';
    return (
        <TouchableOpacity onPress={onPress}>
            <Animated.View entering={FadeInDown.delay(100)} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white flex-row items-start gap-4 ${isUrgent ? 'border-l-red-500' : 'border-l-amber-500'} hover:bg-stone-50 transition-colors`}>
                <View className={`p-2 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <AlertTriangle size={20} color={isUrgent ? '#ef4444' : '#f59e0b'} />
                </View>
                <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className={`font-black text-sm uppercase tracking-wide ${isUrgent ? 'text-red-900' : 'text-amber-900'}`}>{title}</Text>
                        <Text className="text-stone-400 text-xs font-bold">{time}</Text>
                    </View>
                    <Text className="text-stone-600 leading-relaxed font-medium">{desc}</Text>
                </View>
                <View className="bg-stone-100 px-3 py-2 rounded-lg self-center">
                    <Text className="text-stone-600 font-bold text-xs uppercase">View</Text>
                </View>
            </Animated.View>
        </TouchableOpacity>
    )
}

function WeatherStat({ icon: Icon, label, value }) {
    return (
        <View className="items-center">
            <Icon size={18} color="white" className="mb-1 opacity-80" />
            <Text className="text-white font-bold text-lg">{value}</Text>
            <Text className="text-blue-200 text-[10px] font-bold uppercase tracking-wider">{label}</Text>
        </View>
    )
}

function MarketCard({ label, price, change, trend }) {
    const isHigh = trend === 'high';
    const isLow = trend === 'low';
    const color = isHigh ? '#15803d' : isLow ? '#b91c1c' : '#78716c';
    const Icon = isHigh ? TrendingUp : isLow ? TrendingDown : Minus;
    const badgeBg = isHigh ? 'bg-green-100' : isLow ? 'bg-red-50' : 'bg-stone-100';
    const badgeText = isHigh ? 'text-green-800' : isLow ? 'text-red-800' : 'text-stone-500';

    return (
        <View className="flex-1 min-w-[140px] bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <View className="absolute top-0 right-0 w-16 h-16 bg-stone-50 rounded-bl-full -mr-8 -mt-8 z-0 group-hover:bg-amber-50 transition-colors" />

            <View className="relative z-10">
                <Text className="text-stone-500 font-bold text-xs uppercase tracking-wide mb-1">{label}</Text>
                <Text className="text-2xl font-black text-stone-800 mb-2">{price}</Text>

                <View className="flex-row items-center gap-2">
                    <View className={`px-2 py-1 rounded-md flex-row items-center gap-1 ${badgeBg}`}>
                        <Icon size={12} color={color} />
                        <Text className={`text-xs font-bold ${badgeText}`}>{change}</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}
