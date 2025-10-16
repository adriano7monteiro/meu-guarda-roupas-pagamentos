# 🔄 Configuração Completa: Google Play In-App Purchase com Recorrência

## ✅ Implementação Concluída

### 📋 O que foi implementado:

1. **Modelo User Atualizado** (`server.py`)
   - ✅ Campos adicionados para tracking completo de subscriptions
   - ✅ `google_play_subscription_id` - ID do produto (mensal/semestral/anual)
   - ✅ `google_play_expiry_time` - Data de expiração precisa do Google Play
   - ✅ `google_play_auto_renewing` - Status de renovação automática
   - ✅ `google_play_payment_state` - Estado do pagamento

2. **Endpoint `/api/verify-purchase` Melhorado**
   - ✅ Valida compra com Google Play API
   - ✅ Salva TODAS as informações da subscription no banco
   - ✅ Usa data de expiração precisa do Google Play
   - ✅ Retorna status de auto-renovação

3. **Novo Endpoint `/api/google-play-webhook`**
   - ✅ Recebe Real-time Developer Notifications (RTDN)
   - ✅ Processa 13 tipos de eventos de subscription
   - ✅ Renova automaticamente quando Google Play cobra
   - ✅ Desativa quando subscription expira/cancela
   - ✅ Logs detalhados de cada evento

4. **Script de Verificação Periódica**
   - ✅ `check_subscriptions_status.py`
   - ✅ Verifica status de todas subscriptions ativas
   - ✅ Sincroniza com Google Play API
   - ✅ Detecta e processa expiradas
   - ✅ Pode rodar como cron job

---

## 🔧 Configuração no Google Play Console

### **Passo 1: Criar Conta de Serviço**

1. Acesse: https://console.cloud.google.com/
2. Selecione ou crie um projeto
3. Navegue: **IAM & Admin** → **Service Accounts**
4. Clique em **Create Service Account**
5. Preencha:
   - **Name:** `google-play-api-access`
   - **Description:** `API access for subscription management`
6. Clique em **Create and Continue**
7. Pule as permissões opcionais → **Done**

### **Passo 2: Criar Chave JSON**

1. Na lista de Service Accounts, clique na conta criada
2. Vá na aba **Keys**
3. Clique em **Add Key** → **Create new key**
4. Selecione **JSON**
5. Clique em **Create**
6. Um arquivo JSON será baixado
7. **Salve esse arquivo em local seguro!**

### **Passo 3: Vincular ao Google Play Console**

1. Acesse: https://play.google.com/console/
2. Vá em **Configurações** → **API access** (ou **Setup** → **API access**)
3. Clique em **Link a service account**
4. Cole o **email da service account** (formato: `xxx@xxx.iam.gserviceaccount.com`)
5. Clique em **Link service account**
6. Clique em **Grant access** (Conceder acesso)
7. Selecione as permissões:
   - ✅ **View app information and download bulk reports**
   - ✅ **View financial data, orders, and subscription details**
   - ✅ **Manage orders and subscriptions**
8. Clique em **Apply** → **Save**

### **Passo 4: Configurar Real-time Developer Notifications (RTDN)**

1. No Google Play Console, vá em **Configurações** → **Developer account** → **API access**
2. Encontre a seção **Real-time developer notifications**
3. Clique em **Edit** ou **Create topic** (se não existir)

4. **Criar Tópico no Google Cloud Pub/Sub:**
   - Acesse: https://console.cloud.google.com/cloudpubsub/topic/list
   - Clique em **Create Topic**
   - **Topic ID:** `google-play-rtdn` (ou outro nome)
   - Deixe as outras opções padrão
   - Clique em **Create**

5. **Voltar ao Google Play Console:**
   - Em **Topic name**, cole o nome completo do tópico:
     ```
     projects/[SEU_PROJECT_ID]/topics/google-play-rtdn
     ```
   - Clique em **Save**

6. **Configurar Push Subscription no Cloud Pub/Sub:**
   - Volte ao Cloud Pub/Sub: https://console.cloud.google.com/cloudpubsub/subscription/list
   - Clique em **Create Subscription**
   - **Subscription ID:** `google-play-webhook-push`
   - **Select a Cloud Pub/Sub topic:** Selecione o tópico criado (`google-play-rtdn`)
   - **Delivery type:** Selecione **Push**
   - **Endpoint URL:** Cole a URL do seu backend:
     ```
     https://meulookia-e68fc7ce1afa.herokuapp.com/api/google-play-webhook
     ```
   - **Enable authentication:** Deixe desmarcado (ou configure se quiser segurança extra)
   - Clique em **Create**

### **Passo 5: Configurar Produtos de Assinatura**

