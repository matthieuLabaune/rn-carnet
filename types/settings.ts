export interface Theme {
    mode: 'light' | 'dark' | 'auto';
    primaryColor?: string;
}

export interface SchoolYearSettings {
    /** Zone scolaire pour les vacances (A, B ou C) */
    zone: 'A' | 'B' | 'C';
    /** Date de début de l'année scolaire (format ISO: YYYY-MM-DD) */
    schoolYearStart: string;
    /** Date de fin de l'année scolaire (format ISO: YYYY-MM-DD) */
    schoolYearEnd: string;
}

export interface AppSettings {
    theme: Theme;
    notifications: boolean;
    sound: boolean;
    vibration: boolean;
    /** Paramètres de l'année scolaire */
    schoolYear?: SchoolYearSettings;
}
