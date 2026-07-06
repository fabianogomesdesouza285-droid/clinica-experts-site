/*
 * Harness de teste: carrega o dashboard.js REAL em Node, com DOM e Supabase
 * falsos. Cada chamada de load() cria um contexto isolado.
 *
 * Uso:
 *   const { load } = require('./harness');
 *   const t = load();                 // carrega dashboard.js num sandbox novo
 *   t.setDB({ tabela: [ ...linhas ] });
 *   t.sandbox.currentUserId = 'u1';
 *   await t.sandbox.loadFinanceiro();
 *   t.eq('nome', t.els.algumId.textContent, 'esperado');
 *   process.exit(t.done());
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const els = {};
  function makeEl(id) {
    const target = { id: id || '', value: '', _children: [], _html: '', _text: '', _attrs: {} };
    const noop = () => {};
    const classList = { add: noop, remove: noop, toggle: noop, contains: () => false };
    return new Proxy(target, {
      get(t, prop) {
        // innerHTML/textContent refletem os filhos montados via appendChild
        if (prop === 'innerHTML') return t._children.length ? t._children.map((c) => c.__html__()).join('') : t._html;
        if (prop === 'textContent') return t._children.length ? t._children.map((c) => c.__text__()).join(' ') : t._text;
        if (prop === '__html__') return () => (t._children.length
          ? t._children.map((c) => c.__html__()).join('')
          : (t._html || '') + (t._text || '') + (t.href ? ' ' + t.href : ''));
        if (prop === '__text__') return () => (t._children.length ? t._children.map((c) => c.__text__()).join(' ') : (t._text || ''));
        if (prop in t) return t[prop];
        if (prop === 'classList') return classList;
        if (prop === 'style') return (t._style || (t._style = {}));
        if (prop === 'appendChild') return (c) => { t._children.push(c); return c; };
        if (prop === 'querySelectorAll') return () => [];
        if (prop === 'querySelector') return () => makeEl('');
        if (prop === 'addEventListener' || prop === 'removeEventListener') return noop;
        if (prop === 'setAttribute') return (k, v) => { t._attrs[k] = v; };
        if (prop === 'getAttribute') return (k) => t._attrs[k];
        if (prop === 'closest') return () => null;
        if (['focus', 'reset', 'remove', 'click', 'blur', 'scrollIntoView'].indexOf(prop) !== -1) return noop;
        return undefined;
      },
      set(t, prop, val) {
        if (prop === 'innerHTML') { t._html = val; t._children = []; return true; }
        if (prop === 'textContent') { t._text = val; return true; }
        t[prop] = val; return true;
      },
    });
  }
  const getEl = (id) => (els[id] || (els[id] = makeEl(id)));

  const documentMock = {
    getElementById: getEl,
    querySelectorAll: () => [],
    querySelector: () => makeEl(''),
    createElement: () => makeEl(''),
    addEventListener: () => {},
    body: makeEl('body'),
    documentElement: makeEl('html'),
  };

  let DB = {};
  function makeQuery(table) {
    const q = {
      _rows: (DB[table] || []).slice(),
      select() { return q; }, eq() { return q; }, neq() { return q; },
      gte() { return q; }, lte() { return q; }, in() { return q; },
      order() { return q; }, limit() { return q; }, range() { return q; },
      async maybeSingle() { return { data: q._rows[0] || null, error: null }; },
      async single() { return { data: q._rows[0] || null, error: null }; },
      async insert(rows) { DB[table] = (DB[table] || []).concat(rows); return { data: rows, error: null }; },
      async update() { return { data: null, error: null }; },
      async delete() { return { data: null, error: null }; },
      then(resolve) { resolve({ data: q._rows, error: (DB[table] === undefined ? { message: 'relation does not exist' } : null) }); },
    };
    return q;
  }
  const sbAuthMock = {
    from: (t) => makeQuery(t),
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    functions: { invoke: async () => ({ data: null, error: null }) },
    channel: () => { const ch = { on: () => ch, subscribe: () => ch, unsubscribe: () => {} }; return ch; },
  };

  const sandbox = {
    console, Math, Date, JSON, Number, String, Boolean, Array, Object, parseFloat, parseInt, isNaN, RegExp,
    setTimeout: (fn) => { try { fn(); } catch (e) {} return 0; }, clearTimeout: () => {},
    document: documentMock,
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

  const code = fs.readFileSync(path.join(__dirname, '..', 'dashboard.js'), 'utf8');
  vm.runInContext(code, sandbox, { filename: 'dashboard.js' });

  // API de teste
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
  function section(nome) { console.log('\n== ' + nome + ' =='); }
  function done() {
    console.log('  -> ' + pass + ' passaram, ' + fail + ' falharam');
    return fail === 0 ? 0 : 1;
  }
  const tick = () => new Promise((r) => setTimeout(r, 60));

  return { sandbox, els, setDB: (d) => { DB = d; }, eq, contains, section, done, tick };
}

module.exports = { load };
