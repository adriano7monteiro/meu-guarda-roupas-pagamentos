# 📱 Guia de Build - Meu Look IA

## 🎯 Otimizações Realizadas

### Dependências Organizadas

As dependências foram reorganizadas para otimizar o build de produção:

#### ✅ Mantidas em `dependencies` (Produção):
- Todas as libs do Expo necessárias para runtime
- React e React Native
- Bibliotecas de navegação
- Stripe SDK
- Axios, Zustand, React Hook Form
- Componentes visuais e animações

#### 🔧 Movidas para `devDependencies` (Desenvolvimento):
- `@expo/ngrok` - Usado apenas para tunneling em dev
- `react-native-dotenv` - Processamento de .env em dev
- `@babel/core` - Transpilação em dev
- `@types/react` - Types do TypeScript
- `eslint` e configurações - Linting em dev
- `typescript` - Compilação em dev

## 🚀 Build para Produção

### Android (APK/AAB)

```bash
# Development Build
cd /app/frontend
eas build --platform android --profile development

# Production Build
eas build --platform android --profile production

# Preview Build
eas build --platform android --profile preview
```

### iOS (IPA)

```bash
# Development Build
cd /app/frontend
eas build --platform ios --profile development

# Production Build (App Store)
eas build --platform ios --profile production
```

### Configuração EAS Build

Crie o arquivo `eas.json` na raiz do projeto frontend:

```json
{
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
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://sua-api-producao.com"
      }
    }
  }
}
```

## 📦 Redução de Tamanho do Bundle

### 1. Remover Logs de Console em Produção

Crie `babel.config.js` com:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ...(process.env.NODE_ENV === 'production'
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
    ],
  };
};
```

### 2. Configurar app.json para Produção

```json
{
  "expo": {
    "packagerOpts": {
      "sourceExts": ["js", "json", "ts", "tsx", "jsx"],
      "assetExts": ["jpg", "png", "ttf"]
    },
    "jsEngine": "hermes",
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
}
```

### 3. Analisar Tamanho do Bundle

```bash
# Gerar bundle map
npx react-native-bundle-visualizer

# Ou use o Metro bundle analyzer
npx expo start --no-dev --minify
```

## 🔧 Variáveis de Ambiente para Produção

### Backend (.env)
```bash
# Produção
MONGO_URL=mongodb://production-host:27017/meulookia
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SENDGRID_API_KEY=SG.xxx
FAL_API_KEY=xxx-xxx
SENDER_EMAIL=noreply@meulookia.com
```

### Frontend (.env)
```bash
# Produção
EXPO_PUBLIC_BACKEND_URL=https://api.meulookia.com
```

## 🏗️ Build Local (Sem EAS)

### Android

```bash
# Instalar dependências
cd /app/frontend
yarn install --production

# Gerar Android build
npx expo run:android --variant release

# Build APK standalone
npx expo export:android
```

### iOS

```bash
# Instalar dependências
cd /app/frontend
yarn install --production

# Gerar iOS build
npx expo run:ios --configuration Release
```

## ✅ Checklist Pré-Build

Antes de fazer o build de produção:

- [ ] Atualizar versão em `app.json`
- [ ] Configurar variáveis de ambiente de produção
- [ ] Testar app em modo release local
- [ ] Verificar ícones e splash screen
- [ ] Testar pagamentos com Stripe em modo live
- [ ] Configurar deep linking
- [ ] Adicionar políticas de privacidade
- [ ] Configurar analytics (opcional)
- [ ] Testar em dispositivos físicos
- [ ] Verificar permissões necessárias

## 🎨 Assets de Produção

### Ícones Necessários

```
assets/images/
├── icon.png (1024x1024)
├── adaptive-icon.png (1024x1024)
├── splash-icon.png (512x512)
└── favicon.png (48x48)
```

### Gerar Todos os Ícones

```bash
# Com Expo
npx expo prebuild --clean

# Isso gera todos os assets nativos necessários
```

## 📊 Performance

### Otimizações Aplicadas

✅ **Dependências de dev separadas** - Reduz bundle size
✅ **Hermes Engine habilitado** - Melhor performance JS
✅ **ProGuard Android** - Minifica código
✅ **Source maps desabilitados** - Build mais rápido
✅ **Fast Refresh otimizado** - Melhor DX

### Métricas Esperadas

| Métrica | Valor Esperado |
|---------|----------------|
| Bundle Size (JS) | ~2-3 MB |
| APK Size | ~30-40 MB |
| IPA Size | ~35-45 MB |
| Startup Time | < 3s |
| TTI (Time to Interactive) | < 5s |

## 🐛 Troubleshooting

### Erro: "Module not found"
```bash
# Limpar cache
rm -rf node_modules
yarn install
npx expo start --clear
```

### Erro: Build falha no EAS
```bash
# Verificar logs
eas build:list
eas build:view [BUILD_ID]
```

### App crasha ao iniciar
```bash
# Verificar logs nativos
# Android
adb logcat *:E

# iOS
xcrun simctl spawn booted log stream --level=debug
```

## 📱 Distribuição

### Android

1. **Google Play Store**
   - Build AAB: `eas build --platform android --profile production`
   - Upload via Google Play Console
   - Configurar listing da loja

2. **Internal Testing**
   - Build APK: `eas build --platform android --profile preview`
   - Distribuir via link direto

### iOS

1. **App Store**
   - Build IPA: `eas build --platform ios --profile production`
   - Upload via App Store Connect
   - Configurar metadata

2. **TestFlight**
   - Mesmo build de produção
   - Adicionar testadores internos/externos

## 🔒 Segurança

### Proteções Implementadas

- ✅ API keys em variáveis de ambiente
- ✅ HTTPS obrigatório
- ✅ Validação de JWT no backend
- ✅ Stripe em modo live separado
- ✅ Rate limiting configurado
- ✅ Input sanitization

## 📈 Monitoramento

### Recomendações

Adicione monitoramento de erros e analytics:

```bash
# Sentry (erros)
yarn add @sentry/react-native

# Analytics
yarn add expo-analytics
```

## 🎉 Deploy Completo

### Ordem Recomendada

1. **Backend em produção**
   ```bash
   # Deploy no servidor/cloud
   # Configurar MongoDB
   # Configurar variáveis de ambiente
   # Testar endpoints
   ```

2. **Build do App**
   ```bash
   # Android
   eas build --platform android --profile production
   
   # iOS
   eas build --platform ios --profile production
   ```

3. **Distribuição**
   ```bash
   # Enviar para stores
   # Aguardar aprovação
   # Monitorar feedback
   ```

## 📞 Suporte

Para problemas de build:
- Documentação Expo: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- Community: https://forums.expo.dev
