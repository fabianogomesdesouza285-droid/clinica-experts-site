# Onde paramos — Clínica Experts (dashboard)

_Atualizado: 2026-07-06_

## Como retomar (método oficial)
Repositório: `https://github.com/fabianogomesdesouza285-droid/clinica-experts-site`
Branch de trabalho atual: **`main`** (é a que o GitHub Pages publica no ar).
As reformas antigas viviam em `financeiro-redesign`, já mergeada na `main`.

Em qualquer máquina:
```
git clone https://github.com/fabianogomesdesouza285-droid/clinica-experts-site.git
cd clinica-experts-site
git checkout main
git pull
```
Abrir a pasta no VS Code e, no Claude Code, dizer:
`leia HANDOFF.md e continue de onde paramos`

## Tarefa concluída (commit `b12170d`, já no GitHub)
Reforma da tela **Pacientes** do dashboard (`view-pacientes`), deixando parecida
com o padrão das outras telas do app. **Commitada e enviada** para
`origin/financeiro-redesign` em 2026-07-06. Validada: `node --check` OK e todos
os IDs conferidos entre HTML e JS. Falta apenas testar no navegador logado.

### Já implementado (commitado em `dashboard.html/.css/.js`)
- 4 cards de estatística no topo: Total de pacientes, Novos no mês, Com WhatsApp,
  Aniversariantes do mês (`pacStatTotal/Mes/Whats/Aniver`).
- Campo de busca (`pacBusca`) filtrando por nome, WhatsApp ou e-mail.
- Lista redesenhada (`pac-row`): avatar com iniciais, ícones 📱 ✉️ 🎂,
  botão "WhatsApp" (link wa.me) e botão "Remover".
- Cache `pacientesCache` + função `renderPacientesList()`.
- CSS novo em `dashboard.css` (bloco "Pacientes - listagem com busca e avatares").

### Verificado
- Campos `data_nascimento` e `criado_em` existem na tabela `pacientes`
  (ver `supabase-setup-app.sql`) e no formulário (`pacNascimento`).

## Status: EM PRODUÇÃO (2026-07-06)
Reforma da tela Pacientes mergeada em `main` e publicada no GitHub Pages.
Testada no navegador logado: cards (10/10/10/1), busca, avatares, ícones e botão
WhatsApp OK. Junto foram ao ar também as reformas de Início e Financeiro.

### Cache-busting
Assets locais no `dashboard.html` têm `?v=N` (versão atual: **`?v=4`** em
`styles.css/dashboard.css/auth.js/dashboard.js`). **Ao mudar CSS/JS, incrementar
esse número** (`?v=5`…) para o navegador baixar a versão nova.
O `dashboard.html` em si não tem versão e é cacheado ~10 min (Pages
`cache-control: max-age=600`) — para forçar, abrir com query nova na URL
(`dashboard.html?novo=1`) ou "Esvaziar cache e recarregar" no DevTools.

## Financeiro reformado igual à referência (2026-07-06)
Tela `view-financeiro` reorganizada no padrão do app oficial
(`app.clinicaexperts.com.br/financeiro/inicio`): Filtros → cards 2×2
(Receitas/Despesas/A receber/A pagar) → Fluxo de caixa (6 séries) → Contas
financeiras → A receber detalhado → A pagar detalhado → Categorias (pizza).
Commits: `14bb8a3` (blocos) e `af73f7f` (contas reais + migração). Em produção.

### ⚠️ PASSO PENDENTE (só o usuário faz): migração no Supabase
Rodar `supabase-migration-financeiro.sql` no **SQL Editor** do Supabase (é
idempotente). Cria a tabela `contas_financeiras` + campos `categoria`,
`vencimento`, `conta_id` em `financeiro_lancamentos`.
- **Antes de rodar:** front degrada com elegância (caixa único derivado,
  categorias por descrição) — nada quebra.
- **Depois de rodar:** Contas reais (o app auto-cria "Banco padrao" e "Caixa"),
  Categorias por campo `categoria`, A receber/pagar por `vencimento`. O
  formulário de lançamento já tem os campos Categoria e Conta.

## Próximos passos sugeridos
- Usuário rodar a migração acima e conferir a tela Financeiro no ar.
- Depois, seguir para a próxima tela/tarefa.

## Config do ambiente
- Modo autônomo global ligado (`~/.claude/settings.json`:
  `defaultMode: bypassPermissions`) — Claude trabalha sem pedir aprovação.
