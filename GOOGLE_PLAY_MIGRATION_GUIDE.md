# Guia de Migração: Stripe → Google Play Billing

## ✅ Frontend - CONCLUÍDO

### Mudanças Implementadas:
1. ✅ Instalada biblioteca `react-native-iap@14.4.16`
2. ✅ Removida biblioteca `@stripe/stripe-react-native`
3. ✅ Criado hook `useInAppPurchase.ts` para gerenciar compras
4. ✅ Atualizada tela `subscription.tsx` para usar Google Play Billing
5. ✅ Removidos arquivos `stripeProvider.native.tsx` e `stripeProvider.web.tsx`
6. ✅ Substituídos todos os estados e funções do Stripe

### Como Funciona o Frontend:
- Hook `useInAppPurchase` inicializa conexão com Google Play
- Carrega lista de assinaturas disponíveis
- Ao clicar em "Assinar", chama `purchaseSubscription(sku)`
- Google Play exibe tela nativa de pagamento
- Após pagamento, envia recibo para backend via `/api/verify-purchase`
- Backend valida recibo e ativa assinatura

---

## 🔧 Backend - EM ANDAMENTO

### O que PRECISA ser feito:

#### 1. Criar Endpoint `/api/verify-purchase`
```python
@api_router.post("/verify-purchase")
async def verify_purchase(
    purchase_data: dict,
    current_user: dict = Depends(security)
):
    """
    Verifica recibo de compra do Google Play e ativa assinatura
    
    Recebe:
    - platform: "android" ou "ios"
    - productId: ID do produto ("mensal", "semestral", "anual")
    - purchaseToken: Token da compra do Google Play
    - transactionReceipt: Recibo base64
    
    Valida com Google Play API e ativa plano do usuário
    """
    pass
```

#### 2. Remover Endpoints do Stripe
Endpoints a remover:
- `/api/criar-assinatura` (POST)
- `/api/confirmar-pagamento` (POST)
- `/api/confirmar-assinatura` (POST)
- `/api/stripe-config` (GET)
- `/api/webhook-stripe` (POST)

#### 3. Atualizar Modelo de Usuário
Remover campos:
```python
stripe_customer_id: Optional[str] = None
stripe_subscription_id: Optional[str] = None
```

Adicionar campos:
```python
google_play_purchase_token: Optional[str] = None
google_play_order_id: Optional[str] = None
```

#### 4. Remover Import e Configuração do Stripe
```python
# REMOVER:
import stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
```

#### 5. Atualizar `.env`
```bash
# REMOVER:
# STRIPE_SECRET_KEY=...
# STRIPE_PUBLISHABLE_KEY=...
# STRIPE_WEBHOOK_SECRET=...

# ADICIONAR:
# GOOGLE_PLAY_SERVICE_ACCOUNT_JSON= (caminho para arquivo de credenciais)
```

---

## 📱 Configuração do Google Play Console

### Passos Necessários:

#### 1. Criar Produtos de Assinatura
No Google Play Console:
1. Monetização → Produtos → Assinaturas
2. Criar 3 produtos:
   - **ID**: `mensal` | Nome: "Plano Mensal" | Preço: R$ 19,90/mês
   - **ID**: `semestral` | Nome: "Plano Semestral" | Preço: R$ 99,00/6 meses
   - **ID**: `anual` | Nome: "Plano Anual" | Preço: R$ 179,90/ano

#### 2. Configurar API Access
1. Google Cloud Console → APIs & Services
2. Ativar "Google Play Android Developer API"
3. Criar Service Account
4. Baixar JSON de credenciais
5. No Google Play Console → API Access → Grant Access para o Service Account

#### 3. Configurar Contas de Teste
1. Google Play Console → Teste → Licenças de teste
2. Adicionar emails de teste
3. Esses emails poderão fazer compras fictícias sem cobrança real

---

## 🏗️ Build e Teste

### Gerar APK de Teste:
```bash
cd frontend
eas build --profile preview --platform android
```

### Nota Importante:
- **NÃO funciona** no Expo Go
- **NÃO funciona** no navegador web
- **REQUER** APK nativo instalado no dispositivo

### Testar Compras:
1. Instalar APK no celular via USB ou download
2. Login com conta de teste cadastrada no Google Play Console
3. Clicar em "Assinar"
4. Google Play mostrará tela nativa com opção "Conta de teste - sem cobranças"
5. Confirmar compra
6. Backend receberá recibo e ativará plano

---

## ⚠️ Limitações Atuais

1. **Backend** ainda não está pronto - endpoints do Stripe precisam ser removidos
2. **Verificação de recibos** ainda não implementada
3. **Service Account JSON** do Google precisa ser configurado

---

## 📝 Próximos Passos

1. ⬜ Implementar endpoint `/api/verify-purchase` no backend
2. ⬜ Integrar Google Play Developer API para validar recibos
3. ⬜ Remover todos os endpoints e código do Stripe
4. ⬜ Configurar produtos no Google Play Console
5. ⬜ Gerar APK e testar compras
6. ⬜ (Futuramente) Implementar suporte ao iOS com Apple In-App Purchase

---

## 🔗 Referências

- [React Native IAP Docs](https://github.com/dooboolab-community/react-native-iap)
- [Google Play Billing Setup](https://developer.android.com/google/play/billing/getting-ready)
- [Google Play Developer API](https://developers.google.com/android-publisher)
