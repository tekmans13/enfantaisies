import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Initialiser le client Supabase pour charger la config
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Charger le webhook secret depuis la base de données
    const { data: stripeConfig } = await supabase
      .from('stripe_config')
      .select('webhook_secret')
      .single();
    
    const webhookSecret = stripeConfig?.webhook_secret;

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    // Vérifier la signature si le webhook secret est configuré
    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(
          JSON.stringify({ error: 'Webhook signature verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // En mode test sans webhook secret, parser directement le JSON
      console.log('Warning: No webhook secret configured, skipping signature verification');
      event = JSON.parse(body);
    }

    console.log('Webhook event type:', event.type);

    // Le client Supabase est déjà initialisé plus haut

    // Gérer les différents événements Stripe
    switch (event.type) {
      case 'checkout.session.completed':
      case 'payment_intent.succeeded': {
        const session = event.data.object as any;
        const inscriptionId = session.metadata?.inscription_id;

        if (inscriptionId) {
          console.log('Payment succeeded for inscription:', inscriptionId);

          const { error } = await supabase
            .from('inscriptions')
            .update({
              status: 'paye',
              stripe_payment_id: session.id,
              paiement_date: new Date().toISOString(),
            })
            .eq('id', inscriptionId);

          if (error) {
            console.error('Error updating inscription:', error);
            throw error;
          }

          console.log('Inscription updated successfully');

          // Récupérer les infos de l'inscription pour envoyer l'email
          const { data: inscription } = await supabase
            .from('inscriptions')
            .select(`
              id,
              child_first_name,
              child_last_name,
              parents (
                first_name,
                email
              )
            `)
            .eq('id', inscriptionId)
            .single();

          if (inscription && inscription.parents && Array.isArray(inscription.parents) && inscription.parents.length > 0) {
            const parent = inscription.parents[0];
            console.log('Sending confirmation email to:', parent.email);

            // Envoyer l'email de confirmation de paiement
            const recapUrl = `https://enfan-campus-inscriptions.lovable.app/recap-inscription/${inscriptionId}`;
            
            try {
              await supabase.functions.invoke('send-inscription-email', {
                body: {
                  inscriptionId: inscription.id,
                  parentEmail: parent.email,
                  parentName: parent.first_name,
                  childName: `${inscription.child_first_name} ${inscription.child_last_name}`,
                  recapUrl,
                  // Pas de paymentUrl car le paiement est déjà effectué
                }
              });
              console.log('Confirmation email sent successfully');
            } catch (emailError) {
              console.error('Error sending confirmation email:', emailError);
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const inscriptionId = paymentIntent.metadata?.inscription_id;

        if (inscriptionId) {
          console.log('Payment failed for inscription:', inscriptionId);

          await supabase
            .from('inscriptions')
            .update({
              status: 'echoue',
              stripe_payment_id: paymentIntent.id,
            })
            .eq('id', inscriptionId);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as any;
        
        // Trouver l'inscription via le payment_id
        const { data: inscription } = await supabase
          .from('inscriptions')
          .select('id')
          .eq('stripe_payment_id', charge.payment_intent)
          .single();

        if (inscription) {
          console.log('Refund processed for inscription:', inscription.id);

          await supabase
            .from('inscriptions')
            .update({
              status: 'rembourse',
            })
            .eq('id', inscription.id);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
