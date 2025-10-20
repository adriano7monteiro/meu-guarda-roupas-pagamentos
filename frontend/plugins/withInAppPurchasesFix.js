const { withProjectBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

const withInAppPurchasesFix = (config) => {
  // Adiciona configuração no build.gradle do projeto
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      // Adiciona configuração de compileSdk se não existir
      if (!config.modResults.contents.includes('compileSdk')) {
        config.modResults.contents = config.modResults.contents.replace(
          /android\s*{/,
          `android {
    compileSdkVersion 35
    defaultConfig {
        minSdkVersion 24
        targetSdkVersion 35
    }`
        );
      }
    }
    return config;
  });

  // Garante que autolinking está configurado no settings.gradle
  config = withSettingsGradle(config, (config) => {
    if (config.modResults.contents) {
      // Adiciona apply from para autolinking se não existir
      if (!config.modResults.contents.includes('expo-autolinking')) {
        const autolinkingLine = `\napply from: new File(["node", "--print", "require.resolve('expo/package.json')"].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle");\n`;
        
        if (!config.modResults.contents.includes(autolinkingLine)) {
          config.modResults.contents = config.modResults.contents + autolinkingLine;
        }
      }
    }
    return config;
  });

  return config;
};

module.exports = withInAppPurchasesFix;
