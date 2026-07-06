# Atendimento por WhatsApp — Guia de configuração (API oficial Meta Cloud API)

Este guia liga o sistema de atendimento por WhatsApp do dashboard. São 4 etapas:
**A)** criar tudo na Meta · **B)** rodar a migração no Supabase · **C)** publicar as
Edge Functions e os secrets · **D)** apontar o webhook. No fim tem um teste.

> Tempo estimado: 30–45 min na primeira vez. Você vai precisar de um número de
> telefone **que não esteja em uso no app WhatsApp comum** (pode usar o número de
> teste que a Meta fornece de graça para começar).

---

## A) Meta / WhatsApp (o que só você pode fazer)

1. Acesse **https://developers.facebook.com/** e faça login com sua conta Facebook.
2. Vá em **Meus Apps → Criar app → tipo "Empresa" (Business)**. Dê um nome (ex.: "Clínica Experts").
3. No painel do app, em **Adicionar produto**, escolha **WhatsApp → Configurar**.
4. A Meta cria automaticamente uma **conta WhatsApp Business (WABA)** e um
   **número de teste**. Anote na tela "API Setup":
   - **Phone number ID** (ID do número de telefone) → vai no secret `WA_PHONE_NUMBER_ID`
   - **Temporary access token** (token temporário, dura 24h — depois geramos um permanente)
5. Ainda em "API Setup", em **To**, adicione o **seu próprio celular** como número de
   teste (a Meta manda um código de confirmação). Isso permite testar recebendo/enviando.

### Token permanente (para não expirar a cada 24h)
6. Vá em **https://business.facebook.com/settings/** → **Usuários → Usuários do sistema**.
7. Crie um **usuário do sistema** (System User) do tipo **Admin**.
8. Clique em **Gerar novo token**, escolha o app, e marque as permissões:
   `whatsapp_business_messaging` e `whatsapp_business_management`.
9. Copie o token gerado → é o seu **`WA_TOKEN`** permanente. **Guarde com cuidado.**
10. Em **Ativos** do system user, adicione a sua **WABA** e o **app** (com acesso total).

### Escolha um verify token
11. Invente uma senha aleatória qualquer (ex.: `clinica-webhook-8f3k2`). Ela será o
    **`WA_VERIFY_TOKEN`** (usada só para a Meta e o servidor se reconhecerem).

Ao final desta etapa você tem: **WA_TOKEN**, **WA_PHONE_NUMBER_ID**, **WA_VERIFY_TOKEN**.

---

## B) Supabase — banco de dados

1. Abra o **Supabase → seu projeto → SQL Editor → New query**.
2. Cole todo o conteúdo de **`supabase-migration-whatsapp.sql`** e clique em **Run**.
   (cria as tabelas `wa_conversas`/`wa_mensagens`, RLS e ativa o Realtime.)

### Descubra o seu WA_OWNER_USER_ID
3. Ainda no SQL Editor, rode:
   ```sql
   select id, email from auth.users;
   ```
   Copie o **id** (UUID) da sua conta (o e-mail que você usa no dashboard). Esse é o
   **`WA_OWNER_USER_ID`** (dono do número — as mensagens recebidas serão atribuídas a ele).

---

## C) Edge Functions — publicar código e secrets

Precisa da **CLI do Supabase** instalada (uma vez):
```bash
# macOS
brew install supabase/tap/supabase
```

Na pasta do projeto:
```bash
supabase login                       # abre o navegador para autenticar
supabase link --project-ref SEU_REF  # o ref esta na URL do painel: app.supabase.com/project/SEU_REF
```

Configure os **secrets** (variáveis seguras, ficam só no servidor):
```bash
supabase secrets set \
  WA_TOKEN="EAAG...seu_token_permanente" \
  WA_PHONE_NUMBER_ID="1234567890" \
  WA_VERIFY_TOKEN="clinica-webhook-8f3k2" \
  WA_OWNER_USER_ID="uuid-da-sua-conta"
```
> `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já existem
> automaticamente nas Edge Functions — não precisa setar.

Publique as duas funções:
```bash
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy whatsapp-send
```
> `--no-verify-jwt` só na do **webhook** (a Meta chama sem login; a segurança é o
> verify token). A de **envio** mantém verificação de login.

A URL do webhook será:
```
https://SEU_REF.functions.supabase.co/whatsapp-webhook
```

---

## D) Apontar o webhook na Meta

1. No painel do app (developers.facebook.com) → **WhatsApp → Configuration**.
2. Em **Webhook**, clique **Edit** e preencha:
   - **Callback URL:** `https://SEU_REF.functions.supabase.co/whatsapp-webhook`
   - **Verify token:** o mesmo `WA_VERIFY_TOKEN` que você definiu.
3. Clique **Verify and save** (a Meta chama a função uma vez; se o token bate, salva).
4. Em **Webhook fields**, clique **Manage** e assine (**Subscribe**) o campo **`messages`**.

---

## Teste de ponta a ponta

1. Do **seu celular** (o que você cadastrou como número de teste), mande um "Oi" para o
   número de teste da Meta (aparece na tela API Setup).
2. No dashboard, abra a aba **WhatsApp** → a conversa deve aparecer na lista.
3. Clique nela, digite uma resposta e envie → deve chegar no seu celular.
4. As bolhas verdes são enviadas por você; as brancas são recebidas. O status
   (sent/delivered/read) atualiza sozinho.

### Deu errado?
- **Conversa não aparece:** confira se assinou o campo `messages` (etapa D4) e se o
  `WA_OWNER_USER_ID` é o UUID certo. Veja os logs: `supabase functions logs whatsapp-webhook`.
- **Falha ao enviar:** normalmente é o `WA_TOKEN` expirado (use o permanente) ou a
  **janela de 24h**: fora dela, o WhatsApp só entrega **templates aprovados** (não texto livre).
- **Webhook não verifica:** o `WA_VERIFY_TOKEN` do secret tem que ser idêntico ao da Meta.

---

## Observações importantes (regras do WhatsApp)

- **Janela de 24h:** você pode responder livremente por até 24h após a última mensagem
  do cliente. Para **iniciar** conversa (ou responder depois das 24h), só via
  **templates** pré-aprovados pela Meta (Message Templates).
- **Custo:** a Meta cobra por conversa iniciada (há uma cota grátis mensal). Number de
  teste é grátis para poucos destinatários.
- Para produção com número próprio, será preciso **verificar o negócio** (Business
  Verification) na Meta e registrar o número.
