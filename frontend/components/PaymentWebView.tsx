import React, { useRef, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Text, ActivityIndicator, Alert } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../utils/api';

interface PaymentWebViewProps {
    visible: boolean;
    paymentUrl: string;
    transactionId?: string | null; // ID transakcji do weryfikacji statusu
    onClose: () => void;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function PaymentWebView({ visible, paymentUrl, transactionId, onClose, onSuccess, onCancel }: PaymentWebViewProps) {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [verifyingPayment, setVerifyingPayment] = useState(false);

    const checkPaymentStatus = (url: string): 'success' | 'cancel' | null => {
        // Sprawdź czy URL zawiera success lub cancel (różne możliwe formaty)
        const isSuccess = url.includes('/payment/success') || 
                         url.includes('payment/success') ||
                         url.includes('success=true') ||
                         (url.includes('session_id=') && (url.includes('success') || url.includes('checkout/session')));
        
        const isCancel = url.includes('/payment/cancel') || 
                        url.includes('payment/cancel') ||
                        url.includes('cancel=true') ||
                        url.includes('cancelled');

        if (isSuccess && !isCancel) {
            return 'success';
        } else if (isCancel) {
            return 'cancel';
        }
        return null;
    };

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        const { url } = navState;
        console.log('PaymentWebView - Navigation to:', url);

        // Sprawdź status płatności
        const status = checkPaymentStatus(url);
        
        if (status === 'success' && !paymentCompleted) {
            console.log('PaymentWebView - Payment successful! URL:', url);
            setPaymentCompleted(true);
            setLoading(false);
            
            // Zweryfikuj status płatności w backendzie przed zamknięciem
            if (transactionId) {
                verifyPaymentStatus(transactionId).then(() => {
                    if (onSuccess) {
                        onSuccess();
                    }
                    setTimeout(() => {
                        onClose();
                    }, 2000);
                }).catch((error) => {
                    console.error('Błąd weryfikacji płatności:', error);
                    // Nawet jeśli weryfikacja się nie powiodła, zamknij WebView
                    if (onSuccess) {
                        onSuccess();
                    }
                    setTimeout(() => {
                        onClose();
                    }, 2000);
                });
            } else {
                // Brak transactionId - po prostu zamknij
                if (onSuccess) {
                    onSuccess();
                }
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } else if (status === 'cancel' && !paymentCompleted) {
            console.log('PaymentWebView - Payment cancelled! URL:', url);
            setPaymentCompleted(true);
            setLoading(false);
            if (onCancel) {
                onCancel();
            }
            // Zamknij WebView po krótkim opóźnieniu
            setTimeout(() => {
                onClose();
            }, 1500);
        }
    };

    const handleShouldStartLoadWithRequest = (request: any) => {
        const { url } = request;
        console.log('PaymentWebView - Should start load:', url);
        
        // Sprawdź status płatności przed załadowaniem
        const status = checkPaymentStatus(url);
        
        if (status === 'success' && !paymentCompleted) {
            console.log('PaymentWebView - Payment successful detected before load! URL:', url);
            setPaymentCompleted(true);
            setLoading(false);
            
            // Zweryfikuj status płatności w backendzie przed zamknięciem
            if (transactionId) {
                verifyPaymentStatus(transactionId).then(() => {
                    if (onSuccess) {
                        onSuccess();
                    }
                    setTimeout(() => {
                        onClose();
                    }, 1000);
                }).catch((error) => {
                    console.error('Błąd weryfikacji płatności:', error);
                    // Nawet jeśli weryfikacja się nie powiodła, zamknij WebView
                    if (onSuccess) {
                        onSuccess();
                    }
                    setTimeout(() => {
                        onClose();
                    }, 1000);
                });
            } else {
                // Brak transactionId - po prostu zamknij
                if (onSuccess) {
                    onSuccess();
                }
                setTimeout(() => {
                    onClose();
                }, 500);
            }
            return false; // Zablokuj ładowanie URL-a
        } else if (status === 'cancel' && !paymentCompleted) {
            console.log('PaymentWebView - Payment cancelled detected before load! URL:', url);
            setPaymentCompleted(true);
            setLoading(false);
            if (onCancel) {
                onCancel();
            }
            setTimeout(() => {
                onClose();
            }, 500);
            return false; // Zablokuj ładowanie URL-a
        }
        
        return true; // Pozwól załadować inne URL-e
    };

    const handleError = (syntheticEvent: any) => {
        const { nativeEvent } = syntheticEvent;
        const { url, description } = nativeEvent;
        
        // Jeśli płatność została już zakończona, zignoruj błąd
        if (paymentCompleted) {
            console.log('PaymentWebView - Error after payment completion, ignoring:', description);
            return;
        }
        
        // Jeśli błąd dotyczy URL-a success/cancel, zignoruj go (localhost nie działa w emulatorze)
        const status = checkPaymentStatus(url);
        if (status === 'success' || status === 'cancel') {
            console.log('PaymentWebView - Error loading success/cancel URL (expected in mobile), ignoring:', description);
            return;
        }
        
        console.error('PaymentWebView - Error:', nativeEvent);
        Alert.alert('Błąd', 'Wystąpił błąd podczas ładowania strony płatności. Spróbuj ponownie.');
    };

    const handleLoadEnd = () => {
        setLoading(false);
    };

    const handleLoadStart = () => {
        setLoading(true);
    };

    const verifyPaymentStatus = async (txId: string) => {
        if (verifyingPayment) {
            return; // Już weryfikujemy
        }
        
        setVerifyingPayment(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                console.error('Brak tokena do weryfikacji płatności');
                return;
            }

            console.log('Weryfikacja statusu płatności dla transaction_id:', txId);
            
            const res = await API.post(`/payments/verify/${txId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Weryfikacja płatności - odpowiedź:', res.data);
            
            if (res.data?.status === 'success') {
                console.log('Status płatności został zaktualizowany w bazie danych');
            } else if (res.data?.status === 'pending') {
                console.log('Płatność nadal oczekuje - status nie został jeszcze zaktualizowany');
            } else {
                console.log('Status płatności:', res.data?.status);
            }
        } catch (error: any) {
            console.error('Błąd weryfikacji statusu płatności:', error);
            // Nie pokazuj błędu użytkownikowi - webhook może zaktualizować status później
        } finally {
            setVerifyingPayment(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Płatność Stripe</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <MaterialIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* WebView */}
                {paymentUrl && (
                    <WebView
                        ref={webViewRef}
                        source={{ uri: paymentUrl }}
                        style={styles.webview}
                        onNavigationStateChange={handleNavigationStateChange}
                        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                        onError={handleError}
                        onLoadEnd={handleLoadEnd}
                        onLoadStart={handleLoadStart}
                        startInLoadingState={true}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        sharedCookiesEnabled={true}
                        thirdPartyCookiesEnabled={true}
                        allowsBackForwardNavigationGestures={true}
                        incognito={false}
                    />
                )}

                {/* Loading indicator */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#16a34a" />
                        <Text style={styles.loadingText}>Ładowanie płatności...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
});

