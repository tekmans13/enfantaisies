/**
 * Utilitaires pour l'export des données en Excel
 * Permet d'exporter les inscriptions et séjours au format XLSX
 */

import * as XLSX from 'xlsx';
import { formatSejourTitre } from './formatters';

/**
 * Exporte toutes les inscriptions vers un fichier Excel
 * @param inscriptions - Liste des inscriptions à exporter
 * @param sejours - Liste des séjours pour récupérer les titres
 */
export const exportInscriptionsToExcel = (inscriptions: any[], sejours: any[]) => {
  const getSejourTitle = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    return sejour ? formatSejourTitre(sejour) : '';
  };

  const data = inscriptions.map(inscription => ({
    'Référence': inscription.id.slice(0, 8),
    'Statut': inscription.status,
    'Prénom enfant': inscription.child_first_name,
    'Nom enfant': inscription.child_last_name,
    'Date de naissance': inscription.child_birth_date,
    'Classe': inscription.child_class?.toUpperCase(),
    'Sexe': inscription.child_gender === 'garcon' ? 'Garçon' : 'Fille',
    'École': inscription.child_school,
    'Groupe d\'âge': inscription.child_age_group,
    'Nombre de semaines': inscription.nombre_semaines_demandees,
    'Séjour 1': getSejourTitle(inscription.sejour_preference_1),
    'Séjour 2': getSejourTitle(inscription.sejour_preference_2),
    'Alternatif 1': getSejourTitle(inscription.sejour_preference_1_alternatif),
    'Alternatif 2': getSejourTitle(inscription.sejour_preference_2_alternatif),
    'Parent 1 - Prénom': inscription.parent_first_name,
    'Parent 1 - Nom': inscription.parent_last_name,
    'Parent 1 - Email': inscription.parent_email,
    'Parent 1 - Mobile': inscription.parent_mobile,
    'Parent 1 - Tél bureau': inscription.parent_office_phone || '',
    'Parent 1 - Autorité': inscription.parent_authority,
    'Parent 2 - Prénom': inscription.parent2_first_name || '',
    'Parent 2 - Nom': inscription.parent2_last_name || '',
    'Parent 2 - Email': inscription.parent2_email || '',
    'Parent 2 - Mobile': inscription.parent2_mobile || '',
    'Parent 2 - Tél bureau': inscription.parent2_office_phone || '',
    'Parent 2 - Autorité': inscription.parent2_authority || '',
    'Adresse': inscription.parent_address,
    'QF': inscription.quotient_familial || '',
    'N° CAF': inscription.caf_number || '',
    'Régime SS': inscription.social_security_regime,
    'Médicaments': inscription.has_medication ? 'Oui' : 'Non',
    'Médicaments (détails)': inscription.medication_details || '',
    'Allergies': inscription.has_allergies ? 'Oui' : 'Non',
    'Allergies (détails)': inscription.allergies_details || '',
    'Allergies alimentaires (détails)': inscription.food_allergies_details || '',
    'Première inscription': inscription.is_first_inscription ? 'Oui' : 'Non',
    'Prioritaire': inscription.is_prioritaire ? 'Oui' : 'Non',
    'Adhésion': inscription.has_adhesion ? 'Oui' : 'Non',
    'Demande spécifique': inscription.demande_specifique || '',
    'Date création': new Date(inscription.created_at).toLocaleDateString('fr-FR'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscriptions');
  
  const fileName = `inscriptions_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exporte les inscriptions d'un séjour spécifique vers un fichier Excel
 * @param sejour - Séjour concerné
 * @param inscriptions - Inscriptions pour ce séjour
 */
export const exportSejourInscriptionsToExcel = (sejour: any, inscriptions: any[]) => {
  const data = inscriptions.map(inscription => ({
    'Statut': inscription.status,
    'Prénom': inscription.child_first_name,
    'Nom': inscription.child_last_name,
    'Date de naissance': inscription.child_birth_date,
    'Classe': inscription.child_class?.toUpperCase(),
    'Sexe': inscription.child_gender === 'garcon' ? 'Garçon' : 'Fille',
    'École': inscription.child_school,
    
    // Parent 1
    'Parent 1 - Prénom': inscription.parent_first_name,
    'Parent 1 - Nom': inscription.parent_last_name,
    'Parent 1 - Email': inscription.parent_email,
    'Parent 1 - Mobile': inscription.parent_mobile,
    'Parent 1 - Tél bureau': inscription.parent_office_phone || '',
    'Parent 1 - Autorité': inscription.parent_authority,
    
    // Parent 2
    'Parent 2 - Prénom': inscription.parent2_first_name || '',
    'Parent 2 - Nom': inscription.parent2_last_name || '',
    'Parent 2 - Email': inscription.parent2_email || '',
    'Parent 2 - Mobile': inscription.parent2_mobile || '',
    'Parent 2 - Tél bureau': inscription.parent2_office_phone || '',
    'Parent 2 - Autorité': inscription.parent2_authority || '',
    
    'Adresse': inscription.parent_address,
    
    // Contacts d'urgence
    'Urgence 1 - Prénom': inscription.urgency_contact_1_first_name || '',
    'Urgence 1 - Nom': inscription.urgency_contact_1_last_name || '',
    'Urgence 1 - Relation': inscription.urgency_contact_1_relation || '',
    'Urgence 1 - Mobile': inscription.urgency_contact_1_mobile || '',
    'Urgence 1 - Autre tél': inscription.urgency_contact_1_other_phone || '',
    'Urgence 2 - Prénom': inscription.urgency_contact_2_first_name || '',
    'Urgence 2 - Nom': inscription.urgency_contact_2_last_name || '',
    'Urgence 2 - Relation': inscription.urgency_contact_2_relation || '',
    'Urgence 2 - Mobile': inscription.urgency_contact_2_mobile || '',
    'Urgence 2 - Autre tél': inscription.urgency_contact_2_other_phone || '',
    
    // Personnes autorisées
    'Autorisé 1 - Prénom': inscription.authorized_person_1_first_name || '',
    'Autorisé 1 - Nom': inscription.authorized_person_1_last_name || '',
    'Autorisé 1 - Relation': inscription.authorized_person_1_relation || '',
    'Autorisé 1 - Mobile': inscription.authorized_person_1_mobile || '',
    'Autorisé 1 - Autre tél': inscription.authorized_person_1_other_phone || '',
    'Autorisé 2 - Prénom': inscription.authorized_person_2_first_name || '',
    'Autorisé 2 - Nom': inscription.authorized_person_2_last_name || '',
    'Autorisé 2 - Relation': inscription.authorized_person_2_relation || '',
    'Autorisé 2 - Mobile': inscription.authorized_person_2_mobile || '',
    'Autorisé 2 - Autre tél': inscription.authorized_person_2_other_phone || '',
    
    'Préférences': inscription.demande_specifique || '',
    'Allergies alimentaires (détails)': inscription.food_allergies_details || '',
    'Traitement médicamenteux': inscription.has_medication ? 'Oui' : 'Non',
    'Traitement médicamenteux (détails)': inscription.medication_details || '',
    'Allergies': inscription.has_allergies ? 'Oui' : 'Non',
    'Allergies (détails)': inscription.allergies_details || '',
    'Choix': inscription.sejour_preference_1 === sejour.id ? '1er choix' : '2ème choix',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, formatSejourTitre(sejour));
  
  const fileName = `sejour_${formatSejourTitre(sejour).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
