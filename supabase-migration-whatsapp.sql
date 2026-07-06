-- ============================================================
-- Migracao: Atendimento por WhatsApp (Meta Cloud API)
-- Cole no SQL Editor do Supabase e clique em "Run". Idempotente.
-- ============================================================

-- Conversas (uma por contato/numero de cliente)
CREATE TABLE IF NOT EXISTS wa_conversas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  wa_id VARCHAR(40) NOT NULL,            -- numero do cliente no formato E.164 sem '+', ex: 5511999999999
  nome VARCHAR(160),                     -- nome do perfil do WhatsApp
  ultima_mensagem TEXT,
  ultima_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nao_lidas INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, wa_id)
);

-- Mensagens
CREATE TABLE IF NOT EXISTS wa_mensagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  conversa_id UUID REFERENCES wa_conversas(id) ON DELETE CASCADE NOT NULL,
  wa_message_id VARCHAR(128),            -- id da mensagem na Meta (para dedupe / status)
  direcao VARCHAR(4) NOT NULL,           -- 'in' (recebida) | 'out' (enviada)
  tipo VARCHAR(20) DEFAULT 'text',
  texto TEXT,
  status VARCHAR(20) DEFAULT 'received', -- received | sent | delivered | read | failed
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_msg_conversa ON wa_mensagens(conversa_id, criado_em);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_msg_waid ON wa_mensagens(wa_message_id) WHERE wa_message_id IS NOT NULL;

-- ---- Seguranca (RLS): cada usuario so ve as proprias conversas/mensagens ----
ALTER TABLE wa_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wa_conversas proprias" ON wa_conversas;
CREATE POLICY "wa_conversas proprias" ON wa_conversas
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wa_mensagens proprias" ON wa_mensagens;
CREATE POLICY "wa_mensagens proprias" ON wa_mensagens
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---- Realtime: habilita a tabela de mensagens para o inbox ao vivo ----
-- (ignore o erro "already member" se rodar de novo)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wa_mensagens;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wa_conversas;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;

-- ============================================================
-- OBS: as Edge Functions (whatsapp-webhook / whatsapp-send) gravam usando a
-- service role (ignora RLS). O dashboard le com o token do usuario (RLS acima).
-- O dono do numero e definido pelo secret WA_OWNER_USER_ID nas functions.
-- ============================================================
