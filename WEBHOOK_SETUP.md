# 🔔 Configuração de Webhooks do Stripe

## ✅ O que foi implementado

O sistema agora possui um endpoint completo para receber e processar webhooks do Stripe:

- **URL do Webhook:** `https://fashionai-fixed.preview.emergentagent.com/api/stripe-webhook`
- **Eventos processados:**
  - ✅ `invoice.payment_succeeded` - Pagamento recorrente bem-sucedido
  - ❌ `invoice.payment_failed` - Falha no pagamento recorrente
  - 🔄 `customer.subscription.updated` - Assinatura atualizada
  - 🚫 `customer.subscription.deleted` - Assinatura cancelada

## 📋 Como configurar no Stripe Dashboard

### 1. Acesse o Stripe Dashboard
- Entre em: https://dashboard.stripe.com/
- Faça login com sua conta

### 2. Navegue até Webhooks
- No menu lateral, clique em **"Developers"**
- Clique em **"Webhooks"**
- Clique no botão **"Add endpoint"**

### 3. Configure o endpoint

**URL do endpoint:**
```
https://fashionai-fixed.preview.emergentagent.com/api/stripe-webhook
```

**Eventos para ouvir:**
Selecione os seguintes eventos:
- ✅ `invoice.payment_succeeded`
- ❌ `invoice.payment_failed`
- 🔄 `customer.subscription.updated`
- 🚫 `customer.subscription.deleted`

### 4. Copie o Webhook Secret

Após criar o endpoint:
1. Clique no endpoint criado
2. Na seção **"Signing secret"**, clique em **"Reveal"**
3. Copie o valor que começa com `whsec_...`

### 5. Atualize o arquivo .env do backend

Substitua a linha no arquivo `/app/backend/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

Por:

```env
STRIPE_WEBHOOK_SECRET=whsec_SEU_SECRET_COPIADO_AQUI
```

### 6. Reinicie o backend

```bash
sudo supervisorctl restart backend
```

## 🧪 Como testar

### Teste manual no Stripe Dashboard:
1. Vá até o webhook criado
2. Clique na aba **"Send test webhook"**
3. Selecione um evento (ex: `invoice.payment_succeeded`)
4. Clique em **"Send test webhook"**
5. Verifique os logs do backend para confirmar o recebimento

### Verificar logs:
```bash
tail -f /var/log/supervisor/backend.err.log | grep WEBHOOK
```

## 🔍 Como funciona

### Pagamento recorrente bem-sucedido
Quando o Stripe cobra automaticamente o cartão do usuário:
1. Stripe envia evento `invoice.payment_succeeded`
2. Backend busca o usuário pelo `customer_id`
3. Calcula nova data de expiração (30 dias para mensal, 365 para anual)
4. Atualiza o campo `data_expiracao_plano` no MongoDB
5. Usuário continua com acesso premium automaticamente

### Falha no pagamento
Quando o cartão é recusado:
1. Stripe envia evento `invoice.payment_failed`
2. Backend registra a falha nos logs
3. Stripe tentará cobrar novamente automaticamente
4. Após várias tentativas falhadas, Stripe cancela a assinatura

### Cancelamento de assinatura
Quando o usuário ou Stripe cancela:
1. Stripe envia evento `customer.subscription.deleted`
2. Backend reverte o usuário para plano `free`
3. Remove a data de expiração
4. Usuário volta a ter apenas 5 looks gratuitos

## ⚠️ Importante

- **Segurança:** O webhook verifica a assinatura do Stripe usando o `STRIPE_WEBHOOK_SECRET`
- **Modo de desenvolvimento:** Se o secret não estiver configurado, o webhook funcionará mas sem validação de segurança
- **Logs detalhados:** Todos os eventos são registrados com prefixo `[WEBHOOK]` para fácil identificação
- **Produção:** Em produção, SEMPRE configure o webhook secret para garantir segurança

## 📊 Monitoramento

### Verificar eventos recebidos:
```bash
grep "\[WEBHOOK\]" /var/log/supervisor/backend.err.log
```

### Ver renovações de assinatura:
```bash
grep "Subscription renewed" /var/log/supervisor/backend.err.log
```

### Ver cancelamentos:
```bash
grep "Subscription cancelled" /var/log/supervisor/backend.err.log
```

## 🔗 URLs importantes

- **Stripe Dashboard:** https://dashboard.stripe.com/
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Documentação do Stripe:** https://stripe.com/docs/webhooks
- **Testador de Webhooks:** https://dashboard.stripe.com/test/webhooks

## 💡 Dicas

1. **Teste em modo de desenvolvimento primeiro:** Configure o webhook no ambiente de teste do Stripe antes de produção
2. **Monitore os logs:** Sempre verifique se os webhooks estão sendo recebidos corretamente
3. **Assinatura vs Payment Intent:** O sistema usa Payment Intents para o primeiro pagamento e Subscriptions para pagamentos recorrentes
4. **Renovação automática:** Com os webhooks configurados, as assinaturas são renovadas automaticamente sem intervenção manual

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o webhook secret está correto no `.env`
2. Confirme que o backend está acessível publicamente
3. Verifique os logs de erro do backend
4. Teste usando o "Send test webhook" do Stripe Dashboard
