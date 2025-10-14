# 🔥 SOLUÇÃO DEFINITIVA: Limpar e Recompilar Completamente

## ❌ O Problema:
Você está usando um APK compilado ANTES das correções (Hermes desabilitado).

## ✅ SOLUÇÃO: Rebuild Completo

Execute estes comandos **NO SEU COMPUTADOR** (não no servidor):

### Passo 1: Pull das Mudanças
```bash
cd /caminho/do/projeto
git pull origin main
```

### Passo 2: Verificar Correções
```bash
# Verificar se Hermes está habilitado
grep "enableHermes" frontend/android/app/build.gradle
# Deve mostrar: enableHermes: true

# Verificar app.json
grep "jsEngine" frontend/app.json
# Deve mostrar: "jsEngine": "hermes"
```

### Passo 3: Limpar TUDO
```bash
cd frontend

# Limpar cache do Yarn
yarn cache clean

# Limpar node_modules
rm -rf node_modules
rm -rf yarn.lock

# Limpar build Android
cd android
./gradlew clean
rm -rf .gradle
rm -rf app/build
cd ..

# Limpar cache do Metro
rm -rf .metro-cache
rm -rf /tmp/metro-*
```

### Passo 4: Reinstalar Dependências
```bash
cd frontend
yarn install
```

### Passo 5: Rebuild com Expo (RECOMENDADO)
```bash
cd frontend

# Opção A: Prebuild + Run (Melhor)
npx expo prebuild --clean
npx expo run:android

# OU Opção B: Apenas Run (Expo faz prebuild automático)
npx expo run:android
```

### Passo 6: OU Build Manual Gradle
```bash
cd frontend/android

# Build APK de debug
./gradlew assembleDebug

# Instalar no dispositivo
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 🆘 SE AINDA DER ERRO

### Solução 1: Desinstalar App Antigo
```bash
# Desinstalar versão antiga
adb uninstall com.zenebathos.meulookia

# Reinstalar
cd frontend
npx expo run:android
```

### Solução 2: Verificar se Hermes foi habilitado
```bash
# Ver build.gradle
cat frontend/android/app/build.gradle | grep -A 3 "project.ext.react"

# Deve mostrar:
# project.ext.react = [
#     enableHermes: true,      // habilita Hermes
#     newArchEnabled: false,
# ]
```

Se mostrar `enableHermes: false`, edite manualmente:
```bash
# Abrir no editor
nano frontend/android/app/build.gradle

# Ou vim
vim frontend/android/app/build.gradle

# Mudar linha ~10 de false para true:
enableHermes: true,
```

### Solução 3: Build via EAS (Sempre Funciona)
```bash
cd frontend

# Build remoto (mais confiável)
eas build --platform android --profile preview --clear-cache

# Aguardar ~15-20 minutos
# Baixar APK quando pronto
# Instalar no celular
```

---

## 🎯 VERIFICAÇÃO FINAL

Depois do build, antes de instalar, verifique:

```bash
# Ver tamanho do APK
ls -lh frontend/android/app/build/outputs/apk/debug/app-debug.apk

# Deve ter ~40-50MB (com Hermes)
# Se tiver ~60-70MB, está sem Hermes (errado)
```

---

## 💡 DICA PRO

Use sempre o **Expo CLI** para builds locais:

```bash
# Melhor forma (Expo gerencia tudo)
npx expo run:android

# Expo vai:
# 1. Fazer prebuild se necessário
# 2. Compilar com Gradle
# 3. Instalar no dispositivo
# 4. Abrir o app automaticamente
```

---

## 📱 COMANDOS ÚTEIS

```bash
# Ver dispositivos conectados
adb devices

# Ver logs em tempo real
adb logcat | grep "com.zenebathos.meulookia"

# Limpar dados do app
adb shell pm clear com.zenebathos.meulookia

# Desinstalar app
adb uninstall com.zenebathos.meulookia
```

---

## ✅ CHECKLIST FINAL

Antes de fazer build:
- [ ] `git pull origin main` executado
- [ ] `enableHermes: true` em build.gradle
- [ ] `"jsEngine": "hermes"` em app.json
- [ ] `./gradlew clean` executado
- [ ] `node_modules` removido e reinstalado
- [ ] App antigo desinstalado do celular
- [ ] `npx expo run:android` executado

---

## 🚀 RESUMO RÁPIDO

```bash
# Execute isso (tudo de uma vez):
cd frontend
git pull origin main
yarn cache clean
rm -rf node_modules yarn.lock
cd android && ./gradlew clean && cd ..
yarn install
adb uninstall com.zenebathos.meulookia
npx expo run:android
```

Isso vai limpar tudo e recompilar do zero com as configurações corretas! 🎉
