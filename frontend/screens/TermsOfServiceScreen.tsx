import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';

export default function TermsOfServiceScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();

    return (
        <LinearGradient
            colors={theme.colors.gradient.start as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { backgroundColor: theme.colors.background }]}
        >
            <AppHeader title="Warunki użytkowania" showBackButton={true} />
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.headerSection}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                            <MaterialIcons name="description" size={48} color="#fff" />
                        </View>
                        <Text style={[styles.title, { color: theme.colors.text }]}>Warunki użytkowania</Text>
                        <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
                            Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. Postanowienia ogólne</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Niniejsze Warunki użytkowania określają zasady korzystania z aplikacji CrowdCash 
                            (dalej: "Aplikacja") oferowanej przez Interactive Jakub Stawski z siedzibą 
                            w 98-161 Marżynek 105, Polska (dalej: "Usługodawca").
                        </Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Korzystanie z Aplikacji oznacza akceptację niniejszych Warunków użytkowania. 
                            W przypadku braku akceptacji, użytkownik zobowiązany jest do zaprzestania 
                            korzystania z Aplikacji.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. Definicje</Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • <Text style={styles.bold}>Aplikacja</Text> - platforma crowdfundingowa CrowdCash dostępna w formie aplikacji mobilnej
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • <Text style={styles.bold}>Użytkownik</Text> - osoba fizyczna korzystająca z Aplikacji
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • <Text style={styles.bold}>Przedsiębiorca</Text> - użytkownik prowadzący kampanię crowdfundingową
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • <Text style={styles.bold}>Inwestor</Text> - użytkownik wspierający kampanie finansowo
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • <Text style={styles.bold}>Kampania</Text> - projekt crowdfundingowy prezentowany w Aplikacji
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • <Text style={styles.bold}>Inwestycja</Text> - przekazanie środków finansowych na rzecz kampanii
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. Rejestracja i konto użytkownika</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Aby korzystać z Aplikacji, użytkownik musi utworzyć konto poprzez podanie 
                            prawdziwych i aktualnych danych. Użytkownik zobowiązuje się do:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Podawania wyłącznie prawdziwych danych osobowych
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Zachowania poufności danych logowania
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Nieudostępniania konta osobom trzecim
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Niezwłocznego powiadomienia o nieuprawnionym dostępie do konta
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. Zasady korzystania z Aplikacji</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Użytkownik zobowiązuje się do korzystania z Aplikacji zgodnie z prawem i 
                            dobrymi obyczajami. Zabronione jest:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Publikowanie treści niezgodnych z prawem, obraźliwych lub naruszających prawa osób trzecich
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Próby naruszenia bezpieczeństwa Aplikacji
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Wykorzystywanie Aplikacji do celów niezgodnych z jej przeznaczeniem
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Przekazywanie fałszywych informacji o kampaniach
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Manipulowanie wynikami kampanii lub systemem ocen
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. Kampanie crowdfundingowe</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Przedsiębiorca prowadzący kampanię zobowiązuje się do:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Przedstawienia prawdziwych informacji o projekcie
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Realizacji projektu zgodnie z przedstawionym planem
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Informowania inwestorów o postępach projektu
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Zwrotu środków w przypadku niewykonania zobowiązań (jeśli przewidziane)
                            </Text>
                        </View>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                            Usługodawca nie ponosi odpowiedzialności za realizację projektów przez 
                            przedsiębiorców ani za zwrot środków inwestorom.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. Inwestycje i płatności</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Inwestycje w kampanie są dokonywane na własne ryzyko inwestora. Usługodawca 
                            nie gwarantuje zwrotu z inwestycji ani realizacji projektów. Wszelkie 
                            transakcje finansowe są obsługiwane przez zewnętrznych operatorów płatności.
                        </Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                            Usługodawca może pobierać prowizję od transakcji zgodnie z aktualnym cennikiem, 
                            o którym użytkownicy są informowani przed dokonaniem transakcji.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>7. Własność intelektualna</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Wszelkie prawa do Aplikacji, w tym prawa autorskie, znaki towarowe i inne 
                            prawa własności intelektualnej, należą do Usługodawcy lub jego licencjodawców.
                        </Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                            Treści publikowane przez użytkowników pozostają ich własnością, jednak 
                            użytkownik udziela Usługodawcy licencji do ich wykorzystania w ramach 
                            funkcjonowania Aplikacji.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>8. Odpowiedzialność</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Usługodawca dokłada starań, aby Aplikacja działała poprawnie, jednak nie 
                            ponosi odpowiedzialności za:
                        </Text>
                        <View style={styles.list}>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Przerwy w działaniu Aplikacji wynikające z przyczyn technicznych
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Straty wynikające z nieprawidłowego korzystania z Aplikacji
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Realizację projektów przez przedsiębiorców
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Zwrot środków inwestorom
                            </Text>
                            <Text style={[styles.listItem, { color: theme.colors.textSecondary }]}>
                                • Działania osób trzecich, w tym operatorów płatności
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>9. Zmiany w Warunkach użytkowania</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Usługodawca zastrzega sobie prawo do wprowadzania zmian w Warunkach użytkowania. 
                            O zmianach użytkownicy będą informowani poprzez Aplikację. Kontynuowanie 
                            korzystania z Aplikacji po wprowadzeniu zmian oznacza akceptację nowych warunków.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>10. Rozwiązanie umowy</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            Usługodawca może zablokować lub usunąć konto użytkownika w przypadku naruszenia 
                            Warunków użytkowania. Użytkownik może w każdej chwili zrezygnować z korzystania 
                            z Aplikacji poprzez usunięcie konta.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>11. Prawo właściwe i rozstrzyganie sporów</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            W sprawach nieuregulowanych niniejszymi Warunkami użytkowania zastosowanie 
                            mają przepisy prawa polskiego. Spory będą rozstrzygane przez sądy właściwe 
                            dla siedziby Usługodawcy.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>12. Kontakt</Text>
                        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                            W sprawach związanych z Warunkami użytkowania można kontaktować się z Usługodawcą:
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
                            Korzystając z Aplikacji, użytkownik potwierdza, że zapoznał się z niniejszymi 
                            Warunkami użytkowania i akceptuje je w całości.
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
    bold: {
        fontWeight: '700',
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
