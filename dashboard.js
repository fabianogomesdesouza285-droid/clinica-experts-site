// ============================================
// v2 (leads)
// VigoreFlow - dashboard.js
// Logica do painel de assinantes (CRUD Supabase)
// ============================================

var currentUserId = null;

// ===== Inicio - estado dos relatorios/filtros =====
var profissionaisCache = [];
var finLancamentosCache = [];
var inPeriodo = 'semana';
var inRefDate = new Date();

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
document.getElementById('assPlano').textContent = perfil ? perfil.plano : '-';
document.getElementById('assClinica').textContent = perfil ? perfil.nome_clinica : '-';
document.getElementById('assEmail').textContent = user.email;
document.getElementById('cfgNomeInput').value = perfil ? perfil.nome_clinica : '';
var hfInit = perfil && perfil.horario_funcionamento ? perfil.horario_funcionamento : { dias: [1,2,3,4,5], abertura: '08:00', fechamento: '18:00' };
document.querySelectorAll('.cfgDia').forEach(function (cb) { cb.checked = hfInit.dias.indexOf(Number(cb.value)) > -1; });
document.getElementById('cfgAbertura').value = hfInit.abertura;
document.getElementById('cfgFechamento').value = hfInit.fechamento;
renderHorarioResumo(hfInit);

await loadPacientes();
await loadAgenda();
await loadFinanceiro();
await loadEstoque();
await loadAtendimentos();
await loadVendas();
await loadComissoes();
await loadProfissionais();
await loadProcedimentos();
await loadFornecedores();
await loadSalas();
await loadLeads();
document.getElementById('aniMes').value = String(new Date().getMonth() + 1);
await loadAniversariantes();
await loadAniversariantesHome();
}

async function loadAniversariantesHome() {
var res = await sbAuth.from("pacientes").select("*").eq("user_id", currentUserId);
var list = res.data || [];
var hoje = new Date(); hoje.setHours(0,0,0,0);
var comData = list.filter(function (p) { return p.data_nascimento; }).map(function (p) {
var d = new Date(p.data_nascimento + "T00:00:00");
var prox = new Date(hoje.getFullYear(), d.getMonth(), d.getDate());
if (prox < hoje) prox = new Date(hoje.getFullYear() + 1, d.getMonth(), d.getDate());
var dias = Math.round((prox - hoje) / 86400000);
return { p: p, prox: prox, dias: dias };
});
comData.sort(function (a, b) { return a.dias - b.dias; });
var proximos = comData.filter(function (x) { return x.dias <= 30; }).slice(0, 5);
var container = document.getElementById("listAniversariantesHome");
if (!container) return;
if (proximos.length === 0) { container.innerHTML = "<p class=\"dash-empty\">Nenhum aniversariante nos proximos dias.</p>"; return; }
container.innerHTML = "";
proximos.forEach(function (x) {
var row = document.createElement("div");
row.className = "dash-row";
var info = document.createElement("div");
info.className = "dash-row-info";
var title = document.createElement("span");
title.className = "dash-row-title";
title.textContent = x.p.nome;
var sub = document.createElement("span");
sub.className = "dash-row-sub";
var dLabel = x.dias === 0 ? "Hoje" : (x.dias === 1 ? "Amanha" : "Em " + x.dias + " dias");
sub.textContent = x.prox.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " - " + dLabel;
info.appendChild(title);
info.appendChild(sub);
row.appendChild(info);
container.appendChild(row);
});
}

