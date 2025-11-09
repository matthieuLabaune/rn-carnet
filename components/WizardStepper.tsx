import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface WizardStep {
    label: string;
    icon?: string;
}

interface Props {
    steps: WizardStep[];
    currentStep: number; // 0-based index
    accentColor?: string;
}

export default function WizardStepper({ steps, currentStep, accentColor = '#007AFF' }: Props) {
    return (
        <View style={styles.container}>
            {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isLast = index === steps.length - 1;

                return (
                    <React.Fragment key={index}>
                        <View style={styles.stepContainer}>
                            {/* Circle */}
                            <View
                                style={[
                                    styles.circle,
                                    isCompleted && { backgroundColor: accentColor, borderColor: accentColor },
                                    isActive && { borderColor: accentColor, borderWidth: 3 },
                                ]}
                            >
                                {isCompleted ? (
                                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                                ) : (
                                    <Text
                                        style={[
                                            styles.stepNumber,
                                            isActive && { color: accentColor, fontWeight: '700' },
                                        ]}
                                    >
                                        {index + 1}
                                    </Text>
                                )}
                            </View>

                            {/* Label */}
                            <Text
                                style={[
                                    styles.label,
                                    isActive && { color: accentColor, fontWeight: '700' },
                                    isCompleted && { color: accentColor, fontWeight: '600' },
                                ]}
                            >
                                {step.label}
                            </Text>
                        </View>

                        {/* Connector line */}
                        {!isLast && (
                            <View
                                style={[
                                    styles.connector,
                                    isCompleted && { backgroundColor: accentColor },
                                ]}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
    },
    stepContainer: {
        alignItems: 'center',
        gap: 8,
    },
    circle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
    },
    label: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        maxWidth: 80,
    },
    connector: {
        flex: 1,
        height: 2,
        backgroundColor: '#ddd',
        marginHorizontal: 8,
        marginBottom: 24,
    },
});
