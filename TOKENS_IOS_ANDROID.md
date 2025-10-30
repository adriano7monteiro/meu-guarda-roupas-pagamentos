# 📱 Tokens de Push: iOS vs Android

## 🔍 Diferenças Entre Tokens

### Android (FCM - Firebase Cloud Messaging)
```
dK3xMnP2Rqw:APA91bHuN8gF3_KZjXm4L9P2vQ1rS3tU4vW5xY6zA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA0bC1dE2fG3hI4jK5lM6nO7pQ8rS9tU0vW1xY2zA3bC4dE5fG6hI7jK8lM9nO0p
```

**Características:**
- Comprimento: 140-200+ caracteres
- Formato: Base64-like com caracteres especiais
- Prefixo comum: Geralmente começa com letras/números variados
- Gerado quando: App tem `google-services.json` configurado

### iOS (APNs - Apple Push Notification service)
```
d44e4fa5ad94d1216e7846e096a7ee3c8f2b1d5a9c7e6f4b3a2d1e0f9c8b7a6d
```

**Características:**
- Comprimento: **Exatamente 64 caracteres**
- Formato: Hexadecimal (0-9, a-f)
- Sem prefixo especial
- Gerado quando: App tem `GoogleService-Info.plist` configurado

### Expo (Não-Firebase)
```
ExponentPushToken[Z_GR-bAjLkBOndQ7AHlGax]
```

**Características:**
- Comprimento: ~50 caracteres
- Formato: `ExponentPushToken[...]`
- **Inválido** para Firebase Admin SDK
- Gerado quando: App **NÃO** tem Firebase configurado

---

## 📊 Comparação

| Aspecto | Android FCM | iOS APNs | Expo |
|---------|-------------|----------|------|
| Comprimento | 140-200+ chars | 64 chars | ~50 chars |
| Formato | Alfanumérico + especiais | Hexadecimal | `ExponentPushToken[...]` |
| Firebase SDK | ✅ Funciona | ✅ Funciona | ❌ Não funciona |
| Requer Config | `google-services.json` | `GoogleService-Info.plist` | Nenhum |

---

## 🔧 Correção no Backend

### Validação Antiga (ERRADA):
```python
# ❌ Rejeitava tokens iOS válidos!
if len(fcm_token) < 140:
    logging.error("Token inválido")
    continue
```

**Problema:** Tokens iOS têm 64 caracteres, eram rejeitados incorretamente.

### Validação Nova (CORRETA):
```python
# ✅ Aceita tokens iOS e Android
if not fcm_token or len(fcm_token) < 10:
    logging.error("Token vazio ou inválido")
    continue

# Identificar tipo de token
token_type = "iOS APNs" if len(fcm_token) == 64 else "Android FCM"
logging.info(f"Enviando para token {token_type}")
```

---

## 🧪 Como Testar

### 1. Verificar Tokens no Banco

```javascript
// MongoDB
db.push_tokens.find().forEach(doc => {
  const token = doc.token;
  let type = "Unknown";
  
  if (token.startsWith("ExponentPushToken[")) {
    type = "Expo (inválido)";
  } else if (token.length === 64 && /^[0-9a-f]+$/.test(token)) {
    type = "iOS APNs";
  } else if (token.length > 140) {
    type = "Android FCM";
  }
  
  print(`${type}: ${token.substring(0, 30)}... (length: ${token.length})`);
});
```

**Saída esperada:**
```
iOS APNs: d44e4fa5ad94d1216e7846e096a7e... (length: 64)
Android FCM: dK3xMnP2Rqw:APA91bHuN8gF3_KZjX... (length: 152)
Expo (inválido): ExponentPushToken[Z_GR-bAjLkBO... (length: 45)
```

### 2. Enviar Push via Admin

1. Acesse: `/api/admin_lojinha.html`
2. Aba "Push Notifications"
3. Digite mensagem e envie

**Logs esperados:**
```
📱 Preparando envio para 3 dispositivos
📤 Tentando enviar para token iOS APNs: d44e4fa5ad94d1216e7846e096a7e... (length: 64)
✅ Push sent successfully. Message ID: projects/...
📤 Tentando enviar para token Android FCM: dK3xMnP2Rqw:APA91bHuN... (length: 152)
✅ Push sent successfully. Message ID: projects/...
⚠️ Token Expo detectado: ExponentPushToken[...] (ignorando)
```

