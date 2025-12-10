import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface AppHeaderProps {
    title: string;
    rightComponent?: React.ReactNode;
}

export default function AppHeader({ title, rightComponent }: AppHeaderProps) {
    const { theme } = useTheme();
    
    return (
        <View style={[styles.header, { 
            backgroundColor: theme.colors.header.background,
            borderBottomColor: theme.colors.header.border 
        }]}>
            <Text style={[styles.title, { color: theme.colors.header.text }]}>{title}</Text>
            <View style={styles.rightContainer}>
                {rightComponent || <View style={styles.placeholder} />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'left',
    },
    rightContainer: {
        width: 40,
        alignItems: 'flex-end',
    },
    placeholder: {
        width: 24,
        height: 24,
    },
});

