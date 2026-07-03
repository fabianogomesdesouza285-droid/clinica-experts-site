-- ============================================
-- VigoreFlow - Setup do Painel de Assinantes
-- Execute no Supabase SQL Editor (apos supabase-setup.sql)
-- ============================================

-- PERFIL DA CLINICA (1 por usuario autenticado)
CREATE TABLE IF NOT EXISTS perfis (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome_clinica VARCHAR(255),
  plano VARCHAR(50) DEFAULT 'basic',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PACIENTES / CONTATOS
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AGENDA
CREATE TABLE IF NOT EXISTS agenda_eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id),
  titulo VARCHAR(255) NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'confirmado',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FINANCEIRO
CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tipo VARCHAR(10) NOT NULL, -- entrada | saida
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'pago',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ESTOQUE
CREATE TABLE IF NOT EXISTS estoque_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  quantidade INTEGER DEFAULT 0,
  quantidade_minima INTEGER DEFAULT 0,
  preco DECIMAL(10,2),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfil proprio - select" ON perfis FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Perfil proprio - insert" ON perfis FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Perfil proprio - update" ON perfis FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Pacientes proprios - select" ON pacientes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Pacientes proprios - insert" ON pacientes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Pacientes proprios - update" ON pacientes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Pacientes proprios - delete" ON pacientes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Agenda propria - select" ON agenda_eventos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Agenda propria - insert" ON agenda_eventos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Agenda propria - update" ON agenda_eventos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Agenda propria - delete" ON agenda_eventos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Financeiro proprio - select" ON financeiro_lancamentos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Financeiro proprio - insert" ON financeiro_lancamentos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Financeiro proprio - update" ON financeiro_lancamentos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Financeiro proprio - delete" ON financeiro_lancamentos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Estoque proprio - select" ON estoque_itens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Estoque proprio - insert" ON estoque_itens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Estoque proprio - update" ON estoque_itens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Estoque proprio - delete" ON estoque_itens FOR DELETE TO authenticated USING (auth.uid() = user_id);
