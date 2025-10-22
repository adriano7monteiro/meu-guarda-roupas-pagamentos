# 📱 Guia: Configurar Push Notifications no iOS

## 📋 Pré-requisitos

### 1. **Conta Apple Developer**
- ✅ Conta Apple Developer ativa ($99/ano)
- ✅ Acesso ao [Apple Developer Portal](https://developer.apple.com)

### 2. **Certificados e Chaves**
- APNs Authentication Key (.p8)
- App Identifier (Bundle ID)
- Provisioning Profile

### 3. **Firebase Configurado**
- Projeto Firebase já existe ✅
- Console Firebase: https://console.firebase.google.com

---

## 🔧 Passo a Passo Completo

### **ETAPA 1: Configuração no Apple Developer Portal**

#### 1.1 - Criar App Identifier

1. Acesse: https://developer.apple.com/account/resources/identifiers
2. Clique em **"+"** para adicionar novo Identifier
3. Selecione **"App IDs"** → Continue
4. Configure:
   - **Description:** Meu Look IA
   - **Bundle ID:** `com.meulookia.app` (ou o bundle ID do seu app)
   - **Capabilities:** 
     - ✅ Push Notifications (marque esta opção)
5. Clique em **Register**

#### 1.2 - Criar APNs Authentication Key

1. Acesse: https://developer.apple.com/account/resources/authkeys
2. Clique em **"+"** para criar nova Key
3. Configure:
   - **Key Name:** Meu Look IA Push Notifications
   - **Services:** ✅ Apple Push Notifications service (APNs)
4. Clique em **Continue** → **Register**
5. **⚠️ IMPORTANTE:** Baixe o arquivo `.p8` imediatamente
   - Você só pode baixar UMA VEZ
   - Arquivo será algo como: `AuthKey_ABC123XYZ.p8`
6. Anote:
   - **Key ID:** (exemplo: `ABC123XYZ`)
   - **Team ID:** Encontre em Account → Membership (exemplo: `XYZ987ABC`)

---

### **ETAPA 2: Configuração no Firebase Console**

#### 2.1 - Adicionar iOS App ao Projeto Firebase

1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto: **meu-look-ia**
3. Clique no ícone ⚙️ (configurações) → **Project Settings**
4. Na aba **General**, role até **Your apps**
5. Clique em **"Add app"** → Selecione **iOS**
6. Configure:
   - **Apple bundle ID:** `com.meulookia.app` (mesmo do App Identifier)
   - **App nickname:** Meu Look IA (opcional)
   - **App Store ID:** (deixe em branco por enquanto)
7. Clique em **Register app**
8. **Baixe o arquivo `GoogleService-Info.plist`**
   - Você precisará deste arquivo no código

#### 2.2 - Configurar APNs no Firebase

1. Ainda em **Project Settings**, vá para a aba **Cloud Messaging**
2. Na seção **Apple app configuration**, clique em **Upload**
3. Configure:
   - **APNs Authentication Key:** Faça upload do arquivo `.p8` (baixado no passo 1.2)
   - **Key ID:** Cole o Key ID (exemplo: `ABC123XYZ`)
   - **Team ID:** Cole o Team ID (exemplo: `XYZ987ABC`)
4. Clique em **Upload**

✅ **Firebase agora pode enviar push notifications para iOS!**

---

### **ETAPA 3: Configuração no Código (Frontend)**

#### 3.1 - Adicionar `GoogleService-Info.plist` ao Projeto

O arquivo `GoogleService-Info.plist` precisa estar disponível durante o build do iOS.

**Opção 1: Via EAS Secret (Recomendado)**

```bash
cd /app/frontend

# Criar secret para iOS (similar ao google-services.json do Android)
eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --type file --value ./GoogleService-Info.plist
```

**Opção 2: Commitar no repositório**
- Adicione o arquivo em `/app/frontend/GoogleService-Info.plist`
- **⚠️ Não recomendado** para repositórios públicos

#### 3.2 - Atualizar `app.config.js`

O código já está parcialmente preparado. Vamos garantir que está correto:

```javascript
// /app/frontend/app.config.js

const fs = require('fs');
const path = require('path');

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

// Criar google-services.json para Android (já configurado)
if (process.env.GOOGLE_SERVICES_JSON) {
  // ... código existente ...
}

// Criar GoogleService-Info.plist para iOS
if (process.env.GOOGLE_SERVICE_INFO_PLIST) {
  const plistPath = path.resolve(__dirname, 'GoogleService-Info.plist');
  try {
    fs.writeFileSync(plistPath, process.env.GOOGLE_SERVICE_INFO_PLIST);
    console.log('✅ GoogleService-Info.plist criado com sucesso via EAS Secret');
  } catch (error) {
    console.error('❌ Erro ao criar GoogleService-Info.plist:', error.message);
    if (process.env.EAS_BUILD) {
      throw new Error('Failed to create GoogleService-Info.plist from EAS Secret');
    }
  }
}

module.exports = {
  expo: {
    name: IS_PREVIEW ? 'Meu Look IA (Preview)' : IS_DEV ? 'Meu Look IA (Dev)' : 'Meu Look IA',
    slug: 'meu-look-ia',
    // ...
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.meulookia.app', // ⚠️ DEVE SER O MESMO do Apple Developer
      buildNumber: '1.0.0',
      googleServicesFile: './GoogleService-Info.plist', // ✅ Configuração Firebase iOS
    },
    plugins: [
      [
        'expo-notifications',
        {
          icon: './notification-icon.png',
          color: '#6c5ce7',
          sounds: ['./notification-sound.wav'],
          // iOS specific
          mode: 'production', // ou 'development' para testes
        }
      ],
    ],
    // ...
  }
};
```

#### 3.3 - Atualizar `eas.json` para iOS

```json
{
  "build": {
    "production": {
      "ios": {
        "buildType": "app-store",
        "distribution": "store"
      },
      "android": {
        "buildType": "aab"
      }
    },
    "production-apk": {
      "android": {
        "buildType": "apk"
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "seu-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XYZ987ABC"
      }
    }
  }
}
```

#### 3.4 - Script de Setup para iOS (Opcional)

Criar `/app/frontend/setup-firebase-ios-secret.sh`:

```bash
#!/bin/bash

echo "🍎 Configurando Firebase GoogleService-Info.plist como EAS Secret"
echo ""

# Verificar se o arquivo existe
if [ ! -f "./GoogleService-Info.plist" ]; then
  echo "❌ Erro: GoogleService-Info.plist não encontrado"
  echo "   Baixe o arquivo do Firebase Console primeiro"
  exit 1
fi

# Verificar EAS CLI
if ! command -v eas &> /dev/null; then
  echo "❌ Erro: EAS CLI não está instalado"
  echo "   Instale com: npm install -g eas-cli"
  exit 1
fi

# Verificar login
if ! eas whoami &> /dev/null; then
  echo "⚠️  Você não está logado no EAS"
  echo "   Execute: eas login"
  exit 1
fi

echo "✅ GoogleService-Info.plist encontrado"
echo "✅ EAS CLI instalado"
echo "✅ Logado no EAS"
echo ""

# Ler o conteúdo do arquivo
PLIST_CONTENT=$(cat ./GoogleService-Info.plist)

echo "📝 Criando secret GOOGLE_SERVICE_INFO_PLIST..."
echo ""

# Criar o secret
eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --value "$PLIST_CONTENT" --force

echo ""
echo "✅ Secret GOOGLE_SERVICE_INFO_PLIST criado com sucesso!"
echo ""
echo "📋 Verificando secrets configurados:"
eas secret:list
echo ""
echo "🚀 Agora você pode executar o build iOS:"
echo "   eas build --platform ios --profile production"
echo ""
```

#### 3.5 - Código de Push Notifications (já implementado)

O código em `/app/frontend/services/pushNotifications.ts` já está preparado para iOS:

```typescript
// Funciona tanto para Android quanto iOS
const token = await Notifications.getDevicePushTokenAsync();

// Token no iOS será diferente do Android
// iOS: Token APNs (string hexadecimal)
// Android: Token FCM (string longa)
```

---

### **ETAPA 4: Build e Teste**

#### 4.1 - Configurar Secrets (se usando)

```bash
cd /app/frontend

# Android (já configurado)
./setup-firebase-secret.sh

# iOS (novo)
./setup-firebase-ios-secret.sh
```

#### 4.2 - Fazer Build iOS

```bash
cd /app/frontend

# Build para App Store
eas build --platform ios --profile production

# Build para desenvolvimento/teste
eas build --platform ios --profile development
```

#### 4.3 - Testar Notificações

**Opção 1: Via App Instalado**
1. Instale o app no iPhone físico
2. Abra o app e faça login
3. Permita notificações quando solicitado
4. Token será registrado automaticamente no backend

**Opção 2: Via Backend Admin**
1. Acesse: `/api/admin_lojinha.html`
2. Vá na aba "Push Notifications"
3. Digite uma mensagem
4. Clique em "Enviar para Todos"
5. Verifique se a notificação chega no iPhone

---

### **ETAPA 5: Backend (já está pronto! ✅)**

O backend já está configurado para enviar notificações tanto para Android quanto iOS:

```python
# /app/backend/server.py

# Firebase Admin SDK funciona para Android E iOS
message = messaging.Message(
    notification=messaging.Notification(
        title=notification.title,
        body=notification.body,
    ),
    token=fcm_token,  # Funciona para ambos
    android=messaging.AndroidConfig(
        priority='high',
        notification=messaging.AndroidNotification(
            sound='default',
            color='#6c5ce7',
            channel_id='default',
        ),
    ),
    apns=messaging.APNSConfig(  # ✅ Configuração específica para iOS
        payload=messaging.APNSPayload(
            aps=messaging.Aps(
                alert=messaging.ApsAlert(
                    title=notification.title,
                    body=notification.body,
                ),
                sound='default',
                badge=1,
            ),
        ),
    ),
)

response = messaging.send(message)
```

**⚠️ Atualização necessária no backend:**

Adicionar configuração APNs ao código de envio de notificações.

---

## 📊 Checklist de Configuração

### Apple Developer Portal:
- [ ] Conta Apple Developer ativa
- [ ] App Identifier criado com Push Notifications habilitado
- [ ] APNs Authentication Key (.p8) baixada
- [ ] Key ID anotado
- [ ] Team ID anotado

### Firebase Console:
- [ ] iOS App adicionado ao projeto Firebase
- [ ] Bundle ID configurado (igual ao App Identifier)
- [ ] GoogleService-Info.plist baixado
- [ ] APNs Authentication Key (.p8) uploaded
- [ ] Key ID e Team ID configurados

### Código (Frontend):
- [ ] GoogleService-Info.plist adicionado ao projeto
- [ ] app.config.js atualizado com configuração iOS
- [ ] eas.json configurado para iOS builds
- [ ] EAS Secret criado (se usando secret approach)
- [ ] Bundle ID no app.config.js igual ao Apple Developer

### Backend:
- [ ] Firebase Admin SDK configurado (já está ✅)
- [ ] Configuração APNs adicionada ao código de envio
- [ ] Variável FIREBASE_SERVICE_ACCOUNT configurada no Heroku

### Build & Deploy:
- [ ] Build iOS executado com sucesso
- [ ] App instalado em iPhone físico
- [ ] Permissões de notificação concedidas
- [ ] Token registrado no backend
- [ ] Notificação de teste enviada e recebida

---

## 🐛 Troubleshooting

### Erro: "APNs device token not set before retrieving FCM Token"

**Causa:** App não tem permissão de notificações ou não está configurado corretamente

**Solução:**
1. Verifique se `GoogleService-Info.plist` está presente
2. Verifique se Bundle ID está correto
3. Solicite permissões explicitamente:
```typescript
const { status } = await Notifications.requestPermissionsAsync();
```

### Erro: "GoogleService-Info.plist not found"

**Causa:** Arquivo não foi incluído no build

**Solução:**
1. Verifique se o arquivo existe em `/app/frontend/GoogleService-Info.plist`
2. Se usando EAS Secret, verifique se foi criado: `eas secret:list`
3. Refaça o build

### Notificações não chegam no iOS

**Causas possíveis:**
1. APNs não configurado no Firebase
2. Bundle ID incorreto
3. App não está em produção (desenvolvimento usa APNs sandbox)
4. Token não foi registrado no backend

**Solução:**
1. Verifique configuração APNs no Firebase Console
2. Confira Bundle ID em todos os lugares
3. Use profile de produção: `eas build --platform ios --profile production`
4. Verifique logs do backend para confirmar registro do token

---

## 📚 Recursos Adicionais

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging - iOS](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Apple Developer - Certificates](https://developer.apple.com/account/resources/certificates)
- [EAS Build - iOS](https://docs.expo.dev/build/setup/#ios)

---

## 💡 Dicas Importantes

1. **Bundle ID:** Deve ser consistente em TODOS os lugares:
   - Apple Developer Portal
   - Firebase Console
   - app.config.js

2. **Certificados:** Sempre use APNs Authentication Key (.p8), não certificados (.p12)

3. **Ambiente:** 
   - Desenvolvimento: APNs Sandbox
   - Produção: APNs Production
   - Use `mode: 'production'` em `expo-notifications` plugin

4. **Testes:** Sempre teste em dispositivo físico, simulador iOS não recebe push notifications

5. **Permissões:** Sempre solicite permissões ANTES de tentar obter o token

---

**Próximo passo:** Implementar as atualizações necessárias no backend e testar!
