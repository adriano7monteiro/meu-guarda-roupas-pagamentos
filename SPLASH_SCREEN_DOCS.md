# Splash Screen - Meu Look IA

## 📱 Visão Geral

A splash screen foi implementada com design moderno usando gradiente roxo/azul, consistente com o branding da landing page.

## 🎨 Características

- **Gradiente Roxo → Azul**: `#6366f1` → `#8b5cf6`
- **Logo**: Emoji 👔 centralizado
- **Animações**: 
  - Fade in suave
  - Scale com spring effect
  - Fade out após 2 segundos
- **Loading Indicators**: Três pontos animados

## 📁 Arquivos Criados/Modificados

### 1. `/app/frontend/components/SplashScreen.tsx`
Componente principal da splash screen com:
- Animações usando `Animated` API
- Gradiente com `expo-linear-gradient`
- Controle de exibição com `expo-splash-screen`

### 2. `/app/frontend/app/_layout.tsx`
Layout raiz que gerencia:
- Estado da splash screen
- Transição para conteúdo principal
- Configuração do Stack navigation

### 3. `/app/frontend/app.json`
Configuração nativa da splash:
- Background color: `#6366f1`
- Splash icon gerado
- Modo: `contain`

### 4. `/app/frontend/assets/images/splash-icon.png`
Ícone de splash gerado com:
- Dimensões: 512x512px
- Gradiente de fundo
- Círculo branco central

## 🚀 Como Funciona

1. **Carregamento Inicial**: Splash nativa do Expo (configurada no app.json)
2. **Transição**: Componente SplashScreen.tsx assume controle
3. **Animações**: Logo aparece com fade + scale (800ms)
4. **Espera**: Mantém por 2 segundos
5. **Fade Out**: Desaparece suavemente (500ms)
6. **App**: Conteúdo principal é exibido

## 🎯 Sequência de Eventos

```typescript
Início
  ↓
Splash Nativa (Expo)
  ↓
preventAutoHideAsync()
  ↓
Animações (fade + scale)
  ↓
Aguarda 2s
  ↓
hideAsync()
  ↓
Fade out
  ↓
onFinish() → App Principal
```

## ⚙️ Configuração

### Cores
Para alterar as cores do gradiente, edite `SplashScreen.tsx`:

```typescript
<LinearGradient
  colors={['#6366f1', '#8b5cf6']}  // Altere aqui
  ...
/>
```

### Duração
Para alterar o tempo de exibição, edite o timeout:

```typescript
const timer = setTimeout(async () => {
  // ...
}, 2000);  // 2 segundos - altere aqui
```

### Logo
Para trocar o emoji, altere:

```typescript
<Text style={styles.logoIcon}>👔</Text>  // Altere aqui
```

## 📦 Dependências

- `expo-splash-screen`: Controle nativo da splash
- `expo-linear-gradient`: Gradientes
- `react-native` Animated API: Animações

## 🔧 Problemas Conhecidos

### Se a splash não aparecer:
1. Limpe o cache: `expo start --clear`
2. Reconstrua: `expo prebuild --clean`
3. Verifique logs: `/var/log/supervisor/expo.err.log`

### Se as animações não funcionarem:
- Verifique se `react-native-reanimated` está instalado
- Reinicie o Metro bundler

## 🎨 Customização Avançada

### Adicionar mais animações:

```typescript
const rotateAnim = new Animated.Value(0);

// No useEffect:
Animated.timing(rotateAnim, {
  toValue: 1,
  duration: 1000,
  useNativeDriver: true,
}).start();

// No JSX:
<Animated.View
  style={{
    transform: [{
      rotate: rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
      })
    }]
  }}
>
```

### Adicionar logo personalizado:

```typescript
import { Image } from 'react-native';

<View style={styles.logoContainer}>
  <Image 
    source={require('../assets/images/logo.png')}
    style={{ width: 80, height: 80 }}
    resizeMode="contain"
  />
</View>
```

## ✅ Checklist de Testes

- [ ] Splash aparece ao abrir o app
- [ ] Animações são suaves
- [ ] Gradiente está correto
- [ ] Logo centralizado
- [ ] Transição para app funciona
- [ ] Funciona no iOS
- [ ] Funciona no Android
- [ ] Funciona na web

## 🔗 Referências

- [Expo Splash Screen Docs](https://docs.expo.dev/versions/latest/sdk/splash-screen/)
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- [React Native Animated](https://reactnative.dev/docs/animated)
