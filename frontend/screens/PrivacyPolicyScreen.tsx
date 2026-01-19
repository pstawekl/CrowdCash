import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();

    return (
        <LinearGradient
            colors={theme.colors.gradient.start as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <AppHeader title="Polityka prywatności" showBackButton={true} />
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.headerSection}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                            <MaterialIcons name="privacy-tip" size={48} color="#fff" />
                        </View>
                        <Text style={[styles.title, { color: theme.colors.text }]}>Polityka prywatności</Text>
                        <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
                            Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Administrator danych</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Administratorem danych osobowych jest firma Interactive Jakub Stawski z siedzibą 
                            w 98-161 Marżynek 105, Polska. Wszelkie kwestie związane z przetwarzaniem danych 
                            osobowych należy kierować do administratora.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. Zakres zbieranych danych</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            W ramach korzystania z aplikacji CrowdCash zbieramy następujące dane:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Dane identyfikacyjne: imię, nazwisko, adres e-mail
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Dane profilowe: zdjęcie profilowe, biografia, lokalizacja
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Dane finansowe: informacje o transakcjach, inwestycjach i płatnościach
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Dane techniczne: adres IP, typ urządzenia, system operacyjny
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Dane dotyczące aktywności: logi użytkowania aplikacji, preferencje
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. Cel przetwarzania danych</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Przetwarzamy dane osobowe w następujących celach:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Świadczenie usług platformy crowdfundingowej
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Realizacja transakcji finansowych
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Komunikacja z użytkownikami
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Weryfikacja tożsamości użytkowników
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Wysyłanie powiadomień i aktualizacji
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Zapewnienie bezpieczeństwa i zapobieganie nadużyciom
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Wypełnienie obowiązków prawnych
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Podstawa prawna przetwarzania</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Przetwarzamy dane osobowe na podstawie:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Zgody użytkownika (art. 6 ust. 1 lit. a RODO)
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Wykonania umowy (art. 6 ust. 1 lit. b RODO)
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Obowiązku prawnego (art. 6 ust. 1 lit. c RODO)
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Prawidłowego interesu administratora (art. 6 ust. 1 lit. f RODO)
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. Udostępnianie danych</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Dane osobowe mogą być udostępniane:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Dostawcom usług technicznych (hosting, analityka)
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Operatorom płatności i instytucjom finansowym
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Organom państwowym na żądanie wynikające z przepisów prawa
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Innym użytkownikom platformy w zakresie publicznego profilu
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. Okres przechowywania danych</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Dane osobowe przechowujemy przez okres niezbędny do realizacji celów, dla których 
                            zostały zebrane, lub przez okres wymagany przepisami prawa. Po zakończeniu tego okresu 
                            dane są usuwane lub anonimizowane.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>7. Prawa użytkownika</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Użytkownik ma prawo do:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Dostępu do swoich danych osobowych
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Sprostowania nieprawidłowych danych
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Usunięcia danych ("prawo do bycia zapomnianym")
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Ograniczenia przetwarzania danych
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Przenoszenia danych
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Sprzeciwu wobec przetwarzania danych
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Wniesienia skargi do organu nadzorczego (UODO)
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>8. Bezpieczeństwo danych</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Stosujemy odpowiednie środki techniczne i organizacyjne zapewniające bezpieczeństwo 
                            danych osobowych, w tym szyfrowanie połączeń, kontrolę dostępu oraz regularne 
                            aktualizacje systemów bezpieczeństwa.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>9. Pliki cookies</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Aplikacja może wykorzystywać pliki cookies i podobne technologie w celu poprawy 
                            funkcjonalności oraz analizy korzystania z aplikacji. Użytkownik może zarządzać 
                            ustawieniami cookies w ustawieniach aplikacji.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>10. Kontakt</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            W sprawach związanych z ochroną danych osobowych można kontaktować się z 
                            administratorem danych:
                        </Text>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
                                Interactive Jakub Stawski{'\n'}
                                98-161 Marżynek 105{'\n'}
                                Polska
                            </Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                            Niniejsza polityka prywatności może ulec zmianie. O wszelkich zmianach użytkownicy 
                            będą informowani poprzez aplikację.
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
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    lastUpdated: {
        fontSize: 14,
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
        marginBottom: 12,
    },
    list: {
        gap: 8,
    },
    listItem: {
        fontSize: 16,
        lineHeight: 24,
        paddingLeft: 8,
    },
    contactInfo: {
        marginTop: 12,
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
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
    },
    footerText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
