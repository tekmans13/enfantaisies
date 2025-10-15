import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";

interface EmailConfig {
  id?: string;
  host: string; // Sera utilisé pour stocker "resend"
  port: number;
  username: string; // Sera utilisé pour stocker l'API Key
  password: string; // Utilisé pour stocker le domaine
  from_email: string;
}

export const SmtpConfigDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [config, setConfig] = useState<EmailConfig>({
    host: "resend",
    port: 587,
    username: "", // API Key Resend
    password: "", // Domaine
    from_email: "",
  });

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("smtp_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement de la config SMTP:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (config.id) {
        // Update existing config
        const { error } = await supabase
          .from("smtp_config")
          .update({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            from_email: config.from_email,
          })
          .eq("id", config.id);

        if (error) throw error;
      } else {
        // Insert new config
        const { error } = await supabase
          .from("smtp_config")
          .insert({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            from_email: config.from_email,
          });

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Configuration SMTP enregistrée",
      });

      setOpen(false);
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Configuration Email (Resend)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuration Resend</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Configurez Resend pour l'envoi d'emails. <br />
            Créez votre clé API sur{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              resend.com/api-keys
            </a>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Clé API Resend</Label>
            <Input
              id="username"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value, host: "resend" })}
              placeholder="re_..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Votre clé API commence par "re_"
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Domaine vérifié</Label>
            <Input
              id="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              placeholder="votredomaine.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Le domaine doit être vérifié sur{" "}
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                resend.com/domains
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from_email">Email expéditeur</Label>
            <Input
              id="from_email"
              type="email"
              value={config.from_email}
              onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
              placeholder="noreply@votredomaine.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Doit utiliser le domaine vérifié ci-dessus
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
