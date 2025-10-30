# 🚀 Guia Rápido: Configurar Firebase para EAS Build

## ⚡ TL;DR (Resumo Executivo)

```bash
# Passo 1: Configurar o secret (UMA VEZ APENAS)
cd /app/frontend
./setup-firebase-secret.sh

# Passo 2: Fazer o build
eas build --platform android --profile production
```

**Pronto! 🎉**

---

## 📖 O que foi feito?

✅ **Problema resolvido:** `google-services.json` estava causando erro no EAS build  
✅ **Solução:** Uso de EAS Secrets para fornecer o arquivo durante builds  
✅ **Segurança mantida:** Arquivo permanece no `.gitignore`  
✅ **Desenvolvimento local:** Continua funcionando normalmente  

---

## 🔧 Configuração (Apenas 1 vez)

### 1. Execute o script de configuração

```bash
cd /app/frontend
./setup-firebase-secret.sh
```

**O script irá:**
- ✅ Verificar se o arquivo existe
- ✅ Verificar se você está logado no EAS
- ✅ Criar o secret `GOOGLE_SERVICES_JSON`
- ✅ Confirmar que o secret foi criado

### 2. Verifique se foi configurado

```bash
eas secret:list
```

**Você deve ver:**
```
┌────────────────────────┐
│ GOOGLE_SERVICES_JSON   │
└────────────────────────┘
```

---

## 🚀 Fazer Build

Após configurar o secret (passo acima), você pode fazer builds normalmente:

### Build de Produção (AAB para Google Play)
```bash
cd /app/frontend
eas build --platform android --profile production
```

### Build de Teste (APK para instalação direta)
```bash
cd /app/frontend
eas build --platform android --profile production-apk
```

---

## ✅ Testar Notificações Push

Após o build ser concluído e instalado:

1. **Abra o app no dispositivo Android**
2. **Faça login** com seu usuário
3. **Vá em Perfil → "Verificar Notificações"**
4. **Abra o painel admin:**
   - URL: `https://meulookia-e68fc7ce1afa.herokuapp.com/api/admin_lojinha.html`
   - Vá na aba "Push Notifications"
   - Digite uma mensagem e clique "Enviar para Todos"
5. **Verifique se a notificação chega no dispositivo**

---

## 🐛 Problemas Comuns

### ❌ Erro: "google-services.json is missing"

**Solução:**
```bash
cd /app/frontend
./setup-firebase-secret.sh
```

### ❌ Erro: "EAS CLI not found"

**Solução:**
```bash
npm install -g eas-cli
eas login
```

### ❌ Notificação não chega no dispositivo

**Verifique:**
1. Build foi feito APÓS configurar o secret?
2. App tem permissão de notificações?
3. Token FCM foi registrado? (veja logs do app)
4. Backend está enviando corretamente? (veja logs do backend)

---

## 📚 Documentação Completa

- **Setup Detalhado:** `/app/FIREBASE_EAS_SETUP.md`
- **Solução Técnica:** `/app/SOLUCAO_FIREBASE_EAS.md`

---

## 🎯 Checklist Final

- [ ] Configurei o EAS Secret (`./setup-firebase-secret.sh`)
- [ ] Verifiquei que o secret existe (`eas secret:list`)
- [ ] Executei o build (`eas build --platform android --profile production`)
- [ ] Instalei o app no dispositivo Android
- [ ] Testei as notificações push
- [ ] ✅ **TUDO FUNCIONANDO!**

---

**Nota:** Você só precisa configurar o secret UMA VEZ. Depois disso, todos os builds futuros usarão automaticamente essa configuração.
