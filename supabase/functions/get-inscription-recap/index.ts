import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inscriptionId } = await req.json();

    if (!inscriptionId || typeof inscriptionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'inscriptionId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Valider le format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(inscriptionId)) {
      return new Response(
        JSON.stringify({ error: 'Format d\'ID invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer l'inscription
    const { data: inscription, error: inscriptionError } = await supabase
      .from('inscriptions')
      .select('*')
      .eq('id', inscriptionId)
      .maybeSingle();

    if (inscriptionError) throw inscriptionError;

    if (!inscription) {
      return new Response(
        JSON.stringify({ error: 'Inscription non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les séjours liés
    const sejourIds = [
      inscription.sejour_preference_1,
      inscription.sejour_preference_2,
      inscription.sejour_preference_1_alternatif,
      inscription.sejour_preference_2_alternatif,
      inscription.sejour_attribue_1,
      inscription.sejour_attribue_2,
    ].filter((v: string | null, i: number, a: (string | null)[]) => v && a.indexOf(v) === i);

    let sejours: any[] = [];
    if (sejourIds.length > 0) {
      const { data: sejoursData } = await supabase
        .from('sejours')
        .select('*')
        .in('id', sejourIds);
      sejours = sejoursData || [];
    }

    // Récupérer les documents
    const { data: documents } = await supabase
      .from('inscription_documents')
      .select('*')
      .eq('inscription_id', inscriptionId);

    return new Response(
      JSON.stringify({ inscription, sejours, documents: documents || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