async function loadPacientes() {
var res = await sbAuth.from('pacientes').select('*').eq('user_id', currentUserId).order('criado_em', { ascending: false });
var list = res.data || [];
document.getElementById('statPacientes').textContent = list.length;
var select = document.getElementById('agModPaciente');
if (select) {
select.innerHTML = '<option value="">Sem paciente vinculado</option>';
list.forEach(function (p) {
var opt = document.createElement('option');
opt.value = p.id;
opt.textContent = p.nome;
select.appendChild(opt);
});
}
var selectFiltro = document.getElementById('fAgPaciente');
if (selectFiltro) {
selectFiltro.innerHTML = '<option value="">Todos os pacientes</option>';
list.forEach(function (p) {
var optF = document.createElement('option');
optF.value = p.id;
optF.textContent = p.nome;
selectFiltro.appendChild(optF);
});
}
var selectAtd = document.getElementById('atdPaciente'); selectAtd.innerHTML = '<option value="">Sem paciente vinculado</option>'; list.forEach(function (p) { var opt2 = document.createElement('option'); opt2.value = p.id; opt2.textContent = p.nome; selectAtd.appendChild(opt2); });
var selectVnd = document.getElementById('vndPaciente'); selectVnd.innerHTML = '<option value="">Sem paciente vinculado</option>'; list.forEach(function (p) { var opt3 = document.createElement('option'); opt3.value = p.id; opt3.textContent = p.nome; selectVnd.appendChild(opt3); });
var container = document.getElementById('listPacientes');
if (list.length === 0) {
container.innerHTML = '<p class="dash-empty">Nenhum paciente cadastrado.</p>';
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


async function loadVendas() { var res = await sbAuth.from('vendas').select('*, pacientes(nome)').eq('user_id', currentUserId).order('data_venda', { ascending: false }); var list = res.data || [];var vFat = 0, vPend = 0, vPagoCount = 0; list.forEach(function (v) { var vv = parseFloat(v.valor); if (v.status === 'pago') { vFat += vv; vPagoCount++; } else if (v.status === 'pendente') { vPend += vv; } }); var elVFat = document.getElementById('vndStatFaturamento'); if (elVFat) elVFat.textContent = fmtMoney(vFat); var elVCount = document.getElementById('vndStatCount'); if (elVCount) elVCount.textContent = list.length; var elVTicket = document.getElementById('vndStatTicket'); if (elVTicket) elVTicket.textContent = fmtMoney(vPagoCount > 0 ? vFat / vPagoCount : 0); var elVPend = document.getElementById('vndStatPendente'); if (elVPend) elVPend.textContent = fmtMoney(vPend); var byProduto = {}; list.forEach(function (v) { if (v.status === 'pago') { byProduto[v.descricao] = (byProduto[v.descricao] || 0) + parseFloat(v.valor); } }); var rankProduto = Object.keys(byProduto).map(function (k) { return { nome: k, total: byProduto[k] }; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 5); var contRP = document.getElementById('listVendasRankingProduto'); if (contRP) { if (rankProduto.length === 0) { contRP.innerHTML = '<p class="dash-empty">Sem dados ainda.</p>'; } else { contRP.innerHTML = ''; rankProduto.forEach(function (r) { var row = document.createElement('div'); row.className = 'dash-row'; var info = document.createElement('div'); info.className = 'dash-row-info'; var title = document.createElement('span'); title.className = 'dash-row-title'; title.textContent = r.nome; var sub = document.createElement('span'); sub.className = 'dash-row-sub'; sub.textContent = fmtMoney(r.total); info.appendChild(title); info.appendChild(sub); row.appendChild(info); contRP.appendChild(row); }); } } var byPaciente = {}; list.forEach(function (v) { if (v.status === 'pago') { var nomeP = v.pacientes && v.pacientes.nome ? v.pacientes.nome : 'Sem paciente'; byPaciente[nomeP] = (byPaciente[nomeP] || 0) + parseFloat(v.valor); } }); var rankPaciente = Object.keys(byPaciente).map(function (k) { return { nome: k, total: byPaciente[k] }; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 5); var contRPac = document.getElementById('listVendasRankingPaciente'); if (contRPac) { if (rankPaciente.length === 0) { contRPac.innerHTML = '<p class="dash-empty">Sem dados ainda.</p>'; } else { contRPac.innerHTML = ''; rankPaciente.forEach(function (r) { var row = document.createElement('div'); row.className = 'dash-row'; var info = document.createElement('div'); info.className = 'dash-row-info'; var title = document.createElement('span'); title.className = 'dash-row-title'; title.textContent = r.nome; var sub = document.createElement('span'); sub.className = 'dash-row-sub'; sub.textContent = fmtMoney(r.total); info.appendChild(title); info.appendChild(sub); row.appendChild(info); contRPac.appendChild(row); }); } } var container = document.getElementById('listVendas'); if (list.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhuma venda ainda.</p>'; return; } container.innerHTML = ''; list.forEach(function (v) { var row = document.createElement('div'); row.className = 'dash-row'; var info = document.createElement('div'); info.className = 'dash-row-info'; var title = document.createElement('span'); title.className = 'dash-row-title'; var pacienteNome = v.pacientes && v.pacientes.nome ? v.pacientes.nome : 'Sem paciente'; title.textContent = v.descricao + ' - ' + fmtMoney(v.valor); var sub = document.createElement('span'); sub.className = 'dash-row-sub'; var dt = new Date(v.data_venda + 'T00:00:00'); var statusLabel = v.status === 'pago' ? 'Pago' : (v.status === 'cancelado' ? 'Cancelado' : 'Pendente'); sub.textContent = dt.toLocaleDateString('pt-BR') + ' - ' + pacienteNome + ' - ' + statusLabel; info.appendChild(title); info.appendChild(sub); var btn = document.createElement('button'); btn.className = 'dash-del-btn'; btn.textContent = 'Remover'; btn.addEventListener('click', async function () { await sbAuth.from('vendas').delete().eq('id', v.id); loadVendas(); }); row.appendChild(info); row.appendChild(btn); container.appendChild(row); }); }

function renderAgendaList(container, list) {
if (!list || list.length === 0) {
container.innerHTML = '<p class="dash-empty">Nenhum agendamento ainda.</p>';
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
title.textContent = (ev.status === 'bloqueado' ? '[Bloqueio] ' : '') + ev.titulo;
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
var futuros = list.filter(function (e) { return new Date(e.data_inicio) >= now && e.status !== 'bloqueado'; });
document.getElementById('statAgendamentos').textContent = futuros.length;
renderAgendaList(document.getElementById('listAgenda'), list);
var limite24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
var listProx24h = list.filter(function (e) { var d = new Date(e.data_inicio); return d >= now && d < limite24h && e.status !== 'bloqueado'; });
renderProx24h(document.getElementById('listProx24h'), listProx24h);
agEventosCache = list; renderAgendaCalendar();
renderInicioReports();
}


async function loadFinanceiro() {
var res = await sbAuth.from('financeiro_lancamentos').select('*').eq('user_id', currentUserId).order('data_lancamento', { ascending: false });
var list = res.data || [];
finLancamentosCache = list;
var entradas = 0, saidas = 0;
list.forEach(function (l) {
var v = parseFloat(l.valor);
if (l.tipo === 'entrada') entradas += v; else saidas += v;
});
document.getElementById('finEntradas').textContent = fmtMoney(entradas);
document.getElementById('finSaidas').textContent = fmtMoney(saidas);
document.getElementById('finSaldo').textContent = fmtMoney(entradas - saidas);
var aReceber = 0, aPagar = 0;
list.forEach(function (l) {
if (l.status === 'pendente') {
var vp = parseFloat(l.valor);
if (l.tipo === 'entrada') aReceber += vp; else aPagar += vp;
}
});
document.getElementById('finAReceber').textContent = fmtMoney(aReceber);
document.getElementById('finAPagar').textContent = fmtMoney(aPagar);

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
var elEntradasMes = document.getElementById("statEntradasMes"); if (elEntradasMes) elEntradasMes.textContent = fmtMoney(mEntradas);
var elSaidasMes = document.getElementById("statSaidasMes"); if (elSaidasMes) elSaidasMes.textContent = fmtMoney(mSaidas);
renderInicioReports();

var container = document.getElementById('listFinanceiro');
if (list.length === 0) {
container.innerHTML = '<p class="dash-empty">Nenhum lancamento ainda.</p>';
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
sub.textContent = l.data_lancamento + ' - ' + (l.tipo === 'entrada' ? '+' : '-') + fmtMoney(l.valor) + ' - ' + (l.status === 'pendente' ? 'Pendente' : 'Pago') + (l.vencimento ? ' - Venc: ' + l.vencimento : '');
info.appendChild(title);
info.appendChild(sub);
row.appendChild(info);
if (l.status === 'pendente') {
var payBtn = document.createElement('button');
payBtn.className = 'btn-dash-primary';
payBtn.textContent = 'Marcar como pago';
payBtn.addEventListener('click', async function () {
await sbAuth.from('financeiro_lancamentos').update({ status: 'pago' }).eq('id', l.id);
loadFinanceiro();
});
row.appendChild(payBtn);
}
var btn = document.createElement('button');
btn.className = 'dash-del-btn';
btn.textContent = 'Remover';
btn.addEventListener('click', async function () {
await sbAuth.from('financeiro_lancamentos').delete().eq('id', l.id);
loadFinanceiro();
});
row.appendChild(btn);
container.appendChild(row);
});
}

async function loadEstoque() {
var res = await sbAuth.from('estoque_itens').select('*').eq('user_id', currentUserId).order('nome', { ascending: true });
var list = res.data || [];
var container = document.getElementById('listEstoque');
if (list.length === 0) {
container.innerHTML = '<p class="dash-empty">Nenhum item cadastrado.</p>';
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
var nascimento = document.getElementById('pacNascimento').value;
if (!nome) return;
await sbAuth.from('pacientes').insert([{ user_id: currentUserId, nome: nome, whatsapp: whatsapp || null, email: email || null, data_nascimento: nascimento || null }]);
e.target.reset();
loadPacientes();
});

document.getElementById('formAtendimento').addEventListener('submit', async function (e) { e.preventDefault(); var pacienteId = document.getElementById('atdPaciente').value || null; var profissional = document.getElementById('atdProfissional').value.trim(); var procedimento = document.getElementById('atdProcedimento').value.trim(); var dataStr = document.getElementById('atdData').value; var status = document.getElementById('atdStatus').value; if (!procedimento || !dataStr) return; await sbAuth.from('atendimentos').insert([{ user_id: currentUserId, paciente_id: pacienteId, profissional: profissional || null, procedimento: procedimento, status: status, data_atendimento: new Date(dataStr).toISOString() }]); e.target.reset(); loadAtendimentos(); });

document.getElementById('formVenda').addEventListener('submit', async function (e) { e.preventDefault(); var pacienteId = document.getElementById('vndPaciente').value || null; var descricao = document.getElementById('vndDescricao').value.trim(); var valor = parseFloat(document.getElementById('vndValor').value); var formaPagamento = document.getElementById('vndFormaPagamento').value; var status = document.getElementById('vndStatus').value; var dataVal = document.getElementById('vndData').value; if (!descricao || isNaN(valor) || !dataVal) return; await sbAuth.from('vendas').insert([{ user_id: currentUserId, paciente_id: pacienteId, descricao: descricao, valor: valor, forma_pagamento: formaPagamento, status: status, data_venda: dataVal }]); e.target.reset(); loadVendas(); });

document.getElementById('formFinanceiro').addEventListener('submit', async function (e) {
e.preventDefault();
var tipo = document.getElementById('finTipo').value;
var descricao = document.getElementById('finDescricao').value.trim();
var valor = parseFloat(document.getElementById('finValor').value);
var dataVal = document.getElementById('finData').value;
var finStatusVal = document.getElementById('finStatus').value;
var finVencimentoVal = document.getElementById('finVencimento').value;
if (!descricao || isNaN(valor) || !dataVal) return;
await sbAuth.from('financeiro_lancamentos').insert([{ user_id: currentUserId, tipo: tipo, descricao: descricao, valor: valor, data_lancamento: dataVal, status: finStatusVal || 'pago', vencimento: finVencimentoVal || null }]);
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

document.getElementById('formConfig').addEventListener('submit', async function (e) {
e.preventDefault();
var novoNome = document.getElementById('cfgNomeInput').value.trim();
if (!novoNome) return;
await sbAuth.from('perfis').update({ nome_clinica: novoNome }).eq('id', currentUserId);
document.getElementById('cfgClinica').textContent = novoNome;
document.getElementById('assClinica').textContent = novoNome;
});

document.getElementById('formHorario').addEventListener('submit', async function (e) {
e.preventDefault();
var dias = Array.prototype.slice.call(document.querySelectorAll('.cfgDia')).filter(function (cb) { return cb.checked; }).map(function (cb) { return Number(cb.value); });
var abertura = document.getElementById('cfgAbertura').value || '08:00';
var fechamento = document.getElementById('cfgFechamento').value || '18:00';
var hf = { dias: dias, abertura: abertura, fechamento: fechamento };
await sbAuth.from('perfis').update({ horario_funcionamento: hf }).eq('id', currentUserId);
renderHorarioResumo(hf);
});

function renderHorarioResumo(hf) {
var el = document.getElementById('cfgHorarioResumo');
if (!el) return;
if (!hf || !hf.dias || !hf.dias.length) { el.textContent = 'Nenhum horario configurado.'; return; }
var nomes = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab' };
var ordem = [1, 2, 3, 4, 5, 6, 0];
var diasTxt = ordem.filter(function (d) { return hf.dias.indexOf(d) > -1; }).map(function (d) { return nomes[d]; }).join(', ');
el.textContent = diasTxt + ' - ' + hf.abertura + ' as ' + hf.fechamento;
}


async function loadComissoes() {
var res = await sbAuth.from('comissoes').select('*').eq('user_id', currentUserId).order('data_referencia', { ascending: false });
var list = res.data || [];
var aberto = 0, pago = 0;
list.forEach(function (c) { var v = parseFloat(c.valor_comissao); if (c.status === 'pago') pago += v; else aberto += v; });
document.getElementById('comAberto').textContent = fmtMoney(aberto);
document.getElementById('comPagas').textContent = fmtMoney(pago);
document.getElementById('comTotal').textContent = fmtMoney(aberto + pago);
var container = document.getElementById('listComissoes');
if (list.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhuma comissao ainda.</p>'; return; }
container.innerHTML = '';
list.forEach(function (c) {
var row = document.createElement('div');
row.className = 'dash-row';
var info = document.createElement('div');
info.className = 'dash-row-info';
var title = document.createElement('span');
title.className = 'dash-row-title';
title.textContent = c.descricao + ' - ' + fmtMoney(c.valor_comissao);
var sub = document.createElement('span');
sub.className = 'dash-row-sub';
var dt = new Date(c.data_referencia + 'T00:00:00');
var statusLabel = c.status === 'pago' ? 'Paga' : 'Em aberto';
sub.textContent = dt.toLocaleDateString('pt-BR') + (c.profissional ? ' - ' + c.profissional : '') + ' - ' + statusLabel;
info.appendChild(title);
info.appendChild(sub);
row.appendChild(info);
if (c.status !== 'pago') {
var payBtn = document.createElement('button');
payBtn.className = 'btn-dash-primary';
payBtn.textContent = 'Marcar como pago';
payBtn.addEventListener('click', async function () {
await sbAuth.from('comissoes').update({ status: 'pago', data_pagamento: new Date().toISOString().slice(0, 10) }).eq('id', c.id);
loadComissoes();
});
row.appendChild(payBtn);
}
var btn = document.createElement('button');
btn.className = 'dash-del-btn';
btn.textContent = 'Remover';
btn.addEventListener('click', async function () {
await sbAuth.from('comissoes').delete().eq('id', c.id);
loadComissoes();
});
row.appendChild(btn);
container.appendChild(row);
});
}

document.getElementById('formComissao').addEventListener('submit', async function (e) {
e.preventDefault();
var profissional = document.getElementById('comProfissional').value.trim();
var descricao = document.getElementById('comDescricao').value.trim();
var valorBaseRaw = document.getElementById('comValorBase').value;
var percentualRaw = document.getElementById('comPercentual').value;
var valorComissaoRaw = document.getElementById('comValorComissao').value;
var dataVal = document.getElementById('comData').value;
if (!descricao || !dataVal) return;
var valorBase = valorBaseRaw ? parseFloat(valorBaseRaw) : null;
var percentual = percentualRaw ? parseFloat(percentualRaw) : null;
var valorComissao = valorComissaoRaw ? parseFloat(valorComissaoRaw) : ((valorBase && percentual) ? (valorBase * percentual / 100) : 0);
await sbAuth.from('comissoes').insert([{ user_id: currentUserId, profissional: profissional || null, descricao: descricao, valor_base: valorBase, percentual: percentual, valor_comissao: valorComissao, status: 'aberto', data_referencia: dataVal }]);
e.target.reset();
loadComissoes();
});

async function loadProfissionais() {
var res = await sbAuth.from('profissionais').select('*').eq('user_id', currentUserId).order('nome', { ascending: true });
var list = res.data || [];
profissionaisCache = list;
var selCom = document.getElementById('comProfissional'); selCom.innerHTML = '<option value="">Sem profissional</option>'; list.forEach(function (p) { var o = document.createElement('option'); o.value = p.nome; o.textContent = p.nome; selCom.appendChild(o); });
var selAtd = document.getElementById('atdProfissional'); selAtd.innerHTML = '<option value="">Sem profissional</option>'; list.forEach(function (p) { var o2 = document.createElement('option'); o2.value = p.nome; o2.textContent = p.nome; selAtd.appendChild(o2); });
var selAgMod = document.getElementById('agModProfissional'); if (selAgMod) { selAgMod.innerHTML = '<option value="">Sem profissional</option>'; list.forEach(function (p) { var o3 = document.createElement('option'); o3.value = p.id; o3.textContent = p.nome; selAgMod.appendChild(o3); }); }
var selFiltroProf = document.getElementById('fAgProfissional'); if (selFiltroProf) { selFiltroProf.innerHTML = '<option value="">Todos os profissionais</option>'; list.forEach(function (p) { var o4 = document.createElement('option'); o4.value = p.id; o4.textContent = p.nome; selFiltroProf.appendChild(o4); }); }
var container = document.getElementById('listProfissionais');
if (list.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhum profissional cadastrado.</p>'; return; }
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
if (p.especialidade) subParts.push(p.especialidade);
if (p.telefone) subParts.push(p.telefone);
if (p.email) subParts.push(p.email);
sub.textContent = subParts.join(' - ');
info.appendChild(title);
info.appendChild(sub);
var btn = document.createElement('button');
btn.className = 'dash-del-btn';
btn.textContent = 'Remover';
btn.addEventListener('click', async function () {
await sbAuth.from('profissionais').delete().eq('id', p.id);
loadProfissionais();
});
row.appendChild(info);
row.appendChild(btn);
container.appendChild(row);
});
renderInicioReports();
}

document.getElementById('formSala').addEventListener('submit', async function (e) {
e.preventDefault();
var nome = document.getElementById('salaNome').value.trim();
var capacidadeRaw = document.getElementById('salaCapacidade').value;
if (!nome) return;
await sbAuth.from('salas').insert([{ user_id: currentUserId, nome: nome, capacidade: capacidadeRaw ? parseInt(capacidadeRaw, 10) : null }]);
e.target.reset();
loadSalas();
});

async function loadSalas() {
var res = await sbAuth.from('salas').select('*').eq('user_id', currentUserId).order('nome', { ascending: true });
var list = res.data || [];
var container = document.getElementById('listSalas');
if (list.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhuma sala cadastrada.</p>'; return; }
container.innerHTML = '';
list.forEach(function (s) {
var row = document.createElement('div');
row.className = 'dash-row';
var info = document.createElement('div');
info.className = 'dash-row-info';
var title = document.createElement('span');
title.className = 'dash-row-title';
title.textContent = s.nome;
info.appendChild(title);
if (s.capacidade) {
var sub = document.createElement('span');
sub.className = 'dash-row-sub';
sub.textContent = 'Capacidade: ' + s.capacidade;
info.appendChild(sub);
}
var btn = document.createElement('button');
btn.className = 'dash-del-btn';
btn.textContent = 'Remover';
btn.addEventListener('click', async function () {
await sbAuth.from('salas').delete().eq('id', s.id);
loadSalas();
});
row.appendChild(info);
row.appendChild(btn);
container.appendChild(row);
});
}

async function loadProcedimentos() {
var res = await sbAuth.from('procedimentos').select('*').eq('user_id', currentUserId).order('nome', { ascending: true });
var list = res.data || [];
var selAtdProc = document.getElementById('atdProcedimento'); selAtdProc.innerHTML = '<option value="">Selecione um procedimento</option>'; list.forEach(function (p) { var o = document.createElement('option'); o.value = p.nome; o.textContent = p.nome + (p.preco ? ' - ' + fmtMoney(p.preco) : ''); selAtdProc.appendChild(o); });
var container = document.getElementById('listProcedimentos');
if (list.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhum procedimento cadastrado.</p>'; return; }
container.innerHTML = '';
list.forEach(function (p) {
var row = document.createElement('div');
row.className = 'dash-row';
var info = document.createElement('div');
info.className = 'dash-row-info';
var title = document.createElement('span');
title.className = 'dash-row-title';
title.textContent = p.nome + (p.preco ? ' - ' + fmtMoney(p.preco) : '');
var sub = document.createElement('span');
sub.className = 'dash-row-sub';
var subParts = [];
if (p.categoria) subParts.push(p.categoria);
if (p.duracao_minutos) subParts.push(p.duracao_minutos + ' min');
sub.textContent = subParts.join(' - ');
info.appendChild(title);
info.appendChild(sub);
var btn = document.createElement('button');
btn.className = 'dash-del-btn';
btn.textContent = 'Remover';
btn.addEventListener('click', async function () {
await sbAuth.from('procedimentos').delete().eq('id', p.id);
loadProcedimentos();
});
row.appendChild(info);
row.appendChild(btn);
container.appendChild(row);
});
}

async function loadFornecedores() {
var res = await sbAuth.from('fornecedores').select('*').eq('user_id', currentUserId).order('nome', { ascending: true });
var list = res.data || [];
var container = document.getElementById('listFornecedores');
if (list.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhum fornecedor cadastrado.</p>'; return; }
container.innerHTML = '';
list.forEach(function (f) {
var row = document.createElement('div');
row.className = 'dash-row';
var info = document.createElement('div');
info.className = 'dash-row-info';
var title = document.createElement('span');
title.className = 'dash-row-title';
title.textContent = f.nome;
var sub = document.createElement('span');
sub.className = 'dash-row-sub';
var subParts = [];
if (f.telefone) subParts.push(f.telefone);
if (f.email) subParts.push(f.email);
sub.textContent = subParts.join(' - ');
info.appendChild(title);
info.appendChild(sub);
var btn = document.createElement('button');
btn.className = 'dash-del-btn';
btn.textContent = 'Remover';
btn.addEventListener('click', async function () {
await sbAuth.from('fornecedores').delete().eq('id', f.id);
loadFornecedores();
});
row.appendChild(info);
row.appendChild(btn);
container.appendChild(row);
});
}

document.getElementById('formProfissional').addEventListener('submit', async function (e) {
e.preventDefault();
var nome = document.getElementById('prfNome').value.trim();
var especialidade = document.getElementById('prfEspecialidade').value.trim();
var telefone = document.getElementById('prfTelefone').value.trim();
var email = document.getElementById('prfEmail').value.trim();
if (!nome) return;
await sbAuth.from('profissionais').insert([{ user_id: currentUserId, nome: nome, especialidade: especialidade || null, telefone: telefone || null, email: email || null }]);
e.target.reset();
loadProfissionais();
});

document.getElementById('formProcedimento').addEventListener('submit', async function (e) {
e.preventDefault();
var nome = document.getElementById('prcNome').value.trim();
var categoria = document.getElementById('prcCategoria').value.trim();
var precoRaw = document.getElementById('prcPreco').value;
var duracaoRaw = document.getElementById('prcDuracao').value;
if (!nome) return;
await sbAuth.from('procedimentos').insert([{ user_id: currentUserId, nome: nome, categoria: categoria || null, preco: precoRaw ? parseFloat(precoRaw) : 0, duracao_minutos: duracaoRaw ? parseInt(duracaoRaw, 10) : null }]);
e.target.reset();
loadProcedimentos();
});

document.getElementById('formFornecedor').addEventListener('submit', async function (e) {
e.preventDefault();
var nome = document.getElementById('forNome').value.trim();
var telefone = document.getElementById('forTelefone').value.trim();
var email = document.getElementById('forEmail').value.trim();
if (!nome) return;
await sbAuth.from('fornecedores').insert([{ user_id: currentUserId, nome: nome, telefone: telefone || null, email: email || null }]);
e.target.reset();
loadFornecedores();
});


async function loadLeads() {
var res = await sbAuth.from('leads_crm').select('*').eq('user_id', currentUserId).order('criado_em', { ascending: false });
var list = res.data || [];
var container = document.getElementById('listLeads');
if (list.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhum lead cadastrado.</p>'; return; }
container.innerHTML = '';
list.forEach(function (l) {
var row = document.createElement('div');
row.className = 'dash-row';
var info = document.createElement('div');
info.className = 'dash-row-info';
var title = document.createElement('span');
title.className = 'dash-row-title';
title.textContent = l.nome;
var sub = document.createElement('span');
sub.className = 'dash-row-sub';
var subParts = [];
if (l.telefone) subParts.push(l.telefone);
if (l.email) subParts.push(l.email);
if (l.origem) subParts.push(l.origem);
var statusLabel = l.status === 'convertido' ? 'Convertido' : (l.status === 'perdido' ? 'Perdido' : (l.status === 'em_contato' ? 'Em contato' : 'Novo'));
subParts.push(statusLabel);
sub.textContent = subParts.join(' - ');
info.appendChild(title);
info.appendChild(sub);
row.appendChild(info);
if (l.status !== 'convertido') {
var convBtn = document.createElement('button');
convBtn.className = 'btn-dash-primary';
convBtn.textContent = 'Converter em paciente';
convBtn.addEventListener('click', async function () {
await sbAuth.from('pacientes').insert([{ user_id: currentUserId, nome: l.nome, whatsapp: l.telefone || null, email: l.email || null }]);
await sbAuth.from('leads_crm').update({ status: 'convertido' }).eq('id', l.id);
loadLeads();
loadPacientes();
});
row.appendChild(convBtn);
}
var btn = document.createElement('button');
btn.className = 'dash-del-btn';
btn.textContent = 'Remover';
btn.addEventListener('click', async function () {
await sbAuth.from('leads_crm').delete().eq('id', l.id);
loadLeads();
});
row.appendChild(btn);
container.appendChild(row);
});
}

document.getElementById('formLead').addEventListener('submit', async function (e) {
e.preventDefault();
var nome = document.getElementById('ledNome').value.trim();
var telefone = document.getElementById('ledTelefone').value.trim();
var email = document.getElementById('ledEmail').value.trim();
var origem = document.getElementById('ledOrigem').value.trim();
var status = document.getElementById('ledStatus').value;
if (!nome) return;
await sbAuth.from('leads_crm').insert([{ user_id: currentUserId, nome: nome, telefone: telefone || null, email: email || null, origem: origem || null, status: status }]);
e.target.reset();
loadLeads();
});

async function loadAniversariantes() {
var mesSel = document.getElementById('aniMes');
var mes = parseInt(mesSel.value, 10);
var res = await sbAuth.from('pacientes').select('*').eq('user_id', currentUserId);
var list = res.data || [];
var filtrados = list.filter(function (p) {
if (!p.data_nascimento) return false;
var d = new Date(p.data_nascimento + 'T00:00:00');
return (d.getMonth() + 1) === mes;
});
filtrados.sort(function (a, b) {
var da = new Date(a.data_nascimento + 'T00:00:00').getDate();
var db = new Date(b.data_nascimento + 'T00:00:00').getDate();
return da - db;
});
var container = document.getElementById('listAniversariantes');
if (filtrados.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhum aniversariante neste mes.</p>'; return; }
container.innerHTML = '';
filtrados.forEach(function (p) {
var row = document.createElement('div');
row.className = 'dash-row';
var info = document.createElement('div');
info.className = 'dash-row-info';
var title = document.createElement('span');
title.className = 'dash-row-title';
title.textContent = p.nome;
var sub = document.createElement('span');
sub.className = 'dash-row-sub';
var d = new Date(p.data_nascimento + 'T00:00:00');
var subParts = [d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })];
if (p.whatsapp) subParts.push(p.whatsapp);
sub.textContent = subParts.join(' - ');
info.appendChild(title);
info.appendChild(sub);
row.appendChild(info);
container.appendChild(row);
});
}

document.getElementById('aniMes').addEventListener('change', loadAniversariantes);

var navItems = document.querySelectorAll('.dash-nav-item');
var views = document.querySelectorAll('.dash-view');
var viewTitleEl = document.getElementById('viewTitle');
var viewTitles = { inicio: 'Inicio', agenda: 'Agenda', pacientes: 'Pacientes', atendimentos: 'Atendimentos', vendas: 'Vendas', financeiro: 'Financeiro', estoque: 'Estoque', config: 'Configuracoes' , comissoes: 'Comissoes', profissionais: 'Profissionais', procedimentos: 'Procedimentos', assinatura: 'Assinatura', leads: 'Leads', aniversariantes: 'Aniversariantes'};

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

// v3

// v4

// v5-redeploy-marker


// ===== Agenda - calendario (dia/semana/mes) =====
var agViewMode = 'semana';
var agRefDate = new Date();
var agEventosCache = [];
var AG_HORA_INICIO = 7;
var AG_HORA_FIM = 21;
var AG_ALTURA_HORA = 48;
var agFiltro = { profissional: '', status: '', paciente: '' };
var agSelDrag = null;

function agStartOfWeek(d) {
var r = new Date(d);
r.setHours(0, 0, 0, 0);
r.setDate(r.getDate() - r.getDay());
return r;
}

function agAddDays(d, n) {
var r = new Date(d);
r.setDate(r.getDate() + n);
return r;
}

function agSameDay(a, b) {
return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function agFmtRangeLabel() {
if (agViewMode === 'dia') {
return agRefDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
if (agViewMode === 'mes') {
return agRefDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
var ini = agStartOfWeek(agRefDate);
var fim = agAddDays(ini, 6);
return ini.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' - ' + fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function agPassaFiltro(ev) {
if (agFiltro.profissional && ev.profissional_id !== agFiltro.profissional) return false;
if (agFiltro.status && ev.status !== agFiltro.status) return false;
if (agFiltro.paciente && ev.paciente_id !== agFiltro.paciente) return false;
return true;
}

function agEventosNoIntervalo(inicio, fim) {
return agEventosCache.filter(function (ev) {
var d = new Date(ev.data_inicio);
return d >= inicio && d < fim && agPassaFiltro(ev);
});
}

function agRenderHorasGrade(col) {
for (var h = AG_HORA_INICIO; h < AG_HORA_FIM; h++) {
var lblFull = document.createElement('div');
lblFull.className = 'dash-cal-hour-label full';
lblFull.textContent = (h < 10 ? '0' + h : h) + ':00';
col.appendChild(lblFull);
var lblHalf = document.createElement('div');
lblHalf.className = 'dash-cal-hour-label half';
lblHalf.textContent = (h < 10 ? '0' + h : h) + ':30';
col.appendChild(lblHalf);
}
}

function agMinutosParaY(min) {
return ((min - AG_HORA_INICIO * 60) / 60) * AG_ALTURA_HORA;
}

function agSnap30(min) {
var minimo = AG_HORA_INICIO * 60;
var maximo = AG_HORA_FIM * 60;
var snapped = Math.round(min / 30) * 30;
if (snapped < minimo) snapped = minimo;
if (snapped > maximo) snapped = maximo;
return snapped;
}

function agAtualizarSelecaoVisual() {
if (!agSelDrag) return;
var top = agMinutosParaY(agSelDrag.min);
var height = agMinutosParaY(agSelDrag.max) - top;
agSelDrag.selEl.style.top = Math.max(0, top) + 'px';
agSelDrag.selEl.style.height = Math.max(20, height) + 'px';
}

function agIniciarSelecao(col, dia, e) {
if (e.button !== 0) return;
var rect = col.getBoundingClientRect();
var minutoInicial = agSnap30(AG_HORA_INICIO * 60 + ((e.clientY - rect.top) / AG_ALTURA_HORA) * 60);
var selEl = document.createElement('div');
selEl.className = 'dash-cal-selection';
col.appendChild(selEl);
agSelDrag = { col: col, rect: rect, dia: dia, base: minutoInicial, min: minutoInicial, max: minutoInicial + 30, selEl: selEl };
agAtualizarSelecaoVisual();

function onMove(ev2) {
if (!agSelDrag) return;
var minutoAtual = agSnap30(AG_HORA_INICIO * 60 + ((ev2.clientY - agSelDrag.rect.top) / AG_ALTURA_HORA) * 60);
agSelDrag.min = Math.min(agSelDrag.base, minutoAtual);
agSelDrag.max = Math.max(agSelDrag.base, minutoAtual) + 30;
agAtualizarSelecaoVisual();
}

function onUp() {
document.removeEventListener('mousemove', onMove);
document.removeEventListener('mouseup', onUp);
if (agSelDrag) {
var diaFinal = agSelDrag.dia;
var minIni = agSelDrag.min;
var minFim = agSelDrag.max;
if (agSelDrag.selEl && agSelDrag.selEl.parentNode) agSelDrag.selEl.parentNode.removeChild(agSelDrag.selEl);
agSelDrag = null;
agAbrirModalNovo(diaFinal, minIni, minFim);
}
}

document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onUp);
}

function agCriarColunaDia(dia, hoje) {
var col = document.createElement('div');
col.className = 'dash-cal-day-col';
col.style.height = ((AG_HORA_FIM - AG_HORA_INICIO) * AG_ALTURA_HORA) + 'px';
var inicioDia = new Date(dia); inicioDia.setHours(0, 0, 0, 0);
var fimDia = agAddDays(inicioDia, 1);
var eventos = agEventosNoIntervalo(inicioDia, fimDia);
eventos.forEach(function (ev) {
var d = new Date(ev.data_inicio);
var horaDecimal = d.getHours() + d.getMinutes() / 60;
if (horaDecimal < AG_HORA_INICIO || horaDecimal >= AG_HORA_FIM) return;
var top = (horaDecimal - AG_HORA_INICIO) * AG_ALTURA_HORA;
var bloqueado = ev.status === 'bloqueado';
var evEl = document.createElement('div');
evEl.className = 'dash-cal-event' + (bloqueado ? ' blocked' : '');
evEl.style.top = top + 'px';
var durMin = 30;
if (ev.data_fim) {
var df = new Date(ev.data_fim);
durMin = Math.max(20, Math.round((df - d) / 60000));
}
evEl.style.height = Math.max(20, (durMin / 60) * AG_ALTURA_HORA) + 'px';
var horaTxt = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
evEl.textContent = horaTxt + ' ' + (bloqueado ? '[Bloqueio] ' : '') + ev.titulo;
evEl.title = ev.titulo;
evEl.addEventListener('mousedown', function (e) { e.stopPropagation(); });
evEl.addEventListener('click', function (e) {
e.stopPropagation();
agAbrirModalEdicao(ev);
});
col.appendChild(evEl);
});
col.addEventListener('mousedown', function (e) {
if (e.target !== col) return;
agIniciarSelecao(col, dia, e);
});
return col;
}

function agRenderDiaSemana(container) {
var dias = agViewMode === 'dia' ? [new Date(agRefDate)] : (function () {
var ini = agStartOfWeek(agRefDate);
var arr = [];
for (var i = 0; i < 7; i++) arr.push(agAddDays(ini, i));
return arr;
})();
var hoje = new Date();

var wrap = document.createElement('div');
wrap.className = 'dash-cal-wrap';

var header = document.createElement('div');
header.className = 'dash-cal-header';
header.style.gridTemplateColumns = '60px repeat(' + dias.length + ', 1fr)';
var vazio = document.createElement('div');
header.appendChild(vazio);
dias.forEach(function (d) {
var cell = document.createElement('div');
cell.className = 'dash-cal-header-cell' + (agSameDay(d, hoje) ? ' today' : '');
cell.textContent = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
header.appendChild(cell);
});
wrap.appendChild(header);

var body = document.createElement('div');
body.className = 'dash-cal-body';
body.style.gridTemplateColumns = '60px repeat(' + dias.length + ', 1fr)';
var timeCol = document.createElement('div');
timeCol.className = 'dash-cal-time-col';
agRenderHorasGrade(timeCol);
body.appendChild(timeCol);
dias.forEach(function (d) {
body.appendChild(agCriarColunaDia(d, hoje));
});
wrap.appendChild(body);

container.innerHTML = '';
container.appendChild(wrap);
}

function agRenderMes(container) {
var ano = agRefDate.getFullYear();
var mes = agRefDate.getMonth();
var primeiroDia = new Date(ano, mes, 1);
var inicioGrade = agAddDays(primeiroDia, -primeiroDia.getDay());
var hoje = new Date();

var wrap = document.createElement('div');
wrap.className = 'dash-cal-month-wrap';

var head = document.createElement('div');
head.className = 'dash-cal-month-head';
['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].forEach(function (n) {
var hc = document.createElement('div');
hc.className = 'dash-cal-month-headcell';
hc.textContent = n;
head.appendChild(hc);
});
wrap.appendChild(head);

var grid = document.createElement('div');
grid.className = 'dash-cal-month-grid';
for (var i = 0; i < 42; i++) {
var dia = agAddDays(inicioGrade, i);
var inicioDia = new Date(dia); inicioDia.setHours(0, 0, 0, 0);
var fimDia = agAddDays(inicioDia, 1);
var eventos = agEventosNoIntervalo(inicioDia, fimDia);
var cell = document.createElement('div');
cell.className = 'dash-cal-month-cell' + (dia.getMonth() !== mes ? ' other-month' : '') + (agSameDay(dia, hoje) ? ' today' : '');
var dateLbl = document.createElement('div');
dateLbl.className = 'dash-cal-month-date';
dateLbl.textContent = String(dia.getDate());
cell.appendChild(dateLbl);
eventos.slice(0, 3).forEach(function (ev) {
var bloqueado = ev.status === 'bloqueado';
var evEl = document.createElement('div');
evEl.className = 'dash-cal-month-event' + (bloqueado ? ' blocked' : '');
evEl.textContent = (bloqueado ? '[Bloqueio] ' : '') + ev.titulo;
evEl.addEventListener('click', function () {
agAbrirModalEdicao(ev);
});
cell.appendChild(evEl);
});
if (eventos.length > 3) {
var more = document.createElement('div');
more.className = 'dash-cal-month-more';
more.textContent = '+' + (eventos.length - 3) + ' mais';
cell.appendChild(more);
}
grid.appendChild(cell);
}
wrap.appendChild(grid);

container.innerHTML = '';
container.appendChild(wrap);
}

function agAtualizarStats() {
var ini, fim;
if (agViewMode === 'dia') {
ini = new Date(agRefDate); ini.setHours(0, 0, 0, 0);
fim = agAddDays(ini, 1);
} else if (agViewMode === 'mes') {
ini = new Date(agRefDate.getFullYear(), agRefDate.getMonth(), 1);
fim = new Date(agRefDate.getFullYear(), agRefDate.getMonth() + 1, 1);
} else {
ini = agStartOfWeek(agRefDate);
fim = agAddDays(ini, 7);
}
var eventos = agEventosNoIntervalo(ini, fim);
var bloqueios = eventos.filter(function (e) { return e.status === 'bloqueado'; }).length;
var totalEl = document.getElementById('agTotalPeriodo');
if (totalEl) totalEl.textContent = eventos.length + ' agendamento(s)' + (bloqueios > 0 ? ' - ' + bloqueios + ' bloqueio(s)' : '');
var ocupEl = document.getElementById('agOcupacao');
if (ocupEl) {
var dias = agViewMode === 'dia' ? 1 : (agViewMode === 'mes' ? 30 : 7);
var horasDisponiveis = dias * (AG_HORA_FIM - AG_HORA_INICIO);
var ocupPct = horasDisponiveis > 0 ? Math.min(100, Math.round((eventos.length / horasDisponiveis) * 100)) : 0;
ocupEl.textContent = 'Ocupacao: ' + ocupPct + '%';
}
}

function renderAgendaCalendar() {
var container = document.getElementById('agendaGrid');
if (!container) return;
var lbl = document.getElementById('agRangeLabel');
if (lbl) lbl.textContent = agFmtRangeLabel();
if (agViewMode === 'mes') {
agRenderMes(container);
} else {
agRenderDiaSemana(container);
}
agAtualizarStats();
}

document.addEventListener('click', function (e) {
var viewBtn = e.target.closest && e.target.closest('.dash-agenda-view-btn');
if (viewBtn) {
document.querySelectorAll('.dash-agenda-view-btn').forEach(function (b) { b.classList.remove('active'); });
viewBtn.classList.add('active');
agViewMode = viewBtn.getAttribute('data-agview');
renderAgendaCalendar();
return;
}
if (e.target.id === 'agPrev' || e.target.id === 'agNext') {
var delta = e.target.id === 'agPrev' ? -1 : 1;
if (agViewMode === 'dia') agRefDate = agAddDays(agRefDate, delta);
else if (agViewMode === 'mes') agRefDate = new Date(agRefDate.getFullYear(), agRefDate.getMonth() + delta, 1);
else agRefDate = agAddDays(agRefDate, delta * 7);
renderAgendaCalendar();
return;
}
if (e.target.id === 'agHoje') {
agRefDate = new Date();
renderAgendaCalendar();
return;
}
});


var fAgAplicarBtn = document.getElementById('fAgAplicar');
if (fAgAplicarBtn) {
fAgAplicarBtn.addEventListener('click', function () {
agFiltro.profissional = document.getElementById('fAgProfissional').value || '';
agFiltro.status = document.getElementById('fAgStatus').value || '';
agFiltro.paciente = document.getElementById('fAgPaciente').value || '';
renderAgendaCalendar();
});
}
var fAgLimparBtn = document.getElementById('fAgLimpar');
if (fAgLimparBtn) {
fAgLimparBtn.addEventListener('click', function () {
agFiltro = { profissional: '', status: '', paciente: '' };
document.getElementById('fAgProfissional').value = '';
document.getElementById('fAgStatus').value = '';
document.getElementById('fAgPaciente').value = '';
renderAgendaCalendar();
});
}

var AG_TIPO_LABELS = { agendamento: 'Novo agendamento', bloqueio: 'Bloquear horario', lembrete: 'Novo lembrete', evento: 'Novo evento' };
var AG_TIPO_PREFIXOS = { lembrete: '[Lembrete] ', evento: '[Evento] ' };

function agSetTipo(tipo) {
var tipoInput = document.getElementById('agModTipo');
if (tipoInput) tipoInput.value = tipo;
document.querySelectorAll('.dash-modal-tab').forEach(function (t) {
t.classList.toggle('active', t.getAttribute('data-tipo') === tipo);
});
var pacWrap = document.getElementById('agModPacienteWrap');
var statusWrap = document.getElementById('agModStatusWrap');
if (tipo === 'bloqueio') {
if (pacWrap) pacWrap.style.display = 'none';
if (statusWrap) statusWrap.style.display = 'none';
} else {
if (pacWrap) pacWrap.style.display = '';
if (statusWrap) statusWrap.style.display = '';
}
var idEl = document.getElementById('agModId');
var tituloEl = document.getElementById('agModalTitulo');
if (tituloEl) tituloEl.textContent = (idEl && idEl.value) ? 'Editar agendamento' : (AG_TIPO_LABELS[tipo] || 'Novo agendamento');
}

document.querySelectorAll('.dash-modal-tab').forEach(function (tabBtn) {
tabBtn.addEventListener('click', function () {
agSetTipo(tabBtn.getAttribute('data-tipo'));
});
});

function agFormatarParaInput(d) {
var pad = function (n) { return n < 10 ? '0' + n : String(n); };
return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function agAbrirModalNovo(dia, minIni, minFim) {
var inicio = new Date(dia); inicio.setHours(0, minIni, 0, 0);
var fim = new Date(dia); fim.setHours(0, minFim, 0, 0);
var formEl = document.getElementById('formAgModal');
if (formEl) formEl.reset();
document.getElementById('agModId').value = '';
document.getElementById('agModTitulo').value = '';
document.getElementById('agModPaciente').value = '';
document.getElementById('agModProfissional').value = '';
document.getElementById('agModStatus').value = 'agendado';
document.getElementById('agModObservacoes').value = '';
document.getElementById('agModInicio').value = agFormatarParaInput(inicio);
document.getElementById('agModFim').value = agFormatarParaInput(fim);
var excluirBtn = document.getElementById('agModExcluirBtn');
if (excluirBtn) excluirBtn.style.display = 'none';
document.getElementById('agModConfirm').classList.remove('open');
agSetTipo('agendamento');
document.getElementById('agModalOverlay').classList.add('open');
}

function agAbrirModalEdicao(ev) {
var formEl = document.getElementById('formAgModal');
if (formEl) formEl.reset();
document.getElementById('agModId').value = ev.id;
document.getElementById('agModTitulo').value = ev.titulo || '';
document.getElementById('agModPaciente').value = ev.paciente_id || '';
document.getElementById('agModProfissional').value = ev.profissional_id || '';
document.getElementById('agModStatus').value = (ev.status && ev.status !== 'bloqueado') ? ev.status : 'agendado';
document.getElementById('agModObservacoes').value = ev.observacoes || '';
document.getElementById('agModInicio').value = agFormatarParaInput(new Date(ev.data_inicio));
document.getElementById('agModFim').value = ev.data_fim ? agFormatarParaInput(new Date(ev.data_fim)) : '';
var excluirBtn = document.getElementById('agModExcluirBtn');
if (excluirBtn) excluirBtn.style.display = '';
document.getElementById('agModConfirm').classList.remove('open');
var tipoInicial = ev.status === 'bloqueado' ? 'bloqueio' : (ev.titulo && ev.titulo.indexOf('[Lembrete]') === 0 ? 'lembrete' : (ev.titulo && ev.titulo.indexOf('[Evento]') === 0 ? 'evento' : 'agendamento'));
agSetTipo(tipoInicial);
document.getElementById('agModalTitulo').textContent = 'Editar agendamento';
document.getElementById('agModalOverlay').classList.add('open');
}

function agFecharModal() {
document.getElementById('agModalOverlay').classList.remove('open');
document.getElementById('agModConfirm').classList.remove('open');
}

var agModalFecharBtn = document.getElementById('agModalFechar');
if (agModalFecharBtn) agModalFecharBtn.addEventListener('click', agFecharModal);
var agModalOverlayEl = document.getElementById('agModalOverlay');
if (agModalOverlayEl) {
agModalOverlayEl.addEventListener('click', function (e) {
if (e.target.id === 'agModalOverlay') agFecharModal();
});
}

var formAgModalEl = document.getElementById('formAgModal');
if (formAgModalEl) {
formAgModalEl.addEventListener('submit', async function (e) {
e.preventDefault();
var id = document.getElementById('agModId').value;
var tipo = document.getElementById('agModTipo').value || 'agendamento';
var tituloRaw = document.getElementById('agModTitulo').value.trim();
var pacienteId = document.getElementById('agModPaciente').value || null;
var profissionalId = document.getElementById('agModProfissional').value || null;
var inicioStr = document.getElementById('agModInicio').value;
var fimStr = document.getElementById('agModFim').value;
var observacoes = document.getElementById('agModObservacoes').value.trim();
if (!tituloRaw || !inicioStr) return;
var status = tipo === 'bloqueio' ? 'bloqueado' : document.getElementById('agModStatus').value;
var prefixo = AG_TIPO_PREFIXOS[tipo] || '';
var jaTemPrefixo = tituloRaw.indexOf('[Lembrete]') === 0 || tituloRaw.indexOf('[Evento]') === 0;
var tituloFinal = (prefixo && !jaTemPrefixo) ? (prefixo + tituloRaw) : tituloRaw;
var payload = {
user_id: currentUserId,
titulo: tituloFinal,
paciente_id: tipo === 'agendamento' ? pacienteId : null,
profissional_id: profissionalId,
status: status,
data_inicio: new Date(inicioStr).toISOString(),
data_fim: fimStr ? new Date(fimStr).toISOString() : null,
observacoes: observacoes || null
};
if (id) {
await sbAuth.from('agenda_eventos').update(payload).eq('id', id);
} else {
await sbAuth.from('agenda_eventos').insert([payload]);
}
agFecharModal();
loadAgenda();
});
}

var agModExcluirBtnEl = document.getElementById('agModExcluirBtn');
if (agModExcluirBtnEl) {
agModExcluirBtnEl.addEventListener('click', function () {
document.getElementById('agModConfirm').classList.add('open');
});
}
var agModConfirmNaoEl = document.getElementById('agModConfirmNao');
if (agModConfirmNaoEl) {
agModConfirmNaoEl.addEventListener('click', function () {
document.getElementById('agModConfirm').classList.remove('open');
});
}
var agModConfirmSimEl = document.getElementById('agModConfirmSim');
if (agModConfirmSimEl) {
agModConfirmSimEl.addEventListener('click', async function () {
var id = document.getElementById('agModId').value;
if (id) {
await sbAuth.from('agenda_eventos').delete().eq('id', id);
}
agFecharModal();
loadAgenda();
});
}

// v7-agenda-meia-hora-modal

// ============================================
// Inicio - Relatorios e Dashboard (v8)
// ============================================

function inSetText(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }

function inInitials(nome) {
var parts = String(nome || '').trim().split(/\s+/).filter(Boolean);
if (parts.length === 0) return '?';
if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function inParseFinDate(l) {
var s = l.data_lancamento;
if (!s) return new Date(NaN);
return new Date(s.length === 10 ? s + 'T00:00:00' : s);
}

// Lista das proximas 24h (somente leitura) na tela de Inicio
function renderProx24h(container, list) {
if (!container) return;
if (!list || list.length === 0) {
container.innerHTML = '<p class="dash-empty">Sem agendamentos marcados para as proximas 24 horas.</p>';
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
sub.textContent = dt.toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + (pacienteNome ? ' - ' + pacienteNome : '');
info.appendChild(title);
info.appendChild(sub);
row.appendChild(info);
container.appendChild(row);
});
}

// Intervalo de datas conforme periodo/data de referencia
function inGetRange() {
var ref = new Date(inRefDate);
var start, end;
if (inPeriodo === 'dia') {
start = new Date(ref); start.setHours(0, 0, 0, 0);
end = agAddDays(start, 1);
} else if (inPeriodo === 'mes') {
start = new Date(ref.getFullYear(), ref.getMonth(), 1);
end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
} else if (inPeriodo === 'ano') {
start = new Date(ref.getFullYear(), 0, 1);
end = new Date(ref.getFullYear() + 1, 0, 1);
} else {
start = agStartOfWeek(ref);
end = agAddDays(start, 7);
}
return { start: start, end: end };
}

function inFmtRangeLabel() {
var r = inGetRange();
if (inPeriodo === 'dia') return r.start.toLocaleDateString('pt-BR');
if (inPeriodo === 'mes') { var s = r.start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); }
if (inPeriodo === 'ano') return String(r.start.getFullYear());
var last = agAddDays(r.end, -1);
return r.start.toLocaleDateString('pt-BR') + ' - ' + last.toLocaleDateString('pt-BR');
}

// Buckets: dia = blocos de 2h; semana/mes = dias; ano = meses
function inGetBuckets() {
var r = inGetRange();
var buckets = [];
if (inPeriodo === 'dia') {
for (var h = 0; h < 24; h += 2) {
var hs = new Date(r.start); hs.setHours(h, 0, 0, 0);
var he = new Date(r.start); he.setHours(h + 2, 0, 0, 0);
buckets.push({ key: 'h' + h, label: (h < 10 ? '0' + h : h) + 'h', start: hs, end: he });
}
} else if (inPeriodo === 'ano') {
for (var m = 0; m < 12; m++) {
var ms = new Date(r.start.getFullYear(), m, 1);
var me = new Date(r.start.getFullYear(), m + 1, 1);
var lblM = ms.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
buckets.push({ key: 'm' + m, label: lblM, start: ms, end: me });
}
} else {
var cur = new Date(r.start);
while (cur < r.end) {
var ds = new Date(cur); ds.setHours(0, 0, 0, 0);
var de = agAddDays(ds, 1);
var lblD = inPeriodo === 'semana' ? ds.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') : String(ds.getDate());
buckets.push({ key: 'd' + ds.getTime(), label: lblD, start: ds, end: de });
cur = de;
}
}
return buckets;
}

// Funcao mestre: recalcula dados do periodo e dispara as sub-renderizacoes
function renderInicioReports() {
var lblEl = document.getElementById('inRangeLabel');
if (!lblEl) return;
lblEl.textContent = inFmtRangeLabel();
document.querySelectorAll('.in-periodo-tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-inperiodo') === inPeriodo); });

var range = inGetRange();
var buckets = inGetBuckets();
buckets.forEach(function (b) { b.entradaReal = 0; b.entradaPrev = 0; b.saidaReal = 0; b.saidaPrev = 0; });

var totEntR = 0, totEntP = 0, totSaiR = 0, totSaiP = 0;
(finLancamentosCache || []).forEach(function (l) {
var d = inParseFinDate(l);
if (isNaN(d) || d < range.start || d >= range.end) return;
var v = parseFloat(l.valor) || 0;
var pendente = l.status === 'pendente';
var b = null;
for (var i = 0; i < buckets.length; i++) { if (d >= buckets[i].start && d < buckets[i].end) { b = buckets[i]; break; } }
if (l.tipo === 'entrada') {
if (pendente) { totEntP += v; if (b) b.entradaPrev += v; } else { totEntR += v; if (b) b.entradaReal += v; }
} else {
if (pendente) { totSaiP += v; if (b) b.saidaPrev += v; } else { totSaiR += v; if (b) b.saidaReal += v; }
}
});

// Balanco
var saldoReal = totEntR - totSaiR;
var saldoPrev = (totEntR + totEntP) - (totSaiR + totSaiP);
inSetText('inBalancoSaldo', fmtMoney(saldoReal));
inSetText('inBalancoPrev', fmtMoney(saldoPrev));
inSetText('inBalEntReal', fmtMoney(totEntR));
inSetText('inBalEntPrev', 'Previsto ' + fmtMoney(totEntR + totEntP));
inSetText('inBalSaiReal', fmtMoney(totSaiR));
inSetText('inBalSaiPrev', 'Previsto ' + fmtMoney(totSaiR + totSaiP));

// Agenda do periodo (exclui bloqueios)
var eventos = (agEventosCache || []).filter(function (ev) {
var d = new Date(ev.data_inicio);
return d >= range.start && d < range.end && ev.status !== 'bloqueado';
});

renderFluxoCaixaChart(buckets);
renderFaturamentoComparadoChart(buckets);
renderAgPorProfissionalChart(eventos);
renderDiasMovimentadosChart(eventos);
renderHorariosMovimentadosChart(eventos);
renderStatusDonutChart(eventos);
}

// Helper generico de grafico de barras (uma barra por item)
function renderSimpleBarChart(el, items, opts) {
if (!el) return;
opts = opts || {};
if (!items || items.length === 0) { el.innerHTML = '<p class="dash-empty">' + (opts.emptyMsg || 'Sem dados no periodo.') + '</p>'; return; }
var max = 1;
items.forEach(function (it) { if (it.value > max) max = it.value; });
el.innerHTML = '';
items.forEach(function (it) {
var col = document.createElement('div');
col.className = 'dash-chart-month';
var bars = document.createElement('div');
bars.className = 'dash-chart-bars';
var bar = document.createElement('div');
bar.className = 'dash-chart-bar';
bar.style.height = Math.round((it.value / max) * 150) + 'px';
bar.style.width = '22px';
bar.style.background = it.color || opts.color || 'var(--primary)';
bar.title = (it.label || '') + ': ' + (opts.fmt ? opts.fmt(it.value) : it.value);
bars.appendChild(bar);
col.appendChild(bars);
if (opts.avatar && it.initials) {
var av = document.createElement('div');
av.className = 'in-bar-avatar';
av.textContent = it.initials;
col.appendChild(av);
}
var lbl = document.createElement('span');
lbl.className = 'dash-chart-label';
lbl.textContent = it.label || '';
col.appendChild(lbl);
if (opts.showValue) {
var val = document.createElement('span');
val.className = 'in-bar-value';
val.textContent = opts.valueLabel ? opts.valueLabel(it.value) : String(it.value);
col.appendChild(val);
}
el.appendChild(col);
});
}

// Fluxo de caixa: barras (entradas/saidas realizadas e previstas) + linha SVG de saldo
function renderFluxoCaixaChart(buckets) {
var el = document.getElementById('chartFluxoCaixa');
if (!el) return;
var legEl = document.getElementById('inFluxoLegend');
if (legEl) {
var legItems = [['#12b76a', 'Entradas'], ['#a6e9c5', 'Entradas previstas'], ['#f04438', 'Saidas'], ['#fca5a0', 'Saidas previstas']];
legEl.innerHTML = legItems.map(function (x) { return '<span class="in-leg-item"><span class="in-leg-box" style="background:' + x[0] + '"></span>' + x[1] + '</span>'; }).join('')
+ '<span class="in-leg-item"><span class="in-leg-line"></span>Saldo</span>'
+ '<span class="in-leg-item"><span class="in-leg-line dashed"></span>Saldo previsto</span>';
}
var maxBar = 1;
buckets.forEach(function (b) { maxBar = Math.max(maxBar, b.entradaReal, b.entradaPrev, b.saidaReal, b.saidaPrev); });
var saldoR = buckets.map(function (b) { return b.entradaReal - b.saidaReal; });
var saldoP = buckets.map(function (b) { return (b.entradaReal + b.entradaPrev) - (b.saidaReal + b.saidaPrev); });
var allS = saldoR.concat(saldoP).concat([0]);
var maxS = Math.max.apply(null, allS), minS = Math.min.apply(null, allS);
if (maxS === minS) { maxS += 1; minS -= 1; }
var n = buckets.length || 1;
function sy(v) { return (100 - ((v - minS) / (maxS - minS)) * 100); }
function bar(h, c) { return '<div class="dash-chart-bar" style="height:' + Math.round((h / maxBar) * 150) + 'px;background:' + c + '"></div>'; }
var barsHtml = buckets.map(function (b) {
return '<div class="dash-chart-month"><div class="dash-chart-bars">'
+ bar(b.entradaReal, '#12b76a') + bar(b.entradaPrev, '#a6e9c5')
+ bar(b.saidaReal, '#f04438') + bar(b.saidaPrev, '#fca5a0')
+ '</div><span class="dash-chart-label">' + b.label + '</span></div>';
}).join('');
var ptsR = saldoR.map(function (v, i) { return (i + 0.5) + ',' + sy(v).toFixed(2); }).join(' ');
var ptsP = saldoP.map(function (v, i) { return (i + 0.5) + ',' + sy(v).toFixed(2); }).join(' ');
var svg = '<svg class="in-fluxo-svg" viewBox="0 0 ' + n + ' 100" preserveAspectRatio="none">'
+ '<polyline class="in-fluxo-pl prev" points="' + ptsP + '"></polyline>'
+ '<polyline class="in-fluxo-pl real" points="' + ptsR + '"></polyline></svg>';
el.innerHTML = '<div class="in-fluxo-bars">' + barsHtml + '</div>' + svg;
}

// Faturamento comparado: uma barra por bucket (entradas realizadas)
function renderFaturamentoComparadoChart(buckets) {
var el = document.getElementById('chartFaturamento');
var items = buckets.map(function (b) { return { label: b.label, value: b.entradaReal, color: '#12b76a' }; });
renderSimpleBarChart(el, items, { fmt: fmtMoney, emptyMsg: 'Sem faturamento no periodo.' });
}

// Agendamentos por profissional
function renderAgPorProfissionalChart(eventos) {
var el = document.getElementById('chartAgProf');
var byId = {};
eventos.forEach(function (ev) { var k = ev.profissional_id || 'sem'; byId[k] = (byId[k] || 0) + 1; });
var nameOf = {};
(profissionaisCache || []).forEach(function (p) { nameOf[p.id] = p.nome; });
var items = Object.keys(byId).map(function (k) {
var nome = k === 'sem' ? 'Sem prof.' : (nameOf[k] || 'Profissional');
return { label: nome, value: byId[k], initials: inInitials(nome) };
}).sort(function (a, b) { return b.value - a.value; });
renderSimpleBarChart(el, items, { avatar: true, showValue: true, emptyMsg: 'Nenhum agendamento no periodo.' });
}

// Dias mais movimentados (por dia da semana)
function renderDiasMovimentadosChart(eventos) {
var el = document.getElementById('chartDiasMov');
var nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
var counts = [0, 0, 0, 0, 0, 0, 0];
eventos.forEach(function (ev) { counts[new Date(ev.data_inicio).getDay()]++; });
var items = nomes.map(function (n, i) { return { label: n, value: counts[i] }; });
renderSimpleBarChart(el, items, { showValue: true, emptyMsg: 'Nenhum agendamento no periodo.' });
}

// Horarios mais movimentados (heatmap horas x dias da semana)
function renderHorariosMovimentadosChart(eventos) {
var el = document.getElementById('chartHorariosMov');
if (!el) return;
if (!eventos || eventos.length === 0) { el.innerHTML = '<p class="dash-empty">Nenhum agendamento no periodo.</p>'; return; }
var dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
var h0 = AG_HORA_INICIO, h1 = AG_HORA_FIM;
var grid = {}, max = 0;
eventos.forEach(function (ev) {
var d = new Date(ev.data_inicio); var h = d.getHours();
if (h < h0 || h >= h1) return;
var key = h + '-' + d.getDay();
grid[key] = (grid[key] || 0) + 1;
if (grid[key] > max) max = grid[key];
});
var html = '<div class="in-heatmap-grid" style="grid-template-columns:44px repeat(7,1fr)">';
html += '<div class="in-heat-corner"></div>';
dias.forEach(function (n) { html += '<div class="in-heat-head">' + n + '</div>'; });
for (var h = h0; h < h1; h++) {
html += '<div class="in-heat-hour">' + (h < 10 ? '0' + h : h) + 'h</div>';
for (var dd = 0; dd < 7; dd++) {
var c = grid[h + '-' + dd] || 0;
var alpha = (max > 0 && c > 0) ? (0.15 + 0.85 * (c / max)) : 0;
var bg = c > 0 ? 'rgba(23,163,152,' + alpha.toFixed(2) + ')' : 'var(--gray-100)';
html += '<div class="in-heat-cell" style="background:' + bg + '" title="' + dias[dd] + ' ' + h + 'h: ' + c + '">' + (c > 0 ? c : '') + '</div>';
}
}
html += '</div>';
el.innerHTML = html;
}

// Status por agendamento (grafico de rosca/donut)
function renderStatusDonutChart(eventos) {
var el = document.getElementById('chartStatusDonut');
if (!el) return;
var labels = { agendado: 'Agendado', confirmado: 'Confirmado', concluido: 'Concluido', cancelado: 'Cancelado', faltou: 'Faltou' };
var colors = { agendado: '#667085', confirmado: '#17A398', concluido: '#12b76a', cancelado: '#f04438', faltou: '#f79009' };
var counts = {}, total = 0;
eventos.forEach(function (ev) { var s = ev.status || 'agendado'; counts[s] = (counts[s] || 0) + 1; total++; });
if (total === 0) { el.innerHTML = '<p class="dash-empty">Nenhum agendamento no periodo.</p>'; return; }
var order = Object.keys(labels).filter(function (k) { return counts[k]; });
var C = 2 * Math.PI * 45, offset = 0, segs = '';
order.forEach(function (k) {
var len = (counts[k] / total) * C;
segs += '<circle cx="60" cy="60" r="45" fill="none" stroke="' + colors[k] + '" stroke-width="18" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '" transform="rotate(-90 60 60)"></circle>';
offset += len;
});
var legend = order.map(function (k) { return '<div class="in-donut-leg"><span class="in-donut-dot" style="background:' + colors[k] + '"></span>' + labels[k] + ' <strong>' + counts[k] + '</strong></div>'; }).join('');
el.innerHTML = '<div class="in-donut-svgwrap"><svg viewBox="0 0 120 120" class="in-donut-svg">' + segs
+ '<text x="60" y="62" class="in-donut-total">' + total + '</text><text x="60" y="78" class="in-donut-sub">agend.</text></svg></div>'
+ '<div class="in-donut-legend">' + legend + '</div>';
}

// ===== Inicio - interacoes (periodo, navegacao, abas de relatorios) =====
document.querySelectorAll('.in-periodo-tab').forEach(function (t) {
t.addEventListener('click', function () {
inPeriodo = t.getAttribute('data-inperiodo');
renderInicioReports();
});
});

function inShift(delta) {
if (inPeriodo === 'dia') inRefDate = agAddDays(inRefDate, delta);
else if (inPeriodo === 'semana') inRefDate = agAddDays(inRefDate, delta * 7);
else if (inPeriodo === 'mes') inRefDate = new Date(inRefDate.getFullYear(), inRefDate.getMonth() + delta, 1);
else inRefDate = new Date(inRefDate.getFullYear() + delta, 0, 1);
renderInicioReports();
}

var inPrevBtn = document.getElementById('inPrev');
if (inPrevBtn) inPrevBtn.addEventListener('click', function () { inShift(-1); });
var inNextBtn = document.getElementById('inNext');
if (inNextBtn) inNextBtn.addEventListener('click', function () { inShift(1); });

document.querySelectorAll('.in-rep-tab').forEach(function (t) {
t.addEventListener('click', function () {
var key = t.getAttribute('data-inrep');
document.querySelectorAll('.in-rep-tab').forEach(function (b) { b.classList.remove('active'); });
t.classList.add('active');
document.querySelectorAll('.in-rep-panel').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-inreppanel') === key); });
renderInicioReports();
});
});
