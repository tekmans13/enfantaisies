import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

  const client = new SMTPClient({
    connection: {
      hostname: smtpConfig.host,
      port: smtpConfig.port,
      tls: true,
      auth: {
        username: smtpConfig.username,
        password: smtpConfig.password,
      },
    },
  });

    await client.send({
      from: smtpConfig.from_email,
      to: parentEmail,
      subject: "Confirmation de votre inscription - Centre Aéré",
      content: `
Bonjour ${parentName},

Nous avons bien reçu votre inscription pour ${childName} au Centre Aéré.

Votre inscription a été enregistrée avec succès et sera traitée par notre équipe dans les plus brefs délais.

Vous pouvez consulter le récapitulatif de votre inscription à tout moment en cliquant sur le lien ci-dessous :
${recapUrl}

Référence de l'inscription : ${inscriptionId}

Vous recevrez une notification par email une fois votre inscription validée.

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe du Centre Aéré
      `,
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
