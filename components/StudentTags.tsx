import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Handicap, Laterality, HANDICAP_LABELS, LATERALITY_LABELS } from '../types/student';

interface StudentTagsProps {
    handicaps?: Handicap[];
    laterality?: Laterality;
    customTags?: string[];
    compact?: boolean; // Mode compact pour les listes
    maxTags?: number; // Nombre max de tags à afficher
}

export default function StudentTags({
    handicaps = [],
    laterality,
    customTags = [],
    compact = false,
    maxTags
}: StudentTagsProps) {
    const allTags: Array<{ type: 'handicap' | 'laterality' | 'custom'; value: string; label: string }> = [];

    // Ajouter handicaps
    handicaps.forEach(h => {
        allTags.push({ type: 'handicap', value: h, label: HANDICAP_LABELS[h] });
    });

    // Ajouter latéralité
    if (laterality) {
        allTags.push({ type: 'laterality', value: laterality, label: LATERALITY_LABELS[laterality] });
    }

    // Ajouter tags custom
    customTags.forEach(tag => {
        allTags.push({ type: 'custom', value: tag, label: tag });
    });

    // Limiter le nombre de tags si nécessaire
    const displayTags = maxTags ? allTags.slice(0, maxTags) : allTags;
    const remainingCount = maxTags && allTags.length > maxTags ? allTags.length - maxTags : 0;

    if (displayTags.length === 0) {
        return null;
    }

    const getTagStyle = (type: 'handicap' | 'laterality' | 'custom') => {
        switch (type) {
            case 'handicap':
                return { backgroundColor: '#FFF3E0', textColor: '#E65100' };
            case 'laterality':
                return { backgroundColor: '#E3F2FD', textColor: '#1565C0' };
            case 'custom':
                return { backgroundColor: '#F3E5F5', textColor: '#6A1B9A' };
        }
    };

    const getIcon = (type: 'handicap' | 'laterality' | 'custom') => {
        switch (type) {
            case 'handicap':
                return 'medical-bag';
            case 'laterality':
                return 'human';
            case 'custom':
                return 'tag';
        }
    };

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            {displayTags.map((tag, index) => {
                const style = getTagStyle(tag.type);
                return (
                    <Chip
                        key={`${tag.type}-${tag.value}-${index}`}
                        mode="flat"
                        compact={compact}
                        style={[
                            styles.chip,
                            { backgroundColor: style.backgroundColor },
                            compact && styles.chipCompact
                        ]}
                        textStyle={[
                            styles.chipText,
                            { color: style.textColor },
                            compact && styles.chipTextCompact
                        ]}
                        icon={() => (
                            <MaterialCommunityIcons
                                name={getIcon(tag.type)}
                                size={compact ? 12 : 14}
                                color={style.textColor}
                            />
                        )}
                    >
                        {tag.label}
                    </Chip>
                );
            })}
            {remainingCount > 0 && (
                <Chip
                    mode="flat"
                    compact={compact}
                    style={[styles.chip, styles.moreChip, compact && styles.chipCompact]}
                    textStyle={[styles.chipText, styles.moreText, compact && styles.chipTextCompact]}
                >
                    +{remainingCount}
                </Chip>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    containerCompact: {
        gap: 4,
    },
    chip: {
        marginRight: 0,
        marginBottom: 0,
        height: 28,
    },
    chipCompact: {
        height: 24,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    chipTextCompact: {
        fontSize: 11,
    },
    moreChip: {
        backgroundColor: '#F5F5F5',
    },
    moreText: {
        color: '#666',
    },
});
