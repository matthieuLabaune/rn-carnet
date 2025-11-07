/**
 * EvaluationDetailScreen
 * Grading grid for students × competences
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Text, Button, Portal, Dialog, TextInput, RadioButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import {
  evaluationService,
  evaluationResultService,
  studentService,
  competenceService,
} from '../services';
import {
  Evaluation,
  EvaluationResult,
  Student,
  Competence,
  Niveau,
  NIVEAU_LABELS,
  NIVEAU_COLORS,
  NIVEAU_ICONS,
} from '../types';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EvaluationDetail'>;
type RouteProps = RouteProp<RootStackParamList, 'EvaluationDetail'>;

export default function EvaluationDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme } = useTheme();
  
  const { evaluationId } = route.params;
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Grading dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCompetence, setSelectedCompetence] = useState<Competence | null>(null);
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
  
  // Form state
  const [formNiveau, setFormNiveau] = useState<Niveau | undefined>();
  const [formScore, setFormScore] = useState('');
  const [formCommentaire, setFormCommentaire] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const evaluation = await evaluationService.getById(evaluationId);
      if (!evaluation) {
        Alert.alert('Erreur', 'Évaluation introuvable');
        navigation.goBack();
        return;
      }
      
      const [studs, comps, res] = await Promise.all([
        studentService.getByClass(evaluation.classId),
        competenceService.getByIds(evaluation.competenceIds),
        evaluationResultService.getByEvaluationId(evaluationId),
      ]);
      
      setEvaluation(evaluation);
      setStudents(studs);
      setCompetences(comps);
      setResults(res);
    } catch (error) {
      console.error('Failed to load evaluation:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'évaluation');
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openGradingDialog = (student: Student, competence: Competence) => {
    const existing = results.find(
      r => r.studentId === student.id && r.competenceId === competence.id
    );
    
    setSelectedStudent(student);
    setSelectedCompetence(competence);
    setCurrentResult(existing || null);
    
    if (existing) {
      setFormNiveau(existing.niveau);
      setFormScore(existing.score?.toString() || '');
      setFormCommentaire(existing.commentaire || '');
    } else {
      setFormNiveau(undefined);
      setFormScore('');
      setFormCommentaire('');
    }
    
    setDialogVisible(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent || !selectedCompetence || !evaluation) return;

    const resultData: Omit<EvaluationResult, 'createdAt' | 'updatedAt'> = {
      id: currentResult?.id || `result_${Date.now()}`,
      evaluationId: evaluation.id,
      studentId: selectedStudent.id,
      competenceId: selectedCompetence.id,
      niveau: evaluation.notationSystem === 'niveaux' ? formNiveau : undefined,
      score: evaluation.notationSystem === 'points' && formScore ? parseFloat(formScore) : undefined,
      commentaire: formCommentaire.trim() || undefined,
    };

    try {
      await evaluationResultService.upsert(resultData);
      await loadData();
      setDialogVisible(false);
    } catch (error) {
      console.error('Failed to save grade:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la note');
    }
  };

  const getResult = (studentId: string, competenceId: string): EvaluationResult | undefined => {
    return results.find(r => r.studentId === studentId && r.competenceId === competenceId);
  };

  const renderCellContent = (studentId: string, competenceId: string) => {
    const result = getResult(studentId, competenceId);
    if (!result || !evaluation) return null;

    if (evaluation.notationSystem === 'niveaux' && result.niveau) {
      const color = NIVEAU_COLORS[result.niveau];
      return (
        <View style={[styles.cellContent, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons
            name={NIVEAU_ICONS[result.niveau] as any}
            size={16}
            color={color}
          />
        </View>
      );
    } else if (evaluation.notationSystem === 'points' && result.score !== undefined) {
      return (
        <View style={styles.cellContent}>
          <Text style={[styles.scoreText, { color: theme.text }]}>
            {result.score}
          </Text>
        </View>
      );
    }

    return null;
  };

  const getCompletionPercentage = (): number => {
    if (students.length === 0 || competences.length === 0) return 0;
    const total = students.length * competences.length;
    return Math.round((results.length / total) * 100);
  };

  if (!evaluation) {
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
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>
            {new Date(evaluation.date).toLocaleDateString('fr-FR')}
          </Text>
          <Text style={styles.headerTitle}>{evaluation.titre}</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: theme.surface }]}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="account-group" size={20} color={theme.primary} />
          <Text style={{ color: theme.text }}>
            {students.length} élèves
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="star-box-multiple" size={20} color={theme.primary} />
          <Text style={{ color: theme.text }}>
            {competences.length} compétences
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="progress-check" size={20} color={theme.primary} />
          <Text style={{ color: theme.text }}>
            {getCompletionPercentage()}% complété
          </Text>
        </View>
      </View>

      {/* Grading Grid */}
      <ScrollView horizontal style={styles.scrollHorizontal}>
        <ScrollView style={styles.scrollVertical}>
          <View style={styles.grid}>
            {/* Header Row */}
            <View style={styles.gridRow}>
              <View style={[styles.headerCell, styles.nameCell, { backgroundColor: theme.surface }]}>
                <Text style={[styles.headerText, { color: theme.text }]}>Élève</Text>
              </View>
              {competences.map(comp => (
                <View
                  key={comp.id}
                  style={[styles.headerCell, styles.competenceCell, { backgroundColor: theme.surface }]}
                >
                  <View style={[styles.competenceIndicator, { backgroundColor: comp.couleur }]} />
                  <Text
                    style={[styles.headerText, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {comp.nom}
                  </Text>
                </View>
              ))}
            </View>

            {/* Student Rows */}
            {students.map((student, index) => (
              <View
                key={student.id}
                style={[
                  styles.gridRow,
                  index % 2 === 1 && { backgroundColor: theme.surface + '40' },
                ]}
              >
                <View style={[styles.cell, styles.nameCell]}>
                  <Text style={[styles.studentName, { color: theme.text }]}>
                    {student.firstName} {student.lastName}
                  </Text>
                </View>
                {competences.map(comp => (
                  <TouchableOpacity
                    key={comp.id}
                    style={[styles.cell, styles.competenceCell]}
                    onPress={() => openGradingDialog(student, comp)}
                  >
                    {renderCellContent(student.id, comp.id)}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Grading Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            Noter {selectedStudent?.firstName} {selectedStudent?.lastName}
          </Dialog.Title>
          <Dialog.Content>
            {selectedCompetence && (
              <Text style={[styles.competenceLabel, { color: selectedCompetence.couleur }]}>
                {selectedCompetence.nom}
              </Text>
            )}

            {evaluation.notationSystem === 'niveaux' ? (
              <View style={styles.niveauxContainer}>
                {Object.entries(NIVEAU_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setFormNiveau(key as Niveau)}
                    style={[
                      styles.niveauButton,
                      {
                        backgroundColor: NIVEAU_COLORS[key as Niveau] + '20',
                        borderColor: NIVEAU_COLORS[key as Niveau],
                        borderWidth: formNiveau === key ? 2 : 1,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={NIVEAU_ICONS[key as Niveau] as any}
                      size={24}
                      color={NIVEAU_COLORS[key as Niveau]}
                    />
                    <Text style={{ color: NIVEAU_COLORS[key as Niveau], fontWeight: '500' }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                label={`Score / ${evaluation.maxPoints}`}
                value={formScore}
                onChangeText={setFormScore}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.input}
              />
            )}

            <TextInput
              label="Commentaire (optionnel)"
              value={formCommentaire}
              onChangeText={setFormCommentaire}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleSaveGrade}>Enregistrer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    elevation: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollHorizontal: {
    flex: 1,
  },
  scrollVertical: {
    flex: 1,
  },
  grid: {
    padding: 16,
  },
  gridRow: {
    flexDirection: 'row',
  },
  headerCell: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
  },
  cell: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameCell: {
    width: 150,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  competenceCell: {
    width: 100,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  competenceIndicator: {
    width: '100%',
    height: 3,
    marginBottom: 6,
    borderRadius: 2,
  },
  studentName: {
    fontWeight: '500',
    fontSize: 14,
  },
  cellContent: {
    padding: 4,
    borderRadius: 4,
  },
  scoreText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  competenceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  niveauxContainer: {
    gap: 12,
  },
  niveauButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  input: {
    marginTop: 12,
  },
});
