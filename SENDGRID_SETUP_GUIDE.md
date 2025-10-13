# 📧 Guia Completo: Configurar SendGrid para Envio de Emails

## 🎯 O Problema Atual

O SendGrid está retornando **erro 403 Forbidden** porque o email remetente não está verificado.

**Erro nos logs:**
```
Error sending email: HTTP Error 403: Forbidden
```

---

## ✅ Solução: Verificar Email Remetente (Single Sender)

### Passo 1: Acessar SendGrid Dashboard

1. Acesse: **https://app.sendgrid.com/**
2. Faça login com sua conta SendGrid
3. Se não tiver conta, crie uma (é gratuito - 100 emails/dia)

---

### Passo 2: Ir para Sender Authentication

1. No menu lateral esquerdo, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"Sender Authentication"**

Ou acesse direto: https://app.sendgrid.com/settings/sender_auth

---

### Passo 3: Verificar Single Sender

Na página de Sender Authentication, você verá duas opções:

**Opção 1: Domain Authentication** (Avançado - requer domínio próprio)
**Opção 2: Single Sender Verification** ← **USE ESTA!**

1. Na seção **"Single Sender Verification"**, clique em:
   - **"Get Started"** (se for primeira vez)
   - OU **"Create New Sender"** (se já usou antes)

---

### Passo 4: Preencher Informações do Remetente

Preencha o formulário com suas informações:

```
From Name: Meu Look IA
(Nome que aparecerá como remetente)

From Email Address: seu-email@gmail.com
(Use um email REAL que você tem acesso)
⚠️ IMPORTANTE: Você receberá um email de verificação aqui!

Reply To: seu-email@gmail.com
(Pode ser o mesmo)

Company Address:
Street: Rua Exemplo, 123
City: São Paulo
State: SP
Zip Code: 01000-000
Country: Brazil

Nickname: meulookia-sender
(Identificador interno, qualquer nome)
```

**✅ Clique em "Create"**

---

### Passo 5: Verificar Email

1. SendGrid enviará um email para o endereço que você cadastrou
2. **Assunto:** "SendGrid Sender Verification"
3. Abra o email
4. **Clique no link "Verify Single Sender"**
5. Aguarde a confirmação na tela

**✅ Email verificado com sucesso!**

---

### Passo 6: Atualizar Backend (.env)

Agora que o email está verificado, atualize o arquivo `.env` do backend:

**Arquivo:** `/app/backend/.env`

Altere a linha:
```env
SENDER_EMAIL=noreply@meulookia.com
```

Para o email que você verificou:
```env
SENDER_EMAIL=seu-email@gmail.com
```

**Exemplo:**
```env
SENDER_EMAIL=adriano7monteiro@gmail.com
```

---

### Passo 7: Reiniciar Backend

Execute no terminal ou me avise para reiniciar:
```bash
sudo supervisorctl restart backend
```

---

## ✅ Testar Envio de Email

Após configurar:

1. Vá no app → "Esqueci minha senha"
2. Digite o email de um usuário cadastrado
3. Clique em "Enviar Código"
4. **Verifique sua caixa de entrada** (e spam)
5. ✅ Você deve receber o email com o código!

---

## 🔍 Verificar Status no SendGrid

Para confirmar que está funcionando:

1. No SendGrid Dashboard, vá em **"Activity"**
2. Você verá os emails enviados
3. Status deve ser: **"Delivered"** ✅

---

## ⚠️ Problemas Comuns

### Problema 1: Email não chega
**Solução:**
- Verifique pasta de SPAM
- Confirme que o email está verificado (ícone verde no SendGrid)
- Aguarde alguns minutos (pode ter delay)

### Problema 2: Ainda recebe 403
**Solução:**
- Confirme que clicou no link de verificação
- Reinicie o backend após atualizar o .env
- Verifique se o `SENDER_EMAIL` está correto

### Problema 3: Email vai para SPAM
**Solução:**
- Normal em modo de teste
- Em produção, configure Domain Authentication (requer domínio próprio)
- Por enquanto, peça aos usuários para checarem SPAM

---

## 🎯 Alternativa: Usar Domínio Próprio (Avançado)

Se você tiver um domínio (ex: meulookia.com):

1. No SendGrid, escolha **"Domain Authentication"**
2. Adicione seu domínio
3. Configure registros DNS (CNAME)
4. Aguarde propagação
5. Use emails como: `noreply@meulookia.com`

**Vantagens:**
- Emails não vão para SPAM
- Mais profissional
- Melhor taxa de entrega

**Desvantagens:**
- Requer domínio próprio
- Precisa configurar DNS
- Mais complexo

---

## 📊 Limites do SendGrid (Plano Gratuito)

- **100 emails por dia** (suficiente para MVP)
- Após isso, precisa upgrade
- Para produção, considere plano pago

---

## 💡 Resumo Rápido

1. ✅ Acesse SendGrid Dashboard
2. ✅ Settings → Sender Authentication
3. ✅ Single Sender Verification → Create New Sender
4. ✅ Preencha com email real (gmail, hotmail, etc)
5. ✅ Verifique email (clique no link recebido)
6. ✅ Atualize `SENDER_EMAIL` no `.env`
7. ✅ Reinicie backend
8. ✅ Teste enviando código de recuperação

**Tempo total: ~5 minutos** ⏱️

---

## 🆘 Precisa de Ajuda?

Se tiver dúvida em algum passo, me envie:
1. Print da tela onde você está
2. Mensagem de erro (se houver)
3. Qual passo não funcionou

**Vou te ajudar a resolver!** 💪
