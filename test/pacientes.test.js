/* Testes da tela Pacientes (cards + busca). node test/pacientes.test.js */
'use strict';
const { load } = require('./harness');

(async () => {
  const t = load();
  const { sandbox, els, eq, contains, section } = t;

  const now = new Date();
  const isoDay = (d) => d.toISOString().slice(0, 10);
  const thisMonth = (dia) => isoDay(new Date(now.getFullYear(), now.getMonth(), dia));
  // aniversario neste mes (ano qualquer)
  const aniverEsteMes = isoDay(new Date(1990, now.getMonth(), 15));
  const aniverOutroMes = isoDay(new Date(1990, (now.getMonth() + 6) % 12, 15));

  t.setDB({
    pacientes: [
      { id: '1', nome: 'Ana Souza',   whatsapp: '11999990001', email: 'ana@x.com',  criado_em: now.toISOString(), data_nascimento: aniverEsteMes },
      { id: '2', nome: 'Bruno Lima',  whatsapp: '11999990002', email: 'b@x.com',    criado_em: now.toISOString(), data_nascimento: aniverOutroMes },
      { id: '3', nome: 'Carla Dias',  whatsapp: '',            email: 'c@x.com',    criado_em: '2020-01-01T00:00:00Z', data_nascimento: aniverEsteMes },
    ],
    agenda_eventos: [],
  });

  sandbox.currentUserId = 'u1';
  await sandbox.loadPacientes();
  await t.tick();

  section('Cards de estatistica');
  eq('Total de pacientes', els.pacStatTotal.textContent, 3);
  eq('Novos no mes (2 criados agora)', els.pacStatMes.textContent, 2);
  eq('Com WhatsApp (2 tem)', els.pacStatWhats.textContent, 2);
  eq('Aniversariantes do mes (Ana + Carla)', els.pacStatAniver.textContent, 2);

  section('Lista renderiza avatares/linhas');
  contains('Mostra Ana Souza', els.listPacientes.innerHTML, 'Ana Souza');
  contains('Link WhatsApp wa.me/55', els.listPacientes.innerHTML, 'wa.me/5511999990001');

  section('Busca filtra por nome');
  els.pacBusca.value = 'bruno';
  sandbox.renderPacientesList();
  contains('Encontrou Bruno', els.listPacientes.innerHTML, 'Bruno Lima');
  eq('Nao mostra Ana ao buscar bruno', els.listPacientes.innerHTML.indexOf('Ana Souza'), -1);

  process.exit(t.done());
})();
