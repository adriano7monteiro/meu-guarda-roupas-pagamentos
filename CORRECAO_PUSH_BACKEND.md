# 🐛 Correção: Erro Push Notifications Backend

## ❌ Erros Encontrados

### Erro 1: AttributeError
```
AttributeError: module 'firebase_admin.messaging' has no attribute 'InvalidArgumentError'
```

**Causa:** Exceções estavam sendo importadas do módulo errado.
- ❌ `messaging.InvalidArgumentError` (não existe)
- ✅ `firebase_exceptions.InvalidArgumentError` (correto)

### Erro 2: InvalidArgumentError
```
firebase_admin.exceptions.InvalidArgumentError: The registration token is not a valid FCM registration token
```

**Causa:** Token no formato `ExponentPushToken[...]` sendo enviado para Firebase.
- Este formato é do Expo Push Service, NÃO é FCM
- Ocorre quando app não tem `google-services.json` configurado
- Firebase espera token FCM puro (string longa sem prefixo)

---

## ✅ Correções Implementadas

### 1. Import Correto das Exceções

**ANTES:**
```python
from firebase_admin import credentials, messaging
```

**DEPOIS:**
```python
from firebase_admin import credentials, messaging, exceptions as firebase_exceptions
```

### 2. Validação de Token Melhorada

**ANTES:**
```python
if raw_token.startswith("ExponentPushToken["):
    fcm_token = raw_token[18:-1]  # Tentava extrair
    logging.info("Convertendo token...")
```

**DEPOIS:**
```python
if raw_token.startswith("ExponentPushToken["):
    # Rejeita token Expo - não é FCM válido
    failed_count += 1
    error_msg = "Token Expo detectado. App precisa novo build com Firebase."
    logging.warning("Token Expo detectado (ignorando)")
    continue  # Pula este token
```

### 3. Validação de Comprimento

**NOVO:**
```python
# Token FCM válido tem pelo menos 140 caracteres
if not fcm_token or len(fcm_token) < 140:
    failed_count += 1
    error_msg = f"Token inválido ou muito curto"
    logging.error(f"Token inválido: length {len(fcm_token)}")
    continue
```

### 4. Exceções Corrigidas

**ANTES:**
```python
except messaging.UnregisteredError:  # ❌ Não existe
except messaging.InvalidArgumentError:  # ❌ Não existe
```

**DEPOIS:**
```python
except firebase_exceptions.InvalidArgumentError as e:  # ✅ Correto
except firebase_exceptions.UnregisteredError as e:  # ✅ Correto
```

---

## 🔍 Como Identificar o Problema

### Token Expo (Inválido para FCM):
```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```
- Comprimento: ~50 caracteres
- Formato: `ExponentPushToken[...]`
- **Causa:** App não tem Firebase configurado

### Token FCM (Válido):
```
dK3xMnP2Rqw:APA91bHuN...muito_longo...xyz123
```
- Comprimento: 140-200+ caracteres
- Formato: String longa sem prefixo
- **Gerado:** Quando app tem `google-services.json` (Android) ou `GoogleService-Info.plist` (iOS)

---

## 📊 Logs Melhorados

### Token Expo Detectado:
```
⚠️ Token Expo detectado: ExponentPushToken[Z_GR-bAjLkBOndQ7AHlGax] (ignorando)
⚠️ Este token precisa que o app seja reconstruído com google-services.json
```

### Token FCM Válido:
```
📤 Tentando enviar para token FCM: dK3xMnP2Rqw:APA91bHuN... (length: 152)
✅ Push sent successfully. Message ID: projects/...
```

### Token Inválido:
```
❌ Token inválido: abc123... (length: 10)
```

### Erro de Argumento:
```
❌ Invalid FCM token dK3xMnP2Rqw:APA91bHuN...: ...
❌ Este token não é um token FCM válido. App precisa de novo build com Firebase configurado.
```

---

## 🎯 Solução para o Usuário

### Problema: Tokens Expo no Banco de Dados

Se você está vendo mensagens de "Token Expo detectado", significa que:

1. **O app instalado** não tem Firebase configurado corretamente
2. **Usuário precisa** instalar novo build do app
3. **Backend está correto** e pronto

### Passos para Resolver:

#### Android:

1. **Configurar Firebase Secret:**
```bash
cd /app/frontend
./setup-firebase-secret.sh
```

2. **Fazer novo build:**
```bash
eas build --platform android --profile production
```

3. **Distribuir novo APK/AAB** para usuários

4. **Usuários instalam** o novo app

5. **Tokens FCM** serão registrados automaticamente

#### iOS:

1. **Seguir guia:** `/app/GUIA_PUSH_NOTIFICATIONS_IOS.md`

2. **Configurar APNs** no Firebase

3. **Fazer build iOS:**
```bash
eas build --platform ios --profile production
```

4. **Distribuir para usuários**

---

## 🧪 Como Testar

### 1. Verificar Tokens no Banco

```bash
# Conectar ao MongoDB
mongo mongodb://localhost:27017/meu_look_ia

# Ver tokens
db.push_tokens.find()

# Contar por tipo
db.push_tokens.aggregate([
  {
    $project: {
      isExpo: { $regexMatch: { input: "$token", regex: /^ExponentPushToken/ } }
    }
  },
  {
    $group: {
      _id: "$isExpo",
      count: { $sum: 1 }
    }
  }
])
```

**Resultado esperado:**
```
{ "_id": false, "count": 10 }  // 10 tokens FCM válidos
{ "_id": true, "count": 2 }    // 2 tokens Expo (inválidos)
```

### 2. Testar Envio de Push

1. Acesse: `/api/admin_lojinha.html`
2. Vá na aba "Push Notifications"
3. Digite mensagem e envie

**Logs esperados:**
```
📱 Preparando envio para 12 dispositivos
⚠️ Token Expo detectado: ... (ignorando)
⚠️ Token Expo detectado: ... (ignorando)
📤 Tentando enviar para token FCM: dK3x... (length: 152)
✅ Push sent successfully. Message ID: ...
[repete para cada token FCM válido]
```

**Resposta da API:**
```json
{
  "message": "Notificações enviadas",
  "sent_count": 10,
  "failed": 2,
  "total": 12,
  "errors": [
    "Token Expo detectado. App precisa novo build.",
    "Token Expo detectado. App precisa novo build."
  ]
}
```

---

## 📋 Checklist de Correção

- [x] Import de `firebase_exceptions` adicionado
- [x] Validação de token Expo (rejeita e continua)
- [x] Validação de comprimento de token
- [x] Exceção `InvalidArgumentError` corrigida
- [x] Exceção `UnregisteredError` corrigida
- [x] Logs melhorados com detalhes
- [x] Mensagens claras de erro

---

## 🔄 Migração de Tokens

### Para limpar tokens Expo antigos do banco:

```javascript
// MongoDB
db.push_tokens.deleteMany({
  token: { $regex: /^ExponentPushToken/ }
})
```

**⚠️ Cuidado:** Só faça isso se os usuários já tiverem o novo build instalado!

---

## 📚 Referências

- [Firebase Admin SDK - Exceptions](https://firebase.google.com/docs/reference/admin/python/firebase_admin.exceptions)
- [FCM Token Format](https://firebase.google.com/docs/cloud-messaging/android/client)
- [Expo Push Tokens vs FCM](https://docs.expo.dev/push-notifications/fcm-credentials/)

---

**Status:** ✅ Erros corrigidos no backend  
**Próximo passo:** Gerar novos builds com Firebase configurado  
**Última atualização:** Janeiro 2025
