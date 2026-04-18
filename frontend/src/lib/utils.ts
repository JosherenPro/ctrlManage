import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'badge-success',
    PRESENT: 'badge-success',
    OPEN: 'badge-success',
    INVITED: 'badge-info',
    DRAFT: 'badge-info',
    LATE: 'badge-warning',
    SUSPENDED: 'badge-danger',
    ABSENT: 'badge-danger',
    CANCELLED: 'badge-danger',
    CLOSED: 'badge-neutral',
    JUSTIFIED: 'badge-info',
  };
  return map[status] || 'badge-info';
}

export function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'Admin',
    PROFESSOR: 'Professeur',
    STUDENT: 'Étudiant',
  };
  return map[role] || role;
}

export function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'Actif',
    INVITED: 'Invité',
    SUSPENDED: 'Suspendu',
    DRAFT: 'Brouillon',
    OPEN: 'Ouverte',
    CLOSED: 'Fermée',
    CANCELLED: 'Annulée',
    PRESENT: 'Présent',
    LATE: 'Retard',
    ABSENT: 'Absent',
    JUSTIFIED: 'Justifié',
  };
  return map[status] || status;
}
