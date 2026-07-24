import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup, googleLogin } from "../services/authService";
import { saveToken } from "../services/tokenService";
import { COLORS } from "../constants/theme";
import { getGoogleIdToken } from "../services/googleAuth";

export default function SignupScreen({ navigation }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGoogleSignUp = async () => {
        setLoading(true);
        try {
            const idToken = await getGoogleIdToken();
            const res = await googleLogin({ token: idToken });
            await AsyncStorage.setItem('isNewUser', 'true');
            await saveToken(res.data.token);
        } catch (err) {
            console.log("Google Sign-Up ERROR:", err);
            alert("Google Sign-Up failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        setLoading(true);
        try {
            const res = await signup({ username: name, email, password });
            await AsyncStorage.setItem('isNewUser', 'true');
            await saveToken(res.data.token);
        } catch (err) {
            console.log("ERROR:", err.response?.data || err.message);
            alert(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            
            <TextInput placeholder="Name" placeholderTextColor="#888" style={styles.input} value={name} onChangeText={setName} />
            <TextInput placeholder="Email" placeholderTextColor="#888" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput placeholder="Password" placeholderTextColor="#888" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
            
            <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>SIGN UP</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp} disabled={loading}>
                <Text style={styles.googleText}>Sign up with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footer}>Already a user? Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", padding: 20 },
    title: { fontSize: 28, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 20 },
    input: { backgroundColor: COLORS.input, color: COLORS.textPrimary, padding: 14, borderRadius: 14, marginBottom: 15 },
    button: { backgroundColor: COLORS.accentOrange, padding: 15, borderRadius: 14, alignItems: "center", marginTop: 10 },
    buttonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16, letterSpacing: 1 },
    googleButton: { marginTop: 15, padding: 14, borderRadius: 14, alignItems: "center", backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#ccc" },
    googleText: { color: "#333", fontWeight: "600" },
    footer: { marginTop: 20, textAlign: "center", color: COLORS.textSecondary },
});