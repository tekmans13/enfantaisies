import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { TarifManageDialog } from "@/components/TarifManageDialog";

const Tarifs = () => {
  const navigate = useNavigate();
  const [selectedTarif, setSelectedTarif] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tarifs, isLoading, refetch } = useQuery({
    queryKey: ['tarifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifs')
        .select('*')
        .eq('annee', 2025)
        .order('tarif_numero', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (tarif: any) => {
    setSelectedTarif(tarif);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTarif(null);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    refetch();
    setIsDialogOpen(false);
  };

  const formatQF = (min: number, max: number | null) => {
    if (max === null) {
      return `${min} < QF`;
    }
    return `${min} < QF < ${max}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/bureau")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Tarifs 2025</h1>
            <p className="text-muted-foreground">
              Gestion des tarifs pour les centres aérés et séjours - Tarifs à la semaine (5 jours)
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau tarif
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Tarif</TableHead>
                <TableHead>Quotient Familial</TableHead>
                <TableHead className="text-right">Tarif/jour Centre Aéré</TableHead>
                <TableHead className="text-right">Tarif/semaine Centre Aéré</TableHead>
                <TableHead className="text-right">Tarif/jour Séjour</TableHead>
                <TableHead className="text-right">Tarif/semaine Séjour</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tarifs?.map((tarif) => (
                <TableRow key={tarif.id}>
                  <TableCell className="font-medium">{tarif.tarif_numero}</TableCell>
                  <TableCell>{formatQF(tarif.qf_min, tarif.qf_max)}</TableCell>
                  <TableCell className="text-right">{tarif.tarif_journee_centre_aere} €</TableCell>
                  <TableCell className="text-right font-semibold">{tarif.tarif_semaine_centre_aere} €</TableCell>
                  <TableCell className="text-right">{tarif.tarif_journee_sejour} €</TableCell>
                  <TableCell className="text-right font-semibold">{tarif.tarif_semaine_sejour} €</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(tarif)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Les tarifs affichés sont pour une semaine de 5 jours
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            📋 Adhésion à l'association : 20 € par famille et par an
          </p>
        </div>
      </div>

      <TarifManageDialog
        tarif={selectedTarif}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Tarifs;
