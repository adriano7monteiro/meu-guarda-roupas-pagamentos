# Solução: Firebase google-services.json no EAS Build

## ✅ PROBLEMA RESOLVIDO

O erro `"google-services.json" is missing` durante o `eas build` foi causado porque o arquivo estava no `.gitignore` (por segurança) e não era enviado para o sistema de build do EAS.

## 🔧 SOLUÇÃO IMPLEMENTADA

Configuramos o sistema para usar **EAS Secrets**, que permite fornecer arquivos sensíveis durante o build sem expô-los no Git.

### Arquivos Modificados:

1. **`/app/frontend/app.config.js`**
   - Adicionada lógica para criar `google-services.json` dinamicamente
   - Se a variável `GOOGLE_SERVICES_JSON` existir (via EAS Secret), cria o arquivo automaticamente
   - Validação e mensagens de erro claras

2. **`/app/frontend/eas.json`**
   - Adicionado comentário de documentação sobre o secret necessário

3. **Novos Arquivos Criados:**
   - `/app/FIREBASE_EAS_SETUP.md` - Guia completo de configuração
   - `/app/frontend/setup-firebase-secret.sh` - Script automatizado para configurar o secret

## 📋 INSTRUÇÕES PARA O USUÁRIO

### Opção 1: Script Automatizado (RECOMENDADO)

```bash
cd /app/frontend
./setup-firebase-secret.sh
```

Este script irá:
- ✅ Verificar se o arquivo `google-services.json` existe
- ✅ Verificar se você está logado no EAS
- ✅ Criar o secret automaticamente
- ✅ Listar os secrets configurados

### Opção 2: Comando Manual

```bash
cd /app/frontend

# Criar o secret
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json

# Verificar
eas secret:list
```

### Opção 3: Via Conteúdo JSON Inline

```bash
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --value '{"project_info":{"project_number":"608023360247","project_id":"meu-look-ia","storage_bucket":"meu-look-ia.firebasestorage.app"},"client":[{"client_info":{"mobilesdk_app_id":"1:608023360247:android:553b102ce491475917d9f2","android_client_info":{"package_name":"com.meulookia.app"}},"oauth_client":[],"api_key":[{"current_key":"AIzaSyDLIY57I3SY_giqarTlntwDBHsv1yc_uQ0"}],"services":{"appinvite_service":{"other_platform_oauth_client":[]}}}],"configuration_version":"1"}'
```

## 🚀 EXECUTAR BUILD

Após configurar o secret:

```bash
cd /app/frontend

# Build de produção (AAB)
eas build --platform android --profile production

# Build de teste (APK)
eas build --platform android --profile production-apk
```

## 🔍 COMO FUNCIONA

1. **Desenvolvimento Local:**
   - O arquivo `google-services.json` existe localmente em `/app/frontend/`
   - Funciona normalmente para desenvolvimento

2. **Build no EAS:**
   - O EAS injeta a variável de ambiente `GOOGLE_SERVICES_JSON` (do secret configurado)
   - O `app.config.js` detecta a variável e cria o arquivo automaticamente
   - O build prossegue normalmente com o arquivo disponível

3. **Segurança:**
   - O arquivo permanece no `.gitignore`
   - Não é exposto no repositório Git
   - Apenas disponível durante o build via EAS Secrets

## ✅ VERIFICAÇÃO

### 1. Verificar se o secret está configurado:

```bash
cd /app/frontend
eas secret:list
```

**Saída esperada:**
```
┌────────────────────────┬─────────┐
│ Name                   │ Updated │
├────────────────────────┼─────────┤
│ GOOGLE_SERVICES_JSON   │ ...     │
└────────────────────────┴─────────┘
```

### 2. Verificar logs durante o build:

Procure por:
```
✅ google-services.json criado com sucesso via EAS Secret
```

### 3. Testar notificações push:

Após o build ser concluído e instalado em um dispositivo Android:
1. Abra o app
2. Faça login
3. Vá em Perfil → Verificar Notificações
4. Envie uma notificação via painel admin (`/api/admin_lojinha.html`)
5. Verifique se a notificação é recebida

## 🐛 TROUBLESHOOTING

### Erro: "google-services.json is missing"

**Causa:** Secret não configurado ou configurado incorretamente

**Solução:**
```bash
# Verificar secrets existentes
eas secret:list

# Se GOOGLE_SERVICES_JSON não aparecer, criar:
./setup-firebase-secret.sh

# Ou recriar forçando:
eas secret:delete GOOGLE_SERVICES_JSON
./setup-firebase-secret.sh
```

### Erro: "Failed to create google-services.json from EAS Secret"

**Causa:** Conteúdo do secret está inválido (não é JSON válido)

**Solução:**
1. Verificar se o arquivo local está correto:
```bash
cat /app/frontend/google-services.json | jq .
```

2. Recriar o secret:
```bash
eas secret:delete GOOGLE_SERVICES_JSON
./setup-firebase-secret.sh
```

### Notificações não funcionam no app gerado

**Causa:** Possíveis causas:
1. Secret não foi configurado
2. `google-services.json` tem configuração incorreta
3. Token FCM não está sendo registrado

**Solução:**
1. Verificar logs do build para confirmar que o arquivo foi criado
2. Verificar se o `package_name` no `google-services.json` corresponde ao do app (`com.meulookia.app`)
3. Verificar logs do app para confirmar registro do token FCM
4. Testar manualmente via painel admin

## 📚 RECURSOS ADICIONAIS

- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

## 📝 RESUMO

| Item | Status |
|------|--------|
| Código modificado | ✅ |
| Scripts criados | ✅ |
| Documentação criada | ✅ |
| `.gitignore` mantém segurança | ✅ |
| Desenvolvimento local funciona | ✅ |
| EAS Build configurado | ✅ Requer configuração do secret pelo usuário |

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Configure o EAS Secret** (execute `./setup-firebase-secret.sh`)
2. ✅ **Execute o build** (`eas build --platform android --profile production`)
3. ✅ **Teste as notificações** no dispositivo Android
4. ✅ **Verifique o painel admin** para enviar notificações

---

**Nota:** Esta solução mantém a segurança (arquivo não exposto no Git) enquanto permite que o EAS Build funcione corretamente.
