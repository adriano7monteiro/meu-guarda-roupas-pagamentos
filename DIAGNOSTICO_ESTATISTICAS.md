# 🔍 Diagnóstico: Estatísticas Não Funcionando

## 🎯 O Problema

As estatísticas na home (Roupas, Looks Criados, Favoritos) não estão aparecendo ou mostram "0".

---

## 📊 Como as Estatísticas Funcionam

**Frontend faz 3 requisições quando abre a home:**

1. `GET /api/roupas?skip=0&limit=1` → Retorna `{total: X, items: []}`
2. `GET /api/looks?skip=0&limit=1` → Retorna `{total: X, items: []}`
3. `GET /api/looks/stats/favoritos` → Retorna `{count: X}`

---

## 🧪 Testes de Diagnóstico

Execute estes comandos **no seu terminal local** para testar o Heroku:

### 1. **Testar Health Check**

```bash
curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

❌ **Se retornar "database": "disconnected"** → MongoDB não está configurado!

---

### 2. **Testar Status Detalhado**

```bash
curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/status
```

**Resposta esperada:**
```json
{
  "status": "online",
  "database": {
    "status": "connected",
    "name": "meu_look_ia_production"
  },
  "statistics": {
    "users": 0,
    "clothing_items": 0,
    "looks": 0,
    "suggestions": 0
  }
}
```

**Se todas as estatísticas forem "0"** → Banco vazio (normal se for novo)

---

### 3. **Testar com Token de Autenticação**

Primeiro, faça login para obter token:

```bash
# Registrar usuário (se não tiver)
curl -X POST https://meulookia-e68fc7ce1afa.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste",
    "email": "teste@teste.com",
    "senha": "senha123"
  }'

# Fazer login
curl -X POST https://meulookia-e68fc7ce1afa.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@teste.com",
    "senha": "senha123"
  }'
```

**Copie o token da resposta:** `"token": "eyJhbGc..."`

---

### 4. **Testar Endpoints de Estatísticas** (com token)

```bash
# Substitua SEU_TOKEN_AQUI pelo token copiado acima

# Teste 1: Contagem de roupas
curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/roupas?skip=0&limit=1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Teste 2: Contagem de looks
curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/looks?skip=0&limit=1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Teste 3: Contagem de favoritos
curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/looks/stats/favoritos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🐛 Possíveis Causas e Soluções

### ❌ Causa 1: MongoDB Não Configurado

**Sintomas:**
- Health check retorna `"database": "disconnected"`
- Erro 500 nos endpoints
- Logs mostram erro de conexão

**Solução:**
```bash
# Verificar se MONGO_URL está configurado
heroku config:get MONGO_URL

# Se vazio, configure MongoDB Atlas
heroku config:set MONGO_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority"
heroku config:set DB_NAME="meu_look_ia_production"

# Reiniciar app
heroku restart

# Verificar logs
heroku logs --tail
```

---

### ❌ Causa 2: Banco de Dados Vazio

**Sintomas:**
- Endpoints retornam `{total: 0}`
- Mas health check mostra "connected"

**Solução:**
- ✅ Normal se você acabou de criar o banco
- Crie dados de teste (cadastre usuário, adicione roupas, etc)

**Criar dados de teste via API:**

```bash
# 1. Fazer login e pegar token
TOKEN=$(curl -s -X POST https://meulookia-e68fc7ce1afa.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","senha":"senha123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Adicionar roupa de teste
curl -X POST https://meulookia-e68fc7ce1afa.herokuapp.com/api/upload-roupa \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Camiseta Azul",
    "tipo": "camiseta",
    "cor": "azul",
    "estilo": "casual",
    "imagem_original": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'

# 3. Verificar se funcionou
curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/roupas?skip=0&limit=1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### ❌ Causa 3: CORS Bloqueando Requisições

**Sintomas:**
- Frontend não consegue fazer requisições
- Console do navegador mostra erro de CORS

**Verificar CORS no backend:**

```bash
# Ver logs do Heroku em tempo real
heroku logs --tail

