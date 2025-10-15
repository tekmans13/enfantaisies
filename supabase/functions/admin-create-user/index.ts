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
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Envoyer un email de bienvenue
    try {
      await sendWelcomeEmail(supabaseAdmin, email);
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

async function sendWelcomeEmail(supabaseAdmin: any, email: string) {
  // Récupérer la configuration SMTP
  const { data: smtpConfig, error: configError } = await supabaseAdmin
    .from("smtp_config")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (configError || !smtpConfig) {
    console.log("Configuration SMTP non trouvée, email non envoyé");
    return;
  }

  const client = new SmtpClient();

  await client.connectTLS({
    hostname: smtpConfig.host,
    port: smtpConfig.port,
    username: smtpConfig.username,
    password: smtpConfig.password,
  });

  const emailContent = `
Bonjour,

Votre compte a été créé avec succès sur l'application Centre Aéré.

Email: ${email}

Vous pouvez maintenant vous connecter à l'application.

Cordialement,
L'équipe du Centre Aéré
  `;

  await client.send({
    from: smtpConfig.from_email,
    to: email,
    subject: "Bienvenue - Votre compte a été créé",
    content: emailContent,
  });

  await client.close();
  console.log("Email de bienvenue envoyé à:", email);
}
