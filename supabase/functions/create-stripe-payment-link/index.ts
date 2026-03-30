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
  parentEmail: string;
  parentName: string;
  childName: string;
  montantTotal: number;
  nombreSemaines: number;
  origin?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inscriptionId, parentEmail, parentName, childName, montantTotal, nombreSemaines, origin }: PaymentRequest = await req.json();
    const baseUrl = origin?.replace(/\/$/, '') || 'https://enfantaisies.lovable.app';
    
    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer la configuration Stripe depuis la base de données
    const { data: stripeConfig, error: configError } = await supabase
      .from('stripe_config')
      .select('secret_key')
      .single();

    if (configError || !stripeConfig?.secret_key) {
      throw new Error('Configuration Stripe non trouvée. Veuillez configurer Stripe dans l\'interface d\'administration.');
    }

    const stripeKey = stripeConfig.secret_key;
    
    console.log({
      inscriptionId,
      parentEmail,
      montantTotal,
      nombreSemaines,
      env: stripeKey.startsWith('sk_test_') ? 'test' : 'live'
    });

    console.log('Stripe key prefix:', stripeKey.slice(0, 8));

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2020-08-27',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Créer une Checkout Session
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
      success_url: `https://enfan-campus-inscriptions.lovable.app/recap-inscription/${inscriptionId}?success=true`,
      cancel_url: `https://enfan-campus-inscriptions.lovable.app/recap-inscription/${inscriptionId}?canceled=true`,
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
    console.log('Checkout URL:', session.url);

    return new Response(
      JSON.stringify({ 
        paymentUrl: session.url,
        success: true 
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
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
