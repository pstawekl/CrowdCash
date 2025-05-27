import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Loader({ color = '#4caf50', size = 'large', background = '#fff' }) {
    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
