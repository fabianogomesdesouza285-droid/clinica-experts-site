// Supabase Edge Function: whatsapp-send
// O dashboard chama esta funcao (autenticado) para enviar uma mensagem de texto.
// Deploy:  supabase functions deploy whatsapp-send
// (mantem verificacao de JWT: so usuario logado envia)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const WA_TOKEN = Deno.env.get("WA_TOKEN")!;
const PHONE_NUMBER_ID = Deno.env.get("WA_PHONE_NUMBER_ID")!;
const GRAPH = "https://graph.facebook.com/v21.0";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  // Autentica o usuario pelo JWT enviado pelo dashboard
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: authErr } = await userClient.auth.getUser();
  if (authErr || !userData?.user) return json({ error: "nao autenticado" }, 401);
  const userId = userData.user.id;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const texto = (body?.texto ?? "").toString().trim();
  let waId = (body?.to ?? "").toString().replace(/\D/g, "");
  const conversaId = body?.conversa_id;
  if (!texto) return json({ error: "texto vazio" }, 400);

  // Descobre o destino a partir da conversa (garante que pertence ao usuario)
  let convId = conversaId;
  if (conversaId) {
    const { data: conv } = await admin.from("wa_conversas")
      .select("id, wa_id, user_id").eq("id", conversaId).maybeSingle();
    if (!conv || conv.user_id !== userId) return json({ error: "conversa invalida" }, 403);
    waId = conv.wa_id;
  }
  if (!waId) return json({ error: "destino ausente" }, 400);

  // Envia via Graph API
  const resp = await fetch(`${GRAPH}/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: waId,
      type: "text",
      text: { body: texto },
    }),
  });
  const result = await resp.json();
  if (!resp.ok) {
    console.error("graph error", result);
    return json({ error: "falha no envio", detalhe: result?.error?.message || result }, 502);
  }
  const waMessageId = result?.messages?.[0]?.id ?? null;

  // Se nao veio conversa_id, garante que a conversa existe
  if (!convId) {
    const { data: existente } = await admin.from("wa_conversas")
      .select("id").eq("user_id", userId).eq("wa_id", waId).maybeSingle();
    if (existente) convId = existente.id;
    else {
      const { data: nova } = await admin.from("wa_conversas").insert({
        user_id: userId, wa_id: waId, ultima_mensagem: texto, ultima_em: new Date().toISOString(), nao_lidas: 0,
      }).select("id").single();
      convId = nova!.id;
    }
  }

  // Grava a mensagem enviada e atualiza a conversa
  await admin.from("wa_mensagens").insert({
    user_id: userId, conversa_id: convId, wa_message_id: waMessageId,
    direcao: "out", tipo: "text", texto, status: "sent",
  });
  await admin.from("wa_conversas").update({
    ultima_mensagem: texto, ultima_em: new Date().toISOString(), nao_lidas: 0,
  }).eq("id", convId);

  return json({ ok: true, wa_message_id: waMessageId, conversa_id: convId });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
