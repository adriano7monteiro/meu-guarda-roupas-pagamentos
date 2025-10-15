# 📱 Guia Completo: Build APK com Ícones Corretos

## ✅ Configuração Atual (app.json)

Já configuramos corretamente:

```json
{
  "expo": {
    "name": "Meu Look IA",
    "slug": "meu-look-ia",
    "icon": "./assets/images/icon.png",
    "android": {
      "icon": "./assets/images/icon.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#6c5ce7"
      },
      "package": "com.meulookia.app"
    }
  }
}
```

## 📐 Tamanhos Corretos dos Ícones

### 1. **icon.png** (Ícone Principal)
- **Tamanho:** 1024x1024 pixels
- **Formato:** PNG
- **Localização:** `./assets/images/icon.png`
- **Uso:** iOS e Android (legacy)

### 2. **adaptive-icon.png** (Android Adaptive Icon)
- **Tamanho:** 1024x1024 pixels
- **Formato:** PNG com transparência
- **Localização:** `./assets/images/adaptive-icon.png`
- **Importante:** Área segura no centro (círculo de 660px)
- **Uso:** Android 8.0+ (Oreo)

### 3. **splash-icon.png** (Splash Screen)
- **Tamanho:** Recomendado 1284x2778 pixels
- **Formato:** PNG
- **Localização:** `./assets/images/splash-icon.png`

---

## 🛠️ Como Gerar o APK com Ícones

### Opção 1: Build Local (Desenvolvimento)

```bash
cd /app/frontend

# Instalar EAS CLI (se não tiver)
npm install -g eas-cli

# Login no Expo
eas login

# Configurar projeto (primeira vez)
eas build:configure

# Build APK para desenvolvimento
eas build --platform android --profile preview
```

### Opção 2: Build Produção

```bash
# Build APK de produção
eas build --platform android --profile production

# Ou AAB (recomendado para Google Play)
eas build --platform android --profile production --type app-bundle
```

---

## 📋 Arquivo eas.json (Se não existir, criar)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 🔍 Verificar se Ícones Estão Corretos

### Antes de fazer build:

```bash
cd /app/frontend

# Verificar se arquivos existem
ls -lh assets/images/

# Deve mostrar:
# icon.png
# adaptive-icon.png
# splash-icon.png
# favicon.png
```

### Testar localmente:

```bash
# Instalar no dispositivo via Expo Go
expo start

# Escanear QR code e verificar se ícones aparecem
```

---

## ⚠️ Problemas Comuns e Soluções

### 1. **Ícone não aparece no APK**

**Causa:** Imagens muito pequenas ou corrompidas

**Solução:**
- Garantir que icon.png seja 1024x1024px
- Garantir que adaptive-icon.png seja 1024x1024px
- Usar PNG sem compressão excessiva

### 2. **Ícone aparece cortado no Android**

**Causa:** Adaptive icon sem área segura

**Solução:**
- Manter conteúdo importante no círculo central (660px)
- Evitar texto/logos nas bordas

### 3. **Background branco no ícone**

**Causa:** Cor de fundo incorreta no adaptive icon

**Solução:**
- Já configuramos `backgroundColor: "#6c5ce7"` (roxo)
- Combina com a identidade visual do app

### 4. **Build falha**

**Causa:** Dependências ou configurações incorretas

**Solução:**
```bash
# Limpar cache
rm -rf node_modules
yarn install

# Rebuild
eas build --platform android --profile preview --clear-cache
```

---

## 🎨 Ícones Atuais do Projeto

Os ícones já foram criados anteriormente com:
- Logo "Meu Look IA"
- Cores roxo/gradiente (#6c5ce7)
- Design moderno

Localizados em:
- `/app/frontend/assets/images/icon.png`
- `/app/frontend/assets/images/adaptive-icon.png`
- `/app/frontend/assets/images/splash-icon.png`

---

## 📱 Próximos Passos Recomendados

1. **Verificar dimensões dos ícones atuais:**
   - Usar ferramenta online ou Photoshop
   - Garantir 1024x1024px

2. **Fazer build de teste:**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Instalar APK no dispositivo:**
   - Download via link do EAS Build
   - Verificar ícone na home screen

4. **Se ícone não aparecer:**
   - Recriar ícones com tamanho correto
   - Fazer novo build

---

## 🔗 Recursos Úteis

- **Expo Icon Generator:** https://icon.kitchen/
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Android Icon Guidelines:** https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive

---

## ✅ Checklist Antes de Fazer Build

- [ ] Ícones criados (1024x1024px)
- [ ] app.json configurado corretamente
- [ ] eas.json existe
- [ ] EAS CLI instalado (`npm install -g eas-cli`)
- [ ] Login feito (`eas login`)
- [ ] Projeto configurado (`eas build:configure`)
- [ ] Fazer build (`eas build --platform android --profile preview`)
- [ ] Aguardar build (5-15 minutos)
- [ ] Download e instalar APK
- [ ] Verificar ícone na home screen

---

## 💡 Dica Final

Se após fazer o build os ícones ainda não aparecerem:

1. Delete o app do dispositivo
2. Reinstale o APK
3. Aguarde alguns segundos (cache do Android)
4. Verifique novamente

Se ainda assim não funcionar, pode ser necessário:
- Recriar os ícones com ferramentas específicas
- Usar o gerador oficial do Expo
- Verificar se há erros nos logs do build

---

**Última Atualização:** 15/10/2025
**Status:** ✅ Configuração corrigida e pronta para build
