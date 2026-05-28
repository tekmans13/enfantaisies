import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Page /payer/:id
 * Génère à la volée une session Stripe Checkout et redirige le parent.
 * Permet d'avoir un lien dans l'email qui ne périme jamais (la session
 * Stripe est créée au moment du clic, valable 24h ensuite).
 */
const Payer = () => {
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const createAndRedirect = async () => {
      if (!id) {
        setError("Référence d'inscription manquante.");
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "create-stripe-payment-link",
          {
            body: {
              inscriptionId: id,
              origin: window.location.origin,
            },
          }
        );

        if (cancelled) return;

        if (fnError) {
          let details = "Impossible de préparer le paiement. Merci de contacter le centre.";
          try {
            const context = (fnError as any).context;
            const body = context ? await context.json() : null;
            console.error("Edge function error:", fnError, body);
            if (body?.error) {
              details = body.error;
            }
          } catch (_) {
            console.error("Edge function error:", fnError);
          }
          setError(details);
          return;
        }

        if (!data?.success || !data?.paymentUrl) {
          setError(data?.error || "Lien de paiement indisponible.");
          return;
        }

        window.location.href = data.paymentUrl;
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setError("Une erreur est survenue. Merci de réessayer dans quelques instants.");
        }
      }
    };

    createAndRedirect();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-4">
        {error ? (
          <>
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="text-xl font-semibold">Paiement indisponible</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Réessayer</Button>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <h1 className="text-xl font-semibold">Préparation du paiement…</h1>
            <p className="text-muted-foreground">
              Vous allez être redirigé vers la page sécurisée de paiement.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Payer;
