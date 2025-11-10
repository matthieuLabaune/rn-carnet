import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { TextInput, Text, IconButton } from 'react-native-paper';
import { SPACING } from '../utils';
import { COLORS } from '../utils/constants';
import { SequenceFormData } from '../types';

interface SequenceFormDialogProps {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (data: SequenceFormData) => void;
    classId: string;
    initialData?: SequenceFormData & { id?: string };
}

const SEQUENCE_COLORS = [
    '#2196F3', // Bleu
    '#4CAF50', // Vert
    '#FFC107', // Jaune
    '#FF9800', // Orange
    '#F44336', // Rouge
    '#9C27B0', // Violet
    '#795548', // Marron
    '#607D8B', // Gris bleu
];

export default function SequenceFormDialog({
    visible,
    onDismiss,
    onSubmit,
    classId,
    initialData
}: SequenceFormDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [theme, setTheme] = useState('');
    const [sessionCount, setSessionCount] = useState(5);
    const [selectedColor, setSelectedColor] = useState(SEQUENCE_COLORS[0]);
    const [objectives, setObjectives] = useState<string[]>([]);
    const [currentObjective, setCurrentObjective] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || '');
            setTheme(initialData.theme || '');
            setSessionCount(initialData.sessionCount);
            setSelectedColor(initialData.color);
            setObjectives(initialData.objectives || []);
        } else {
            resetForm();
        }
    }, [initialData, visible]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setTheme('');
        setSessionCount(5);
        setSelectedColor(SEQUENCE_COLORS[0]);
        setObjectives([]);
        setCurrentObjective('');
        setError('');
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Le nom de la séquence est requis');
            return;
        }

        if (sessionCount < 1) {
            setError('Le nombre de séances doit être au moins 1');
            return;
        }

        const formData: SequenceFormData = {
            classId,
            name: name.trim(),
            description: description.trim() || undefined,
            color: selectedColor,
            sessionCount,
            theme: theme.trim() || undefined,
            objectives: objectives.length > 0 ? objectives : undefined
        };

        onSubmit(formData);
        resetForm();
    };

    const handleCancel = () => {
        resetForm();
        onDismiss();
    };

    const incrementSessionCount = () => {
        setSessionCount(prev => Math.min(prev + 1, 50));
    };

    const decrementSessionCount = () => {
        setSessionCount(prev => Math.max(prev - 1, 1));
    };

    const addObjective = () => {
        if (currentObjective.trim()) {
            setObjectives([...objectives, currentObjective.trim()]);
            setCurrentObjective('');
        }
    };

    const removeObjective = (index: number) => {
        setObjectives(objectives.filter((_, i) => i !== index));
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {initialData ? '✏️ Modifier la séquence' : '✏️ Nouvelle Séquence'}
                        </Text>
                        <TouchableOpacity onPress={handleCancel}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.form}>
                            {/* Nom */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Nom de la séquence *</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Ex: La Révolution française"
                                    mode="outlined"
                                    style={styles.input}
                                    error={!!error && !name.trim()}
                                />
                            </View>

                            {/* Description */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Description (optionnel)</Text>
                                <TextInput
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="De 1789 à 1799, étude des causes..."
                                    mode="outlined"
                                    multiline
                                    numberOfLines={3}
                                    style={styles.input}
                                />
                            </View>

                            {/* Thème */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Thème</Text>
                                <TextInput
                                    value={theme}
                                    onChangeText={setTheme}
                                    placeholder="Ex: Histoire moderne"
                                    mode="outlined"
                                    style={styles.input}
                                />
                            </View>

                            {/* Nombre de séances */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Nombre de séances prévues *</Text>
                                <View style={styles.sessionCountContainer}>
                                    <TextInput
                                        value={sessionCount.toString()}
                                        editable={false}
                                        mode="outlined"
                                        style={styles.sessionCountInput}
                                    />
                                    <View style={styles.stepperButtons}>
                                        <TouchableOpacity
                                            onPress={decrementSessionCount}
                                            style={styles.stepperButton}
                                        >
                                            <Text style={styles.stepperButtonText}>−</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={incrementSessionCount}
                                            style={styles.stepperButton}
                                        >
                                            <Text style={styles.stepperButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Couleur */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Couleur</Text>
                                <View style={styles.colorContainer}>
                                    {SEQUENCE_COLORS.map((color) => (
                                        <TouchableOpacity
                                            key={color}
                                            onPress={() => setSelectedColor(color)}
                                            style={[
                                                styles.colorOption,
                                                { backgroundColor: color },
                                                selectedColor === color && styles.colorSelected,
                                            ]}
                                        >
                                            {selectedColor === color && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Objectifs */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Objectifs pédagogiques (optionnel)</Text>
                                <View style={styles.objectiveInputContainer}>
                                    <TextInput
                                        value={currentObjective}
                                        onChangeText={setCurrentObjective}
                                        placeholder="Ajouter un objectif..."
                                        mode="outlined"
                                        style={styles.objectiveInput}
                                        onSubmitEditing={addObjective}
                                    />
                                    <IconButton
                                        icon="plus"
                                        size={24}
                                        onPress={addObjective}
                                        disabled={!currentObjective.trim()}
                                    />
                                </View>
                                {objectives.length > 0 && (
                                    <View style={styles.objectivesList}>
                                        {objectives.map((objective, index) => (
                                            <View key={index} style={styles.objectiveItem}>
                                                <Text style={styles.objectiveBullet}>•</Text>
                                                <Text style={styles.objectiveText}>{objective}</Text>
                                                <IconButton
                                                    icon="close"
                                                    size={16}
                                                    onPress={() => removeObjective(index)}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {error && (
                                <Text style={styles.errorText}>{error}</Text>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                            <Text style={styles.submitButtonText}>
                                {initialData ? 'Modifier' : 'Créer la séquence'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '90%',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
    closeButton: {
        fontSize: 24,
        color: '#666',
        padding: SPACING.sm,
    },
    scrollContent: {
        maxHeight: 500,
    },
    form: {
        padding: SPACING.md,
    },
    field: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
    },
    sessionCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    sessionCountInput: {
        flex: 1,
        backgroundColor: '#fff',
    },
    stepperButtons: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    stepperButton: {
        backgroundColor: '#2196F3',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '600',
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorSelected: {
        borderColor: '#000',
        borderWidth: 3,
    },
    checkmark: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    objectiveInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    objectiveInput: {
        flex: 1,
        backgroundColor: '#fff',
    },
    objectivesList: {
        marginTop: SPACING.sm,
        gap: SPACING.xs,
    },
    objectiveItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: SPACING.sm,
        borderRadius: 8,
        gap: SPACING.xs,
    },
    objectiveBullet: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    objectiveText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    errorText: {
        color: '#f44336',
        fontSize: 14,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        gap: SPACING.md,
    },
    cancelButton: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: 8,
        backgroundColor: '#2196F3',
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});
