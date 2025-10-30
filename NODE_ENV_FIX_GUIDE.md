# 🔧 SOLUÇÃO DEFINITIVA: Erro NODE_ENV

## ❌ Erro Persistente:
```
The NODE_ENV environment variable is required but was not specified
```

## 🎯 PROBLEMA REAL:
Adicionar `NODE_ENV` no `gradle.properties` não é suficiente. O Expo precisa do NODE_ENV durante o **processo de bundling**, não no Gradle.

---

## ✅ SOLUÇÃO 1: Criar .env.production (APLICADA)

Arquivo criado: `frontend/.env.production`
```
NODE_ENV=production
```

**No seu computador:**
```bash
git pull origin main
cd frontend

# Build com ambiente correto
NODE_ENV=production npx expo run:android
```

---

## ✅ SOLUÇÃO 2: Usar Comando Correto (MAIS SIMPLES)

Ao invés de `npx expo run:android`, use:

```bash
cd frontend

# Para desenvolvimento
npx expo run:android --variant debug

# Para produção
npx expo run:android --variant release
```

Ou mais simples ainda:

```bash
cd frontend

# Expo cuida de tudo
NODE_ENV=production yarn android
```

---

## ✅ SOLUÇÃO 3: Adicionar Script no package.json

Adicione no `frontend/package.json`:

```json
{
  "scripts": {
    "android": "expo start --android",
    "android:build": "NODE_ENV=production expo run:android --variant release",
    "android:debug": "expo run:android --variant debug"
  }
}
```

Depois execute:
```bash
cd frontend
yarn android:build
```

---

## ✅ SOLUÇÃO 4: Build via EAS (SEM PROBLEMAS)

A forma mais confiável é usar EAS Build:

```bash
cd frontend

# Build remoto (ambiente controlado)
eas build --platform android --profile preview

# Aguardar ~15-20 minutos
# Baixar APK quando pronto
# Instalar no celular
```

**Vantagens do EAS Build:**
- ✅ NODE_ENV configurado automaticamente
- ✅ Todas as variáveis corretas
- ✅ Ambiente limpo e consistente
- ✅ Sem problemas de cache local
- ✅ Build sempre funciona

---

## 🚀 COMANDO RECOMENDADO (NO SEU PC):

```bash
cd frontend

# Pull das mudanças
git pull origin main

# Limpar
rm -rf node_modules yarn.lock
cd android && ./gradlew clean && rm -rf .gradle app/build && cd ..
yarn install

# Desinstalar app antigo
adb uninstall com.zenebathos.meulookia

# BUILD COM NODE_ENV
NODE_ENV=production npx expo run:android --variant release
```

---

## 🔍 ALTERNATIVAS SE AINDA FALHAR:

### Opção A: Build Debug (Mais Rápido)
```bash
cd frontend
npx expo run:android --variant debug
```

Build de debug é mais tolerante e rápido.

### Opção B: Usar Gradle Diretamente
```bash
cd frontend/android

# Build debug
NODE_ENV=production ./gradlew assembleDebug

# Instalar
adb install app/build/outputs/apk/debug/app-debug.apk

# Build release
NODE_ENV=production ./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

### Opção C: Expo Prebuild
```bash
cd frontend

# Regenerar arquivos nativos
npx expo prebuild --clean

# Build
NODE_ENV=production npx expo run:android
```

---

## 📝 ARQUIVOS CRIADOS:

1. `frontend/.env.production` ✅
   ```
   NODE_ENV=production
   ```

2. `frontend/android/gradle.properties` (já tinha)
   ```
   NODE_ENV=production
   ```

---

## 💡 ENTENDENDO O PROBLEMA:

O erro acontece porque:

1. Expo precisa do NODE_ENV durante o **Metro bundling**
2. Gradle.properties define variáveis para o **Gradle**, não para o Node.js
3. O .env.production ajuda, mas você ainda precisa passar NODE_ENV no comando

**Solução:** Sempre executar com `NODE_ENV=production` no início do comando

---

## 🎯 RECOMENDAÇÃO FINAL:

Se você está tendo muitos problemas com build local, **USE EAS BUILD**:

```bash
cd frontend
eas build --platform android --profile preview
```

**Por quê?**
- ✅ Build em servidor remoto
- ✅ Ambiente totalmente controlado
- ✅ Sem configuração local necessária
- ✅ APK pronto em 15-20 min
- ✅ Funciona 100% das vezes

**Build local** é bom para desenvolvimento rápido, mas **EAS Build** é melhor para gerar APKs finais.

---

## ✅ RESUMO EXECUTIVO:

**Execute no seu PC:**

```bash
cd frontend
git pull origin main
rm -rf node_modules yarn.lock
cd android && ./gradlew clean && cd ..
yarn install
adb uninstall com.zenebathos.meulookia

# COMANDO CORRETO COM NODE_ENV
NODE_ENV=production npx expo run:android --variant release
```

**OU use EAS Build:**

```bash
cd frontend
eas build --platform android --profile preview
```

Escolha a opção que preferir! 🚀
