// ============================================
// v2 (leads)
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
document.getElementById('assPlano').textContent = perfil ? perfil.plano : '-';
document.getElementById('assClinica').textContent = perfil ? perfil.nome_clinica : '-';
document.getElementById('assEmail').textContent = user.email;
    document.getElementById('cfgNomeInput').value = perfil ? perfil.nome_clinica : '';

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
  var select = document.getElementById('agPaciente');
  select.innerHTML = '<option value=\"\">Sem paciente vinculado</option>';
  list.forEach(function (p) {
    var opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nome;
    select.appendChild(opt);
  });
      var selectAtd = document.getElementById('atdPaciente'); selectAtd.innerHTML = '<option value="">Sem paciente vinculado</option>'; list.forEach(function (p) { var opt2 = document.createElement('option'); opt2.value = p.id; opt2.textContent = p.nome; selectAtd.appendChild(opt2); });
  var selectVnd = document.getElementById('vndPaciente'); selectVnd.innerHTML = '<option value="">Sem paciente vinculado</option>'; list.forEach(function (p) { var opt3 = document.createElement('option'); opt3.value = p.id; opt3.textContent = p.nome; selectVnd.appendChild(opt3); });
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

async function loadVendas() { var res = await sbAuth.from('vendas').select('*, pacientes(nome)').eq('user_id', currentUserId).order('data_venda', { ascending: false }); var list = res.data || [];var vFat = 0, vPend = 0, vPagoCount = 0; list.forEach(function (v) { var vv = parseFloat(v.valor); if (v.status === 'pago') { vFat += vv; vPagoCount++; } else if (v.status === 'pendente') { vPend += vv; } }); var elVFat = document.getElementById('vndStatFaturamento'); if (elVFat) elVFat.textContent = fmtMoney(vFat); var elVCount = document.getElementById('vndStatCount'); if (elVCount) elVCount.textContent = list.length; var elVTicket = document.getElementById('vndStatTicket'); if (elVTicket) elVTicket.textContent = fmtMoney(vPagoCount > 0 ? vFat / vPagoCount : 0); var elVPend = document.getElementById('vndStatPendente'); if (elVPend) elVPend.textContent = fmtMoney(vPend); var byProduto = {}; list.forEach(function (v) { if (v.status === 'pago') { byProduto[v.descricao] = (byProduto[v.descricao] || 0) + parseFloat(v.valor); } }); var rankProduto = Object.keys(byProduto).map(function (k) { return { nome: k, total: byProduto[k] }; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 5); var contRP = document.getElementById('listVendasRankingProduto'); if (contRP) { if (rankProduto.length === 0) { contRP.innerHTML = '<p class="dash-empty">Sem dados ainda.</p>'; } else { contRP.innerHTML = ''; rankProduto.forEach(function (r) { var row = document.createElement('div'); row.className = 'dash-row'; var info = document.createElement('div'); info.className = 'dash-row-info'; var title = document.createElement('span'); title.className = 'dash-row-title'; title.textContent = r.nome; var sub = document.createElement('span'); sub.className = 'dash-row-sub'; sub.textContent = fmtMoney(r.total); info.appendChild(title); info.appendChild(sub); row.appendChild(info); contRP.appendChild(row); }); } } var byPaciente = {}; list.forEach(function (v) { if (v.status === 'pago') { var nomeP = v.pacientes && v.pacientes.nome ? v.pacientes.nome : 'Sem paciente'; byPaciente[nomeP] = (byPaciente[nomeP] || 0) + parseFloat(v.valor); } }); var rankPaciente = Object.keys(byPaciente).map(function (k) { return { nome: k, total: byPaciente[k] }; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 5); var contRPac = document.getElementById('listVendasRankingPaciente'); if (contRPac) { if (rankPaciente.length === 0) { contRPac.innerHTML = '<p class="dash-empty">Sem dados ainda.</p>'; } else { contRPac.innerHTML = ''; rankPaciente.forEach(function (r) { var row = document.createElement('div'); row.className = 'dash-row'; var info = document.createElement('div'); info.className = 'dash-row-info'; var title = document.createElement('span'); title.className = 'dash-row-title'; title.textContent = r.nome; var sub = document.createElement('span'); sub.className = 'dash-row-sub'; sub.textContent = fmtMoney(r.total); info.appendChild(title); info.appendChild(sub); row.appendChild(info); contRPac.appendChild(row); }); } } var container = document.getElementById('listVendas'); if (list.length === 0) { container.innerHTML = '<p class="dash-empty">Nenhuma venda ainda.</p>'; return; } container.innerHTML = ''; list.forEach(function (v) { var row = document.createElement('div'); row.className = 'dash-row'; var info = document.createElement('div'); info.className = 'dash-row-info'; var title = document.createElement('span'); title.className = 'dash-row-title'; var pacienteNome = v.pacientes && v.pacientes.nome ? v.pacientes.nome : 'Sem paciente'; title.textContent = v.descricao + ' - ' + fmtMoney(v.valor); var sub = document.createElement('span'); sub.className = 'dash-row-sub'; var dt = new Date(v.data_venda + 'T00:00:00'); var statusLabel = v.status === 'pago' ? 'Pago' : (v.status === 'cancelado' ? 'Cancelado' : 'Pendente'); sub.textContent = dt.toLocaleDateString('pt-BR') + ' - ' + pacienteNome + ' - ' + statusLabel; info.appendChild(title); info.appendChild(sub); var btn = document.createElement('button'); btn.className = 'dash-del-btn'; btn.textContent = 'Remover'; btn.addEventListener('click', async function () { await sbAuth.from('vendas').delete().eq('id', v.id); loadVendas(); }); row.appendChild(info); row.appendChild(btn); container.appendChild(row); }); }

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
  var chartEl = document.getElementById('chartFluxoCaixa'); if (chartEl) { var months = []; var refDate = new Date(); for (var mi = 5; mi >= 0; mi--) { var dtM = new Date(refDate.getFullYear(), refDate.getMonth() - mi, 1); months.push({ key: dtM.getFullYear() + '-' + dtM.getMonth(), label: dtM.toLocaleDateString('pt-BR', { month: 'short' }), entrada: 0, saida: 0 }); } list.forEach(function (l) { var dL = new Date(l.data_lancamento); var key = dL.getFullYear() + '-' + dL.getMonth(); var mObj = months.find(function (m) { return m.key === key; }); if (mObj) { var vL = parseFloat(l.valor); if (l.tipo === 'entrada') mObj.entrada += vL; else mObj.saida += vL; } }); var maxVal = 1; months.forEach(function (m) { if (m.entrada > maxVal) maxVal = m.entrada; if (m.saida > maxVal) maxVal = m.saida; }); chartEl.innerHTML = ''; months.forEach(function (m) { var col = document.createElement('div'); col.className = 'dash-chart-month'; var bars = document.createElement('div'); bars.className = 'dash-chart-bars'; var barE = document.createElement('div'); barE.className = 'dash-chart-bar dash-chart-bar-entrada'; barE.style.height = Math.round((m.entrada / maxVal) * 150) + 'px'; barE.title = 'Entradas: ' + fmtMoney(m.entrada); var barS = document.createElement('div'); barS.className = 'dash-chart-bar dash-chart-bar-saida'; barS.style.height = Math.round((m.saida / maxVal) * 150) + 'px'; barS.title = 'Saidas: ' + fmtMoney(m.saida); bars.appendChild(barE); bars.appendChild(barS); var lbl = document.createElement('span'); lbl.className = 'dash-chart-label'; lbl.textContent = m.label; col.appendChild(bars); col.appendChild(lbl); chartEl.appendChild(col); }); }

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
  var nascimento = document.getElementById('pacNascimento').value;
  if (!nome) return;
  await sbAuth.from('pacientes').insert([{ user_id: currentUserId, nome: nome, whatsapp: whatsapp || null, email: email || null, data_nascimento: nascimento || null }]);
  e.target.reset();
  loadPacientes();
});

