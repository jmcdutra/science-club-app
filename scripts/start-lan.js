const { spawn } = require('node:child_process');

const host = process.env.EXPO_LAN_HOST || process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
const port = process.env.RCT_METRO_PORT || '8081';
const expoBin = process.platform === 'win32' ? 'expo.cmd' : './node_modules/.bin/expo';

if (!host) {
  console.error(
    [
      'EXPO_LAN_HOST nao foi definido.',
      '',
      'No PowerShell do Windows, descubra seu IP Wi-Fi/Ethernet com:',
      '  ipconfig',
      '',
      'Procure o IPv4 da sua rede, exemplo 192.168.0.25.',
      '',
      'Depois, no WSL, rode:',
      '  EXPO_LAN_HOST=192.168.0.25 npm run start:lan',
      '',
      'Se estiver no WSL2, tambem configure o portproxy no PowerShell como Administrador:',
      '  $wslIp = (wsl hostname -I).Trim().Split(" ")[0]',
      `  netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=${port}`,
      `  netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=${port} connectaddress=$wslIp connectport=${port}`,
      `  New-NetFirewallRule -DisplayName "Expo Metro ${port}" -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${port}`,
    ].join('\n'),
  );
  process.exit(1);
}

console.log(`Starting Expo LAN as ${host}:${port}`);
console.log('');
console.log('If this is WSL2, the Windows portproxy must point to the current WSL IP.');
console.log('Quick test from iPhone Safari after Metro starts:');
console.log(`  http://${host}:${port}/status`);
console.log('');

const child = spawn(expoBin, ['start', '--host', 'lan', '--port', port, '--clear'], {
  env: {
    ...process.env,
    EXPO_NO_WEB_SETUP: '1',
    REACT_NATIVE_PACKAGER_HOSTNAME: host,
    RCT_METRO_PORT: port,
  },
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
