# 🔍 NODE_ENV: Expo vs React Native CLI

## ❓ Pergunta:
"Se eu rodar via `npx react-native run-android`, preciso passar a env?"

## ✅ Resposta: SIM!

O problema do NODE_ENV não é específico do **Expo**, é do **Metro Bundler** que ambos usam.

---

## 📋 COMANDOS CORRETOS:

### Opção 1: React Native CLI
```bash
cd frontend

# Com NODE_ENV
NODE_ENV=production npx react-native run-android

# Ou para debug
NODE_ENV=development npx react-native run-android
```

### Opção 2: Expo CLI
```bash
cd frontend

# Com NODE_ENV
NODE_ENV=production npx expo run:android

# Ou para debug
npx expo run:android --variant debug
```

### Opção 3: Gradle Direto
```bash
cd frontend/android

# Build com NODE_ENV
NODE_ENV=production ./gradlew assembleRelease

# Instalar
adb install app/build/outputs/apk/release/app-release.apk
```

---

## 💡 POR QUE PRECISA?

Quando você executa qualquer comando de build:
1. **Metro Bundler** inicia para fazer o bundle do JavaScript
2. Metro lê arquivos `.env` baseado no `NODE_ENV`
3. Se `NODE_ENV` não está definido, Metro não sabe qual `.env` usar
4. Resultado: Erro "NODE_ENV is required"

**Não importa o comando**, Metro sempre precisa do NODE_ENV!

---

## 🎯 MELHOR PRÁTICA:

### Para Desenvolvimento (testing rápido):
```bash
# Mais rápido, sem otimizações
npx react-native run-android
# ou
npx expo run:android --variant debug
```

NODE_ENV não é crítico em debug mode.

### Para Produção (APK final):
```bash
# Com otimizações
NODE_ENV=production npx react-native run-android --variant=release
# ou
NODE_ENV=production npx expo run:android --variant release
```

NODE_ENV é **obrigatório** em release mode.

---

## 🔧 ALTERNATIVAS SEM NODE_ENV NO COMANDO:

### 1. Adicionar no package.json:
```json
{
  "scripts": {
    "android": "NODE_ENV=development react-native run-android",
    "android:release": "NODE_ENV=production react-native run-android --variant=release",
    "android:expo": "NODE_ENV=production expo run:android --variant release"
  }
}
```

Depois execute:
```bash
yarn android:release
```

### 2. Usar arquivo .env.production (já criado):
O arquivo `.env.production` ajuda, mas você ainda precisa dizer ao Metro para usá-lo:
```bash
NODE_ENV=production npx react-native run-android
```

### 3. Usar EAS Build (sem NODE_ENV):
```bash
cd frontend
eas build --platform android --profile preview
```

EAS configura tudo automaticamente! 🎉

---

## 📊 COMPARAÇÃO DOS COMANDOS:

| Comando | Precisa NODE_ENV? | Velocidade | Recomendado Para |
|---------|-------------------|------------|------------------|
| `react-native run-android` | ✅ SIM (em release) | Rápido | Desenvolvimento |
| `expo run:android` | ✅ SIM (em release) | Rápido | Desenvolvimento |
| `./gradlew assembleRelease` | ✅ SIM | Médio | Build manual |
| `eas build` | ❌ NÃO (auto) | Lento | Produção final |

---

## ✅ RESUMO:

**Pergunta:** Preciso passar NODE_ENV com `react-native run-android`?
**Resposta:** **SIM!** Para release/production builds.

**Comando correto:**
```bash
NODE_ENV=production npx react-native run-android --variant=release
```

**Alternativa sem complicação:**
```bash
eas build --platform android --profile preview
```

EAS Build é mais simples porque gerencia tudo para você! 🚀
