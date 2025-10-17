import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from "https://esm.sh/nodemailer@6.9.8";
import { Buffer } from "node:buffer";

// Polyfill Buffer for nodemailer compatibility
globalThis.Buffer = globalThis.Buffer || Buffer;

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

    console.log("🔧 Récupération config SMTP...");
    
    const { data: smtpConfig, error: configError } = await supabaseAdmin
      .from("smtp_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (configError || !smtpConfig) {
      console.error("❌ Configuration SMTP non trouvée:", configError);
      return new Response(
        JSON.stringify({ error: "Configuration SMTP non configurée" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Config SMTP récupérée:", {
      host: smtpConfig.host,
      port: smtpConfig.port,
      from: smtpConfig.from_email,
      user: smtpConfig.username
    });

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: false,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
      logger: true,
      debug: true,
    });

    console.log("📧 Transporter créé, envoi de l'email...");

    const info = await transporter.sendMail({
      from: smtpConfig.from_email,
      to: parentEmail,
      subject: "Confirmation de votre inscription - Centre Aéré",
      text: `
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

    console.log("✅ Email envoyé avec succès:", info.messageId);
    console.log("Response:", info.response);

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
