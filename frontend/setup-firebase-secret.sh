#!/bin/bash

# Script para configurar o google-services.json como EAS Secret
# Uso: ./setup-firebase-secret.sh

set -e

echo "🔥 Configurando Firebase google-services.json como EAS Secret"
echo ""

# Verificar se o arquivo existe
if [ ! -f "./google-services.json" ]; then
  echo "❌ Erro: google-services.json não encontrado no diretório atual"
  echo "   Certifique-se de estar no diretório /app/frontend"
  exit 1
fi

# Verificar se eas-cli está instalado
if ! command -v eas &> /dev/null; then
  echo "❌ Erro: EAS CLI não está instalado"
  echo "   Instale com: npm install -g eas-cli"
  exit 1
fi

# Verificar se está logado no EAS
if ! eas whoami &> /dev/null; then
  echo "⚠️  Você não está logado no EAS"
  echo "   Execute: eas login"
  exit 1
fi

echo "✅ Arquivo google-services.json encontrado"
echo "✅ EAS CLI instalado"
echo "✅ Logado no EAS"
echo ""

# Ler o conteúdo do arquivo
GOOGLE_SERVICES_CONTENT=$(cat ./google-services.json)

echo "📝 Criando secret GOOGLE_SERVICES_JSON..."
echo ""

# Criar o secret (usando heredoc para evitar problemas com aspas)
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --value "$GOOGLE_SERVICES_CONTENT" --force

echo ""
echo "✅ Secret GOOGLE_SERVICES_JSON criado com sucesso!"
echo ""
echo "📋 Verificando secrets configurados:"
eas secret:list
echo ""
echo "🚀 Agora você pode executar o build:"
echo "   eas build --platform android --profile production"
echo ""
