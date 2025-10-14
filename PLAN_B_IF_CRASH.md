# 🆘 PLANO B: Se o Crash Persistir com RN 0.79.5

## 🎯 Alternativas Viáveis (em ordem de simplicidade)

---

## ✅ OPÇÃO 1: Atualizar para Expo SDK 52 + RN 0.81 (MAIS RECOMENDADA)

Se o problema é incompatibilidade de versões, **atualizar TUDO** pode resolver:

### Passos:

```bash
cd frontend

# 1. Atualizar Expo CLI
npm install -g expo-cli@latest

# 2. Atualizar SDK do projeto
npx expo install --fix

# 3. Atualizar para Expo SDK 52
npx expo install expo@latest

# 4. Atualizar React Native para versão compatível
npx expo install react-native@0.81.4

# 5. Atualizar TODAS as dependências Expo
npx expo install --fix

# 6. Limpar e rebuild
rm -rf node_modules yarn.lock
yarn install
```

**Vantagens:**
- ✅ Versões mais recentes e estáveis
- ✅ Bugs conhecidos já corrigidos
- ✅ Melhor suporte do Expo
- ✅ Todas as APIs compatíveis

**Desvantagens:**
- ⚠️ Pode quebrar algum código existente (raro)
- ⚠️ Precisa testar todas as funcionalidades

---

## ✅ OPÇÃO 2: Criar Projeto Novo e Migrar (MAIS SEGURA)

Começar do zero com Expo SDK mais recente e migrar o código:

### Passos:

```bash
# 1. Criar projeto novo com SDK mais recente
npx create-expo-app@latest meu-look-novo --template blank-typescript

cd meu-look-novo

# 2. Instalar dependências do projeto antigo
yarn add @stripe/stripe-react-native axios zustand react-hook-form
yarn add @react-navigation/bottom-tabs @react-navigation/native
yarn add expo-image-picker expo-location expo-sharing expo-haptics

# 3. Copiar código do projeto antigo:
# - Copiar /app/* (telas)
# - Copiar /components/*
# - Copiar /utils/*
# - Copiar /hooks/*
# - Copiar app.json (configurações)

# 4. Build EAS
eas build --platform android --profile preview
```

**Vantagens:**
- ✅ Começa limpo, sem problemas de versão
- ✅ SDK mais recente
- ✅ Configuração correta desde o início
- ✅ Praticamente garantido que funciona

**Desvantagens:**
- ⚠️ Trabalho manual de copiar código
- ⚠️ Leva 1-2 horas

---

## ✅ OPÇÃO 3: Usar Patch-Package para Corrigir Bugs

Se o problema for específico do `expo-modules-core`, podemos patchear:

### Passos:

```bash
cd frontend

# 1. Instalar patch-package
yarn add -D patch-package postinstall-postinstall

# 2. Adicionar no package.json
"scripts": {
  "postinstall": "patch-package"
}

# 3. Editar o arquivo problemático manualmente
# Editar: node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/decorators/CSSProps.kt

# 4. Criar patch
npx patch-package expo-modules-core

# 5. Commit o patch
git add patches/
```

**Vantagens:**
- ✅ Corrige bug específico
- ✅ Não muda outras coisas
- ✅ Patch aplicado automaticamente em novos installs

**Desvantagens:**
- ⚠️ Precisa conhecer o código Kotlin
- ⚠️ Pode quebrar em updates futuros

---

## ✅ OPÇÃO 4: Migrar para React Native CLI (Sem Expo)

Se Expo está causando problemas, migrar para RN puro:

### Passos:

```bash
# 1. Criar projeto React Native puro
npx react-native init MeuLookIA --version 0.76.5

# 2. Ejetar de Expo (não recomendado)
# OU copiar código manualmente

# 3. Configurar manualmente:
# - React Navigation
# - Stripe
# - Câmera/Image Picker (react-native-image-picker)
# - Permissões (react-native-permissions)
```

**Vantagens:**
- ✅ Controle total
- ✅ Sem limitações do Expo
- ✅ Acesso direto ao código nativo

**Desvantagens:**
- ❌ MUITO trabalho
- ❌ Precisa conhecer Android/iOS nativo
- ❌ Perde facilidades do Expo
- ❌ **NÃO RECOMENDADO** a menos que seja última opção

---

## ✅ OPÇÃO 5: Desabilitar Completamente New Architecture

