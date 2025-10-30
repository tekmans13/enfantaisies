/**
 * Utilitaires pour le téléchargement de documents
 * Gère le téléchargement individuel et groupé des documents d'inscription
 */

import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';

/**
 * Télécharge un document unique depuis le storage
 * @param filePath - Chemin du fichier dans le storage
 * @param fileName - Nom du fichier pour le téléchargement
 */
export const downloadDocument = async (filePath: string, fileName: string) => {
  const { data, error } = await supabase.storage
    .from('inscription-documents')
    .download(filePath);

  if (error) {
    console.error('Error downloading document:', error);
    throw error;
  }

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Télécharge tous les documents d'une inscription dans un fichier ZIP
 * @param inscriptionId - ID de l'inscription
 */
export const downloadAllDocuments = async (inscriptionId: string) => {
  const { data: documents, error } = await supabase
    .from('inscription_documents')
    .select('*')
    .eq('inscription_id', inscriptionId);

  if (error || !documents || documents.length === 0) {
    throw new Error('Aucun document trouvé');
  }

  const zip = new JSZip();

  for (const doc of documents) {
    const { data: file, error: downloadError } = await supabase.storage
      .from('inscription-documents')
      .download(doc.file_path);

    if (!downloadError && file) {
      zip.file(doc.file_name, file);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `documents_${inscriptionId.slice(0, 8)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
