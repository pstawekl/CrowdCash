import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface MenuOption {
    id: string;
    label: string;
    icon?: JSX.Element | string | null;
    onPress: () => void;
}

interface HeaderDropdownMenuProps {
    options: MenuOption[];
    buttonContent?: React.ReactNode;
}

const HeaderDropdownMenu: React.FC<HeaderDropdownMenuProps> = ({
    options,
    buttonContent,
}) => {
    const [visible, setVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0)).current;

    const showMenu = () => {
        setVisible(true);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
        }).start();
    };

    const hideMenu = () => {
        Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
        });
    };

    const handleOptionPress = (onPress: () => void) => {
        hideMenu();
        setTimeout(onPress, 300);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={showMenu} style={styles.button}>
                {buttonContent || <Ionicons name="ellipsis-vertical" size={24} color="#333" />}
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="none"
                onRequestClose={hideMenu}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={hideMenu}
                >
                    <Animated.View
                        style={[
                            styles.menuContainer,
                            {
                                transform: [{ scale: scaleAnim }],
                                opacity: scaleAnim,
                            },
                        ]}
                    >
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.menuItem}
                                onPress={() => handleOptionPress(option.onPress)}
                            >
                                {option.icon && (
                                    option.icon
                                )}
                                <Text style={styles.menuItemText}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    button: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    menuContainer: {
        marginTop: 60,
        marginRight: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 8,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuItemIcon: {
        marginRight: 12,
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
    },
});

export default HeaderDropdownMenu;