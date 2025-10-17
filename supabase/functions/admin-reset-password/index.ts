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
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'User ID and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a new secure password
    const newPassword = generateSecurePassword();

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send the new password via email
    try {
      await sendPasswordResetEmail(supabaseAdmin, email, newPassword);
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Password reset but email failed to send' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password reset successfully for:', email);

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset and email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in admin-reset-password function:', error);
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

async function sendPasswordResetEmail(supabaseAdmin: any, email: string, newPassword: string) {
  console.log("🔧 Début de sendPasswordResetEmail pour:", email);
  
  const { data: smtpConfig, error: configError } = await supabaseAdmin
    .from("smtp_config")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (configError || !smtpConfig) {
    console.error("❌ Configuration SMTP non trouvée:", configError);
    throw new Error("Configuration SMTP non trouvée");
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
      secure: false, // true pour 465, false pour les autres ports
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
      subject: "Réinitialisation de votre mot de passe",
      text: `
Bonjour,

Votre mot de passe a été réinitialisé par un administrateur.

Voici votre nouveau mot de passe :
${newPassword}

Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe après votre prochaine connexion.

Email de connexion : ${email}

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
