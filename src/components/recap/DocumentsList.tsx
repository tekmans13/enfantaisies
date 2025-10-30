/**
 * Composant : Liste des documents (Récapitulatif)
 * Affiche et permet de télécharger les documents fournis
 */

import { FileText, Download, FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadDocument, downloadAllDocuments } from "@/lib/downloadDocuments";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  file_path: string;
  file_name: string;
}

interface DocumentsListProps {
  inscriptionId: string;
  documents: Document[];
}

export function DocumentsList({ inscriptionId, documents }: DocumentsListProps) {
  const { toast } = useToast();

  if (documents.length === 0) return null;

  const handleDownloadAll = async () => {
    try {
      await downloadAllDocuments(inscriptionId);
      toast({
        title: "Téléchargement réussi",
        description: "Tous les documents ont été téléchargés",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger les documents",
        variant: "destructive",
      });
    }
  };

  const handleDownloadOne = async (filePath: string, fileName: string) => {
    try {
      await downloadDocument(filePath, fileName);
      toast({
        title: "Téléchargement réussi",
        description: fileName,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Documents fournis</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadAll}
        >
          <FileArchive className="w-4 h-4 mr-2" />
          Télécharger tout (ZIP)
        </Button>
      </div>
      <div className="bg-muted/50 rounded-lg p-6">
        <div className="grid md:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm">{doc.file_name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadOne(doc.file_path, doc.file_name)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
