// Supabase Edge Function: whatsapp-webhook
// Recebe as chamadas da Meta (Cloud API): verificacao (GET) e eventos (POST).
// Deploy:  supabase functions deploy whatsapp-webhook --no-verify-jwt
// (--no-verify-jwt porque a Meta chama sem JWT; validamos pelo verify token / assinatura)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERIFY_TOKEN = Deno.env.get("WA_VERIFY_TOKEN")!;
const OWNER_USER_ID = Deno.env.get("WA_OWNER_USER_ID")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1) Verificacao do webhook (a Meta chama uma vez ao configurar)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: any;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }

  try {
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value ?? {};
        const contacts = value?.contacts ?? [];
        const nomePorWaId: Record<string, string> = {};
        for (const c of contacts) nomePorWaId[c?.wa_id] = c?.profile?.name ?? "";

        // ---- Mensagens recebidas ----
        for (const msg of value?.messages ?? []) {
          const waId = msg.from;                     // numero do cliente
          const texto = extractText(msg);
          const conversaId = await upsertConversa(waId, nomePorWaId[waId] || "", texto, true);
          await admin.from("wa_mensagens").upsert({
            user_id: OWNER_USER_ID,
            conversa_id: conversaId,
            wa_message_id: msg.id,
            direcao: "in",
            tipo: msg.type || "text",
            texto,
            status: "received",
          }, { onConflict: "wa_message_id", ignoreDuplicates: true });
        }

        // ---- Atualizacoes de status das mensagens que enviamos ----
        for (const st of value?.statuses ?? []) {
          if (!st?.id) continue;
          await admin.from("wa_mensagens")
            .update({ status: st.status })
            .eq("wa_message_id", st.id);
        }
      }
    }
  } catch (e) {
    console.error("webhook error", e);
    // Sempre 200 para a Meta nao ficar reenviando; logamos o erro.
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
});

function extractText(msg: any): string {
  if (msg.type === "text") return msg.text?.body ?? "";
  if (msg.type === "button") return msg.button?.text ?? "";
  if (msg.type === "interactive") {
    return msg.interactive?.button_reply?.title
      ?? msg.interactive?.list_reply?.title ?? "";
  }
  if (["image", "audio", "video", "document", "sticker"].includes(msg.type)) {
    return "[" + msg.type + "]";
  }
  return "";
}

async function upsertConversa(waId: string, nome: string, ultima: string, incNaoLidas: boolean): Promise<string> {
  const { data: existente } = await admin.from("wa_conversas")
    .select("id, nao_lidas").eq("user_id", OWNER_USER_ID).eq("wa_id", waId).maybeSingle();
  if (existente) {
    await admin.from("wa_conversas").update({
      nome: nome || undefined,
      ultima_mensagem: ultima,
      ultima_em: new Date().toISOString(),
      nao_lidas: (existente.nao_lidas || 0) + (incNaoLidas ? 1 : 0),
    }).eq("id", existente.id);
    return existente.id;
  }
  const { data: novo } = await admin.from("wa_conversas").insert({
    user_id: OWNER_USER_ID, wa_id: waId, nome, ultima_mensagem: ultima,
    ultima_em: new Date().toISOString(), nao_lidas: incNaoLidas ? 1 : 0,
  }).select("id").single();
  return novo!.id;
}
