import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PaymentRequest {
  inscriptionId: string;
  origin?: string;
  // Champs optionnels (rétro-compat, ignorés si présents : on recalcule côté serveur)
  parentEmail?: string;
  parentName?: string;
  childName?: string;
  montantTotal?: number;
  nombreSemaines?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inscriptionId, origin }: PaymentRequest = await req.json();

    if (!inscriptionId) {
      throw new Error('inscriptionId requis');
    }

    const baseUrl = origin?.replace(/\/$/, '') || 'https://enfantaisies.lovable.app';

    // Client Supabase service role pour tout récupérer côté serveur
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) Inscription
    const { data: inscription, error: inscError } = await supabase
      .from('inscriptions')
      .select('*')
      .eq('id', inscriptionId)
      .maybeSingle();

    if (inscError) throw inscError;
    if (!inscription) throw new Error('Inscription non trouvée');

    // 2) Séjours attribués
    const sejourIds = [inscription.sejour_attribue_1, inscription.sejour_attribue_2].filter(Boolean);
    if (sejourIds.length === 0) {
      throw new Error('Aucun séjour attribué pour cette inscription');
    }

    const { data: sejoursData, error: sejError } = await supabase
      .from('sejours')
      .select('*')
      .in('id', sejourIds);

    if (sejError) throw sejError;
    if (!sejoursData || sejoursData.length === 0) {
      throw new Error('Séjours attribués introuvables');
    }

    // 3) Tarif applicable (QF)
    // Utiliser l'année du séjour attribué plutôt que l'année serveur :
    // les liens de paiement doivent rester valables même après le changement d'année civile.
    const annee = new Date(sejoursData[0].date_debut).getFullYear();
    let { data: tarifs, error: tarError } = await supabase
      .from('tarifs')
      .select('*')
      .eq('annee', annee)
      .order('tarif_numero', { ascending: true });

    if (tarError) throw tarError;
    if (!tarifs || tarifs.length === 0) {
      const { data: fallbackTarifs, error: fallbackTarError } = await supabase
        .from('tarifs')
        .select('*')
        .order('annee', { ascending: false })
        .order('tarif_numero', { ascending: true });

      if (fallbackTarError) throw fallbackTarError;
      if (!fallbackTarifs || fallbackTarifs.length === 0) {
        throw new Error(`Aucun tarif configuré pour ${annee}`);
      }

      const fallbackYear = fallbackTarifs[0].annee;
      tarifs = fallbackTarifs.filter((tarif: any) => tarif.annee === fallbackYear);
      console.log(`Aucun tarif pour ${annee}, utilisation des tarifs ${fallbackYear}`);
    }

    const qf = inscription.quotient_familial || 999999;
    const tarif = tarifs.find((t: any) =>
      qf >= t.qf_min && (t.qf_max === null || qf <= t.qf_max)
    ) || tarifs[tarifs.length - 1];

    // 4) Calcul du montant total
    let montantTotal = 0;
    sejoursData.forEach((sejour: any) => {
      const dateDebut = new Date(sejour.date_debut);
      const dateFin = new Date(sejour.date_fin);
      const joursCalc = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const nbJours = sejour.nombre_jours ?? joursCalc;

      const isCentreAere = sejour.type === 'centre_aere' || sejour.type === 'animation';
      const tarifJournalier = isCentreAere
        ? tarif.tarif_journee_centre_aere
        : tarif.tarif_journee_sejour;

      montantTotal += Number(tarifJournalier) * nbJours;
    });

    if (montantTotal <= 0) {
      throw new Error('Montant à payer invalide');
    }

    const parentEmail = inscription.parent_email;
    const parentName = `${inscription.parent_first_name} ${inscription.parent_last_name}`;
    const childName = `${inscription.child_first_name} ${inscription.child_last_name}`;
    const nombreSemaines = sejoursData.length;

    // 5) Configuration Stripe
    const { data: stripeConfig, error: configError } = await supabase
      .from('stripe_config')
      .select('secret_key')
      .single();

    if (configError || !stripeConfig?.secret_key) {
      throw new Error("Configuration Stripe non trouvée.");
    }

    const stripeKey = stripeConfig.secret_key;

    console.log({
      inscriptionId,
      parentEmail,
      montantTotal,
      nombreSemaines,
      env: stripeKey.startsWith('sk_test_') ? 'test' : 'live'
    });

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2020-08-27',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Inscription ${childName} - ${nombreSemaines} semaine(s)`,
              description: `Paiement pour l'inscription au centre aéré`,
            },
            unit_amount: Math.round(montantTotal * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/recap-inscription/${inscriptionId}?success=true`,
      cancel_url: `${baseUrl}/recap-inscription/${inscriptionId}?canceled=true`,
      customer_email: parentEmail,
      metadata: {
        inscription_id: inscriptionId,
        parent_email: parentEmail,
        parent_name: parentName,
        child_name: childName,
      },
      payment_intent_data: {
        metadata: {
          inscription_id: inscriptionId,
          parent_email: parentEmail,
        },
      },
    });

    console.log('Checkout session id:', session.id);

    return new Response(
      JSON.stringify({
        paymentUrl: session.url,
        montantTotal,
        success: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