# Fazer requisição do frontend e ver se aparece erro de CORS
```

**Solução - Adicionar CORS ao backend:**

No arquivo `server.py`, verifique se tem:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### ❌ Causa 4: Frontend com URL Errada

**Sintomas:**
- Requisições não chegam no Heroku
- Erro de conexão no app

**Verificar frontend:**

No arquivo `.env` do frontend (ou variáveis do build):

```env
EXPO_PUBLIC_BACKEND_URL=https://meulookia-e68fc7ce1afa.herokuapp.com
```

**⚠️ IMPORTANTE:** 
- Sem `/api` no final!
- Sem barra `/` no final!
- Deve ser HTTPS (não HTTP)

Se alterou, precisa **rebuild do APK**:
```bash
cd /app/frontend
eas build --platform android --profile preview
```

---

### ❌ Causa 5: Token Expirado ou Inválido

**Sintomas:**
- Erro 401 Unauthorized
- Estatísticas mostram 0

**Solução:**
- Fazer logout e login novamente no app
- Verificar se JWT_SECRET está configurado no Heroku:

```bash
heroku config:get JWT_SECRET

# Se vazio, configurar
heroku config:set JWT_SECRET="sua-chave-segura-aqui"
```

---

## 🔧 Checklist Completo

Execute em ordem:

- [ ] **1. Health check retorna "healthy"**
  ```bash
  curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/health
  ```

- [ ] **2. Database status é "connected"**
  ```bash
  curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/status
  ```

- [ ] **3. MONGO_URL está configurado**
  ```bash
  heroku config:get MONGO_URL
  ```

- [ ] **4. Consegue fazer login**
  ```bash
  curl -X POST https://meulookia-e68fc7ce1afa.herokuapp.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@teste.com","senha":"senha123"}'
  ```

- [ ] **5. Endpoints de estatísticas retornam dados**
  ```bash
  curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/roupas?skip=0&limit=1 \
    -H "Authorization: Bearer SEU_TOKEN"
  ```

- [ ] **6. Frontend tem URL correta**
  ```env
  EXPO_PUBLIC_BACKEND_URL=https://meulookia-e68fc7ce1afa.herokuapp.com
  ```

- [ ] **7. JWT_SECRET configurado**
  ```bash
  heroku config:get JWT_SECRET
  ```

---

## 📱 Como Verificar no App Mobile

1. **Abra o app**
2. **Faça login**
3. **Na home, veja se números aparecem**
4. **Se aparecer "0 0 0":**
   - Pode ser banco vazio (normal)
   - Ou erro de conexão

5. **Para testar, adicione uma roupa:**
   - Vá em "Meu Guarda-Roupas"
   - Adicione uma roupa
   - Volte para home
   - Deveria mostrar "1" em Roupas

---

## 🔍 Ver Logs do Heroku em Tempo Real

```bash
# Terminal 1: Ver logs
heroku logs --tail

# Terminal 2: Abrir app e fazer ações
# Ver se aparecem requisições nos logs
```

**Logs esperados quando abre a home:**
```
INFO: GET /api/roupas?skip=0&limit=1 HTTP/1.1 200 OK
INFO: GET /api/looks?skip=0&limit=1 HTTP/1.1 200 OK
INFO: GET /api/looks/stats/favoritos HTTP/1.1 200 OK
```

Se não aparecer nada → Frontend não está acessando o backend!

---

## 🆘 Ainda Não Funciona?

**Me envie:**

1. **Resultado do health check:**
   ```bash
   curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/health
   ```

2. **Logs do Heroku:**
   ```bash
   heroku logs --tail > logs.txt
   # Abra o app, espere 10 segundos, Ctrl+C
   # Me envie logs.txt
   ```

3. **Variáveis configuradas:**
   ```bash
   heroku config
   # Me envie (sem mostrar valores sensíveis)
   ```

4. **URL do frontend:**
   - Me confirme qual URL está no `.env` ou build

---

## ✅ Solução Rápida (90% dos Casos)

```bash
# 1. Configure MongoDB Atlas
heroku config:set MONGO_URL="mongodb+srv://..."

# 2. Configure JWT_SECRET
heroku config:set JWT_SECRET="j1Y_XCGjfyQr2a1HyR7G4LHmSgr0GVDnSReutrAHZ4vIwieHTvlnpTvq-n18AQsklGF7_nodp9Q9UP-FH_bRLQ"

# 3. Reinicie
heroku restart

# 4. Teste health
curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/health

# 5. Se health OK, crie dados de teste no app
```

Boa sorte! 🚀
