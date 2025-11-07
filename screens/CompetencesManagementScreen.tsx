/**
 * CompetencesManagementScreen
 * Manage predefined and custom competences
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Dialog,
  Portal,
  Menu,
  Chip,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { competenceService } from '../services';
import { Competence, CompetenceDomaine } from '../types';
import { PREDEFINED_COMPETENCES, getAllPredefinedCompetences } from '../utils/predefinedCompetences';
import { useTheme } from '../contexts/ThemeContext';

const DOMAINES: CompetenceDomaine[] = [
  'Mathématiques',
  'Français',
  'Histoire-Géographie',
  'Sciences',
  'Langues',
  'Arts',
  'EPS',
  'Transversales',
  'Autre',
];

const COLORS = [
  '#2196F3', '#E91E63', '#FF9800', '#4CAF50', '#9C27B0',
  '#00BCD4', '#FF5722', '#607D8B', '#FFC107', '#3F51B5',
];

export default function CompetencesManagementScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [predefinedCompetences, setPredefinedCompetences] = useState<Competence[]>([]);
  const [customCompetences, setCustomCompetences] = useState<Competence[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingCompetence, setEditingCompetence] = useState<Competence | null>(null);
  const [formNom, setFormNom] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDomaine, setFormDomaine] = useState<CompetenceDomaine>('Autre');
  const [formCouleur, setFormCouleur] = useState(COLORS[0]);
  const [domaineMenuVisible, setDomaineMenuVisible] = useState(false);
  const [colorMenuVisible, setColorMenuVisible] = useState(false);

  const loadCompetences = useCallback(async () => {
    try {
      const [predefined, custom] = await Promise.all([
        competenceService.getPredefined(),
        competenceService.getCustom(),
      ]);
      setPredefinedCompetences(predefined);
      setCustomCompetences(custom);
    } catch (error) {
      console.error('Failed to load competences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompetences();
  }, [loadCompetences]);

  const handleInitializePredefined = async () => {
    try {
      const allPredefined = getAllPredefinedCompetences();
      const competences: Omit<Competence, 'createdAt' | 'updatedAt'>[] = allPredefined.map((comp, index) => ({
        id: `comp_predefined_${index}`,
        nom: comp.nom,
        description: comp.description,
        domaine: comp.domaine,
        couleur: comp.couleur,
        isPredefined: true,
      }));
      
      await competenceService.bulkInsert(competences);
      await loadCompetences();
      Alert.alert('Succès', 'Bibliothèque de compétences initialisée');
    } catch (error) {
      console.error('Failed to initialize predefined competences:', error);
      Alert.alert('Erreur', 'Impossible d\'initialiser la bibliothèque');
    }
  };

  const openCreateDialog = () => {
    setEditingCompetence(null);
    setFormNom('');
    setFormDescription('');
    setFormDomaine('Autre');
    setFormCouleur(COLORS[0]);
    setDialogVisible(true);
  };

  const openEditDialog = (competence: Competence) => {
    setEditingCompetence(competence);
    setFormNom(competence.nom);
    setFormDescription(competence.description || '');
    setFormDomaine(competence.domaine as CompetenceDomaine);
    setFormCouleur(competence.couleur);
    setDialogVisible(true);
  };

  const handleSave = async () => {
    if (!formNom.trim()) {
      Alert.alert('Erreur', 'Le nom de la compétence est requis');
      return;
    }

    try {
      if (editingCompetence) {
        // Update existing
        await competenceService.update(editingCompetence.id, {
          nom: formNom.trim(),
          description: formDescription.trim() || undefined,
          domaine: formDomaine,
          couleur: formCouleur,
        });
      } else {
        // Create new
        const newCompetence: Omit<Competence, 'createdAt' | 'updatedAt'> = {
          id: `comp_custom_${Date.now()}`,
          nom: formNom.trim(),
          description: formDescription.trim() || undefined,
          domaine: formDomaine,
          couleur: formCouleur,
          isPredefined: false,
        };
        await competenceService.create(newCompetence);
      }
      
      setDialogVisible(false);
      await loadCompetences();
    } catch (error) {
      console.error('Failed to save competence:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la compétence');
    }
  };

  const handleDelete = (competence: Competence) => {
    Alert.alert(
      'Supprimer la compétence',
      `Êtes-vous sûr de vouloir supprimer "${competence.nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await competenceService.delete(competence.id);
              await loadCompetences();
            } catch (error) {
              console.error('Failed to delete competence:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la compétence');
            }
          },
        },
      ]
    );
  };

  const renderCompetenceItem = (competence: Competence, isCustom: boolean) => (
    <View key={competence.id} style={[styles.competenceItem, { backgroundColor: theme.surface }]}>
      <View style={[styles.colorIndicator, { backgroundColor: competence.couleur }]} />
      <View style={styles.competenceContent}>
        <Text style={[styles.competenceName, { color: theme.text }]}>
          {competence.nom}
        </Text>
        {competence.description && (
          <Text style={[styles.competenceDescription, { color: theme.textSecondary }]}>
            {competence.description}
          </Text>
        )}
        <Chip
          mode="outlined"
          compact
          style={styles.domaineChip}
          textStyle={styles.domaineChipText}
        >
          {competence.domaine}
        </Chip>
      </View>
      {isCustom && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => openEditDialog(competence)}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons name="pencil" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(competence)}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderDomaineSection = (domaine: CompetenceDomaine, competences: Competence[], isCustom: boolean) => {
    const filtered = competences.filter(c => c.domaine === domaine);
    if (filtered.length === 0) return null;

    return (
      <View key={domaine} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {domaine} ({filtered.length})
        </Text>
        {filtered.map(comp => renderCompetenceItem(comp, isCustom))}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Compétences</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openCreateDialog}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Initialize predefined competences */}
        {predefinedCompetences.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="star-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Bibliothèque vide
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              Initialisez la bibliothèque de compétences prédéfinies
            </Text>
            <Button
              mode="contained"
              onPress={handleInitializePredefined}
              style={styles.initButton}
            >
              Initialiser la bibliothèque
            </Button>
          </View>
        )}

        {/* Predefined competences */}
        {predefinedCompetences.length > 0 && (
          <>
            <Text style={[styles.categoryTitle, { color: theme.text }]}>
              📚 Bibliothèque prédéfinie
            </Text>
            {DOMAINES.map(domaine => renderDomaineSection(domaine, predefinedCompetences, false))}
          </>
        )}

        <Divider style={styles.divider} />

        {/* Custom competences */}
        <Text style={[styles.categoryTitle, { color: theme.text }]}>
          ✏️ Compétences personnalisées
        </Text>
        {customCompetences.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="pencil-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              Aucune compétence personnalisée
            </Text>
            <Button
              mode="outlined"
              onPress={openCreateDialog}
              style={styles.initButton}
            >
              Créer une compétence
            </Button>
          </View>
        ) : (
          DOMAINES.map(domaine => renderDomaineSection(domaine, customCompetences, true))
        )}
      </ScrollView>

      {/* Form Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingCompetence ? 'Modifier' : 'Créer'} une compétence
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nom de la compétence *"
              value={formNom}
              onChangeText={setFormNom}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={formDescription}
              onChangeText={setFormDescription}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
            
            {/* Domaine selector */}
            <Menu
              visible={domaineMenuVisible}
              onDismiss={() => setDomaineMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setDomaineMenuVisible(true)}
                  style={styles.input}
                  contentStyle={styles.menuButton}
                >
                  {formDomaine}
                </Button>
              }
            >
              {DOMAINES.map(domaine => (
                <Menu.Item
                  key={domaine}
                  onPress={() => {
                    setFormDomaine(domaine);
                    setDomaineMenuVisible(false);
                  }}
                  title={domaine}
                />
              ))}
            </Menu>

            {/* Color selector */}
            <Text style={styles.colorLabel}>Couleur</Text>
            <View style={styles.colorGrid}>
              {COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setFormCouleur(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    formCouleur === color && styles.colorOptionSelected,
                  ]}
                >
                  {formCouleur === color && (
                    <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Annuler</Button>
            <Button onPress={handleSave}>
              {editingCompetence ? 'Modifier' : 'Créer'}
            </Button>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  competenceItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  colorIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  competenceContent: {
    flex: 1,
  },
  competenceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  competenceDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  domaineChip: {
    alignSelf: 'flex-start',
  },
  domaineChipText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  initButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 24,
  },
  input: {
    marginBottom: 16,
  },
  menuButton: {
    justifyContent: 'flex-start',
  },
  colorLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 3,
  },
});
