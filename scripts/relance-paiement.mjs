#!/usr/bin/env node
/**
 * Relance email "lien de paiement" — reproduit exactement le bouton
 * "Envoyer lien paiement" de Bureau.tsx (handleSendPayment).
 *
 * Usage :
 *   node scripts/relance-paiement.mjs --id <inscription_id>      # test sur 1 personne
 *   node scripts/relance-paiement.mjs --all                      # relance tous les "envoye"
 *   node scripts/relance-paiement.mjs --all --dry-run            # liste sans envoyer
 *
 * Pré-requis : npm i @supabase/supabase-js (déjà installé dans le projet)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uaoueggrpbiovtpbxaas.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhb3VlZ2dycGJpb3Z0cGJ4YWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODYzNjUsImV4cCI6MjA5MDQ2MjM2NX0.Rvwsh2THo-ukR9CzBnr4lslaA1dy8MK0gMbxW02YZKI';
const SITE_URL = 'https://www.inscription-enfantaisies.fr';

// ---- args
const args = process.argv.slice(2);
const idArg = args.includes('--id') ? args[args.indexOf('--id') + 1] : null;
const all = args.includes('--all');
const dryRun = args.includes('--dry-run');

if (!idArg && !all) {
  console.error('Usage: --id <inscription_id>  OU  --all  [--dry-run]');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function calcMontant(inscription) {
  const { data: tarifs } = await supabase
    .from('tarifs')
    .select('*')
    .order('tarif_numero', { ascending: true });

  if (!tarifs?.length) throw new Error('Aucun tarif configuré');

  const qf = inscription.quotient_familial || 999999;
  const tarif =
    tarifs.find((t) => qf >= t.qf_min && (t.qf_max === null || qf <= t.qf_max)) ||
    tarifs[tarifs.length - 1];

  const sejourIds = [inscription.sejour_attribue_1, inscription.sejour_attribue_2].filter(Boolean);
  if (!sejourIds.length) throw new Error('Aucun séjour attribué');

  const { data: sejours } = await supabase.from('sejours').select('*').in('id', sejourIds);
  if (!sejours?.length) throw new Error('Séjours introuvables');

  let montant = 0;
  for (const s of sejours) {
    const debut = new Date(s.date_debut);
    const fin = new Date(s.date_fin);
    const joursCalc = Math.ceil((fin - debut) / 86400000) + 1;
    const nbJours = s.nombre_jours ?? joursCalc;
    const isCentre = s.type === 'centre_aere' || s.type === 'animation';
    const tj = isCentre ? tarif.tarif_journee_centre_aere : tarif.tarif_journee_sejour;
    montant += Number(tj) * nbJours;
  }
  return montant;
}

async function relancer(inscription) {
  const montantTotal = await calcMontant(inscription);
  const paymentUrl = `${SITE_URL}/payer/${inscription.id}`;
  const recapUrl = `${SITE_URL}/recap-inscription/${inscription.id}`;

  console.log(
    `→ ${inscription.child_first_name} ${inscription.child_last_name} ` +
      `(${inscription.parent_email}) — ${montantTotal.toFixed(2)}€`
  );

  if (dryRun) {
    console.log('  [dry-run] pas d\'envoi');
    return;
  }

  const { error } = await supabase.functions.invoke('send-inscription-email', {
    body: {
      inscriptionId: inscription.id,
      parentEmail: inscription.parent_email,
      parentName: `${inscription.parent_first_name} ${inscription.parent_last_name}`,
      childName: `${inscription.child_first_name} ${inscription.child_last_name}`,
      recapUrl,
      paymentUrl,
      montantTotal,
    },
  });

  if (error) {
    console.error('  ❌ Erreur:', error.message);
  } else {
    console.log('  ✅ Email envoyé');
  }
}

async function main() {
  let q = supabase.from('inscriptions').select('*');
  if (idArg) q = q.eq('id', idArg);
  else q = q.eq('status', 'envoye');

  const { data, error } = await q;
  if (error) throw error;
  if (!data?.length) {
    console.log('Aucune inscription correspondante.');
    return;
  }

  console.log(`${data.length} inscription(s) à relancer\n`);
  for (const ins of data) {
    try {
      await relancer(ins);
    } catch (e) {
      console.error(`  ❌ ${ins.id}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 500)); // throttle
  }
}

main().catch((e) => {
  console.error('Erreur fatale:', e);
  process.exit(1);
});
