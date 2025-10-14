import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface TarifManageDialogProps {
  tarif?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TarifManageDialog = ({
  tarif,
  open,
  onOpenChange,
  onSuccess,
}: TarifManageDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    annee: 2025,
    tarif_numero: "",
    qf_min: "",
    qf_max: "",
    tarif_journee_centre_aere: "",
    tarif_journee_sejour: "",
    tarif_semaine_centre_aere: "",
    tarif_semaine_sejour: "",
  });

  useEffect(() => {
    if (tarif) {
      setFormData({
        annee: tarif.annee || 2025,
        tarif_numero: tarif.tarif_numero?.toString() || "",
        qf_min: tarif.qf_min?.toString() || "",
        qf_max: tarif.qf_max?.toString() || "",
        tarif_journee_centre_aere: tarif.tarif_journee_centre_aere?.toString() || "",
        tarif_journee_sejour: tarif.tarif_journee_sejour?.toString() || "",
        tarif_semaine_centre_aere: tarif.tarif_semaine_centre_aere?.toString() || "",
        tarif_semaine_sejour: tarif.tarif_semaine_sejour?.toString() || "",
      });
    } else {
      setFormData({
        annee: 2025,
        tarif_numero: "",
        qf_min: "",
        qf_max: "",
        tarif_journee_centre_aere: "",
        tarif_journee_sejour: "",
        tarif_semaine_centre_aere: "",
        tarif_semaine_sejour: "",
      });
    }
  }, [tarif]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tarifData = {
      annee: formData.annee,
      tarif_numero: parseInt(formData.tarif_numero),
      qf_min: parseInt(formData.qf_min),
      qf_max: formData.qf_max ? parseInt(formData.qf_max) : null,
      tarif_journee_centre_aere: parseFloat(formData.tarif_journee_centre_aere),
      tarif_journee_sejour: parseFloat(formData.tarif_journee_sejour),
      tarif_semaine_centre_aere: parseFloat(formData.tarif_semaine_centre_aere),
      tarif_semaine_sejour: parseFloat(formData.tarif_semaine_sejour),
    };

    try {
      if (tarif) {
        const { error } = await supabase
          .from("tarifs")
          .update(tarifData)
          .eq("id", tarif.id);

        if (error) throw error;

        toast({
          title: "Tarif modifié",
          description: "Le tarif a été modifié avec succès",
        });
      } else {
        const { error } = await supabase
          .from("tarifs")
          .insert([tarifData]);

        if (error) throw error;

        toast({
          title: "Tarif créé",
          description: "Le tarif a été créé avec succès",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {tarif ? "Modifier le tarif" : "Créer un nouveau tarif"}
          </DialogTitle>
          <DialogDescription>
            Définissez les tarifs pour une tranche de quotient familial
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tarif_numero">Numéro de tarif</Label>
                <Input
                  id="tarif_numero"
                  type="number"
                  value={formData.tarif_numero}
                  onChange={(e) =>
                    setFormData({ ...formData, tarif_numero: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qf_min">QF Min</Label>
                <Input
                  id="qf_min"
                  type="number"
                  value={formData.qf_min}
                  onChange={(e) =>
                    setFormData({ ...formData, qf_min: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qf_max">QF Max</Label>
                <Input
                  id="qf_max"
                  type="number"
                  value={formData.qf_max}
                  onChange={(e) =>
                    setFormData({ ...formData, qf_max: e.target.value })
                  }
                  placeholder="Laisser vide si illimité"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tarif_journee_centre_aere">Tarif/jour Centre Aéré (€)</Label>
                <Input
                  id="tarif_journee_centre_aere"
                  type="number"
                  step="0.01"
                  value={formData.tarif_journee_centre_aere}
                  onChange={(e) =>
                    setFormData({ ...formData, tarif_journee_centre_aere: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarif_semaine_centre_aere">Tarif/semaine Centre Aéré (€)</Label>
                <Input
                  id="tarif_semaine_centre_aere"
                  type="number"
                  step="0.01"
                  value={formData.tarif_semaine_centre_aere}
                  onChange={(e) =>
                    setFormData({ ...formData, tarif_semaine_centre_aere: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tarif_journee_sejour">Tarif/jour Séjour (€)</Label>
                <Input
                  id="tarif_journee_sejour"
                  type="number"
                  step="0.01"
                  value={formData.tarif_journee_sejour}
                  onChange={(e) =>
                    setFormData({ ...formData, tarif_journee_sejour: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarif_semaine_sejour">Tarif/semaine Séjour (€)</Label>
                <Input
                  id="tarif_semaine_sejour"
                  type="number"
                  step="0.01"
                  value={formData.tarif_semaine_sejour}
                  onChange={(e) =>
                    setFormData({ ...formData, tarif_semaine_sejour: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {tarif ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
