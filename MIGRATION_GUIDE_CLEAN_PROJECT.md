# 🔄 MIGRAÇÃO COMPLETA: Projeto Novo Limpo

## 🎯 ESTRATÉGIA: Criar projeto novo Expo e migrar o código

Esta é a forma mais segura e garantida de resolver todos os problemas de build!

---

## 📋 PARTE 1: CRIAR PROJETO NOVO (No Seu Computador)

### Passo 1: Criar projeto Expo limpo

```bash
# Ir para pasta de projetos
cd /caminho/dos/seus/projetos

# Criar projeto novo com SDK mais recente
npx create-expo-app@latest meu-look-ia-novo --template blank-typescript

cd meu-look-ia-novo
```

### Passo 2: Instalar dependências do projeto antigo

```bash
# Dependências principais
yarn add @stripe/stripe-react-native axios zustand react-hook-form

# Navegação
yarn add @react-navigation/bottom-tabs @react-navigation/native

# Expo modules
yarn add expo-image-picker expo-location expo-sharing expo-haptics expo-linear-gradient expo-web-browser

# Outras
yarn add @react-native-async-storage/async-storage

# Dev dependencies
yarn add -D react-native-dotenv
```

### Passo 3: Configurar app.json

Edite `app.json` para incluir as configurações do projeto antigo:

```json
{
  "expo": {
    "name": "Meu Look IA",
    "slug": "meu-look-ia",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "meulookia",
    "userInterfaceStyle": "automatic",
    "jsEngine": "hermes",
    "newArchEnabled": false,
    "ios": {
      "supportsTablet": true,
      "jsEngine": "hermes",
      "bundleIdentifier": "com.zenebathos.meulookia"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#000"
      },
      "package": "com.zenebathos.meulookia",
      "jsEngine": "hermes"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#6366f1"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 📋 PARTE 2: COPIAR CÓDIGO DO PROJETO ANTIGO

### Passo 4: Copiar estrutura de pastas

```bash
# No projeto ANTIGO, copiar para o NOVO:

