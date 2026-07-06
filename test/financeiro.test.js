/*
 * Teste automatizado do Financeiro (roda o dashboard.js REAL em Node, com
 * DOM e Supabase falsos). Uso:  node test/financeiro.test.js
 *
 * Nao substitui teste no navegador, mas verifica a LOGICA de calculo dos
 * cards, blocos A receber/A pagar, Contas financeiras e Categorias.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---------- DOM falso ----------
const els = {};
function makeEl(id) {
  const target = { id: id || '', textContent: '', innerHTML: '', value: '', _children: [] };
  const noop = () => {};
  const classList = { add: noop, remove: noop, toggle: noop, contains: () => false };
  const handler = {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (prop === 'classList') return classList;
      if (prop === 'style') return (t._style || (t._style = {}));
      if (prop === 'appendChild') return (c) => { t._children.push(c); return c; };
      if (prop === 'querySelectorAll') return () => [];
      if (prop === 'querySelector') return () => makeEl('');
      if (prop === 'addEventListener' || prop === 'removeEventListener') return noop;
      if (prop === 'setAttribute') return (k, v) => { t['attr_' + k] = v; };
      if (prop === 'getAttribute') return (k) => t['attr_' + k];
      if (prop === 'closest') return () => null;
      if (prop === 'focus' || prop === 'reset' || prop === 'remove' || prop === 'click') return noop;
      return undefined;
    },
    set(t, prop, val) { t[prop] = val; return true; },
  };
  return new Proxy(target, handler);
}
function getEl(id) { return (els[id] || (els[id] = makeEl(id))); }

const documentMock = {
  getElementById: getEl,
  querySelectorAll: () => [],
  querySelector: () => makeEl(''),
  createElement: () => makeEl(''),
  addEventListener: () => {},
  body: makeEl('body'),
  documentElement: makeEl('html'),
};

// ---------- Supabase falso ----------
let DB = {};
function makeQuery(table) {
  const q = {
    _rows: (DB[table] || []).slice(),
    select() { return q; },
    eq() { return q; },
    neq() { return q; },
    gte() { return q; },
    lte() { return q; },
    in() { return q; },
    order() { return q; },
    limit() { return q; },
    range() { return q; },
    async maybeSingle() { return { data: q._rows[0] || null, error: null }; },
    async single() { return { data: q._rows[0] || null, error: null }; },
    async insert(rows) { DB[table] = (DB[table] || []).concat(rows); return { data: rows, error: null }; },
    async update() { return { data: null, error: null }; },
    async delete() { return { data: null, error: null }; },
    then(resolve) { resolve({ data: q._rows, error: (DB[table] === undefined ? { message: 'relation does not exist' } : null) }); },
  };
  return q;
}
const sbAuthMock = { from: (table) => makeQuery(table), auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) } };

// ---------- Contexto do vm ----------
const sandbox = {
  console, Math, Date, JSON, Number, String, Boolean, Array, Object, parseFloat, parseInt, isNaN, RegExp,
  setTimeout: (fn) => { try { fn(); } catch (e) {} return 0; }, clearTimeout: () => {},
  document: documentMock,
  window: {},
  location: { href: '', search: '', hash: '' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: { userAgent: 'node' },
  alert: () => {}, confirm: () => true, prompt: () => null,
  sbAuth: sbAuthMock,
  vfRequireAuth: async () => ({ user: { id: 'u1', email: 'test@test' } }),
  vfSignOut: async () => {},
  createClient: () => sbAuthMock,
  supabase: { createClient: () => sbAuthMock },
  fetch: async () => ({ json: async () => ({}) }),
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// Carrega o dashboard.js REAL
const code = fs.readFileSync(path.join(__dirname, '..', 'dashboard.js'), 'utf8');
try { vm.runInContext(code, sandbox, { filename: 'dashboard.js' }); }
catch (e) { console.error('Erro ao carregar dashboard.js:', e.message); process.exit(1); }

// ---------- Helpers de teste ----------
let pass = 0, fail = 0;
function eq(nome, got, exp) {
  const ok = String(got) === String(exp);
  console.log((ok ? '  PASS ' : '  FAIL ') + nome + '  ->  got=' + JSON.stringify(got) + ' exp=' + JSON.stringify(exp));
  ok ? pass++ : fail++;
}
function contains(nome, hay, needle) {
  const ok = String(hay).indexOf(needle) !== -1;
  console.log((ok ? '  PASS ' : '  FAIL ') + nome + (ok ? '' : '  (nao contem "' + needle + '")'));
  ok ? pass++ : fail++;
}

// ---------- Dados de teste ----------
const now = new Date();
function iso(d) { return d.toISOString().slice(0, 10); }
function daysFromNow(n) { const d = new Date(now); d.setDate(d.getDate() + n); return iso(d); }

DB = {
  financeiro_lancamentos: [
    { id: 'a', tipo: 'entrada', valor: 1000, status: 'pago',     data_lancamento: daysFromNow(-10), categoria: 'Servicos' },
    { id: 'b', tipo: 'entrada', valor: 500,  status: 'pendente', data_lancamento: daysFromNow(-1), vencimento: daysFromNow(10), categoria: 'Servicos' },
    { id: 'c', tipo: 'entrada', valor: 300,  status: 'pendente', data_lancamento: daysFromNow(-1), vencimento: daysFromNow(-3), categoria: 'Outros' },
    { id: 'd', tipo: 'saida',   valor: 400,  status: 'pago',     data_lancamento: daysFromNow(-10), categoria: 'Aluguel' },
    { id: 'e', tipo: 'saida',   valor: 200,  status: 'pendente', data_lancamento: daysFromNow(-1), vencimento: daysFromNow(-2), categoria: 'Aluguel' },
  ],
  contas_financeiras: [], // vazio -> testa auto-seed (Banco padrao + Caixa)
};

(async () => {
  sandbox.currentUserId = 'u1';
  sandbox.finLancamentosCache = DB.financeiro_lancamentos.slice();
  await sandbox.loadFinanceiro();
  await new Promise((r) => setTimeout(r, 60)); // deixa loadFinContas (async) terminar

  console.log('\n== Cards ==');
  eq('Receitas (todas entradas)', els.finEntradas.textContent, 'R$ 1.800,00');
  eq('Despesas (com sinal)',      els.finSaidas.textContent,   '-R$ 600,00');
  eq('A receber (entradas pend.)',els.finAReceber.textContent, 'R$ 800,00');
  eq('A pagar (saidas pend.)',    els.finAPagar.textContent,   '-R$ 200,00');

  console.log('\n== A receber (detalhado) ==');
  contains('Inadimplencia = 300', els.finAReceberDetalhe.innerHTML, 'R$ 300,00');
  contains('Para este ano = 800', els.finAReceberDetalhe.innerHTML, 'R$ 800,00');
  contains('Recebidos no ano = 1.000', els.finAReceberDetalhe.innerHTML, 'R$ 1.000,00');

  console.log('\n== A pagar (detalhado) ==');
  contains('Em atraso = 200', els.finAPagarDetalhe.innerHTML, 'R$ 200,00');
  contains('Pagos no ano = 400', els.finAPagarDetalhe.innerHTML, 'R$ 400,00');

  console.log('\n== Contas financeiras (auto-seed + saldo) ==');
  contains('Criou Banco padrao', els.finContas.innerHTML, 'Banco padrao');
  contains('Criou Caixa', els.finContas.innerHTML, 'Caixa');
  contains('Saldo total = 600 (1000 pago - 400 pago)', els.finContas.innerHTML, 'R$ 600,00');

  console.log('\n== Categorias (pizza, tipo entrada) ==');
  sandbox.renderFinCategorias();
  contains('Servicos 1500', els.finCategorias.innerHTML, 'R$ 1.500,00');
  contains('Outros 300', els.finCategorias.innerHTML, 'R$ 300,00');

  console.log('\n============================');
  console.log('  RESULTADO: ' + pass + ' passaram, ' + fail + ' falharam');
  console.log('============================');
  process.exit(fail === 0 ? 0 : 1);
})();
