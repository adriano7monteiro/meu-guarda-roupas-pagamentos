# 🔧 FIX: Erro libreact_featureflagsjni.so - Build Local Android

## ❌ Erro Original:
```
com.facebook.soloader.SoLoaderDSONotFoundError: couldn't find DSO to load: libreact_featureflagsjni.so
```

## ✅ CAUSA:
O Hermes estava **desabilitado** no build.gradle, mas o React Native 0.79+ requer Hermes para funcionar corretamente com as bibliotecas nativas.

## 🔧 CORREÇÕES APLICADAS:

### 1. **`android/app/build.gradle`** (Linha 8-11)
**ANTES:**
```gradle
project.ext.react = [
    enableHermes: false,     // desabilita Hermes
    newArchEnabled: false,
]
```

**DEPOIS:**
```gradle
project.ext.react = [
    enableHermes: true,      // habilita Hermes (necessário para RN 0.79+)
    newArchEnabled: false,
]
```

### 2. **`app.json`**
**ADICIONADO:**
```json
{
  "expo": {
    "jsEngine": "hermes",
    "newArchEnabled": false,
    "android": {
      "jsEngine": "hermes"
    },
    "ios": {
      "jsEngine": "hermes"
    }
  }
}
```

---

## 🚀 COMANDOS PARA REBUILD (No Seu Computador):

### Opção 1: Build de Desenvolvimento (Mais Rápido)
```bash
cd frontend

# 1. Limpar cache e build anterior
cd android
./gradlew clean
cd ..

# 2. Remover pasta de build
rm -rf android/app/build

# 3. Build e instalar
npx expo run:android
```

### Opção 2: Build de Release (APK Final)
```bash
cd frontend

# 1. Limpar tudo
cd android
./gradlew clean
cd ..

# 2. Build release
cd android
./gradlew assembleRelease

# 3. APK estará em:
# android/app/build/outputs/apk/release/app-release.apk

# 4. Instalar no dispositivo
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Opção 3: Build AAB (Para Play Store)
```bash
cd frontend/android
./gradlew clean
./gradlew bundleRelease

# AAB estará em:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🔍 VERIFICAÇÕES IMPORTANTES:

### 1. Verificar se Hermes está habilitado:
```bash
# Ver configuração no build.gradle
grep -A 3 "project.ext.react" frontend/android/app/build.gradle

# Deve mostrar:
# enableHermes: true
```

### 2. Verificar app.json:
```bash
grep "jsEngine" frontend/app.json

# Deve mostrar:
# "jsEngine": "hermes"
```

### 3. Verificar versão do Gradle:
```bash
cd frontend/android
./gradlew --version
```

---

## 🆘 SE AINDA DER ERRO:

### Erro 1: "Could not find Hermes"
```bash
# Instalar Hermes explicitamente
cd frontend
yarn add hermes-engine
```

### Erro 2: Build falha no Gradle
```bash
# Limpar TUDO e reconstruir
cd frontend/android
./gradlew clean --no-daemon
rm -rf .gradle
rm -rf app/build
cd ..
rm -rf node_modules
yarn install
npx expo prebuild --clean
npx expo run:android
```

### Erro 3: "SDK location not found"
```bash
# Configurar ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Ou criar local.properties:
echo "sdk.dir=/Users/SEU_USUARIO/Library/Android/sdk" > android/local.properties
# Linux: /home/SEU_USUARIO/Android/Sdk
# Windows: C:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
```

---

## 📊 COMPARAÇÃO: JSC vs Hermes

| Feature | JSC | Hermes | Recomendado |
|---------|-----|--------|-------------|
| **Tamanho APK** | ~8MB | ~2MB | ✅ Hermes |
| **Tempo de Inicialização** | Lento | Rápido | ✅ Hermes |
| **Uso de Memória** | Alto | Baixo | ✅ Hermes |
| **React Native 0.79+** | ❌ Problemas | ✅ Suportado | ✅ Hermes |
| **Libraries Nativas** | ❌ Incompatível | ✅ Compatível | ✅ Hermes |

---

## ✅ CHECKLIST FINAL:

Antes de fazer o build:

- [ ] `android/app/build.gradle` → `enableHermes: true`
- [ ] `app.json` → `"jsEngine": "hermes"`
- [ ] `app.json` → `"newArchEnabled": false`
- [ ] Cache limpo: `./gradlew clean`
- [ ] node_modules atualizado: `yarn install`
- [ ] ANDROID_HOME configurado

---

## 🎯 RESULTADO ESPERADO:

Após aplicar as correções e rebuild:
- ✅ App inicializa sem crash
- ✅ Todas as bibliotecas nativas carregam corretamente
- ✅ Performance melhorada
- ✅ APK ~30% menor

---

## 📱 TESTANDO O APP:

```bash
# Ver logs em tempo real
adb logcat *:E

# Filtrar apenas erros do seu app
adb logcat | grep "com.zenebathos.meulookia"

# Instalar e abrir automaticamente
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.zenebathos.meulookia/.MainActivity
```

---

## 🚀 PRÓXIMOS PASSOS:

Depois que o build local funcionar:

1. **Commitar as mudanças:**
```bash
git add frontend/android/app/build.gradle
git add frontend/app.json
git commit -m "fix: Enable Hermes for Android build"
git push
```

2. **Build no EAS também funcionará:**
```bash
eas build --platform android --profile production
```

Agora o build local deve funcionar! 🎉
