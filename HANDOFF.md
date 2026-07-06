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

## Tarefa em andamento
Reforma da tela **Pacientes** do dashboard (`view-pacientes`), deixando parecida
com o padrão das outras telas do app.

### Já implementado (mudanças NÃO commitadas em `dashboard.html/.css/.js`)
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
1. Testar a tela no navegador (abrir `dashboard.html`) — conferir cards, busca,
   botão WhatsApp e responsividade mobile.
2. Rodar `node --check dashboard.js` (sanidade de sintaxe).
3. Se estiver ok, commitar as 3 alterações.

## Config do ambiente
- Modo autônomo global ligado (`~/.claude/settings.json`:
  `defaultMode: bypassPermissions`) — Claude trabalha sem pedir aprovação.
