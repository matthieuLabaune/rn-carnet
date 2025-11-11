export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
};

export const getRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  
  return formatDate(date);
};

export const getSchoolYear = (date: Date = new Date()): string => {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();
  
  // L'année scolaire commence en septembre (mois 8)
  if (month >= 8) {
    // De septembre à décembre -> année actuelle / année suivante
    return `${year}-${year + 1}`;
  } else {
    // De janvier à août -> année précédente / année actuelle
    return `${year - 1}-${year}`;
  }
};
