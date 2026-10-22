import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator, ImageBackground, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Tag, Plus, TrendingUp, Search, Wheat, Filter, Store } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useEffect, useState } from "react";
import Config from "../../constants/Config";
import AppHeader from "../../components/AppHeader";

export default function MarketplaceScreen() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMarketItems();
    }, []);

    const fetchMarketItems = async () => {
        try {
            const response = await fetch(`${Config.API_URL}/features/market`);
            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch market items:", error);
        } finally {
            setLoading(false);
        }
    };

    const [modalVisible, setModalVisible] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', price: '', quantity: '', location: 'Punjab, India', tags: [] });
    const [submitting, setSubmitting] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All Crops");

    // Filter Logic
    const filteredItems = (Array.isArray(items) ? items : []).filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;

        if (activeCategory === "All Crops") return matchesSearch;

        const tags = item.tags || [];
        const combinedText = (item.name + " " + tags.join(" ")).toLowerCase();

        // Smart Category Matching
        if (activeCategory === "Vegetables") {
            const vegKeywords = ["vegetable", "potato", "onion", "tomato", "cauliflower", "cabbage", "spinach", "okra", "brinjal"];
            return matchesSearch && vegKeywords.some(k => combinedText.includes(k));
        }

        if (activeCategory === "Grains") {
            const grainKeywords = ["grain", "wheat", "rice", "maize", "corn", "millet", "barley", "paddy"];
            return matchesSearch && grainKeywords.some(k => combinedText.includes(k));
        }

        // Fallback for other potential categories
        return matchesSearch && combinedText.includes(activeCategory.toLowerCase().slice(0, -1));
    });

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) {
            alert("Please enter crop name and price");
            return;
        }

        setSubmitting(true);
        try {
            // Construct query params as expected by the current backend endpoint
            // Note: In a real app, this should probably be a JSON body, but the backend uses Query params currently.
            // We will stick to the existing backend signature: name, price, buyer, distance, tags

            const params = new URLSearchParams({
                name: newItem.name,
                price: `₹${newItem.price}/q`,
                buyer: "Open Market", // Default for now
                distance: "2 km",
                tags: newItem.tags ? newItem.tags.toString() : "Fresh,Organic"
            });

            const response = await fetch(`${Config.API_URL}/features/market?${params.toString()}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (response.ok) {
                setModalVisible(false);
                setNewItem({ name: '', price: '', quantity: '', location: 'Punjab, India' });
                fetchMarketItems(); // Refresh list
            } else {
                alert("Failed to list item");
            }
        } catch (error) {
            console.error(error);
            alert("Error listing item");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-[#f9fafb]">
            <AppHeader title="Marketplace" />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <View className="max-w-7xl self-center w-full">

                    {/* Rustic Banner Header */}
                    <View className="mb-10 relative bg-[#78350f] rounded-3xl p-8 overflow-hidden shadow-xl shadow-amber-900/20">
                        <ImageBackground
                            source={{ uri: "https://www.transparenttextures.com/patterns/wood-pattern.png" }}
                            resizeMode="repeat"
                            className="absolute inset-0 opacity-20"
                        />
                        <View className="flex-row justify-between items-end relative z-10">
                            <View>
                                <View className="flex-row items-center gap-2 mb-2">
                                    <Store size={20} color="#fbbf24" />
                                    <Text className="text-amber-400 font-bold uppercase tracking-widest text-xs">Direct Farmer-to-Buyer</Text>
                                </View>
                                <Text className="text-4xl font-serif font-bold text-white mb-2">Global Mandi</Text>
                                <Text className="text-amber-100 max-w-lg leading-relaxed">Connect directly with verified buyers, bypass middlemen, and get transparent rates for your harvest.</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(true)}
                                className="bg-amber-500 hover:bg-amber-600 px-6 py-3 rounded-full shadow-lg shadow-amber-900/50 hidden md:flex"
                            >
                                <Text className="text-white font-bold font-serif">+ List Your Crop</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Filter & Search Bar - Cardboard Style */}
                    <View className="flex-col md:flex-row gap-4 mb-8">
                        <View className="flex-1 bg-[#fff] p-1 rounded-xl shadow-sm border border-stone-200 flex-row items-center relative z-20">
                            <View className="p-3">
                                <Search size={20} color="#a8a29e" />
                            </View>
                            <TextInput
                                className="flex-1 text-stone-700 font-medium h-full"
                                placeholder="Find crops, seeds, or equipment..."
                                placeholderTextColor="#a8a29e"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <View className="flex-row gap-4">
                            {["All Crops", "Vegetables", "Grains"].map((cat) => (
                                <FilterButton
                                    key={cat}
                                    label={cat}
                                    active={activeCategory === cat}
                                    onPress={() => setActiveCategory(cat)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Stats Strip - Ticket Style */}
                    <View className="flex-row gap-4 mb-8 overflow-hidden">
                        <StatTicket label="Avg. Wheat" value="₹2,250/q" trend="+5.2%" color="bg-orange-100" textColor="text-orange-800" />
                        <StatTicket label="Avg. Rice" value="₹3,100/q" trend="-1.2%" color="bg-stone-200" textColor="text-stone-800" />
                    </View>

                    <Text className="text-xl font-serif font-bold text-stone-800 mb-6 border-b border-stone-200 pb-2 self-start">Live Contracts</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#d97706" className="mt-10" />
                    ) : (
                        <View className="flex-row flex-wrap gap-6">
                            {filteredItems.map((item, index) => (
                                <Animated.View key={item.id} entering={FadeInDown.delay(index * 100)} className="w-full md:w-[48%] lg:w-[32%]">
                                    <View className="bg-white group rounded-xl border border-stone-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                        {/* Top Tag */}
                                        <View className="absolute top-4 right-4 bg-amber-100 px-3 py-1 rounded-sm border border-amber-200 z-10 rotate-1">
                                            <Text className="text-amber-800 font-bold text-xs uppercase">{item.tags?.[0] || 'CROP'}</Text>
                                        </View>

                                        {/* CardContent with Z-Index fix */}
                                        <View className="p-6 relative z-10">
                                            <View className="mb-4">
                                                <Text className="text-2xl font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors">{item.name}</Text>
                                                <View className="flex-row items-center mt-1 gap-1">
                                                    <MapPin size={14} color="#78716c" />
                                                    <Text className="text-stone-500 text-sm font-medium">{item.distance}</Text>
                                                </View>
                                            </View>

                                            <View className="bg-stone-50 p-4 rounded-lg border border-stone-100 mb-4 border-dashed">
                                                <Text className="text-stone-400 text-xs font-bold uppercase mb-1">Buyer Offer</Text>
                                                <Text className="text-stone-900 font-bold text-lg">{item.buyer}</Text>
                                            </View>

                                            <View className="flex-row items-end justify-between border-t border-stone-100 pt-4 bg-white/50 backdrop-blur-sm rounded-b-lg">
                                                <View>
                                                    <Text className="text-stone-400 text-xs font-bold uppercase">Rate</Text>
                                                    <Text className="text-2xl font-black text-green-700">{item.price}</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => alert("Offer Sent!")} className="bg-stone-900 hover:bg-black px-5 py-2 rounded-lg shadow-md">
                                                    <Text className="text-white font-bold text-sm">Sell Now</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Decorative Wheat Background */}
                                        <Wheat size={120} color="#f5f5f4" className="absolute -bottom-6 -left-6 z-0 -rotate-12 group-hover:scale-110 transition-transform opacity-50" />
                                    </View>
                                </Animated.View>
                            ))}
                            {filteredItems.length === 0 && (
                                <View className="w-full flex-1 items-center justify-center py-20">
                                    <View className="bg-stone-100 p-6 rounded-full mb-4">
                                        <Filter size={32} color="#a8a29e" />
                                    </View>
                                    <Text className="text-stone-400 font-bold text-lg">No crops found matching your criteria.</Text>
                                    <TouchableOpacity onPress={() => { setSearchQuery(""); setActiveCategory("All Crops"); }} className="mt-4">
                                        <Text className="text-amber-600 font-bold">Clear Filters</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="absolute bottom-8 right-8 bg-amber-600 w-16 h-16 rounded-full justify-center items-center shadow-2xl shadow-amber-900/50 hover:bg-amber-700 hover:scale-105 transition-all z-50 border-4 border-white"
                activeOpacity={0.9}
            >
                <Plus size={32} color="white" />
            </TouchableOpacity>

            {/* Simple Add Item Modal */}
            {modalVisible && (
                <View className="absolute inset-0 bg-black/50 z-50 justify-center items-center p-4">
                    <View className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                        <Text className="text-xl font-serif font-bold text-stone-800 mb-4">List New Crop</Text>

                        <View className="space-y-4">
                            <View>
                                <Text className="text-xs font-bold text-stone-500 uppercase mb-1">Crop Name</Text>
                                <TextInput
                                    className="bg-stone-50 border border-stone-200 rounded-lg p-3 font-bold text-stone-800"
                                    placeholder="e.g. Basmati Rice"
                                    value={newItem.name}
                                    onChangeText={(t) => setNewItem({ ...newItem, name: t })}
                                />
                            </View>

                            <View>
                                <Text className="text-xs font-bold text-stone-500 uppercase mb-1">Expected Price (Per Quintal)</Text>
                                <TextInput
                                    className="bg-stone-50 border border-stone-200 rounded-lg p-3 font-bold text-stone-800"
                                    placeholder="e.g. 2500"
                                    keyboardType="numeric"
                                    value={newItem.price}
                                    onChangeText={(t) => setNewItem({ ...newItem, price: t })}
                                />
                            </View>

                            <View>
                                <Text className="text-xs font-bold text-stone-500 uppercase mb-1">Category Code</Text>
                                <View className="flex-row gap-2">
                                    {["Vegetable", "Grain", "Other"].map(opt => (
                                        <TouchableOpacity
                                            key={opt}
                                            onPress={() => setNewItem({ ...newItem, tags: [opt] })}
                                            className={`px-3 py-2 rounded-lg border ${newItem.tags?.includes(opt) ? 'bg-amber-100 border-amber-500' : 'bg-stone-50 border-stone-200'}`}
                                        >
                                            <Text className={`text-xs font-bold ${newItem.tags?.includes(opt) ? 'text-amber-800' : 'text-stone-500'}`}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View className="flex-row gap-4 mt-6">
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="flex-1 bg-stone-100 py-3 rounded-xl items-center"
                            >
                                <Text className="font-bold text-stone-600">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddItem}
                                disabled={submitting}
                                className="flex-1 bg-amber-600 py-3 rounded-xl items-center shadow-lg shadow-amber-600/30"
                            >
                                {submitting ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text className="font-bold text-white">List Now</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

function FilterButton({ label, active, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`px-4 py-2 rounded-full border ${active ? 'bg-stone-800 border-stone-800' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
        >
            <Text className={`font-bold text-sm ${active ? 'text-white' : 'text-stone-600'}`}>{label}</Text>
        </TouchableOpacity>
    )
}

function StatTicket({ label, value, trend, color, textColor }) {
    return (
        <View className={`${color} px-4 py-2 rounded-lg border border-white/20 flex-row items-center gap-4`}>
            <View>
                <Text className={`${textColor} text-xs font-bold uppercase opacity-60`}>{label}</Text>
                <Text className={`${textColor} font-black text-lg`}>{value}</Text>
            </View>
            <View className="bg-white/20 px-2 py-1 rounded">
                <Text className={`${textColor} text-xs font-bold`}>{trend}</Text>
            </View>
        </View>
    )
}
