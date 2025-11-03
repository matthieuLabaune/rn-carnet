export interface Theme {
  mode: 'light' | 'dark' | 'auto';
  primaryColor?: string;
}

export interface AppSettings {
  theme: Theme;
  notifications: boolean;
  sound: boolean;
  vibration: boolean;
}
