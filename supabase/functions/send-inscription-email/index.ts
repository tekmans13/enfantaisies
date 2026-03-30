/**
 * Edge Function - Envoi d'email de confirmation d'inscription
 * 
 * Envoie un email de confirmation au parent après une inscription réussie.
 * Utilise la configuration SMTP stockée en base de données.
 * 
 * @param {EmailRequest} body - Données de l'email à envoyer
 * @returns {Response} Statut de l'envoi
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Headers CORS pour permettre les appels depuis le frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Structure des données requises pour l'envoi d'email */
interface EmailRequest {
  inscriptionId: string;
  parentEmail: string;
  parentName: string;
  childName: string;
  recapUrl: string;
  paymentUrl?: string;
  montantTotal?: number;
  isPaymentConfirmation?: boolean;
}

/** Handler principal de la fonction edge */
const handler = async (req: Request): Promise<Response> => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inscriptionId, parentEmail, parentName, childName, recapUrl, paymentUrl, montantTotal, isPaymentConfirmation }: EmailRequest = await req.json();

    console.log("Sending email to:", parentEmail);

    // Créer un client Supabase avec privilèges admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Récupérer la configuration SMTP depuis la base de données
    const { data: smtpConfig, error: configError } = await supabaseAdmin
      .from("smtp_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (configError || !smtpConfig) {
      console.error("Configuration SMTP non trouvée");
      return new Response(
        JSON.stringify({ error: "Configuration SMTP non configurée" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Créer le client SMTP avec la configuration récupérée
    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.host,
        port: smtpConfig.port,
        tls: smtpConfig.tls || false,
        auth: {
          username: smtpConfig.username,
          password: smtpConfig.password,
        },
      },
    });

    console.log("Envoi depuis:", smtpConfig.from_email);
    
    // Construire le contenu de l'email selon le contexte
    let emailSubject: string;
    let emailContent = `Bonjour ${parentName},\n\n`;
    
    if (isPaymentConfirmation) {
      // Email après paiement réussi
      emailSubject = "Inscription validée - Centre Aéré";
      emailContent += `Nous avons bien reçu votre paiement pour l'inscription de ${childName} au Centre Aéré.\n\n`;
      emailContent += `Votre inscription est maintenant validée et confirmée.\n\n`;
      emailContent += `Vous pouvez consulter le récapitulatif complet de votre inscription à tout moment :\n`;
      emailContent += `${recapUrl}\n\n`;
      emailContent += `Référence de l'inscription : ${inscriptionId}\n\n`;
      emailContent += `Nous vous attendons avec plaisir !\n\n`;
    } else if (paymentUrl) {
      // Email avec attribution et lien de paiement
      emailSubject = "Attribution et lien de paiement - Centre Aéré";
      emailContent += `La commission d'attribution a fait au mieux pour répondre aux souhaits de chaque famille.\n\n`;
      emailContent += `Vous trouverez ci-dessous le lien pour consulter les séjours attribués à ${childName}, ainsi que le lien de paiement correspondant.\n\n`;
      emailContent += `🔗 Consulter les séjours attribués :\n`;
      emailContent += `${recapUrl}\n\n`;
      emailContent += `Montant total à régler : ${montantTotal?.toFixed(2)}€\n\n`;
      emailContent += `💳 Procéder au paiement :\n`;
      emailContent += `${paymentUrl}\n\n`;
      emailContent += `Référence de l'inscription : ${inscriptionId}\n\n`;
    } else {
      // Email de confirmation simple (première inscription)
      emailSubject = "Confirmation de votre inscription - Centre Aéré";
      emailContent += `Nous avons bien reçu votre inscription pour ${childName} au Centre Aéré.\n\n`;
      emailContent += `Votre inscription a été enregistrée avec succès et sera traitée par notre équipe dans les plus brefs délais.\n\n`;
      emailContent += `Vous pouvez consulter le récapitulatif de votre inscription à tout moment en cliquant sur le lien ci-dessous :\n`;
      emailContent += `${recapUrl}\n\n`;
      emailContent += `Référence de l'inscription : ${inscriptionId}\n\n`;
      emailContent += `Vous recevrez une notification par email une fois votre inscription validée.\n\n`;
    }
    
    emailContent += `Si vous avez des questions, n'hésitez pas à nous contacter.\n\n`;
    emailContent += `Cordialement,\nL'équipe du Centre Aéré`;
    
    // Envoyer l'email
    await client.send({
      from: smtpConfig.from_email,
      to: parentEmail,
      subject: emailSubject,
      content: emailContent,
    });

    await client.close();
    console.log("Email envoyé avec succès à:", parentEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Email envoyé avec succès" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
