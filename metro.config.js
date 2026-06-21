const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');
config.resolver.sourceExts.push('sql');

// Suppress the Expo Go push-token error: DevicePushTokenAutoRegistration.fx.js
// is a synchronous side effect that calls addPushTokenListener at module load time,
// which throws in Expo Go SDK 53+. Since this app uses only LOCAL notifications,
// remote push token registration is not needed.
const NOOP_STUB = path.resolve(__dirname, 'stubs/noop.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('DevicePushTokenAutoRegistration.fx.js')) {
    return { type: 'sourceFile', filePath: NOOP_STUB };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
