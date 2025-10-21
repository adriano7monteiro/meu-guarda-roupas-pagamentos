#!/bin/bash

# Script para configurar Firebase Service Account no Heroku
# Uso: ./set_firebase_env.sh

echo "🔥 Configurando Firebase Service Account no Heroku..."

# Verificar se o arquivo existe
if [ ! -f "firebase-service-account.json" ]; then
    echo "❌ Erro: firebase-service-account.json não encontrado!"
    echo "📂 Execute este script do diretório /app/backend/"
    exit 1
fi

# Ler o conteúdo do arquivo e remover quebras de linha
FIREBASE_JSON=$(cat firebase-service-account.json | tr -d '\n' | tr -d ' ')

# Configurar no Heroku
echo "📤 Enviando para Heroku..."
heroku config:set FIREBASE_SERVICE_ACCOUNT="$FIREBASE_JSON" -a meulookia

if [ $? -eq 0 ]; then
    echo "✅ Firebase Service Account configurado com sucesso no Heroku!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Faça deploy do código: git push heroku main"
    echo "2. Teste as notificações pelo admin"
else
    echo "❌ Erro ao configurar no Heroku"
    exit 1
fi
