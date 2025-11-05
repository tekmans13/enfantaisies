/**
 * Composant : Étape 1 - Informations préalables
 * Collecte les informations générales avant l'inscription
 */

import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, FileCheck, Download } from "lucide-react";

interface StepPrealablesProps {
  formData: {
    isFirstInscription: boolean;
    hasMedication: boolean;
    medicationDetails: string;
    hasAllergies: boolean;
    allergiesDetails: string;
    hasFoodAllergies: boolean;
    foodAllergiesDetails: string;
  };
  onCheckboxChange: (field: string) => void;
  onInputChange: (field: string, value: string) => void;
  isDocModalOpen: boolean;
  setIsDocModalOpen: (open: boolean) => void;
}

export function StepPrealables({ 
  formData, 
  onCheckboxChange, 
  onInputChange,
  isDocModalOpen,
  setIsDocModalOpen 
}: StepPrealablesProps) {
  // Année pour l'avis d'imposition (année en cours - 1)
  const impositionYear = new Date().getFullYear() - 1;
  
  const documentsToDownload = [
    {
      name: "Fiche sanitaire de liaison",
      path: "/documents/ENFANTAISIES_fiche_sanitaire.pdf"
    },
    {
      name: "Autorisations parentales",
      path: "/documents/ENFANTAISIES_autorisations_parentales.pdf"
    },
    {
      name: "Certificat médical",
      path: "/documents/ENFANTAISIES_certificat_medical.pdf"
    },
    {
      name: "Règlement intérieur",
      path: "/documents/ENFANTAISIES_reglement.pdf"
    },
    {
      name: "Charte des permanences parents",
      path: "/documents/ENFANTAISIES_charte_permanences_parents.pdf"
    }
  ];

  const handleDownload = (path: string, name: string) => {
    const link = document.createElement('a');
    link.href = path;
    link.download = path.split('/').pop() || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const checkboxItems = [
    { 
      id: 'isFirstInscription', 
      label: "C'est votre 1ère inscription",
      hasDetails: false
    },
    { 
      id: 'hasMedication', 
      label: 'Votre enfant prend un traitement médicamenteux',
      hasDetails: true,
      detailsField: 'medicationDetails',
      detailsLabel: 'Détails du traitement médicamenteux',
      detailsPlaceholder: 'Décrivez le traitement médicamenteux de votre enfant...'
    },
    { 
      id: 'hasAllergies', 
      label: 'Votre enfant a des allergies',
      hasDetails: true,
      detailsField: 'allergiesDetails',
      detailsLabel: 'Détails des allergies',
      detailsPlaceholder: 'Décrivez les allergies de votre enfant...'
    },
    { 
      id: 'hasFoodAllergies', 
      label: 'Votre enfant a des allergies alimentaires / pratiques alimentaires spécifiques',
      hasDetails: true,
      detailsField: 'foodAllergiesDetails',
      detailsLabel: 'Détails des allergies alimentaires / pratiques alimentaires spécifiques',
      detailsPlaceholder: 'Décrivez les allergies alimentaires ou pratiques alimentaires spécifiques de votre enfant...'
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">
          Informations préalables
        </h2>
        <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              Documents requis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Documents requis</DialogTitle>
            </DialogHeader>
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-sm mt-2">
                <p className="font-medium mb-3 text-amber-900 dark:text-amber-100">
                  Chers parents,
                  <br />
                  Avant de commencer l'inscription, merci de vérifier que vous disposez bien des documents suivants :
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-900 dark:text-amber-100">Attestation de la CAF (moins de 3 mois) - OU - Avis d'imposition {impositionYear}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-900 dark:text-amber-100">Responsabilité civile (avec le nom de l'enfant)</p>
                  </div>
                </div>
                <p className="font-medium mb-3 text-amber-900 dark:text-amber-100">
                  Ensuite, téléchargez les documents suivants, signez-les et scannez-les pour les joindre à votre dossier :
                </p>
                <div className="space-y-2">
                  {documentsToDownload.map((doc) => (
                    <div key={doc.path} className="flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <button
                        onClick={() => handleDownload(doc.path, doc.name)}
                        className="text-amber-900 dark:text-amber-100 hover:underline text-left flex items-center gap-1"
                      >
                        {doc.name}
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-muted-foreground mb-6">
        Avant de commencer, merci de cocher les cases correspondantes à votre inscription :
      </p>
      <div className="space-y-4">
        {checkboxItems.map((item) => (
          <div key={item.id}>
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id={item.id}
                checked={formData[item.id as keyof typeof formData] as boolean}
                onCheckedChange={() => onCheckboxChange(item.id)}
              />
              <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                {item.label}
              </Label>
            </div>
            
            {item.hasDetails && formData[item.id as keyof typeof formData] && (
              <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                <Label htmlFor={item.detailsField} className="text-sm font-medium">
                  {item.detailsLabel}
                </Label>
                <Textarea
                  id={item.detailsField}
                  value={formData[item.detailsField as keyof typeof formData] as string}
                  onChange={(e) => onInputChange(item.detailsField!, e.target.value)}
                  className="mt-2"
                  placeholder={item.detailsPlaceholder}
                  rows={3}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
