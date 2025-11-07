import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Action {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    onPress: () => void;
    color?: string;
}

interface SpeedDialFABProps {
    actions: Action[];
    backgroundColor?: string;
    iconColor?: string;
}

export default function SpeedDialFAB({ 
    actions, 
    backgroundColor = '#667EEA',
    iconColor = '#ffffff'
}: SpeedDialFABProps) {
    const [open, setOpen] = useState(false);
    const [animation] = useState(new Animated.Value(0));

    const toggleMenu = () => {
        const toValue = open ? 0 : 1;
        Animated.spring(animation, {
            toValue,
            useNativeDriver: true,
            friction: 6,
        }).start();
        setOpen(!open);
    };

    const handleActionPress = (action: Action) => {
        toggleMenu();
        setTimeout(() => action.onPress(), 200);
    };

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    return (
        <View style={styles.container}>
            {/* Backdrop */}
            {open && (
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={toggleMenu}
                />
            )}
            
            {/* Action buttons */}
            {actions.map((action, index) => {
                const translateY = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(68 * (index + 1))],
                });

                const opacity = animation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.actionContainer,
                            {
                                transform: [{ translateY }],
                                opacity,
                            },
                        ]}
                    >
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{action.label}</Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                { backgroundColor: action.color || backgroundColor },
                            ]}
                            onPress={() => handleActionPress(action)}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons 
                                name={action.icon} 
                                size={24} 
                                color={iconColor} 
                            />
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}

            {/* Main FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor }]}
                onPress={toggleMenu}
                activeOpacity={0.8}
            >
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <MaterialCommunityIcons name="plus" size={28} color={iconColor} />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        right: 24,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    actionContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 0,
    },
    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    labelContainer: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    backdrop: {
        position: 'absolute',
        top: -10000,
        left: -10000,
        right: -10000,
        bottom: -10000,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: -1,
    },
});
