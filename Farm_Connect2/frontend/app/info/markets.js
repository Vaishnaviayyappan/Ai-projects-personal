import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { TrendingUp, ArrowLeft, BarChart3, Globe2, ShieldCheck, Zap } from "lucide-react-native";

export default function MarketsInfo() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024;

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* HERO SECTION */}
                <View className="h-[60vh] relative">
                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1595257841889-addf5c5b09d9?q=80&w=2500&auto=format&fit=crop" }}
                        className="absolute inset-0 w-full h-full"
                        resizeMode="cover"
                    />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'white']} className="absolute inset-0" />

                    <View className="p-8 md:p-20 justify-end h-full">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/20 backdrop-blur-md self-start p-3 rounded-full mb-8 border border-white/30"
                        >
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Animated.View entering={FadeInDown.delay(200)}>
                            <Text className="text-white font-black uppercase tracking-[0.3em] mb-4">Feature Spotlight</Text>
                            <Text className="text-6xl md:text-8xl font-serif font-bold text-white mb-6">Smart Markets</Text>
                            <Text className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed">
                                Bridging the gap between farmers and global buyers with real-time transparency and zero middlemen.
                            </Text>
                        </Animated.View>
                    </View>
                </View>

                {/* CONTENT SECTION */}
                <View className="px-8 md:px-20 py-24 max-w-7xl mx-auto">
                    <View className="flex-col md:flex-row gap-16 items-center">
                        <View className="flex-1">
                            <Text className="text-4xl font-serif font-bold text-stone-900 mb-8">Why Smart Markets?</Text>
                            <Text className="text-lg text-stone-600 leading-relaxed mb-6">
                                Traditional mandi systems are often opaque, leaving farmers at the mercy of intermediaries. Our Smart Markets platform provides the power of data directly to the producer.
                            </Text>

                            <View className="space-y-8 mt-12">
                                <InfoFeatureItem
                                    icon={BarChart3}
                                    title="Live Mandi Rates"
                                    desc="Access real-time price feeds from over 500 local and national markets."
                                />
                                <InfoFeatureItem
                                    icon={ShieldCheck}
                                    title="Verified Buyers"
                                    desc="Every buyer on our platform undergoes a rigorous multi-step verification process."
                                />
                                <InfoFeatureItem
                                    icon={Globe2}
                                    title="Direct Logistics"
                                    desc="Integrated transport solutions to get your produce from farm to warehouse."
                                />
                            </View>
                        </View>

                        <View className="flex-1 bg-stone-100 rounded-[3rem] p-4 border border-stone-200 shadow-2xl overflow-hidden">
                            <Image
                                source={{ uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1500&auto=format&fit=crop" }}
                                className="w-full h-[500px] rounded-[2.5rem]"
                                resizeMode="cover"
                            />
                        </View>
                    </View>

                    {/* CALL TO ACTION */}
                    <View className="mt-32 bg-[#14532d] rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
                        <View className="relative z-10 text-center">
                            <Text className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">Ready to maximize your harvest value?</Text>
                            <TouchableOpacity
                                onPress={() => router.push("/signup")}
                                className="bg-amber-500 px-10 py-5 rounded-full self-center flex-row items-center"
                            >
                                <Text className="text-green-950 font-black text-xl uppercase tracking-wider mr-2">Start Selling Now</Text>
                                <Zap size={24} color="#052e16" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function InfoFeatureItem({ icon: Icon, title, desc }) {
    return (
        <View className="flex-row items-start gap-6">
            <View className="bg-amber-100 p-4 rounded-2xl">
                <Icon size={24} color="#d97706" />
            </View>
            <View className="flex-1">
                <Text className="text-xl font-bold text-stone-900 mb-2">{title}</Text>
                <Text className="text-stone-500 leading-relaxed font-medium">{desc}</Text>
            </View>
        </View>
    );
}
