import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import SequencesIndexScreen from './SequencesIndexScreen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SequencesTabScreen() {
    const navigation = useNavigation<NavigationProp>();

    // Afficher directement SequencesIndexScreen au lieu de naviguer
    return <SequencesIndexScreen navigation={navigation as any} route={{} as any} />;
}
