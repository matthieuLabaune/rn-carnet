/**
 * EvaluationsListScreen
 * Display list of evaluations for a class
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Text, FAB, Chip, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { evaluationService, classService, competenceService } from '../services';
import { Evaluation, EvaluationType, Class, Competence, EVALUATION_TYPE_LABELS } from '../types';
import { RootStackParamList } from '../navigation/types';
import EvaluationFormDialog from '../components/EvaluationFormDialog';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EvaluationsList'>;
type RouteProps = RouteProp<RootStackParamList, 'EvaluationsList'>;

type FilterType = 'all' | 'standalone' | 'linked';

export default function EvaluationsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  
  const { classId } = route.params;
  
  const [classData, setClassData] = useState<Class | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [competencesMap, setCompetencesMap] = useState<Record<string, Competence>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | undefined>();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cls, evals, comps] = await Promise.all([
        classService.getById(classId),
        evaluationService.getByClassId(classId),
        competenceService.getAll(),
      ]);
      
      setClassData(cls);
      setEvaluations(evals);
      
      // Create competences map
      const map: Record<string, Competence> = {};
      comps.forEach(comp => {
        map[comp.id] = comp;
      });
      setCompetencesMap(map);
    } catch (error) {
      console.error('Failed to load evaluations:', error);
      Alert.alert('Erreur', 'Impossible de charger les évaluations');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    applyFilter();
  }, [evaluations, filter]);

  const applyFilter = () => {
    let filtered = [...evaluations];
    if (filter === 'standalone') {
      filtered = evaluations.filter(e => !e.sessionId);
    } else if (filter === 'linked') {
      filtered = evaluations.filter(e => !!e.sessionId);
    }
    setFilteredEvaluations(filtered);
  };

  const handleCreateEvaluation = async (evaluation: Omit<Evaluation, 'createdAt' | 'updatedAt'>) => {
    try {
      await evaluationService.create(evaluation);
      await loadData();
      Alert.alert('Succès', 'Évaluation créée');
    } catch (error) {
      console.error('Failed to create evaluation:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'évaluation');
    }
  };

  const handleUpdateEvaluation = async (evaluation: Omit<Evaluation, 'createdAt' | 'updatedAt'>) => {
    try {
      const { id, classId: _, ...updates } = evaluation;
      await evaluationService.update(id, updates);
      await loadData();
      Alert.alert('Succès', 'Évaluation modifiée');
    } catch (error) {
      console.error('Failed to update evaluation:', error);
      Alert.alert('Erreur', 'Impossible de modifier l\'évaluation');
    }
  };

  const handleDeleteEvaluation = (evaluation: Evaluation) => {
    Alert.alert(
      'Supprimer l\'évaluation',
      `Êtes-vous sûr de vouloir supprimer "${evaluation.titre}" ? Toutes les notes associées seront perdues.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await evaluationService.delete(evaluation.id);
              await loadData();
            } catch (error) {
              console.error('Failed to delete evaluation:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'évaluation');
            }
          },
        },
      ]
    );
  };

  const openCreateDialog = () => {
    setEditingEvaluation(undefined);
    setDialogVisible(true);
  };

  const openEditDialog = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation);
    setDialogVisible(true);
  };

  const getFilterLabel = (): string => {
    switch (filter) {
      case 'standalone':
        return 'Devoirs indépendants';
      case 'linked':
        return 'Liées à des séances';
      default:
        return 'Toutes';
    }
  };

  const renderEvaluationItem = ({ item }: { item: Evaluation }) => {
    const competences = item.competenceIds
      .map(id => competencesMap[id])
      .filter(Boolean);

    return (
      <TouchableOpacity
        style={[styles.evaluationCard, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('EvaluationDetail', { evaluationId: item.id })}
        onLongPress={() => {
          Alert.alert('Actions', undefined, [
            { text: 'Modifier', onPress: () => openEditDialog(item) },
            { text: 'Supprimer', onPress: () => handleDeleteEvaluation(item), style: 'destructive' },
            { text: 'Annuler', style: 'cancel' },
          ]);
        }}
      >
        <View style={styles.evaluationHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.evaluationTitle, { color: theme.text }]}>
              {item.titre}
            </Text>
            <Text style={[styles.evaluationDate, { color: theme.textSecondary }]}>
              {new Date(item.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          {item.sessionId && (
            <MaterialCommunityIcons
              name="link-variant"
              size={20}
              color={theme.primary}
            />
          )}
        </View>

        <View style={styles.evaluationBadges}>
          <Chip
            mode="outlined"
            compact
            textStyle={styles.chipText}
            style={styles.chip}
          >
            {EVALUATION_TYPE_LABELS[item.type]}
          </Chip>
          <Chip
            mode="outlined"
            compact
            textStyle={styles.chipText}
            style={styles.chip}
          >
            {item.notationSystem === 'niveaux' ? 'Par niveaux' : `Sur ${item.maxPoints}`}
          </Chip>
        </View>

        {competences.length > 0 && (
          <View style={styles.competencesList}>
            <Text style={[styles.competencesLabel, { color: theme.textSecondary }]}>
              Compétences :
            </Text>
            <View style={styles.competencesChips}>
              {competences.slice(0, 3).map(comp => (
                <Chip
                  key={comp.id}
                  compact
                  textStyle={[styles.competenceChipText, { color: comp.couleur }]}
                  style={[styles.competenceChip, { backgroundColor: comp.couleur + '20' }]}
                >
                  {comp.nom}
                </Chip>
              ))}
              {competences.length > 3 && (
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  +{competences.length - 3}
                </Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!classData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: classData.color }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>{classData.name}</Text>
          <Text style={styles.headerTitle}>Évaluations</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={[styles.filterBar, { backgroundColor: theme.surface }]}>
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setFilterMenuVisible(true)}
              style={styles.filterButton}
            >
              <MaterialCommunityIcons name="filter-variant" size={20} color={theme.primary} />
              <Text style={{ color: theme.text }}>{getFilterLabel()}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={() => {
              setFilter('all');
              setFilterMenuVisible(false);
            }}
            title="Toutes"
            leadingIcon={filter === 'all' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setFilter('standalone');
              setFilterMenuVisible(false);
            }}
            title="Devoirs indépendants"
            leadingIcon={filter === 'standalone' ? 'check' : undefined}
          />
          <Menu.Item
            onPress={() => {
              setFilter('linked');
              setFilterMenuVisible(false);
            }}
            title="Liées à des séances"
            leadingIcon={filter === 'linked' ? 'check' : undefined}
          />
        </Menu>
        <Text style={{ color: theme.textSecondary }}>
          {filteredEvaluations.length} évaluation{filteredEvaluations.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* List */}
      {filteredEvaluations.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Aucune évaluation
          </Text>
          <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
            {filter === 'all'
              ? 'Créez votre première évaluation'
              : 'Aucune évaluation ne correspond au filtre'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvaluations}
          renderItem={renderEvaluationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadData}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={openCreateDialog}
        color="#FFFFFF"
      />

      {/* Form Dialog */}
      <EvaluationFormDialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        onSave={editingEvaluation ? handleUpdateEvaluation : handleCreateEvaluation}
        classId={classId}
        evaluation={editingEvaluation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  list: {
    padding: 16,
  },
  evaluationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  evaluationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  evaluationDate: {
    fontSize: 14,
  },
  evaluationBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
  },
  competencesList: {
    marginTop: 8,
  },
  competencesLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  competencesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  competenceChip: {
    height: 24,
  },
  competenceChipText: {
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
