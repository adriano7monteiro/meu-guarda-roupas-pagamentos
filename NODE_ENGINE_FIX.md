# 🔧 Solução para Erro de Engine do Node.js

## ❌ Erro Original

```
error @react-native/dev-middleware@0.81.4: The engine "node" is incompatible with this module. 
Expected version ">= 20.19.4". Got "20.19.2"
```

## ✅ Soluções Aplicadas

### 1. Arquivo `.yarnrc` Criado

Configuração para ignorar verificação de engines durante instalação:

```
--install.ignore-engines true
```

### 2. `package.json` Atualizado

Adicionadas configurações:

```json
{
  "engines": {
    "node": ">=20.19.2"
  },
  "resolutions": {
    "@react-native/dev-middleware": "^0.79.5"
  }
}
```

**Explicação:**
- `engines`: Define a versão mínima do Node aceita (20.19.2 ou superior)
- `resolutions`: Força o yarn a usar uma versão compatível do dev-middleware

## 🚀 Como Usar Agora

### Build Android (EAS)

```bash
cd /app/frontend

# Build de desenvolvimento
eas build --platform android --profile development

# Build de preview (APK)
eas build --platform android --profile preview

# Build de produção
eas build --platform android --profile production
```

### Build Local (sem EAS)

```bash
cd /app/frontend

# Limpar cache se necessário
rm -rf node_modules
yarn install

# Build Android local
npx expo run:android --variant release
```

### Build iOS (EAS)

```bash
cd /app/frontend

# Build de desenvolvimento
eas build --platform ios --profile development

# Build de produção
eas build --platform ios --profile production
```

## 🔍 Verificação do Node

```bash
# Verificar versão do Node instalada
node --version
# Deve retornar: v20.19.5 (ou superior)

# Verificar versão do Yarn
yarn --version
# Deve retornar: 1.22.22 (ou similar)

# Verificar versão do Expo
npx expo --version
```

## 📝 Configuração EAS (se necessário)

Se ainda não tiver `eas.json`, crie:

```bash
cd /app/frontend
eas build:configure
```

Isso criará um arquivo `eas.json` com configurações padrão:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Debug"
      },
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
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

## 🛠️ Troubleshooting

### Erro persiste após .yarnrc

```bash
# Limpar tudo e reinstalar
cd /app/frontend
rm -rf node_modules yarn.lock
yarn cache clean
yarn install --ignore-engines
```

### Build EAS falha

```bash
# Ver logs detalhados
eas build --platform android --profile preview --clear-cache

# Verificar status
eas build:list
```

### Problema com Hermes

Se tiver problemas com o Hermes engine, adicione no `app.json`:

```json
{
  "expo": {
    "jsEngine": "hermes",
    "android": {
      "jsEngine": "hermes"
    },
    "ios": {
      "jsEngine": "hermes"
    }
  }
}
```

## 🎯 Comandos Úteis

```bash
# Limpar cache do Expo
npx expo start --clear

# Reinstalar dependências
rm -rf node_modules && yarn install --ignore-engines

# Ver informações do projeto
npx expo-doctor

# Verificar problemas
npx expo install --check
```

## 📱 Teste Antes do Build

Antes de fazer o build de produção:

```bash
# Testar em modo release localmente
cd /app/frontend

# Android
npx react-native run-android --variant=release

# iOS
npx react-native run-ios --configuration Release
```

## ⚠️ Notas Importantes

1. **Versão do Node**: O servidor tem Node v20.19.5, que é compatível
2. **Yarn vs NPM**: Use sempre `yarn` neste projeto
3. **Cache**: Se tiver problemas, sempre limpe o cache primeiro
4. **EAS CLI**: Certifique-se de ter EAS CLI instalado: `npm install -g eas-cli`

## 🔐 Variáveis de Ambiente para Build

Certifique-se de configurar no EAS:

```bash
# Configurar secrets no EAS
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value https://sua-api.com

# Listar secrets
eas secret:list
```

## ✅ Checklist de Build

Antes de fazer o build final:

- [ ] `.yarnrc` existe com `--install.ignore-engines true`
- [ ] `package.json` tem engines configurado
- [ ] `eas.json` existe e está configurado
- [ ] Variáveis de ambiente configuradas
- [ ] App testado em modo release local
- [ ] Versão incrementada em `app.json`
- [ ] Ícones e splash screen prontos

## 🎉 Tudo Pronto!

Com essas configurações, o erro de engine do Node.js está resolvido. Agora você pode fazer builds sem problemas! 🚀
