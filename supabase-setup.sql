-- Supabase Setup SQL
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  clinica VARCHAR(255),
  plano_interesse VARCHAR(50),
  mensagem TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  preco_mensal DECIMAL(10,2),
  preco_anual DECIMAL(10,2),
  destaque BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insert leads" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Read leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert agendamentos" ON agendamentos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Read agendamentos" ON agendamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read planos" ON planos FOR SELECT TO anon USING (ativo = true);
