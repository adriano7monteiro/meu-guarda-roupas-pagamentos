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

# Ler o conteúdo do arquivo, minificar JSON e escapar corretamente
echo "📝 Processando arquivo JSON..."
FIREBASE_JSON=$(cat firebase-service-account.json | jq -c '.')

if [ $? -ne 0 ]; then
    echo "❌ Erro ao processar JSON. Certifique-se que jq está instalado: apt-get install jq"
    exit 1
fi

echo "📏 Tamanho do JSON: ${#FIREBASE_JSON} caracteres"
echo "📝 Preview (primeiros 100 chars): ${FIREBASE_JSON:0:100}..."

# Configurar no Heroku
echo "📤 Enviando para Heroku..."
heroku config:set FIREBASE_SERVICE_ACCOUNT="$FIREBASE_JSON" -a meulookia

if [ $? -eq 0 ]; then
    echo "✅ Firebase Service Account configurado com sucesso no Heroku!"
    echo ""
    echo "🔍 Verificando configuração..."
    heroku config:get FIREBASE_SERVICE_ACCOUNT -a meulookia | head -c 100
    echo "..."
    echo ""
    echo "📝 Próximos passos:"
    echo "1. O Heroku irá reiniciar automaticamente o dyno"
    echo "2. Aguarde ~1 minuto"
    echo "3. Teste enviando uma notificação pelo admin"
    echo "4. Verifique os logs: heroku logs --tail -a meulookia"
else
    echo "❌ Erro ao configurar no Heroku"
    exit 1
fi
