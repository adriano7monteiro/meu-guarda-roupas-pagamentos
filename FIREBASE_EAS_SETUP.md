# Configuração do Firebase para EAS Build

## Problema
O arquivo `google-services.json` está sendo ignorado pelo Git (por segurança), mas é necessário para os builds do EAS funcionarem corretamente com Firebase Cloud Messaging.

## Solução: EAS Secrets

### Passo 1: Preparar o conteúdo do google-services.json

O conteúdo do arquivo já está disponível em `/app/frontend/google-services.json`.

### Passo 2: Configurar o EAS Secret

Execute o seguinte comando no diretório `/app/frontend`:

```bash
# Opção 1: Via comando EAS CLI (RECOMENDADO)
cd /app/frontend
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
```

**OU**

```bash
# Opção 2: Via conteúdo inline
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --value '{"project_info":{"project_number":"608023360247","project_id":"meu-look-ia","storage_bucket":"meu-look-ia.firebasestorage.app"},"client":[{"client_info":{"mobilesdk_app_id":"1:608023360247:android:553b102ce491475917d9f2","android_client_info":{"package_name":"com.meulookia.app"}},"oauth_client":[],"api_key":[{"current_key":"AIzaSyDLIY57I3SY_giqarTlntwDBHsv1yc_uQ0"}],"services":{"appinvite_service":{"other_platform_oauth_client":[]}}}],"configuration_version":"1"}'
```

### Passo 3: Verificar o Secret

```bash
cd /app/frontend
eas secret:list
```

Você deve ver `GOOGLE_SERVICES_JSON` listado.

### Passo 4: Build

Agora você pode executar o build normalmente:

```bash
eas build --platform android --profile production
```

O `app.config.js` foi configurado para:
1. Verificar se a variável `GOOGLE_SERVICES_JSON` existe durante o build
2. Se existir, criar o arquivo `google-services.json` automaticamente
3. Se não existir, usar o arquivo local (desenvolvimento)

## Estrutura de Segurança

- ✅ `google-services.json` permanece no `.gitignore`
- ✅ Arquivo não é exposto no repositório Git
- ✅ EAS tem acesso ao arquivo via secrets durante o build
- ✅ Desenvolvimento local continua funcionando com o arquivo local

## Verificação

Após configurar o secret e executar o build:
1. O build deve completar sem erros de "google-services.json missing"
2. As notificações push devem funcionar no APK/AAB gerado
3. O token FCM deve ser registrado corretamente

## Troubleshooting

### Erro: "google-services.json is missing"
- Verifique se o secret foi criado: `eas secret:list`
- Verifique se o nome está correto: `GOOGLE_SERVICES_JSON`
- Execute o build novamente

### Secret não está sendo aplicado
- Certifique-se de estar na conta/projeto correto do EAS
- Verifique o escopo do secret (deve ser `project`)
- Recrie o secret se necessário

## Recursos Adicionais

- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
