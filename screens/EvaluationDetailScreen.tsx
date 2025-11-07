/**
 * EvaluationDetailScreen
 * Grading grid for students × competences
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput as RNTextInput,
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
  
  // Cell editing state
  const [editingCell, setEditingCell] = useState<{ studentId: string; competenceId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingCell, setSavingCell] = useState<{ studentId: string; competenceId: string } | null>(null);
  const inputRefs = useRef<{ [key: string]: RNTextInput | null }>({});
  
  // Grading dialog state (kept for niveaux system)
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
      
      console.log('📊 Evaluation loaded:', {
        id: evaluation.id,
        titre: evaluation.titre,
        competenceIds: evaluation.competenceIds,
        competenceCount: evaluation.competenceIds.length,
      });
      
      const [studs, comps, res] = await Promise.all([
        studentService.getByClass(evaluation.classId),
        competenceService.getByIds(evaluation.competenceIds),
        evaluationResultService.getByEvaluationId(evaluationId),
      ]);
      
      console.log('📚 Competences loaded:', {
        requested: evaluation.competenceIds.length,
        found: comps.length,
        competences: comps.map(c => ({ id: c.id, nom: c.nom })),
      });
      
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

    // Validation for points system
    if (evaluation.notationSystem === 'points') {
      const score = parseFloat(formScore);
      if (isNaN(score)) {
        Alert.alert('Erreur', 'Le score doit être un nombre');
        return;
      }
      if (score < 0) {
        Alert.alert('Erreur', 'Le score ne peut pas être négatif');
        return;
      }
      if (evaluation.maxPoints && score > evaluation.maxPoints) {
        Alert.alert('Erreur', `Le score ne peut pas dépasser ${evaluation.maxPoints}`);
        return;
      }
    }

    // Validation for niveaux system
    if (evaluation.notationSystem === 'niveaux' && !formNiveau) {
      Alert.alert('Erreur', 'Veuillez sélectionner un niveau');
      return;
    }

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

  const handleCellPress = (student: Student, competence: Competence) => {
    if (!evaluation) return;

    // For niveaux system, use dialog
    if (evaluation.notationSystem === 'niveaux') {
      openGradingDialog(student, competence);
      return;
    }

    // For points system, enable inline editing
    const cellKey = `${student.id}_${competence.id}`;
    const result = getResult(student.id, competence.id);
    
    setEditingCell({ studentId: student.id, competenceId: competence.id });
    setEditValue(result?.score?.toString() || '');
    
    // Focus input after state update
    setTimeout(() => {
      inputRefs.current[cellKey]?.focus();
    }, 100);
  };

  const handleCellBlur = async (studentId: string, competenceId: string) => {
    if (!evaluation) return;

    const trimmedValue = editValue.trim();
    
    // If empty, delete the result
    if (trimmedValue === '') {
      const result = getResult(studentId, competenceId);
      if (result) {
        try {
          setSavingCell({ studentId, competenceId });
          await evaluationResultService.delete(result.id);
          await loadData();
        } catch (error) {
          console.error('Failed to delete grade:', error);
          Alert.alert('Erreur', 'Impossible de supprimer la note');
        } finally {
          setSavingCell(null);
        }
      }
      setEditingCell(null);
      return;
    }

    // Validate score
    const score = parseFloat(trimmedValue);
    if (isNaN(score)) {
      Alert.alert('Erreur', 'Le score doit être un nombre');
      setEditingCell(null);
      return;
    }
    if (score < 0) {
      Alert.alert('Erreur', 'Le score ne peut pas être négatif');
      setEditingCell(null);
      return;
    }
    if (evaluation.maxPoints && score > evaluation.maxPoints) {
      Alert.alert('Erreur', `Le score ne peut pas dépasser ${evaluation.maxPoints}`);
      setEditingCell(null);
      return;
    }

    // Save the result
    const existingResult = getResult(studentId, competenceId);
    const resultData: Omit<EvaluationResult, 'createdAt' | 'updatedAt'> = {
      id: existingResult?.id || `result_${Date.now()}`,
      evaluationId: evaluation.id,
      studentId,
      competenceId,
      score,
      commentaire: existingResult?.commentaire,
    };

    try {
      setSavingCell({ studentId, competenceId });
      await evaluationResultService.upsert(resultData);
      await loadData();
    } catch (error) {
      console.error('Failed to save grade:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la note');
    } finally {
      setSavingCell(null);
      setEditingCell(null);
    }
  };

  const renderCellContent = (studentId: string, competenceId: string) => {
    const result = getResult(studentId, competenceId);
    const cellKey = `${studentId}_${competenceId}`;
    const isEditing = editingCell?.studentId === studentId && editingCell?.competenceId === competenceId;
    const isSaving = savingCell?.studentId === studentId && savingCell?.competenceId === competenceId;
    
    if (!evaluation) return null;

    if (evaluation.notationSystem === 'niveaux' && result?.niveau) {
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
    } else if (evaluation.notationSystem === 'points') {
      // Editable input for points system
      return (
        <View style={styles.cellContent}>
          {isSaving ? (
            <MaterialCommunityIcons name="loading" size={16} color={theme.primary} />
          ) : (
            <RNTextInput
              ref={(ref) => { inputRefs.current[cellKey] = ref; }}
              style={[
                styles.cellInput,
                { color: theme.text },
                isEditing && styles.cellInputEditing,
              ]}
              value={isEditing ? editValue : (result?.score?.toString() || '')}
              onChangeText={setEditValue}
              onFocus={() => {
                setEditingCell({ studentId, competenceId });
                setEditValue(result?.score?.toString() || '');
              }}
              onBlur={() => handleCellBlur(studentId, competenceId)}
              keyboardType="decimal-pad"
              selectTextOnFocus
              placeholder={isEditing ? '' : '—'}
              placeholderTextColor={theme.textTertiary}
              returnKeyType="done"
            />
          )}
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
      <View style={styles.gridContainer}>
        <ScrollView 
          horizontal 
          style={styles.scrollHorizontal}
          contentContainerStyle={styles.scrollHorizontalContent}
        >
          <ScrollView 
            style={styles.scrollVertical}
            contentContainerStyle={styles.scrollVerticalContent}
          >
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
                    onPress={() => handleCellPress(student, comp)}
                    activeOpacity={evaluation.notationSystem === 'points' ? 1 : 0.7}
                  >
                    {renderCellContent(student.id, comp.id)}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            </View>
          </ScrollView>
        </ScrollView>
      </View>

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
                error={
                  formScore !== '' && 
                  (isNaN(parseFloat(formScore)) || 
                   parseFloat(formScore) < 0 || 
                   (!!evaluation.maxPoints && parseFloat(formScore) > evaluation.maxPoints))
                }
                right={
                  formScore !== '' && 
                  !isNaN(parseFloat(formScore)) && 
                  parseFloat(formScore) >= 0 &&
                  (!evaluation.maxPoints || parseFloat(formScore) <= evaluation.maxPoints) ? (
                    <TextInput.Icon icon="check" />
                  ) : undefined
                }
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
  gridContainer: {
    flex: 1,
  },
  scrollHorizontal: {
    flex: 1,
  },
  scrollHorizontalContent: {
    minWidth: '100%',
  },
  scrollVertical: {
    flex: 1,
  },
  scrollVerticalContent: {
    paddingBottom: 20,
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
    width: '100%',
    alignItems: 'center',
  },
  cellInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    padding: 4,
    minHeight: 30,
  },
  cellInputEditing: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
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
