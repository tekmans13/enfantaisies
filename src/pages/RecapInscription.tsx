/**
 * Page : Récapitulatif d'inscription
 * Affiche le détail complet d'une inscription après sa soumission
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Home, Info, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTarifCalculator } from "@/hooks/use-tarif-calculator";
import { ChildInfo } from "@/components/recap/ChildInfo";
import { ParentInfo } from "@/components/recap/ParentInfo";
import { SejourInfo } from "@/components/recap/SejourInfo";
import { DocumentsList } from "@/components/recap/DocumentsList";

export default function RecapInscription() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inscription, setInscription] = useState<any>(null);
  const [sejours, setSejours] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Utiliser le hook de calcul de tarifs
  const { calculatePrice } = useTarifCalculator(inscription?.quotient_familial);

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

  /**
   * Calcule le prix d'un séjour donné
   */
  const calculateSejourPrice = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    return sejour ? calculatePrice(sejour) : null;
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
            <div className="mt-4 text-xs text-muted-foreground">
              Référence de l'inscription : #{inscription.id.slice(0, 8)}
            </div>
          </div>

          <Separator className="my-8" />

          <div className="space-y-6">
            {/* Informations de l'enfant */}
            <ChildInfo inscription={inscription} />

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
            <SejourInfo 
              inscription={inscription} 
              sejours={sejours} 
              calculatePrice={calculateSejourPrice} 
            />

            {/* Contact parent */}
            <ParentInfo inscription={inscription} />

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
            {(inscription.has_medication || inscription.has_allergies || inscription.food_allergies_details) && (
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
                  {inscription.food_allergies_details && (
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900">⚠️</Badge>
                        Allergies alimentaires / pratiques alimentaires spécifiques
                      </p>
                      <p className="text-sm ml-8 p-3 bg-background rounded border border-amber-200 dark:border-amber-800">
                        {inscription.food_allergies_details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents uploadés */}
            <DocumentsList inscriptionId={inscription.id} documents={documents} />

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
          </div>

          <Separator className="my-8" />

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Un email de confirmation a été envoyé à <strong>{inscription.parent_email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Votre inscription sera traitée par notre équipe. Vous recevrez une notification par les voies officielles.
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
