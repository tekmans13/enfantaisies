import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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
  // Récupérer la configuration SMTP
  const { data: smtpConfig, error: configError } = await supabaseAdmin
    .from("smtp_config")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (configError || !smtpConfig) {
    throw new Error("Configuration SMTP non trouvée");
  }

  const client = new SmtpClient();

  try {
    await client.connect({
      hostname: smtpConfig.host,
      port: smtpConfig.port,
      username: smtpConfig.username,
      password: smtpConfig.password,
    });
  } catch (connectError) {
    console.error("SMTP connection error:", connectError);
    throw new Error("Impossible de se connecter au serveur SMTP");
  }

  const emailContent = `
Bonjour,

Votre mot de passe a été réinitialisé par un administrateur.

Voici votre nouveau mot de passe :
${newPassword}

Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe après votre prochaine connexion.

Email de connexion : ${email}

Cordialement,
L'équipe du Centre Aéré
  `;

  await client.send({
    from: smtpConfig.from_email,
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    content: emailContent,
  });

  await client.close();
  console.log("Email de réinitialisation envoyé à:", email);
}
