import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    TextInput,
    Switch,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { configureSharing } from '../services/shareService';

const PREFERENCE_OPTIONS = [
    { key: 'monthlySummary', title: 'Monthly Spending', subtitle: 'Overall spending overview', icon: 'bar-chart-outline' },
    { key: 'categorySplit', title: 'Top Spending Area', subtitle: 'Category breakdown with top 3 areas', icon: 'pie-chart-outline' },
    { key: 'goalsProgress', title: 'Goal Progress', subtitle: 'Goal savings and progress', icon: 'target' },
    { key: 'reflections', title: 'Behavior Insights', subtitle: 'Gentle interpretation of spending habits', icon: 'bulb-outline' },
    { key: 'emotionalInsights', title: 'Emotional Insights', subtitle: 'Insights into emotional influences', icon: 'heart-half-outline' },
    { key: 'events', title: 'Include Event Context', subtitle: 'Breakdown of spending during events', icon: 'calendar-outline' }
];

export default function ShareScreen({ navigation }) {
    const [isSharingEnabled, setIsSharingEnabled] = useState(false);
    const [parentEmail, setParentEmail] = useState('');
    const [sharingDate, setSharingDate] = useState('1');
    const [loading, setLoading] = useState(false);
    
    const [preferences, setPreferences] = useState({
        monthlySummary: true,
        categorySplit: true,
        goalsProgress: true,
        reflections: true,
        emotionalInsights: true,
        events: true
    });

    const togglePreference = (key) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (isSharingEnabled && !parentEmail.trim()) {
            Alert.alert("Missing Email", "Please enter a parent's email to enable sharing.");
            return;
        }

        const dateNum = parseInt(sharingDate, 10);
        if (isSharingEnabled && (isNaN(dateNum) || dateNum < 1 || dateNum > 28)) {
            Alert.alert("Invalid Date", "Please enter a day between 1 and 28 to ensure consistent monthly delivery.");
            return;
        }

        setLoading(true);
        try {
            await configureSharing({
                parentEmail: parentEmail.trim(),
                sharingDate: dateNum,
                preferences,
                tone: 'supportive' 
            });
            Alert.alert("Success", "Sharing preferences updated successfully!");
        } catch (err) {
            console.log(err);
            Alert.alert("Error", "Could not save preferences. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Share Your Data</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.introCard}>
                    <Text style={styles.introTitle}>Keep parents in the loop.</Text>
                    <Text style={styles.introSub}>Share your financial awareness journey with them automatically on your chosen date every month.</Text>
                    
                    <Text style={styles.label}>Parent's Email</Text>
                    <TextInput 
                        style={[styles.input, { marginBottom: 15 }]}
                        placeholder="parent@email.com"
                        placeholderTextColor="#888"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={parentEmail}
                        onChangeText={setParentEmail}
                    />

                    <Text style={styles.label}>Send Date (1-28)</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder="e.g., 1"
                        placeholderTextColor="#888"
                        keyboardType="number-pad"
                        value={sharingDate}
                        onChangeText={(text) => setSharingDate(text.replace(/[^0-9]/g, ''))}
                        maxLength={2}
                    />
                </View>

                <View style={styles.masterToggleContainer}>
                    <Text style={styles.masterToggleText}>Enable Monthly Report</Text>
                    <Switch 
                        trackColor={{ false: '#767577', true: '#C3B1E1' }}
                        thumbColor={isSharingEnabled ? COLORS.primaryPurple : '#f4f3f4'}
                        onValueChange={setIsSharingEnabled}
                        value={isSharingEnabled}
                    />
                </View>

                <View style={styles.privacyBanner}>
                    <Ionicons name="shield-checkmark" size={20} color={COLORS.primaryPurple} style={{ marginRight: 10 }} />
                    <Text style={styles.privacyText}>
                        <Text style={{ fontWeight: 'bold' }}>Privacy first:</Text> They only see what you choose to share below. You can update or stop sharing anytime.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>What to share</Text>
                <View style={styles.preferencesWrapper}>
                    {PREFERENCE_OPTIONS.map((option) => {
                        const isActive = preferences[option.key];
                        return (
                            <TouchableOpacity 
                                key={option.key} 
                                style={[styles.prefCard, isActive ? styles.prefCardActive : null]}
                                onPress={() => togglePreference(option.key)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.prefIconContainer}>
                                    <Ionicons name={option.icon} size={22} color={isActive ? COLORS.white : COLORS.textSecondary} />
                                </View>
                                <View style={styles.prefTextContainer}>
                                    <Text style={[styles.prefTitle, isActive ? { color: COLORS.white } : null]}>{option.title}</Text>
                                    <Text style={[styles.prefSubtitle, isActive ? { color: 'rgba(255,255,255,0.8)' } : null]}>{option.subtitle}</Text>
                                </View>
                                <Ionicons 
                                    name={isActive ? "checkmark-circle" : "ellipse-outline"} 
                                    size={26} 
                                    color={isActive ? COLORS.white : COLORS.input} 
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity 
                    style={styles.saveBtn} 
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Preferences</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    navHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: 60, 
        paddingBottom: 15,
        paddingHorizontal: 20 
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    
    introCard: { marginBottom: 20 },
    introTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
    introSub: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 20 },
    label: { fontSize: 13, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: 8 },
    input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.input, padding: 15, borderRadius: 12, color: COLORS.textPrimary, fontSize: 15 },
    
    masterToggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(138, 190, 183, 0.15)', padding: 18, borderRadius: 16, marginBottom: 15 },
    masterToggleText: { fontSize: 16, fontWeight: 'bold', color: '#8ABEB7' },
    
    privacyBanner: { flexDirection: 'row', backgroundColor: 'rgba(155, 110, 226, 0.1)', padding: 15, borderRadius: 12, marginBottom: 30, alignItems: 'center' },
    privacyText: { flex: 1, fontSize: 12, color: COLORS.primaryPurple, lineHeight: 18 },
    
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 15 },
    preferencesWrapper: { marginBottom: 30 },
    
    prefCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.input },
    prefCardActive: { backgroundColor: '#8ABEB7', borderColor: '#8ABEB7' },
    prefIconContainer: { width: 40, alignItems: 'flex-start' },
    prefTextContainer: { flex: 1, paddingRight: 10 },
    prefTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
    prefSubtitle: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 16 },

    saveBtn: { backgroundColor: COLORS.primaryPurple, paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: COLORS.primaryPurple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});