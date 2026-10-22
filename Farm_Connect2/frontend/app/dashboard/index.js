import { View, ScrollView, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

function StatCard({ label, value, color, delay }) {
    return (
        <Animated.View entering={FadeInUp.delay(delay)} className={`w-[48%] p-4 rounded-2xl mb-4 ${color}`}>
            <Text className="text-gray-600 text-xs font-bold uppercase">{label}</Text>
            <Text className="text-2xl font-bold text-gray-800 mt-1">{value}</Text>
        </Animated.View>
    );
}

export default function DashboardScreen() {
    const router = useRouter();

    return (
        <ScrollView className="flex-1 bg-nature-white p-6 pt-12">
            <TouchableOpacity onPress={() => router.back()} className="mb-6">
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <Animated.Text entering={FadeInDown} className="text-3xl font-bold text-nature-darkGreen mb-1">My Farm</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(100)} className="text-gray-500 mb-8">Live Real-time Overview</Animated.Text>

            <View className="flex-row flex-wrap justify-between">
                <StatCard label="Soil Moisture" value="62%" color="bg-blue-100" delay={200} />
                <StatCard label="Soil pH" value="6.5" color="bg-green-100" delay={300} />
                <StatCard label="Nitrogen" value="Adequate" color="bg-yellow-100" delay={400} />
                <StatCard label="Pest Risk" value="Low" color="bg-red-100" delay={500} />
            </View>

            <View className="mt-6">
                <Text className="text-xl font-bold text-gray-800 mb-4">Satellite View</Text>
                <View className="h-48 bg-gray-200 rounded-2xl justify-center items-center border border-gray-300 border-dashed">
                    <Ionicons name="map" size={32} color="#999" />
                    <Text className="text-gray-500 mt-2">Map Loading...</Text>
                </View>
            </View>

            <View className="mt-6 mb-10">
                <Text className="text-xl font-bold text-gray-800 mb-4">Upcoming Tasks</Text>
                {['Irrigate Field 2', 'Apply NPK Fertilizer', 'Harvest Tomatoes'].map((task, i) => (
                    <View key={i} className="flex-row items-center py-3 border-b border-gray-100">
                        <View className="w-6 h-6 rounded-full border-2 border-nature-green mr-3" />
                        <Text className="text-gray-700 text-lg">{task}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}
