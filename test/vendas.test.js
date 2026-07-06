/* Testes da tela Vendas (cards + rankings). node test/vendas.test.js */
'use strict';
const { load } = require('./harness');

(async () => {
  const t = load();
  const { sandbox, els, eq, contains, section } = t;

  t.setDB({
    vendas: [
      { id: '1', descricao: 'Botox',      valor: 1000, status: 'pago',     data_venda: '2026-07-01', pacientes: { nome: 'Ana' } },
      { id: '2', descricao: 'Botox',      valor: 500,  status: 'pago',     data_venda: '2026-07-02', pacientes: { nome: 'Bruno' } },
      { id: '3', descricao: 'Preenchimento', valor: 800, status: 'pendente', data_venda: '2026-07-03', pacientes: { nome: 'Ana' } },
    ],
  });

  sandbox.currentUserId = 'u1';
  await sandbox.loadVendas();
  await t.tick();

  section('Cards de vendas');
  eq('Faturamento (soma pagos 1000+500)', els.vndStatFaturamento.textContent, 'R$ 1.500,00');
  eq('Total de vendas (3)',               els.vndStatCount.textContent,       3);
  eq('Ticket medio (1500/2)',             els.vndStatTicket.textContent,      'R$ 750,00');
  eq('Pendente (800)',                    els.vndStatPendente.textContent,    'R$ 800,00');

  section('Rankings');
  contains('Ranking produto: Botox 1.500', els.listVendasRankingProduto.innerHTML, 'R$ 1.500,00');
  contains('Ranking paciente: Ana 1.000',  els.listVendasRankingPaciente.innerHTML, 'R$ 1.000,00');

  process.exit(t.done());
})();
