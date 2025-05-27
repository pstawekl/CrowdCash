import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SideMenu({ visible, onClose, children }: { visible: boolean, onClose: () => void, children: React.ReactNode }) {
    const translateX = React.useRef(new Animated.Value(-SCREEN_WIDTH)).current;

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: visible ? 0 : -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    // Swipe left to close
    const panResponder = React.useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dx < -10,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < 0) {
                    translateX.setValue(Math.max(gestureState.dx, -SCREEN_WIDTH));
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -60) {
                    onClose();
                } else {
                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    if (!visible) return null;

    return (
        <Animated.View style={[styles.overlay, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
            <View style={styles.menuFull}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Zamknij menu">
                    <Ionicons name="close" size={32} color="#222" />
                </TouchableOpacity>
                {children}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: SCREEN_WIDTH,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.25)',
        zIndex: 999,
    },
    menuFull: {
        width: SCREEN_WIDTH,
        height: '100%',
        backgroundColor: '#fff',
        paddingVertical: 80,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 2, height: 0 },
        shadowRadius: 8,
        elevation: 8,
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
    },
});
