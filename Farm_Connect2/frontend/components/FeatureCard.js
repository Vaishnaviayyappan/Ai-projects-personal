import { View, Text, TouchableOpacity, Platform, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useRouter } from "expo-router";

export function FeatureCard({ title, subtitle, icon: Icon, delay, route, color1, color2 }) {
    const router = useRouter();
    const scale = useSharedValue(1);
    const { width } = useWindowDimensions();

    // Responsive Width Logic
    // Mobile (<768px): 47% width (2 columns with gap)
    // Desktop (>768px): 23% width (4 columns with gap)
    const isDesktop = width > 768;
    const cardWidth = isDesktop ? '23%' : '47%';

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).springify()}
            style={[{ width: cardWidth, marginBottom: 16 }, animatedStyle]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
                onPress={() => router.push(route)}
                className="rounded-3xl shadow-sm overflow-hidden h-44" // Fixed height prevent collapse
            >
                <LinearGradient
                    colors={[color1, color2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-1 p-5 justify-between"
                >
                    <View className="bg-white/20 w-12 h-12 rounded-full items-center justify-center backdrop-blur-md">
                        <Icon size={24} color="#fff" />
                    </View>

                    <View>
                        <Text className="text-white font-bold text-lg leading-6 shadow-black/20">{title}</Text>
                        <Text className="text-white/90 text-xs mt-1 font-medium" numberOfLines={1}>{subtitle}</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}
