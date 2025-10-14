import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, FileCheck, Users, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const TOTAL_STEPS = 5;

export default function Inscription() {
  const [currentStep, setCurrentStep] = useState(1);
  const [childAgeGroup, setChildAgeGroup] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    isFirstInscription: false,
    hasMedication: false,
    hasAllergies: false,
    hasFoodAllergies: false,
    noPork: false,
    noMeat: false,
    childFirstName: "",
    childLastName: "",
    childBirthDate: "",
    childClass: "",
    childGender: "",
    childSchool: "",
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentAuthority: "",
    parentMobile: "",
    parentOfficePhone: "",
    parentAddress: "",
    cafNumber: "",
    socialSecurityRegime: "",
    sejourPreference1: "",
    sejourPreference2: "",
  });

  const { data: sejours } = useQuery({
    queryKey: ['sejours', childAgeGroup],
    queryFn: async () => {
      let query = supabase
        .from('sejours')
        .select('*')
        .order('date_debut', { ascending: true });
      
      if (childAgeGroup) {
        query = query.eq('groupe_age', childAgeGroup as any);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!childAgeGroup,
  });

  useEffect(() => {
    if (formData.childClass) {
      let group = null;
      if (['ms', 'gs', 'cp'].includes(formData.childClass)) {
        group = 'pitchouns';
      } else if (['ce1', 'ce2', 'cm1'].includes(formData.childClass)) {
        group = 'minots';
      } else if (['cm2', '6eme', '5eme', '4eme'].includes(formData.childClass)) {
        group = 'mias';
      }
      setChildAgeGroup(group);
    }
  }, [formData.childClass]);

  const handleCheckboxChange = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const inscriptionData: any = {
        is_first_inscription: formData.isFirstInscription,
        has_medication: formData.hasMedication,
        has_allergies: formData.hasAllergies,
        has_food_allergies: formData.hasFoodAllergies,
        no_pork: formData.noPork,
        no_meat: formData.noMeat,
        child_first_name: formData.childFirstName,
        child_last_name: formData.childLastName,
        child_birth_date: formData.childBirthDate,
        child_class: formData.childClass,
        child_gender: formData.childGender,
        child_school: formData.childSchool,
        child_age_group: childAgeGroup,
        parent_first_name: formData.parentFirstName,
        parent_last_name: formData.parentLastName,
        parent_email: formData.parentEmail,
        parent_authority: formData.parentAuthority,
        parent_mobile: formData.parentMobile,
        parent_office_phone: formData.parentOfficePhone,
        parent_address: formData.parentAddress,
        caf_number: formData.cafNumber,
        social_security_regime: formData.socialSecurityRegime,
        sejour_preference_1: formData.sejourPreference1 || null,
        sejour_preference_2: formData.sejourPreference2 || null,
      };

      const { data, error } = await supabase
        .from('inscriptions')
        .insert(inscriptionData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Inscription enregistrée !",
        description: "Votre inscription a été envoyée au bureau pour validation.",
      });

      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement.",
        variant: "destructive",
      });
    }
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Inscription Centre Aéré
          </h1>
          <p className="text-muted-foreground">
            Formulaire simple et progressif pour inscrire votre enfant
          </p>
        </div>

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

          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex flex-col items-center ${
                      isActive ? "text-primary" : isCompleted ? "text-secondary" : "text-muted-foreground"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
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
                    <div className={`h-0.5 w-8 sm:w-16 mx-2 ${isCompleted ? "bg-secondary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

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
                  {[
                    { id: 'isFirstInscription', label: "C'est votre 1ère inscription" },
                    { id: 'hasMedication', label: 'Votre enfant prend un traitement médicamenteux' },
                    { id: 'hasAllergies', label: 'Votre enfant a des allergies' },
                    { id: 'hasFoodAllergies', label: 'Votre enfant a des allergies alimentaires / pratiques alimentaires spécifiques' },
                    { id: 'noPork', label: 'Votre enfant ne mange pas de porc' },
                    { id: 'noMeat', label: 'Votre enfant ne mange pas de viande' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={() => handleCheckboxChange(item.id)}
                      />
                      <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Informations sur l'enfant
                </h2>
                
                <div className="space-y-6">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Votre enfant</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="childFirstName">Prénom *</Label>
                        <Input
                          id="childFirstName"
                          value={formData.childFirstName}
                          onChange={(e) => handleInputChange('childFirstName', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="childLastName">Nom *</Label>
                        <Input
                          id="childLastName"
                          value={formData.childLastName}
                          onChange={(e) => handleInputChange('childLastName', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="childBirthDate">Date de naissance *</Label>
                        <Input
                          id="childBirthDate"
                          type="date"
                          value={formData.childBirthDate}
                          onChange={(e) => handleInputChange('childBirthDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="childClass">Classe (septembre 2025) *</Label>
                        <Select value={formData.childClass} onValueChange={(value) => handleInputChange('childClass', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner une classe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ms">Moyenne Section</SelectItem>
                            <SelectItem value="gs">Grande Section</SelectItem>
                            <SelectItem value="cp">CP</SelectItem>
                            <SelectItem value="ce1">CE1</SelectItem>
                            <SelectItem value="ce2">CE2</SelectItem>
                            <SelectItem value="cm1">CM1</SelectItem>
                            <SelectItem value="cm2">CM2</SelectItem>
                            <SelectItem value="6eme">6ème</SelectItem>
                            <SelectItem value="5eme">5ème</SelectItem>
                            <SelectItem value="4eme">4ème</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Sexe *</Label>
                        <RadioGroup value={formData.childGender} onValueChange={(value) => handleInputChange('childGender', value)} className="flex gap-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="garcon" id="garcon" />
                            <Label htmlFor="garcon" className="cursor-pointer">Garçon</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fille" id="fille" />
                            <Label htmlFor="fille" className="cursor-pointer">Fille</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div>
                        <Label htmlFor="childSchool">École fréquentée *</Label>
                        <Input
                          id="childSchool"
                          value={formData.childSchool}
                          onChange={(e) => handleInputChange('childSchool', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Responsable légal 1</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="parentFirstName">Prénom *</Label>
                        <Input
                          id="parentFirstName"
                          value={formData.parentFirstName}
                          onChange={(e) => handleInputChange('parentFirstName', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="parentLastName">Nom *</Label>
                        <Input
                          id="parentLastName"
                          value={formData.parentLastName}
                          onChange={(e) => handleInputChange('parentLastName', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="parentEmail">E-mail *</Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          value={formData.parentEmail}
                          onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Autorité parentale *</Label>
                        <RadioGroup value={formData.parentAuthority} onValueChange={(value) => handleInputChange('parentAuthority', value)} className="flex gap-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="oui" id="authorityOui" />
                            <Label htmlFor="authorityOui" className="cursor-pointer">Oui</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="non" id="authorityNon" />
                            <Label htmlFor="authorityNon" className="cursor-pointer">Non</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div>
                        <Label htmlFor="parentMobile">Téléphone Portable *</Label>
                        <Input
                          id="parentMobile"
                          type="tel"
                          value={formData.parentMobile}
                          onChange={(e) => handleInputChange('parentMobile', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="parentOfficePhone">Téléphone Bureau</Label>
                        <Input
                          id="parentOfficePhone"
                          type="tel"
                          value={formData.parentOfficePhone}
                          onChange={(e) => handleInputChange('parentOfficePhone', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="parentAddress">Adresse domicile *</Label>
                        <Input
                          id="parentAddress"
                          value={formData.parentAddress}
                          onChange={(e) => handleInputChange('parentAddress', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cafNumber">Numéro d'allocataire CAF</Label>
                        <Input
                          id="cafNumber"
                          value={formData.cafNumber}
                          onChange={(e) => handleInputChange('cafNumber', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="socialSecurityRegime">Régime Sécurité Sociale *</Label>
                        <Select value={formData.socialSecurityRegime} onValueChange={(value) => handleInputChange('socialSecurityRegime', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner un régime" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">Général (dont EDF/GDF)</SelectItem>
                            <SelectItem value="msa">MSA & Agricole</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Choix des séjours
                </h2>
                <p className="text-muted-foreground mb-6">
                  Groupe : <strong className="text-primary capitalize">
                    {childAgeGroup || 'Non défini'}
                  </strong>
                </p>

                <div className="space-y-6">
                  <div>
                    <Label className="text-base mb-3 block">Première préférence *</Label>
                    <RadioGroup value={formData.sejourPreference1} onValueChange={(value) => handleInputChange('sejourPreference1', value)}>
                      <div className="space-y-3">
                        {sejours?.map((sejour) => (
                          <div key={sejour.id} className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                            <RadioGroupItem value={sejour.id} id={`pref1-${sejour.id}`} />
                            <Label htmlFor={`pref1-${sejour.id}`} className="cursor-pointer flex-1">
                              <p className="font-semibold">{sejour.titre}</p>
                              <p className="text-sm text-muted-foreground">
                                Du {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} au {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
                              </p>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Documents requis
                </h2>
                <div className="space-y-4">
                  {[
                    'Fiche sanitaire de liaison',
                    'Autorisation parentale',
                    'Attestation d\'assurance Responsabilité civile',
                    'Certificat médical',
                    'Attestation CAF ou Avis d\'imposition 2024',
                  ].map((doc) => (
                    <div key={doc} className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-sm font-semibold mb-2 block">{doc}</Label>
                      <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
            {currentStep < TOTAL_STEPS ? (
              <Button onClick={() => setCurrentStep(Math.min(TOTAL_STEPS, currentStep + 1))}>
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Terminer
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
