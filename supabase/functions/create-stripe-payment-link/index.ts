import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  inscriptionId: string;
  parentEmail: string;
  parentName: string;
  childName: string;
  montantTotal: number;
  nombreSemaines: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inscriptionId, parentEmail, parentName, childName, montantTotal, nombreSemaines }: PaymentRequest = await req.json();
    
    console.log('Creating payment link for inscription:', inscriptionId);

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2020-08-27',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Créer une Checkout Session au lieu d'un Payment Link
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
            unit_amount: Math.round(montantTotal * 100), // Stripe utilise les centimes
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

    console.log('Checkout session created:', session.url);

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
