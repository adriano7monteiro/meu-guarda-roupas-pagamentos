# ⚠️ ATENÇÃO: EAS Build Usa Git!

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

O erro persiste porque **EAS Build usa o código do repositório Git**, não os arquivos locais!

Se você fez mudanças mas não commitou, o EAS não vai ver essas mudanças.

## ✅ CHECKLIST ANTES DE FAZER BUILD EAS

### 1. Verificar se os arquivos estão commitados

```bash
cd /caminho/do/projeto

# Ver status
git status

# Ver últimos commits
git log --oneline -5
```

### 2. Commitar todas as mudanças

```bash
# Adicionar arquivos modificados
git add frontend/yarn.lock
git add frontend/.yarnrc
git add frontend/.npmrc
git add frontend/eas.json
git add frontend/package.json
git add frontend/.easignore

# Commitar
git commit -m "fix: Force Node 22 and resolve dev-middleware to 0.79.5"

# Push para o repositório remoto
git push origin main
```

### 3. Verificar se o push foi feito

```bash
# Ver commits remotos
git log origin/main --oneline -5
```

## 🔍 VERIFICAÇÃO DOS ARQUIVOS CRÍTICOS

Antes do build, certifique-se que esses arquivos existem **E ESTÃO COMMITADOS**:

### `frontend/eas.json`
```bash
cat frontend/eas.json | grep '"node"'
```
**Deve mostrar:** `"node": "22.11.0"`

### `frontend/package.json`
```bash
cat frontend/package.json | grep -A 3 "resolutions"
```
**Deve mostrar:** `"@react-native/dev-middleware": "0.79.5"`

### `frontend/.yarnrc`
```bash
cat frontend/.yarnrc
```
**Deve mostrar:** `--install.ignore-engines true`

### `frontend/yarn.lock`
```bash
grep "@react-native/dev-middleware@" frontend/yarn.lock | head -1
```
**Deve mostrar versão 0.79.5**

## 🚀 COMANDO COMPLETO PARA BUILD

Depois de commitar TUDO:

```bash
# 1. Verificar que está tudo commitado
git status  # Deve mostrar "nothing to commit, working tree clean"

# 2. Push para o repositório
git push

# 3. Fazer build EAS
cd frontend
eas build --platform android --profile preview --clear-cache
```

**Importante:** Use `--clear-cache` para forçar o EAS a baixar tudo de novo!

## 🛠️ SOLUÇÃO ALTERNATIVA: Adicionar Explicitamente nas DevDependencies

Se o problema AINDA persistir após commitar, force a versão nas devDependencies:

```bash
cd frontend

# Adicionar versão específica
yarn add @react-native/dev-middleware@0.79.5 --dev

# Commitar novamente
git add package.json yarn.lock
git commit -m "fix: Explicitly add dev-middleware 0.79.5 to devDependencies"
git push

# Build com cache limpo
eas build --platform android --profile preview --clear-cache
```

## 📊 VERIFICAR BUILD NO EAS

```bash
# Ver logs do build em tempo real
eas build --platform android --profile preview

# Depois, ver logs completos
eas build:list
eas build:view [BUILD_ID]
```

Procure no log por:
- "Installing dependencies" → deve usar Node 22.11.0
- "@react-native/dev-middleware" → deve instalar versão 0.79.5

## 🔧 SE O ERRO PERSISTIR NO LOG DO EAS

Adicione mais resolutions no `package.json`:

```json
{
  "resolutions": {
    "@react-native/dev-middleware": "0.79.5",
    "**/react-native": "0.79.5",
    "**/@react-native/dev-middleware": "0.79.5",
    "@react-native/community-cli-plugin/@react-native/dev-middleware": "0.79.5",
    "@expo/cli/@react-native/dev-middleware": "0.79.5"
  }
}
```

## 💡 DICA: Usar Branch Específica

Se estiver tendo problemas, crie uma branch específica para build:

```bash
# Criar branch de build
git checkout -b build/fix-node-version

# Fazer todas as mudanças
git add .
git commit -m "fix: Node version for EAS Build"
git push origin build/fix-node-version

# Build dessa branch específica
eas build --platform android --profile preview --branch build/fix-node-version
```

## ⚠️ IMPORTANTE: .gitignore

Certifique-se que `yarn.lock` **NÃO** está no `.gitignore`:

```bash
# Verificar
cat .gitignore | grep yarn.lock

# Se estiver, remova essa linha do .gitignore!
```

## 📝 RESUMO DO PROCESSO CORRETO

1. ✅ Fazer mudanças nos arquivos
2. ✅ `git add` nos arquivos modificados (incluindo yarn.lock!)
3. ✅ `git commit -m "mensagem"`
4. ✅ `git push` para o repositório remoto
5. ✅ `eas build --platform android --profile preview --clear-cache`
6. ✅ Aguardar build (~15-20 min)
7. ✅ Verificar logs para confirmar Node 22 e versão correta do pacote

## 🎯 CHECKLIST FINAL ANTES DE BUILD

- [ ] Todas as mudanças commitadas (`git status` limpo)
- [ ] Push feito (`git log` mostra commit no remoto)
- [ ] `eas.json` tem `"node": "22.11.0"`
- [ ] `package.json` tem resolutions para `0.79.5`
- [ ] `.yarnrc` existe e está commitado
- [ ] `yarn.lock` foi atualizado e commitado
- [ ] Usando `--clear-cache` no comando de build

## 🚀 COMANDO FINAL

```bash
# Tudo de uma vez
git add -A
git commit -m "fix: EAS Build Node version and dev-middleware"
git push
cd frontend
eas build --platform android --profile preview --clear-cache
```

Se AINDA der erro após isso, compartilhe o **link dos logs do build EAS** para investigarmos mais! 🔍
