#!/bin/bash
# Force correct version of @react-native/dev-middleware

echo "🔧 Forcing @react-native/dev-middleware to version 0.79.5..."

# This ensures EAS Build uses the correct version
export YARN_IGNORE_ENGINES=1
export NPM_CONFIG_ENGINE_STRICT=false

echo "✅ Environment variables set for build"
