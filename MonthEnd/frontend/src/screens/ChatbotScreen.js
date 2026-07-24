import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    KeyboardAvoidingView, 
    Platform,
    ScrollView,
    ActivityIndicator,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { sendChatMessage } from '../services/chatbotService';

// Removed "Stress pattern" from the quick prompts
const QUICK_PROMPTS = [
    "Can I afford this?", 
    "Impact on my goal", 
    "End of month outlook"
];

export default function ChatbotScreen({ navigation }) {
    const [messages, setMessages] = useState([
        { 
            id: '1', 
            text: "Hi! I'm here to help you make confident spending decisions. Ask me anything about your budget, spending patterns, or future expenses.", 
            isUser: false 
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef();

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });
        return () => keyboardDidShowListener.remove();
    }, []);

    const handleSend = async (textToSend = inputText) => {
        const trimmedText = textToSend.trim();
        if (!trimmedText) return;

        const newUserMsg = { id: Date.now().toString(), text: trimmedText, isUser: true };
        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setLoading(true);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const res = await sendChatMessage(trimmedText);
            
            const newBotMsg = { 
                id: (Date.now() + 1).toString(), 
                text: res.data.message || "I couldn't process that right now.", 
                isUser: false 
            };
            setMessages(prev => [...prev, newBotMsg]);
        } catch (err) {
            console.log("Chatbot Error:", err);
            const errorMsg = { 
                id: (Date.now() + 1).toString(), 
                text: err.response?.data?.error || err.response?.data?.message || "Something went wrong. Please check your connection and try again.", 
                isUser: false 
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            // Changed behavior to 'height' for Android to force the UI to slide up with the keyboard
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                    <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Ask before you spend</Text>
                    <Text style={styles.headerSubtitle}>Insights based on your patterns</Text>
                </View>
                <View style={{ width: 38 }} /> 
            </View>

            <ScrollView 
                ref={scrollViewRef}
                style={styles.chatContainer}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                keyboardShouldPersistTaps="handled"
            >
                {messages.map((msg) => (
                    <View 
                        key={msg.id} 
                        style={[
                            styles.messageBubble, 
                            msg.isUser ? styles.userBubble : styles.botBubble
                        ]}
                    >
                        <Text style={[
                            styles.messageText, 
                            msg.isUser ? styles.userText : styles.botText
                        ]}>
                            {msg.text}
                        </Text>
                    </View>
                ))}
                {loading && (
                    <View style={[styles.messageBubble, styles.botBubble, { width: 60 }]}>
                        <ActivityIndicator size="small" color={COLORS.accentOrange} />
                    </View>
                )}
            </ScrollView>

            <View style={styles.quickPromptsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
                    {QUICK_PROMPTS.map((prompt, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.promptPill}
                            onPress={() => handleSend(prompt)}
                            disabled={loading}
                        >
                            <Text style={styles.promptText}>{prompt}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Ask me anything..."
                    placeholderTextColor="#888"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={() => handleSend()}
                    editable={!loading}
                />
                <TouchableOpacity 
                    style={[styles.sendButton, (!inputText.trim() || loading) && { opacity: 0.5 }]} 
                    onPress={() => handleSend()}
                    disabled={!inputText.trim() || loading}
                >
                    <Ionicons name="send" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: COLORS.background 
    },
    navHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingTop: 60, 
        paddingBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        zIndex: 10
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2
    },
    chatContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 15,
        borderRadius: 20,
        marginBottom: 15,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primaryPurple,
        borderBottomRightRadius: 5,
    },
    botBubble: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.card,
        borderBottomLeftRadius: 5,
        borderWidth: 1,
        borderColor: COLORS.input
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: COLORS.white,
    },
    botText: {
        color: COLORS.textPrimary,
    },
    quickPromptsContainer: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    promptPill: {
        backgroundColor: 'rgba(138, 190, 183, 0.2)', 
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#8ABEB7'
    },
    promptText: {
        color: '#8ABEB7',
        fontWeight: '600',
        fontSize: 13
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)'
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.input,
        color: COLORS.textPrimary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: COLORS.accentOrange,
        width: 45,
        height: 45,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        alignSelf: 'flex-end'
    }
});