1. No Google Play Console, vá em **Monetize** → **Products** → **Subscriptions**
2. Crie ou verifique os produtos:

   **Produto 1: Mensal**
   - **Product ID:** `mensal`
   - **Name:** Assinatura Mensal
   - **Billing period:** 1 month
   - **Price:** R$ 19,90 (ou seu preço)
   - **Free trial:** (opcional) 7 dias
   - **Grace period:** Recomendado: 3 dias

   **Produto 2: Semestral**
   - **Product ID:** `semestral`
   - **Name:** Assinatura Semestral
   - **Billing period:** 6 months
   - **Price:** R$ 99,90
   - **Grace period:** Recomendado: 3 dias

   **Produto 3: Anual**
   - **Product ID:** `anual`
   - **Name:** Assinatura Anual
   - **Billing period:** 1 year
   - **Price:** R$ 179,90
   - **Grace period:** Recomendado: 3 dias

3. **Ativar produtos:** Certifique-se de que todos estão **Active**

---

## 🚀 Configuração no Backend (Heroku)

### **Passo 1: Upload do Arquivo JSON**

**Opção A: Via Git (NÃO recomendado - arquivo sensível)**
```bash
# ❌ NÃO faça isso se o repo for público!
mv ~/Downloads/google-play-xxx.json /app/backend/google-play-service-account.json
git add google-play-service-account.json
git commit -m "Add Google Play credentials"
```

**Opção B: Via Heroku Config Vars (RECOMENDADO)**
```bash
# 1. Converter JSON para base64
base64 -i google-play-xxx.json -o google-play-base64.txt

# 2. Copiar conteúdo do arquivo
cat google-play-base64.txt

# 3. No Heroku Dashboard:
# Settings → Config Vars → Add
# Key: GOOGLE_SERVICE_ACCOUNT_BASE64
# Value: [cole o conteúdo base64]

# 4. No seu código, decodificar:
# (já implementado no server.py se precisar)
```

**Opção C: Via Heroku CLI**
```bash
heroku config:set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat google-play-xxx.json)" -a meulookia
```

### **Passo 2: Adicionar Variáveis de Ambiente**

No Heroku Dashboard → Settings → Config Vars:

```env
GOOGLE_PLAY_SERVICE_ACCOUNT_FILE=/app/backend/google-play-service-account.json
GOOGLE_PACKAGE_NAME=com.meulookia.app
```

Ou via CLI:
```bash
heroku config:set GOOGLE_PLAY_SERVICE_ACCOUNT_FILE=/app/backend/google-play-service-account.json -a meulookia
heroku config:set GOOGLE_PACKAGE_NAME=com.meulookia.app -a meulookia
```

### **Passo 3: Criar arquivo JSON no Heroku (se Opção A)**

Se você usou Config Vars, precisa criar o arquivo no deploy:

Crie um arquivo `decode_google_credentials.py` no backend:

```python
import os
import base64

# Decodificar base64 para arquivo JSON
if 'GOOGLE_SERVICE_ACCOUNT_BASE64' in os.environ:
    base64_content = os.environ['GOOGLE_SERVICE_ACCOUNT_BASE64']
    json_content = base64.b64decode(base64_content)
    
    with open('/app/backend/google-play-service-account.json', 'wb') as f:
        f.write(json_content)
    
    print("✅ Google Play credentials created")
```

E execute antes do servidor:
```bash
python decode_google_credentials.py && python server.py
```

---

## 🧪 Testando o Sistema

### **1. Testar Compra de Assinatura**

1. Abra o app no celular (em modo de teste)
2. Vá em **Assinar Premium**
3. Escolha **Mensal**
4. Use conta de teste do Google Play
5. Confirme o pagamento
6. Verifique nos logs do backend:
   ```
   ✅ Google Play purchase verified successfully
   ✅ Subscription activated: mensal for user xxx, expires: 30/11/2025 10:30
   📊 Auto-renewing: True
   ```

### **2. Testar Webhook (Simulado)**

Crie um arquivo `test_webhook.py`:

```python
import requests
import json
import base64

# Simular notificação de renovação
notification = {
    "subscriptionNotification": {
        "notificationType": 2,  # SUBSCRIPTION_RENEWED
        "subscriptionId": "mensal",
        "purchaseToken": "SEU_PURCHASE_TOKEN_AQUI"
    }
}

# Codificar em base64
encoded = base64.b64encode(json.dumps(notification).encode()).decode()

# Enviar para webhook
response = requests.post(
    "https://meulookia-e68fc7ce1afa.herokuapp.com/api/google-play-webhook",
    json={
        "message": {
            "data": encoded
        }
    }
)

print(response.json())
```

Execute:
```bash
python test_webhook.py
```

### **3. Testar Script de Verificação**

```bash
cd /app/backend
python check_subscriptions_status.py
```

