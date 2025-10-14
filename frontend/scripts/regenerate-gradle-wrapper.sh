#!/bin/bash
# Script para regenerar o Gradle Wrapper

echo "🔧 Regenerando Gradle Wrapper..."

cd "$(dirname "$0")/../android"

# Verificar se o Gradle está instalado
if ! command -v gradle &> /dev/null; then
    echo "❌ Gradle não está instalado!"
    echo ""
    echo "Instale o Gradle:"
    echo "macOS: brew install gradle"
    echo "Linux: sudo apt-get install gradle"
    echo "Windows: https://gradle.org/install/"
    exit 1
fi

echo "✅ Gradle encontrado: $(gradle --version | head -1)"

# Regenerar wrapper
echo "📦 Gerando Gradle Wrapper..."
gradle wrapper --gradle-version=8.10.2 --distribution-type=all

echo ""
echo "✅ Gradle Wrapper regenerado com sucesso!"
echo ""
echo "Arquivos criados:"
ls -lh gradle/wrapper/

echo ""
echo "🚀 Agora você pode executar:"
echo "./gradlew clean"
echo "./gradlew app:installDebug"
