import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface AppHeaderProps {
    title: string;
    rightComponent?: React.ReactNode;
    showBackButton?: boolean;
}

export default function AppHeader({ title, rightComponent, showBackButton }: AppHeaderProps) {
    const { theme } = useTheme();
    const navigation = useNavigation();
    
    return (
        <View style={[styles.header, { 
            backgroundColor: theme.colors.header.background,
            borderBottomColor: theme.colors.header.border 
        }]}>
            {showBackButton ? (
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color={theme.colors.header.text} />
                </TouchableOpacity>
            ) : (
                <View style={styles.placeholder} />
            )}
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
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
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