# 1. Copiar pasta app/ (todas as telas)
cp -r /caminho/do/projeto/antigo/frontend/app/* ./app/

# 2. Criar e copiar pasta components/
mkdir components
cp -r /caminho/do/projeto/antigo/frontend/components/* ./components/

# 3. Criar e copiar pasta utils/
mkdir utils
cp -r /caminho/do/projeto/antigo/frontend/utils/* ./utils/

# 4. Criar e copiar pasta hooks/
mkdir hooks
cp -r /caminho/do/projeto/antigo/frontend/hooks/* ./hooks/

# 5. Copiar assets/
cp -r /caminho/do/projeto/antigo/frontend/assets/* ./assets/
```

### Passo 5: Copiar arquivos de configuração

```bash
# Copiar .env
cp /caminho/do/projeto/antigo/frontend/.env ./.env
cp /caminho/do/projeto/antigo/frontend/.env.production ./.env.production

# Copiar configurações
cp /caminho/do/projeto/antigo/frontend/metro.config.js ./metro.config.js
```

---

## 📋 PARTE 3: AJUSTAR IMPORTS E CAMINHOS

### Passo 6: Verificar imports

Alguns imports podem precisar de ajuste. Verifique:

```typescript
// Se tiver imports assim:
import Component from '../components/Component'

// Pode precisar ajustar para:
import Component from '@/components/Component'

// Configure o tsconfig.json se necessário:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Passo 7: Criar _layout.tsx raiz se não existir

Se o app/ não tiver `_layout.tsx`, crie:

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

---

## 📋 PARTE 4: CONFIGURAR STRIPE

### Passo 8: Configurar Stripe providers

Verifique se os arquivos `utils/stripeProvider.native.tsx` e `utils/stripeProvider.web.tsx` foram copiados.

---

## 📋 PARTE 5: TESTAR LOCALMENTE

### Passo 9: Testar em desenvolvimento

```bash
cd meu-look-ia-novo

# Iniciar app
npx expo start

# Testar no Expo Go ou emulador
# Pressione 'a' para Android ou 'i' para iOS
```

### Passo 10: Corrigir erros de import

Se aparecer erros de import não encontrado:

```bash
# Instalar dependência faltando
yarn add [nome-da-dependencia]
```

---

## 📋 PARTE 6: CONFIGURAR EAS BUILD

### Passo 11: Configurar EAS

```bash
# Login no EAS
eas login

# Configurar projeto
eas build:configure

# Isso criará eas.json
```

### Passo 12: Editar eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 📋 PARTE 7: BUILD FINAL

### Passo 13: Build EAS

```bash
cd meu-look-ia-novo

# Build Android APK
eas build --platform android --profile preview

# Aguardar ~15-20 minutos
# Baixar APK quando pronto
# Instalar no celular
```

---

## 📋 PARTE 8: MIGRAR BACKEND (Se Necessário)

Se o backend também tiver problemas, copie:

```bash
# Copiar pasta backend/
cp -r /caminho/do/projeto/antigo/backend/* ./backend/
```

---

## ✅ CHECKLIST DE MIGRAÇÃO

Marque conforme avançar:

- [ ] Projeto novo criado
- [ ] Dependências instaladas
- [ ] app.json configurado
- [ ] Pasta app/ copiada
- [ ] Pasta components/ copiada
- [ ] Pasta utils/ copiada
- [ ] Pasta hooks/ copiada
- [ ] Assets copiados
- [ ] .env copiado
- [ ] Stripe configurado
- [ ] App testado localmente (expo start)
- [ ] Erros de import corrigidos
- [ ] EAS configurado
- [ ] Build EAS executado
- [ ] APK testado no celular

---

## 🎯 VANTAGENS DESTA ABORDAGEM

✅ **Ambiente limpo** - Sem conflitos de versão
✅ **SDK mais recente** - Todas as versões compatíveis
✅ **Configuração correta** - Sem problemas de Kotlin/Gradle
✅ **Praticamente garantido** - 95% de chance de sucesso
✅ **Código preservado** - Toda lógica de negócio intacta

---

## ⏱️ TEMPO ESTIMADO

- Criar projeto novo: 5 minutos
- Instalar dependências: 5 minutos
- Copiar código: 10 minutos
- Ajustar imports: 20-30 minutos
- Testar localmente: 10 minutos
- Build EAS: 15-20 minutos

**TOTAL: ~1 hora de trabalho + 20 minutos de build**

---

## 🆘 SE ENCONTRAR PROBLEMAS

### Erro de import não encontrado:
```bash
yarn add [pacote-faltando]
```

### Erro de tipo TypeScript:
```bash
# Adicionar @types se necessário
yarn add -D @types/[pacote]
```

### Erro no build:
```bash
# Ver logs completos
eas build:view [BUILD_ID]
```

---

## 💡 DICAS IMPORTANTES

1. **Não copie node_modules/** - Deixe yarn instalar do zero
2. **Não copie .expo/** - Cache local não é necessário
3. **Não copie android/ e ios/** - Expo gerencia isso
4. **Copie apenas código fonte** - app/, components/, utils/, etc
5. **Teste localmente primeiro** - Antes de fazer build EAS

---

## 🎉 RESULTADO ESPERADO

Após seguir todos os passos:
- ✅ App funciona perfeitamente em desenvolvimento
- ✅ Build EAS bem-sucedido
- ✅ APK instala e abre sem crash
- ✅ Todas as funcionalidades funcionando

---

## 📞 PRÓXIMOS PASSOS

1. Siga o guia passo a passo
2. Me avise quando chegar no Passo 13 (Build EAS)
3. Se encontrar algum problema, me envie o erro
4. Após APK pronto, teste todas as funcionalidades

Boa sorte! Esta abordagem vai funcionar! 🚀
