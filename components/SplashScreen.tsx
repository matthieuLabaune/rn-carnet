import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        // Séquence d'animations
        Animated.sequence([
            // Phase 1: Apparition de l'icône
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]),
            // Phase 2: Slide du texte
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
            // Phase 3: Pause
            Animated.delay(800),
            // Phase 4: Disparition
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onFinish();
        });
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                {/* Icône principale */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.iconBackground}>
                        <MaterialCommunityIcons
                            name="notebook"
                            size={80}
                            color="#FFFFFF"
                        />
                    </View>
                </Animated.View>

                {/* Texte de l'app */}
                <Animated.View
                    style={[
                        styles.textContainer,
                        {
                            transform: [{ translateY: slideAnim }],
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <Text style={styles.appName}>Carnet - Éducation</Text>
                    <Text style={styles.tagline}>Gérez vos classes avec simplicité</Text>
                </Animated.View>
            </Animated.View>

            {/* Footer avec version et crédit */}
            <Animated.View
                style={[
                    styles.footer,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                <Text style={styles.version}>v1.0.0</Text>
                <Text style={styles.credits}>Grey Matter Technology</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconBackground: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    textContainer: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    version: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 4,
    },
    credits: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '600',
    },
});
