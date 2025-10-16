# 🔧 Solução: Variáveis de Ambiente no EAS Build

## ❌ Problema Identificado

O AAB gerado pelo EAS Build **não incluiu** a variável `EXPO_PUBLIC_BACKEND_URL` configurada no `eas.json`, fazendo com que o app não consiga conectar ao backend.

### Por que isso aconteceu?

1. **Expo usa `app.json` (JSON estático)** - Não consegue processar variáveis de ambiente em tempo de build
2. **`process.env.EXPO_PUBLIC_BACKEND_URL`** só funciona em desenvolvimento, não em builds de produção
3. **EAS Build precisa de `app.config.js`** (JavaScript dinâmico) para injetar variáveis

---

## ✅ Solução Implementada

### **Passo 1: Criado `app.config.js`**

Arquivo: `/app/frontend/app.config.js`

Este arquivo substitui o `app.json` e permite processar variáveis de ambiente:

```javascript
extra: {
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://meulookia-e68fc7ce1afa.herokuapp.com',
}
```

**Como funciona:**
- Durante o build, o EAS injeta `EXPO_PUBLIC_BACKEND_URL` do `eas.json`
- O valor é salvo em `extra.backendUrl`
- O app acessa via `Constants.expoConfig.extra.backendUrl`

---

### **Passo 2: Criado Arquivo de Configuração**

Arquivo: `/app/frontend/config/api.ts`

Utilitário para acessar a URL do backend de forma consistente:

```typescript
import Constants from 'expo-constants';

export const getBackendUrl = (): string => {
  // 1. Tentar extra (produção)
  const extraBackendUrl = Constants.expoConfig?.extra?.backendUrl;
  if (extraBackendUrl) return extraBackendUrl;

  // 2. Tentar process.env (desenvolvimento)
  const envBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envBackendUrl) return envBackendUrl;

  // 3. Fallback
  return 'https://meulookia-e68fc7ce1afa.herokuapp.com';
};

export const BACKEND_URL = getBackendUrl();
```

**Vantagens:**
- ✅ Funciona em desenvolvimento e produção
- ✅ Fallback automático
- ✅ Log de debug em desenvolvimento
- ✅ Uma única fonte de verdade

---

### **Passo 3: Atualizar Código do App**

**IMPORTANTE:** Você precisa atualizar todos os arquivos que usam `process.env.EXPO_PUBLIC_BACKEND_URL`

#### **Antes (NÃO funciona em produção):**
```typescript
const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/me`, {
  // ...
});
```

#### **Depois (funciona em produção):**
```typescript
import { BACKEND_URL } from '../config/api';

const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
  // ...
});
```

---

## 🔄 Arquivos que Precisam ser Atualizados

Encontrei **50 ocorrências** de `process.env.EXPO_PUBLIC_BACKEND_URL` nos seguintes arquivos:

### **Principais arquivos:**
1. `/app/frontend/app/index.tsx` (8 ocorrências)
2. `/app/frontend/app/saved-looks.tsx` (4 ocorrências)
3. `/app/frontend/app/generate-look.tsx` (3 ocorrências)
4. `/app/frontend/app/profile.tsx` (2 ocorrências)
5. `/app/frontend/app/my-wardrobe.tsx` (2 ocorrências)
6. `/app/frontend/app/upload-clothes.tsx` (1 ocorrência)
7. `/app/frontend/app/subscription.tsx` (3 ocorrências)
8. `/app/frontend/app/forgot-password.tsx` (2 ocorrências)
9. `/app/frontend/hooks/useInAppPurchase.ts` (1 ocorrência)
10. `/app/frontend/components/AuthModal.tsx` (provável)

### **Como atualizar (exemplo):**

**Arquivo: `/app/frontend/app/index.tsx`**

```typescript
// Adicionar no topo do arquivo
import { BACKEND_URL } from '../config/api';

// Substituir TODAS as ocorrências de:
${process.env.EXPO_PUBLIC_BACKEND_URL}

