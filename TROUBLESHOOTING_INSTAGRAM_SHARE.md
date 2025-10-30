# 🐛 Troubleshooting: Compartilhamento Instagram

## 📋 Problemas Comuns e Soluções

### 1. **Erro: "Cannot find native module 'FileSystem'"**

**Causa:** FileSystem não está disponível na plataforma atual

**Solução Implementada:** ✅
- Import dinâmico de FileSystem apenas quando necessário
- Verificação de plataforma antes de usar

**Código:**
```typescript
if (Platform.OS === 'web') {
  // Não usa FileSystem
  return;
}
const FileSystem = await import('expo-file-system');
```

---

### 2. **Menu de compartilhamento não abre**

**Possíveis Causas:**
- Permissões não concedidas
- Sharing não disponível no dispositivo
- Imagem não foi baixada corretamente

**Como Verificar:**
1. Veja os logs do console:
```
📤 Iniciando compartilhamento para Instagram...
🔍 Sharing disponível: true/false
📦 Importando FileSystem...
✅ FileSystem importado
📥 Baixando imagem...
```

2. Se parar antes de "Menu de compartilhamento aberto", há um erro

**Soluções:**

**A. Se "Sharing disponível: false"**
```typescript
// O dispositivo não suporta sharing
// Fallback: mostrar instruções para print
```

**B. Se erro no download**
```typescript
// Verificar se a URL da imagem é válida
// Verificar conectividade de internet
// Verificar permissões de armazenamento
```

---

### 3. **Instagram não aparece na lista**

**Causa:** Instagram não está instalado ou está desatualizado

**Solução:**
1. Instalar/atualizar Instagram da Play Store/App Store
2. Usar fallback de print de tela

**Código de Fallback:**
```typescript
Alert.alert(
  'Como Compartilhar',
  '1. Faça print: Power + Volume Baixo\n2. Abra Instagram\n3. Crie post/story\n4. Selecione imagem',
  [{ text: 'Entendi' }]
);
```

---

### 4. **Erro ao baixar imagem**

**Possíveis Causas:**
- URL da imagem inválida
- Imagem não acessível (CORS, autenticação)
- Sem conexão com internet
- Sem espaço no dispositivo

**Como Verificar:**
```javascript
console.log('📊 Resultado download:', downloadResult);
// Deve mostrar: { status: 200, uri: '...' }
```

**Soluções:**

**A. Status !== 200**
```typescript
if (downloadResult.status !== 200) {
  // Imagem não foi baixada
  // Verificar URL da imagem
  console.log('URL:', fullScreenImage);
}
```

**B. URL Cloudflare**
- Verificar se imagem existe no Cloudflare
- Verificar permissões de acesso
- URL deve ser pública (não protegida)

---

### 5. **Erro: "Failed to share"**

**Possíveis Causas:**
- Arquivo muito grande
- Formato não suportado
- Permissões negadas

**Soluções:**

**A. Verificar tamanho do arquivo**
```typescript
const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
console.log('📦 Tamanho:', fileInfo.size);
// Se > 10MB, pode dar problema
```

**B. Verificar formato**
```typescript
// Usar sempre JPEG
await Sharing.shareAsync(uri, {
  mimeType: 'image/jpeg', // ✅ Formato correto
  UTI: 'public.jpeg',     // ✅ iOS
});
```

---

## 🧪 Como Testar e Debugar

### Teste 1: Verificar Plataforma
```typescript
console.log('Platform:', Platform.OS);
// Deve ser 'android' ou 'ios', não 'web'
```

### Teste 2: Verificar Sharing
```typescript
const available = await Sharing.isAvailableAsync();
console.log('Sharing disponível:', available);
// Deve ser true
```

### Teste 3: Verificar FileSystem
```typescript
const FileSystem = await import('expo-file-system');
console.log('Cache directory:', FileSystem.cacheDirectory);
// Deve mostrar um path válido
```

### Teste 4: Verificar Download
```typescript
const result = await FileSystem.downloadAsync(imageUrl, localPath);
console.log('Download result:', result);
// { status: 200, uri: 'file://...' }
```

### Teste 5: Verificar Arquivo
```typescript
const fileInfo = await FileSystem.getInfoAsync(localPath);
console.log('File exists:', fileInfo.exists);
console.log('File size:', fileInfo.size);
// exists: true, size: > 0
```

