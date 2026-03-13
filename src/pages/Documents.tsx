import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Upload, Eye, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Document {
  id: string;
  name: string;
  path: string;
  description: string;
}

const DOCUMENTS: Document[] = [
  {
    id: "fiche_sanitaire",
    name: "Fiche sanitaire de liaison",
    path: "/documents/ENFANTAISIES_fiche_sanitaire.pdf",
    description: "Document à remplir pour la fiche sanitaire de l'enfant"
  },
  {
    id: "autorisations_parentales",
    name: "Autorisations parentales",
    path: "/documents/ENFANTAISIES_autorisations_parentales.pdf",
    description: "Autorisations nécessaires des parents"
  },
  {
    id: "certificat_medical",
    name: "Certificat médical",
    path: "/documents/ENFANTAISIES_certificat_medical.pdf",
    description: "Certificat médical à faire remplir par le médecin"
  },
  {
    id: "reglement",
    name: "Règlement intérieur",
    path: "/documents/ENFANTAISIES_reglement.pdf",
    description: "Règlement intérieur du centre aéré"
  },
  {
    id: "charte_permanences",
    name: "Charte des permanences parents",
    path: "/documents/ENFANTAISIES_charte_permanences_parents.pdf",
    description: "Charte définissant les permanences des parents"
  }
];

export default function Documents() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleDownload = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.path;
    link.download = doc.path.split('/').pop() || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Téléchargement",
      description: `${doc.name} téléchargé avec succès`,
    });
  };

  const handleView = (doc: Document) => {
    window.open(doc.path, '_blank');
  };

  const handleUpload = async (docId: string, file: File | null) => {
    if (!file) return;
    
    setUploadingDoc(docId);
    
    // Simuler un upload (dans une vraie app, uploader vers le serveur)
    setTimeout(() => {
      toast({
        title: "Document mis à jour",
        description: "Le document a été mis à jour avec succès",
      });
      setUploadingDoc(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Documents
            </h1>
            <p className="text-muted-foreground">
              Consultez et mettez à jour les documents officiels
            </p>
          </div>
          <Button onClick={() => navigate("/bureau")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour au Bureau
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Documents du centre</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gérez les documents officiels disponibles pour les inscriptions
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DOCUMENTS.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(doc)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(doc)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Télécharger
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                Mettre à jour
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mettre à jour {doc.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div>
                                  <Label htmlFor={`upload-${doc.id}`}>
                                    Nouveau fichier PDF
                                  </Label>
                                  <Input
                                    id={`upload-${doc.id}`}
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => handleUpload(doc.id, e.target.files?.[0] || null)}
                                    disabled={uploadingDoc === doc.id}
                                    className="mt-2"
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Le nouveau document remplacera l'actuel et sera disponible immédiatement pour les utilisateurs.
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informations</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Les documents sont accessibles aux parents lors de l'inscription</p>
              <p>• Certains documents doivent être téléchargés, remplis et renvoyés par les parents</p>
              <p>• Les mises à jour sont appliquées immédiatement</p>
              <p>• Tous les formats PDF sont acceptés pour le remplacement</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
