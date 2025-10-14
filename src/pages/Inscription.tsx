import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, FileCheck, Users, Calendar, CheckCircle, Info, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const TOTAL_STEPS = 5;
const DEBUG_MODE = true; // Mettre à true pour désactiver la validation pendant le développement

export default function Inscription() {
  const [currentStep, setCurrentStep] = useState(1);
  const [childAgeGroup, setChildAgeGroup] = useState<string | null>(null);
  const [showParent2, setShowParent2] = useState(false);
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
    quotientFamilial: "",
    cafNumber: "",
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentAuthority: "",
    parentMobile: "",
    parentOfficePhone: "",
    parentAddress: "",
    parent2FirstName: "",
    parent2LastName: "",
    parent2Email: "",
    parent2Authority: "",
    parent2Mobile: "",
    parent2OfficePhone: "",
    socialSecurityRegime: "general",
    sejourPreference1: "",
    sejourPreference2: "",
    sejourPreference1Alternatif: "",
    sejourPreference2Alternatif: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<{
    ficheSanitaire1: File | null;
    ficheSanitaire2: File | null;
    autorisationParentale: File | null;
    assuranceRC: File | null;
    certificatMedical: File | null;
    attestationCAF: File | null;
    testAisanceAquatique: File | null;
  }>({
    ficheSanitaire1: null,
    ficheSanitaire2: null,
    autorisationParentale: null,
    assuranceRC: null,
    certificatMedical: null,
    attestationCAF: null,
    testAisanceAquatique: null,
  });

  const [numberOfWeeks, setNumberOfWeeks] = useState<"1" | "2">("1");
  const [selectedSejours, setSelectedSejours] = useState<string[]>([]);
  const [prioritySejour, setPrioritySejour] = useState<string>("");
  
  // Pour le mode 2 semaines
  const [week1Selected, setWeek1Selected] = useState<string[]>([]);
  const [week1Priority, setWeek1Priority] = useState<string>("");
  const [week2Selected, setWeek2Selected] = useState<string[]>([]);
  const [week2Priority, setWeek2Priority] = useState<string>("");

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

  const { data: tarifs } = useQuery({
    queryKey: ['tarifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifs')
        .select('*')
        .eq('annee', 2025)
        .order('qf_min', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const calculatePrice = (sejour: any) => {
    if (!sejour || !tarifs) return null;
    
    const qf = parseInt(formData.quotientFamilial) || 999999;
    const tarif = tarifs.find(t => 
      qf >= t.qf_min && (t.qf_max === null || qf <= t.qf_max)
    );
    
    if (!tarif) return null;
    
    // Calculer le nombre de jours
    const dateDebut = new Date(sejour.date_debut);
    const dateFin = new Date(sejour.date_fin);
    const nbJours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Appliquer le tarif journalier selon le type (animation = centre_aere)
    const isCentreAere = sejour.type === 'centre_aere' || sejour.type === 'animation';
    const tarifJournalier = isCentreAere
      ? tarif.tarif_journee_centre_aere 
      : tarif.tarif_journee_sejour;
    
    return tarifJournalier * nbJours;
  };

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Accepte les formats: 0612345678, 06 12 34 56 78, 06.12.34.56.78, 06-12-34-56-78, +33612345678
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(phone.trim());
  };

  const validateStep = (step: number): { isValid: boolean; message?: string } => {
    if (DEBUG_MODE) return { isValid: true }; // Bypass validation en mode debug

    switch (step) {
      case 3: // Étape Enfant
        if (!formData.childFirstName.trim()) return { isValid: false, message: "Le prénom de l'enfant est requis" };
        if (!formData.childLastName.trim()) return { isValid: false, message: "Le nom de l'enfant est requis" };
        if (!formData.childBirthDate) return { isValid: false, message: "La date de naissance est requise" };
        if (!formData.childClass) return { isValid: false, message: "La classe est requise" };
        if (!formData.childGender) return { isValid: false, message: "Le sexe est requis" };
        if (!formData.childSchool.trim()) return { isValid: false, message: "L'école est requise" };
        if (!formData.parentFirstName.trim()) return { isValid: false, message: "Le prénom du responsable légal est requis" };
        if (!formData.parentLastName.trim()) return { isValid: false, message: "Le nom du responsable légal est requis" };
        if (!formData.parentEmail.trim()) return { isValid: false, message: "L'email du responsable légal est requis" };
        if (!validateEmail(formData.parentEmail)) return { isValid: false, message: "L'email du responsable légal n'est pas valide" };
        if (!formData.parentAuthority) return { isValid: false, message: "L'autorité parentale du responsable légal est requise" };
        if (!formData.parentMobile.trim()) return { isValid: false, message: "Le téléphone portable du responsable légal est requis" };
        if (!validatePhone(formData.parentMobile)) return { isValid: false, message: "Le numéro de téléphone du responsable légal n'est pas valide" };
        if (!formData.parentAddress.trim()) return { isValid: false, message: "L'adresse du domicile est requise" };
        if (!formData.socialSecurityRegime) return { isValid: false, message: "Le régime de sécurité sociale est requis" };
        break;
      case 4: // Étape Séjours
        if (!numberOfWeeks) return { isValid: false, message: "Le nombre de semaines est requis" };
        if (numberOfWeeks === "1") {
          if (selectedSejours.length === 0) return { isValid: false, message: "Veuillez sélectionner au moins un séjour" };
          if (!prioritySejour) return { isValid: false, message: "Veuillez indiquer le séjour prioritaire" };
        } else if (numberOfWeeks === "2") {
          if (week1Selected.length === 0) return { isValid: false, message: "Veuillez sélectionner au moins un séjour pour la première semaine" };
          if (!week1Priority) return { isValid: false, message: "Veuillez indiquer le séjour prioritaire pour la première semaine" };
          if (week2Selected.length === 0) return { isValid: false, message: "Veuillez sélectionner au moins un séjour pour la deuxième semaine" };
          if (!week2Priority) return { isValid: false, message: "Veuillez indiquer le séjour prioritaire pour la deuxième semaine" };
        }
        break;
    }
    return { isValid: true };
  };

  const handleSubmit = async () => {
    // Validation complète de toutes les étapes avant soumission
    for (let step = 1; step <= TOTAL_STEPS; step++) {
      const validation = validateStep(step);
      if (!validation.isValid) {
        toast({
          title: `Étape ${step} incomplète`,
          description: validation.message,
          variant: "destructive",
        });
        setCurrentStep(step); // Rediriger vers l'étape problématique
        return;
      }
    }

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
        quotient_familial: formData.quotientFamilial ? parseInt(formData.quotientFamilial) : null,
        caf_number: formData.cafNumber,
        parent_first_name: formData.parentFirstName,
        parent_last_name: formData.parentLastName,
        parent_email: formData.parentEmail,
        parent_authority: formData.parentAuthority,
        parent_mobile: formData.parentMobile,
        parent_office_phone: formData.parentOfficePhone,
        parent_address: formData.parentAddress,
        parent2_first_name: formData.parent2FirstName || null,
        parent2_last_name: formData.parent2LastName || null,
        parent2_email: formData.parent2Email || null,
        parent2_authority: formData.parent2Authority || null,
        parent2_mobile: formData.parent2Mobile || null,
        parent2_office_phone: formData.parent2OfficePhone || null,
        social_security_regime: formData.socialSecurityRegime,
        sejour_preference_1: formData.sejourPreference1 || null,
        sejour_preference_2: formData.sejourPreference2 || null,
        sejour_preference_1_alternatif: formData.sejourPreference1Alternatif || null,
        sejour_preference_2_alternatif: formData.sejourPreference2Alternatif || null,
        nombre_semaines_demandees: parseInt(numberOfWeeks),
      };

      const { data, error } = await supabase
        .from('inscriptions')
        .insert(inscriptionData)
        .select()
        .single();

      if (error) throw error;

      // Envoyer l'email de confirmation
      const recapUrl = `${window.location.origin}/recap-inscription/${data.id}`;
      
      try {
        await supabase.functions.invoke('send-inscription-email', {
          body: {
            inscriptionId: data.id.slice(0, 8),
            parentEmail: formData.parentEmail,
            parentName: `${formData.parentFirstName} ${formData.parentLastName}`,
            childName: `${formData.childFirstName} ${formData.childLastName}`,
            recapUrl: recapUrl,
          },
        });
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        // On continue même si l'email échoue
      }

      toast({
        title: "Inscription enregistrée !",
        description: "Vous allez recevoir un email de confirmation.",
      });

      // Rediriger vers la page de récapitulatif
      navigate(`/recap-inscription/${data.id}`);
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
                  <button
                    onClick={() => setCurrentStep(step.number)}
                    className={`flex flex-col items-center transition-all hover:scale-105 cursor-pointer ${
                      isActive ? "text-primary" : isCompleted ? "text-secondary" : "text-muted-foreground"
                    }`}
                    type="button"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg scale-110"
                          : isCompleted
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-center hidden sm:block">
                      {step.title}
                    </span>
                  </button>
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

                  <div className="bg-accent/5 p-4 rounded-lg border-2 border-accent/20">
                    <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Info className="w-5 h-5 text-accent" />
                      Tarif
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quotientFamilial">Votre quotient familial</Label>
                        <Input
                          id="quotientFamilial"
                          type="number"
                          value={formData.quotientFamilial}
                          onChange={(e) => handleInputChange('quotientFamilial', e.target.value)}
                          className="mt-1"
                          placeholder="Ex: 850"
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
                    </div>
                    <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
                        Si aucun quotient familial n'est renseigné : le tarif max. sera appliqué
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div className="bg-secondary/5 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Responsable légal</h3>
                    </div>
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

                  {!showParent2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowParent2(true)}
                      className="w-full border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un autre responsable légal
                    </Button>
                  )}

                  {showParent2 && (
                    <div className="bg-secondary/5 p-4 rounded-lg border-2 border-secondary/30">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Responsable légal 2</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowParent2(false);
                            handleInputChange('parent2FirstName', '');
                            handleInputChange('parent2LastName', '');
                            handleInputChange('parent2Email', '');
                            handleInputChange('parent2Authority', '');
                            handleInputChange('parent2Mobile', '');
                            handleInputChange('parent2OfficePhone', '');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="parent2FirstName">Prénom</Label>
                          <Input
                            id="parent2FirstName"
                            value={formData.parent2FirstName}
                            onChange={(e) => handleInputChange('parent2FirstName', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="parent2LastName">Nom</Label>
                          <Input
                            id="parent2LastName"
                            value={formData.parent2LastName}
                            onChange={(e) => handleInputChange('parent2LastName', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="parent2Email">E-mail</Label>
                          <Input
                            id="parent2Email"
                            type="email"
                            value={formData.parent2Email}
                            onChange={(e) => handleInputChange('parent2Email', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Autorité parentale</Label>
                          <RadioGroup value={formData.parent2Authority} onValueChange={(value) => handleInputChange('parent2Authority', value)} className="flex gap-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="oui" id="authority2Oui" />
                              <Label htmlFor="authority2Oui" className="cursor-pointer">Oui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="non" id="authority2Non" />
                              <Label htmlFor="authority2Non" className="cursor-pointer">Non</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div>
                          <Label htmlFor="parent2Mobile">Téléphone Portable</Label>
                          <Input
                            id="parent2Mobile"
                            type="tel"
                            value={formData.parent2Mobile}
                            onChange={(e) => handleInputChange('parent2Mobile', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="parent2OfficePhone">Téléphone Bureau</Label>
                          <Input
                            id="parent2OfficePhone"
                            type="tel"
                            value={formData.parent2OfficePhone}
                            onChange={(e) => handleInputChange('parent2OfficePhone', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Choix des séjours
                </h2>
                <p className="text-muted-foreground mb-4">
                  Groupe : <strong className="text-primary capitalize">
                    {childAgeGroup || 'Non défini'}
                  </strong>
                </p>

                <Alert className="mb-6 border-primary/50 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm space-y-2">
                    <p>
                      <strong>ENFANTAISIES</strong> fera tout son possible pour accéder à vos choix. 
                      Nous donnons en priorité <strong>une semaine par enfant</strong>, une seconde semaine sera attribuée 
                      pour ceux qui le souhaitent si le nombre de places est suffisant.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>
                        <strong>1 semaine :</strong> Sélectionnez la semaine prioritaire et une alternative.
                      </li>
                      <li>
                        <strong>2 semaines :</strong> Sélectionnez les 2 semaines prioritaires et deux alternatives.
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  {/* Choix du nombre de semaines */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <Label className="text-base mb-3 block font-semibold">Nombre de semaines souhaitées *</Label>
                    <RadioGroup 
                      value={numberOfWeeks} 
                      onValueChange={(value: "1" | "2") => {
                        setNumberOfWeeks(value);
                        setSelectedSejours([]);
                        setPrioritySejour("");
                        setWeek1Selected([]);
                        setWeek1Priority("");
                        setWeek2Selected([]);
                        setWeek2Priority("");
                        handleInputChange('sejourPreference1', "");
                        handleInputChange('sejourPreference2', "");
                      }} 
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="weeks-1" />
                        <Label htmlFor="weeks-1" className="cursor-pointer font-medium">1 semaine</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="weeks-2" />
                        <Label htmlFor="weeks-2" className="cursor-pointer font-medium">2 semaines</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Mode 1 semaine : une liste avec sélection multiple */}
                  {numberOfWeeks === "1" && (
                    <div>
                      <Label className="text-base mb-3 block font-semibold">
                        Sélectionnez une semaine prioritaire et une alternative
                      </Label>
                      <div className="space-y-3">
                        {sejours?.map((sejour) => {
                          const isSelected = selectedSejours.includes(sejour.id);
                          const isPriority = prioritySejour === sejour.id;
                          const price = calculatePrice(sejour);
                          
                          return (
                            <div 
                              key={sejour.id} 
                              className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary' 
                                  : 'bg-muted/50 border-transparent hover:bg-muted hover:border-muted-foreground/20'
                              }`}
                            >
                              <Checkbox
                                id={`sejour-${sejour.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    if (selectedSejours.length < 2) {
                                      setSelectedSejours([...selectedSejours, sejour.id]);
                                      if (selectedSejours.length === 0) {
                                        setPrioritySejour(sejour.id);
                                        handleInputChange('sejourPreference1', sejour.id);
                                      } else {
                                        handleInputChange('sejourPreference2', sejour.id);
                                      }
                                    } else {
                                      const nonPriority = selectedSejours.find(id => id !== prioritySejour);
                                      const newSelection = selectedSejours.filter(id => id !== nonPriority);
                                      newSelection.push(sejour.id);
                                      setSelectedSejours(newSelection);
                                      
                                      if (prioritySejour === newSelection[0]) {
                                        handleInputChange('sejourPreference1', newSelection[0]);
                                        handleInputChange('sejourPreference2', newSelection[1]);
                                      } else {
                                        handleInputChange('sejourPreference1', newSelection[1]);
                                        handleInputChange('sejourPreference2', newSelection[0]);
                                      }
                                    }
                                  } else {
                                    setSelectedSejours(selectedSejours.filter(id => id !== sejour.id));
                                    if (prioritySejour === sejour.id) {
                                      const remaining = selectedSejours.filter(id => id !== sejour.id);
                                      setPrioritySejour(remaining[0] || "");
                                      handleInputChange('sejourPreference1', remaining[0] || "");
                                      handleInputChange('sejourPreference2', "");
                                    } else {
                                      handleInputChange('sejourPreference2', "");
                                    }
                                  }
                                }}
                                className="mt-1"
                              />
                               <div className="flex-1">
                                 <Label htmlFor={`sejour-${sejour.id}`} className="cursor-pointer">
                                   <div className="flex items-center justify-between">
                                     <p className="font-semibold">{sejour.titre}</p>
                                     {price !== null && (
                                       <Badge variant="secondary" className="ml-2">
                                         {price.toFixed(2)} €
                                       </Badge>
                                     )}
                                   </div>
                                   <p className="text-sm text-muted-foreground">
                                     Du {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} au {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
                                   </p>
                                 </Label>
                               </div>
                              {isSelected && (
                                <div className="flex items-center space-x-2">
                                  <RadioGroup
                                    value={isPriority ? sejour.id : ""}
                                    onValueChange={() => {
                                      setPrioritySejour(sejour.id);
                                      const otherSejour = selectedSejours.find(id => id !== sejour.id);
                                      handleInputChange('sejourPreference1', sejour.id);
                                      handleInputChange('sejourPreference2', otherSejour || "");
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value={sejour.id} id={`priority-${sejour.id}`} />
                                      <Label htmlFor={`priority-${sejour.id}`} className="text-xs font-medium cursor-pointer whitespace-nowrap">
                                        Prioritaire
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {selectedSejours.length > 0 && !prioritySejour && (
                        <p className="text-sm text-destructive mt-3">
                          ⚠️ Veuillez indiquer quelle semaine est prioritaire
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mode 2 semaines : deux sections avec sélection multiple chacune */}
                  {numberOfWeeks === "2" && (
                    <>
                      {/* Première semaine */}
                      <div className="bg-accent/10 p-4 rounded-lg border-2 border-accent/30">
                        <Label className="text-base mb-3 block font-semibold text-accent-foreground">
                          Première semaine - Sélectionnez une semaine prioritaire et une alternative.
                        </Label>
                        <div className="space-y-3">
                           {sejours?.map((sejour) => {
                             const isSelected = week1Selected.includes(sejour.id);
                             const isPriority = week1Priority === sejour.id;
                             const price = calculatePrice(sejour);
                            
                            return (
                              <div 
                                key={sejour.id} 
                                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-accent/20 border-accent' 
                                    : 'bg-background/80 border-transparent hover:bg-background hover:border-muted-foreground/20'
                                }`}
                              >
                                <Checkbox
                                  id={`week1-${sejour.id}`}
                                  checked={isSelected}
                                   onCheckedChange={(checked) => {
                                     if (checked) {
                                       if (week1Selected.length < 2) {
                                         const newSelection = [...week1Selected, sejour.id];
                                         setWeek1Selected(newSelection);
                                         if (week1Selected.length === 0) {
                                           setWeek1Priority(sejour.id);
                                           handleInputChange('sejourPreference1', sejour.id);
                                         } else {
                                           handleInputChange('sejourPreference1Alternatif', sejour.id);
                                         }
                                       } else {
                                         const nonPriority = week1Selected.find(id => id !== week1Priority);
                                         const newSelection = week1Selected.filter(id => id !== nonPriority);
                                         newSelection.push(sejour.id);
                                         setWeek1Selected(newSelection);
                                         if (week1Priority === newSelection[0]) {
                                           handleInputChange('sejourPreference1', newSelection[0]);
                                           handleInputChange('sejourPreference1Alternatif', newSelection[1]);
                                         } else {
                                           handleInputChange('sejourPreference1', newSelection[1]);
                                           handleInputChange('sejourPreference1Alternatif', newSelection[0]);
                                         }
                                       }
                                     } else {
                                       setWeek1Selected(week1Selected.filter(id => id !== sejour.id));
                                       if (week1Priority === sejour.id) {
                                         const remaining = week1Selected.filter(id => id !== sejour.id);
                                         setWeek1Priority(remaining[0] || "");
                                         handleInputChange('sejourPreference1', remaining[0] || "");
                                         handleInputChange('sejourPreference1Alternatif', "");
                                       } else {
                                         handleInputChange('sejourPreference1Alternatif', "");
                                       }
                                     }
                                   }}
                                  className="mt-1"
                                />
                                 <div className="flex-1">
                                   <Label htmlFor={`week1-${sejour.id}`} className="cursor-pointer">
                                     <div className="flex items-center justify-between">
                                       <p className="font-semibold">{sejour.titre}</p>
                                       {price !== null && (
                                         <Badge variant="secondary" className="ml-2">
                                           {price.toFixed(2)} €
                                         </Badge>
                                       )}
                                     </div>
                                     <p className="text-sm text-muted-foreground">
                                       Du {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} au {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
                                     </p>
                                   </Label>
                                 </div>
                                {isSelected && (
                                  <div className="flex items-center space-x-2">
                                    <RadioGroup
                                       value={isPriority ? sejour.id : ""}
                                       onValueChange={() => {
                                         setWeek1Priority(sejour.id);
                                         const otherSejour = week1Selected.find(id => id !== sejour.id);
                                         handleInputChange('sejourPreference1', sejour.id);
                                         handleInputChange('sejourPreference1Alternatif', otherSejour || "");
                                       }}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value={sejour.id} id={`week1-priority-${sejour.id}`} />
                                        <Label htmlFor={`week1-priority-${sejour.id}`} className="text-xs font-medium cursor-pointer whitespace-nowrap">
                                          Prioritaire
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {week1Selected.length > 0 && !week1Priority && (
                          <p className="text-sm text-destructive mt-3">
                            ⚠️ Veuillez indiquer quelle semaine est prioritaire
                          </p>
                        )}
                      </div>

                      {/* Deuxième semaine */}
                      <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/30">
                        <Label className="text-base mb-3 block font-semibold">
                          Deuxième semaine - Sélectionnez une semaine prioritaire et une alternative.
                        </Label>
                        <div className="space-y-3">
                           {sejours?.map((sejour) => {
                             const isSelected = week2Selected.includes(sejour.id);
                             const isPriority = week2Priority === sejour.id;
                             const price = calculatePrice(sejour);
                            
                            return (
                              <div 
                                key={sejour.id} 
                                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-primary/20 border-primary' 
                                    : 'bg-background/80 border-transparent hover:bg-background hover:border-muted-foreground/20'
                                }`}
                              >
                                <Checkbox
                                  id={`week2-${sejour.id}`}
                                  checked={isSelected}
                                   onCheckedChange={(checked) => {
                                     if (checked) {
                                       if (week2Selected.length < 2) {
                                         const newSelection = [...week2Selected, sejour.id];
                                         setWeek2Selected(newSelection);
                                         if (week2Selected.length === 0) {
                                           setWeek2Priority(sejour.id);
                                           handleInputChange('sejourPreference2', sejour.id);
                                         } else {
                                           handleInputChange('sejourPreference2Alternatif', sejour.id);
                                         }
                                       } else {
                                         const nonPriority = week2Selected.find(id => id !== week2Priority);
                                         const newSelection = week2Selected.filter(id => id !== nonPriority);
                                         newSelection.push(sejour.id);
                                         setWeek2Selected(newSelection);
                                         if (week2Priority === newSelection[0]) {
                                           handleInputChange('sejourPreference2', newSelection[0]);
                                           handleInputChange('sejourPreference2Alternatif', newSelection[1]);
                                         } else {
                                           handleInputChange('sejourPreference2', newSelection[1]);
                                           handleInputChange('sejourPreference2Alternatif', newSelection[0]);
                                         }
                                       }
                                     } else {
                                       setWeek2Selected(week2Selected.filter(id => id !== sejour.id));
                                       if (week2Priority === sejour.id) {
                                         const remaining = week2Selected.filter(id => id !== sejour.id);
                                         setWeek2Priority(remaining[0] || "");
                                         handleInputChange('sejourPreference2', remaining[0] || "");
                                         handleInputChange('sejourPreference2Alternatif', "");
                                       } else {
                                         handleInputChange('sejourPreference2Alternatif', "");
                                       }
                                     }
                                   }}
                                  className="mt-1"
                                />
                                 <div className="flex-1">
                                   <Label htmlFor={`week2-${sejour.id}`} className="cursor-pointer">
                                     <div className="flex items-center justify-between">
                                       <p className="font-semibold">{sejour.titre}</p>
                                       {price !== null && (
                                         <Badge variant="secondary" className="ml-2">
                                           {price.toFixed(2)} €
                                         </Badge>
                                       )}
                                     </div>
                                     <p className="text-sm text-muted-foreground">
                                       Du {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} au {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
                                     </p>
                                   </Label>
                                 </div>
                                {isSelected && (
                                  <div className="flex items-center space-x-2">
                                    <RadioGroup
                                       value={isPriority ? sejour.id : ""}
                                       onValueChange={() => {
                                         setWeek2Priority(sejour.id);
                                         const otherSejour = week2Selected.find(id => id !== sejour.id);
                                         handleInputChange('sejourPreference2', sejour.id);
                                         handleInputChange('sejourPreference2Alternatif', otherSejour || "");
                                       }}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value={sejour.id} id={`week2-priority-${sejour.id}`} />
                                        <Label htmlFor={`week2-priority-${sejour.id}`} className="text-xs font-medium cursor-pointer whitespace-nowrap">
                                          Prioritaire
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {week2Selected.length > 0 && !week2Priority && (
                          <p className="text-sm text-destructive mt-3">
                            ⚠️ Veuillez indiquer quelle semaine est prioritaire
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Documents requis
                </h2>
                <div className="space-y-6">
                  {/* Fiche sanitaire de liaison - 2 uploads */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">
                        Fiche sanitaire de liaison *
                      </Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        <a href="/documents/ENFANTAISIES_fiche_sanitaire.pdf" download className="text-primary hover:underline">
                          Télécharger le document à remplir
                        </a>
                      </p>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Document 1</Label>
                          <Input 
                            type="file" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadedFiles(prev => ({ ...prev, ficheSanitaire1: file }));
                              }
                            }}
                          />
                          {uploadedFiles.ficheSanitaire1 && (
                            <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.ficheSanitaire1.name}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Document 2 (optionnel)</Label>
                          <Input 
                            type="file" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadedFiles(prev => ({ ...prev, ficheSanitaire2: file }));
                              }
                            }}
                          />
                          {uploadedFiles.ficheSanitaire2 && (
                            <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.ficheSanitaire2.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Autorisation parentale */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-semibold mb-2 block">
                      Autorisation parentale *
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      <a href="/documents/ENFANTAISIES_autorisations_parentales.pdf" download className="text-primary hover:underline">
                        Télécharger le document à remplir
                      </a>
                    </p>
                    <Input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFiles(prev => ({ ...prev, autorisationParentale: file }));
                        }
                      }}
                    />
                    {uploadedFiles.autorisationParentale && (
                      <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.autorisationParentale.name}</p>
                    )}
                  </div>

                  {/* Attestation d'assurance RC */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-semibold mb-2 block">
                      Attestation d'assurance Responsabilité civile *
                    </Label>
                    <Input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFiles(prev => ({ ...prev, assuranceRC: file }));
                        }
                      }}
                    />
                    {uploadedFiles.assuranceRC && (
                      <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.assuranceRC.name}</p>
                    )}
                  </div>

                  {/* Certificat médical */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-semibold mb-2 block">
                      Certificat médical *
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Le document « Certificat médical » complété et signé par le médecin traitant indiquant que l'enfant ne présente aucune contre indication à la pratique des activités nautiques, sportives et de plein air organisées dans le cadre du centre aéré ENFANTAISIES.
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      <a href="/documents/ENFANTAISIES_certificat_medical.pdf" download className="text-primary hover:underline">
                        Télécharger le document à remplir
                      </a>
                    </p>
                    <Input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFiles(prev => ({ ...prev, certificatMedical: file }));
                        }
                      }}
                    />
                    {uploadedFiles.certificatMedical && (
                      <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.certificatMedical.name}</p>
                    )}
                  </div>

                  {/* Attestation CAF */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-semibold mb-2 block">
                      Attestation CAF ou Avis d'imposition 2024 *
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Attestation de la CAF (Quotient Familial) de moins de 3 mois. Si pas d'affiliation CAF : dernier avis d'imposition 2020 sur les revenus 2019 du foyer (ou de chacun des deux parents).
                    </p>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold">
                      (En l'absence d'attestation CAF ou de votre avis d'imposition, le tarif 12 sera automatiquement appliqué.)
                    </p>
                    <Input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFiles(prev => ({ ...prev, attestationCAF: file }));
                        }
                      }}
                    />
                    {uploadedFiles.attestationCAF && (
                      <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.attestationCAF.name}</p>
                    )}
                  </div>

                  {/* Test d'aisance aquatique */}
                  <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30">
                    <Label className="text-sm font-semibold mb-2 block">
                      Test d'aisance aquatique / antipanique (optionnel)
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Si votre enfant est inscrit sur un séjour ou pratique des activités nautiques pendant sa semaine au centre, un test d'aisance aquatique / antipanique vous sera demandé (à fournir avant le démarrage du centre).
                    </p>
                    <Input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFiles(prev => ({ ...prev, testAisanceAquatique: file }));
                        }
                      }}
                    />
                    {uploadedFiles.testAisanceAquatique && (
                      <p className="text-xs text-green-600 mt-1">✓ {uploadedFiles.testAisanceAquatique.name}</p>
                    )}
                  </div>

                  {/* Documents informatifs */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <Label className="text-sm font-semibold mb-3 block text-primary">
                      Documents à consulter
                    </Label>
                    <div className="space-y-2 text-sm">
                      <div>
                        <a href="/documents/ENFANTAISIES_reglement.pdf" download className="text-primary hover:underline flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Règlement intérieur
                        </a>
                      </div>
                      <div>
                        <a href="/documents/ENFANTAISIES_charte_permanences_parents.pdf" download className="text-primary hover:underline flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Charte des permanences parents
                        </a>
                      </div>
                    </div>
                  </div>
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
              <Button onClick={() => {
                const validation = validateStep(currentStep);
                if (!validation.isValid) {
                  toast({
                    title: "Champs requis manquants",
                    description: validation.message,
                    variant: "destructive",
                  });
                  return;
                }
                setCurrentStep(Math.min(TOTAL_STEPS, currentStep + 1));
              }}>
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
