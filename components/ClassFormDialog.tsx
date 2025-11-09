import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { SPACING } from '../utils';
import { COLORS } from '../utils/constants';

interface ClassFormDialogProps {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (data: { name: string; level: string; subject: string; color: string }) => void;
}

const LEVELS = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];

export default function ClassFormDialog({ visible, onDismiss, onSubmit }: ClassFormDialogProps) {
    const [name, setName] = useState('');
    const [level, setLevel] = useState('6ème');
    const [subject, setSubject] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS.classColors[0]);
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Le nom est requis');
            return;
        }

        onSubmit({
            name: name.trim(),
            level,
            subject: subject.trim(),
            color: selectedColor,
        });

        setName('');
        setLevel('6ème');
        setSubject('');
        setSelectedColor(COLORS.classColors[0]);
        setError('');
    };

    const handleCancel = () => {
        setName('');
        setLevel('6ème');
        setSubject('');
        setSelectedColor(COLORS.classColors[0]);
        setError('');
        onDismiss();
    };

    return (
        <Modal
            visible={visible}
            onRequestClose={handleCancel}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Nouvelle classe</Text>
                        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Name Input */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Nom de la classe</Text>
                            <TextInput
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (error) setError('');
                                }}
                                placeholder="Ex: 6ème A"
                                style={styles.input}
                                mode="outlined"
                                outlineColor="#e5e5e5"
                                activeOutlineColor="#000"
                                error={!!error}
                            />
                            {error && <Text style={styles.errorText}>{error}</Text>}
                        </View>

                        {/* Level Selector */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Niveau</Text>
                            <View style={styles.levelGrid}>
                                {LEVELS.map((l) => (
                                    <TouchableOpacity
                                        key={l}
                                        style={[
                                            styles.levelButton,
                                            level === l && styles.levelButtonActive,
                                        ]}
                                        onPress={() => setLevel(l)}
                                    >
                                        <Text style={[
                                            styles.levelText,
                                            level === l && styles.levelTextActive,
                                        ]}>
                                            {l}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Subject Input */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Matière (optionnel)</Text>
                            <TextInput
                                value={subject}
                                onChangeText={setSubject}
                                placeholder="Ex: Mathématiques"
                                style={styles.input}
                                mode="outlined"
                                outlineColor="#e5e5e5"
                                activeOutlineColor="#000"
                            />
                        </View>

                        {/* Color Selector */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Couleur</Text>
                            <View style={styles.colorGrid}>
                                {COLORS.classColors.map((color) => (
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
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Créer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 24,
        color: '#666',
    },
    content: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    field: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
    levelGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    levelButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    levelButtonActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    levelText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    levelTextActive: {
        color: '#fff',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorButtonActive: {
        borderWidth: 3,
        borderColor: '#000',
    },
    colorCheck: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMark: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#000',
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
