import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  console.log('===== WEBHOOK CALLED =====');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('Returning CORS preflight response');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing webhook...');
    
    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer la configuration Stripe depuis la base de données
    const { data: stripeConfig, error: configError } = await supabase
      .from('stripe_config')
      .select('secret_key, webhook_secret')
      .single();

    if (configError || !stripeConfig?.secret_key) {
      console.error('Stripe config error:', configError);
      throw new Error('Configuration Stripe non trouvée. Veuillez configurer Stripe dans l\'interface d\'administration.');
    }

    const stripeKey = stripeConfig.secret_key;
    const webhookSecret = stripeConfig.webhook_secret;

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2020-08-27',
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
    console.log('Webhook event id:', event.id);

    // Le client Supabase est déjà initialisé plus haut

    // Gérer les différents événements Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const inscriptionId = session.metadata?.inscription_id;

        if (inscriptionId) {
          console.log('Payment succeeded for inscription:', inscriptionId);

          // Vérifier si l'inscription n'est pas déjà marquée comme payée
          const { data: existingInscription } = await supabase
            .from('inscriptions')
            .select('status')
            .eq('id', inscriptionId)
            .single();

          if (existingInscription?.status === 'paye') {
            console.log('Inscription already marked as paid, skipping');
            break;
          }

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
            .select('id, child_first_name, child_last_name, parent_email, parent_first_name')
            .eq('id', inscriptionId)
            .single();

          if (inscription) {
            console.log('Sending confirmation email to:', inscription.parent_email);

            // Envoyer l'email de confirmation de paiement
            const recapUrl = `${Deno.env.get('PUBLIC_APP_URL') || 'https://enfantaisies.lovable.app'}/recap-inscription/${inscriptionId}`;
            
            try {
              await supabase.functions.invoke('send-inscription-email', {
                body: {
                  inscriptionId: inscription.id,
                  parentEmail: inscription.parent_email,
                  parentName: inscription.parent_first_name,
                  childName: `${inscription.child_first_name} ${inscription.child_last_name}`,
                  recapUrl,
                  isPaymentConfirmation: true, // Indiquer qu'il s'agit d'une confirmation de paiement
                }
              });
              console.log('Payment confirmation email sent successfully');
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
