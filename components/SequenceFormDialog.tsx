import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Portal, Modal, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SPACING } from '../utils';
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
    const [newObjective, setNewObjective] = useState('');
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
        setNewObjective('');
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
        if (newObjective.trim() && !objectives.includes(newObjective.trim())) {
            setObjectives([...objectives, newObjective.trim()]);
            setNewObjective('');
        }
    };

    const removeObjective = (objective: string) => {
        setObjectives(objectives.filter(obj => obj !== objective));
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={handleCancel}
                contentContainerStyle={styles.modal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {initialData ? 'Modifier la séquence' : 'Nouvelle séquence'}
                        </Text>
                        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Nom */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Nom de la séquence *</Text>
                            <TextInput
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (error) setError('');
                                }}
                                placeholder="Ex: La Révolution française"
                                style={[styles.input, error && !name.trim() && styles.inputError]}
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Description (optionnel)</Text>
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="De 1789 à 1799, étude des causes..."
                                style={[styles.input, styles.inputMultiline]}
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Thème */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Thème</Text>
                            <TextInput
                                value={theme}
                                onChangeText={setTheme}
                                placeholder="Ex: Histoire moderne"
                                style={styles.input}
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Nombre de séances */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Nombre de séances prévues *</Text>
                            <View style={styles.sessionCountContainer}>
                                <View style={styles.sessionCountDisplay}>
                                    <Text style={styles.sessionCountText}>{sessionCount}</Text>
                                </View>
                                <View style={styles.stepperButtons}>
                                    <TouchableOpacity
                                        onPress={decrementSessionCount}
                                        style={styles.stepperButton}
                                    >
                                        <MaterialCommunityIcons name="minus" size={20} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={incrementSessionCount}
                                        style={styles.stepperButton}
                                    >
                                        <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Couleur */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Couleur</Text>
                            <View style={styles.colorGrid}>
                                {SEQUENCE_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorButton,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.colorButtonActive,
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && (
                                            <View style={styles.colorCheck}>
                                                <Text style={styles.checkMark}>✓</Text>
                                            </View>
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
                                    value={newObjective}
                                    onChangeText={setNewObjective}
                                    placeholder="Ajouter un objectif..."
                                    style={styles.objectiveInput}
                                    placeholderTextColor="#999"
                                    onSubmitEditing={addObjective}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity
                                    onPress={addObjective}
                                    disabled={!newObjective.trim()}
                                    style={[
                                        styles.addButton,
                                        !newObjective.trim() && styles.addButtonDisabled
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name="plus"
                                        size={20}
                                        color={newObjective.trim() ? '#2196F3' : '#ccc'}
                                    />
                                </TouchableOpacity>
                            </View>
                            
                            {objectives.length > 0 && (
                                <View style={styles.objectivesList}>
                                    {objectives.map((objective, index) => (
                                        <Chip
                                            key={index}
                                            onClose={() => removeObjective(objective)}
                                            style={styles.objectiveChip}
                                            textStyle={styles.objectiveChipText}
                                        >
                                            {objective}
                                        </Chip>
                                    ))}
                                </View>
                            )}
                        </View>

                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                            <Text style={styles.submitButtonText}>
                                {initialData ? 'Modifier' : 'Créer'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        margin: 20,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    container: {
        maxHeight: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    closeButton: {
        padding: 4,
    },
    closeText: {
        fontSize: 24,
        color: '#666',
        fontWeight: '300',
    },
    content: {
        padding: SPACING.lg,
        maxHeight: 500,
    },
    field: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: SPACING.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#000',
    },
    inputError: {
        borderColor: '#f44336',
    },
    inputMultiline: {
        minHeight: 80,
        paddingTop: SPACING.md,
    },
    sessionCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    sessionCountDisplay: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        padding: SPACING.md,
        alignItems: 'center',
    },
    sessionCountText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    stepperButtons: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    stepperButton: {
        backgroundColor: '#000',
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    colorButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorButtonActive: {
        borderColor: '#000',
        borderWidth: 3,
    },
    colorCheck: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMark: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    objectiveInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    objectiveInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: 14,
        backgroundColor: '#fff',
        color: '#000',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    objectivesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
        marginTop: SPACING.sm,
    },
    objectiveChip: {
        backgroundColor: '#f0f0f0',
    },
    objectiveChipText: {
        fontSize: 12,
    },
    errorText: {
        color: '#f44336',
        fontSize: 14,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        padding: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: SPACING.md,
    },
    cancelButton: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e5e5',
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
        backgroundColor: '#000',
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});
