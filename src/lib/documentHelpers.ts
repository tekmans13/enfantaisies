/**
 * Helpers pour la gestion des documents
 */

import { supabase } from '@/integrations/supabase/client';
import { formatFileName } from './formatters';

export interface DocumentToUpload {
  file: File | null;
  type: string;
}

/**
 * Upload un document dans le storage Supabase
 * @returns Le chemin du fichier uploadé
 */
export const uploadDocument = async (
  inscriptionId: string,
  document: DocumentToUpload,
  childLastName: string,
  childFirstName: string
): Promise<string | null> => {
  if (!document.file) return null;

  const formattedFileName = formatFileName(
    childLastName,
    childFirstName,
    document.type,
    document.file
  );
  
  const filePath = `${inscriptionId}/${formattedFileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('inscription-documents')
    .upload(filePath, document.file);

  if (uploadError) {
    console.error('Erreur upload:', uploadError);
    throw new Error(`Upload ${document.type}: ${uploadError.message}`);
  }

  // Enregistrer le document dans la table
  const { error: insertError } = await supabase.from('inscription_documents').insert({
    inscription_id: inscriptionId,
    document_type: document.type,
    file_path: filePath,
    file_name: formattedFileName,
  });

  if (insertError) {
    console.error('Erreur enregistrement document:', insertError);
    throw new Error(`Enregistrement document ${document.type}: ${insertError.message}`);
  }

  return filePath;
};

/**
 * Upload plusieurs documents en parallèle
 */
export const uploadDocuments = async (
  inscriptionId: string,
  documents: DocumentToUpload[],
  childLastName: string,
  childFirstName: string
): Promise<string[]> => {
  const uploadedPaths: string[] = [];

  try {
    for (const doc of documents.filter((item) => item.file !== null)) {
      const path = await uploadDocument(inscriptionId, doc, childLastName, childFirstName);
      if (path) uploadedPaths.push(path);
    }
  } catch (error) {
    await Promise.all(
      uploadedPaths.map((path) =>
        supabase.storage.from('inscription-documents').remove([path])
      )
    );

    throw error;
  }

  return uploadedPaths;
};

/**
 * Labels des types de documents
 */
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  fiche_sanitaire_1: 'Fiche sanitaire de liaison (page 1)',
  fiche_sanitaire_2: 'Fiche sanitaire de liaison (page 2)',
  autorisation_parentale: 'Autorisation parentale',
  assurance_rc: 'Attestation d\'assurance RC',
  certificat_medical: 'Certificat médical',
  attestation_caf: 'Attestation CAF ou avis d\'imposition',
  test_aisance_aquatique: 'Test d\'aisance aquatique',
};
