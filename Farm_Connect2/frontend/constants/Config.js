import { Platform } from 'react-native';

const LOCAL_IP = "192.168.1.5"; // ⚠️ REPLACE THIS WITH YOUR PC's IP ADDRESS for Physical Phone Testing

const getApiUrl = () => {
    if (Platform.OS === 'web' || Platform.OS === 'windows' || Platform.OS === 'macos') {
        // 🌍 FORCE LOCALHOST FOR DESKTOP DEV
        return 'http://127.0.0.1:8000/api/v1';
    }

    if (Platform.OS === 'android') {
        // 🤖 Emulator uses 10.0.2.2 to access host localhost
        return 'http://10.0.2.2:8000/api/v1';
    }

    if (Platform.OS === 'ios') {
        // Simulator usually maps localhost, but physical device needs IP.
        // Assuming Simulator for now or fallback.
        // return 'http://127.0.0.1:8000/api/v1'; 
    }

    // 🍎 Physical Devices (Fallback)
    return `http://${LOCAL_IP}:8000/api/v1`;
};

export const API_URL = getApiUrl();

export default {
    API_URL,
};

