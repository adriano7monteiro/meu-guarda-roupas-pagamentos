# Configuração de Ambiente (Backend)

## Arquivo .env

Crie um arquivo `.env` na raiz do diretório `backend/` com o seguinte conteúdo:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
EMERGENT_LLM_KEY=sk-emergent-55869Ff778123962f1
FAL_API_KEY=virtuallook-1:4340b42a760df77a641cd8d5c0794b8b
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51SHSpFDGCWpP7oWO6LM77jTz9HYKiqqJsIgfyhMyhBrpIobpXW84HqfdI4d8PqsCDgZX572D4J7zHuMel2MxiRCI00ORm43AvR
```

## ⚠️ IMPORTANTE - Segurança

**NUNCA** commite este arquivo `.env` em repositórios públicos!

As chaves acima incluem:
- Chave EMERGENT_LLM_KEY (OpenAI)
- Chave FAL_API_KEY (Fal.ai)
- **Chaves LIVE do Stripe** (processamento de pagamentos reais!)

## Para Produção

Ao fazer deploy:
1. Configure as variáveis de ambiente no servidor
2. Use secrets management
3. Nunca exponha chaves em código
