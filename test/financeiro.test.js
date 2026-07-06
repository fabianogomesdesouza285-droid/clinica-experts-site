/* Testes do Financeiro (roda o dashboard.js real). node test/financeiro.test.js */
'use strict';
const { load } = require('./harness');

(async () => {
  const t = load();
  const { sandbox, els, eq, contains, section } = t;

  const now = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const days = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return iso(d); };

  t.setDB({
    financeiro_lancamentos: [
      { id: 'a', tipo: 'entrada', valor: 1000, status: 'pago',     data_lancamento: days(-10), categoria: 'Servicos' },
      { id: 'b', tipo: 'entrada', valor: 500,  status: 'pendente', data_lancamento: days(-1), vencimento: days(10), categoria: 'Servicos' },
      { id: 'c', tipo: 'entrada', valor: 300,  status: 'pendente', data_lancamento: days(-1), vencimento: days(-3), categoria: 'Outros' },
      { id: 'd', tipo: 'saida',   valor: 400,  status: 'pago',     data_lancamento: days(-10), categoria: 'Aluguel' },
      { id: 'e', tipo: 'saida',   valor: 200,  status: 'pendente', data_lancamento: days(-1), vencimento: days(-2), categoria: 'Aluguel' },
    ],
    contas_financeiras: [],
  });

  sandbox.currentUserId = 'u1';
  sandbox.finLancamentosCache = null;
  await sandbox.loadFinanceiro();
  await t.tick();

  section('Cards');
  eq('Receitas (todas entradas)', els.finEntradas.textContent, 'R$ 1.800,00');
  eq('Despesas (com sinal)',      els.finSaidas.textContent,   '-R$ 600,00');
  eq('A receber (entradas pend.)',els.finAReceber.textContent, 'R$ 800,00');
  eq('A pagar (saidas pend.)',    els.finAPagar.textContent,   '-R$ 200,00');

  section('A receber (detalhado)');
  contains('Inadimplencia = 300', els.finAReceberDetalhe.innerHTML, 'R$ 300,00');
  contains('Para este ano = 800', els.finAReceberDetalhe.innerHTML, 'R$ 800,00');
  contains('Recebidos no ano = 1.000', els.finAReceberDetalhe.innerHTML, 'R$ 1.000,00');

  section('A pagar (detalhado)');
  contains('Em atraso = 200', els.finAPagarDetalhe.innerHTML, 'R$ 200,00');
  contains('Pagos no ano = 400', els.finAPagarDetalhe.innerHTML, 'R$ 400,00');

  section('Contas financeiras (auto-seed + saldo)');
  contains('Criou Banco padrao', els.finContas.innerHTML, 'Banco padrao');
  contains('Criou Caixa', els.finContas.innerHTML, 'Caixa');
  contains('Saldo total = 600', els.finContas.innerHTML, 'R$ 600,00');

  section('Categorias (pizza, tipo entrada)');
  sandbox.renderFinCategorias();
  contains('Servicos 1500', els.finCategorias.innerHTML, 'R$ 1.500,00');
  contains('Outros 300', els.finCategorias.innerHTML, 'R$ 300,00');

  process.exit(t.done());
})();
