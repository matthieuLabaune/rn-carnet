import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CustomFABProps {
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
    backgroundColor?: string;
    iconColor?: string;
}

export default function CustomFAB({ 
    icon = 'plus', 
    onPress, 
    backgroundColor = '#667EEA',
    iconColor = '#ffffff'
}: CustomFABProps) {
    return (
        <TouchableOpacity
            style={[styles.fab, { backgroundColor }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
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
});
