import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
            <LinearGradient
                colors={['#f9fafb', '#ecfdf5', '#dcfce7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#16a34a" />
                    <Text style={styles.loadingText}>Ładowanie powiadomień...</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <RequirePermission permission="view_notifications" navigation={navigation}>
            <LinearGradient
                colors={['#f9fafb', '#ecfdf5', '#dcfce7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.safeArea}>
                    {
                        unreadCount > 0 && (
                            <View style={styles.header}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            </View>
                        )
                    }

                    {notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="notifications-none" size={64} color="#9ca3af" />
                            <Text style={styles.emptyTitle}>Brak powiadomień</Text>
                            <Text style={styles.emptyText}>Nie masz jeszcze żadnych powiadomień</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={notifications}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.notificationCard,
                                        item.read ? styles.readCard : styles.unreadCard
                                    ]}
                                    onPress={() => !item.read && markAsRead(item.id)}
                                    activeOpacity={0.7}
                                >
                                    {!item.read && <View style={styles.unreadIndicator} />}
                                    <View style={styles.notificationContent}>
                                        <View style={styles.notificationHeader}>
                                            <Text style={[
                                                styles.notificationTitle,
                                                item.read ? styles.readTitle : styles.unreadTitle
                                            ]}>
                                                {item.title}
                                            </Text>
                                            {!item.read && (
                                                <View style={styles.unreadDot} />
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.notificationBody,
                                            item.read ? styles.readBody : styles.unreadBody
                                        ]}>
                                            {item.body}
                                        </Text>
                                        <View style={styles.notificationFooter}>
                                            <MaterialIcons name="schedule" size={14} color="#9ca3af" />
                                            <Text style={styles.notificationDate}>
                                                {new Date(item.created_at).toLocaleDateString('pl-PL', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                            refreshing={loading}
                            onRefresh={fetchNotifications}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </SafeAreaView>
            </LinearGradient>
        </RequirePermission>
    );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    badge: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        position: 'relative',
    },
    readCard: {
        opacity: 0.7,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#16a34a',
        backgroundColor: '#f0fdf4',
    },
    unreadIndicator: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#16a34a',
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    readTitle: {
        color: '#6b7280',
    },
    unreadTitle: {
        color: '#111827',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#16a34a',
        marginLeft: 8,
    },
    notificationBody: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    readBody: {
        color: '#9ca3af',
    },
    unreadBody: {
        color: '#4b5563',
    },
    notificationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    notificationDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});
