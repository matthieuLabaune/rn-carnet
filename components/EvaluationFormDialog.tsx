/**
 * EvaluationFormDialog
 * Dialog for creating/editing evaluations
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import {
    Dialog,
    Portal,
    Text,
    TextInput,
    Button,
    RadioButton,
    Chip,
    Divider,
    Switch,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { competenceService, sessionService } from '../services';
import {
    Evaluation,
    EvaluationType,
    NotationSystem,
    Competence,
    Session,
    EVALUATION_TYPE_LABELS,
    NOTATION_SYSTEM_LABELS,
} from '../types';

interface Props {
    visible: boolean;
    onDismiss: () => void;
    onSave: (evaluation: Omit<Evaluation, 'createdAt' | 'updatedAt'>) => void;
    classId: string;
    evaluation?: Evaluation;
}

export default function EvaluationFormDialog({
    visible,
    onDismiss,
    onSave,
    classId,
    evaluation,
}: Props) {
    const { theme } = useTheme();

    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [type, setType] = useState<EvaluationType>('formative');
    const [notationSystem, setNotationSystem] = useState<NotationSystem>('niveaux');
    const [maxPoints, setMaxPoints] = useState('20');
    const [linkedToSession, setLinkedToSession] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
    const [selectedCompetenceIds, setSelectedCompetenceIds] = useState<string[]>([]);
    const [isHomework, setIsHomework] = useState(false);

    const [availableCompetences, setAvailableCompetences] = useState<Competence[]>([]);
    const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
    const [showCompetenceSelector, setShowCompetenceSelector] = useState(false);
    const [showSessionSelector, setShowSessionSelector] = useState(false);

    useEffect(() => {
        if (visible) {
            loadData();
            if (evaluation) {
                // Edit mode
                setTitre(evaluation.titre);
                setDescription(evaluation.description || '');
                setDate(new Date(evaluation.date));
                setType(evaluation.type);
                setNotationSystem(evaluation.notationSystem);
                setMaxPoints(evaluation.maxPoints?.toString() || '20');
                setLinkedToSession(!!evaluation.sessionId);
                setSelectedSessionId(evaluation.sessionId);
                setSelectedCompetenceIds(evaluation.competenceIds);
                setIsHomework(evaluation.isHomework);
            } else {
                // Create mode - reset form
                resetForm();
            }
        }
    }, [visible, evaluation]);

    const loadData = async () => {
        try {
            const [competences, sessions] = await Promise.all([
                competenceService.getAll(),
                sessionService.getByClass(classId),
            ]);
            setAvailableCompetences(competences);
            setAvailableSessions(sessions);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const resetForm = () => {
        setTitre('');
        setDescription('');
        setDate(new Date());
        setType('formative');
        setNotationSystem('niveaux');
        setMaxPoints('20');
        setLinkedToSession(false);
        setSelectedSessionId(undefined);
        setSelectedCompetenceIds([]);
        setIsHomework(false);
    };

    const toggleCompetence = (competenceId: string) => {
        setSelectedCompetenceIds(prev =>
            prev.includes(competenceId)
                ? prev.filter(id => id !== competenceId)
                : [...prev, competenceId]
        );
    };

    const handleSave = () => {
        // Validation
        if (!titre.trim()) {
            Alert.alert('Erreur', 'Le titre est requis');
            return;
        }
        if (selectedCompetenceIds.length === 0) {
            Alert.alert('Erreur', 'Sélectionnez au moins une compétence');
            return;
        }
        if (notationSystem === 'points') {
            const points = parseInt(maxPoints, 10);
            if (isNaN(points) || points <= 0) {
                Alert.alert('Erreur', 'Le score maximum doit être un nombre positif');
                return;
            }
        }

        const evaluationData: Omit<Evaluation, 'createdAt' | 'updatedAt'> = {
            id: evaluation?.id || `eval_${Date.now()}`,
            classId,
            sessionId: linkedToSession ? selectedSessionId : undefined,
            titre: titre.trim(),
            date: date.toISOString(),
            type,
            notationSystem,
            maxPoints: notationSystem === 'points' ? parseInt(maxPoints, 10) : undefined,
            competenceIds: selectedCompetenceIds,
            isHomework,
            description: description.trim() || undefined,
        };

        onSave(evaluationData);
        onDismiss();
    };

    const selectedCompetences = availableCompetences.filter(c =>
        selectedCompetenceIds.includes(c.id)
    );

    const selectedSession = availableSessions.find(s => s.id === selectedSessionId);

    return (
        <Portal>
            <Dialog
                visible={visible}
                onDismiss={onDismiss}
                style={{ maxHeight: '90%' }}
            >
                <Dialog.Title>
                    {evaluation ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
                </Dialog.Title>

                <Dialog.ScrollArea>
                    <ScrollView style={styles.scrollView}>
                        {/* Titre */}
                        <TextInput
                            label="Titre *"
                            value={titre}
                            onChangeText={setTitre}
                            mode="outlined"
                            style={styles.input}
                            placeholder="Ex: Contrôle Chapitre 3"
                        />

                        {/* Date */}
                        <Text style={[styles.label, { color: theme.text }]}>Date</Text>
                        <TextInput
                            label="Date"
                            value={date.toLocaleDateString('fr-FR')}
                            mode="outlined"
                            style={styles.input}
                            editable={false}
                            right={
                                <TextInput.Icon
                                    icon="calendar"
                                    onPress={() => {
                                        // Simple date input - could be enhanced with a proper date picker library
                                        Alert.prompt(
                                            'Date',
                                            'Format: JJ/MM/AAAA',
                                            (text) => {
                                                const parts = text.split('/');
                                                if (parts.length === 3) {
                                                    const day = parseInt(parts[0], 10);
                                                    const month = parseInt(parts[1], 10) - 1;
                                                    const year = parseInt(parts[2], 10);
                                                    const newDate = new Date(year, month, day);
                                                    if (!isNaN(newDate.getTime())) {
                                                        setDate(newDate);
                                                    }
                                                }
                                            },
                                            'plain-text',
                                            date.toLocaleDateString('fr-FR')
                                        );
                                    }}
                                />
                            }
                        />

                        {/* Type */}
                        <Text style={[styles.label, { color: theme.text }]}>Type d'évaluation</Text>
                        <RadioButton.Group onValueChange={value => setType(value as EvaluationType)} value={type}>
                            {Object.entries(EVALUATION_TYPE_LABELS).map(([key, label]) => (
                                <TouchableOpacity
                                    key={key}
                                    onPress={() => setType(key as EvaluationType)}
                                    style={styles.radioItem}
                                >
                                    <RadioButton value={key} />
                                    <Text style={{ color: theme.text }}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </RadioButton.Group>

                        <Divider style={styles.divider} />

                        {/* Notation System */}
                        <Text style={[styles.label, { color: theme.text }]}>Système de notation</Text>
                        <RadioButton.Group
                            onValueChange={value => setNotationSystem(value as NotationSystem)}
                            value={notationSystem}
                        >
                            {Object.entries(NOTATION_SYSTEM_LABELS).map(([key, label]) => (
                                <TouchableOpacity
                                    key={key}
                                    onPress={() => setNotationSystem(key as NotationSystem)}
                                    style={styles.radioItem}
                                >
                                    <RadioButton value={key} />
                                    <Text style={{ color: theme.text }}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </RadioButton.Group>

                        {/* Max Points (if points system) */}
                        {notationSystem === 'points' && (
                            <TextInput
                                label="Score maximum"
                                value={maxPoints}
                                onChangeText={setMaxPoints}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                placeholder="20"
                            />
                        )}

                        <Divider style={styles.divider} />

                        {/* Link to Session */}
                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.switchLabel, { color: theme.text }]}>
                                    Lier à une séance
                                </Text>
                                {linkedToSession && (
                                    <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                                        Associer cette évaluation à une séance
                                    </Text>
                                )}
                            </View>
                            <Switch
                                value={linkedToSession}
                                onValueChange={setLinkedToSession}
                            />
                        </View>

                        {linkedToSession && (
                            <>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowSessionSelector(!showSessionSelector)}
                                    style={styles.input}
                                    icon="calendar-text"
                                >
                                    {selectedSession
                                        ? `${selectedSession.subject} - ${new Date(selectedSession.date).toLocaleDateString()}`
                                        : 'Sélectionner une séance'}
                                </Button>

                                {showSessionSelector && (
                                    <ScrollView
                                        style={[styles.selectorContainer, { backgroundColor: theme.surface }]}
                                        nestedScrollEnabled
                                    >
                                        {availableSessions.length === 0 ? (
                                            <Text style={{ color: theme.textSecondary, padding: 16 }}>
                                                Aucune séance disponible
                                            </Text>
                                        ) : (
                                            availableSessions.map(session => (
                                                <TouchableOpacity
                                                    key={session.id}
                                                    onPress={() => {
                                                        setSelectedSessionId(session.id);
                                                        setShowSessionSelector(false);
                                                    }}
                                                    style={[
                                                        styles.selectorItem,
                                                        selectedSessionId === session.id && styles.selectedItem,
                                                    ]}
                                                >
                                                    <Text style={{ color: theme.text, fontWeight: '500' }}>
                                                        {session.subject}
                                                    </Text>
                                                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                                        {new Date(session.date).toLocaleDateString('fr-FR')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                )}
                            </>
                        )}

                        <Divider style={styles.divider} />

                        {/* Devoir maison / en classe */}
                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.switchLabel, { color: theme.text }]}>
                                    Devoir maison
                                </Text>
                                <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                                    {isHomework ? 'À faire à la maison' : 'Évaluation en classe'}
                                </Text>
                            </View>
                            <Switch
                                value={isHomework}
                                onValueChange={setIsHomework}
                            />
                        </View>

                        <Divider style={styles.divider} />

                        {/* Competences Selection */}
                        <Text style={[styles.label, { color: theme.text }]}>
                            Compétences évaluées * ({selectedCompetenceIds.length})
                        </Text>
                        <Button
                            mode="outlined"
                            onPress={() => setShowCompetenceSelector(!showCompetenceSelector)}
                            style={styles.input}
                            icon="star-box-multiple"
                        >
                            Sélectionner les compétences
                        </Button>

                        {showCompetenceSelector && (
                            <ScrollView
                                style={[styles.selectorContainer, { backgroundColor: theme.surface }]}
                                nestedScrollEnabled
                            >
                                {availableCompetences.length === 0 ? (
                                    <Text style={{ color: theme.textSecondary, padding: 16 }}>
                                        Aucune compétence disponible. Allez dans Paramètres → Compétences pour en créer.
                                    </Text>
                                ) : (
                                    availableCompetences.map(competence => (
                                        <TouchableOpacity
                                            key={competence.id}
                                            onPress={() => toggleCompetence(competence.id)}
                                            style={styles.competenceItem}
                                        >
                                            <View style={[styles.colorIndicator, { backgroundColor: competence.couleur }]} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: theme.text, fontWeight: '500' }}>
                                                    {competence.nom}
                                                </Text>
                                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                                    {competence.domaine}
                                                </Text>
                                            </View>
                                            <MaterialCommunityIcons
                                                name={selectedCompetenceIds.includes(competence.id) ? 'check-circle' : 'circle-outline'}
                                                size={24}
                                                color={selectedCompetenceIds.includes(competence.id) ? theme.primary : theme.textSecondary}
                                            />
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        )}

                        {/* Selected Competences */}
                        {selectedCompetences.length > 0 && (
                            <View style={styles.selectedCompetences}>
                                {selectedCompetences.map(competence => (
                                    <Chip
                                        key={competence.id}
                                        onClose={() => toggleCompetence(competence.id)}
                                        style={[styles.competenceChip, { backgroundColor: competence.couleur + '20' }]}
                                        textStyle={{ color: competence.couleur }}
                                    >
                                        {competence.nom}
                                    </Chip>
                                ))}
                            </View>
                        )}

                        {/* Description */}
                        <TextInput
                            label="Description (optionnel)"
                            value={description}
                            onChangeText={setDescription}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                        />
                    </ScrollView>
                </Dialog.ScrollArea>

                <Dialog.Actions>
                    <Button onPress={onDismiss}>Annuler</Button>
                    <Button onPress={handleSave}>
                        {evaluation ? 'Modifier' : 'Créer'}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        paddingHorizontal: 24,
    },
    input: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 8,
    },
    dateButton: {
        marginBottom: 16,
    },
    dateValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
    },
    dateText: {
        fontSize: 16,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    divider: {
        marginVertical: 16,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    checkboxContainer: {
        marginBottom: 12,
    },
    checkboxRow: {
        marginBottom: 12,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkboxLabel: {
        fontSize: 16,
    },
    helperText: {
        fontSize: 13,
        marginTop: 4,
    },
    selectorContainer: {
        maxHeight: 250,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectorItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedItem: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
    },
    competenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    colorIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
    },
    selectedCompetences: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    competenceChip: {
        marginRight: 4,
        marginBottom: 4,
    },
});