Saída esperada:
```
🔍 Iniciando verificação de assinaturas...
📊 Encontrados 5 usuários com assinatura ativa
🔍 Verificando user@email.com - mensal
✅ Assinatura ATIVA: user@email.com - expira em 30/11/2025 10:30 - Auto-renew: True
...
📊 RESUMO:
  ✅ Atualizadas: 5
  ⏰ Expiradas: 0
  ❌ Erros: 0
```

### **4. Configurar Cron Job (Heroku Scheduler)**

1. Instale o addon:
   ```bash
   heroku addons:create scheduler:standard -a meulookia
   ```

2. Configure o job:
   ```bash
   heroku addons:open scheduler -a meulookia
   ```

3. Adicione o job:
   - **Command:** `cd backend && python check_subscriptions_status.py`
   - **Frequency:** Every 6 hours (ou diário às 00:00)
   - **Dyno size:** Standard-1X

---

## 📊 Monitoramento

### **Verificar Logs do Webhook**

```bash
# Heroku
heroku logs --tail -a meulookia | grep GOOGLE_PLAY_WEBHOOK

# Local
tail -f /var/log/supervisor/backend.err.log | grep GOOGLE_PLAY_WEBHOOK
```

### **Verificar Subscriptions no Google Play Console**

1. Acesse: https://play.google.com/console/
2. Selecione seu app
3. Vá em **Monetize** → **Subscriptions** → **Dashboard**
4. Veja:
   - Total de assinaturas ativas
   - Receita recorrente mensal (MRR)
   - Taxa de cancelamento (churn)
   - Renovações automáticas

### **Verificar no Banco de Dados**

```python
# Ver usuários com assinatura ativa
users = db.users.find({"plano_ativo": {"$ne": "free"}})
for user in users:
    print(f"{user['email']} - {user['plano_ativo']} - Expira: {user.get('data_expiracao_plano')}")
```

---

## 🔄 Fluxo Completo de Renovação

### **Primeira Compra:**
1. Usuário compra no app
2. Frontend envia para `/api/verify-purchase`
3. Backend valida com Google Play API
4. Backend salva subscription info + purchase_token
5. Plano ativado por 30 dias
6. Google Play salva método de pagamento

### **Renovação Automática (30 dias depois):**
1. Google Play cobra automaticamente
2. Google Play envia RTDN para webhook
3. Backend recebe notificação tipo `SUBSCRIPTION_RENEWED`
4. Backend busca info atualizada na API
5. Backend atualiza data de expiração (+30 dias)
6. Usuário continua com acesso! ✅

### **Verificação Periódica (Cron Job):**
1. Script roda a cada 6 horas
2. Busca todas subscriptions ativas no banco
3. Consulta status no Google Play API
4. Sincroniza datas de expiração
5. Desativa subscriptions expiradas

---

## ⚠️ Troubleshooting

### **Webhook não está sendo chamado:**
- Verifique URL do endpoint no Cloud Pub/Sub
- Confirme que tópico foi configurado no Google Play Console
- Teste com `test_webhook.py` (simular notificação)
- Veja logs do Cloud Pub/Sub

### **Erro 401 Unauthorized na API:**
- Verifique se service account tem permissões corretas
- Confirme que JSON está no lugar certo
- Teste credenciais manualmente

### **Subscription não renova automaticamente:**
- Verifique se produto está configurado como subscription (não one-time)
- Confirme que `autoRenewing` é `true`
- Verifique se cartão é válido (testes com cartões de teste)

### **Script de verificação não encontra usuários:**
- Confirme que `plano_ativo` está correto no banco
- Verifique se `google_play_purchase_token` está salvo
- Veja logs do script

---

## 🎯 Checklist Final

- [ ] ✅ Service account criada e JSON baixado
- [ ] ✅ Service account vinculada ao Google Play Console
- [ ] ✅ RTDN configurado com Cloud Pub/Sub
- [ ] ✅ Push subscription apontando para webhook
- [ ] ✅ Produtos de subscription criados e ativos
- [ ] ✅ Variáveis de ambiente configuradas no Heroku
- [ ] ✅ Arquivo JSON no backend (ou base64 em config)
- [ ] ✅ Testado compra no app
- [ ] ✅ Testado webhook (simulado)
- [ ] ✅ Script de verificação rodando
- [ ] ✅ Cron job configurado no Heroku Scheduler

---

## 📚 Referências

- **Google Play Billing:** https://developer.android.com/google/play/billing
- **Real-time Developer Notifications:** https://developer.android.com/google/play/billing/rtdn-reference
- **Google Play Developer API:** https://developers.google.com/android-publisher
- **Pub/Sub Documentation:** https://cloud.google.com/pubsub/docs

---

**Status:** ✅ Sistema completo implementado
**Data:** 16/10/2025
**Próximos passos:** Testar em produção e monitorar renovações automáticas