document.getElementById('formAtendimento').addEventListener('submit', async function (e) { e.preventDefault(); var pacienteId = document.getElementById('atdPaciente').value || null; var profissional = document.getElementById('atdProfissional').value.trim(); var procedimento = document.getElementById('atdProcedimento').value.trim(); var dataStr = document.getElementById('atdData').value; var status = document.getElementById('atdStatus').value; if (!procedimento || !dataStr) return; await sbAuth.from('atendimentos').insert([{ user_id: currentUserId, paciente_id: pacienteId, profissional: profissional || null, procedimento: procedimento, status: status, data_atendimento: new Date(dataStr).toISOString() }]); e.target.reset(); loadAtendimentos(); });

document.getElementById('formVenda').addEventListener('submit', async function (e) { e.preventDefault(); var pacienteId = document.getElementById('vndPaciente').value || null; var descricao = document.getElementById('vndDescricao').value.trim(); var valor = parseFloat(document.getElementById('vndValor').value); var formaPagamento = document.getElementById('vndFormaPagamento').value; var status = document.getElementById('vndStatus').value; var dataVal = document.getElementById('vndData').value; if (!descricao || isNaN(valor) || !dataVal) return; await sbAuth.from('vendas').insert([{ user_id: currentUserId, paciente_id: pacienteId, descricao: descricao, valor: valor, forma_pagamento: formaPagamento, status: status, data_venda: dataVal }]); e.target.reset(); loadVendas(); });

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
var selCom = document.getElementById('comProfissional'); selCom.innerHTML = '<option value="">Sem profissional</option>'; list.forEach(function (p) { var o = document.createElement('option'); o.value = p.nome; o.textContent = p.nome; selCom.appendChild(o); });
var selAtd = document.getElementById('atdProfissional'); selAtd.innerHTML = '<option value="">Sem profissional</option>'; list.forEach(function (p) { var o2 = document.createElement('option'); o2.value = p.nome; o2.textContent = p.nome; selAtd.appendChild(o2); });
var res = await sbAuth.from('profissionais').select('*').eq('user_id', currentUserId).order('nome', { ascending: true });
var list = res.data || [];
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
}

async function loadProcedimentos() {
  var res = await sbAuth.from('procedimentos').select('*').eq('user_id', currentUserId).order('nome', { ascending: true });
var list = res.data || [];
var selAtdProc = document.getElementById('atdProcedimento'); selAtdProc.innerHTML = '<option value="">Selecione um procedimento</option>'; list.forEach(function (p) { var o = document.createElement('option'); o.value = p.nome; o.textContent = p.nome + (p.preco ? ' - ' + fmtMoney(p.preco) : ''); selAtdProc.appendChild(o); });
var res = await sbAuth.from('procedimentos').select('*').eq('user_id', currentUserId).order('nome', { ascending: true });
var list = res.data || [];
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
