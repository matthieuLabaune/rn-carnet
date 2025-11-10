import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { initDatabase } from './services/database';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { RootStackParamList, MainTabsParamList } from './navigation/types';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import ClassListScreen from './screens/ClassListScreen';
import ClassDetailScreen from './screens/ClassDetailScreen';
import StudentListScreen from './screens/StudentListScreen';
import StudentDetailScreen from './screens/StudentDetailScreen';
import AllStudentsScreen from './screens/AllStudentsScreen';
import AllSessionsScreen from './screens/AllSessionsScreen';
import SessionListScreen from './screens/SessionListScreen';
import SessionDetailScreen from './screens/SessionDetailScreen';
import CompetencesManagementScreen from './screens/CompetencesManagementScreen';
import EvaluationsListScreen from './screens/EvaluationsListScreen';
import EvaluationDetailScreen from './screens/EvaluationDetailScreen';
import ScheduleManagementScreen from './screens/ScheduleManagementScreen';
import SessionGenerationScreen from './screens/SessionGenerationScreen';
import ScheduleWizardScreen from './screens/ScheduleWizardScreen';
import SequencePlanningScreen from './screens/SequencePlanningScreen';
import SequenceDetailScreen from './screens/SequenceDetailScreen';
import SequenceAssignmentScreen from './screens/SequenceAssignmentScreen';
import SequenceTimelineScreen from './screens/SequenceTimelineScreen';
import SequencesIndexScreen from './screens/SequencesIndexScreen';
import SequencesTabScreen from './screens/SequencesTabScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

function MainTabs() {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.text,
                tabBarInactiveTintColor: theme.textTertiary,
                tabBarStyle: {
                    backgroundColor: theme.surface,
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    height: 85,
                    paddingBottom: 20,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Accueil',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Classes"
                component={ClassListScreen}
                options={{
                    tabBarLabel: 'Classes',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="google-classroom" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Sequences"
                component={SequencesTabScreen}
                options={{
                    tabBarLabel: 'Séquences',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="book-open-page-variant" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Sessions"
                component={AllSessionsScreen}
                options={{
                    tabBarLabel: 'Séances',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="calendar-text" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    const [loading, setLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        initDatabase()
            .then(() => setLoading(false))
            .catch(console.error);
    }, []);

    // Afficher le splash screen
    if (showSplash) {
        return (
            <PaperProvider>
                <SafeAreaProvider>
                    <SplashScreen onFinish={() => setShowSplash(false)} />
                </SafeAreaProvider>
            </PaperProvider>
        );
    }

    // Afficher le loading après le splash si la DB n'est pas prête
    if (loading) {
        return (
            <PaperProvider>
                <SafeAreaProvider>
                    <View style={styles.loadingContainer}>
                        <View style={styles.loadingDot} />
                    </View>
                </SafeAreaProvider>
            </PaperProvider>
        );
    }

    return (
        <ThemeProvider>
            <PaperProvider>
                <SafeAreaProvider>
                    <NavigationContainer>
                        <Stack.Navigator
                            screenOptions={{
                                headerShown: false,
                            }}
                        >
                            <Stack.Screen
                                name="MainTabs"
                                component={MainTabs}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="ClassDetail"
                                component={ClassDetailScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="StudentList"
                                component={StudentListScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="StudentDetail"
                                component={StudentDetailScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="SessionList"
                                component={SessionListScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="SessionDetail"
                                component={SessionDetailScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="CompetencesManagement"
                                component={CompetencesManagementScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="EvaluationsList"
                                component={EvaluationsListScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="EvaluationDetail"
                                component={EvaluationDetailScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="ScheduleManagement"
                                component={ScheduleManagementScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="SessionGeneration"
                                component={SessionGenerationScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="ScheduleWizard"
                                component={ScheduleWizardScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="SequencesIndex"
                                component={SequencesIndexScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="SequencePlanning"
                                component={SequencePlanningScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="SequenceDetail"
                                component={SequenceDetailScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="SequenceAssignment"
                                component={SequenceAssignmentScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="SequenceTimeline"
                                component={SequenceTimelineScreen}
                                options={{ headerShown: false }}
                            />
                        </Stack.Navigator>
                    </NavigationContainer>
                </SafeAreaProvider>
            </PaperProvider>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#000',
    },
});
