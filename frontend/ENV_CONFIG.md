# Configuração de Ambiente (Frontend)

## Arquivo .env

Crie um arquivo `.env` na raiz do diretório `frontend/` com o seguinte conteúdo:

```env
EXPO_TUNNEL_SUBDOMAIN=fashionai-12
EXPO_PACKAGER_HOSTNAME=https://fashionai-fixed.preview.emergentagent.com
EXPO_PUBLIC_BACKEND_URL=https://fashionai-fixed.preview.emergentagent.com
EXPO_USE_FAST_RESOLVER="1"
METRO_CACHE_ROOT=/app/frontend/.metro-cache
```

## Para Desenvolvimento Local

Mantenha apenas:

```env
EXPO_PUBLIC_BACKEND_URL=https://fashionai-fixed.preview.emergentagent.com
```

## Para Produção

Após fazer deploy, atualize para:

```env
EXPO_PUBLIC_BACKEND_URL=https://[sua-url-de-producao]
```
