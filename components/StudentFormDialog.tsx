import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Portal, Modal, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Student, Handicap, Laterality, HANDICAP_LABELS, LATERALITY_LABELS } from '../types';

interface Props {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (data: {
        firstName: string;
        lastName: string;
        notes?: string;
        handicaps?: Handicap[];
        laterality?: Laterality;
        customTags?: string[];
    }) => void;
    student?: Student;
}

export default function StudentFormDialog({ visible, onDismiss, onSubmit, student }: Props) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedHandicaps, setSelectedHandicaps] = useState<Handicap[]>([]);
    const [laterality, setLaterality] = useState<Laterality | undefined>(undefined);
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (student) {
            setFirstName(student.firstName);
            setLastName(student.lastName);
            setNotes(student.notes || '');
            setSelectedHandicaps(student.handicaps || []);
            setLaterality(student.laterality);
            setCustomTags(student.customTags || []);
            setShowAdvanced(
                !!(student.handicaps?.length || student.laterality || student.customTags?.length)
            );
        } else {
            resetForm();
        }
    }, [student, visible]);

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setNotes('');
        setSelectedHandicaps([]);
        setLaterality(undefined);
        setCustomTags([]);
        setNewTag('');
        setShowAdvanced(false);
    };

    const toggleHandicap = (handicap: Handicap) => {
        setSelectedHandicaps(prev =>
            prev.includes(handicap)
                ? prev.filter(h => h !== handicap)
                : [...prev, handicap]
        );
    };

    const addCustomTag = () => {
        if (newTag.trim() && !customTags.includes(newTag.trim())) {
            setCustomTags([...customTags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeCustomTag = (tag: string) => {
        setCustomTags(customTags.filter(t => t !== tag));
    };

    const handleSubmit = () => {
        if (!firstName.trim() || !lastName.trim()) return;

        onSubmit({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            notes: notes.trim() || undefined,
            handicaps: selectedHandicaps.length > 0 ? selectedHandicaps : undefined,
            laterality: laterality,
            customTags: customTags.length > 0 ? customTags : undefined,
        });

        resetForm();
    };

    const handleCancel = () => {
        resetForm();
        onDismiss();
    };

    const handicapsList: Handicap[] = [
        'dyslexia', 'dysorthography', 'dyscalculia', 'dyspraxia', 'dysphasia',
        'adhd', 'asd', 'visual_impairment', 'hearing_impairment', 'motor_disability', 'other'
    ];

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={handleCancel}
                contentContainerStyle={styles.modal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.title}>{student ? 'Modifier l\'élève' : 'Nouvel élève'}</Text>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Prénom *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Prénom de l'élève"
                                    placeholderTextColor="#999"
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nom *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Nom de l'élève"
                                    placeholderTextColor="#999"
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Notes</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Notes personnelles..."
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Advanced Section Toggle */}
                            <TouchableOpacity
                                style={styles.advancedToggle}
                                onPress={() => setShowAdvanced(!showAdvanced)}
                            >
                                <MaterialCommunityIcons
                                    name={showAdvanced ? 'chevron-down' : 'chevron-right'}
                                    size={20}
                                    color="#666"
                                />
                                <Text style={styles.advancedToggleText}>Options avancées</Text>
                            </TouchableOpacity>

                            {showAdvanced && (
                                <>
                                    {/* Laterality */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Latéralité</Text>
                                        <View style={styles.lateralityContainer}>
                                            {(['left', 'right', 'ambidextrous'] as Laterality[]).map((lat) => (
                                                <TouchableOpacity
                                                    key={lat}
                                                    style={[
                                                        styles.lateralityButton,
                                                        laterality === lat && styles.lateralityButtonActive
                                                    ]}
                                                    onPress={() => setLaterality(laterality === lat ? undefined : lat)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.lateralityButtonText,
                                                            laterality === lat && styles.lateralityButtonTextActive
                                                        ]}
                                                    >
                                                        {LATERALITY_LABELS[lat]}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Handicaps */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Besoins éducatifs particuliers</Text>
                                        <View style={styles.chipsContainer}>
                                            {handicapsList.map((handicap) => (
                                                <Chip
                                                    key={handicap}
                                                    selected={selectedHandicaps.includes(handicap)}
                                                    onPress={() => toggleHandicap(handicap)}
                                                    style={styles.chip}
                                                    selectedColor="#000"
                                                >
                                                    {HANDICAP_LABELS[handicap]}
                                                </Chip>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Custom Tags */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Tags personnalisés</Text>
                                        <View style={styles.tagInputContainer}>
                                            <TextInput
                                                style={[styles.input, styles.tagInput]}
                                                value={newTag}
                                                onChangeText={setNewTag}
                                                placeholder="Ajouter un tag..."
                                                placeholderTextColor="#999"
                                                onSubmitEditing={addCustomTag}
                                            />
                                            <TouchableOpacity
                                                style={styles.addTagButton}
                                                onPress={addCustomTag}
                                            >
                                                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                        {customTags.length > 0 && (
                                            <View style={styles.customTagsContainer}>
                                                {customTags.map((tag) => (
                                                    <Chip
                                                        key={tag}
                                                        onClose={() => removeCustomTag(tag)}
                                                        style={styles.customTag}
                                                    >
                                                        {tag}
                                                    </Chip>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </>
                            )}
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={handleCancel}
                            >
                                <Text style={styles.cancelText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.submitButton,
                                    (!firstName.trim() || !lastName.trim()) && styles.buttonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={!firstName.trim() || !lastName.trim()}
                            >
                                <Text style={styles.submitText}>{student ? 'Enregistrer' : 'Ajouter'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modal: {
        backgroundColor: '#ffffff',
        margin: 20,
        borderRadius: 16,
        padding: 24,
        maxHeight: '80%',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        marginBottom: 24,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#fafafa',
    },
    textArea: {
        minHeight: 80,
        paddingTop: 12,
    },
    advancedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 8,
    },
    advancedToggleText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
        marginLeft: 8,
    },
    lateralityContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    lateralityButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#fafafa',
        alignItems: 'center',
    },
    lateralityButtonActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    lateralityButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    lateralityButtonTextActive: {
        color: '#fff',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        marginRight: 0,
        marginBottom: 0,
    },
    tagInputContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    tagInput: {
        flex: 1,
    },
    addTagButton: {
        backgroundColor: '#000',
        width: 44,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    customTag: {
        marginRight: 0,
        marginBottom: 0,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        backgroundColor: '#000',
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.4,
    },
});
