import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { getByClass } from '../services/scheduleService';
import { previewGeneration, generateSessions, regenerateSessions } from '../services/sessionGeneratorService';
import { getSchoolYearSettings } from '../services/settingsService';
import type { ScheduleSlot } from '../types/schedule';
import type { SchoolYearSettings } from '../types/settings';
import { COLORS } from '../utils/theme';

type SessionGenerationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionGeneration'>;
type SessionGenerationScreenRouteProp = RouteProp<RootStackParamList, 'SessionGeneration'>;

interface Props {
  navigation: SessionGenerationScreenNavigationProp;
  route: SessionGenerationScreenRouteProp;
}

export default function SessionGenerationScreen({ navigation, route }: Props) {
  const { classId, className } = route.params;
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [settings, setSettings] = useState<SchoolYearSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<{
    totalGenerated: number;
    startDate: string;
    endDate: string;
    skippedDays: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [slotsData, settingsData] = await Promise.all([
        getByClass(classId),
        getSchoolYearSettings(),
      ]);
      setSlots(slotsData);
      setSettings(settingsData);

      if (settingsData?.schoolYearStart && settingsData?.schoolYearEnd) {
        const preview = await previewGeneration(classId);
        setPreviewData(preview);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleGenerate = async (deleteExisting: boolean) => {
    const action = deleteExisting ? 'régénérer' : 'générer';
    const message = deleteExisting
      ? 'Toutes les séances existantes seront supprimées et remplacées. Continuer ?'
      : `${previewData?.totalGenerated} séance(s) seront créées. Continuer ?`;

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} les séances`,
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setGenerating(true);
            try {
              const result = deleteExisting
                ? await regenerateSessions(classId)
                : await generateSessions({ classId });

              Alert.alert(
                'Succès',
                `${result.totalGenerated} séance(s) créée(s) !`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.navigate('SessionList', { classId });
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('Error generating sessions:', error);
              Alert.alert('Erreur', error.message || 'Impossible de générer les séances');
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!settings?.schoolYearStart || !settings?.schoolYearEnd) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={80} color={COLORS.warning} />
            <Text style={styles.errorTitle}>Configuration manquante</Text>
            <Text style={styles.errorText}>
              Configurez d'abord l'année scolaire et la zone dans les paramètres
            </Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Settings' } as any)}
            >
              <Text style={styles.settingsButtonText}>Ouvrir les paramètres</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec bouton retour */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('ScheduleManagement', { classId, className })}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Génération de séances</Text>
          <Text style={styles.headerSubtitle}>{className}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Résumé de la configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres de l'année scolaire</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Zone</Text>
              <Text style={styles.infoValue}>{settings.zone}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-start" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Début</Text>
              <Text style={styles.infoValue}>{formatDate(settings.schoolYearStart)}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-end" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Fin</Text>
              <Text style={styles.infoValue}>{formatDate(settings.schoolYearEnd)}</Text>
            </View>
          </View>
        </View>

        {/* Emploi du temps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emploi du temps configuré</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Créneaux</Text>
              <Text style={styles.infoValue}>{slots.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Hebdomadaires</Text>
              <Text style={styles.infoValue}>
                {slots.filter(s => s.frequency === 'weekly').length}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-time-two-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Bimensuels</Text>
              <Text style={styles.infoValue}>
                {slots.filter(s => s.frequency === 'biweekly').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Prévisualisation */}
        {previewData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prévisualisation</Text>
            <View style={[styles.card, styles.previewCard]}>
              <View style={styles.previewHeader}>
                <MaterialCommunityIcons name="eye" size={32} color={COLORS.primary} />
                <View style={styles.previewHeaderText}>
                  <Text style={styles.previewTitle}>{previewData.totalGenerated}</Text>
                  <Text style={styles.previewSubtitle}>
                    séance{previewData.totalGenerated > 1 ? 's' : ''} seront créée{previewData.totalGenerated > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.previewStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Jours exclus</Text>
                  <Text style={styles.statValue}>{previewData.skippedDays}</Text>
                  <Text style={styles.statHint}>weekends, vacances, fériés</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.generateButton]}
            onPress={() => handleGenerate(false)}
            disabled={generating || !previewData || previewData.totalGenerated === 0}
          >
            {generating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="auto-fix" size={24} color="white" />
                <Text style={styles.actionButtonText}>Générer les séances</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.regenerateButton]}
            onPress={() => handleGenerate(true)}
            disabled={generating || !previewData || previewData.totalGenerated === 0}
          >
            {generating ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <>
                <MaterialCommunityIcons name="refresh" size={24} color={COLORS.error} />
                <Text style={[styles.actionButtonText, styles.regenerateButtonText]}>
                  Régénérer (supprimer l'existant)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Note d'information */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color={COLORS.primary} />
          <Text style={styles.infoBoxText}>
            Les séances seront créées automatiquement en respectant l'emploi du temps, 
            les vacances scolaires de votre zone et les jours fériés.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5e5e5',
  },
  scrollView: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  previewCard: {
    gap: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previewHeaderText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  previewSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
  },
  regenerateButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  regenerateButtonText: {
    color: COLORS.error,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  settingsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
