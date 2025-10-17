import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Calendar, User, Mail, Phone, FileText, Home, Info, Download, FileArchive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { downloadDocument, downloadAllDocuments } from "@/lib/downloadDocuments";
import { useToast } from "@/hooks/use-toast";

export default function RecapInscription() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inscription, setInscription] = useState<any>(null);
  const [sejours, setSejours] = useState<any[]>([]);
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInscription = async () => {
      if (!id) return;

      try {
        const { data: inscriptionData, error: inscriptionError } = await supabase
          .from('inscriptions')
          .select('*')
          .eq('id', id)
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
          .eq('inscription_id', id);

        if (documentsError) throw documentsError;
        setDocuments(documentsData || []);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInscription();
  }, [id]);

  const getSejourTitle = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    return sejour ? sejour.titre : 'Non spécifié';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!inscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Inscription non trouvée</p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 shadow-soft">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Inscription enregistrée !
            </h1>
            <p className="text-muted-foreground">
              Nous avons bien reçu votre demande d'inscription
            </p>
            <Badge variant="outline" className="mt-4">
              Référence : #{inscription.id.slice(0, 8)}
            </Badge>
          </div>

          <Separator className="my-8" />

          <div className="space-y-6">
            {/* Informations de l'enfant */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Informations de l'enfant</h2>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{inscription.child_first_name} {inscription.child_last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">{formatDate(inscription.child_birth_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Classe (septembre 2025)</p>
                    <p className="font-medium">{getClassLabel(inscription.child_class)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Groupe d'âge</p>
                    <Badge variant="secondary">{getAgeGroupLabel(inscription.child_age_group)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">École</p>
                    <p className="font-medium">{inscription.child_school}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sexe</p>
                    <p className="font-medium">{inscription.child_gender === 'garcon' ? 'Garçon' : 'Fille'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarif */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Tarif</h2>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quotient familial</p>
                    <p className="font-medium">{inscription.quotient_familial || 'Non renseigné (tarif max. appliqué)'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Numéro d'allocataire CAF</p>
                    <p className="font-medium">{inscription.caf_number || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Séjours choisis */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Séjours demandés</h2>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Nombre de semaines</p>
                  <Badge>{inscription.nombre_semaines_demandees} semaine{inscription.nombre_semaines_demandees > 1 ? 's' : ''}</Badge>
                </div>
                
                {inscription.nombre_semaines_demandees === 1 ? (
                  <div className="space-y-3">
                    {inscription.sejour_preference_1 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Choix préféré</p>
                        <p className="font-medium">{getSejourTitle(inscription.sejour_preference_1)}</p>
                        <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_1)}</p>
                        {calculatePrice(inscription.sejour_preference_1) !== null && (
                          <Badge variant="secondary" className="mt-2">
                            Prix: {calculatePrice(inscription.sejour_preference_1)?.toFixed(2)} €
                          </Badge>
                        )}
                      </div>
                    )}
                    {inscription.sejour_preference_2 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Choix secondaire</p>
                        <p className="font-medium">{getSejourTitle(inscription.sejour_preference_2)}</p>
                        <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_2)}</p>
                        {calculatePrice(inscription.sejour_preference_2) !== null && (
                          <Badge variant="secondary" className="mt-2">
                            Prix: {calculatePrice(inscription.sejour_preference_2)?.toFixed(2)} €
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Première semaine */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-primary">Première semaine</h3>
                      {inscription.sejour_preference_1 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Choix préféré</p>
                          <p className="font-medium">{getSejourTitle(inscription.sejour_preference_1)}</p>
                          <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_1)}</p>
                          {calculatePrice(inscription.sejour_preference_1) !== null && (
                            <Badge variant="secondary" className="mt-2">
                              Prix: {calculatePrice(inscription.sejour_preference_1)?.toFixed(2)} €
                            </Badge>
                          )}
                        </div>
                      )}
                      {inscription.sejour_preference_1_alternatif && (
                        <div>
                          <p className="text-sm text-muted-foreground">Choix secondaire</p>
                          <p className="font-medium text-muted-foreground">{getSejourTitle(inscription.sejour_preference_1_alternatif)}</p>
                          <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_1_alternatif)}</p>
                          {calculatePrice(inscription.sejour_preference_1_alternatif) !== null && (
                            <Badge variant="secondary" className="mt-2">
                              Prix: {calculatePrice(inscription.sejour_preference_1_alternatif)?.toFixed(2)} €
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Deuxième semaine */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-primary">Deuxième semaine</h3>
                      {inscription.sejour_preference_2 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Choix préféré</p>
                          <p className="font-medium">{getSejourTitle(inscription.sejour_preference_2)}</p>
                          <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_2)}</p>
                          {calculatePrice(inscription.sejour_preference_2) !== null && (
                            <Badge variant="secondary" className="mt-2">
                              Prix: {calculatePrice(inscription.sejour_preference_2)?.toFixed(2)} €
                            </Badge>
                          )}
                        </div>
                      )}
                      {inscription.sejour_preference_2_alternatif && (
                        <div>
                          <p className="text-sm text-muted-foreground">Choix secondaire</p>
                          <p className="font-medium text-muted-foreground">{getSejourTitle(inscription.sejour_preference_2_alternatif)}</p>
                          <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_2_alternatif)}</p>
                          {calculatePrice(inscription.sejour_preference_2_alternatif) !== null && (
                            <Badge variant="secondary" className="mt-2">
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

            {/* Contact parent */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Contact des responsables légaux</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3">Responsable légal 1</h3>
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nom complet</p>
                        <p className="font-medium">{inscription.parent_first_name} {inscription.parent_last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{inscription.parent_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Téléphone mobile</p>
                        <p className="font-medium">{inscription.parent_mobile}</p>
                      </div>
                      {inscription.parent_office_phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone bureau</p>
                          <p className="font-medium">{inscription.parent_office_phone}</p>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Adresse</p>
                        <p className="font-medium">{inscription.parent_address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {inscription.parent2_first_name && (
                  <div className="bg-muted/50 rounded-lg p-6">
                    <h3 className="font-semibold mb-3">Responsable légal 2</h3>
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Nom complet</p>
                          <p className="font-medium">{inscription.parent2_first_name} {inscription.parent2_last_name}</p>
                        </div>
                        {inscription.parent2_email && (
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{inscription.parent2_email}</p>
                          </div>
                        )}
                        {inscription.parent2_mobile && (
                          <div>
                            <p className="text-sm text-muted-foreground">Téléphone mobile</p>
                            <p className="font-medium">{inscription.parent2_mobile}</p>
                          </div>
                        )}
                        {inscription.parent2_office_phone && (
                          <div>
                            <p className="text-sm text-muted-foreground">Téléphone bureau</p>
                            <p className="font-medium">{inscription.parent2_office_phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Demande spécifique */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Demande spécifique</h2>
              </div>
              <div className="bg-muted/50 rounded-lg p-6">
                <p className="text-sm text-muted-foreground">
                  {inscription.demande_specifique || 'Vide'}
                </p>
              </div>
            </div>

            {/* Informations complémentaires */}
            {(inscription.has_medication || inscription.has_allergies || inscription.has_food_allergies) && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Informations importantes</h2>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 space-y-2">
                  {inscription.has_medication && (
                    <p className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900">⚠️</Badge>
                      Traitement médicamenteux
                    </p>
                  )}
                  {inscription.has_allergies && (
                    <p className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900">⚠️</Badge>
                      Allergies
                    </p>
                  )}
                  {inscription.has_food_allergies && (
                    <p className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900">⚠️</Badge>
                      Allergies alimentaires
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Documents uploadés */}
            {documents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Documents fournis</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await downloadAllDocuments(inscription.id);
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
                    }}
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
                          onClick={async () => {
                            try {
                              await downloadDocument(doc.file_path, doc.file_name);
                              toast({
                                title: "Téléchargement réussi",
                                description: doc.file_name,
                              });
                            } catch (error) {
                              toast({
                                title: "Erreur",
                                description: "Impossible de télécharger le document",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-8" />

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Un email de confirmation a été envoyé à <strong>{inscription.parent_email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Votre inscription sera traitée par notre équipe. Vous recevrez une notification une fois validée.
            </p>
            <Button onClick={() => navigate('/')} className="gap-2">
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
