/**
 * Fonctions utilitaires pour le formatage des données
 */

import { AGE_GROUP_LABELS, CLASS_LABELS, STATUS_LABELS } from './constants';

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
  const lastNameClean = lastName.toLowerCase().replace(/\s+/g, '-');
  const firstNameClean = firstName.toLowerCase().replace(/\s+/g, '-');
  const fileExt = originalFile.name.split('.').pop();
  const docName = documentType.replace(/_/g, '-');
  return `${lastNameClean}_${firstNameClean}_${docName}.${fileExt}`;
};