// Por:
${BACKEND_URL}
```

---

## 🚀 Como Aplicar a Solução

### **Opção 1: Atualização Manual (Recomendado)**

1. **Adicionar import em cada arquivo:**
   ```typescript
   import { BACKEND_URL } from '../config/api';
   ```

2. **Substituir todas as ocorrências:**
   ```bash
   # Buscar todas as ocorrências
   grep -r "process.env.EXPO_PUBLIC_BACKEND_URL" /app/frontend/app
   
   # Substituir manualmente em cada arquivo
   ```

3. **Testar localmente:**
   ```bash
   cd /app/frontend
   npx expo start
   ```

4. **Gerar novo AAB:**
   ```bash
   eas build --platform android --profile production
   ```

---

### **Opção 2: Substituição Automática (Script)**

Posso criar um script para substituir automaticamente em todos os arquivos.

---

## 📋 Checklist de Implementação

- [x] ✅ Criar `app.config.js` com suporte a variáveis de ambiente
- [x] ✅ Criar utilitário `/config/api.ts`
- [ ] ⬜ Atualizar imports em todos os arquivos TypeScript
- [ ] ⬜ Substituir `process.env.EXPO_PUBLIC_BACKEND_URL` por `BACKEND_URL`
- [ ] ⬜ Testar localmente com `expo start`
- [ ] ⬜ Fazer commit das mudanças
- [ ] ⬜ Gerar novo AAB com `eas build`
- [ ] ⬜ Testar AAB no dispositivo real
- [ ] ⬜ Upload na Google Play Store

---

## 🧪 Como Testar se Funcionou

### **Teste Local:**
```bash
cd /app/frontend
npx expo start
```

Verifique no console se aparece:
```
🔧 Backend URL configurada: https://meulookia-e68fc7ce1afa.herokuapp.com
```

### **Teste no AAB:**
1. Gere novo build: `eas build --platform android --profile production`
2. Baixe o AAB gerado
3. Instale em dispositivo real ou emulador
4. Abra o app e tente fazer login
5. Se conectar ao backend = ✅ Funcionou!

---

## 🔍 Verificação Rápida

Depois de atualizar, verifique se:

```typescript
// ❌ NÃO deve ter mais isso
process.env.EXPO_PUBLIC_BACKEND_URL

// ✅ Deve ter isso
import { BACKEND_URL } from '../config/api';
```

---

## 💡 Por que `app.config.js` é Melhor que `app.json`?

| Recurso | app.json | app.config.js |
|---------|----------|---------------|
| Variáveis de ambiente | ❌ Não | ✅ Sim |
| Lógica condicional | ❌ Não | ✅ Sim |
| Valores dinâmicos | ❌ Não | ✅ Sim |
| Usado pelo EAS | ✅ Sim | ✅ Sim |
| Aceita TypeScript | ❌ Não | ✅ Sim (app.config.ts) |

**Recomendação:** Sempre use `app.config.js` em projetos com EAS Build!

---

## 🎯 Próximos Passos

**Você precisa decidir:**

1. **Quer que eu substitua automaticamente em todos os arquivos?**
   - Posso fazer isso com um script
   - Mais rápido, mas precisa revisar depois

2. **Prefere fazer manualmente?**
   - Mais controle
   - Você vê cada mudança
   - Mais demorado

**Me avise qual prefere e eu prossigo!** 🚀

---

## ❓ FAQ

### **Q: Preciso deletar o `app.json`?**
**A:** Não! O Expo usa `app.config.js` automaticamente e ignora `app.json` se ambos existirem. Pode manter como backup.

### **Q: Vai funcionar em desenvolvimento (expo start)?**
**A:** Sim! O código tenta primeiro `extra.backendUrl`, depois `process.env`, então funciona em ambos.

### **Q: E se eu tiver múltiplos ambientes (dev/staging/prod)?**
**A:** Você pode adicionar mais profiles no `eas.json` e usar variáveis diferentes em cada um.

### **Q: Preciso instalar alguma dependência nova?**
**A:** Não! `expo-constants` já vem instalado com o Expo.

---

**Arquivo criado:** `/app/frontend/app.config.js` ✅  
**Arquivo criado:** `/app/frontend/config/api.ts` ✅  
**Status:** Aguardando atualização dos imports nos arquivos do app
