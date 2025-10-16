# 📦 Guia: Gerar AAB Assinado para Google Play

## 🎯 O Que é AAB?

**AAB (Android App Bundle)** é o formato exigido pelo Google Play Console para publicar apps. O Expo/EAS gera e assina automaticamente para você!

---

## 🚀 PASSO A PASSO

### **1. Login no EAS (Se ainda não fez)**

```bash
cd /app/frontend
eas login
```

**Digite:**
- Email da sua conta Expo
- Senha

---

### **2. Configurar o Projeto (Se ainda não fez)**

```bash
cd /app/frontend
eas build:configure
```

Isso vai:
- Criar/atualizar `eas.json`
- Linkar o projeto à sua conta Expo

---

### **3. Gerar AAB de Produção (Assinado automaticamente)**

```bash
cd /app/frontend
eas build --profile production --platform android
```

**O que acontece:**
1. EAS pergunta se quer gerar nova keystore ou usar existente
   - **Primeira vez:** Escolha "Generate new keystore" (EAS gera e guarda para você)
   - **Já tem keystore:** Escolha "Use existing keystore"
2. EAS faz upload do projeto
3. EAS compila na nuvem (5-15 minutos)
4. EAS assina o AAB automaticamente com sua keystore
5. EAS retorna link de download

---

### **4. Baixar o AAB**

Após o build concluir, você verá:

```
✅ Build finished
   https://expo.dev/artifacts/eas/xxxxx.aab
```

**Clique no link** ou acesse: https://expo.dev/accounts/[seu-usuario]/projects/[projeto]/builds

---

### **5. Fazer Upload no Google Play Console**

1. Acesse Google Play Console
2. Vá em **"Produção" → "Criar nova versão"**
3. Clique em **"Fazer upload"**
4. Selecione o arquivo `.aab` que você baixou
5. Preencha notas da versão
6. Clique em **"Revisar versão"** → **"Iniciar lançamento"**

---

## ⚡ ATALHOS ÚTEIS

### Gerar AAB mais Rápido (Preview/Teste Interno)

```bash
eas build --profile preview --platform android
```

**Diferença:**
- `production`: Para publicar na Play Store (mais completo)
- `preview`: Para testes internos (mais rápido)

---

### Gerar APK em vez de AAB (Para instalar direto no celular)

```bash
eas build --profile production-apk --platform android
```

---

## 🔑 Sobre a Keystore

**O que é?**
- Arquivo que assina seu app
- Google Play usa para verificar que o app é seu
- EAS guarda na nuvem automaticamente

**IMPORTANTE:**
- ✅ EAS gerencia tudo automaticamente
- ✅ Não precisa fazer nada manual
- ✅ Cada build usa a mesma keystore
- ⚠️ Nunca perca acesso à sua conta Expo!

---

## 📋 Checklist Antes de Buildar

- [ ] `app.json` tem nome, versão, ícone configurados?
- [ ] Package name está correto? (ex: `com.meulookia.app`)
- [ ] Logado no EAS? (`eas whoami`)
- [ ] Produtos criados no Google Play Console?

---

## 🛠️ Configurações Atuais

Já configurei o `eas.json` com:

```json
{
  "build": {
    "production": {
      "autoIncrement": true,  // Incrementa versão automaticamente
      "android": {
        "buildType": "app-bundle"  // Gera AAB
      }
    },
    "production-apk": {
      "android": {
        "buildType": "apk"  // Gera APK
      }
    }
  }
}
```

---

## ❓ Perguntas Frequentes

**"Quanto tempo demora?"**
→ 5-15 minutos (primeira vez pode demorar mais)

**"É grátis?"**
→ Expo dá créditos gratuitos. Depois é pago mas barato.

**"Preciso do Android Studio?"**
→ Não! EAS compila tudo na nuvem.

**"Como atualizar o app depois?"**
→ Mesmo comando. O `autoIncrement` aumenta a versão automaticamente.

**"E se der erro?"**
→ EAS mostra logs detalhados. Me mande o erro!

---

## 🚨 Comandos Prontos

```bash
# 1. Login
cd /app/frontend && eas login

# 2. Gerar AAB de Produção
cd /app/frontend && eas build --profile production --platform android

# 3. Ver builds anteriores
eas build:list

# 4. Ver detalhes do último build
eas build:view
```

---

## 🎯 PRÓXIMO PASSO

Execute agora:

```bash
cd /app/frontend
eas build --profile production --platform android
```

E me avise quando estiver buildando ou se der algum erro! 🚀
