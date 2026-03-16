import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Upload, Eye, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCentreDocuments, type CentreDocument } from "@/hooks/use-centre-documents";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export default function Documents() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const { documents, viewDoc, downloadDoc, refreshDocUrl } = useCentreDocuments();

  const handleUpload = async (doc: CentreDocument, file: File | null) => {
    if (!file) return;
    setUploadingDoc(doc.id);
    try {
      const { error } = await supabase.storage
        .from("centre-documents")
        .upload(doc.fileName, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage
        .from("centre-documents")
        .getPublicUrl(doc.fileName);
      refreshDocUrl(doc.id, data.publicUrl);

      toast({ title: "Document mis à jour", description: `${doc.name} a été mis à jour avec succès` });
    } catch (error: any) {
      console.error("Erreur upload:", error);
      toast({ title: "Erreur", description: error.message || "Impossible de mettre à jour le document", variant: "destructive" });
    } finally {
      setUploadingDoc(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Documents</h1>
            <p className="text-muted-foreground">Consultez et mettez à jour les documents officiels</p>
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
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => viewDoc(doc)} className="gap-2">
                            <Eye className="w-4 h-4" /> Voir
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadDoc(doc)} className="gap-2">
                            <Download className="w-4 h-4" /> Télécharger
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2" disabled={uploadingDoc === doc.id}>
                                {uploadingDoc === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Mettre à jour
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Mettre à jour {doc.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div>
                                  <Label htmlFor={`upload-${doc.id}`}>Nouveau fichier PDF</Label>
                                  <Input
                                    id={`upload-${doc.id}`}
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => handleUpload(doc, e.target.files?.[0] || null)}
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
