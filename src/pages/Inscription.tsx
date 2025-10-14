import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, FileCheck, Users, Calendar } from "lucide-react";

const TOTAL_STEPS = 5;


export default function Inscription() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    isFirstInscription: false,
    hasMedication: false,
    hasAllergies: false,
    hasFoodAllergies: false,
    noPork: false,
    noMeat: false,
  });

  const handleCheckboxChange = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const steps = [
    { number: 1, title: "Documents", icon: FileCheck },
    { number: 2, title: "Préalables", icon: FileCheck },
    { number: 3, title: "Enfant", icon: Users },
    { number: 4, title: "Séjours", icon: Calendar },
    { number: 5, title: "Documents", icon: FileCheck },
  ];

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Inscription Centre Aéré
          </h1>
          <p className="text-muted-foreground">
            Formulaire simple et progressif pour inscrire votre enfant
          </p>
        </div>

        {/* Indicateur de progression */}
        <Card className="p-6 mb-8 shadow-soft">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">
                Étape {currentStep} sur {TOTAL_STEPS}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}% complété
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Navigation des étapes */}
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex flex-col items-center ${
                      isActive ? "text-primary" : isCompleted ? "text-secondary" : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg scale-110"
                          : isCompleted
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-center hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-8 sm:w-16 mx-2 ${
                        isCompleted ? "bg-secondary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Contenu de l'étape actuelle */}
        <Card className="p-8 shadow-soft">
          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Vérification des documents
                </h2>
                <p className="text-muted-foreground mb-6">
                  Chers parents, vérifiez que vous êtes bien en possession des documents suivants avant de commencer l'inscription :
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <FileCheck className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm">Attestation de la CAF (moins de 3 mois) - OU - Avis d'imposition 2024</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <FileCheck className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm">Certificat médical</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <FileCheck className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm">Responsabilité civile (avec le nom de l'enfant)</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Informations préalables
                </h2>
                <p className="text-muted-foreground mb-6">
                  Avant de commencer, merci de cocher les cases correspondantes à votre inscription :
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="firstInscription"
                      checked={formData.isFirstInscription}
                      onCheckedChange={() => handleCheckboxChange('isFirstInscription')}
                    />
                    <Label
                      htmlFor="firstInscription"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      C'est votre 1ère inscription
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="medication"
                      checked={formData.hasMedication}
                      onCheckedChange={() => handleCheckboxChange('hasMedication')}
                    />
                    <Label
                      htmlFor="medication"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Votre enfant prend un traitement médicamenteux
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="allergies"
                      checked={formData.hasAllergies}
                      onCheckedChange={() => handleCheckboxChange('hasAllergies')}
                    />
                    <Label
                      htmlFor="allergies"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Votre enfant a des allergies
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="foodAllergies"
                      checked={formData.hasFoodAllergies}
                      onCheckedChange={() => handleCheckboxChange('hasFoodAllergies')}
                    />
                    <Label
                      htmlFor="foodAllergies"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Votre enfant a des allergies alimentaires / pratiques alimentaires spécifiques
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="noPork"
                      checked={formData.noPork}
                      onCheckedChange={() => handleCheckboxChange('noPork')}
                    />
                    <Label
                      htmlFor="noPork"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Votre enfant ne mange pas de porc
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="noMeat"
                      checked={formData.noMeat}
                      onCheckedChange={() => handleCheckboxChange('noMeat')}
                    />
                    <Label
                      htmlFor="noMeat"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Votre enfant ne mange pas de viande
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Informations sur l'enfant
                </h2>
                {/* Formulaire étape 3 sera ajouté */}
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Choix des séjours
                </h2>
                {/* Formulaire étape 4 sera ajouté */}
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Téléversement des documents
                </h2>
                {/* Formulaire étape 5 sera ajouté */}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(TOTAL_STEPS, currentStep + 1))}
              disabled={currentStep === TOTAL_STEPS}
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
