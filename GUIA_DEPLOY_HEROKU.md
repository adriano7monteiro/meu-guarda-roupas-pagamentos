# 🚀 Guia Completo: Deploy no Heroku

## ✅ Arquivos Criados

Já foram criados os arquivos necessários em `/app/backend/`:
- ✅ **Procfile** - Diz ao Heroku como iniciar o app
- ✅ **runtime.txt** - Especifica Python 3.11.9
- ✅ **requirements.txt** - Já existe (sem emergentintegrations)

---

## 📋 Passo a Passo Completo

### 1. **Instalar Heroku CLI** (se não tiver)

```bash
# macOS (Homebrew)
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Windows
# Download: https://devcenter.heroku.com/articles/heroku-cli
```

### 2. **Login no Heroku**

```bash
heroku login
# Abrirá navegador para autenticar
```

### 3. **Criar App no Heroku** (se ainda não criou)

```bash
# Na pasta /app/backend
cd /app/backend

# Criar app (nome único)
heroku create meulookia

# OU conectar a app existente
heroku git:remote -a meulookia-e68fc7ce1afa
```

### 4. **Configurar MongoDB Atlas** (OBRIGATÓRIO)

⚠️ Heroku não tem MongoDB nativo. Use MongoDB Atlas (gratuito):

**4.1. Criar conta MongoDB Atlas:**
- Acesse: https://www.mongodb.com/cloud/atlas/register
- Crie conta gratuita

**4.2. Criar Cluster:**
- Escolha M0 (Free)
- Região: us-east-1 (mesma do Heroku)
- Criar cluster

**4.3. Configurar Acesso:**
- Database Access → Add User
  - Username: meulookia
  - Password: [senha forte]
  - Permissões: Read/Write
  
- Network Access → Add IP
  - Permitir de qualquer lugar: `0.0.0.0/0`
  - (Para produção, whitelist IPs específicos)

**4.4. Obter Connection String:**
- Clusters → Connect → Connect your application
- Copiar string de conexão:
  ```
  mongodb+srv://meulookia:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```

### 5. **Configurar Variáveis de Ambiente no Heroku**

```bash
# MongoDB (OBRIGATÓRIO - Use MongoDB Atlas)
heroku config:set MONGO_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority"
heroku config:set DB_NAME="meu_look_ia_production"

# JWT Secret (OBRIGATÓRIO - Gere um novo!)
heroku config:set JWT_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(64))')"

# OpenAI (OBRIGATÓRIO para sugestões de looks)
heroku config:set OPENAI_API_KEY="sk-proj-sua-chave-aqui"

# Stripe (OBRIGATÓRIO para pagamentos)
heroku config:set STRIPE_SECRET_KEY="sk_live_sua-chave"
heroku config:set STRIPE_PUBLISHABLE_KEY="pk_live_sua-chave"
heroku config:set STRIPE_WEBHOOK_SECRET="whsec_seu-webhook-secret"

# SendGrid (OBRIGATÓRIO para emails)
heroku config:set SENDGRID_API_KEY="SG.sua-chave"
heroku config:set SENDER_EMAIL="contato@meulookia.com.br"

# Fal.ai (OPCIONAL - se usar try-on)
heroku config:set FAL_API_KEY="sua-chave-fal"

# Verificar todas as variáveis
heroku config
```

### 6. **Preparar Código para Deploy**

```bash
cd /app/backend

# Inicializar Git (se ainda não estiver)
git init

# Adicionar arquivos
git add .

# Commit
git commit -m "Deploy backend Meu Look IA"
```

### 7. **Deploy para Heroku**

```bash
# Push para Heroku
git push heroku main

# OU se sua branch principal é master
git push heroku master

# Acompanhar logs
heroku logs --tail
```

### 8. **Escalar Dyno** (Iniciar processo web)

```bash
# Garantir que pelo menos 1 dyno web está rodando
heroku ps:scale web=1

# Verificar status
heroku ps
```

### 9. **Verificar se Funcionou**

```bash
# Testar health check
curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/health

# Testar status
curl https://meulookia-e68fc7ce1afa.herokuapp.com/api/status

# Abrir no navegador
heroku open
```

---

## 🔍 Troubleshooting

### Erro H14: "No web processes running"

**Causa:** Procfile ausente ou incorreto

**Solução:**
```bash
# Verificar se Procfile existe
ls -la Procfile

# Conteúdo deve ser:
cat Procfile
# web: uvicorn server:app --host 0.0.0.0 --port $PORT

# Redeployar
git add Procfile
git commit -m "Add Procfile"
git push heroku main

# Escalar
heroku ps:scale web=1
```

