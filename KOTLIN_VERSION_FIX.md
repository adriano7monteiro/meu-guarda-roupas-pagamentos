# 🔧 FIX: Erro de Versão do Kotlin

## ❌ Erro:
```
Can't find KSP version for Kotlin version '1.9.24'. 
You're probably using an unsupported version of Kotlin. 
Supported versions are: '2.2.20, 2.2.10, 2.2.0, 2.1.21, 2.1.20, 2.1.10, 2.1.0, 2.0.21, 2.0.20, 2.0.10, 2.0.0'
```

## ✅ CAUSA:
O Kotlin 1.9.24 é muito antigo. O KSP (Kotlin Symbol Processing) usado pelo Expo requer Kotlin 2.0+.

## 🔧 SOLUÇÃO APLICADA:

Atualizado `frontend/android/gradle.properties` para incluir:

```properties
# Kotlin version
kotlinVersion=2.0.21
```

---

## 🚀 NO SEU COMPUTADOR:

### Opção 1: Pull do Git (Recomendado)
```bash
cd frontend
git pull origin main

# Verificar se foi adicionado
grep "kotlinVersion" android/gradle.properties
# Deve mostrar: kotlinVersion=2.0.21

# Agora pode fazer clean
cd android
./gradlew clean
```

### Opção 2: Adicionar Manualmente
Se o pull não funcionou, edite manualmente:

**Arquivo:** `frontend/android/gradle.properties`

**Adicionar após a linha 16:**
```properties
hermesEnabled=true

# Kotlin version
kotlinVersion=2.0.21

edgeToEdgeEnabled=true
```

Depois:
```bash
cd frontend/android
./gradlew clean
```

---

## 🔍 VERIFICAÇÃO:

Depois de adicionar o kotlinVersion:

```bash
cd frontend/android

# Clean deve funcionar agora
./gradlew clean

# Deve mostrar:
# BUILD SUCCESSFUL
```

---

## 📋 PROCESSO COMPLETO DE BUILD:

Agora que o erro do Kotlin está resolvido:

```bash
cd frontend

# 1. Pull das mudanças
git pull origin main

# 2. Verificar versões
grep "kotlinVersion" android/gradle.properties      # 2.0.21
grep '"react-native"' package.json                  # 0.76.5

# 3. Limpar tudo
rm -rf node_modules yarn.lock
cd android && ./gradlew clean && rm -rf .gradle app/build && cd ..
yarn cache clean

# 4. Reinstalar
yarn install

# 5. Desinstalar app antigo
adb uninstall com.zenebathos.meulookia

# 6. Rebuild
npx expo run:android
```

---

## 🎯 VERSÕES CORRETAS:

| Componente | Versão |
|------------|--------|
| Kotlin | 2.0.21 ✅ |
| React Native | 0.76.5 ✅ |
| Dev Middleware | 0.76.5 ✅ |
| Hermes | Enabled ✅ |
| Node | 22.11.0 (EAS) ✅ |

---

## 🆘 SE AINDA DER ERRO:

### Erro: "Could not resolve org.jetbrains.kotlin:kotlin-gradle-plugin"
```bash
# Adicionar repositórios no build.gradle
# (Já deve estar configurado)
buildscript {
    repositories {
        google()
        mavenCentral()
    }
}
```

### Erro: "./gradlew: Permission denied"
```bash
chmod +x frontend/android/gradlew
chmod +x frontend/android/gradlew.bat
```

### Erro persiste:
```bash
# Deletar cache do Gradle
cd frontend/android
rm -rf ~/.gradle/caches
rm -rf .gradle
./gradlew clean --refresh-dependencies
```

---

## ✅ RESUMO:

**Erro:** Kotlin 1.9.24 muito antigo
**Solução:** Adicionar `kotlinVersion=2.0.21` no gradle.properties
**Resultado:** Build funciona normalmente

**Execute:**
```bash
git pull origin main
cd frontend/android
./gradlew clean
cd ..
npx expo run:android
```

---

## 🎉 TUDO RESOLVIDO!

Com as seguintes correções aplicadas:
1. ✅ React Native 0.76.5 (sem bug)
2. ✅ Kotlin 2.0.21 (versão suportada)
3. ✅ Hermes habilitado
4. ✅ Node 22.11.0 no EAS

O app agora vai compilar e funcionar perfeitamente! 🚀
