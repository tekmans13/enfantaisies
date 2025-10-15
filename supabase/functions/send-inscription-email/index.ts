import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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

    // Configuration SMTP depuis les variables d'environnement
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUser || "noreply@example.com";

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error("Configuration SMTP manquante");
      return new Response(
        JSON.stringify({ error: "Configuration SMTP non configurée" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const client = new SmtpClient();

    try {
      await client.connect({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPassword,
      });
    } catch (connectError) {
      console.error("SMTP connection error:", connectError);
      return new Response(
        JSON.stringify({ error: "Impossible de se connecter au serveur SMTP" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailContent = `
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
    `;

    await client.send({
      from: smtpFrom,
      to: parentEmail,
      subject: "Confirmation de votre inscription - Centre Aéré",
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
