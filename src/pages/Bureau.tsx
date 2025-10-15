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
import { Users as UsersIcon, Calendar, CheckCircle, XCircle, Clock, Edit, Plus, Trash2, Eye, MoreVertical, DollarSign, Send, FileDown, FileArchive, FileText, Download, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { SejourManageDialog } from "@/components/SejourManageDialog";
import { SejourDetailsDialog } from "@/components/SejourDetailsDialog";
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

  const fetchSejours = async () => {
    const { data } = await supabase
      .from('sejours')
      .select('*')
      .order('date_debut', { ascending: true });
    
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
      const sejourMap = new Map();
      
      data.forEach(inscription => {
        // Premier choix
        if (inscription.sejour_preference_1) {
          const key = inscription.sejour_preference_1;
          if (!sejourMap.has(key)) {
            sejourMap.set(key, { id: key, choix1: 0, choix2: 0, total: 0 });
          }
          const stat = sejourMap.get(key);
          stat.choix1++;
          stat.total++;
        }
        
        // Second choix
        if (inscription.sejour_preference_2) {
          const key = inscription.sejour_preference_2;
          if (!sejourMap.has(key)) {
            sejourMap.set(key, { id: key, choix1: 0, choix2: 0, total: 0 });
          }
          const stat = sejourMap.get(key);
          stat.choix2++;
          stat.total++;
        }
      });

      setSejourStats(Array.from(sejourMap.values()));
    }
  };

  const handleValidate = async (id: string, status: 'validee' | 'refusee') => {
    // Récupérer l'inscription pour connaître le séjour choisi
    const { data: inscription } = await supabase
      .from('inscriptions')
      .select('sejour_preference_1')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('inscriptions')
      .update({ 
        status,
        validated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error && inscription && status === 'validee' && inscription.sejour_preference_1) {
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
      const { error } = await supabase
        .from('sejours')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

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
      const { error } = await supabase
        .from('inscriptions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

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
      const qf = inscription.quotient_familial || 0;
      const tarif = tarifs.find(t => 
        qf >= t.qf_min && (t.qf_max === null || qf <= t.qf_max)
      ) || tarifs[tarifs.length - 1];

      // Récupérer les séjours pour calculer le montant
      const sejourIds = [inscription.sejour_preference_1, inscription.sejour_preference_2].filter(Boolean);
      const { data: sejoursData } = await supabase
        .from('sejours')
        .select('*')
        .in('id', sejourIds);

      if (!sejoursData || sejoursData.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucun séjour trouvé",
          variant: "destructive",
        });
        return;
      }

      // Calculer le montant total
      let montantTotal = 0;
      sejoursData.forEach(sejour => {
        const dateDebut = new Date(sejour.date_debut);
        const dateFin = new Date(sejour.date_fin);
        const nbJours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const isCentreAere = sejour.type === 'centre_aere' || sejour.type === 'animation';
        const tarifJournalier = isCentreAere
          ? tarif.tarif_journee_centre_aere 
          : tarif.tarif_journee_sejour;
        
        montantTotal += Number(tarifJournalier) * nbJours;
      });

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
        // Copier le lien dans le presse-papier
        await navigator.clipboard.writeText(data.paymentUrl);
        
        // Ouvrir le lien dans un nouvel onglet
        window.open(data.paymentUrl, '_blank');
        
        toast({
          title: "Lien de paiement créé",
          description: `Lien copié et ouvert. Montant: ${montantTotal.toFixed(2)}€`,
        });
        
        // Afficher aussi dans une alerte pour pouvoir copier manuellement si besoin
        setTimeout(() => {
          alert(`Lien de paiement Stripe:\n\n${data.paymentUrl}\n\nMontant: ${montantTotal.toFixed(2)}€\nNombre de semaines: ${sejoursData.length}`);
        }, 500);
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
              Gestion Bureau - Centre Aéré
            </h1>
            <p className="text-muted-foreground">
              Tableau de bord des inscriptions
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isAdmin && (
              <>
                <Button 
                  onClick={() => {
                    const currentMode = localStorage.getItem('debugMode') === 'true';
                    localStorage.setItem('debugMode', (!currentMode).toString());
                    toast({
                      title: currentMode ? "Mode Debug désactivé" : "Mode Debug activé",
                      description: currentMode ? "La validation des champs est maintenant active" : "La validation des champs est désactivée",
                    });
                  }} 
                  variant={localStorage.getItem('debugMode') === 'true' ? "default" : "outline"}
                  className="gap-2"
                >
                  {localStorage.getItem('debugMode') === 'true' ? "Debug: ON" : "Debug: OFF"}
                </Button>
                <Button onClick={() => navigate("/admin/users")} variant="outline" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Gérer les utilisateurs
                </Button>
              </>
            )}
            <Button onClick={() => navigate("/tarifs")} variant="outline" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Gérer les tarifs
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
                                <h3 className="font-semibold">{sejour.titre}</h3>
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
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Choix principal</TableHead>
                  <TableHead>Choix secondaire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscriptions
                  .filter(inscription => selectedGroupe === "all" || inscription.child_age_group === selectedGroupe)
                  .map((inscription) => (
                  <TableRow key={inscription.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{inscription.child_first_name} {inscription.child_last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {inscription.child_gender === 'garcon' ? '👦' : '👧'} {inscription.child_class}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {inscription.child_age_group || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inscription.parent_mobile}
                    </TableCell>
                    <TableCell>
                      {inscription.sejour_preference_1 ? (
                        <span className="text-sm">
                          {sejours.find(s => s.id === inscription.sejour_preference_1)?.titre || 'N/A'}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inscription.sejour_preference_2 ? (
                        <span className="text-sm">
                          {sejours.find(s => s.id === inscription.sejour_preference_2)?.titre || 'N/A'}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inscription.status === 'en_attente' && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500">
                          <Clock className="w-3 h-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                      {inscription.status === 'validee' && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validée
                        </Badge>
                      )}
                      {inscription.status === 'refusee' && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500">
                          <XCircle className="w-3 h-3 mr-1" />
                          Refusée
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {inscription.paiement_statut === 'paye' && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                          ✓ Payé
                        </Badge>
                      )}
                      {inscription.paiement_statut === 'en_attente' && (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500">
                          En attente
                        </Badge>
                      )}
                      {inscription.paiement_statut === 'echoue' && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500">
                          Échoué
                        </Badge>
                      )}
                      {inscription.paiement_statut === 'rembourse' && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500">
                          Remboursé
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(inscription.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
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
                          <FileArchive className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingInscription(inscription)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {inscription.status === 'en_attente' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleValidate(inscription.id, 'validee')}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleValidate(inscription.id, 'refusee')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {inscription.status === 'validee' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendPayment(inscription)}
                            disabled={sendingPayment === inscription.id}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            {sendingPayment === inscription.id ? 'Envoi...' : 'Paiement'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
        onSuccess={() => {
          fetchSejours();
          fetchInscriptions();
        }}
      />

      <SejourDetailsDialog
        sejour={viewingSejour}
        open={!!viewingSejour}
        onOpenChange={(open) => !open && setViewingSejour(null)}
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
    </div>
  );
}
