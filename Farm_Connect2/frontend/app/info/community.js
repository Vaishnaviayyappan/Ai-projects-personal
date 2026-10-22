import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Users, ArrowLeft, MessageSquare, ShieldCheck, Heart, HandHelping } from "lucide-react-native";

export default function CommunityInfo() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024;

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* HERO SECTION */}
                <View className="h-[60vh] relative">
                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1595257841889-addf5c5b09d9?q=80&w=2000&auto=format&fit=crop" }}
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
                            <Text className="text-white font-black uppercase tracking-[0.3em] mb-4">Stronger Together</Text>
                            <Text className="text-6xl md:text-8xl font-serif font-bold text-white mb-6">Our Community</Text>
                            <Text className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed">
                                Join 50,000+ farmers in the fastest-growing digital agricultural network in the world.
                            </Text>
                        </Animated.View>
                    </View>
                </View>

                {/* CONTENT SECTION */}
                <View className="px-8 md:px-20 py-24 max-w-7xl mx-auto">
                    <View className="flex-col md:flex-row gap-16 items-center">
                        <View className="flex-1">
                            <Text className="text-4xl font-serif font-bold text-stone-900 mb-8">Farming is Collaboration</Text>
                            <Text className="text-lg text-stone-600 leading-relaxed mb-6">
                                We believe the best knowledge comes from the field. Our community platforms allow you to connect with neighbors and experts alike to share tips, solve crises, and celebrate harvests.
                            </Text>

                            <View className="space-y-8 mt-12">
                                <InfoFeatureItem
                                    icon={MessageSquare}
                                    title="Expert-Modded Forums"
                                    desc="Ask questions and get answers from verified agronomists and experienced veteran farmers."
                                />
                                <InfoFeatureItem
                                    icon={ShieldCheck}
                                    title="Trusted Network"
                                    desc="Connect with your local FPO (Farmer Producer Organization) via a single tap."
                                />
                                <InfoFeatureItem
                                    icon={Heart}
                                    title="Success Ecosystem"
                                    desc="Access peer-reviewed techniques that are proven to work in your specific soil belt."
                                />
                            </View>
                        </View>

                        <View className="flex-1 bg-green-50 rounded-[3rem] p-4 border border-green-100 shadow-2xl overflow-hidden">
                            <Image
                                source={{ uri: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1500&auto=format&fit=crop" }}
                                style={{ width: '100%', height: 500, borderRadius: 32 }}
                                resizeMode="cover"
                            />
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
            <View className="bg-green-100 p-4 rounded-2xl">
                <Icon size={24} color="#15803d" />
            </View>
            <View className="flex-1">
                <Text className="text-xl font-bold text-stone-900 mb-2">{title}</Text>
                <Text className="text-stone-500 leading-relaxed font-medium">{desc}</Text>
            </View>
        </View>
    );
}
