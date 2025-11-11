export interface Establishment {
    id: string;
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    uai?: string; // Code UAI (Unité Administrative Immatriculée) unique pour chaque établissement en France
    type?: 'ecole' | 'college' | 'lycee' | 'lycee_professionnel' | 'autre';
    createdAt: string;
    updatedAt: string;
}

// Type pour les suggestions de l'API
export interface EstablishmentSuggestion {
    nom_etablissement: string;
    adresse_1?: string;
    code_postal?: string;
    nom_commune?: string;
    telephone?: string;
    mail?: string;
    code_etablissement?: string; // UAI
    type_etablissement?: string;
    libelle_nature?: string;
}
