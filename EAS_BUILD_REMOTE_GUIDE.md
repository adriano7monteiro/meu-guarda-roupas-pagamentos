# 🚀 RESOLVIDO: Build Remoto EAS com Node.js 22

## ✅ SOLUÇÃO FINAL APLICADA

O erro acontecia porque o servidor EAS Build estava usando Node 20.19.2, que é incompatível com `@react-native/dev-middleware@0.81.4` (requer >= 20.19.4).

### 🔧 Correção Aplicada

Atualizado `eas.json` para forçar **Node.js 22.11.0** em todos os builds:

```json
{
  "build": {
    "development": {
      "node": "22.11.0",
      "env": {
        "YARN_IGNORE_ENGINES": "1"
      }
    },
    "preview": {
      "node": "22.11.0",
      "env": {
        "YARN_IGNORE_ENGINES": "1"
      }
    },
    "production": {
      "node": "22.11.0",
      "env": {
        "YARN_IGNORE_ENGINES": "1"
      }
    }
  }
}
```

## 🚀 COMANDOS PARA BUILD REMOTO

### 1. Login no EAS (primeira vez)

```bash
npm install -g eas-cli
eas login
```

### 2. Configurar Projeto (primeira vez)

```bash
cd frontend
eas build:configure
```

### 3. Build Android APK (Preview)

```bash
eas build --platform android --profile preview
```

**Isso vai:**
- ✅ Usar Node 22.11.0 no servidor EAS
- ✅ Ignorar verificação de engines
- ✅ Gerar um APK para testes

### 4. Build Android AAB (Produção - Play Store)

```bash
eas build --platform android --profile production
```

### 5. Build iOS (Produção - App Store)

```bash
eas build --platform ios --profile production
```

## 📊 Monitorar Build

```bash
# Ver lista de builds
eas build:list

# Ver detalhes de um build específico
eas build:view [BUILD_ID]

# Cancelar build em andamento
eas build:cancel [BUILD_ID]
```

## 📥 Baixar e Instalar APK

### Opção 1: Via EAS CLI

```bash
# Baixar último build
eas build:download --platform android --profile preview

# Baixar build específico
eas build:download [BUILD_ID]
```

### Opção 2: Via Link Direto

Após o build, você receberá um link. Copie e cole no navegador do celular para baixar direto.

### Opção 3: Instalar Direto via USB

```bash
# Com celular conectado via USB
adb install caminho/para/o/arquivo.apk

# Ou via EAS
eas build:run [BUILD_ID] --platform android
```

## 🔍 VERIFICAR SE ESTÁ CORRETO

Antes de fazer o build, verifique:

```bash
cd frontend

# 1. Verificar eas.json
cat eas.json | grep '"node"'
# Deve mostrar: "node": "22.11.0"

# 2. Verificar .yarnrc
cat .yarnrc
# Deve mostrar: --install.ignore-engines true

# 3. Verificar package.json
cat package.json | grep -A 3 "resolutions"
# Deve mostrar: "@react-native/dev-middleware": "0.79.5"
```

## ⚠️ PROBLEMAS COMUNS

### Build falha com erro de autenticação

```bash
# Fazer login novamente
eas logout
eas login
```

### Build fica pendente muito tempo

```bash
# Cancelar e tentar novamente
eas build:cancel

# Tentar com --clear-cache
eas build --platform android --profile preview --clear-cache
```

### Erro "Invalid credentials"

```bash
# Configurar credenciais Android
eas credentials

# Ou deixar o EAS gerar automaticamente
eas build --platform android --profile preview
# Escolha "Generate new keystore" quando perguntado
```

## 📱 TESTAR O APK

### Android

1. **Habilitar Instalação de Apps Desconhecidos:**
   - Configurações > Segurança > Fontes Desconhecidas (ON)
   
2. **Baixar e Instalar:**
   - Baixe o APK no celular
   - Toque no arquivo
   - Confirme instalação

### iOS (TestFlight)

1. **Build para TestFlight:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit para TestFlight:**
   ```bash
   eas submit --platform ios
   ```

3. **Adicionar Testadores:**
   - App Store Connect > TestFlight
   - Adicionar emails dos testadores

## 🎯 PROFILES EXPLICADOS

### `development`
- Para desenvolvimento com Expo Dev Client
- Gera build maior com ferramentas de debug
- Usa: `eas build --platform android --profile development`

### `preview`
- Para testes rápidos
- Gera APK (Android) que pode ser instalado direto
- **RECOMENDADO para testes**
- Usa: `eas build --platform android --profile preview`

### `production`
- Para publicar nas lojas (Play Store / App Store)
- Gera AAB (Android) ou IPA (iOS) otimizados
- Usa: `eas build --platform android --profile production`

## 🔐 VARIÁVEIS DE AMBIENTE NO EAS

Se precisar configurar variáveis de ambiente:

```bash
# Adicionar secret
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value https://api-producao.com

# Listar secrets
eas secret:list

# Deletar secret
eas secret:delete --name EXPO_PUBLIC_BACKEND_URL
```

E adicione no `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://api-producao.com"
      }
    }
  }
}
```

## 📝 CHECKLIST ANTES DO BUILD

- [ ] Código commitado (EAS usa Git)
- [ ] `eas.json` tem `"node": "22.11.0"`
- [ ] Versão incrementada em `app.json`
- [ ] Ícone e splash screen prontos
- [ ] `.yarnrc` e `.npmrc` configurados
- [ ] Logado no EAS (`eas whoami`)

## 🎉 PRONTO PARA BUILD!

Execute:

```bash
cd frontend
eas build --platform android --profile preview
```

Aguarde ~15-20 minutos e você receberá o link para download do APK!

## 📞 SUPORTE

Se ainda tiver problemas:

1. Ver logs completos: `eas build:view [BUILD_ID]`
2. Verificar status do EAS: https://status.expo.dev/
3. Docs oficiais: https://docs.expo.dev/build/introduction/

## 💡 DICA PRO

Criar alias para facilitar:

```bash
# No seu .bashrc ou .zshrc
alias eab-android="eas build --platform android --profile preview"
alias eab-ios="eas build --platform ios --profile preview"
alias eab-list="eas build:list"
```

Agora basta digitar `eab-android` para fazer build! 🚀
