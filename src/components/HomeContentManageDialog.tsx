import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HomeContent {
  id: string;
  section_key: string;
  title: string | null;
  description: string;
}

interface HomeContentManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HomeContentManageDialog({
  open,
  onOpenChange,
}: HomeContentManageDialogProps) {
  const { toast } = useToast();
  const [contents, setContents] = useState<HomeContent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchContents();
    }
  }, [open]);

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from("home_content")
      .select("*")
      .order("section_key");

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le contenu",
        variant: "destructive",
      });
      return;
    }

    setContents(data || []);
  };

  const handleUpdate = (sectionKey: string, field: "title" | "description", value: string) => {
    setContents(
      contents.map((c) =>
        c.section_key === sectionKey ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      for (const content of contents) {
        const { error } = await supabase
          .from("home_content")
          .update({
            title: content.title,
            description: content.description,
          })
          .eq("id", content.id);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Le contenu a été mis à jour",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSectionLabel = (key: string) => {
    switch (key) {
      case "intro":
        return "Texte d'introduction";
      case "groupes":
        return "Encart Groupes adaptés";
      case "sejours":
        return "Encart Séjours variés";
      case "inscription":
        return "Encart Inscription simplifiée";
      default:
        return key;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gérer le contenu de la page d'accueil</DialogTitle>
          <DialogDescription>
            Modifiez les textes affichés sur la page d'accueil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {contents.map((content) => (
            <div key={content.id} className="space-y-3 p-4 border rounded-lg">
              <h3 className="font-semibold text-sm text-muted-foreground">
                {getSectionLabel(content.section_key)}
              </h3>
              
              {content.section_key !== "intro" && (
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={content.title || ""}
                    onChange={(e) =>
                      handleUpdate(content.section_key, "title", e.target.value)
                    }
                    placeholder="Titre de la section"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={content.description}
                  onChange={(e) =>
                    handleUpdate(content.section_key, "description", e.target.value)
                  }
                  placeholder="Description de la section"
                  rows={content.section_key === "intro" ? 6 : 3}
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
