# 🚨 GUIA COMPLETO: Resolver Erro de Engine Node.js no SEU COMPUTADOR

## ❌ Erro que Você Está Tendo:

```
error @react-native/dev-middleware@0.81.4: The engine "node" is incompatible with this module. 
Expected version ">= 20.19.4". Got "20.19.2"
```

## 🎯 SOLUÇÃO COMPLETA - Execute no Seu Computador

### Passo 1: Baixar o Projeto Atualizado

```bash
# Certifique-se de ter a versão mais recente do projeto
# com os arquivos .yarnrc, .npmrc e eas.json atualizados
```

### Passo 2: Verificar Versão do Node

```bash
# Verificar versão do Node no seu computador
node --version
```

**Se for menor que 20.19.4, atualize o Node:**

```bash
# Opção 1: Usando NVM (recomendado)
nvm install 20.19.5
nvm use 20.19.5

# Opção 2: Baixar do site oficial
# https://nodejs.org/
```

### Passo 3: Limpar Cache Completamente

```bash
cd /caminho/para/seu/projeto/frontend

# Limpar cache do Yarn
yarn cache clean

# Limpar cache do npm (mesmo se usar yarn)
npm cache clean --force

# Remover node_modules e locks
rm -rf node_modules
rm -f yarn.lock
rm -f package-lock.json
```

### Passo 4: Verificar Arquivos de Configuração

Certifique-se de que esses arquivos existam na pasta `frontend`:

#### `.yarnrc`
```
--install.ignore-engines true
```

#### `.npmrc`
```
engine-strict=false
legacy-peer-deps=true
```

#### `eas.json`
```json
{
  "build": {
    "preview": {
      "env": {
        "YARN_IGNORE_ENGINES": "1"
      }
    }
  }
}
```

#### `package.json` deve ter:
```json
{
  "engines": {
    "node": ">=20.19.2"
  },
  "resolutions": {
    "@react-native/dev-middleware": "0.79.5"
  }
}
```

### Passo 5: Reinstalar Dependências

```bash
cd frontend

# Instalar com flag ignore-engines
yarn install --ignore-engines

# OU se preferir npm
npm install --legacy-peer-deps
```

### Passo 6: Build com EAS

```bash
# Login no EAS (se ainda não fez)
eas login

# Configurar projeto (primeira vez)
eas build:configure

# Build Android APK
eas build --platform android --profile preview

# Build Android AAB (para Play Store)
eas build --platform android --profile production
```

## 🔧 ALTERNATIVAS SE AINDA DER ERRO

### Alternativa 1: Usar Flag no Comando

```bash
# Build com ignore de engines explícito
YARN_IGNORE_ENGINES=1 eas build --platform android --profile preview
```

### Alternativa 2: Atualizar Node para Versão Mais Recente

```bash
# Instalar Node 22 LTS (mais recente)
nvm install 22
nvm use 22

# Verificar
node --version  # deve mostrar v22.x.x

# Tentar build novamente
eas build --platform android --profile preview
```

### Alternativa 3: Build Local (sem EAS)

```bash
cd frontend

# Android
npx expo run:android --variant release

# Isso gera um APK em:
# android/app/build/outputs/apk/release/app-release.apk
```

### Alternativa 4: Forçar Resolução Específica

Se nada funcionar, edite `package.json` e adicione:

```json
{
  "resolutions": {
    "@react-native/dev-middleware": "0.79.5",
    "**/react-native": "0.79.5",
    "**/@react-native/dev-middleware": "0.79.5"
  }
}
```

## 🐛 TROUBLESHOOTING ESPECÍFICO

### Erro persiste após todas as tentativas?

```bash
# 1. Verificar qual versão está instalada
yarn list --pattern "@react-native/dev-middleware"

# Deve mostrar: @react-native/dev-middleware@0.79.5
# Se mostrar 0.81.4, algo está errado

# 2. Forçar instalação da versão correta
yarn add @react-native/dev-middleware@0.79.5 --dev

# 3. Limpar e reinstalar TUDO
rm -rf node_modules yarn.lock package-lock.json
yarn cache clean
yarn install --ignore-engines
```

### Erro no Build EAS (servidor remoto)?

```bash
# Verificar logs completos
eas build:list
eas build:view [BUILD_ID]

# Se o erro for no servidor do EAS, adicione no eas.json:
{
  "build": {
    "preview": {
      "node": "22.0.0",
      "env": {
        "YARN_IGNORE_ENGINES": "1",
        "NPM_CONFIG_ENGINE_STRICT": "false"
      }
    }
  }
}
```

## 📱 MÉTODO MAIS SIMPLES: Build Development

Se você só quer testar no celular rapidamente:

```bash
cd frontend

# 1. Instalar Expo Go no seu celular
# Android: https://play.google.com/store/apps/details?id=host.exp.exponent
# iOS: https://apps.apple.com/app/expo-go/id982107779

# 2. Iniciar dev server
npx expo start

# 3. Escanear QR code com Expo Go
```

## ✅ CHECKLIST FINAL

Antes de fazer o build, certifique-se:

- [ ] Node.js >= 20.19.4 (verifique com `node --version`)
- [ ] Arquivo `.yarnrc` existe com `--install.ignore-engines true`
- [ ] Arquivo `.npmrc` existe com `engine-strict=false`
- [ ] Arquivo `eas.json` tem `YARN_IGNORE_ENGINES: "1"`
- [ ] `package.json` tem resolutions corretas
- [ ] Cache limpo (`yarn cache clean`)
- [ ] node_modules removido e reinstalado
- [ ] `yarn list` mostra `@react-native/dev-middleware@0.79.5`

## 🎉 APÓS RESOLVER

Depois que o build funcionar:

```bash
# Baixar o APK/AAB
eas build:download [BUILD_ID]

# Ou instalar direto no celular conectado
eas build:run [BUILD_ID] --platform android
```

## 💡 DICA FINAL

Se NADA funcionar, o problema pode ser:

1. **Versão do Node muito antiga** no seu computador
   - Solução: Atualizar para Node 22 LTS

2. **Cache corrompido**
   - Solução: Limpar TUDO (yarn cache, npm cache, node_modules)

3. **EAS Build usando Node antigo**
   - Solução: Especificar `"node": "22.0.0"` no eas.json

4. **Conflito de gerenciador de pacotes**
   - Solução: Usar SOMENTE yarn OU npm, nunca os dois

## 📞 AINDA COM PROBLEMAS?

Me envie:
1. Saída de `node --version`
2. Saída de `yarn --version`
3. Saída de `yarn list --pattern "@react-native/dev-middleware"`
4. Log completo do erro

Assim posso ajudar mais especificamente! 🚀
