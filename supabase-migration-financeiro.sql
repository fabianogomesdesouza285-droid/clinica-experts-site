-- ============================================================
-- Migracao Financeiro: categoria, vencimento e contas financeiras
-- Cole no SQL Editor do Supabase e clique em "Run".
-- E seguro rodar mais de uma vez (usa IF NOT EXISTS).
-- ============================================================

-- 1) Campos novos em financeiro_lancamentos
ALTER TABLE financeiro_lancamentos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);
ALTER TABLE financeiro_lancamentos ADD COLUMN IF NOT EXISTS vencimento DATE;
ALTER TABLE financeiro_lancamentos ADD COLUMN IF NOT EXISTS conta_id UUID;

-- 2) Tabela de contas financeiras (Banco, Caixa, etc.)
CREATE TABLE IF NOT EXISTS contas_financeiras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  tipo VARCHAR(40) DEFAULT 'conta_corrente', -- conta_corrente | caixa | poupanca | outro
  saldo_inicial DECIMAL(12,2) DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3) Seguranca (RLS): cada usuario so ve/edita as proprias contas
ALTER TABLE contas_financeiras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contas proprias - select" ON contas_financeiras;
CREATE POLICY "Contas proprias - select" ON contas_financeiras
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Contas proprias - insert" ON contas_financeiras;
CREATE POLICY "Contas proprias - insert" ON contas_financeiras
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Contas proprias - update" ON contas_financeiras;
CREATE POLICY "Contas proprias - update" ON contas_financeiras
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Contas proprias - delete" ON contas_financeiras;
CREATE POLICY "Contas proprias - delete" ON contas_financeiras
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Pronto! As contas "Banco padrao" e "Caixa" sao criadas
-- automaticamente pelo app na primeira vez que voce abrir a
-- tela Financeiro depois desta migracao. Nao precisa inserir aqui.
-- ============================================================
