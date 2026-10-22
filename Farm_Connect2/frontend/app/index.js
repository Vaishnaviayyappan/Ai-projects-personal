import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Platform, StyleSheet, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import { ArrowRight, Leaf, Shield, TrendingUp, Sun, Users, Activity, CheckCircle2, BarChart3, Smartphone, Globe2, PlayCircle, Sprout, Tractor, Wheat } from "lucide-react-native";
import { useEffect, useState } from "react";

const { width } = Dimensions.get("window");
const isDesktop = width > 1024;

export default function LandingPage() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    return (
        <View className="flex-1 bg-[#fcfbf9]">
            {/* FARM THEMED HEADER */}
            <View className={`px-6 md:px-12 py-4 flex-row items-center justify-between fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#14532d]/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
                <View className="flex-row items-center gap-2">
                    <View className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center shadow-lg border-2 border-white">
                        <Sprout size={24} color="#fff" />
                    </View>
                    <Text className={`text-2xl font-black tracking-tight ${scrolled ? 'text-white' : 'text-white'}`}>FarmConnect</Text>
                </View>

                {isDesktop && (
                    <View className="flex-row gap-8">
                        <NavText text="Harvest" link="/info/harvest" scrolled={scrolled} />
                        <NavText text="Marketplace" link="/info/markets" scrolled={scrolled} />
                        <NavText text="Community" link="/info/community" scrolled={scrolled} />
                        <NavText text="About" link="/info/about" scrolled={scrolled} />
                    </View>
                )}

                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => router.push("/login")}>
                        <Text className={`font-bold text-sm hover:underline ${scrolled ? 'text-amber-400' : 'text-white'}`}>Log In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push("/signup")}
                        className="bg-amber-500 hover:bg-amber-600 px-6 py-3 rounded-full shadow-lg transition-transform active:scale-95 border border-amber-400"
                    >
                        <Text className="text-white font-extrabold text-sm uppercase tracking-wide">Join the Farm</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 50)}
                scrollEventThrottle={16}
            >
                {/* 1. IMMERSIVE FARM HERO */}
                <View className="relative min-h-screen w-full">
                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1625246333195-bf73842cff61?q=80&w=2500&auto=format&fit=crop" }}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <View className="absolute inset-0 bg-black/40" />
                    <LinearGradient
                        colors={['transparent', '#fcfbf9']}
                        className="absolute bottom-0 w-full h-48"
                    />

                    <View className="flex-1 justify-center items-center text-center px-6 py-20">
                        <Animated.View entering={FadeInUp.delay(200)} className="bg-green-950/90 backdrop-blur-md px-10 py-5 rounded-full border border-green-700/50 mb-12 shadow-2xl skew-x-[-12deg]">
                            <Text className="text-amber-400 font-black uppercase tracking-[0.3em] text-xl md:text-2xl transform skew-x-[12deg]">The Digital Green Revolution</Text>
                        </Animated.View>

                        <Animated.Text entering={FadeInUp.delay(300)} className="text-7xl md:text-[8rem] lg:text-[12rem] font-black text-white text-center leading-[0.8] mb-12 drop-shadow-2xl shadow-black tracking-tighter">
                            CULTIVATING
                            <Text className="text-transparent bg-clip-text h-[1.2em]" style={{ color: '#fbbf24', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 10 }}> ABUNDANCE.</Text>
                        </Animated.Text>

                        <Animated.Text entering={FadeInUp.delay(400)} className="text-4xl md:text-6xl text-white font-black text-center max-w-[95%] mb-40 drop-shadow-2xl leading-none bg-black/40 px-12 py-10 rounded-[3rem] backdrop-blur-xl border-t border-white/20 shadow-2xl uppercase tracking-tighter">
                            Rooted in Tradition. <Text className="text-green-400 italic font-serif">Growing for the Future.</Text>
                        </Animated.Text>

                        {/* Buttons Container */}
                        <Animated.View entering={FadeInUp.delay(500)} className="flex-row justify-center gap-6 mt-12 w-full max-w-4xl mx-auto flex-wrap md:flex-nowrap">

                            {/* Primary CTA */}
                            <TouchableOpacity
                                onPress={() => router.push("/signup")}
                                activeOpacity={0.8}
                                className="bg-amber-500 hover:bg-amber-400 px-8 py-5 rounded-xl border-b-[6px] border-amber-700 active:border-b-0 active:translate-y-1 transition-all shadow-xl shadow-amber-900/30 flex-row items-center justify-center min-w-[220px]"
                            >
                                <Text className="text-green-950 font-black text-xl uppercase tracking-wider mr-2">Start Farming</Text>
                                <Leaf size={24} color="#052e16" strokeWidth={3} />
                            </TouchableOpacity>

                            {/* Secondary CTA */}
                            <TouchableOpacity
                                onPress={() => router.push("/login")}
                                activeOpacity={0.8}
                                className="bg-white/10 backdrop-blur-md hover:bg-white/20 px-8 py-5 rounded-xl border-2 border-white/30 shadow-lg flex-row items-center justify-center min-w-[220px]"
                            >
                                <Text className="text-white font-bold text-xl uppercase tracking-wide mr-2">Success Stories</Text>
                                <PlayCircle size={24} color="white" strokeWidth={2.5} />
                            </TouchableOpacity>

                        </Animated.View>
                    </View>
                </View>

                {/* 2. RUSTIC FEATURES GRID */}
                <View className="py-24 px-6 md:px-12 bg-[#fcfbf9]">
                    <View className="max-w-7xl mx-auto">
                        <View className="text-center mb-16">
                            <Text className="text-green-800 font-bold text-base uppercase tracking-widest mb-2">From Seed to Sale</Text>
                            <Text className="text-4xl md:text-5xl font-serif font-bold text-green-950">Everything a farmer needs.</Text>
                        </View>

                        <View className="flex-row flex-wrap gap-8 justify-center">
                            <RusticCard
                                image="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1500&auto=format&fit=crop"
                                title="Smart Markets"
                                desc="Get real-time mandi prices and sell directly to verified buyers."
                                icon={TrendingUp}
                                link="/info/markets"
                            />
                            <RusticCard
                                image="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=1500&auto=format&fit=crop"
                                title="Crop Health"
                                desc="AI diagnosis of plant diseases from a simple photo."
                                icon={Leaf}
                                link="/info/crop-health"
                            />
                            <RusticCard
                                image="https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1500&auto=format&fit=crop"
                                title="Precision Weather"
                                desc="Hyper-local forecasts to plan your irrigation and sowing."
                                icon={Sun}
                                link="/info/weather"
                            />
                        </View>
                    </View>
                </View>

                {/* 3. WOODEN TEXTURE / NATURE SECTION */}
                <View className="bg-[#1c1917] py-24 relative overflow-hidden">
                    {/* Overlay Image Texture */}
                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1605000797499-95a053545e58?q=80&w=2000&auto=format&fit=crop" }}
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                    />

                    <View className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 flex-col md:flex-row items-center gap-16">
                        <View className="flex-1">
                            <View className="flex-row items-center gap-3 mb-6">
                                <View className="w-12 h-1 bg-amber-500 rounded-full" />
                                <Text className="text-amber-500 font-bold uppercase tracking-wider">Community First</Text>
                            </View>
                            <Text className="text-4xl md:text-6xl font-serif font-bold text-[#f2f2e6] mb-8 leading-tight">
                                Join 50,000+ farmers growing together.
                            </Text>
                            <Text className="text-xl text-stone-300 leading-relaxed mb-10">
                                Farming is better when we share knowledge. Ask experts, share tips, and access government schemes designed for you.
                            </Text>

                            <View className="gap-6">
                                <CommunityRow text="Expert Agronomist Chat" />
                                <CommunityRow text="Government Scheme Finder" />
                                <CommunityRow text="Local Farmer Forums" />
                            </View>

                            <TouchableOpacity
                                onPress={() => router.push("/signup")}
                                className="mt-10 bg-amber-600 hover:bg-amber-700 px-8 py-4 rounded-xl self-start"
                            >
                                <Text className="text-white font-bold text-lg">Join the Community</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-1 w-full relative h-[600px] bg-stone-900 rounded-[2rem] overflow-hidden border-8 border-stone-800 shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700">
                            <Image
                                source={{ uri: "https://images.unsplash.com/photo-1495539406979-bf61750d38ad?q=80&w=1500&auto=format&fit=crop" }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                            <View className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
                                <View className="flex-row items-center gap-4">
                                    <Image
                                        source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
                                        className="w-16 h-16 rounded-full border-4 border-white"
                                    />
                                    <View>
                                        <Text className="text-white font-bold text-xl">Ram Singh</Text>
                                        <Text className="text-amber-400 font-medium">Wheat Farmer, Punjab</Text>
                                    </View>
                                </View>
                                <Text className="text-white mt-4 italic font-medium">"This app doubled my profits by helping me sell at the right time. Truly a blessing."</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 4. FOOTER */}
                <View className="bg-[#14532d] py-16 px-6 border-t border-green-800">
                    <View className="max-w-7xl mx-auto text-center items-center">
                        <View className="w-16 h-16 bg-amber-500 rounded-full items-center justify-center mb-6 border-4 border-white/20">
                            <Sprout size={32} color="#fff" />
                        </View>
                        <Text className="text-3xl font-serif font-bold text-white mb-8">FarmConnect</Text>
                        <Text className="text-green-200 mb-8 max-w-lg">Empowering the hands that feed the world through technology and community.</Text>
                        <Text className="text-green-400 text-sm">© 2024 Farm Connect. Made with ❤️ for farmers.</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

// --- Components ---

function NavText({ text, link, scrolled }) {
    const router = useRouter();
    return (
        <TouchableOpacity onPress={() => router.push(link || "/")}>
            <Text className={`font-bold text-sm tracking-wide transition-colors ${scrolled ? 'text-green-100 hover:text-white' : 'text-white/90 hover:text-white'}`}>{text}</Text>
        </TouchableOpacity>
    );
}

function RusticCard({ image, title, desc, icon: Icon, link }) {
    const router = useRouter();
    return (
        <View className="w-full md:w-[350px] group bg-white rounded-3xl overflow-hidden shadow-xl shadow-stone-200 border border-stone-100 hover:-translate-y-2 transition-transform duration-300">
            <View className="h-48 relative overflow-hidden">
                <Image
                    source={{ uri: image }}
                    className="w-full h-full group-hover:scale-110 transition-transform duration-700"
                    resizeMode="cover"
                />
                <View className="absolute top-4 left-4 w-12 h-12 bg-white rounded-xl items-center justify-center shadow-lg">
                    <Icon size={24} color="#166534" />
                </View>
            </View>
            <View className="p-8">
                <Text className="text-2xl font-bold text-green-950 font-serif mb-3">{title}</Text>
                <Text className="text-stone-500 leading-relaxed mb-6">{desc}</Text>
                <TouchableOpacity
                    onPress={() => router.push(link || "/education")}
                    className="flex-row items-center"
                >
                    <Text className="text-amber-600 font-bold uppercase text-xs tracking-wider">Learn More</Text>
                    <ArrowRight size={14} color="#d97706" className="ml-2" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function CommunityRow({ text }) {
    return (
        <View className="flex-row items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
            <View className="bg-green-600/20 p-2 rounded-full">
                <CheckCircle2 size={20} color="#4ade80" />
            </View>
            <Text className="text-stone-200 font-bold text-lg">{text}</Text>
        </View>
    );
}
