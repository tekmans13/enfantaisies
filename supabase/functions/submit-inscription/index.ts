import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const normalizeText = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim();
const normalizeForComparison = (value: string) =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const inscriptionPayloadSchema = z.object({
  id: z.string().uuid(),
  is_first_inscription: z.boolean(),
  has_medication: z.boolean(),
  medication_details: z.string().nullable(),
  has_allergies: z.boolean(),
  allergies_details: z.string().nullable(),
  food_allergies_details: z.string().nullable(),
  child_first_name: z.string().min(1).max(255),
  child_last_name: z.string().min(1).max(255),
  child_birth_date: z.string().min(1).max(20),
  child_class: z.string().min(1).max(100),
  child_gender: z.string().min(1).max(50),
  child_school: z.string().min(1).max(255),
  child_age_group: z.string().nullable(),
  quotient_familial: z.number().int().nullable(),
  caf_number: z.string().nullable(),
  parent_first_name: z.string().min(1).max(255),
  parent_last_name: z.string().min(1).max(255),
  parent_email: z.string().email().max(255),
  parent_authority: z.string().min(1).max(100),
  parent_mobile: z.string().min(1).max(50),
  parent_office_phone: z.string().nullable(),
  parent_address: z.string().min(1).max(500),
  parent2_first_name: z.string().nullable(),
  parent2_last_name: z.string().nullable(),
  parent2_email: z.string().email().max(255).nullable(),
  parent2_authority: z.string().nullable(),
  parent2_mobile: z.string().nullable(),
  parent2_office_phone: z.string().nullable(),
  social_security_regime: z.string().min(1).max(100),
  sejour_preference_1: z.string().nullable(),
  sejour_preference_2: z.string().nullable(),
  sejour_preference_1_alternatif: z.string().nullable(),
  sejour_preference_2_alternatif: z.string().nullable(),
  nombre_semaines_demandees: z.number().int().min(1).max(2),
  demande_specifique: z.string().nullable(),
  urgency_contact_1_first_name: z.string().nullable(),
  urgency_contact_1_last_name: z.string().nullable(),
  urgency_contact_1_relation: z.string().nullable(),
  urgency_contact_1_mobile: z.string().nullable(),
  urgency_contact_1_other_phone: z.string().nullable(),
  urgency_contact_2_first_name: z.string().nullable(),
  urgency_contact_2_last_name: z.string().nullable(),
  urgency_contact_2_relation: z.string().nullable(),
  urgency_contact_2_mobile: z.string().nullable(),
  urgency_contact_2_other_phone: z.string().nullable(),
  authorized_person_1_first_name: z.string().nullable(),
  authorized_person_1_last_name: z.string().nullable(),
  authorized_person_1_relation: z.string().nullable(),
  authorized_person_1_mobile: z.string().nullable(),
  authorized_person_1_other_phone: z.string().nullable(),
  authorized_person_2_first_name: z.string().nullable(),
  authorized_person_2_last_name: z.string().nullable(),
  authorized_person_2_relation: z.string().nullable(),
  authorized_person_2_mobile: z.string().nullable(),
  authorized_person_2_other_phone: z.string().nullable(),
});

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), inscription: inscriptionPayloadSchema }),
  z.object({ action: z.literal('rollback'), inscriptionId: z.string().uuid() }),
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = bodySchema.safeParse(await req.json());

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (parsed.data.action === 'rollback') {
      const { inscriptionId } = parsed.data;

      await supabase.from('inscription_documents').delete().eq('inscription_id', inscriptionId);
      const { error: deleteError } = await supabase.from('inscriptions').delete().eq('id', inscriptionId);

      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { inscription } = parsed.data;

    const { data: existing, error: checkError } = await supabase
      .from('inscriptions')
      .select('id, child_first_name, child_last_name, parent_email, child_birth_date')
      .eq('child_birth_date', inscription.child_birth_date);

    if (checkError) throw checkError;

    const duplicate = existing?.some((item) =>
      normalizeForComparison(item.child_first_name) === normalizeForComparison(inscription.child_first_name) &&
      normalizeForComparison(item.child_last_name) === normalizeForComparison(inscription.child_last_name) &&
      normalizeForComparison(item.parent_email) === normalizeForComparison(inscription.parent_email)
    );

    if (duplicate) {
      return new Response(JSON.stringify({ error: 'Une inscription existe déjà pour cet enfant avec cette adresse email.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await supabase.from('inscriptions').insert(inscription);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, inscriptionId: inscription.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Erreur serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});