### Erro: "Application error"

**Ver logs:**
```bash
heroku logs --tail
```

**Causas comuns:**
1. Variáveis de ambiente faltando
2. MongoDB não configurado
3. Dependências faltando

### Erro: "Cannot connect to MongoDB"

**Verificar:**
```bash
# Ver variável
heroku config:get MONGO_URL

# Se vazia, configurar MongoDB Atlas
heroku config:set MONGO_URL="mongodb+srv://..."
```

### Erro: "Module not found"

**Reinstalar dependências:**
```bash
# Limpar cache do Heroku
heroku repo:purge_cache

# Redeployar
git commit --allow-empty -m "Rebuild"
git push heroku main
```

---

## 📊 Monitoramento

### Ver logs em tempo real:
```bash
heroku logs --tail
```

### Ver métricas:
```bash
heroku ps
heroku metrics:web
```

### Ver variáveis de ambiente:
```bash
heroku config
```

---

## 🔒 Segurança

### 1. **HTTPS Automático**
✅ Heroku já fornece HTTPS automático

### 2. **Domínio Customizado** (Opcional)

```bash
# Adicionar domínio
heroku domains:add api.meulookia.com.br

# Ver DNS targets
heroku domains

# Configurar no seu DNS:
# CNAME: api.meulookia.com.br → xxx.herokudns.com
```

### 3. **SSL Certificado**

```bash
# Heroku fornece SSL grátis
# Verificar SSL
heroku certs
```

---

## 💰 Custos

**Plano Gratuito (Eco Dyno):**
- ✅ 1000 horas/mês grátis
- ⚠️ Dorme após 30 min de inatividade
- ⚠️ Demora ~5s para acordar

**Plano Basic ($7/mês):**
- ✅ Sempre ativo (não dorme)
- ✅ Melhor para produção
- ✅ Métricas

**Plano Standard ($25+/mês):**
- ✅ Auto-scaling
- ✅ Mais recursos
- ✅ Suporte

---

## 🎯 Checklist de Deploy

- [ ] Procfile criado
- [ ] runtime.txt criado
- [ ] requirements.txt atualizado (sem emergentintegrations)
- [ ] MongoDB Atlas configurado
- [ ] Connection string do MongoDB copiada
- [ ] Todas as variáveis de ambiente configuradas no Heroku
- [ ] JWT_SECRET gerado novo e forte
- [ ] Git inicializado e commit feito
- [ ] Push para Heroku realizado
- [ ] Web dyno escalado (`heroku ps:scale web=1`)
- [ ] Health check testado e funcionando
- [ ] Logs verificados sem erros

---

## 🔄 Atualizar App Depois

Sempre que fizer alterações:

```bash
cd /app/backend

# Commit mudanças
git add .
git commit -m "Descrição da mudança"

# Push para Heroku
git push heroku main

# Ver se deu certo
heroku logs --tail
```

---

## 📞 Links Úteis

- **Heroku Dashboard:** https://dashboard.heroku.com/apps/meulookia-e68fc7ce1afa
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Heroku Docs:** https://devcenter.heroku.com/
- **Logs:** `heroku logs --tail`

---

## 🚨 IMPORTANTE

### Diferença de Ambiente

**Desenvolvimento (Emergent):**
- MongoDB local
- Variáveis no .env

**Produção (Heroku):**
- MongoDB Atlas (cloud)
- Variáveis no Heroku Config Vars
- Não usar arquivo .env (Heroku ignora)

### Configurar Frontend

Depois que o backend estiver funcionando, atualize o frontend:

```env
# frontend/.env
EXPO_PUBLIC_BACKEND_URL=https://meulookia-e68fc7ce1afa.herokuapp.com
```

Rebuild o APK com a nova URL.

---

## ✅ Solução do Erro H14

O erro que você está tendo é porque:
1. ❌ Procfile estava faltando
2. ✅ Agora está criado
3. 🔄 Você precisa fazer deploy novamente

**Comandos para resolver:**

```bash
cd /app/backend

# Adicionar Procfile e runtime.txt
git add Procfile runtime.txt
git commit -m "Add Heroku Procfile and runtime"

# Push para Heroku
git push heroku main

# Escalar dyno web
heroku ps:scale web=1

# Verificar
heroku ps
heroku logs --tail
```

Após isso, o erro H14 deve sumir! 🎉

---

**Última atualização:** 15/10/2025
**Status:** ✅ Arquivos prontos para Heroku
