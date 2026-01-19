import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';

export default function AboutScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();

    return (
        <LinearGradient
            colors={theme.colors.gradient.start as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <AppHeader title="O aplikacji" showBackButton={true} />
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.headerSection}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                            <MaterialIcons name="info" size={48} color="#fff" />
                        </View>
                        <Text style={[styles.appName, { color: theme.colors.text }]}>CrowdCash</Text>
                        <Text style={[styles.version, { color: theme.colors.textSecondary }]}>Wersja 1.0.0</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>O aplikacji</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            CrowdCash to platforma crowdfundingowa, która łączy przedsiębiorców z inwestorami. 
                            Nasza aplikacja umożliwia przedsiębiorcom prezentowanie swoich projektów i zbieranie 
                            funduszy, a inwestorom - wspieranie obiecujących inicjatyw i potencjalny zwrot z inwestycji.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Nasza misja</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Wierzymy, że każdy dobry pomysł zasługuje na szansę realizacji. CrowdCash tworzy 
                            przestrzeń, w której innowacyjne projekty mogą znaleźć wsparcie finansowe potrzebne 
                            do rozwoju i osiągnięcia sukcesu.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Funkcje</Text>
                        <View style={styles.featureList}>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                                    Tworzenie i zarządzanie kampaniami crowdfundingowymi
                                </Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                                    Bezpieczne inwestowanie w wybrane projekty
                                </Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                                    Śledzenie postępów kampanii w czasie rzeczywistym
                                </Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                                    System powiadomień o ważnych wydarzeniach
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Kontakt</Text>
                        <View style={styles.contactInfo}>
                            <View style={styles.contactItem}>
                                <MaterialIcons name="business" size={20} color={theme.colors.primary} />
                                <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                                    Interactive Jakub Stawski
                                </Text>
                            </View>
                            <View style={styles.contactItem}>
                                <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
                                <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                                    98-161 Marżynek 105, Polska
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                            © 2026 Interactive Jakub Stawski. Wszelkie prawa zastrzeżone.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    content: {
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
    },
    version: {
        fontSize: 16,
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    sectionText: {
        fontSize: 16,
        lineHeight: 24,
    },
    featureList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    featureText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
    },
    contactInfo: {
        gap: 12,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    contactText: {
        fontSize: 16,
        lineHeight: 24,
    },
    footer: {
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
    },
});
