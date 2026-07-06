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

## Próximos passos sugeridos
1. Testar a tela no navegador logado (abrir `dashboard.html`) — conferir cards,
   busca, botão WhatsApp e responsividade mobile com dados reais do Supabase.
2. Se aprovar visualmente, seguir para a próxima tela/tarefa.

## Config do ambiente
- Modo autônomo global ligado (`~/.claude/settings.json`:
  `defaultMode: bypassPermissions`) — Claude trabalha sem pedir aprovação.
