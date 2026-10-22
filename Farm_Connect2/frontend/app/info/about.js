import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Sprout, ArrowLeft, Target, Globe, Award, Leaf } from "lucide-react-native";

export default function AboutInfo() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024;

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* HERO SECTION */}
                <View className="h-[60vh] relative">
                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1500382017468-9049fee74aed?q=80&w=2000&auto=format&fit=crop" }}
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
                            <Text className="text-white font-black uppercase tracking-[0.3em] mb-4">Our Roots</Text>
                            <Text className="text-6xl md:text-8xl font-serif font-bold text-white mb-6">About Us</Text>
                            <Text className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed">
                                Empowering the hands that feed the world through technology, empathy, and data.
                            </Text>
                        </Animated.View>
                    </View>
                </View>

                {/* CONTENT SECTION */}
                <View className="px-8 md:px-20 py-24 max-w-7xl mx-auto">
                    <View className="flex-col md:flex-row gap-16 items-center">
                        <View className="flex-1">
                            <Text className="text-4xl font-serif font-bold text-stone-900 mb-8">The Mission of FarmConnect</Text>
                            <Text className="text-lg text-stone-600 leading-relaxed mb-6">
                                Born from a deep appreciation for the agrarian spirit, FarmConnect was built to solve the modern challenges of climate change and market opacity. We merge ancient wisdom with cutting-edge AI to create a sustainable future for every farmer.
                            </Text>

                            <View className="space-y-8 mt-12">
                                <InfoFeatureItem
                                    icon={Target}
                                    title="Universal Access"
                                    desc="We believe high-tech farming shouldn't be reserved for industrial giants. We bring the lab to your pocket."
                                />
                                <InfoFeatureItem
                                    icon={Globe}
                                    title="Global Standards"
                                    desc="Helping local farmers meet international export standards through better data tracking."
                                />
                                <InfoFeatureItem
                                    icon={Award}
                                    title="Impact Driven"
                                    desc="Our primary KPI is the increase in the average net profit of our 50,000+ member famers."
                                />
                            </View>
                        </View>

                        <View className="flex-1 bg-amber-50 rounded-[3rem] p-4 border border-amber-100 shadow-2xl overflow-hidden">
                            <Image
                                source={{ uri: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1500&auto=format&fit=crop" }}
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
