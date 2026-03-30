import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, FlaskConical, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface EmailConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  tls: boolean;
}

export const SmtpConfigDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<string[] | null>(null);
  const { toast } = useToast();
  const [config, setConfig] = useState<EmailConfig>({
    host: "",
    port: 587,
    username: "",
    password: "",
    from_email: "",
    tls: false,
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
            tls: config.tls,
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
            tls: config.tls,
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

  const handleTestSmtp = async () => {
    setTesting(true);
    setTestLogs(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-smtp');
      
      if (error) {
        let errorMsg = error.message;
        let logs: string[] = [];
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json();
            errorMsg = body?.error || body?.details || errorMsg;
            logs = body?.logs || [];
          } catch (_) {}
        }
        setTestLogs(logs.length > 0 ? [...logs, `❌ ERREUR: ${errorMsg}`] : [`❌ ERREUR: ${errorMsg}`]);
        toast({ title: "Échec du test SMTP", description: errorMsg, variant: "destructive" });
        return;
      }

      setTestLogs([...(data?.logs || []), `✅ ${data?.message || 'Succès'}`]);
      toast({ title: "Test SMTP réussi", description: data?.message });
    } catch (err: any) {
      setTestLogs([`❌ Erreur inattendue: ${err.message}`]);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Configuration SMTP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuration SMTP</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="host">Serveur SMTP</Label>
            <Input
              id="host"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="smtp.gmail.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
              placeholder="587"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="from_email">Email expéditeur</Label>
            <Input
              id="from_email"
              type="email"
              value={config.from_email}
              onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
              placeholder="noreply@example.com"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="tls"
              checked={config.tls}
              onCheckedChange={(checked) => setConfig({ ...config, tls: checked })}
            />
            <Label htmlFor="tls" className="cursor-pointer">
              Activer TLS/SSL (port 465)
            </Label>
          </div>

          <div className="flex justify-between gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleTestSmtp} 
              disabled={testing || !config.host}
            >
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
              {testing ? "Test en cours..." : "Tester SMTP"}
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>

          {testLogs && (
            <div className="mt-2">
              <Label className="text-xs font-semibold">Logs du test :</Label>
              <ScrollArea className="h-40 mt-1 rounded border bg-muted p-2">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {testLogs.join("\n")}
                </pre>
              </ScrollArea>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
