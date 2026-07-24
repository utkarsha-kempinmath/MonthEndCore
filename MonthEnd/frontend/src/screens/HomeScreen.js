import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    Alert
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useIsFocused } from '@react-navigation/native';
import { CardTile } from '../components/CardTile';
import { COLORS } from "../constants/theme";
import { getDashboard } from "../services/homeService";
import { removeToken } from "../services/tokenService";

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const isFocused = useIsFocused();
    const [data, setData] = useState({ totalIncome: 0, totalSpent: 0, remaining: 0 });
    const [userName, setUserName] = useState("");
    const [menuVisible, setMenuVisible] = useState(false);

    const radius = 45;
    const strokeWidth = 10;
    const normalizedRadius = radius - strokeWidth * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;

    useEffect(() => {
        if (isFocused) {
            fetchDashboardData();
        }
    }, [isFocused]);

    const fetchDashboardData = async () => {
        try {
            const res = await getDashboard();
            if (res.data.success) {
                setData(res.data);
                if (res.data.user && res.data.user.name) {
                    setUserName(res.data.user.name);
                } else if (res.data.name) {
                    setUserName(res.data.name);
                }
            }
        } catch (err) {
            if (err.message === 'Network Error') {
                Alert.alert("No Internet", "Please check your network connection and try again.");
            } else {
                console.log("Dashboard fetch error:", err);
            }
        }
    };

    const handleLogout = async () => {
        await removeToken();
        setMenuVisible(false);
    };

    const rawProgress = data.totalIncome > 0 ? data.totalSpent / data.totalIncome : 0;
    const progress = Math.min(Math.max(rawProgress, 0), 1);
    const strokeDashoffset = circumference - progress * circumference;

    const menuItems = [
        { id: '1', title: 'Add Expense',       icon: '➕',  route: 'AddExpense',    color: '#6B5B9E' },
        { id: '2', title: 'Ask Before Spend',   icon: '💬',  route: 'Chat',          color: '#7B6AAE' },
        { id: '3', title: 'Set Allowance',      icon: '💰',  route: 'Allowance',     color: '#B85C2A' },
        { id: '4', title: 'Calendar',           icon: '📅',  route: 'Calendar',      color: '#8B7A2A' },
        { id: '5', title: 'Expected Spend',     icon: '📊',  route: 'ExpectedSpend', color: '#2A7A6A' },
        { id: '6', title: 'Exp vs Actual',      icon: '⚖️',  route: 'Analytics',     color: '#1A1A2E' },
        { id: '7', title: 'Goal Tracking',      icon: '🎯',  route: 'Goal',          color: '#6B5B9E' },
        { id: '8', title: 'Month Track',        icon: '📈',  route: 'MonthTrack',    color: '#2A7A6A' },
        { id: '9', title: 'Share with Parents', icon: '👨‍👩‍👧', route: 'ShareData',    color: '#1A1A2E' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <ScrollView style={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.header}>MonthEnd</Text>
                    <TouchableOpacity
                        style={styles.profileCircle}
                        onPress={() => setMenuVisible(true)}
                    >
                        <Text style={styles.profileInitial}>
                            {userName ? userName.charAt(0).toUpperCase() : 'M'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryContainer}>
                    <View style={styles.progressSection}>
                        <Svg height={radius * 2} width={radius * 2}>
                            <Circle
                                stroke={COLORS.input}
                                fill="transparent"
                                strokeWidth={strokeWidth}
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                            />
                            <Circle
                                stroke={progress > 0.8 ? "#FF6B6B" : COLORS.softTeal}
                                fill="transparent"
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference + ' ' + circumference}
                                style={{ strokeDashoffset }}
                                strokeLinecap="round"
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                                rotation="-90"
                                origin={`${radius}, ${radius}`}
                            />
                        </Svg>
                        <View style={styles.progressTextContainer}>
                            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                            <Text style={styles.progressLabel}>Spent</Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Remaining</Text>
                        <Text style={styles.infoValue}>₹{data.remaining}</Text>
                        <View style={styles.infoDivider} />
                        <Text style={styles.infoLabel}>Budget: ₹{data.totalIncome}</Text>
                    </View>
                </View>

                <View style={styles.grid}>
                    {menuItems.map((item) => (
                        <CardTile
                            key={item.id}
                            title={item.title}
                            icon={item.icon}
                            color={item.color}
                            onPress={() => navigation.navigate(item.route)}
                        />
                    ))}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal
                transparent={true}
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.dropdownMenu}>
                            <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    header: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary },
    profileCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.accentOrange,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3
    },
    profileInitial: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    summaryContainer: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 25, elevation: 5 },
    progressSection: { justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    progressTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    progressText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
    progressLabel: { color: COLORS.textSecondary, fontSize: 10 },
    infoCard: { flex: 1 },
    infoLabel: { color: COLORS.textSecondary, fontSize: 12 },
    infoValue: { color: COLORS.accentOrange, fontSize: 22, fontWeight: 'bold', marginVertical: 4 },
    infoDivider: { height: 1, backgroundColor: COLORS.textSecondary, opacity: 0.2, marginVertical: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
    dropdownMenu: {
        position: 'absolute',
        top: 105,
        right: 20,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 10,
        elevation: 10,
        minWidth: 130,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    logoutItem: { paddingVertical: 10, paddingHorizontal: 10 },
    logoutText: { color: '#FF6B6B', fontWeight: 'bold', fontSize: 16 }
});

export default HomeScreen;