Forçar modo legado (Old Architecture):

### Passos:

**1. app.json:**
```json
{
  "expo": {
    "newArchEnabled": false,
    "jsEngine": "jsc"  // ← Trocar para JSC ao invés de Hermes
  }
}
```

**2. android/gradle.properties:**
```properties
newArchEnabled=false
hermesEnabled=false
```

**3. android/app/build.gradle:**
```gradle
project.ext.react = [
    enableHermes: false,
    newArchEnabled: false
]
```

**Vantagens:**
- ✅ Usa código mais antigo e testado
- ✅ Menos bugs

**Desvantagens:**
- ⚠️ Performance pior (sem Hermes)
- ⚠️ Tamanho de APK maior

---

## ✅ OPÇÃO 6: Usar Expo Go (Sem Build)

Para desenvolvimento rápido, usar Expo Go app:

```bash
cd frontend

# Rodar em modo desenvolvimento
npx expo start

# Escanear QR code no Expo Go app
```

**Vantagens:**
- ✅ Desenvolvimento rápido
- ✅ Sem problemas de build
- ✅ Hot reload

**Desvantagens:**
- ❌ Não é APK standalone
- ❌ Precisa do Expo Go instalado
- ❌ Não serve para produção

---

## ✅ OPÇÃO 7: Investigação Profunda com Troubleshoot Agent

Se nada funcionar, investigar profundamente o erro:

```bash
# Chamar troubleshoot agent com informações completas:
# - Logs completos do build
# - Stack trace do crash
# - Versões de todas as dependências
# - Configuração do ambiente
```

---

## 🎯 MINHA RECOMENDAÇÃO:

### Se o build EAS funcionar mas o app crashar:

**1ª Tentativa:** OPÇÃO 5 (Desabilitar New Architecture + JSC)
- Rápido de testar
- Pode resolver o crash
- Build em 15-20 min

**2ª Tentativa:** OPÇÃO 1 (Atualizar para Expo SDK 52)
- Resolve incompatibilidades
- Versões mais estáveis
- 30-40 minutos de trabalho

**3ª Tentativa:** OPÇÃO 2 (Projeto novo)
- Garantido que funciona
- 1-2 horas de trabalho
- Solução definitiva

---

## 📊 COMPARAÇÃO DAS OPÇÕES:

| Opção | Tempo | Dificuldade | Chance de Sucesso |
|-------|-------|-------------|-------------------|
| 1. Atualizar SDK 52 | 30 min | Fácil | 80% |
| 2. Projeto Novo | 2h | Médio | 95% |
| 3. Patch-Package | 1h | Difícil | 60% |
| 4. RN CLI Puro | 8h+ | Muito Difícil | 90% |
| 5. Old Architecture | 15 min | Fácil | 70% |
| 6. Expo Go | 5 min | Muito Fácil | 100% (dev only) |
| 7. Troubleshoot | Variável | Médio | 50% |

---

## ✅ PLANO DE AÇÃO SE CRASHAR:

```bash
# 1. PRIMEIRO: Testar com Old Architecture (OPÇÃO 5)
cd frontend
# Editar app.json: jsEngine: "jsc", newArchEnabled: false
# Editar gradle.properties: hermesEnabled=false
git commit -am "test: disable new architecture"
eas build --platform android --profile preview

# 2. SE FALHAR: Atualizar para SDK 52 (OPÇÃO 1)
npx expo install expo@latest
npx expo install --fix
eas build --platform android --profile preview

# 3. SE FALHAR: Criar projeto novo (OPÇÃO 2)
npx create-expo-app@latest meu-look-novo
# Copiar código
eas build --platform android --profile preview
```

---

## 💡 DICA FINAL:

O erro original `libreact_featureflagsjni.so` é **específico da New Architecture do React Native**. 

**Solução mais provável:**
- Desabilitar New Architecture (OPÇÃO 5)
- OU atualizar para versão que corrigiu o bug (OPÇÃO 1)

**Próximos passos:**
1. Aguarde o build EAS atual terminar
2. Teste o APK no celular
3. Se crashar, me avise e seguiremos OPÇÃO 5
4. Se não crashar, problema resolvido! 🎉

---

## 🆘 SEMPRE TENHO ALTERNATIVAS!

Pode ficar tranquilo, **sempre** há uma solução! 🚀
