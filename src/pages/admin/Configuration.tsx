import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { ArrowLeft, Mail, CreditCard, Eye, EyeOff, Bug } from "lucide-react";

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
    
    toast({
      title: "Information",
      description: "La configuration Stripe doit être faite via les secrets Supabase",
    });
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stripe">
              <CreditCard className="mr-2 h-4 w-4" />
              Stripe
            </TabsTrigger>
            <TabsTrigger value="smtp">
              <Mail className="mr-2 h-4 w-4" />
              SMTP
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
                    />
                    <p className="text-sm text-muted-foreground">
                      Clé publique visible côté client
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
                      Clé secrète à ne jamais partager (variable STRIPE_SECRET_KEY)
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
                      Secret du webhook Stripe (variable STRIPE_WEBHOOK_SECRET)
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">Configuration du Webhook Stripe</h4>
                    <p className="text-sm text-muted-foreground">
                      URL du webhook à configurer dans Stripe:
                    </p>
                    <code className="block p-2 bg-background rounded text-sm">
                      https://seuqrfwzpeegfxcegthf.supabase.co/functions/v1/stripe-webhook
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
                      ℹ️ Les clés Stripe doivent être configurées via les secrets Supabase pour une sécurité maximale.
                      Utilisez les variables d'environnement STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET dans vos edge functions.
                    </p>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? "Enregistrement..." : "Enregistrer"}
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

                  <Button type="submit" disabled={saving}>
                    {saving ? "Enregistrement..." : "Enregistrer la configuration"}
                  </Button>
                </form>
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
