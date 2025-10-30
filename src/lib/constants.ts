/**
 * Constantes globales de l'application
 * Centralise les labels, mappings et valeurs fixes
 */

/** Labels des groupes d'âge */
export const AGE_GROUP_LABELS: Record<string, string> = {
  pitchouns: 'Pitchouns',
  minots: 'Minots',
  mias: 'Mias'
};

/** Labels des niveaux de classe */
export const CLASS_LABELS: Record<string, string> = {
  ms: 'Moyenne Section',
  gs: 'Grande Section',
  cp: 'CP',
  ce1: 'CE1',
  ce2: 'CE2',
  cm1: 'CM1',
  cm2: 'CM2',
  '6eme': '6ème',
  '5eme': '5ème',
  '4eme': '4ème'
};

/** Mapping classe -> groupe d'âge */
export const CLASS_TO_AGE_GROUP: Record<string, string> = {
  ms: 'pitchouns',
  gs: 'pitchouns',
  cp: 'pitchouns',
  ce1: 'minots',
  ce2: 'minots',
  cm1: 'minots',
  cm2: 'mias',
  '6eme': 'mias',
  '5eme': 'mias',
  '4eme': 'mias'
};

/** Labels des statuts d'inscription */
export const STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  attribuee: 'Attribuée',
  envoye: 'Lien envoyé',
  paye: 'Payé',
  validee: 'Validée',
  refusee: 'Refusée'
};

/** Nombre total d'étapes dans le formulaire d'inscription */
export const TOTAL_INSCRIPTION_STEPS = 5;

/** Année des tarifs en cours */
export const CURRENT_TARIF_YEAR = 2025;
