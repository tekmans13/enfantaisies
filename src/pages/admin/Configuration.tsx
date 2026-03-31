import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CreditCard, Eye, EyeOff, Bug, Database, FlaskConical, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  tls: boolean;
}

export default function Configuration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showSupabaseKeys, setShowSupabaseKeys] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestLogs, setSmtpTestLogs] = useState<string[] | null>(null);
  
  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
  });

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: "",
    port: 587,
    username: "",
    password: "",
    from_email: "",
    tls: false,
  });

  useEffect(() => {
    checkAdminAndFetchConfig();
  }, []);

  const checkAdminAndFetchConfig = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (!isAdmin) {
        toast({
          title: "Accès refusé",
          description: "Vous devez être administrateur",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      await fetchSmtpConfig();
      await fetchStripeConfig();
      
      // Charger l'état du mode debug
      const currentDebugMode = localStorage.getItem('debugMode') === 'true';
      setDebugMode(currentDebugMode);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmtpConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("smtp_config")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSmtpConfig(data);
      }
    } catch (error: any) {
      console.error("Error fetching SMTP config:", error);
    }
  };

  const fetchStripeConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("stripe_config")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setStripeConfig({
          publishableKey: data.publishable_key || "",
          secretKey: data.secret_key || "",
          webhookSecret: data.webhook_secret || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching Stripe config:", error);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("smtp_config")
        .select("id")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("smtp_config")
          .update(smtpConfig)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("smtp_config")
          .insert([smtpConfig]);

        if (error) throw error;
      }

      toast({
        title: "Configuration SMTP enregistrée",
        description: "Les paramètres SMTP ont été mis à jour avec succès",
      });

      await fetchSmtpConfig();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Vérifier si une configuration existe déjà
      const { data: existingConfig } = await supabase
        .from("stripe_config")
        .select("id")
        .single();

      const configData = {
        publishable_key: stripeConfig.publishableKey,
        secret_key: stripeConfig.secretKey,
        webhook_secret: stripeConfig.webhookSecret,
      };

      if (existingConfig) {
        // Mise à jour
        const { error } = await supabase
          .from("stripe_config")
          .update(configData)
          .eq("id", existingConfig.id);

        if (error) throw error;
      } else {
        // Insertion
        const { error } = await supabase
          .from("stripe_config")
          .insert([configData]);

        if (error) throw error;
      }

      toast({
        title: "Configuration enregistrée",
        description: "Les clés Stripe ont été mises à jour avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDebug = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    localStorage.setItem('debugMode', newMode.toString());
    
    toast({
      title: newMode ? "Mode Debug activé" : "Mode Debug désactivé",
      description: newMode 
        ? "La validation des champs est désactivée" 
        : "La validation des champs est maintenant active",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/bureau")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configuration</h1>
            <p className="text-muted-foreground">
              Gérez les paramètres de l'application
            </p>
          </div>
        </div>

        <Tabs defaultValue="stripe" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stripe">
              <CreditCard className="mr-2 h-4 w-4" />
              Stripe
            </TabsTrigger>
            <TabsTrigger value="smtp">
              <Mail className="mr-2 h-4 w-4" />
              SMTP
            </TabsTrigger>
            <TabsTrigger value="supabase">
              <Database className="mr-2 h-4 w-4" />
              Backend
            </TabsTrigger>
            <TabsTrigger value="debug">
              <Bug className="mr-2 h-4 w-4" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Stripe</CardTitle>
                <CardDescription>
                  Gérez vos clés API Stripe pour les paiements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveStripe} className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Clé Stripe actuellement configurée
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Une clé est déjà enregistrée. Vous pouvez la mettre à jour ci-dessous.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe-publishable">Clé Publique (Publishable Key)</Label>
                    <Input
                      id="stripe-publishable"
                      type="text"
                      placeholder="pk_test_..."
                      value={stripeConfig.publishableKey}
                      onChange={(e) =>
                        setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })
                      }
                      autoComplete="off"
                    />
                    <p className="text-sm text-muted-foreground">
                      Clé publique visible côté client (optionnel)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe-secret">Clé Secrète (Secret Key)</Label>
                    <div className="relative">
                      <Input
                        id="stripe-secret"
                        type={showStripeSecret ? "text" : "password"}
                        placeholder="sk_test_..."
                        value={stripeConfig.secretKey}
                        onChange={(e) =>
                          setStripeConfig({ ...stripeConfig, secretKey: e.target.value })
                        }
                        autoComplete="off"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowStripeSecret(!showStripeSecret)}
                      >
                        {showStripeSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nouvelle clé secrète (laissez vide pour conserver l'actuelle)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe-webhook">Secret Webhook</Label>
                    <div className="relative">
                      <Input
                        id="stripe-webhook"
                        type={showWebhookSecret ? "text" : "password"}
                        placeholder="whsec_..."
                        value={stripeConfig.webhookSecret}
                        onChange={(e) =>
                          setStripeConfig({ ...stripeConfig, webhookSecret: e.target.value })
                        }
                        autoComplete="off"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      >
                        {showWebhookSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Secret du webhook Stripe (optionnel)
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">Configuration du Webhook Stripe</h4>
                    <p className="text-sm text-muted-foreground">
                      URL du webhook à configurer dans Stripe:
                    </p>
                    <code className="block p-2 bg-background rounded text-sm">
                      https://uaoueggrpbiovtpbxaas.supabase.co/functions/v1/stripe-webhook
                    </code>
                    <p className="text-sm text-muted-foreground mt-2">
                      Événements à écouter:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      <li>checkout.session.completed</li>
                      <li>payment_intent.succeeded</li>
                      <li>payment_intent.payment_failed</li>
                      <li>charge.refunded</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      ℹ️ Les clés seront enregistrées de manière sécurisée et utilisées automatiquement dans vos edge functions.
                    </p>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? "Enregistrement..." : "Mettre à jour les clés Stripe"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="smtp">
            <Card>
              <CardHeader>
                <CardTitle>Configuration SMTP</CardTitle>
                <CardDescription>
                  Configurez votre serveur SMTP pour l'envoi d'emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSmtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">Hôte SMTP</Label>
                    <Input
                      id="host"
                      type="text"
                      placeholder="smtp.example.com"
                      value={smtpConfig.host}
                      onChange={(e) =>
                        setSmtpConfig({ ...smtpConfig, host: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) =>
                        setSmtpConfig({
                          ...smtpConfig,
                          port: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="user@example.com"
                      value={smtpConfig.username}
                      onChange={(e) =>
                        setSmtpConfig({ ...smtpConfig, username: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showSmtpPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={smtpConfig.password}
                        onChange={(e) =>
                          setSmtpConfig({ ...smtpConfig, password: e.target.value })
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      >
                        {showSmtpPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from_email">Email expéditeur</Label>
                    <Input
                      id="from_email"
                      type="email"
                      placeholder="noreply@example.com"
                      value={smtpConfig.from_email}
                      onChange={(e) =>
                        setSmtpConfig({ ...smtpConfig, from_email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tls"
                      checked={smtpConfig.tls}
                      onCheckedChange={(checked) =>
                        setSmtpConfig({ ...smtpConfig, tls: checked })
                      }
                    />
                    <Label htmlFor="tls">Activer TLS</Label>
                  </div>

                  <div className="flex justify-between items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={testingSmtp || !smtpConfig.host}
                      onClick={async () => {
                        setTestingSmtp(true);
                        setSmtpTestLogs(null);
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
                            setSmtpTestLogs(logs.length > 0 ? [...logs, `❌ ERREUR: ${errorMsg}`] : [`❌ ERREUR: ${errorMsg}`]);
                            toast({ title: "Échec du test SMTP", description: errorMsg, variant: "destructive" });
                            return;
                          }
                          setSmtpTestLogs([...(data?.logs || []), `✅ ${data?.message || 'Succès'}`]);
                          toast({ title: "Test SMTP réussi", description: data?.message });
                        } catch (err: any) {
                          setSmtpTestLogs([`❌ Erreur: ${err.message}`]);
                          toast({ title: "Erreur", description: err.message, variant: "destructive" });
                        } finally {
                          setTestingSmtp(false);
                        }
                      }}
                    >
                      {testingSmtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
                      {testingSmtp ? "Test en cours..." : "Tester SMTP"}
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Enregistrement..." : "Enregistrer la configuration"}
                    </Button>
                  </div>

                  {smtpTestLogs && (
                    <div className="mt-2">
                      <Label className="text-xs font-semibold">Logs du test :</Label>
                      <ScrollArea className="h-48 mt-1 rounded border bg-muted p-3">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {smtpTestLogs.join("\n")}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supabase">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Backend (Supabase)</CardTitle>
                <CardDescription>
                  Informations de connexion à votre backend Supabase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Backend Supabase configuré
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Votre projet est connecté à Supabase avec toutes les fonctionnalités backend actives.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>URL du Projet</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={import.meta.env.VITE_SUPABASE_URL || ""}
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    URL de connexion à votre backend
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>ID du Projet</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={import.meta.env.VITE_SUPABASE_PROJECT_ID || ""}
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Identifiant unique de votre projet
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Clé Publique (Anon Key)</Label>
                  <div className="relative">
                    <Input
                      type={showSupabaseKeys ? "text" : "password"}
                      value={import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""}
                      readOnly
                      className="font-mono text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowSupabaseKeys(!showSupabaseKeys)}
                    >
                      {showSupabaseKeys ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clé publique utilisée par votre application (lecture seule)
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    ℹ️ Ces paramètres sont gérés automatiquement. Les clés secrètes (Service Role Key) ne sont pas affichées pour des raisons de sécurité.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Services disponibles</h4>
                  <div className="grid gap-2">
                    <div className="p-3 bg-muted rounded text-sm flex items-center justify-between">
                      <span className="font-medium">Base de données PostgreSQL</span>
                      <span className="text-green-600 dark:text-green-400">✓ Actif</span>
                    </div>
                    <div className="p-3 bg-muted rounded text-sm flex items-center justify-between">
                      <span className="font-medium">Authentification</span>
                      <span className="text-green-600 dark:text-green-400">✓ Actif</span>
                    </div>
                    <div className="p-3 bg-muted rounded text-sm flex items-center justify-between">
                      <span className="font-medium">Stockage de fichiers</span>
                      <span className="text-green-600 dark:text-green-400">✓ Actif</span>
                    </div>
                    <div className="p-3 bg-muted rounded text-sm flex items-center justify-between">
                      <span className="font-medium">Edge Functions</span>
                      <span className="text-green-600 dark:text-green-400">✓ Actif</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug">
            <Card>
              <CardHeader>
                <CardTitle>Mode Debug</CardTitle>
                <CardDescription>
                  Activer le mode debug pour désactiver temporairement la validation des champs dans les formulaires
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">État du mode Debug</h4>
                    <p className="text-sm text-muted-foreground">
                      {debugMode 
                        ? "Le mode debug est actuellement activé. La validation des champs est désactivée." 
                        : "Le mode debug est actuellement désactivé. La validation des champs est active."}
                    </p>
                  </div>
                  <Button
                    onClick={handleToggleDebug}
                    variant={debugMode ? "default" : "outline"}
                    size="lg"
                    className="ml-4"
                  >
                    {debugMode ? "Debug: ON" : "Debug: OFF"}
                  </Button>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Attention
                  </h4>
                  <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1 list-disc list-inside">
                    <li>Le mode debug désactive la validation des champs obligatoires</li>
                    <li>Utilisez uniquement pour les tests et le développement</li>
                    <li>N'oubliez pas de désactiver le mode debug en production</li>
                    <li>Ce paramètre est stocké localement dans votre navigateur</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Impact du mode debug</h4>
                  <div className="grid gap-2">
                    <div className="p-3 bg-muted rounded text-sm">
                      <span className="font-medium">Formulaires d'inscription:</span> La validation des champs obligatoires est désactivée
                    </div>
                    <div className="p-3 bg-muted rounded text-sm">
                      <span className="font-medium">Gestion des séjours:</span> Les contraintes de validation sont assouplies
                    </div>
                    <div className="p-3 bg-muted rounded text-sm">
                      <span className="font-medium">Tests rapides:</span> Permet de tester rapidement les fonctionnalités sans remplir tous les champs
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
