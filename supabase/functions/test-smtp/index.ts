import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(`[${new Date().toISOString()}] ${msg}`);
  };

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', logs }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide', logs }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    const { data: isUser } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'user' });
    if (!isAdmin && !isUser) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé', logs }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load SMTP config
    log("Chargement de la configuration SMTP...");
    const { data: smtpConfig, error: configError } = await supabaseAdmin
      .from("smtp_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (configError) {
      log(`Erreur lecture config: ${configError.message}`);
      return new Response(
        JSON.stringify({ error: 'Erreur lecture config SMTP', details: configError.message, logs }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!smtpConfig) {
      log("Aucune configuration SMTP trouvée en base");
      return new Response(
        JSON.stringify({ error: 'Configuration SMTP non trouvée', logs }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log(`Config trouvée: host=${smtpConfig.host}, port=${smtpConfig.port}, tls=${smtpConfig.tls}, username=${smtpConfig.username}, from=${smtpConfig.from_email}`);

    // Try SMTP connection
    log("Connexion au serveur SMTP...");
    let client: SMTPClient;
    try {
      client = new SMTPClient({
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
      log("Client SMTP créé avec succès");
    } catch (connError: any) {
      log(`Erreur de connexion SMTP: ${connError.message}`);
      log(`Stack: ${connError.stack || 'N/A'}`);
      return new Response(
        JSON.stringify({ error: 'Erreur de connexion SMTP', details: connError.message, logs }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send test email
    log(`Envoi d'un email de test à ${smtpConfig.from_email}...`);
    try {
      await client.send({
        from: smtpConfig.from_email,
        to: smtpConfig.from_email,
        subject: "Test SMTP - Centre Aéré",
        content: `Ceci est un email de test envoyé le ${new Date().toLocaleString('fr-FR')}.\n\nSi vous recevez cet email, votre configuration SMTP fonctionne correctement.`,
      });
      log("Email de test envoyé avec succès !");
    } catch (sendError: any) {
      log(`Erreur d'envoi: ${sendError.message}`);
      log(`Stack: ${sendError.stack || 'N/A'}`);
      await client.close().catch(() => {});
      return new Response(
        JSON.stringify({ error: 'Erreur d\'envoi de l\'email', details: sendError.message, logs }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await client.close();
    log("Connexion SMTP fermée");

    return new Response(
      JSON.stringify({ success: true, message: `Email de test envoyé à ${smtpConfig.from_email}`, logs }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    log(`Erreur inattendue: ${error.message}`);
    log(`Stack: ${error.stack || 'N/A'}`);
    return new Response(
      JSON.stringify({ error: error.message, logs }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