---

## 📱 Logs Esperados (Sucesso)

```
📤 Iniciando compartilhamento para Instagram...
📸 URL da imagem: https://imagedelivery.net/...
🔍 Sharing disponível: true
📦 Importando FileSystem...
✅ FileSystem importado
📥 Baixando imagem...
   De: https://imagedelivery.net/...
   Para: file:///data/.../cache/look_1234567890.jpg
📊 Resultado download: { status: 200, uri: 'file://...' }
✅ Imagem baixada com sucesso: file://...
🔗 Abrindo menu de compartilhamento...
✅ Menu de compartilhamento aberto com sucesso
```

---

## 📱 Logs de Erro (Exemplo)

```
📤 Iniciando compartilhamento para Instagram...
📸 URL da imagem: https://imagedelivery.net/...
🔍 Sharing disponível: true
📦 Importando FileSystem...
✅ FileSystem importado
📥 Baixando imagem...
❌ Erro ao compartilhar: Error: Failed to download
❌ Tipo de erro: Error
❌ Mensagem: Failed to download
❌ Stack: ...
```

**Interpretação:** Download falhou. Verificar URL da imagem e conectividade.

---

## 🔧 Soluções Alternativas

### Opção 1: Print de Tela (Sempre Funciona)
```
1. Botão Power + Volume Baixo (Android)
2. Botão Power + Volume Cima (iOS)
3. Abrir Instagram
4. Criar post/story
5. Selecionar imagem da galeria
```

### Opção 2: Salvar na Galeria (Requer expo-media-library)
```typescript
import * as MediaLibrary from 'expo-media-library';

// Pedir permissão
const { status } = await MediaLibrary.requestPermissionsAsync();

// Salvar
const asset = await MediaLibrary.createAssetAsync(localUri);

Alert.alert(
  'Imagem Salva!',
  'A imagem foi salva na galeria. Abra o Instagram e selecione-a.'
);
```

---

## 📊 Checklist de Verificação

Antes de reportar um bug, verifique:

- [ ] Platform.OS é 'android' ou 'ios' (não 'web')
- [ ] Sharing.isAvailableAsync() retorna true
- [ ] FileSystem foi importado com sucesso
- [ ] URL da imagem é válida e acessível
- [ ] Download retornou status 200
- [ ] Arquivo foi criado no cache
- [ ] Instagram está instalado no dispositivo
- [ ] App tem permissões necessárias

---

## 🚀 Melhorias Implementadas

### v2.0 (Atual)
- ✅ Logs detalhados em cada etapa
- ✅ Mensagens de erro específicas
- ✅ Import dinâmico de FileSystem
- ✅ Verificação de plataforma
- ✅ Fallback com instruções claras
- ✅ Tratamento de erros melhorado

### O que foi adicionado:
```typescript
// Logs detalhados
console.log('📤 Iniciando compartilhamento...');
console.log('📸 URL da imagem:', fullScreenImage);
console.log('🔍 Sharing disponível:', isAvailable);

// Erro detalhado para usuário
Alert.alert(
  'Erro ao Compartilhar',
  `Não foi possível compartilhar.\n\nErro: ${error?.message}\n\nTente print.`,
  [/* opções */]
);
```

---

## 💡 Dicas para o Usuário

### Se não funcionar:
1. **Tente fazer um print da tela** (sempre funciona)
2. **Verifique se o Instagram está instalado**
3. **Verifique se tem internet** (para baixar a imagem)
4. **Reinicie o app** se persistir

### Para reportar problema:
Informe:
- Dispositivo (modelo e Android/iOS version)
- Mensagem de erro exata
- Se Instagram está instalado
- Se tem internet
- Se outras imagens compartilham normalmente

---

## 🔍 Debug Avançado

### Habilitar logs completos:
```typescript
// Em development mode
if (__DEV__) {
  console.log('🐛 [DEBUG] Full error:', JSON.stringify(error, null, 2));
}
```

### Testar URL manualmente:
```bash
# Verificar se URL é acessível
curl -I https://imagedelivery.net/...
# Deve retornar 200 OK
```

### Verificar permissões (Android):
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

---

**Última atualização:** Janeiro 2025  
**Versão do código:** 2.0 (com logs detalhados)
