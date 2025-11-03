import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Portal, Dialog, SegmentedButtons } from 'react-native-paper';
import { COLORS, SPACING } from '../utils';

interface ClassFormDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: { name: string; level: string; subject: string; color: string }) => void;
}

const CLASS_LEVELS = [
  { value: '6ème', label: '6ème' },
  { value: '5ème', label: '5ème' },
  { value: '4ème', label: '4ème' },
  { value: '3ème', label: '3ème' },
  { value: '2nde', label: '2nde' },
  { value: '1ère', label: '1ère' },
  { value: 'Terminale', label: 'Term' },
];

export default function ClassFormDialog({ visible, onDismiss, onSubmit }: ClassFormDialogProps) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('6ème');
  const [subject, setSubject] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS.classColors[0]);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom de la classe est obligatoire';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      level,
      subject: subject.trim(),
      color: selectedColor,
    });

    // Reset form
    setName('');
    setLevel('6ème');
    setSubject('');
    setSelectedColor(COLORS.classColors[0]);
    setErrors({});
  };

  const handleCancel = () => {
    setName('');
    setLevel('6ème');
    setSubject('');
    setSelectedColor(COLORS.classColors[0]);
    setErrors({});
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title>Nouvelle classe</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.content}>
            <TextInput
              label="Nom de la classe *"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              mode="outlined"
              error={!!errors.name}
              style={styles.input}
              accessibilityLabel="Nom de la classe"
              placeholder="Ex: 6ème A"
            />
            {errors.name && (
              <View style={styles.errorContainer}>
                <TextInput.Icon icon="alert-circle" color={COLORS.error} />
                <TextInput.Affix text={errors.name} textStyle={styles.errorText} />
              </View>
            )}

            <SegmentedButtons
              value={level}
              onValueChange={setLevel}
              buttons={CLASS_LEVELS}
              style={styles.segmentedButtons}
            />

            <TextInput
              label="Matière"
              value={subject}
              onChangeText={setSubject}
              mode="outlined"
              style={styles.input}
              accessibilityLabel="Matière enseignée"
              placeholder="Ex: Mathématiques"
            />

            <View style={styles.colorSection}>
              <TextInput.Affix text="Couleur" textStyle={styles.colorLabel} />
              <View style={styles.colorGrid}>
                {COLORS.classColors.map((color) => (
                  <Button
                    key={color}
                    mode={selectedColor === color ? 'contained' : 'outlined'}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color, borderColor: color },
                    ]}
                    contentStyle={styles.colorButtonContent}
                    accessibilityLabel={`Couleur ${color}`}
                  >
                    {selectedColor === color && '✓'}
                  </Button>
                ))}
              </View>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={handleCancel}>Annuler</Button>
          <Button mode="contained" onPress={handleSubmit}>
            Créer
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  input: {
    marginBottom: SPACING.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
  },
  segmentedButtons: {
    marginBottom: SPACING.lg,
  },
  colorSection: {
    marginTop: SPACING.md,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
  },
  colorButtonContent: {
    width: 50,
    height: 50,
  },
});
