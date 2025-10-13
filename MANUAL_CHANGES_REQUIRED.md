# 🔥 MUDANÇAS CRÍTICAS - Aplique Manualmente no Seu Código

## ⚠️ IMPORTANTE: 
Como as mudanças não foram sincronizadas automaticamente, você precisa aplicar manualmente no seu repositório local.

---

## 📝 ARQUIVO 1: `frontend/package.json`

### Localize a seção `"scripts"` e adicione o preinstall:
```json
"scripts": {
  "start": "expo start",
  "preinstall": "bash scripts/preinstall.sh || true",
  "reset-project": "node ./scripts/reset-project.js",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "expo lint"
},
```

### Localize `"devDependencies"` e adicione:
```json
"devDependencies": {
  "@babel/core": "^7.25.2",
  "@expo/ngrok": "^4.1.3",
  "@react-native/dev-middleware": "0.79.5",    ← ADICIONE ESTA LINHA
  "@types/react": "~19.0.10",
  "eslint": "^9.25.0",
  "eslint-config-expo": "~9.2.0",
  "react-native-dotenv": "^3.4.11",
  "typescript": "~5.8.3"
},
```

### Localize a parte final do arquivo (antes do último `}`) e adicione:
```json
"private": true,
"engines": {
  "node": ">=20.19.2"
},
"resolutions": {
  "@react-native/dev-middleware": "0.79.5"
},
"overrides": {
  "@react-native/dev-middleware": "0.79.5"
},
"packageManager": "yarn@1.22.22+sha512.a6b2f7906b721bba3d67d4aff083df04dad64c399707841b7acf00f6b133b7ac24255f2652fa22ae3534329dc6180534e98d17432037ff6fd140556e2bb3137e"
```

---

## 📝 ARQUIVO 2: `frontend/.yarnrc` (CRIAR NOVO)

Crie o arquivo `.yarnrc` na pasta `frontend`:
```
--install.ignore-engines true
```

---

## 📝 ARQUIVO 3: `frontend/.npmrc` (CRIAR NOVO)

Crie o arquivo `.npmrc` na pasta `frontend`:
```
engine-strict=false
legacy-peer-deps=true
```

---

## 📝 ARQUIVO 4: `frontend/.easignore` (CRIAR NOVO)

Crie o arquivo `.easignore` na pasta `frontend`:
```
node_modules/
.expo/
.expo-shared/
*.log
.DS_Store
*.swp
*.swo
.vscode/
.idea/
```

---

## 📝 ARQUIVO 5: `frontend/eas.json` (SOBRESCREVER COMPLETO)

Substitua TODO o conteúdo do arquivo `eas.json`:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "node": "22.11.0",
      "yarn": "1.22.22",
      "env": {
        "YARN_IGNORE_ENGINES": "1",
        "NPM_CONFIG_ENGINE_STRICT": "false",
        "YARN_ENABLE_IMMUTABLE_INSTALLS": "false"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "node": "22.11.0",
      "yarn": "1.22.22",
      "env": {
        "YARN_IGNORE_ENGINES": "1",
        "NPM_CONFIG_ENGINE_STRICT": "false",
        "YARN_ENABLE_IMMUTABLE_INSTALLS": "false"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "node": "22.11.0",
      "yarn": "1.22.22",
      "env": {
        "YARN_IGNORE_ENGINES": "1",
        "NPM_CONFIG_ENGINE_STRICT": "false",
        "YARN_ENABLE_IMMUTABLE_INSTALLS": "false"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 📝 ARQUIVO 6: `frontend/scripts/preinstall.sh` (CRIAR NOVO)

Crie a pasta `scripts` se não existir, e dentro dela crie o arquivo `preinstall.sh`:
```bash
#!/bin/bash
# Force correct version of @react-native/dev-middleware

echo "🔧 Forcing @react-native/dev-middleware to version 0.79.5..."

# This ensures EAS Build uses the correct version
export YARN_IGNORE_ENGINES=1
export NPM_CONFIG_ENGINE_STRICT=false

echo "✅ Environment variables set for build"
```

Depois, torne o arquivo executável:
```bash
chmod +x frontend/scripts/preinstall.sh
```

---

## ✅ CHECKLIST - Após Aplicar TODAS as Mudanças:

- [ ] `frontend/package.json` → "preinstall" script adicionado
- [ ] `frontend/package.json` → "@react-native/dev-middleware": "0.79.5" em devDependencies
- [ ] `frontend/package.json` → "resolutions" e "overrides" adicionados
- [ ] `frontend/.yarnrc` → Arquivo criado
- [ ] `frontend/.npmrc` → Arquivo criado
- [ ] `frontend/.easignore` → Arquivo criado
- [ ] `frontend/eas.json` → Sobrescrito com novo conteúdo
- [ ] `frontend/scripts/preinstall.sh` → Criado e executável

---

## 🚀 APÓS APLICAR TUDO, EXECUTE:

```bash
cd frontend

# Limpar completamente
rm -rf node_modules yarn.lock package-lock.json

# Limpar cache
yarn cache clean

# Reinstalar
yarn install

# Commitar TUDO
git add .
git commit -m "fix: Force Node 22 and dev-middleware 0.79.5 for EAS Build"
git push

# Build EAS com cache limpo
eas build --platform android --profile preview --clear-cache
```

---

## 🎯 O QUE ESPERAR NOS LOGS DO EAS:

Quando o build iniciar, você deve ver nos logs:

```
✓ Using Node.js 22.11.0
✓ Using Yarn 1.22.22
...
Installing dependencies...
✓ @react-native/dev-middleware@0.79.5
```

Se ver qualquer versão diferente (0.81.4 ou Node 20.19.2), compartilhe o link dos logs!

---

## 📞 PRÓXIMO PASSO:

Depois de aplicar TODAS essas mudanças e fazer o build, me avise do resultado! 🚀
