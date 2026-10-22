import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CloudRain, ArrowLeft, Wind, Sun, AlertTriangle, Navigation } from "lucide-react-native";

export default function WeatherInfo() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024;

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* HERO SECTION */}
                <View className="h-[60vh] relative">
                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1563514227142-7a2f4e4a643f?q=80&w=2500&auto=format&fit=crop" }}
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
                            <Text className="text-white font-black uppercase tracking-[0.3em] mb-4">Hyper-Local Intelligence</Text>
                            <Text className="text-6xl md:text-8xl font-serif font-bold text-white mb-6">Precision Weather</Text>
                            <Text className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed">
                                Don't rely on city-wide forecasts. Get 1km-resolution weather data specifically for your farm boundary.
                            </Text>
                        </Animated.View>
                    </View>
                </View>

                {/* CONTENT SECTION */}
                <View className="px-8 md:px-20 py-24 max-w-7xl mx-auto">
                    <View className="flex-col md:flex-row gap-16 items-center">
                        <View className="flex-1">
                            <Text className="text-4xl font-serif font-bold text-stone-900 mb-8">Plan with Confidence</Text>
                            <Text className="text-lg text-stone-600 leading-relaxed mb-6">
                                Small variations in micro-climates can mean the difference between a successful spray and a wasted investment. Our precision intelligence helps you pick the perfect window.
                            </Text>

                            <View className="space-y-8 mt-12">
                                <InfoFeatureItem
                                    icon={Navigation}
                                    title="Geofenced Forecasts"
                                    desc="Customized alerts based on the exact coordinates of your various land parcels."
                                />
                                <InfoFeatureItem
                                    icon={AlertTriangle}
                                    title="Critical Stress Alerts"
                                    desc="Receive push notifications for frost, heatwaves, or high-intensity rain events before they hit."
                                />
                                <InfoFeatureItem
                                    icon={CloudRain}
                                    title="Irrigation Planning"
                                    desc="Smart evapotranspiration calculations tell you exactly how much water your soil needs."
                                />
                            </View>
                        </View>

                        <View className="flex-1 bg-stone-100 rounded-[3rem] p-4 border border-stone-200 shadow-2xl overflow-hidden">
                            <Image
                                source={{ uri: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1500&auto=format&fit=crop" }}
                                className="w-full h-[500px] rounded-[2.5rem]"
                                resizeMode="cover"
                            />
                        </View>
                    </View>

                    {/* CALL TO ACTION */}
                    <View className="mt-32 bg-sky-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
                        <View className="relative z-10 text-center">
                            <Text className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">Never be surprised by the sky again.</Text>
                            <TouchableOpacity
                                onPress={() => router.push("/signup")}
                                className="bg-amber-500 px-10 py-5 rounded-full self-center flex-row items-center"
                            >
                                <Text className="text-green-950 font-black text-xl uppercase tracking-wider mr-2">Get Local Weather</Text>
                                <Sun size={24} color="#052e16" />
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
            <View className="bg-sky-100 p-4 rounded-2xl">
                <Icon size={24} color="#0369a1" />
            </View>
            <View className="flex-1">
                <Text className="text-xl font-bold text-stone-900 mb-2">{title}</Text>
                <Text className="text-stone-500 leading-relaxed font-medium">{desc}</Text>
            </View>
        </View>
    );
}
