import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from "https://esm.sh/nodemailer@6.9.8";
import { Buffer } from "node:buffer";

// Polyfill Buffer for nodemailer compatibility
globalThis.Buffer = globalThis.Buffer || Buffer;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { email, role } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Générer un mot de passe aléatoire sécurisé
    const password = generateSecurePassword();

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign role if specified
    if (role && newUser.user) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        // Don't fail the request if role assignment fails
      }
    }

    // Envoyer un email de bienvenue avec le mot de passe
    try {
      await sendWelcomeEmail(supabaseAdmin, email, password);
    } catch (emailError: any) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // Ne pas faire échouer la création si l'email échoue
    }

    return new Response(
      JSON.stringify({ user: newUser.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

async function sendWelcomeEmail(supabaseAdmin: any, email: string, password: string) {
  console.log("🔧 Début de sendWelcomeEmail pour:", email);
  
  const { data: smtpConfig, error: configError } = await supabaseAdmin
    .from("smtp_config")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (configError || !smtpConfig) {
    console.log("❌ Configuration SMTP non trouvée, email non envoyé");
    return;
  }

  console.log("✅ Config SMTP récupérée:", {
    host: smtpConfig.host,
    port: smtpConfig.port,
    from: smtpConfig.from_email,
    user: smtpConfig.username
  });

  try {
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
      to: email,
      subject: "Bienvenue - Votre compte a été créé",
      text: `
Bonjour,

Votre compte a été créé avec succès.

Voici vos identifiants de connexion :
Email : ${email}
Mot de passe : ${password}

Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe après votre première connexion.

Cordialement,
L'équipe du Centre Aéré
      `,
    });

    console.log("✅ Email envoyé avec succès:", info.messageId);
    console.log("Response:", info.response);
  } catch (error) {
    console.error("❌ Erreur détaillée lors de l'envoi:", error);
    throw error;
  }
}
