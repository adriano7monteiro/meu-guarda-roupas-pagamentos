# 🔍 Verificação: Firebase iOS APNs

## ❌ Erro Comum

```
ERROR: Invalid FCM token: d44e4fa5ad94...
ERROR: Este token não é um token FCM válido
```

**Causa:** Token iOS está sendo gerado, mas **APNs não está configurado no Firebase Console**.

---

## ✅ Checklist de Configuração iOS

### 1. Token iOS Está Sendo Gerado?

**Indicadores:**
- Token tem exatamente 64 caracteres
- Token é hexadecimal (0-9, a-f)
- Exemplo: `d44e4fa5ad94d1216e7846e096a7ee3c8f2b1d5a9c7e6f4b3a2d1e0f9c8b7a6d`

**Como verificar:**
```javascript
// MongoDB
db.push_tokens.find({ $expr: { $eq: [{ $strLenCP: "$token" }, 64] } })
```

Se aparecer tokens de 64 caracteres → **iOS está gerando tokens ✅**

---

### 2. GoogleService-Info.plist Configurado no App?

**Verificar:**
- [ ] Arquivo `GoogleService-Info.plist` existe no projeto
- [ ] Bundle ID no plist corresponde ao App Identifier da Apple
- [ ] `app.config.js` tem: `googleServicesFile: './GoogleService-Info.plist'`
- [ ] Build foi feito APÓS adicionar o arquivo

**Como confirmar:**
- Se token iOS está no banco → arquivo estava configurado no build ✅

---

### 3. ⚠️ APNs Configurado no Firebase Console? (CRÍTICO)

Esta é provavelmente a **causa do erro**!

#### Passo a Passo:

1. **Acesse Firebase Console:**
   ```
   https://console.firebase.google.com
   ```

2. **Selecione seu projeto:** `meu-look-ia`

3. **Vá em Project Settings:**
   - Clique no ícone ⚙️ (engrenagem)
   - Selecione "Project Settings"

4. **Vá na aba "Cloud Messaging":**
   - Clique na aba "Cloud Messaging"
   - Role para baixo até "Apple app configuration"

5. **Verifique se APNs está configurado:**

   **❌ Se aparecer:**
   ```
   ┌─────────────────────────────────────┐
   │ APNs Authentication Key             │
   │                                     │
   │ No key uploaded                     │
   │ [ Upload ]                          │
   └─────────────────────────────────────┘
   ```
   
   **→ APNs NÃO ESTÁ CONFIGURADO! Este é o problema!**

   **✅ Se aparecer:**
   ```
   ┌─────────────────────────────────────┐
   │ APNs Authentication Key             │
   │                                     │
   │ Key ID: ABC123XYZ                   │
   │ Team ID: XYZ987ABC                  │
   │ [ Remove ]                          │
   └─────────────────────────────────────┘
   ```
   
   **→ APNs ESTÁ CONFIGURADO ✅**

---

## 🔧 Como Configurar APNs (Se Não Estiver)

### Passo 1: Obter APNs Authentication Key da Apple

1. **Acesse Apple Developer:**
   ```
   https://developer.apple.com/account/resources/authkeys
   ```

2. **Login** com sua conta Apple Developer

3. **Clique em "+"** para criar nova Key

4. **Configure:**
   - Key Name: `Meu Look IA Push Notifications`
   - Services: ✅ Apple Push Notifications service (APNs)

5. **Register** → **Download** (arquivo `.p8`)

   ⚠️ **IMPORTANTE:** Você só pode baixar UMA VEZ!
   
   Arquivo será: `AuthKey_ABC123XYZ.p8`

6. **Anote:**
   - **Key ID:** `ABC123XYZ` (aparece no nome do arquivo)
   - **Team ID:** Aparece em Account → Membership (exemplo: `XYZ987ABC`)

---

### Passo 2: Configurar no Firebase Console

1. **Volte ao Firebase Console:**
   ```
   https://console.firebase.google.com
   ```

2. **Project Settings → Cloud Messaging → Apple app configuration**

3. **Clique em "Upload" na seção APNs Authentication Key**

