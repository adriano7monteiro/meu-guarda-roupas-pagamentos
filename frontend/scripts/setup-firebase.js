const fs = require('fs');
const path = require('path');

console.log('🔥 [EAS Pre-Install] Configurando Firebase google-services.json...');

// Criar google-services.json dinamicamente se GOOGLE_SERVICES_JSON existir
// Isso permite usar EAS Secrets para o arquivo durante builds
if (process.env.GOOGLE_SERVICES_JSON) {
  const googleServicesPath = path.resolve(__dirname, '..', 'google-services.json');
  try {
    // Parse o JSON para validar
    const googleServicesContent = JSON.parse(process.env.GOOGLE_SERVICES_JSON);
    // Escrever o arquivo
    fs.writeFileSync(googleServicesPath, JSON.stringify(googleServicesContent, null, 2));
    console.log('✅ [EAS Pre-Install] google-services.json criado com sucesso via EAS Secret');
    console.log('📁 [EAS Pre-Install] Arquivo criado em:', googleServicesPath);
  } catch (error) {
    console.error('❌ [EAS Pre-Install] Erro ao criar google-services.json:', error.message);
    // Durante build, se houver erro, o build deve falhar
    if (process.env.EAS_BUILD) {
      throw new Error('Failed to create google-services.json from EAS Secret');
    }
  }
} else {
  // Durante EAS build, verificar se o arquivo existe localmente
  const googleServicesPath = path.resolve(__dirname, '..', 'google-services.json');
  if (fs.existsSync(googleServicesPath)) {
    console.log('✅ [EAS Pre-Install] google-services.json já existe localmente');
  } else {
    console.warn('⚠️  [EAS Pre-Install] google-services.json não encontrado');
    console.warn('    Configure GOOGLE_SERVICES_JSON no EAS Secret ou adicione o arquivo localmente');
    if (process.env.EAS_BUILD) {
      console.warn('    Execute: eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json');
    }
  }
}

console.log('🔥 [EAS Pre-Install] Setup Firebase concluído');
