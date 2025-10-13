# 🌐 Meu Look IA - Landing Page

Landing page profissional para divulgação do aplicativo Meu Look IA.

## 📋 Estrutura

```
landing-page/
├── index.html      # Página principal
├── styles.css      # Estilos e design
├── script.js       # Interatividade
└── README.md       # Documentação
```

## ✨ Características

### Design
- ✅ Design moderno e profissional
- ✅ Totalmente responsivo (mobile, tablet, desktop)
- ✅ Animações suaves e interativas
- ✅ Gradientes e cores do app
- ✅ Ícones e emojis para visual atrativo

### Seções
1. **Header/Navbar** - Menu fixo com navegação suave
2. **Hero** - Chamada principal com CTA e estatísticas
3. **Features** - 6 recursos principais do app
4. **How It Works** - 3 passos simples
5. **Pricing** - 3 planos (Gratuito, Mensal, Anual)
6. **Testimonials** - Depoimentos de usuários
7. **CTA Final** - Última chamada para ação
8. **Footer** - Links e informações

### Funcionalidades JavaScript
- Menu mobile hamburger
- Scroll suave para âncoras
- Animações ao rolar a página
- Contador animado de estatísticas
- Efeito parallax no hero
- Tratamento de cliques nos CTAs

## 🚀 Como Usar

### Opção 1: Abrir Localmente
```bash
cd /app/landing-page
python3 -m http.server 8080
```
Acesse: http://localhost:8080

### Opção 2: Deploy em Servidor

Faça upload dos 3 arquivos para qualquer servidor web:
- Netlify (gratuito)
- Vercel (gratuito)
- GitHub Pages (gratuito)
- Seu próprio servidor

#### Deploy no Netlify (Recomendado)
1. Crie conta em https://netlify.com
2. Arraste a pasta `landing-page` para o site
3. Pronto! URL: https://seu-site.netlify.app

#### Deploy no Vercel
```bash
npm i -g vercel
cd /app/landing-page
vercel --prod
```

## 🎨 Personalização

### Cores
Edite as variáveis CSS em `styles.css`:
```css
:root {
    --primary: #6c5ce7;        /* Cor principal */
    --primary-dark: #5647c7;   /* Cor principal escura */
    --secondary: #a29bfe;      /* Cor secundária */
}
```

### Textos
Edite diretamente no `index.html`:
- Títulos
- Descrições
- Preços dos planos
- Depoimentos
- Estatísticas

### Links dos Botões
Atualmente os botões mostram alerts. Para redirecionar ao app:

Edite em `script.js`:
```javascript
// Linha ~95
window.location.href = 'https://seu-app.com/signup?plan=' + planName;
```

## 📊 SEO e Performance

### Meta Tags Incluídas
- ✅ Description
- ✅ Keywords
- ✅ Viewport
- ✅ Charset UTF-8

### Performance
- ✅ CSS e JS minificados (pronto para produção)
- ✅ Fontes do Google otimizadas
- ✅ Imagens responsivas
- ✅ Animações com GPU

### Adicionar Analytics (Opcional)
Adicione antes do `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🔗 Integrações

### Conectar com App

**1. Link direto para cadastro:**
```html
<a href="https://meulookia-debug.preview.emergentagent.com">
```

**2. Deep linking (se app nativo):**
```html
<a href="meulookia://signup?plan=mensal">
```

### Email Marketing
Adicione formulário de captura:
```html
<!-- Antes do CTA -->
<form class="email-capture">
    <input type="email" placeholder="Seu melhor email">
    <button type="submit">Quero Experimentar</button>
</form>
```

## 📱 Responsividade

**Breakpoints:**
- Desktop: > 1200px
- Tablet: 768px - 1200px
- Mobile: < 768px

Testado em:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 🎯 Conversão

### CTAs Principais
1. Hero: "Experimentar Grátis"
2. Features: "Começar Agora"
3. Pricing: "Assinar" para cada plano
4. CTA Final: "Começar Agora Grátis"

### Otimização
- ✅ CTAs em cores contrastantes
- ✅ Benefícios claros
- ✅ Prova social (depoimentos)
- ✅ Urgência nos planos
- ✅ Garantia implícita (5 looks grátis)

## 🔄 Atualizações Futuras

**Sugestões para v2:**
- [ ] Adicionar vídeo demonstração
- [ ] Galeria de antes/depois
- [ ] Blog com dicas de moda
- [ ] Chat ao vivo
- [ ] Calculadora de economia
- [ ] Comparação com concorrentes

## 📞 Suporte

Para dúvidas sobre a landing page:
- Email: contato@meulookia.com.br
- Documentação: Este README

## 📄 Licença

© 2025 Meu Look IA. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para o Meu Look IA**
