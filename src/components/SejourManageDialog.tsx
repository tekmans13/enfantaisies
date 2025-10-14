import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SejourManageDialogProps {
  sejour?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SejourManageDialog({
  sejour,
  open,
  onOpenChange,
  onSuccess,
}: SejourManageDialogProps) {
  const [formData, setFormData] = useState({
    titre: "",
    lieu: "",
    date_debut: "",
    date_fin: "",
    groupe_age: "",
    places_disponibles: 0,
    type: "centre_aere"
  });
  const { toast } = useToast();

  useEffect(() => {
    if (sejour) {
      setFormData({
        titre: sejour.titre || "",
        lieu: sejour.lieu || "",
        date_debut: sejour.date_debut || "",
        date_fin: sejour.date_fin || "",
        groupe_age: sejour.groupe_age || "",
        places_disponibles: sejour.places_disponibles || 0,
        type: sejour.type || "centre_aere"
      });
    } else {
      setFormData({
        titre: "",
        lieu: "",
        date_debut: "",
        date_fin: "",
        groupe_age: "",
        places_disponibles: 0,
        type: "centre_aere"
      });
    }
  }, [sejour, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sejour) {
      // Modification
      const { error } = await supabase
        .from('sejours')
        .update(formData as any)
        .eq('id', sejour.id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le séjour",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Séjour modifié avec succès",
        });
        onSuccess();
        onOpenChange(false);
      }
    } else {
      // Création
      const { error } = await supabase
        .from('sejours')
        .insert([formData as any]);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le séjour",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Séjour créé avec succès",
        });
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {sejour ? "Modifier le séjour" : "Créer un nouveau séjour"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre du séjour *</Label>
              <Input
                id="titre"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                placeholder="Ex: Séjour Été Pitchouns"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lieu">Lieu</Label>
              <Input
                id="lieu"
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                placeholder="Ex: Centre Aéré Municipal"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_debut">Date de début *</Label>
              <Input
                id="date_debut"
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_fin">Date de fin *</Label>
              <Input
                id="date_fin"
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupe_age">Groupe d'âge *</Label>
              <Select
                value={formData.groupe_age}
                onValueChange={(value) => setFormData({ ...formData, groupe_age: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pitchouns">Pitchouns (4 ans révolus, MS, GS, CP)</SelectItem>
                  <SelectItem value="minots">Minots (CE1, CE2, CM1)</SelectItem>
                  <SelectItem value="mias">Mias (CM2 à 4ème)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="places_disponibles">Places disponibles *</Label>
              <Input
                id="places_disponibles"
                type="number"
                min="0"
                value={formData.places_disponibles}
                onChange={(e) => setFormData({ ...formData, places_disponibles: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {sejour ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
