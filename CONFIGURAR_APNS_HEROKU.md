# 🍎 Configurar APNs no Heroku

## 📋 Variáveis Necessárias

Você precisa adicionar 3 variáveis de ambiente no Heroku:

### 1. APNS_KEY_ID
O Key ID da sua chave APNs (exemplo: `7V3XCY46LP`)

### 2. APNS_TEAM_ID  
O Team ID da sua conta Apple Developer (exemplo: `C88Z4WK6J2`)

### 3. APNS_AUTH_KEY
O conteúdo completo do arquivo `.p8`

---

## 🔧 Como Configurar

### Passo 1: Abrir o arquivo .p8

Seu arquivo `.p8` está na Apple Developer e tem este formato:

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(várias linhas)
...xyz123abc
-----END PRIVATE KEY-----
```

### Passo 2: Copiar o conteúdo

Copie **TODO** o conteúdo do arquivo `.p8`, incluindo as linhas:
- `-----BEGIN PRIVATE KEY-----`
- Todo o conteúdo do meio
- `-----END PRIVATE KEY-----`

### Passo 3: Configurar no Heroku

#### Via Heroku Dashboard:

1. Acesse: https://dashboard.heroku.com
2. Selecione seu app: `meulookia-e68fc7ce1afa`
3. Vá em: **Settings** → **Config Vars** → **Reveal Config Vars**
4. Adicione as 3 variáveis:

```
APNS_KEY_ID = 7V3XCY46LP
APNS_TEAM_ID = C88Z4WK6J2
APNS_AUTH_KEY = -----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...\n...\n-----END PRIVATE KEY-----
```

⚠️ **IMPORTANTE:** 
- No campo `APNS_AUTH_KEY`, cole TODO o conteúdo em UMA ÚNICA variável
- As quebras de linha podem ser representadas como `\n` literalmente
- OU cole o conteúdo com quebras de linha normais (Heroku aceita ambos)
- O código backend processará automaticamente qualquer formato

#### Via Heroku CLI (alternativa):

```bash
# Definir Key ID
heroku config:set APNS_KEY_ID=7V3XCY46LP -a meulookia-e68fc7ce1afa

# Definir Team ID
heroku config:set APNS_TEAM_ID=C88Z4WK6J2 -a meulookia-e68fc7ce1afa

# Definir Auth Key (lendo do arquivo)
heroku config:set APNS_AUTH_KEY="$(cat caminho/para/AuthKey_7V3XCY46LP.p8)" -a meulookia-e68fc7ce1afa
```

### Passo 4: Verificar

```bash
heroku config:get APNS_KEY_ID -a meulookia-e68fc7ce1afa
heroku config:get APNS_TEAM_ID -a meulookia-e68fc7ce1afa
heroku config:get APNS_AUTH_KEY -a meulookia-e68fc7ce1afa
```

---

## 📝 Exemplo Completo

```bash
# APNS_KEY_ID
7V3XCY46LP

# APNS_TEAM_ID  
C88Z4WK6J2

# APNS_AUTH_KEY (arquivo .p8 completo)
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgK/vfJkMp9pLKpTjC
3ptNmKvMwfY0J7z7x6L8jFRPv4igCgYIKoZIzj0DAQehRANCAASW7xdZPjJKL3M2
hMxoFqkJ8xPDLpYEV7J+hKZ3jqZ0B3AzXN7vKPmW+xN6T5hZwE4x3kJCqB2L7PZM
nJ5kQxYz
-----END PRIVATE KEY-----
```

---

## ✅ Após Configurar

O backend automaticamente:
1. Detecta tokens iOS (64 caracteres)
2. Envia via APNs usando as credenciais configuradas
3. Detecta tokens Android (140+ caracteres)
4. Envia via Firebase (como já funciona)

**Não precisa rebuild do app!** Apenas configurar as variáveis.

---

## 🧪 Testar

Depois de configurar:

1. Acesse: `/api/admin_lojinha.html`
2. Aba "Push Notifications"
3. Enviar mensagem
4. Logs devem mostrar:
   ```
   📤 Token iOS (64 chars) - Enviando via APNs
   ✅ Notificação iOS enviada com sucesso
   ```

---

## 🐛 Troubleshooting

### Erro: "Invalid APNs credentials"
- Verifique se Key ID está correto
- Verifique se Team ID está correto
- Verifique se o .p8 está completo (BEGIN e END)

### Erro: "Key format invalid"
- Certifique-se que copiou TODO o arquivo .p8
- Incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`

### Como saber se está configurado?
```bash
heroku config -a meulookia-e68fc7ce1afa | grep APNS
```

Deve mostrar as 3 variáveis.

---

**Próximo passo:** Implementar código no backend que usa essas variáveis!
