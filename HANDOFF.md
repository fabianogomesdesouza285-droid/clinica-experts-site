# Onde paramos — Clínica Experts (dashboard)

_Atualizado: 2026-07-06_

## Como retomar (método oficial)
Repositório: `https://github.com/fabianogomesdesouza285-droid/clinica-experts-site`
Branch de trabalho: **`financeiro-redesign`** (não é o `main`).

Em qualquer máquina:
```
git clone https://github.com/fabianogomesdesouza285-droid/clinica-experts-site.git
cd clinica-experts-site
git checkout financeiro-redesign
git pull
```
Abrir a pasta no VS Code e, no Claude Code, dizer:
`leia HANDOFF.md e continue de onde paramos`

> Obs.: as alterações do dashboard (tela Pacientes) podem estar NÃO commitadas na
> máquina original — só este HANDOFF.md está versionado. Confirme com `git status`.

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
Assets locais no `dashboard.html` agora têm `?v=N` (`styles.css?v=2`,
`dashboard.css?v=2`, `auth.js?v=2`, `dashboard.js?v=2`). **Ao mudar CSS/JS,
incrementar esse número** (`?v=3`…) para o navegador baixar a versão nova.
O `dashboard.html` em si não tem versão e é cacheado ~10 min (Pages
`cache-control: max-age=600`) — para forçar, abrir com query nova na URL
(`dashboard.html?novo=1`) ou "Esvaziar cache e recarregar" no DevTools.

## Próximos passos sugeridos
- Seguir para a próxima tela/tarefa quando quiser.

## Config do ambiente
- Modo autônomo global ligado (`~/.claude/settings.json`:
  `defaultMode: bypassPermissions`) — Claude trabalha sem pedir aprovação.
