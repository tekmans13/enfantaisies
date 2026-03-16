/**
 * Hook partagé pour gérer les documents du centre.
 * Résout les URLs : si un document existe dans le storage backend, il est servi depuis là.
 * Sinon, le fichier statique local est utilisé comme fallback.
 * 
 * Utilisé par : page Documents (admin), popup "Documents requis" (inscription)
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CentreDocument {
  id: string;
  name: string;
  fileName: string;
  staticPath: string;
  description: string;
}

export const CENTRE_DOCUMENTS: CentreDocument[] = [
  {
    id: "fiche_sanitaire",
    name: "Fiche sanitaire de liaison",
    fileName: "ENFANTAISIES_fiche_sanitaire.pdf",
    staticPath: "/documents/ENFANTAISIES_fiche_sanitaire.pdf",
    description: "Document à remplir pour la fiche sanitaire de l'enfant",
  },
  {
    id: "autorisations_parentales",
    name: "Autorisations parentales",
    fileName: "ENFANTAISIES_autorisations_parentales.pdf",
    staticPath: "/documents/ENFANTAISIES_autorisations_parentales.pdf",
    description: "Autorisations nécessaires des parents",
  },
  {
    id: "certificat_medical",
    name: "Certificat médical",
    fileName: "ENFANTAISIES_certificat_medical.pdf",
    staticPath: "/documents/ENFANTAISIES_certificat_medical.pdf",
    description: "Certificat médical à faire remplir par le médecin",
  },
  {
    id: "reglement",
    name: "Règlement intérieur",
    fileName: "ENFANTAISIES_reglement.pdf",
    staticPath: "/documents/ENFANTAISIES_reglement.pdf",
    description: "Règlement intérieur du centre aéré",
  },
  {
    id: "charte_permanences",
    name: "Charte des permanences parents",
    fileName: "ENFANTAISIES_charte_permanences_parents.pdf",
    staticPath: "/documents/ENFANTAISIES_charte_permanences_parents.pdf",
    description: "Charte définissant les permanences des parents",
  },
];

export function useCentreDocuments() {
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolve = async () => {
      const urls: Record<string, string> = {};
      for (const doc of CENTRE_DOCUMENTS) {
        const { data } = supabase.storage
          .from("centre-documents")
          .getPublicUrl(doc.fileName);
        try {
          const res = await fetch(data.publicUrl, { method: "HEAD" });
          if (res.ok) {
            urls[doc.id] = data.publicUrl;
          }
        } catch {
          // fallback to static
        }
      }
      setResolvedUrls(urls);
      setLoading(false);
    };
    resolve();
  }, []);

  /** Retourne l'URL du document (storage ou statique) */
  const getDocUrl = (doc: CentreDocument) => {
    const storageUrl = resolvedUrls[doc.id];
    if (storageUrl) {
      return `${storageUrl}?t=${Date.now()}`;
    }
    return doc.staticPath;
  };

  /** Télécharge un document via un lien temporaire */
  const downloadDoc = (doc: CentreDocument) => {
    const link = document.createElement("a");
    link.href = getDocUrl(doc);
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /** Ouvre le document dans un nouvel onglet */
  const viewDoc = (doc: CentreDocument) => {
    window.open(getDocUrl(doc), "_blank");
  };

  /** Rafraîchit l'URL d'un document après upload */
  const refreshDocUrl = (docId: string, url: string) => {
    setResolvedUrls((prev) => ({ ...prev, [docId]: url }));
  };

  return {
    documents: CENTRE_DOCUMENTS,
    getDocUrl,
    downloadDoc,
    viewDoc,
    refreshDocUrl,
    loading,
  };
}
