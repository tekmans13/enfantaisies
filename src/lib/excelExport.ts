/**
 * Utilitaires pour l'export des données en Excel
 * Permet d'exporter les inscriptions et séjours au format XLSX
 */

import * as XLSX from 'xlsx';

/**
 * Exporte toutes les inscriptions vers un fichier Excel
 * @param inscriptions - Liste des inscriptions à exporter
 * @param sejours - Liste des séjours pour récupérer les titres
 */
export const exportInscriptionsToExcel = (inscriptions: any[], sejours: any[]) => {
  const getSejourTitle = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    return sejour ? sejour.titre : '';
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
    'Allergies': inscription.has_allergies ? 'Oui' : 'Non',
    'Allergies alimentaires': inscription.has_food_allergies ? 'Oui' : 'Non',
    'Sans porc': inscription.no_pork ? 'Oui' : 'Non',
    'Sans viande': inscription.no_meat ? 'Oui' : 'Non',
    'Première inscription': inscription.is_first_inscription ? 'Oui' : 'Non',
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
    'Parent - Nom': `${inscription.parent_first_name} ${inscription.parent_last_name}`,
    'Parent - Email': inscription.parent_email,
    'Parent - Mobile': inscription.parent_mobile,
    'Adresse': inscription.parent_address,
    'Médicaments': inscription.has_medication ? 'Oui' : 'Non',
    'Allergies': inscription.has_allergies ? 'Oui' : 'Non',
    'Allergies alimentaires': inscription.has_food_allergies ? 'Oui' : 'Non',
    'Sans porc': inscription.no_pork ? 'Oui' : 'Non',
    'Sans viande': inscription.no_meat ? 'Oui' : 'Non',
    'Choix': inscription.sejour_preference_1 === sejour.id ? '1er choix' : '2ème choix',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sejour.titre);
  
  const fileName = `sejour_${sejour.titre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