4. **Configure:**
   - **APNs Authentication Key:** Faça upload do arquivo `.p8` baixado
   - **Key ID:** Cole o Key ID (exemplo: `ABC123XYZ`)
   - **Team ID:** Cole o Team ID (exemplo: `XYZ987ABC`)

5. **Clique em "Upload"**

6. **✅ Verifique** se agora mostra:
   ```
   Key ID: ABC123XYZ
   Team ID: XYZ987ABC
   ```

---

## 🧪 Testar Após Configurar APNs

### 1. Não precisa fazer novo build!

O token já está correto. Apenas o Firebase backend precisa da configuração APNs.

### 2. Tentar enviar push novamente:

1. Acesse: `/api/admin_lojinha.html`
2. Aba "Push Notifications"
3. Digite mensagem
4. Enviar

**Logs esperados (SUCESSO):**
```
📤 Tentando enviar para token iOS APNs: d44e4fa5ad94... (length: 64)
✅ Push sent successfully. Message ID: projects/meu-look-ia/messages/...
```

**Se ainda der erro:**
```
❌ Token iOS APNs detectado mas Firebase APNs não está configurado!
⚠️  SOLUÇÃO: Configurar APNs no Firebase Console
```

→ Volte ao Firebase Console e verifique se o upload foi bem-sucedido.

---

## 📊 Diferença: Configurado vs Não Configurado

### ❌ Sem APNs Configurado:
```
Token iOS gerado → Registrado no banco → Envio FALHA
```
**Erro:**
```
InvalidArgumentError: The registration token is not a valid FCM registration token
```

### ✅ Com APNs Configurado:
```
Token iOS gerado → Registrado no banco → Envio SUCESSO
```
**Log:**
```
✅ Push sent successfully. Message ID: projects/...
```

---

## 🐛 Troubleshooting

### Erro persiste após configurar APNs

**Verifique:**
- [ ] Bundle ID no `GoogleService-Info.plist` corresponde ao Bundle ID do App Identifier da Apple?
- [ ] Team ID e Key ID estão corretos no Firebase?
- [ ] Arquivo `.p8` é o correto (APNs, não outro tipo)?
- [ ] App Identifier na Apple tem Push Notifications habilitado?

### Como confirmar que está tudo certo:

1. **Firebase Console mostra Key ID e Team ID** ✅
2. **Logs do backend mostram "iOS APNs" no tipo do token** ✅
3. **Push é enviado com sucesso** ✅
4. **Notificação chega no iPhone** ✅

---

## 📱 Configuração Completa iOS

Para iOS funcionar 100%, você precisa:

1. **No Apple Developer:**
   - [x] App Identifier criado
   - [x] Push Notifications habilitado
   - [x] APNs Authentication Key (.p8) gerada

2. **No Firebase Console:**
   - [x] iOS App adicionado ao projeto
   - [x] Bundle ID configurado
   - [x] **APNs Authentication Key uploaded** ⭐ (CRÍTICO)
   - [x] Key ID e Team ID configurados

3. **No Código (App):**
   - [x] `GoogleService-Info.plist` no projeto
   - [x] `app.config.js` configurado
   - [x] Build feito com o arquivo

4. **No Backend:**
   - [x] Firebase Admin SDK configurado
   - [x] `FIREBASE_SERVICE_ACCOUNT` no Heroku
   - [x] Código com suporte APNs

---

## 💡 Resumo

**Se você vê tokens iOS (64 chars) no banco:**
→ App está configurado corretamente ✅

**Se push falha com "Invalid token":**
→ APNs não está configurado no Firebase Console ❌

**Solução:**
1. Gerar APNs Authentication Key na Apple
2. Upload no Firebase Console
3. Testar novamente (não precisa novo build)

---

## 📚 Recursos

- [Apple Developer - Keys](https://developer.apple.com/account/resources/authkeys)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase APNs Setup](https://firebase.google.com/docs/cloud-messaging/ios/certs)
- [Guia Completo iOS](GUIA_PUSH_NOTIFICATIONS_IOS.md)

---

**Próximo passo:** Verificar se APNs está configurado no Firebase Console (Etapa 3 acima)
