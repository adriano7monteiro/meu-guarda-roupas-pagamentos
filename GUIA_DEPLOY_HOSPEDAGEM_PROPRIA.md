# 🚀 Guia de Deploy - Hospedagem Própria

## ✅ Preparação Concluída

As seguintes alterações foram feitas para permitir deploy em qualquer hospedagem:

1. ✅ **Removido `emergentintegrations`** do requirements.txt
2. ✅ **Removido import** de emergentintegrations no código
3. ✅ **Migrado para OpenAI oficial** (usando sua chave)

---

## 📋 Pré-requisitos da Hospedagem

Sua hospedagem precisa ter:
- ✅ Python 3.11+
- ✅ pip
- ✅ MongoDB (local ou remoto como MongoDB Atlas)
- ✅ Suporte para FastAPI/Uvicorn
- ✅ Pelo menos 512MB RAM
- ✅ Acesso SSH ou painel de controle

---

## 📁 Arquivos Necessários

Copie do projeto atual:
```
backend/
├── server.py
├── email_service.py
├── requirements.txt
├── .env (criar novo com suas variáveis)
└── (todos os outros arquivos Python)
```

---

## 🔧 Passo a Passo - Deploy

### 1. **Preparar o Servidor**

```bash
# Conectar via SSH
ssh usuario@seu-servidor.com

# Criar diretório do projeto
mkdir -p /var/www/meu-look-ia-backend
cd /var/www/meu-look-ia-backend

# Copiar arquivos (via SCP, FTP, Git, etc)
# Exemplo com SCP:
scp -r /caminho/local/backend/* usuario@servidor:/var/www/meu-look-ia-backend/
```

### 2. **Instalar Python e Dependências**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python 3.11+ (se não tiver)
sudo apt install python3.11 python3.11-venv python3-pip -y

# Criar ambiente virtual
python3.11 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. **Configurar Variáveis de Ambiente**

Criar arquivo `.env` na pasta do backend:

```bash
nano .env
```

Conteúdo do `.env`:
```env
# Banco de Dados
MONGO_URL="mongodb://localhost:27017"
# OU se usar MongoDB Atlas:
# MONGO_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority"
DB_NAME="meu_look_ia_production"

# OpenAI (Obrigatório para sugestões de looks)
OPENAI_API_KEY=sk-proj-sua-chave-aqui

# Fal.ai (Opcional - se usar try-on virtual)
FAL_API_KEY=sua-chave-fal-aqui

# Stripe (Para pagamentos)
STRIPE_SECRET_KEY=sk_live_sua-chave-secreta
STRIPE_PUBLISHABLE_KEY=pk_live_sua-chave-publica
STRIPE_WEBHOOK_SECRET=whsec_seu-webhook-secret

# SendGrid (Para emails)
SENDGRID_API_KEY=SG.sua-chave-sendgrid
SENDER_EMAIL=contato@meulookia.com.br

# JWT Secret (Gerar novo!)
JWT_SECRET=seu-secret-super-seguro-aqui-com-letras-numeros-simbolos
```

**⚠️ IMPORTANTE:**
- Gerar novo `JWT_SECRET` para produção
- Use suas próprias chaves (não as de teste)
- Nunca compartilhe este arquivo

### 4. **Instalar e Configurar MongoDB**

#### Opção A: MongoDB Local

```bash
# Instalar MongoDB
sudo apt install mongodb-org -y

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar status
sudo systemctl status mongod
```

#### Opção B: MongoDB Atlas (Cloud - Recomendado)

1. Criar conta em https://www.mongodb.com/cloud/atlas
2. Criar cluster gratuito
3. Criar usuário do banco
4. Whitelist IP do servidor (ou 0.0.0.0/0)
5. Copiar connection string
6. Atualizar `MONGO_URL` no .env

### 5. **Testar a Aplicação**

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Rodar servidor de teste
python server.py

# OU
uvicorn server:app --host 0.0.0.0 --port 8001

