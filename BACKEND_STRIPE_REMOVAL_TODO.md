# Endpoints do Stripe para Remover

## ✅ Já Feito:
- Removido import do stripe
- Removida configuração stripe.api_key  
- Atualizado modelo User (removido stripe_customer_id, stripe_subscription_id)
- Criado endpoint /api/verify-purchase para Google Play

## ⏳ Endpoints para Remover:

### 1. /api/criar-assinatura (linha ~1043)
- Cria assinatura no Stripe
- Gera Payment Intent
- **AÇÃO**: Remover completamente

### 2. /api/stripe-config (linha ~1220)
- Retorna publishable key do Stripe
- **AÇÃO**: Remover completamente

### 3. /api/confirmar-pagamento (linha ~1137)
- Confirma pagamento do Stripe
- **AÇÃO**: Remover completamente

### 4. /api/cancelar-assinatura (linha ~1242)
- Cancela assinatura no Stripe
- **AÇÃO**: Manter lógica, mas adaptar para Google Play/Apple

### 5. /api/reativar-assinatura (linha ~1306)
- Reativa assinatura no Stripe
- **AÇÃO**: Manter lógica, mas adaptar para Google Play/Apple

### 6. /api/webhook-stripe (linha ~1506)
- Webhook para eventos do Stripe
- **AÇÃO**: Remover (Google Play tem seu próprio sistema de notificações)

## Observação:
Os endpoints de cancelamento e reativação devem ser mantidos mas adaptados para funcionar com o novo sistema de tokens do Google Play e Apple.
