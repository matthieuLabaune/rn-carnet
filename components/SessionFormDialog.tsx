import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Portal, Modal, Text } from 'react-native-paper';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: { subject: string; description?: string; date: string; duration: number }) => void;
}

export default function SessionFormDialog({ visible, onDismiss, onSubmit }: Props) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('50');

  const handleSubmit = () => {
    if (!subject.trim()) return;
    
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) return;

    onSubmit({
      subject: subject.trim(),
      description: description.trim() || undefined,
      date: new Date().toISOString(),
      duration: durationNum,
    });
    
    setSubject('');
    setDescription('');
    setDuration('50');
  };

  const handleCancel = () => {
    setSubject('');
    setDescription('');
    setDuration('50');
    onDismiss();
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
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Nouvelle séance</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sujet</Text>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Ex: Les fractions"
                  placeholderTextColor="#999"
                  autoCapitalize="sentences"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (optionnel)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Objectifs, activités prévues..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Durée (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="50"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>
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
                  !subject.trim() && styles.buttonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!subject.trim()}
              >
                <Text style={styles.submitText}>Créer</Text>
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
