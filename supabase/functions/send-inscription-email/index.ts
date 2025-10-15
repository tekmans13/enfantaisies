import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  inscriptionId: string;
  parentEmail: string;
  parentName: string;
  childName: string;
  recapUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inscriptionId, parentEmail, parentName, childName, recapUrl }: EmailRequest = await req.json();

    console.log("Sending email to:", parentEmail);

    // Créer client Supabase pour lire la config
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

    // Récupérer la configuration Resend depuis Supabase
    const { data: resendConfig, error: configError } = await supabaseAdmin
      .from("smtp_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (configError || !resendConfig) {
      console.error("Configuration Resend non trouvée");
      return new Response(
        JSON.stringify({ error: "Configuration email non configurée" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resend = new Resend(resendConfig.username); // API Key est dans username

    const emailContent = `
<h1>Confirmation d'inscription</h1>
<p>Bonjour ${parentName},</p>
<p>Nous avons bien reçu votre inscription pour <strong>${childName}</strong> au Centre Aéré.</p>
<p>Votre inscription a été enregistrée avec succès et sera traitée par notre équipe dans les plus brefs délais.</p>
<p>Vous pouvez consulter le récapitulatif de votre inscription à tout moment en cliquant sur le lien ci-dessous :</p>
<p><a href="${recapUrl}">${recapUrl}</a></p>
<p><strong>Référence de l'inscription :</strong> ${inscriptionId}</p>
<p>Vous recevrez une notification par email une fois votre inscription validée.</p>
<p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
<p>Cordialement,<br>
L'équipe du Centre Aéré</p>
    `;

    const { error: sendError } = await resend.emails.send({
      from: resendConfig.from_email,
      to: parentEmail,
      subject: "Confirmation de votre inscription - Centre Aéré",
      html: emailContent,
    });

    if (sendError) {
      console.error("Erreur Resend:", sendError);
      return new Response(
        JSON.stringify({ error: `Échec de l'envoi de l'email: ${sendError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
