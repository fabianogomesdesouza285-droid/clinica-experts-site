// ============================================
// v2
// VigoreFlow - dashboard.js
// Logica do painel de assinantes (CRUD Supabase)
// ============================================

var currentUserId = null;

function fmtMoney(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function init() {
  var session = await vfRequireAuth();
  if (!session) return;
  var user = session.user;
  currentUserId = user.id;
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('cfgEmail').textContent = user.email;

  var perfilRes = await sbAuth.from('perfis').select('*').eq('id', user.id).maybeSingle();
  var perfil = perfilRes.data;
  if (!perfil) {
    await sbAuth.from('perfis').insert([{ id: user.id, nome_clinica: 'Minha Clinica' }]);
    var r2 = await sbAuth.from('perfis').select('*').eq('id', user.id).maybeSingle();
    perfil = r2.data;
  }
  document.getElementById('cfgClinica').textContent = perfil ? perfil.nome_clinica : '-';
  document.getElementById('cfgPlano').textContent = perfil ? perfil.plano : '-';

  await loadPacientes();
  await loadAgenda();
  await loadFinanceiro();
  await loadEstoque();
      await loadAtendimentos();
}

async function loadPacientes() {
  var res = await sbAuth.from('pacientes').select('*').eq('user_id', currentUserId).order('criado_em', { ascending: false });
  var list = res.data || [];
  document.getElementById('statPacientes').textContent = list.length;
  var select = document.getElementById('agPaciente');
  select.innerHTML = '<option value=\"\">Sem paciente vinculado</option>';
  list.forEach(function (p) {
    var opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nome;
    select.appendChild(opt);
  });
      var selectAtd = document.getElementById('atdPaciente'); selectAtd.innerHTML = '<option value="">Sem paciente vinculado</option>'; list.forEach(function (p) { var opt2 = document.createElement('option'); opt2.value = p.id; opt2.textContent = p.nome; selectAtd.appendChild(opt2); });
  var container = document.getElementById('listPacientes');
  if (list.length === 0) {
    container.innerHTML = '<p class=\"dash-empty\">Nenhum paciente cadastrado.</p>';
    return;
  }
  container.innerHTML = '';
  list.forEach(function (p) {
    var row = document.createElement('div');
    row.className = 'dash-row';
    var info = document.createElement('div');
    info.className = 'dash-row-info';
    var title = document.createElement('span');
    title.className = 'dash-row-title';
    title.textContent = p.nome;
    var sub = document.createElement('span');
    sub.className = 'dash-row-sub';
    var subParts = [];
    if (p.whatsapp) subParts.push(p.whatsapp);
    if (p.email) subParts.push(p.email);
    sub.textContent = subParts.join(' - ');
    info.appendChild(title);
    info.appendChild(sub);
    var btn = document.createElement('button');
    btn.className = 'dash-del-btn';
    btn.textContent = 'Remover';
    btn.addEventListener('click', async function () {
      await sbAuth.from('pacientes').delete().eq('id', p.id);
      loadPacientes();
      loadAgenda();
    });
    row.appendChild(info);
    row.appendChild(btn);
    container.appendChild(row);
  });
}

  async function loadAtendimentos() { var res = await sbAuth.from('atendimentos').select('*, pacientes(nome)').eq('user_id', currentUserId).order('data_atendimento', { ascending: false }); var list = res.data || []; var container = document.getElementById('listAtendimentos'); if (list.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhum atendimento ainda.</p>'; return; } container.innerHTML = ''; list.forEach(function (a) { var row = document.createElement('div'); row.className = 'dash-row'; var info = document.createElement('div'); info.className = 'dash-row-info'; var title = document.createElement('span'); title.className = 'dash-row-title'; var pacienteNome = a.pacientes && a.pacientes.nome ? a.pacientes.nome : 'Sem paciente'; title.textContent = a.procedimento + ' - ' + pacienteNome; var sub = document.createElement('span'); sub.className = 'dash-row-sub'; var dt = new Date(a.data_atendimento); var statusLabel = a.status === 'concluido' ? 'Concluido' : (a.status === 'cancelado' ? 'Cancelado' : 'Em andamento'); sub.textContent = dt.toLocaleString('pt-BR') + (a.profissional ? ' - ' + a.profissional : '') + ' - ' + statusLabel; info.appendChild(title); info.appendChild(sub); var btn = document.createElement('button'); btn.className = 'dash-del-btn'; btn.textContent = 'Remover'; btn.addEventListener('click', async function () { await sbAuth.from('atendimentos').delete().eq('id', a.id); loadAtendimentos(); }); row.appendChild(info); row.appendChild(btn); container.appendChild(row); }); }

function renderAgendaList(container, list) {
  if (!list || list.length === 0) {
    container.innerHTML = '<p class=\"dash-empty\">Nenhum agendamento ainda.</p>';
    return;
  }
  container.innerHTML = '';
  list.forEach(function (ev) {
    var row = document.createElement('div');
    row.className = 'dash-row';
    var info = document.createElement('div');
    info.className = 'dash-row-info';
    var title = document.createElement('span');
    title.className = 'dash-row-title';
    title.textContent = ev.titulo;
    var sub = document.createElement('span');
    sub.className = 'dash-row-sub';
    var dt = new Date(ev.data_inicio);
    var pacienteNome = ev.pacientes && ev.pacientes.nome ? ev.pacientes.nome : null;
    sub.textContent = dt.toLocaleString('pt-BR') + (pacienteNome ? ' - ' + pacienteNome : '');
    info.appendChild(title);
    info.appendChild(sub);
    var btn = document.createElement('button');
    btn.className = 'dash-del-btn';
    btn.textContent = 'Remover';
    btn.addEventListener('click', async function () {
      await sbAuth.from('agenda_eventos').delete().eq('id', ev.id);
      loadAgenda();
    });
    row.appendChild(info);
    row.appendChild(btn);
    container.appendChild(row);
  });
}

async function loadAgenda() {
  var res = await sbAuth.from('agenda_eventos').select('*, pacientes(nome)').eq('user_id', currentUserId).order('data_inicio', { ascending: true });
  var list = res.data || [];
  var now = new Date();
  var futuros = list.filter(function (e) { return new Date(e.data_inicio) >= now; });
  document.getElementById('statAgendamentos').textContent = futuros.length;
  renderAgendaList(document.getElementById('listAgenda'), list);
  renderAgendaList(document.getElementById('listProximos'), futuros.slice(0, 5));
}

async function loadFinanceiro() {
  var res = await sbAuth.from('financeiro_lancamentos').select('*').eq('user_id', currentUserId).order('data_lancamento', { ascending: false });
  var list = res.data || [];
  var entradas = 0, saidas = 0;
  list.forEach(function (l) {
    var v = parseFloat(l.valor);
    if (l.tipo === 'entrada') entradas += v; else saidas += v;
  });
  document.getElementById('finEntradas').textContent = fmtMoney(entradas);
  document.getElementById('finSaidas').textContent = fmtMoney(saidas);
  document.getElementById('finSaldo').textContent = fmtMoney(entradas - saidas);

  var nowD = new Date();
  var mEntradas = 0, mSaidas = 0;
  list.forEach(function (l) {
    var d = new Date(l.data_lancamento);
    if (d.getFullYear() === nowD.getFullYear() && d.getMonth() === nowD.getMonth()) {
      var v = parseFloat(l.valor);
      if (l.tipo === 'entrada') mEntradas += v; else mSaidas += v;
    }
  });
  document.getElementById('statSaldo').textContent = fmtMoney(mEntradas - mSaidas);

  var container = document.getElementById('listFinanceiro');
  if (list.length === 0) {
    container.innerHTML = '<p class=\"dash-empty\">Nenhum lancamento ainda.</p>';
    return;
  }
  container.innerHTML = '';
  list.forEach(function (l) {
    var row = document.createElement('div');
    row.className = 'dash-row';
    var info = document.createElement('div');
    info.className = 'dash-row-info';
    var title = document.createElement('span');
    title.className = 'dash-row-title';
    title.textContent = l.descricao;
    var sub = document.createElement('span');
    sub.className = 'dash-row-sub';
    sub.textContent = l.data_lancamento + ' - ' + (l.tipo === 'entrada' ? '+' : '-') + fmtMoney(l.valor);
    info.appendChild(title);
    info.appendChild(sub);
    var btn = document.createElement('button');
    btn.className = 'dash-del-btn';
    btn.textContent = 'Remover';
    btn.addEventListener('click', async function () {
      await sbAuth.from('financeiro_lancamentos').delete().eq('id', l.id);
      loadFinanceiro();
    });
    row.appendChild(info);
    row.appendChild(btn);
    container.appendChild(row);
  });
}

async function loadEstoque() {
  var res = await sbAuth.from('estoque_itens').select('*').eq('user_id', currentUserId).order('nome', { ascending: true });
  var list = res.data || [];
  var container = document.getElementById('listEstoque');
  if (list.length === 0) {
    container.innerHTML = '<p class=\"dash-empty\">Nenhum item cadastrado.</p>';
    return;
  }
  container.innerHTML = '';
  list.forEach(function (it) {
    var low = it.quantidade_minima != null && it.quantidade <= it.quantidade_minima;
    var row = document.createElement('div');
    row.className = 'dash-row' + (low ? ' dash-row-low' : '');
    var info = document.createElement('div');
    info.className = 'dash-row-info';
    var title = document.createElement('span');
    title.className = 'dash-row-title';
    title.textContent = it.nome;
    var sub = document.createElement('span');
    sub.className = 'dash-row-sub';
    sub.textContent = 'Qtd: ' + it.quantidade + (it.preco ? ' - ' + fmtMoney(it.preco) : '');
    info.appendChild(title);
    info.appendChild(sub);
    if (low) {
      var badge = document.createElement('span');
      badge.className = 'dash-badge';
      badge.textContent = 'Estoque baixo';
      info.appendChild(badge);
    }
    var btn = document.createElement('button');
    btn.className = 'dash-del-btn';
    btn.textContent = 'Remover';
    btn.addEventListener('click', async function () {
      await sbAuth.from('estoque_itens').delete().eq('id', it.id);
      loadEstoque();
    });
    row.appendChild(info);
    row.appendChild(btn);
    container.appendChild(row);
  });
}

document.getElementById('formPaciente').addEventListener('submit', async function (e) {
  e.preventDefault();
  var nome = document.getElementById('pacNome').value.trim();
  var whatsapp = document.getElementById('pacWhatsapp').value.trim();
  var email = document.getElementById('pacEmail').value.trim();
  if (!nome) return;
  await sbAuth.from('pacientes').insert([{ user_id: currentUserId, nome: nome, whatsapp: whatsapp || null, email: email || null }]);
  e.target.reset();
  loadPacientes();
});

document.getElementById('formAtendimento').addEventListener('submit', async function (e) { e.preventDefault(); var pacienteId = document.getElementById('atdPaciente').value || null; var profissional = document.getElementById('atdProfissional').value.trim(); var procedimento = document.getElementById('atdProcedimento').value.trim(); var dataStr = document.getElementById('atdData').value; var status = document.getElementById('atdStatus').value; if (!procedimento || !dataStr) return; await sbAuth.from('atendimentos').insert([{ user_id: currentUserId, paciente_id: pacienteId, profissional: profissional || null, procedimento: procedimento, status: status, data_atendimento: new Date(dataStr).toISOString() }]); e.target.reset(); loadAtendimentos(); });

document.getElementById('formAgenda').addEventListener('submit', async function (e) {
  e.preventDefault();
  var titulo = document.getElementById('agTitulo').value.trim();
  var pacienteId = document.getElementById('agPaciente').value || null;
  var dataStr = document.getElementById('agData').value;
  if (!titulo || !dataStr) return;
  await sbAuth.from('agenda_eventos').insert([{ user_id: currentUserId, paciente_id: pacienteId, titulo: titulo, data_inicio: new Date(dataStr).toISOString(), status: 'confirmado' }]);
  e.target.reset();
  loadAgenda();
});

document.getElementById('formFinanceiro').addEventListener('submit', async function (e) {
  e.preventDefault();
  var tipo = document.getElementById('finTipo').value;
  var descricao = document.getElementById('finDescricao').value.trim();
  var valor = parseFloat(document.getElementById('finValor').value);
  var dataVal = document.getElementById('finData').value;
  if (!descricao || isNaN(valor) || !dataVal) return;
  await sbAuth.from('financeiro_lancamentos').insert([{ user_id: currentUserId, tipo: tipo, descricao: descricao, valor: valor, data_lancamento: dataVal }]);
  e.target.reset();
  loadFinanceiro();
});

document.getElementById('formEstoque').addEventListener('submit', async function (e) {
  e.preventDefault();
  var nome = document.getElementById('estNome').value.trim();
  var qtd = parseInt(document.getElementById('estQtd').value, 10);
  var qtdMinRaw = document.getElementById('estQtdMin').value;
  var precoRaw = document.getElementById('estPreco').value;
  if (!nome || isNaN(qtd)) return;
  await sbAuth.from('estoque_itens').insert([{ user_id: currentUserId, nome: nome, quantidade: qtd, quantidade_minima: qtdMinRaw ? parseInt(qtdMinRaw, 10) : 0, preco: precoRaw ? parseFloat(precoRaw) : null }]);
  e.target.reset();
  loadEstoque();
});

var navItems = document.querySelectorAll('.dash-nav-item');
var views = document.querySelectorAll('.dash-view');
var viewTitleEl = document.getElementById('viewTitle');
var viewTitles = { inicio: 'Inicio', agenda: 'Agenda', pacientes: 'Pacientes', atendimentos: 'Atendimentos', financeiro: 'Financeiro', estoque: 'Estoque', config: 'Configuracoes' };

navItems.forEach(function (btn) {
  btn.addEventListener('click', function () {
    navItems.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var view = btn.getAttribute('data-view');
    views.forEach(function (v) { v.classList.remove('active'); });
    var target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');
    viewTitleEl.textContent = viewTitles[view] || view;
    closeSidebar();
  });
});

var sidebarEl = document.getElementById('sidebar');
var overlayEl = document.getElementById('dashOverlay');

function closeSidebar() {
  sidebarEl.classList.remove('open');
  overlayEl.classList.remove('open');
}

document.getElementById('btnMenu').addEventListener('click', function () {
  sidebarEl.classList.add('open');
  overlayEl.classList.add('open');
});
overlayEl.addEventListener('click', closeSidebar);

document.getElementById('btnLogout').addEventListener('click', vfSignOut);

init();