---

## 🎯 Configuração por Plataforma

### Android
1. **Arquivo necessário:** `google-services.json`
2. **Como configurar:** `./setup-firebase-secret.sh`
3. **Build:** `eas build --platform android`
4. **Token gerado:** FCM (140-200+ chars)

### iOS
1. **Arquivo necessário:** `GoogleService-Info.plist`
2. **Como configurar:** Seguir `/app/GUIA_PUSH_NOTIFICATIONS_IOS.md`
3. **Build:** `eas build --platform ios`
4. **Token gerado:** APNs (64 chars)

### Sem Firebase (Expo)
1. **Arquivo:** Nenhum
2. **Token gerado:** `ExponentPushToken[...]`
3. **Firebase SDK:** ❌ Não funciona
4. **Solução:** Configurar Firebase e fazer novo build

---

## 📱 Código Backend (Atualizado)

```python
# Validação de token
if raw_token.startswith("ExponentPushToken["):
    # Rejeitar - não é Firebase
    logging.warning("Token Expo detectado (ignorando)")
    continue

# Token iOS ou Android
fcm_token = raw_token

# Validação básica
if not fcm_token or len(fcm_token) < 10:
    logging.error("Token inválido")
    continue

# Identificar tipo
token_type = "iOS APNs" if len(fcm_token) == 64 else "Android FCM"
logging.info(f"Enviando para {token_type}")

# Criar mensagem (funciona para ambos)
message = messaging.Message(
    notification=messaging.Notification(
        title=notification.title,
        body=notification.body,
    ),
    token=fcm_token,
    android=messaging.AndroidConfig(...),  # Apenas Android
    apns=messaging.APNSConfig(...),        # Apenas iOS
)

# Firebase roteia automaticamente baseado no token
response = messaging.send(message)
```

---

## 🔍 Detecção Automática

Firebase Admin SDK detecta automaticamente o tipo de token:

- **Token iOS (64 hex)** → Envia via APNs
- **Token Android (140+ chars)** → Envia via FCM

**Você não precisa fazer nada especial!** O Firebase sabe qual é qual.

---

## 💡 Dicas Importantes

1. **Tokens iOS sempre têm 64 caracteres**
   - Não rejeite por comprimento
   - Valide apenas se não está vazio

2. **Tokens Android têm 140+ caracteres**
   - Comprimento variável
   - Contém caracteres especiais

3. **Tokens Expo devem ser rejeitados**
   - Começam com `ExponentPushToken[`
   - Não funcionam com Firebase

4. **Firebase roteia automaticamente**
   - Não precisa detectar manualmente iOS vs Android
   - Apenas envie o token correto

5. **Configuração APNs vs AndroidConfig**
   - Ambas podem estar presentes
   - Firebase usa a apropriada baseado no token

---

## 🐛 Troubleshooting

### Token iOS não funciona

**Verifique:**
- [ ] Token tem exatamente 64 caracteres?
- [ ] Token é hexadecimal (0-9, a-f)?
- [ ] `GoogleService-Info.plist` configurado?
- [ ] APNs configurado no Firebase Console?

### Token Android não funciona

**Verifique:**
- [ ] Token tem 140+ caracteres?
- [ ] `google-services.json` configurado?
- [ ] Token não começa com `ExponentPushToken[`?
- [ ] Firebase configurado no backend?

### Ambos não funcionam

**Verifique:**
- [ ] FIREBASE_SERVICE_ACCOUNT configurado no Heroku?
- [ ] Firebase Admin SDK inicializado?
- [ ] Logs do backend não mostram erros?

---

## 📚 Referências

- [FCM Token Format](https://firebase.google.com/docs/cloud-messaging/android/client#sample-register)
- [APNs Device Tokens](https://developer.apple.com/documentation/usernotifications/registering_your_app_with_apns)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Última atualização:** Janeiro 2025  
**Status:** ✅ Backend corrigido para aceitar tokens iOS (64 chars) e Android (140+ chars)
