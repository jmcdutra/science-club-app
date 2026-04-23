const fs = require('node:fs');
const path = require('node:path');

const asyncNgrokPath = path.join(
  process.cwd(),
  'node_modules',
  'expo',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'start',
  'server',
  'AsyncNgrok.js',
);

if (!fs.existsSync(asyncNgrokPath)) {
  console.warn('[patch-expo-ngrok] AsyncNgrok.js not found. Skipping patch.');
  process.exit(0);
}

let source = fs.readFileSync(asyncNgrokPath, 'utf8');
const original = source;

const helper = `
function getExpoNgrokAuthToken() {
    if (process.env.EXPO_NGROK_AUTHTOKEN || process.env.NGROK_AUTHTOKEN) {
        return process.env.EXPO_NGROK_AUTHTOKEN || process.env.NGROK_AUTHTOKEN;
    }
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const candidates = [
        path.join(os.homedir(), '.config', 'ngrok', 'ngrok.yml'),
        path.join(os.homedir(), '.ngrok2', 'ngrok.yml'),
        path.join(os.homedir(), '.expo', 'ngrok.yml')
    ];
    for (const file of candidates){
        try {
            const match = fs.readFileSync(file, 'utf8').match(/^authtoken:\\s*([^\\s#]+)/m);
            if (match) return match[1];
        } catch {}
    }
    return null;
}
`;

if (!source.includes('function getExpoNgrokAuthToken()')) {
  source = source.replace("const debug = require('debug')('expo:start:server:ngrok');", `${helper}const debug = require('debug')('expo:start:server:ngrok');`);
}

source = source.replace(
  "authToken: '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',",
  "authToken: getExpoNgrokAuthToken() || '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',",
);

source = source.replace(
  "authToken: process.env.EXPO_NGROK_AUTHTOKEN || '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',",
  "authToken: getExpoNgrokAuthToken() || '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',",
);

source = source.replace(
  'const urlProps = await this._getConnectionPropsAsync();',
  'const urlProps = getExpoNgrokAuthToken() ? {} : await this._getConnectionPropsAsync();',
);

source = source.replace(
  'const urlProps = process.env.EXPO_NGROK_AUTHTOKEN ? {} : await this._getConnectionPropsAsync();',
  'const urlProps = getExpoNgrokAuthToken() ? {} : await this._getConnectionPropsAsync();',
);

source = source.replace(
  'authtoken: NGROK_CONFIG.authToken,\n                configPath,',
  "authtoken: NGROK_CONFIG.authToken,\n                ...(getExpoNgrokAuthToken() ? { proto: 'http' } : {}),\n                configPath,",
);

source = source.replace(
  "authtoken: NGROK_CONFIG.authToken,\n                ...(process.env.EXPO_NGROK_AUTHTOKEN ? { proto: 'http' } : {}),\n                configPath,",
  "authtoken: NGROK_CONFIG.authToken,\n                ...(getExpoNgrokAuthToken() ? { proto: 'http' } : {}),\n                configPath,",
);

if (source === original) {
  console.log('[patch-expo-ngrok] Patch already applied or Expo CLI layout changed.');
  process.exit(0);
}

fs.writeFileSync(asyncNgrokPath, source);
console.log('[patch-expo-ngrok] Expo ngrok tunnel patch applied.');
