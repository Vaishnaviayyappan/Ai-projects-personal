import { View, Text, TouchableOpacity, useWindowDimensions, Animated as RNAnimated, Alert } from "react-native";
import { Sprout, LayoutDashboard, ShoppingBag, Users, BookOpen, ScrollText, LogOut, Menu, X, Cloud, LogIn } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { useState, useRef, useEffect } from "react";
// Mock Auth Storage for Demo - In real app use AsyncStorage or Context
// For now, we assume if they are on /portal or sub-pages, they are logged in.
// If they are on /education or /schemes coming from landing, they might be guest.

export default function AppHeader({ title }) {
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024;
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useRef(new RNAnimated.Value(0)).current;

    const handleProtectedNav = (path) => {
        setMenuOpen(false);
        // Simple client-side check for demo purposes
        // In a real app, you would check a specific token key
        // Assuming "no token" means not logged in

        // ALLOWING GUEST ACCESS FOR DEMO TO ANSWER USER'S QUESTION
        // "How can you authenticate without logging in?" -> "Guest Mode"
        // But if we want to enforce it:
        // if (!localStorage.getItem("access_token")) { router.push("/login"); return; }

        router.push(path);
    };

    useEffect(() => {
        RNAnimated.timing(slideAnim, {
            toValue: menuOpen ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [menuOpen]);


    const menuTranslateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-400, 0],
    });

    return (
        <View className="z-50 relative">
            <View className="bg-[#14532d] px-6 py-4 flex-row items-center justify-between shadow-md z-50 relative">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.push("/")} className="flex-row items-center">
                        <View className="bg-amber-500 w-10 h-10 rounded-full items-center justify-center mr-3 shadow-lg border-2 border-white/20">
                            <Sprout size={24} color="white" fill="white" />
                        </View>
                        <Text className="text-2xl font-black text-white tracking-tight font-serif">FarmConnect</Text>
                    </TouchableOpacity>

                    {/* Mobile Breadcrumb */}
                    {!isDesktop && title && (
                        <View className="flex-row items-center ml-4 opacity-80 hidden sm:flex">
                            <Text className="text-amber-400 font-bold mx-2">/</Text>
                            <Text className="text-amber-100 text-lg font-medium tracking-wide">{title}</Text>
                        </View>
                    )}
                </View>

                {/* Desktop Navigation */}
                {isDesktop ? (
                    <View className="flex-row gap-2 bg-[#052e16]/50 p-1.5 rounded-full border border-white/10">
                        <NavLink icon={LayoutDashboard} text="Dashboard" active={title === "Dashboard"} onPress={() => handleProtectedNav("/portal")} />
                        <NavLink icon={ShoppingBag} text="Marketplace" active={title === "Marketplace"} onPress={() => handleProtectedNav("/marketplace")} />
                        <NavLink icon={Users} text="Experts" active={title === "Experts"} onPress={() => handleProtectedNav("/chat")} />
                        <NavLink icon={BookOpen} text="Knowledge" active={title === "Knowledge"} onPress={() => handleProtectedNav("/education")} />
                        <NavLink icon={ScrollText} text="Schemes" active={title === "Schemes"} onPress={() => handleProtectedNav("/schemes")} />
                        <NavLink icon={Cloud} text="Weather" active={title === "Weather"} onPress={() => handleProtectedNav("/weather")} />
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} className="p-2 bg-white/10 rounded-full">
                        {menuOpen ? <X size={24} color="#fcd34d" /> : <Menu size={24} color="#fcd34d" />}
                    </TouchableOpacity>
                )}

                {isDesktop && (
                    <View className="flex-row gap-2">
                        {/* If in a real app, check auth state here */}
                        <TouchableOpacity
                            onPress={() => router.replace("/")}
                            className="flex-row items-center bg-[#052e16] px-4 py-2 rounded-full border border-white/10 hover:bg-amber-600 transition-colors"
                        >
                            <LogOut size={16} color="#fbbf24" />
                            <Text className="ml-2 font-bold text-amber-100 text-sm uppercase tracking-wider">Logout</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Mobile Drondown Menu */}
            {!isDesktop && (
                <RNAnimated.View
                    style={{ transform: [{ translateY: menuTranslateY }] }}
                    className="absolute top-[72px] left-0 right-0 bg-[#14532d] shadow-xl border-t border-green-800 rounded-b-3xl overflow-hidden z-40"
                >
                    <View className="p-6 gap-2">
                        <MobileNavLink icon={LayoutDashboard} text="Dashboard" onPress={() => handleProtectedNav("/portal")} />
                        <MobileNavLink icon={ShoppingBag} text="Marketplace" onPress={() => handleProtectedNav("/marketplace")} />
                        <MobileNavLink icon={Cloud} text="Weather Intelligence" onPress={() => handleProtectedNav("/weather")} />
                        <MobileNavLink icon={Users} text="Expert Chat" onPress={() => handleProtectedNav("/chat")} />
                        <MobileNavLink icon={BookOpen} text="Knowledge Hub" onPress={() => handleProtectedNav("/education")} />
                        <MobileNavLink icon={ScrollText} text="Govt Schemes" onPress={() => handleProtectedNav("/schemes")} />

                        <View className="h-px bg-white/10 my-2" />

                        <MobileNavLink icon={LogOut} text="Log Out" onPress={() => router.push("/")} isDestructive />
                    </View>
                </RNAnimated.View>
            )}
        </View>
    );
}

function NavLink({ icon: Icon, text, active, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center px-4 py-2 rounded-full transition-all ${active ? 'bg-amber-500 shadow-sm' : 'hover:bg-white/10'}`}
        >
            <Icon size={18} color={active ? '#fff' : '#86efac'} />
            <Text className={`ml-2 font-bold text-sm ${active ? 'text-white' : 'text-green-100'}`}>{text}</Text>
        </TouchableOpacity>
    );
}

function MobileNavLink({ icon: Icon, text, onPress, isDestructive }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center p-4 rounded-xl ${isDestructive ? 'bg-red-500/20 active:bg-red-500/30' : 'bg-white/5 active:bg-white/10'}`}
        >
            <Icon size={20} color={isDestructive ? '#fca5a5' : '#fbbf24'} />
            <Text className={`ml-3 font-bold text-lg ${isDestructive ? 'text-red-300' : 'text-green-50'}`}>{text}</Text>
        </TouchableOpacity>
    )
}
