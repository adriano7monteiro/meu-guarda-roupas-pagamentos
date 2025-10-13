# Landing Page - Meu Look IA

Landing page promocional para o aplicativo "Meu Look IA".

## 📁 Estrutura

```
landing-page/
├── index.html      # Página principal HTML
├── styles.css      # Estilos e design
├── script.js       # Interatividade JavaScript
└── README.md       # Este arquivo
```

## 🎨 Características

- **Design Moderno e Responsivo**: Adapta-se perfeitamente a qualquer dispositivo
- **Gradientes e Animações**: Visual atraente com transições suaves
- **Seções Completas**:
  - Hero Section com mockup de celular
  - Recursos do aplicativo
  - Como funciona (passo a passo)
  - Preços e planos
  - Call-to-action
  - Footer completo

## 🚀 Como Usar

### Localmente

1. Abra o arquivo `index.html` em qualquer navegador
2. Ou use um servidor local:
   ```bash
   # Com Python 3
   python3 -m http.server 8080
   
   # Com Node.js (http-server)
   npx http-server -p 8080
   ```
3. Acesse: `http://localhost:8080`

### Deploy

Você pode fazer deploy desta landing page em:

- **Vercel**: Arraste a pasta para vercel.com
- **Netlify**: Arraste a pasta para netlify.com
- **GitHub Pages**: Faça commit e ative nas configurações do repositório
- **Qualquer servidor web**: Faça upload via FTP

## 🎯 Personalização

### Cores

Edite as variáveis CSS em `styles.css`:

```css
:root {
    --primary-color: #6366f1;      /* Cor principal */
    --secondary-color: #f97316;    /* Cor secundária */
    --text-dark: #1f2937;          /* Texto escuro */
    --text-light: #6b7280;         /* Texto claro */
}
```

### Conteúdo

Edite o texto diretamente no `index.html`:

- Títulos e descrições
- Features e benefícios
- Preços dos planos
- Links de download

### Links de Download

Atualize os links na seção CTA:

```html
<a href="URL_DA_APP_STORE" class="btn-cta">📱 Baixar para iOS</a>
<a href="URL_DA_PLAY_STORE" class="btn-cta">🤖 Baixar para Android</a>
```

## 📱 Responsividade

A landing page é totalmente responsiva e funciona em:

- 📱 Smartphones (portrait e landscape)
- 📱 Tablets
- 💻 Desktop
- 🖥️ Monitores grandes

## ⚡ Performance

- CSS puro (sem frameworks pesados)
- JavaScript vanilla mínimo
- Fontes otimizadas do Google Fonts
- Imagens usando emojis (zero peso)
- Carregamento rápido

## 🔧 Melhorias Futuras

- [ ] Adicionar imagens reais do aplicativo
- [ ] Integrar com analytics (Google Analytics, etc.)
- [ ] Adicionar formulário de contato
- [ ] Implementar multilinguagem
- [ ] Adicionar depoimentos de usuários
- [ ] Integrar com backend para newsletter

## 📄 Licença

Este projeto faz parte do aplicativo "Meu Look IA".
