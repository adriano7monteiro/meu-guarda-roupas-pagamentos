# 🔧 FIX: Gradle Wrapper JAR Missing

## ❌ Erro:
```
Unable to access jarfile .../gradle/wrapper/gradle-wrapper.jar
error Failed to install the app. Command failed with exit code 1: ./gradlew app:installDebug
```

## ✅ CAUSA:
O arquivo `gradle-wrapper.jar` não foi commitado no Git ou não foi baixado corretamente.

---

## 🚀 SOLUÇÃO RÁPIDA (No Seu Computador):

### Opção 1: Usar npx expo (Recomendado)
```bash
cd frontend

# Expo vai regenerar tudo automaticamente
npx expo prebuild --clean

# Agora build
npx expo run:android
```

### Opção 2: Regenerar Gradle Wrapper Manualmente
```bash
cd frontend

# Executar script
bash scripts/regenerate-gradle-wrapper.sh

# Ou manualmente:
cd android
gradle wrapper --gradle-version=8.10.2 --distribution-type=all
```

### Opção 3: Pull do Git com Gradle Wrapper
```bash
# Pull das mudanças (gradle-wrapper.jar foi adicionado ao commit)
git pull origin main

# Verificar se o arquivo existe
ls -la frontend/android/gradle/wrapper/gradle-wrapper.jar

# Build
cd frontend
npx expo run:android
```

---

## 🔍 VERIFICAÇÕES:

### 1. Verificar se o arquivo existe:
```bash
ls -la frontend/android/gradle/wrapper/
```

**Deve mostrar:**
```
gradle-wrapper.jar
gradle-wrapper.properties
```

### 2. Verificar se não está no .gitignore:
```bash
grep "gradle-wrapper.jar" frontend/android/.gitignore
```

**Não deve aparecer nada** (o arquivo não deve estar ignorado)

### 3. Verificar permissões do gradlew:
```bash
ls -la frontend/android/gradlew
```

**Deve ter permissão de execução** (rwxr-xr-x)

Se não tiver:
```bash
chmod +x frontend/android/gradlew
chmod +x frontend/android/gradlew.bat
```

---

## 🛠️ SE AINDA NÃO FUNCIONAR:

### Erro: "Gradle não está instalado"
```bash
# macOS
brew install gradle

# Linux (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install gradle

# Windows
# Baixe de: https://gradle.org/install/
```

### Erro: "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"
```bash
cd frontend/android

# Deletar wrapper corrupto
rm -rf gradle/wrapper
rm -rf .gradle

# Regenerar
gradle wrapper --gradle-version=8.10.2
```

### Erro: "SDK location not found"
```bash
# Criar local.properties
cd frontend/android

# macOS/Linux
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties

# Ou se o SDK estiver em outro lugar:
echo "sdk.dir=/caminho/para/seu/android/sdk" > local.properties
```

---

## 📦 ARQUIVOS DO GRADLE WRAPPER:

O Gradle Wrapper consiste em:

```
android/
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar       ← Arquivo principal (necessário!)
│       └── gradle-wrapper.properties ← Configuração
├── gradlew                           ← Script Unix/Mac
└── gradlew.bat                       ← Script Windows
```

**IMPORTANTE:** O `gradle-wrapper.jar` é um arquivo binário e **DEVE** estar no Git!

---

## ✅ SOLUÇÃO DEFINITIVA:

### No Servidor (Já Foi Feito):
```bash
# Arquivo foi forçado ao Git
git add -f frontend/android/gradle/wrapper/gradle-wrapper.jar
```

### No Seu Computador:
```bash
# 1. Pull do repositório
git pull origin main

# 2. Verificar arquivo
ls -la frontend/android/gradle/wrapper/gradle-wrapper.jar

# 3. Se existir, build direto
cd frontend
npx expo run:android

# 4. Se não existir, regenerar
cd frontend
npx expo prebuild --clean
npx expo run:android
```

---

## 🎯 ALTERNATIVA: Build via EAS (Sem Problemas)

Se o build local continuar com problemas, use o EAS Build:

```bash
cd frontend

# Build remoto (sem precisar do Gradle local)
eas build --platform android --profile preview

# Baixar APK quando pronto
eas build:download

# Instalar no dispositivo
adb install caminho/do/arquivo.apk
```

O EAS Build não tem esses problemas porque usa um ambiente limpo no servidor! 🚀

---

## 📝 RESUMO:

**Causa:** `gradle-wrapper.jar` faltando
**Solução 1:** `git pull` (arquivo foi adicionado)
**Solução 2:** `npx expo prebuild --clean`
**Solução 3:** `gradle wrapper --gradle-version=8.10.2`
**Alternativa:** `eas build` (build remoto)

---

## 🆘 AINDA COM PROBLEMAS?

Se nenhuma solução funcionar, me envie:

```bash
# Informações do ambiente
echo "Sistema: $(uname -s)"
echo "Gradle instalado: $(which gradle)"
gradle --version
echo "Android SDK: $ANDROID_HOME"
ls -la frontend/android/gradle/wrapper/
```

Com essas informações posso ajudar mais! 🔍