# Testar em outro terminal
curl http://localhost:8001/api/health
```

### 6. **Configurar como Serviço (Systemd)**

Criar arquivo de serviço:

```bash
sudo nano /etc/systemd/system/meu-look-ia.service
```

Conteúdo:
```ini
[Unit]
Description=Meu Look IA Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/meu-look-ia-backend
Environment="PATH=/var/www/meu-look-ia-backend/venv/bin"
ExecStart=/var/www/meu-look-ia-backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ativar e iniciar:
```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar serviço
sudo systemctl enable meu-look-ia

# Iniciar serviço
sudo systemctl start meu-look-ia

# Verificar status
sudo systemctl status meu-look-ia

# Ver logs
sudo journalctl -u meu-look-ia -f
```

### 7. **Configurar Nginx (Proxy Reverso)**

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração
sudo nano /etc/nginx/sites-available/meu-look-ia
```

Conteúdo:
```nginx
server {
    listen 80;
    server_name api.meulookia.com.br;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar configuração:
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/meu-look-ia /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 8. **Configurar SSL (HTTPS) - Certbot**

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d api.meulookia.com.br

# Renovação automática (já configurada)
sudo certbot renew --dry-run
```

---

## 🔍 Verificação Final

Testar todos os endpoints:

```bash
# Health check
curl https://api.meulookia.com.br/api/health

# Login (substitua com credenciais reais)
curl -X POST https://api.meulookia.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","senha":"senha123"}'
```

---

## 📊 Monitoramento

### Ver logs em tempo real:
```bash
sudo journalctl -u meu-look-ia -f
```

### Ver status:
```bash
sudo systemctl status meu-look-ia
```

### Reiniciar serviço:
```bash
sudo systemctl restart meu-look-ia
```

---

## 🐛 Troubleshooting

### Erro: Module not found

```bash
# Reinstalar dependências
source venv/bin/activate
pip install -r requirements.txt --force-reinstall
```

### Erro: Connection refused (MongoDB)

```bash
# Verificar se MongoDB está rodando
sudo systemctl status mongod

# Se não estiver, iniciar
sudo systemctl start mongod
```

### Erro: Permission denied

```bash
# Corrigir permissões
sudo chown -R www-data:www-data /var/www/meu-look-ia-backend
sudo chmod -R 755 /var/www/meu-look-ia-backend
```

### Porta 8001 já em uso

```bash
# Ver o que está usando a porta
sudo lsof -i :8001

# Matar processo (substitua PID)
sudo kill -9 PID
```

---

## 🔄 Atualizações Futuras

Para atualizar o código:

```bash
# 1. Parar serviço
sudo systemctl stop meu-look-ia

# 2. Fazer backup
cp -r /var/www/meu-look-ia-backend /var/www/meu-look-ia-backend.backup

# 3. Atualizar código (Git, SCP, etc)
cd /var/www/meu-look-ia-backend
git pull origin main
# OU
scp -r novo-codigo/* usuario@servidor:/var/www/meu-look-ia-backend/

# 4. Atualizar dependências (se necessário)
source venv/bin/activate
pip install -r requirements.txt --upgrade

# 5. Reiniciar serviço
sudo systemctl start meu-look-ia

# 6. Verificar
sudo systemctl status meu-look-ia
```

---

## ✅ Checklist de Deploy

- [ ] Python 3.11+ instalado
- [ ] Ambiente virtual criado
- [ ] requirements.txt instalado (SEM emergentintegrations)
- [ ] .env configurado com todas as variáveis
- [ ] MongoDB rodando (local ou Atlas)
- [ ] Servidor testado manualmente
- [ ] Serviço systemd criado e ativo
- [ ] Nginx instalado e configurado
- [ ] SSL/HTTPS configurado (Certbot)
- [ ] Domínio apontando para servidor
- [ ] Testes de endpoints funcionando
- [ ] Logs sem erros

---

## 📞 Dicas Importantes

1. **Use MongoDB Atlas** (cloud) - mais confiável que local
2. **Configure backups** do banco de dados
3. **Monitore logs** regularmente
4. **Use HTTPS** sempre (nunca HTTP em produção)
5. **Mantenha .env seguro** - nunca comite no Git
6. **Documente** suas customizações
7. **Teste** em ambiente de staging primeiro

---

**Última Atualização:** 15/10/2025  
**Status:** ✅ Backend pronto para deploy externo  
**Dependências Removidas:** emergentintegrations ✅
