import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RequirePermission from '../components/RequirePermission';
import API from '../utils/api';

interface Notification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
}

export default function NotificationsScreen({ navigation }: any) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            const res = await API.get('/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (error: any) {
            Alert.alert('Błąd', error?.response?.data?.detail || 'Nie udało się pobrać powiadomień');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) throw new Error('Brak tokena');

            await API.patch(`/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Zaktualizuj lokalny stan
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (error: any) {
            Alert.alert('Błąd', error?.response?.data?.detail || 'Nie udało się oznaczyć powiadomienia jako przeczytanego');
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#4caf50" />
            </View>
        );
    }

    return (
        <RequirePermission permission="view_notifications" navigation={navigation}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Powiadomienia</Text>
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>

                    {notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Brak nowych powiadomień</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={notifications}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.notificationItem,
                                        item.read ? styles.readItem : styles.unreadItem
                                    ]}
                                    onPress={() => !item.read && markAsRead(item.id)}
                                >
                                    <View style={styles.notificationContent}>
                                        <Text style={[
                                            styles.notificationTitle,
                                            item.read ? styles.readTitle : styles.unreadTitle
                                        ]}>
                                            {item.title}
                                        </Text>
                                        <Text style={[
                                            styles.notificationBody,
                                            item.read ? styles.readBody : styles.unreadBody
                                        ]}>
                                            {item.body}
                                        </Text>
                                        <Text style={styles.notificationDate}>
                                            {new Date(item.created_at).toLocaleDateString('pl-PL')}
                                        </Text>
                                    </View>
                                    {!item.read && <View style={styles.unreadIndicator} />}
                                </TouchableOpacity>
                            )}
                            refreshing={loading}
                            onRefresh={fetchNotifications}
                            scrollEnabled={false}
                        />
                    )}
                </ScrollView>
            </SafeAreaView>
        </RequirePermission>
    );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Math.min(20, screenWidth * 0.05),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Math.min(20, screenWidth * 0.05),
        paddingBottom: Math.min(10, screenWidth * 0.025),
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: Math.min(24, screenWidth * 0.06),
        fontWeight: 'bold',
        color: '#333',
    },
    badge: {
        backgroundColor: '#d32f2f',
        borderRadius: Math.min(12, screenWidth * 0.03),
        minWidth: Math.min(24, screenWidth * 0.06),
        height: Math.min(24, screenWidth * 0.06),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Math.min(8, screenWidth * 0.02),
    },
    badgeText: {
        color: '#fff',
        fontSize: Math.min(12, screenWidth * 0.03),
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: Math.min(16, screenWidth * 0.04),
        color: '#666',
        textAlign: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: Math.min(16, screenWidth * 0.04),
        marginBottom: Math.min(12, screenWidth * 0.03),
        borderRadius: Math.min(8, screenWidth * 0.02),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    readItem: {
        backgroundColor: '#f9f9f9',
    },
    unreadItem: {
        backgroundColor: '#e3f2fd',
        borderLeftWidth: 4,
        borderLeftColor: '#2196f3',
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: Math.min(16, screenWidth * 0.04),
        fontWeight: 'bold',
        marginBottom: 4,
    },
    readTitle: {
        color: '#666',
    },
    unreadTitle: {
        color: '#333',
    },
    notificationBody: {
        fontSize: Math.min(14, screenWidth * 0.035),
        marginBottom: Math.min(8, screenWidth * 0.02),
        lineHeight: Math.min(20, screenWidth * 0.05),
    },
    readBody: {
        color: '#888',
    },
    unreadBody: {
        color: '#555',
    },
    notificationDate: {
        fontSize: Math.min(12, screenWidth * 0.03),
        color: '#999',
    },
    unreadIndicator: {
        width: Math.min(8, screenWidth * 0.02),
        height: Math.min(8, screenWidth * 0.02),
        borderRadius: Math.min(4, screenWidth * 0.01),
        backgroundColor: '#2196f3',
        marginLeft: Math.min(8, screenWidth * 0.02),
        marginTop: 4,
    },
});
