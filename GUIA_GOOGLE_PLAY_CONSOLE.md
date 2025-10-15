# 📱 Guia Completo: Configurar Google Play Console para In-App Purchases

## 🎯 Objetivo
Configurar os 3 produtos de assinatura no Google Play Console para que o app possa processar pagamentos nativos via Google Play Billing.

---

## ⚙️ PASSO 1: Acessar o Google Play Console

1. Acesse: https://play.google.com/console
2. Faça login com sua conta Google de desenvolvedor
3. **Se não tiver conta de desenvolvedor:**
   - Você precisa criar uma ($25 de taxa única)
   - Acesse: https://play.google.com/console/signup
   - Siga o processo de registro

---

## 📦 PASSO 2: Criar/Selecionar seu App

### Se o app JÁ EXISTE:
1. Na página inicial do Console, clique no seu app "Meu Look IA"
2. Pule para o Passo 3

### Se o app NÃO EXISTE ainda:
1. Clique em **"Criar app"**
2. Preencha:
   - **Nome do app:** Meu Look IA
   - **Idioma padrão:** Português (Brasil)
   - **Tipo:** App ou jogo
   - **Gratuito ou pago:** Gratuito
3. Aceite os termos e clique em **"Criar app"**
4. **IMPORTANTE:** Anote o **Package Name** que você escolher
   - Exemplo: `com.meulookia.app`
   - Você precisará disso depois!

---

## 💰 PASSO 3: Criar Produtos de Assinatura

### 3.1. Acessar Seção de Monetização
1. No menu lateral esquerdo, clique em **"Monetização"**
2. Clique em **"Produtos"**
3. Clique em **"Assinaturas"**
4. Clique no botão **"Criar assinatura"**

---

### 3.2. Criar Assinatura MENSAL

**Informações do Produto:**
- **ID do produto:** `mensal` ⚠️ **EXATAMENTE ISSO! NÃO MUDE!**
- **Nome:** Plano Mensal
- **Descrição:** Acesso ilimitado a looks com IA, virtual try-on e muito mais!

**Preço:**
- Clique em **"Definir preço"**
- Selecione **"Brasileiro Real (BRL)"**
- Digite: `19.90`
- O Google converterá automaticamente para outros países
- Clique em **"Aplicar preços"**

**Período de cobrança:**
- **Período de renovação:** 1 mês
- **Período de avaliação gratuita:** (opcional, pode deixar em branco)

**Opções de assinatura:**
- Marque: ✅ "Esta assinatura se renova automaticamente"

Clique em **"Ativar"** ou **"Salvar"**

---

### 3.3. Criar Assinatura SEMESTRAL

Repita o processo acima com:

**Informações do Produto:**
- **ID do produto:** `semestral` ⚠️ **EXATAMENTE ISSO!**
- **Nome:** Plano Semestral
- **Descrição:** 6 meses de acesso ilimitado com desconto de 17%!

**Preço:**
- Digite: `99.00`

**Período de cobrança:**
- **Período de renovação:** 6 meses

Clique em **"Ativar"** ou **"Salvar"**

---

### 3.4. Criar Assinatura ANUAL

Repita o processo acima com:

**Informações do Produto:**
- **ID do produto:** `anual` ⚠️ **EXATAMENTE ISSO!**
- **Nome:** Plano Anual  
- **Descrição:** 12 meses de acesso ilimitado com desconto de 25%!

**Preço:**
- Digite: `179.90`

**Período de cobrança:**
- **Período de renovação:** 1 ano

Clique em **"Ativar"** ou **"Salvar"**

---

## 🧪 PASSO 4: Configurar Contas de Teste (IMPORTANTE!)

Para testar as compras SEM ser cobrado de verdade:

1. No menu lateral, vá em **"Configuração"**
2. Clique em **"Gerenciamento de licenças"**
3. Role até **"Testadores de licença"**
4. Clique em **"Adicionar testadores"**
5. Adicione os emails que você quer usar para testar:
   - Seu email pessoal
   - Emails de outros testadores
6. Clique em **"Salvar alterações"**

**Como funciona:**
- Emails listados aqui podem fazer compras de teste
- As compras aparecem como normais, mas não cobram dinheiro real
- Google mostra um aviso: "Este é um item de teste. Não será cobrado."

---

## 🔑 PASSO 5: Verificar Status dos Produtos

1. Volte para **"Monetização → Produtos → Assinaturas"**
2. Você deve ver seus 3 produtos:
   - ✅ mensal - R$ 19,90/mês
   - ✅ semestral - R$ 99,00/6 meses
   - ✅ anual - R$ 179,90/ano
3. Status deve ser **"Ativa"** ou **"Publicada"**

---

## ✅ CHECKLIST FINAL

Antes de continuar, confirme:

- [ ] Criou os 3 produtos com IDs EXATOS: `mensal`, `semestral`, `anual`
- [ ] Definiu os preços corretos: R$ 19,90, R$ 99,00, R$ 179,90
- [ ] Ativou todos os produtos
- [ ] Adicionou pelo menos 1 email de teste
- [ ] Anotou o Package Name do app (ex: `com.meulookia.app`)

---

## 📝 INFORMAÇÕES PARA O PRÓXIMO PASSO

Após configurar tudo, você precisará:

1. **Package Name do app:** ___________________________
2. **Email de teste cadastrado:** ___________________________

Essas informações serão usadas para:
- Configurar o APK build
- Testar as compras

---

## ⚠️ NOTAS IMPORTANTES

**Sobre Ativação dos Produtos:**
- Produtos podem levar alguns minutos para ficarem disponíveis
- Se mostrar "Rascunho", clique em "Ativar"
- Alguns produtos só ficam totalmente ativos após primeira versão do app ser publicada

**Sobre Testes:**
- Use SEMPRE um email cadastrado como testador
- Compras de teste não aparecem na sua fatura real
- Você pode fazer quantas compras de teste quiser

**Sobre Service Account (Avançado):**
- Por enquanto, NÃO é necessário
- Backend funciona em modo desenvolvimento sem validação
- Será necessário apenas para produção (explicarei depois)

---

## 🆘 PROBLEMAS COMUNS

**"Não consigo ativar os produtos"**
→ Pode ser necessário ter uma versão do app enviada primeiro. Tente enviar um APK para teste interno.

**"Os IDs já existem"**
→ Você já criou antes. Pode usar os existentes se os preços estiverem corretos.

**"Não encontro a seção de Monetização"**
→ Seu app pode precisar ser configurado primeiro. Complete todas as seções obrigatórias.

---

## 🚀 PRÓXIMO PASSO

Depois de configurar tudo, me avise e vou:
1. Configurar o Package Name no código
2. Gerar o APK de teste
3. Explicar como instalar e testar

Dúvidas? Me pergunte! 😊
