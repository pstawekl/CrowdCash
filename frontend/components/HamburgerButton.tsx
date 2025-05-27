import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function HamburgerButton({ onPress }: { onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.button} accessibilityLabel="Otwórz menu">
            <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        marginLeft: 10,
        padding: 4,
    },
});
