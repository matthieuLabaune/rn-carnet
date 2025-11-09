import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Portal, Modal, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ScheduleSlot } from '../types/schedule';
import { COLORS } from '../utils/theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: {
    dayOfWeek: number;
    startTime: string;
    duration: number;
    subject: string;
    frequency: 'weekly' | 'biweekly';
    startWeek?: number;
  }) => void;
  initialData?: ScheduleSlot;
}

const DAYS_OF_WEEK = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 7 },
];

export default function ScheduleSlotFormDialog({ visible, onDismiss, onSubmit, initialData }: Props) {
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [subject, setSubject] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly'>('weekly');
  const [startWeek, setStartWeek] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDayOfWeek(initialData.dayOfWeek);
      setStartTime(initialData.startTime);
      setDuration(initialData.duration.toString());
      setSubject(initialData.subject);
      setFrequency(initialData.frequency);
      setStartWeek(initialData.startWeek || 0);
    } else {
      // Reset au ouverture en mode création
      setDayOfWeek(1);
      setStartTime('09:00');
      setDuration('60');
      setSubject('');
      setFrequency('weekly');
      setStartWeek(0);
    }
  }, [initialData, visible]);

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  };

  const getTimeAsDate = (): Date => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleSubmit = () => {
    if (!subject.trim()) return;
    
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) return;

    onSubmit({
      dayOfWeek,
      startTime,
      duration: durationNum,
      subject: subject.trim(),
      frequency,
      startWeek: frequency === 'biweekly' ? startWeek : undefined,
    });
    
    handleCancel();
  };

  const handleCancel = () => {
    setDayOfWeek(1);
    setStartTime('09:00');
    setDuration('60');
    setSubject('');
    setFrequency('weekly');
    setStartWeek(0);
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
            <Text style={styles.title}>
              {initialData ? 'Modifier le créneau' : 'Nouveau créneau'}
            </Text>

            <View style={styles.form}>
              {/* Jour de la semaine */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Jour de la semaine</Text>
                <View style={styles.daysGrid}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayButton,
                        dayOfWeek === day.value && styles.dayButtonActive,
                      ]}
                      onPress={() => setDayOfWeek(day.value)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          dayOfWeek === day.value && styles.dayButtonTextActive,
                        ]}
                      >
                        {day.label.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Heure de début */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Heure de début</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeButtonText}>{startTime}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={getTimeAsDate()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}
              </View>

              {/* Durée */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Durée (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="60"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>

              {/* Matière */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Matière / Sujet</Text>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Ex: Mathématiques"
                  placeholderTextColor="#999"
                  autoCapitalize="sentences"
                />
              </View>

              {/* Fréquence */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fréquence</Text>
                <View style={styles.frequencyButtons}>
                  <TouchableOpacity
                    style={[
                      styles.frequencyButton,
                      frequency === 'weekly' && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setFrequency('weekly')}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        frequency === 'weekly' && styles.frequencyButtonTextActive,
                      ]}
                    >
                      Hebdomadaire
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.frequencyButton,
                      frequency === 'biweekly' && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setFrequency('biweekly')}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        frequency === 'biweekly' && styles.frequencyButtonTextActive,
                      ]}
                    >
                      Bimensuelle
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Alternance (si bimensuel) */}
              {frequency === 'biweekly' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Semaine de départ</Text>
                  <View style={styles.frequencyButtons}>
                    <TouchableOpacity
                      style={[
                        styles.frequencyButton,
                        startWeek === 0 && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setStartWeek(0)}
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          startWeek === 0 && styles.frequencyButtonTextActive,
                        ]}
                      >
                        Semaines paires
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.frequencyButton,
                        startWeek === 1 && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setStartWeek(1)}
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          startWeek === 1 && styles.frequencyButtonTextActive,
                        ]}
                      >
                        Semaines impaires
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hint}>
                    Première occurrence à partir de la date de début de l'année scolaire
                  </Text>
                </View>
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
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={!subject.trim()}
              >
                <Text style={styles.submitText}>
                  {initialData ? 'Modifier' : 'Ajouter'}
                </Text>
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
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    maxHeight: '90%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f8f8f8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    minWidth: '13%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  dayButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  dayButtonTextActive: {
    color: 'white',
  },
  timeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  frequencyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  frequencyButtonTextActive: {
    color: 'white',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
