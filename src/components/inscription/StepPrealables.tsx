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
import { AlertCircle, FileCheck } from "lucide-react";

interface StepPrealablesProps {
  formData: {
    isFirstInscription: boolean;
    hasMedication: boolean;
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
  
  const checkboxItems = [
    { id: 'isFirstInscription', label: "C'est votre 1ère inscription" },
    { id: 'hasMedication', label: 'Votre enfant prend un traitement médicamenteux' },
    { id: 'hasAllergies', label: 'Votre enfant a des allergies' },
    { id: 'hasFoodAllergies', label: 'Votre enfant a des allergies alimentaires / pratiques alimentaires spécifiques' },
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
                  Chers parents, vérifiez que vous êtes bien en possession des documents suivants avant de commencer l'inscription :
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-900 dark:text-amber-100">Attestation de la CAF (moins de 3 mois) - OU - Avis d'imposition {impositionYear}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-900 dark:text-amber-100">Certificat médical</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-900 dark:text-amber-100">Responsabilité civile (avec le nom de l'enfant)</p>
                  </div>
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
          <div key={item.id} className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id={item.id}
              checked={formData[item.id as keyof typeof formData] as boolean}
              onCheckedChange={() => onCheckboxChange(item.id)}
            />
            <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
              {item.label}
            </Label>
          </div>
        ))}
        
        {formData.hasAllergies && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label htmlFor="allergiesDetails" className="text-sm font-medium">
              Détails des allergies
            </Label>
            <Textarea
              id="allergiesDetails"
              value={formData.allergiesDetails}
              onChange={(e) => onInputChange('allergiesDetails', e.target.value)}
              className="mt-2"
              placeholder="Décrivez les allergies de votre enfant..."
              rows={3}
            />
          </div>
        )}
        
        {formData.hasFoodAllergies && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label htmlFor="foodAllergiesDetails" className="text-sm font-medium">
              Détails des allergies alimentaires / pratiques alimentaires spécifiques
            </Label>
            <Textarea
              id="foodAllergiesDetails"
              value={formData.foodAllergiesDetails}
              onChange={(e) => onInputChange('foodAllergiesDetails', e.target.value)}
              className="mt-2"
              placeholder="Décrivez les allergies alimentaires ou pratiques alimentaires spécifiques de votre enfant..."
              rows={3}
            />
          </div>
        )}
      </div>
    </div>
  );
}
