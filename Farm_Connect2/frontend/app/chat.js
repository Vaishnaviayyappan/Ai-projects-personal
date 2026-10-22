import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, ImageBackground, ScrollView, Image } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { Send, Bot, User, Sparkles, Paperclip, Mic } from "lucide-react-native";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";
import AppHeader from "../components/AppHeader";
import Config from "../constants/Config";

export default function ChatScreen() {
    const router = useRouter();
    const [experts, setExperts] = useState([]);
    const [selectedExpert, setSelectedExpert] = useState(null); // null = AI
    const [userEmail, setUserEmail] = useState("guest");
    const [userName, setUserName] = useState("");

    useEffect(() => {
        if (Platform.OS === 'web') {
            const storedEmail = localStorage.getItem('user_email');
            const storedName = localStorage.getItem('user_name');
            if (storedEmail) setUserEmail(storedEmail);
            if (storedName) {
                const firstName = storedName.split(' ')[0];
                setUserName(firstName);
                setMessages([
                    { id: '1', role: 'assistant', content: `Namaste ${firstName}! I am your AI Farm Assistant. I can check soil health, market prices, or weather forecasts for you. How can I help?` }
                ]);
            }
        }
        fetchExperts();
    }, []);

    const fetchExperts = async () => {
        try {
            const response = await fetch(`${Config.API_URL}/features/experts`);
            const data = await response.json();
            setExperts(data);
        } catch (error) {
            console.error("Failed to fetch experts", error);
        }
    };

    const handleSelectExpert = (expert) => {
        setSelectedExpert(expert);
        setMessages([
            { id: Date.now().toString(), role: 'assistant', content: `Namaste! I am ${expert ? expert.name : "your AI Farm Assistant"}. How can I assist you with ${expert ? expert.specialization : "farming"} today?` }
        ]);
    };

    const [messages, setMessages] = useState([
        { id: '1', role: 'assistant', content: "Namaste! I am your AI Farm Assistant. I can check soil health, market prices, or weather forecasts for you. How can I help?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch(`${Config.API_URL}/agents/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    expert_id: selectedExpert?.id,
                    user_id: userEmail
                })
            });
            const data = await response.json();

            const botMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                steps: data.agent_steps || []
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg = { id: Date.now().toString(), role: 'assistant', content: "I'm having trouble reaching the farm server. Please check your connection." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const isUser = item.role === 'user';
        return (
            <Animated.View
                entering={FadeInUp.springify()}
                layout={Layout.springify()}
                className={`mb-6 w-full flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
            >
                {!isUser && (
                    <View className="w-10 h-10 rounded-full bg-stone-200 border border-stone-300 items-center justify-center mr-3 shadow-sm self-start mt-1">
                        <Bot size={20} color="#57534e" />
                    </View>
                )}

                <View
                    className={`p-5 max-w-[85%] shadow-sm relative ${isUser
                        ? 'bg-[#fef3c7] rounded-tl-xl rounded-tr-xl rounded-bl-xl border-2 border-[#fcd34d] rotate-1' // Post-it style
                        : 'bg-white rounded-tr-xl rounded-br-xl rounded-bl-xl border border-stone-200 -rotate-1' // Paper style
                        }`}
                >
                    {/* Tape effect for user messages */}
                    {isUser && <View className="absolute -top-3 left-1/2 -ml-4 w-8 h-4 bg-yellow-600/20 rotate-3" />}

                    {!isUser && (
                        <Text className="text-stone-400 font-bold text-[10px] uppercase tracking-widest mb-2 border-b border-stone-100 pb-1">Field Expert AI</Text>
                    )}

                    <Text className={`${isUser ? 'text-stone-900 font-handwriting' : 'text-stone-800 font-serif'} text-base leading-relaxed`}>
                        {item.content}
                    </Text>

                    {/* Agent Steps / Reasoning Trace */}
                    {item.steps && item.steps.length > 0 && (
                        <View className="mt-3 pt-2 border-t border-stone-100">
                            <Text className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-2">Autonomous Trace Log</Text>
                            {item.steps.map((step, idx) => (
                                <View key={idx} className="flex-row items-center gap-2 mb-1">
                                    <View className="w-1 h-1 bg-lime-500 rounded-full" />
                                    <Text className="text-[9px] font-mono text-stone-500">{step}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text className={`text-[10px] mt-2 text-right ${isUser ? 'text-amber-800/50' : 'text-stone-400'}`}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {isUser && (
                    <View className="w-10 h-10 rounded-full bg-amber-500 border-2 border-white items-center justify-center ml-3 shadow-sm self-start mt-1">
                        <User size={20} color="white" />
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <View className="flex-1 bg-[#f5f5f4]">
            <AppHeader title="Experts" />

            <View className="flex-1 max-w-4xl self-center w-full bg-[#fdfbf7] md:my-8 md:rounded-xl md:shadow-2xl md:border-8 md:border-[#e7e5e4] overflow-hidden relative">
                {/* Paper Texture Background */}
                <ImageBackground
                    source={{ uri: "https://www.transparenttextures.com/patterns/notebook.png" }}
                    resizeMode="repeat"
                    className="absolute inset-0 opacity-50"
                />

                {/* Spiral Binding */}
                <View className="h-4 bg-stone-300 w-full flex-row justify-evenly items-end pb-1 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <View key={i} className="w-2 h-6 bg-stone-400 rounded-full shadow-inner" />
                    ))}
                </View>

                {/* EXPERT SELECTION HEADER */}
                <View className="bg-stone-50 border-b border-stone-200">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
                        <TouchableOpacity
                            onPress={() => handleSelectExpert(null)}
                            className={`items-center mr-4 p-2 rounded-xl transition-all ${!selectedExpert ? 'bg-amber-100 border border-amber-200 shadow-sm' : 'opacity-60'}`}
                        >
                            <View className="w-12 h-12 rounded-full bg-amber-500 items-center justify-center border-2 border-white mb-1 shadow-sm">
                                <Sparkles size={20} color="white" />
                            </View>
                            <Text className="text-[10px] font-bold uppercase text-stone-600">AI Assistant</Text>
                        </TouchableOpacity>

                        {experts.map(expert => (
                            <TouchableOpacity
                                key={expert.id}
                                onPress={() => handleSelectExpert(expert)}
                                className={`items-center mr-4 p-2 rounded-xl transition-all ${selectedExpert?.id === expert.id ? 'bg-green-100 border border-green-200 shadow-sm' : 'opacity-60'}`}
                            >
                                <Image source={{ uri: expert.image_url }} className="w-12 h-12 rounded-full border-2 border-white mb-1 shadow-sm" />
                                <View className="items-center">
                                    <Text className="text-[10px] font-bold uppercase text-stone-800" numberOfLines={1}>{expert.name.split(' ')[0]}</Text>
                                    <Text className="text-[8px] font-bold text-stone-400">{expert.specialization.split(' ')[0]}</Text>
                                </View>
                                {expert.is_online && <View className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border border-white" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Chat Header Status */}
                <View className="px-4 py-2 border-b border-stone-200 flex-row items-center bg-white/80 backdrop-blur-sm justify-between">
                    <View className="flex-row items-center">
                        <View className="mr-3">
                            {selectedExpert ? (
                                <Image source={{ uri: selectedExpert.image_url }} className="w-8 h-8 rounded-full" />
                            ) : (
                                <Bot size={24} color="#d97706" />
                            )}
                        </View>
                        <View>
                            <Text className="text-stone-800 font-serif font-bold text-base leading-tight">{selectedExpert ? selectedExpert.name : "Field Expert AI"}</Text>
                            <Text className="text-stone-500 text-[10px] font-medium uppercase tracking-wider">{selectedExpert ? selectedExpert.specialization : "Personalized Intelligence Active"}</Text>
                        </View>
                    </View>
                    <View className={`px-2 py-0.5 rounded-full border ${selectedExpert ? (selectedExpert.is_online ? 'bg-green-100 border-green-200' : 'bg-stone-100 border-stone-200') : 'bg-amber-100 border-amber-200'}`}>
                        <Text className={`${selectedExpert ? (selectedExpert.is_online ? 'text-green-700' : 'text-stone-500') : 'text-amber-700'} text-[8px] font-bold uppercase`}>{selectedExpert ? (selectedExpert.is_online ? 'Online' : 'Offline') : 'Precision Mode'}</Text>
                    </View>
                </View>

                {/* Messages List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 24, paddingBottom: 20 }}
                    className="flex-1"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Area */}
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <View className="p-4 bg-[#fdfbf7] border-t-2 border-stone-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                        <View className="flex-row items-end bg-white rounded-xl border-2 border-stone-200 px-4 py-2 focus:border-amber-400 transition-colors shadow-sm">
                            <TouchableOpacity className="p-2 mb-1 mr-1">
                                <Paperclip size={20} color="#a8a29e" />
                            </TouchableOpacity>

                            <TextInput
                                className="flex-1 text-lg text-stone-800 max-h-32 min-h-[50px] font-serif pt-3 pb-3"
                                placeholder="Write your observation..."
                                value={input}
                                onChangeText={setInput}
                                multiline
                                placeholderTextColor="#d6d3d1"
                                onSubmitEditing={sendMessage}
                            />

                            {loading ? (
                                <View className="mb-1 ml-2 p-3 bg-amber-300 rounded-xl shadow-md">
                                    <ActivityIndicator color="white" size="small" />
                                </View>
                            ) : input.length === 0 ? (
                                <TouchableOpacity className="p-2 mb-1 ml-1 bg-stone-100 rounded-lg hover:bg-stone-200">
                                    <Mic size={20} color="#78716c" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={sendMessage}
                                    className="mb-1 ml-2 p-3 bg-amber-500 rounded-xl shadow-md active:scale-95"
                                >
                                    <Send size={20} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text className="text-center text-stone-400 text-[10px] mt-2 font-bold uppercase tracking-widest">AI Generated • Verify Critical Info</Text>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}
