/**
 * Fonctions utilitaires pour le formatage des données
 */

import { AGE_GROUP_LABELS, CLASS_LABELS, STATUS_LABELS } from './constants';

/**
 * Normalise une chaîne Unicode et nettoie les espaces parasites
 */
export const normalizeText = (value: string): string =>
  value.normalize('NFC').replace(/\s+/g, ' ').trim();

/**
 * Normalise une valeur pour les comparaisons tolérantes aux accents et à la casse
 */
export const normalizeForComparison = (value: string): string =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Génère une version sûre pour les noms de fichiers et chemins de storage
 */
export const slugifyFilePart = (value: string): string => {
  const slug = normalizeForComparison(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'document';
};

/**
 * Formate une date au format français (ex: "12 janvier 2025")
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formate une date courte (ex: "12/01/2025")
 */
export const formatDateShort = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

/**
 * Retourne le label d'un groupe d'âge
 */
export const getAgeGroupLabel = (group: string): string => {
  return AGE_GROUP_LABELS[group] || group;
};

/**
 * Retourne le label d'une classe
 */
export const getClassLabel = (classLevel: string): string => {
  return CLASS_LABELS[classLevel] || classLevel;
};

/**
 * Retourne le label d'un statut
 */
export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status] || status;
};

/**
 * Valide un email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 * Accepte: 0612345678, 06 12 34 56 78, 06.12.34.56.78, 06-12-34-56-78, +33612345678
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Calcule le nombre de jours entre deux dates (inclus)
 */
export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Génère un nom de fichier formaté pour un document
 * Format: nom_prenom_type-document.ext
 */
export const formatFileName = (
  lastName: string,
  firstName: string,
  documentType: string,
  originalFile: File
): string => {
  const lastNameClean = slugifyFilePart(lastName);
  const firstNameClean = slugifyFilePart(firstName);
  const rawExt = originalFile.name.split('.').pop() || 'bin';
  const fileExt = slugifyFilePart(rawExt).replace(/-/g, '') || 'bin';
  const docName = slugifyFilePart(documentType.replace(/_/g, '-'));
  return `${lastNameClean}_${firstNameClean}_${docName}.${fileExt}`;
};

/**
 * Labels pour les types de séjour
 */
export const SEJOUR_TYPE_LABELS: Record<string, string> = {
  centre_aere: 'Centre Aéré',
  sejour: 'Séjour',
  animation: 'Animation',
};

/**
 * Retourne le titre du séjour préfixé par son type
 * Ex: "Centre Aéré - Été Pitchouns"
 */
export const formatSejourTitre = (sejour: { titre: string; type?: string }): string => {
  if (!sejour.type) return sejour.titre;
  const prefix = SEJOUR_TYPE_LABELS[sejour.type] || sejour.type;
  return `${prefix} - ${sejour.titre}`;
};

/**
 * Retourne le titre du séjour avec le lieu entre parenthèses
 * Ex: "Centre Aéré - S1 (Saint Henri)"
 */
export const formatSejourTitreAvecLieu = (sejour: { titre: string; type?: string; lieu?: string | null }): string => {
  const base = formatSejourTitre(sejour);
  if (sejour.lieu) return `${base} (${sejour.lieu})`;
  return base;
};
