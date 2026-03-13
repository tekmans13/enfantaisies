import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Users as UsersIcon, Calendar, CheckCircle, XCircle, Clock, Edit, Plus, Trash2, Eye, MoreVertical, DollarSign, Send, FileDown, FileArchive, FileText, Download, Shield, LogOut, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { formatSejourTitre } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InscriptionEditDialog } from "@/components/InscriptionEditDialog";
import { InscriptionStatusBadge } from "@/components/InscriptionStatusBadge";
import { InscriptionRecapDialog } from "@/components/InscriptionRecapDialog";
import { SejourManageDialog } from "@/components/SejourManageDialog";
import { SejourDetailsDialog } from "@/components/SejourDetailsDialog";
import { HomeContentManageDialog } from "@/components/HomeContentManageDialog";
import { exportInscriptionsToExcel } from "@/lib/excelExport";
import { downloadAllDocuments } from "@/lib/downloadDocuments";

export default function Bureau() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, garcons: 0, filles: 0, enAttente: 0 });
  const [sejourStats, setSejourStats] = useState<any[]>([]);
  const [sejours, setSejours] = useState<any[]>([]);
  const [editingInscription, setEditingInscription] = useState<any>(null);
  const [editingSejour, setEditingSejour] = useState<any>(null);
  const [isCreatingSejour, setIsCreatingSejour] = useState(false);
  const [viewingSejour, setViewingSejour] = useState<any>(null);
  const [selectedGroupe, setSelectedGroupe] = useState<string>("all");
  const [sendingPayment, setSendingPayment] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteSejoursDialog, setShowDeleteSejoursDialog] = useState(false);
  const [showDeleteInscriptionsDialog, setShowDeleteInscriptionsDialog] = useState(false);
  const [deletingInscriptionId, setDeletingInscriptionId] = useState<string | null>(null);
  const [viewingInscriptionId, setViewingInscriptionId] = useState<string | null>(null);
  const [showHomeContentDialog, setShowHomeContentDialog] = useState(false);

  useEffect(() => {
    checkAdminRole();
    fetchInscriptions();
    fetchSejours();
    
    // Écouter les changements en temps réel sur les inscriptions
    const inscriptionsChannel = supabase
      .channel('inscriptions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inscriptions'
        },
        () => {
          fetchInscriptions();
        }
      )
      .subscribe();
    
    // Écouter les changements en temps réel sur les séjours
    const sejoursChannel = supabase
      .channel('sejours-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sejours'
        },
        () => {
          fetchSejours();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(inscriptionsChannel);
      supabase.removeChannel(sejoursChannel);
    };
  }, []);

  const checkAdminRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: isAdminRole } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });
      setIsAdmin(isAdminRole || false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  const fetchSejours = async () => {
    const { data, error } = await supabase
      .from('sejours')
      .select('*')
      .order('date_debut', { ascending: true });

    if (error) {
      console.error("Erreur chargement séjours:", error);
      return;
    }

    if (data) {
      setSejours(data);
    }
  };

  const fetchInscriptions = async () => {
    const { data, error } = await supabase
      .from('inscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setInscriptions(data);
      
      // Calculer les statistiques générales
      const total = data.length;
      const garcons = data.filter(i => i.child_gender === 'garcon').length;
      const filles = data.filter(i => i.child_gender === 'fille').length;
      const enAttente = data.filter(i => i.status === 'en_attente').length;
      
      setStats({ total, garcons, filles, enAttente });

      // Calculer les statistiques par séjour
      const sejourMap = new Map<string, { id: string; choix1: number; choix2: number; total: number }>();

      const incrementSejourStat = (sejourId: string, choix: 'choix1' | 'choix2') => {
        if (!sejourMap.has(sejourId)) {
          sejourMap.set(sejourId, { id: sejourId, choix1: 0, choix2: 0, total: 0 });
        }

        const stat = sejourMap.get(sejourId)!;
        stat[choix] += 1;
        stat.total += 1;
      };
      
      data.forEach(inscription => {
        const hasAttribution = Boolean(
          inscription.sejour_attribue_1 ||
          (inscription.nombre_semaines_demandees === 2 && inscription.sejour_attribue_2)
        );

        if (hasAttribution) {
          if (inscription.sejour_attribue_1) {
            incrementSejourStat(inscription.sejour_attribue_1, 'choix1');
          }

          if (inscription.nombre_semaines_demandees === 2 && inscription.sejour_attribue_2) {
            incrementSejourStat(inscription.sejour_attribue_2, 'choix2');
          }

          return;
        }

        if (inscription.sejour_preference_1) {
          incrementSejourStat(inscription.sejour_preference_1, 'choix1');
        }

        if (inscription.sejour_preference_2) {
          incrementSejourStat(inscription.sejour_preference_2, 'choix2');
        }
      });

      setSejourStats(Array.from(sejourMap.values()));
    }
  };

  const handleAttribuer = async (id: string) => {
    // Récupérer l'inscription pour connaître le séjour choisi
    const { data: inscription } = await supabase
      .from('inscriptions')
      .select('sejour_preference_1')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('inscriptions')
      .update({ 
        status: 'attribuee',
        validated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error && inscription && inscription.sejour_preference_1) {
      // Décrémenter les places disponibles du séjour
      const { data: sejour } = await supabase
        .from('sejours')
        .select('places_disponibles')
        .eq('id', inscription.sejour_preference_1)
        .single();

      if (sejour && sejour.places_disponibles > 0) {
        await supabase
          .from('sejours')
          .update({ places_disponibles: sejour.places_disponibles - 1 })
          .eq('id', inscription.sejour_preference_1);
      }
      
      fetchSejours();
    }

    if (!error) {
      fetchInscriptions();
      toast({
        title: "Inscription attribuée",
        description: "Le séjour a été attribué avec succès",
      });
    }
  };

  const handleDeleteSejour = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce séjour ?")) return;

    const { error } = await supabase
      .from('sejours')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchSejours();
      fetchInscriptions();
    }
  };

  const handleDeleteAllSejours = async () => {
    try {
      // D'abord, retirer les références aux séjours dans les inscriptions
      const { error: updateError } = await supabase
        .from('inscriptions')
        .update({
          sejour_preference_1: null,
          sejour_preference_2: null,
          sejour_preference_1_alternatif: null,
          sejour_preference_2_alternatif: null,
          sejour_attribue_1: null,
          sejour_attribue_2: null,
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (updateError) throw updateError;

      const { error } = await supabase
        .from('sejours')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast({
        title: "Séjours supprimés",
        description: "Tous les séjours ont été supprimés avec succès",
      });

      fetchSejours();
      fetchInscriptions();
      setShowDeleteSejoursDialog(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer les séjours",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllInscriptions = async () => {
    try {
      // Supprimer d'abord tous les documents associés
      const { error: docsError } = await supabase
        .from('inscription_documents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (docsError) throw docsError;

      const { error } = await supabase
        .from('inscriptions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast({
        title: "Inscriptions supprimées",
        description: "Toutes les inscriptions ont été supprimées avec succès",
      });

      fetchInscriptions();
      setShowDeleteInscriptionsDialog(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer les inscriptions",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInscription = async (inscriptionId: string) => {
    try {
      // Supprimer d'abord les documents associés
      const { error: docsError } = await supabase
        .from('inscription_documents')
        .delete()
        .eq('inscription_id', inscriptionId);

      if (docsError) throw docsError;

      // Puis supprimer l'inscription
      const { error: inscriptionError } = await supabase
        .from('inscriptions')
        .delete()
        .eq('id', inscriptionId);

      if (inscriptionError) throw inscriptionError;

      toast({
        title: "Inscription supprimée",
        description: "L'inscription a été supprimée avec succès",
      });

      fetchInscriptions();
      setDeletingInscriptionId(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'inscription",
        variant: "destructive",
      });
    }
  };

  const handleSendPayment = async (inscription: any) => {
    setSendingPayment(inscription.id);
    
    try {
      // Récupérer les tarifs
      const { data: tarifs } = await supabase
        .from('tarifs')
        .select('*')
        .eq('annee', 2025)
        .order('tarif_numero', { ascending: true });

      if (!tarifs || tarifs.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucun tarif configuré pour 2025",
          variant: "destructive",
        });
        return;
      }

      // Trouver le tarif correspondant au quotient familial
      // Si pas de QF, utiliser une valeur très élevée pour obtenir le tarif plein
      const qf = inscription.quotient_familial || 999999;
      const tarif = tarifs.find(t => 
        qf >= t.qf_min && (t.qf_max === null || qf <= t.qf_max)
      ) || tarifs[tarifs.length - 1];

      // Récupérer les séjours ATTRIBUÉS pour calculer le montant
      const sejourIds = [inscription.sejour_attribue_1, inscription.sejour_attribue_2].filter(Boolean);
      const { data: sejoursData } = await supabase
        .from('sejours')
        .select('*')
        .in('id', sejourIds);

      if (!sejoursData || sejoursData.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucun séjour attribué trouvé",
          variant: "destructive",
        });
        return;
      }

      // Calculer le montant total en fonction des séjours attribués
      let montantTotal = 0;
      sejoursData.forEach(sejour => {
        const dateDebut = new Date(sejour.date_debut);
        const dateFin = new Date(sejour.date_fin);
        const joursCalc = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const nbJours = (sejour as any).nombre_jours ?? joursCalc;
        
        const isCentreAere = sejour.type === 'centre_aere' || sejour.type === 'animation';
        const tarifJournalier = isCentreAere
          ? tarif.tarif_journee_centre_aere 
          : tarif.tarif_journee_sejour;
        
        montantTotal += Number(tarifJournalier) * nbJours;
      });
      
      // Si le 2ème séjour n'a pas pu être attribué, ajouter 0 (déjà fait, mais pour clarté)
      if (inscription.sejour_2_non_attribue) {
        // Le coût est déjà de 0, donc rien à ajouter
      }

      // Appeler la fonction edge
      const { data, error } = await supabase.functions.invoke('create-stripe-payment-link', {
        body: {
          inscriptionId: inscription.id,
          parentEmail: inscription.parent_email,
          parentName: `${inscription.parent_first_name} ${inscription.parent_last_name}`,
          childName: `${inscription.child_first_name} ${inscription.child_last_name}`,
          montantTotal: montantTotal,
          nombreSemaines: sejoursData.length,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Mettre à jour le statut à "envoyé"
        await supabase
          .from('inscriptions')
          .update({ status: 'envoye' })
          .eq('id', inscription.id);
        
        // Construire l'URL de recap
        const recapUrl = `${window.location.origin}/recap-inscription/${inscription.id}`;
        
        // Envoyer l'email avec le lien de paiement
        const { error: emailError } = await supabase.functions.invoke('send-inscription-email', {
          body: {
            inscriptionId: inscription.id,
            parentEmail: inscription.parent_email,
            parentName: `${inscription.parent_first_name} ${inscription.parent_last_name}`,
            childName: `${inscription.child_first_name} ${inscription.child_last_name}`,
            recapUrl: recapUrl,
            paymentUrl: data.paymentUrl,
            montantTotal: montantTotal,
          },
        });
        
        if (emailError) {
          console.error("Erreur lors de l'envoi de l'email:", emailError);
          toast({
            title: "Attention",
            description: "Lien créé mais email non envoyé",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Attribution et lien de paiement envoyés",
            description: `Email envoyé à ${inscription.parent_email} avec le montant attribué de ${montantTotal.toFixed(2)}€`,
          });
        }
        
        // Rafraîchir les inscriptions
        fetchInscriptions();
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error sending payment:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le lien de paiement",
        variant: "destructive",
      });
    } finally {
      setSendingPayment(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Gestion - Centre Aéré
            </h1>
            <p className="text-muted-foreground">
              Tableau de bord des inscriptions
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isAdmin && (
              <Button onClick={() => navigate("/admin/configuration")} variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </Button>
            )}
            <Button onClick={() => setShowHomeContentDialog(true)} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Page Accueil
            </Button>
            <Button onClick={() => navigate("/tarifs")} variant="outline" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Gérer les tarifs
            </Button>
            <Button onClick={() => navigate("/admin/users")} variant="outline" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              Utilisateurs
            </Button>
            <Button onClick={() => navigate("/documents")} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </Button>
            <Button onClick={handleLogout} variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </Button>
          </div>
        </div>

        {/* Statistiques générales */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Inscrits</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Garçons</p>
                <p className="text-2xl font-bold text-foreground">{stats.garcons}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Filles</p>
                <p className="text-2xl font-bold text-foreground">{stats.filles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold text-foreground">{stats.enAttente}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Gestion des séjours par groupe */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Gestion des séjours</h2>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreatingSejour(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau séjour
              </Button>
              {isAdmin && (
                <Button 
                  onClick={() => setShowDeleteSejoursDialog(true)} 
                  variant="destructive" 
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer tous
                </Button>
              )}
            </div>
          </div>

          <Tabs value={selectedGroupe} onValueChange={setSelectedGroupe} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="pitchouns">Pitchouns</TabsTrigger>
              <TabsTrigger value="minots">Minots</TabsTrigger>
              <TabsTrigger value="mias">Mias</TabsTrigger>
            </TabsList>

            {['all', 'pitchouns', 'minots', 'mias'].map((groupe) => (
              <TabsContent key={groupe} value={groupe} className="mt-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sejours
                    .filter(sejour => groupe === 'all' || sejour.groupe_age === groupe)
                    .map((sejour) => {
                      const stats = sejourStats.find(s => s.id === sejour.id);
                      
                      return (
                        <Card 
                          key={sejour.id} 
                          className="p-4 border-2 cursor-pointer hover:border-primary/50 transition-colors relative"
                          onClick={() => setViewingSejour(sejour)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold">{formatSejourTitre(sejour)}</h3>
                                {sejour.lieu && (
                                  <p className="text-xs text-muted-foreground">{sejour.lieu}</p>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {sejour.groupe_age}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingSejour(sejour);
                                    }}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSejour(sejour.id);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            {stats && (
                              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-primary">{stats.choix1}</p>
                                  <p className="text-xs text-muted-foreground">1er choix</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-secondary">{stats.choix2}</p>
                                  <p className="text-xs text-muted-foreground">2ème choix</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                                  <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="pt-2 border-t space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Places demandées 1er choix</span>
                                <span className="font-semibold text-primary">{stats ? stats.choix1 : 0}/{sejour.places_disponibles}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Places demandées total</span>
                                <span className="font-semibold">{stats ? stats.total : 0}/{sejour.places_disponibles}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Liste des inscriptions {selectedGroupe !== "all" && `- ${selectedGroupe.charAt(0).toUpperCase() + selectedGroupe.slice(1)}`}
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => exportInscriptionsToExcel(inscriptions, sejours)}
                variant="outline"
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Exporter Excel
              </Button>
              {isAdmin && (
                <Button 
                  onClick={() => setShowDeleteInscriptionsDialog(true)} 
                  variant="destructive" 
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Vider toutes
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enfant</TableHead>
                  <TableHead>Âge/Groupe</TableHead>
                  <TableHead>S1 - Choix prioritaire</TableHead>
                  <TableHead>S1 - Choix alternatif</TableHead>
                  <TableHead>S2 - Choix prioritaire</TableHead>
                  <TableHead>S2 - Choix alternatif</TableHead>
                  <TableHead>Prioritaire</TableHead>
                  <TableHead>Adhésion</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscriptions
                  .filter(inscription => selectedGroupe === "all" || inscription.child_age_group === selectedGroupe)
                  .map((inscription, index) => {
                    const is2Weeks = inscription.nombre_semaines_demandees === 2;
                    // For 1 week: pref1 = priority, pref2 = alternative, no S2
                    // For 2 weeks: pref1 = S1 priority, pref1_alt = S1 alt, pref2 = S2 priority, pref2_alt = S2 alt
                    const s1Priority = inscription.sejour_preference_1;
                    const s1Alt = is2Weeks ? inscription.sejour_preference_1_alternatif : inscription.sejour_preference_2;
                    const s2Priority = is2Weeks ? inscription.sejour_preference_2 : null;
                    const s2Alt = is2Weeks ? inscription.sejour_preference_2_alternatif : null;

                    const renderSejour = (sejourId: string | null) => {
                      if (!sejourId) return <span className="text-xs text-muted-foreground">-</span>;
                      const s = sejours.find(s => s.id === sejourId);
                      return <span className="text-xs">{s ? formatSejourTitre(s) : 'N/A'}</span>;
                    };

                    return (
                  <TableRow 
                    key={inscription.id}
                    className={index > 0 ? 'border-t' : ''}
                  >
                    <TableCell className="py-2">
                      <div>
                        {inscription.demande_specifique ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-sm cursor-help">{inscription.child_first_name} {inscription.child_last_name}</p>
                                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p className="text-xs">{inscription.demande_specifique}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <p className="font-semibold text-sm">{inscription.child_first_name} {inscription.child_last_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {inscription.child_gender === 'garcon' ? '👦' : '👧'} {inscription.child_class}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="capitalize text-xs">
                        {inscription.child_age_group || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">{renderSejour(s1Priority)}</TableCell>
                    <TableCell className="py-2">{renderSejour(s1Alt)}</TableCell>
                    <TableCell className="py-2">{renderSejour(s2Priority)}</TableCell>
                    <TableCell className="py-2">{renderSejour(s2Alt)}</TableCell>
                    <TableCell className="py-2 text-center">
                      <Checkbox
                        checked={inscription.is_prioritaire || false}
                        onCheckedChange={async (checked) => {
                          await supabase.from('inscriptions').update({ is_prioritaire: !!checked }).eq('id', inscription.id);
                          fetchInscriptions();
                        }}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <Checkbox
                        checked={inscription.has_adhesion || false}
                        onCheckedChange={async (checked) => {
                          await supabase.from('inscriptions').update({ has_adhesion: !!checked }).eq('id', inscription.id);
                          fetchInscriptions();
                        }}
                      />
                    </TableCell>
                     <TableCell className="py-2">
                       <InscriptionStatusBadge status={inscription.status} size="sm" />
                     </TableCell>
                      <TableCell className="py-2">
                        <span className="text-xs">{new Date(inscription.created_at).toLocaleDateString('fr-FR')}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex gap-1">
                          <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="h-7 w-7 p-0"
                                 onClick={() => handleSendPayment(inscription)}
                                 disabled={sendingPayment === inscription.id || inscription.status === 'paye'}
                               >
                                 <Send className="w-3 h-3" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>Envoyer lien paiement</p>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                         
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setViewingInscriptionId(inscription.id)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Voir le récapitulatif</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                         
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="h-7 w-7 p-0"
                                 onClick={async () => {
                                   try {
                                     await downloadAllDocuments(inscription.id);
                                     toast({
                                       title: "Téléchargement réussi",
                                       description: "Documents téléchargés en ZIP",
                                     });
                                   } catch (error) {
                                     toast({
                                       title: "Erreur",
                                       description: "Aucun document trouvé",
                                       variant: "destructive",
                                     });
                                   }
                                 }}
                               >
                                 <FileArchive className="w-3 h-3" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>Télécharger documents</p>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                         
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="h-7 w-7 p-0"
                                 onClick={() => setEditingInscription(inscription)}
                                 disabled={inscription.status === 'paye'}
                               >
                                 <Edit className="w-3 h-3" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>Attribuer</p>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                         
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                 onClick={() => setDeletingInscriptionId(inscription.id)}
                               >
                                 <Trash2 className="w-3 h-3" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>Supprimer</p>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                       </div>
                     </TableCell>
                   </TableRow>
                   );
                 })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <InscriptionEditDialog
        inscription={editingInscription}
        open={!!editingInscription}
        onOpenChange={(open) => !open && setEditingInscription(null)}
        onSuccess={fetchInscriptions}
      />

      <SejourManageDialog
        sejour={editingSejour}
        open={isCreatingSejour || !!editingSejour}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreatingSejour(false);
            setEditingSejour(null);
          }
        }}
        onSuccess={(updatedSejour) => {
          if (updatedSejour?.id) {
            setSejours((prev) =>
              prev.map((item) => (item.id === updatedSejour.id ? { ...item, ...updatedSejour } : item))
            );
            setViewingSejour((prev) =>
              prev?.id === updatedSejour.id ? { ...prev, ...updatedSejour } : prev
            );
          }
          fetchSejours();
          fetchInscriptions();
        }}
      />

      <SejourDetailsDialog
        sejour={viewingSejour}
        open={!!viewingSejour}
        onOpenChange={(open) => !open && setViewingSejour(null)}
      />

      <InscriptionRecapDialog
        inscriptionId={viewingInscriptionId}
        open={!!viewingInscriptionId}
        onOpenChange={(open) => !open && setViewingInscriptionId(null)}
      />

      <AlertDialog open={showDeleteSejoursDialog} onOpenChange={setShowDeleteSejoursDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer tous les séjours ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les séjours seront définitivement supprimés de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllSejours} className="bg-destructive hover:bg-destructive/90">
              Supprimer tous les séjours
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteInscriptionsDialog} onOpenChange={setShowDeleteInscriptionsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vider toutes les inscriptions ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les inscriptions seront définitivement supprimées de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllInscriptions} className="bg-destructive hover:bg-destructive/90">
              Vider les inscriptions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingInscriptionId} onOpenChange={(open) => !open && setDeletingInscriptionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette inscription ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'inscription et tous les documents associés seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingInscriptionId && handleDeleteInscription(deletingInscriptionId)} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer l'inscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HomeContentManageDialog
        open={showHomeContentDialog}
        onOpenChange={setShowHomeContentDialog}
      />
    </div>
  );
}
