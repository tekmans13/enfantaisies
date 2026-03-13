import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Calendar, User, Mail, Info, Download, FileArchive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { downloadDocument, downloadAllDocuments } from "@/lib/downloadDocuments";
import { useToast } from "@/hooks/use-toast";
import { formatSejourTitre } from "@/lib/formatters";
import { AttributionInfo } from "@/components/recap/AttributionInfo";

interface InscriptionRecapDialogProps {
  inscriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InscriptionRecapDialog({
  inscriptionId,
  open,
  onOpenChange,
}: InscriptionRecapDialogProps) {
  const { toast } = useToast();
  const [inscription, setInscription] = useState<any>(null);
  const [sejours, setSejours] = useState<any[]>([]);
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && inscriptionId) {
      fetchInscription();
    }
  }, [open, inscriptionId]);

  const fetchInscription = async () => {
    if (!inscriptionId) return;

    try {
      setLoading(true);
      const { data: inscriptionData, error: inscriptionError } = await supabase
        .from('inscriptions')
        .select('*')
        .eq('id', inscriptionId)
        .maybeSingle();

      if (inscriptionError) throw inscriptionError;
      setInscription(inscriptionData);

      // Récupérer les séjours
      const sejourIds = [
        inscriptionData.sejour_preference_1,
        inscriptionData.sejour_preference_2,
        inscriptionData.sejour_preference_1_alternatif,
        inscriptionData.sejour_preference_2_alternatif,
      ].filter(Boolean);

      if (sejourIds.length > 0) {
        const { data: sejoursData, error: sejoursError } = await supabase
          .from('sejours')
          .select('*')
          .in('id', sejourIds);

        if (sejoursError) throw sejoursError;
        setSejours(sejoursData || []);
      }

      // Récupérer les tarifs
      const { data: tarifsData, error: tarifsError } = await supabase
        .from('tarifs')
        .select('*')
        .eq('annee', 2025)
        .order('qf_min', { ascending: true });

      if (tarifsError) throw tarifsError;
      setTarifs(tarifsData || []);

      // Récupérer les documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('inscription_documents')
        .select('*')
        .eq('inscription_id', inscriptionId);

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSejourTitle = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    return sejour ? formatSejourTitre(sejour) : 'Non spécifié';
  };

  const getSejourDates = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    if (!sejour) return 'Non spécifié';
    return `${formatDate(sejour.date_debut)} - ${formatDate(sejour.date_fin)}`;
  };

  const calculatePrice = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    if (!sejour || !tarifs) return null;
    
    const qf = inscription?.quotient_familial || 999999;
    const tarif = tarifs.find(t => 
      qf >= t.qf_min && (t.qf_max === null || qf <= t.qf_max)
    );
    
    if (!tarif) return null;
    
    const dateDebut = new Date(sejour.date_debut);
    const dateFin = new Date(sejour.date_fin);
    const joursCalc = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const nbJours = sejour.nombre_jours ?? joursCalc;
    
    const isCentreAere = sejour.type === 'centre_aere' || sejour.type === 'animation';
    const tarifJournalier = isCentreAere
      ? tarif.tarif_journee_centre_aere 
      : tarif.tarif_journee_sejour;
    
    return tarifJournalier * nbJours;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAgeGroupLabel = (group: string) => {
    const labels: Record<string, string> = {
      pitchouns: 'Pitchouns',
      minots: 'Minots',
      mias: 'Mias'
    };
    return labels[group] || group;
  };

  const getClassLabel = (classLevel: string) => {
    const labels: Record<string, string> = {
      ms: 'Moyenne Section',
      gs: 'Grande Section',
      cp: 'CP',
      ce1: 'CE1',
      ce2: 'CE2',
      cm1: 'CM1',
      cm2: 'CM2',
      '6eme': '6ème',
      '5eme': '5ème',
      '4eme': '4ème'
    };
    return labels[classLevel] || classLevel;
  };

  if (!inscription && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Inscription enregistrée !</h2>
            <p className="text-sm font-normal text-muted-foreground">
              Nous avons bien reçu votre demande d'inscription
            </p>
            {inscription && (
              <>
                <div className="mt-3 text-xs text-muted-foreground">
                  Référence de l'inscription : #{inscription.id.slice(0, 8)}
                </div>
                
                {/* Statut de paiement */}
                <div className="mt-4 flex justify-center">
                  {inscription.status === 'paye' ? (
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 inline-block">
                      <div className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-sm text-green-900 dark:text-green-100">
                            PAYÉ
                          </span>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 inline-block">
                      <div className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-sm text-orange-900 dark:text-orange-100">
                            EN ATTENTE DE PAIEMENT
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Chargement...</div>
        ) : inscription ? (
          <div className="space-y-6">
            {/* Informations de l'enfant */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-lg font-semibold">Informations de l'enfant</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{inscription.child_first_name} {inscription.child_last_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">{formatDate(inscription.child_birth_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Classe</p>
                    <p className="font-medium">{getClassLabel(inscription.child_class)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Groupe d'âge</p>
                    <Badge variant="secondary" className="text-xs">{getAgeGroupLabel(inscription.child_age_group)}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">École</p>
                    <p className="font-medium">{inscription.child_school}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sexe</p>
                    <p className="font-medium">{inscription.child_gender === 'garcon' ? 'Garçon' : 'Fille'}</p>
                  </div>
                </div>

                {/* Santé et allergies */}
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Informations médicales</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">Première inscription:</p>
                      <Badge variant={inscription.is_first_inscription ? "default" : "secondary"} className="text-xs">
                        {inscription.is_first_inscription ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                    {inscription.has_allergies && inscription.allergies_details && (
                      <div>
                        <p className="text-muted-foreground mb-1">Allergies:</p>
                        <p className="font-medium text-xs bg-background p-2 rounded border">
                          {inscription.allergies_details}
                        </p>
                      </div>
                    )}
                    {inscription.has_medication && inscription.medication_details && (
                      <div>
                        <p className="text-muted-foreground mb-1">Traitement médicamenteux:</p>
                        <p className="font-medium text-xs bg-background p-2 rounded border">
                          {inscription.medication_details}
                        </p>
                      </div>
                    )}
                    {inscription.food_allergies_details && (
                      <div>
                        <p className="text-muted-foreground mb-1">Allergies/pratiques alimentaires:</p>
                        <p className="font-medium text-xs bg-background p-2 rounded border">
                          {inscription.food_allergies_details}
                        </p>
                      </div>
                    )}
                    {!inscription.has_allergies && !inscription.has_medication && !inscription.food_allergies_details && (
                      <p className="text-muted-foreground text-sm">Aucune information médicale particulière</p>
                    )}
                  </div>
                </div>

                {/* Demande spécifique */}
                {inscription.demande_specifique && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Demande spécifique</h4>
                      <p className="text-sm bg-background p-3 rounded border">
                        {inscription.demande_specifique}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tarif */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="text-lg font-semibold">Tarif</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quotient familial</p>
                    <p className="font-medium">{inscription.quotient_familial || 'Non renseigné (tarif max.)'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">N° allocataire CAF</p>
                    <p className="font-medium">{inscription.caf_number || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attribution finale (si disponible) */}
            <AttributionInfo 
              inscription={inscription} 
              sejours={sejours} 
              calculatePrice={calculatePrice} 
            />

            {/* Séjours */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-lg font-semibold">Séjours demandés</h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nombre de semaines</p>
                  <Badge className="text-xs">{inscription.nombre_semaines_demandees} semaine{inscription.nombre_semaines_demandees > 1 ? 's' : ''}</Badge>
                </div>
                
                {inscription.nombre_semaines_demandees === 1 ? (
                  <div className="space-y-3 text-sm">
                    {inscription.sejour_preference_1 && (
                      <div>
                        <p className="text-muted-foreground">Choix préféré</p>
                        <p className="font-medium">{getSejourTitle(inscription.sejour_preference_1)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_1)}</p>
                        {calculatePrice(inscription.sejour_preference_1) !== null && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Prix: {calculatePrice(inscription.sejour_preference_1)?.toFixed(2)} €
                          </Badge>
                        )}
                      </div>
                    )}
                    {inscription.sejour_preference_2 && (
                      <div>
                        <p className="text-muted-foreground">Choix secondaire</p>
                        <p className="font-medium">{getSejourTitle(inscription.sejour_preference_2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_2)}</p>
                        {calculatePrice(inscription.sejour_preference_2) !== null && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Prix: {calculatePrice(inscription.sejour_preference_2)?.toFixed(2)} €
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Semaine 1</h4>
                      {inscription.sejour_preference_1 && (
                        <div>
                          <p className="text-muted-foreground">Choix préféré</p>
                          <p className="font-medium">{getSejourTitle(inscription.sejour_preference_1)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_1)}</p>
                          {calculatePrice(inscription.sejour_preference_1) !== null && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Prix: {calculatePrice(inscription.sejour_preference_1)?.toFixed(2)} €
                            </Badge>
                          )}
                        </div>
                      )}
                      {inscription.sejour_preference_1_alternatif && (
                        <div>
                          <p className="text-muted-foreground">Choix secondaire</p>
                          <p className="font-medium">{getSejourTitle(inscription.sejour_preference_1_alternatif)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_1_alternatif)}</p>
                          {calculatePrice(inscription.sejour_preference_1_alternatif) !== null && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Prix: {calculatePrice(inscription.sejour_preference_1_alternatif)?.toFixed(2)} €
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Semaine 2</h4>
                      {inscription.sejour_preference_2 && (
                        <div>
                          <p className="text-muted-foreground">Choix préféré</p>
                          <p className="font-medium">{getSejourTitle(inscription.sejour_preference_2)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_2)}</p>
                          {calculatePrice(inscription.sejour_preference_2) !== null && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Prix: {calculatePrice(inscription.sejour_preference_2)?.toFixed(2)} €
                            </Badge>
                          )}
                        </div>
                      )}
                      {inscription.sejour_preference_2_alternatif && (
                        <div>
                          <p className="text-muted-foreground">Choix secondaire</p>
                          <p className="font-medium">{getSejourTitle(inscription.sejour_preference_2_alternatif)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_2_alternatif)}</p>
                          {calculatePrice(inscription.sejour_preference_2_alternatif) !== null && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Prix: {calculatePrice(inscription.sejour_preference_2_alternatif)?.toFixed(2)} €
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-primary" />
                <h3 className="text-lg font-semibold">Contact</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-sm">Responsable légal 1</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nom</p>
                      <p className="font-medium">{inscription.parent_first_name} {inscription.parent_last_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium text-xs">{inscription.parent_email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mobile</p>
                      <p className="font-medium">{inscription.parent_mobile}</p>
                    </div>
                    {inscription.parent_office_phone && (
                      <div>
                        <p className="text-muted-foreground">Tél. bureau</p>
                        <p className="font-medium">{inscription.parent_office_phone}</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <p className="text-muted-foreground">Adresse</p>
                      <p className="font-medium text-xs">{inscription.parent_address}</p>
                    </div>
                  </div>
                </div>

                {inscription.parent2_first_name && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-sm">Responsable légal 2</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Nom</p>
                        <p className="font-medium">{inscription.parent2_first_name} {inscription.parent2_last_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium text-xs">{inscription.parent2_email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mobile</p>
                        <p className="font-medium">{inscription.parent2_mobile}</p>
                      </div>
                      {inscription.parent2_office_phone && (
                        <div>
                          <p className="text-muted-foreground">Tél. bureau</p>
                          <p className="font-medium">{inscription.parent2_office_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contacts d'urgence */}
                {(inscription.urgency_contact_1_first_name || inscription.urgency_contact_2_first_name) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 text-sm">Contacts d'urgence</h4>
                      <div className="space-y-3">
                        {inscription.urgency_contact_1_first_name && (
                          <div className="bg-background rounded-lg p-3 border">
                            <p className="font-medium text-sm mb-2">Contact d'urgence 1</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Nom</p>
                                <p className="font-medium">{inscription.urgency_contact_1_first_name} {inscription.urgency_contact_1_last_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Relation</p>
                                <p className="font-medium capitalize">{inscription.urgency_contact_1_relation}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Mobile</p>
                                <p className="font-medium">{inscription.urgency_contact_1_mobile}</p>
                              </div>
                              {inscription.urgency_contact_1_other_phone && (
                                <div>
                                  <p className="text-muted-foreground">Autre tél.</p>
                                  <p className="font-medium">{inscription.urgency_contact_1_other_phone}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {inscription.urgency_contact_2_first_name && (
                          <div className="bg-background rounded-lg p-3 border">
                            <p className="font-medium text-sm mb-2">Contact d'urgence 2</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Nom</p>
                                <p className="font-medium">{inscription.urgency_contact_2_first_name} {inscription.urgency_contact_2_last_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Relation</p>
                                <p className="font-medium capitalize">{inscription.urgency_contact_2_relation}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Mobile</p>
                                <p className="font-medium">{inscription.urgency_contact_2_mobile}</p>
                              </div>
                              {inscription.urgency_contact_2_other_phone && (
                                <div>
                                  <p className="text-muted-foreground">Autre tél.</p>
                                  <p className="font-medium">{inscription.urgency_contact_2_other_phone}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Personnes autorisées */}
                {(inscription.authorized_person_1_first_name || inscription.authorized_person_2_first_name) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 text-sm">Personnes autorisées à récupérer l'enfant</h4>
                      <div className="space-y-3">
                        {inscription.authorized_person_1_first_name && (
                          <div className="bg-background rounded-lg p-3 border">
                            <p className="font-medium text-sm mb-2">Personne autorisée 1</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Nom</p>
                                <p className="font-medium">{inscription.authorized_person_1_first_name} {inscription.authorized_person_1_last_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Relation</p>
                                <p className="font-medium capitalize">{inscription.authorized_person_1_relation}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Mobile</p>
                                <p className="font-medium">{inscription.authorized_person_1_mobile}</p>
                              </div>
                              {inscription.authorized_person_1_other_phone && (
                                <div>
                                  <p className="text-muted-foreground">Autre tél.</p>
                                  <p className="font-medium">{inscription.authorized_person_1_other_phone}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {inscription.authorized_person_2_first_name && (
                          <div className="bg-background rounded-lg p-3 border">
                            <p className="font-medium text-sm mb-2">Personne autorisée 2</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Nom</p>
                                <p className="font-medium">{inscription.authorized_person_2_first_name} {inscription.authorized_person_2_last_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Relation</p>
                                <p className="font-medium capitalize">{inscription.authorized_person_2_relation}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Mobile</p>
                                <p className="font-medium">{inscription.authorized_person_2_mobile}</p>
                              </div>
                              {inscription.authorized_person_2_other_phone && (
                                <div>
                                  <p className="text-muted-foreground">Autre tél.</p>
                                  <p className="font-medium">{inscription.authorized_person_2_other_phone}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Documents */}
            {documents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Documents fournis</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAllDocuments(inscription.id)}
                  >
                    <FileArchive className="w-4 h-4 mr-2" />
                    Télécharger tout
                  </Button>
                </div>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">{doc.file_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informations importantes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-yellow-900">Informations importantes</h3>
                  <p className="text-sm text-yellow-800">
                    {inscription.has_allergies ? 'Allergies' : 'Aucune allergie signalée'}
                  </p>
                </div>
              </div>
            </div>

            {/* Pied de page */}
            <div className="text-center space-y-2 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Un email de confirmation a été envoyé à <span className="font-medium">{inscription.parent_email}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Votre inscription sera traitée par notre équipe. Vous recevrez une notification par les voies officielles.
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
