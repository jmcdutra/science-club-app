const http = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const qrcode = require('qrcode-terminal');

let port = process.env.RCT_METRO_PORT || '8081';
const expoBin = process.platform === 'win32' ? 'expo.cmd' : './node_modules/.bin/expo';
const ngrokBin = fs.existsSync('/usr/local/bin/ngrok')
  ? '/usr/local/bin/ngrok'
  : fs.existsSync('/usr/bin/ngrok')
    ? '/usr/bin/ngrok'
    : 'ngrok';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(1000, () => {
      req.destroy(new Error('timeout'));
    });
  });
}

function isPortAvailable(candidate) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(Number(candidate), '127.0.0.1');
  });
}

async function resolvePort() {
  const start = Number(port);

  for (let candidate = start; candidate < start + 20; candidate += 1) {
    if (await isPortAvailable(String(candidate))) {
      return String(candidate);
    }
  }

  throw new Error(`Nenhuma porta livre encontrada a partir de ${start}.`);
}

async function waitForNgrokUrl() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const data = await requestJson('http://127.0.0.1:4040/api/tunnels');
      const tunnel = data.tunnels?.find((item) => item.public_url?.startsWith('https://'));

      if (tunnel?.public_url) {
        return tunnel.public_url;
      }
    } catch {}

    await wait(500);
  }

  throw new Error('Nao foi possivel obter a URL publica do ngrok.');
}

function pipe(prefix, child) {
  child.stdout.on('data', (chunk) => process.stdout.write(`${prefix}${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`${prefix}${chunk}`));
}

function getNgrokArgs() {
  const args = ['http', port, '--log=stdout'];
  const configPath = path.join(os.homedir(), '.config', 'ngrok', 'ngrok.yml');
  const authToken = process.env.EXPO_NGROK_AUTHTOKEN || process.env.NGROK_AUTHTOKEN;

  if (authToken) {
    args.push('--authtoken', authToken);
  }

  if (fs.existsSync(configPath)) {
    args.push('--config', configPath);
  }

  return args;
}

async function main() {
  port = await resolvePort();
  console.log(`Starting Expo locally on port ${port}...`);

  const expo = spawn(expoBin, ['start', '--host', 'localhost', '--clear'], {
    env: {
      ...process.env,
      RCT_METRO_PORT: port,
    },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  pipe('[expo] ', expo);

  await wait(2500);

  console.log(`Starting ngrok v3 for http://127.0.0.1:${port}...`);

  const ngrok = spawn(ngrokBin, getNgrokArgs(), {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pipe('[ngrok] ', ngrok);

  const publicUrl = await waitForNgrokUrl();
  const expoGoUrl = publicUrl.startsWith('https://')
    ? `exps://${publicUrl.replace(/^https:\/\//, '')}`
    : `exp://${publicUrl.replace(/^http:\/\//, '')}`;

  console.log('\nScan this QR Code with your iPhone camera or Expo Go:\n');
  qrcode.generate(expoGoUrl, { small: true });

  console.log('\nExpo Go URL for iPhone:');
  console.log(expoGoUrl);
  console.log('\nOpen Expo Go, tap Enter URL manually, and paste the URL above.');
  console.log('Keep this terminal open while using the app.\n');

  const cleanup = () => {
    expo.kill('SIGTERM');
    ngrok.kill('SIGTERM');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  expo.on('exit', (code) => {
    ngrok.kill('SIGTERM');
    process.exit(code ?? 0);
  });

  ngrok.on('exit', (code) => {
    expo.kill('SIGTERM');
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
