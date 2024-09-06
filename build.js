//@ts-check

import esbuild from 'esbuild';
import { readFile, writeFile } from 'fs/promises';
import { spawn } from 'child_process';

const production = process.argv.includes('--mode=production');
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const copyright = await readFile('README.md', 'utf8').then((value) => {
  return value
    ?.replace(/[\s\S]*?## Copyright/, '')
    ?.match(/.{1,65}\s+|\S+/g)
    ?.join('\n  * ')
    .replace(/\n{2,}/g, '\n')
    .split('\n')[0];
});

console.log(copyright);

/**
 * @param {string} name
 * @param {import('esbuild').BuildOptions} options
 */
function getContext(name, options) {
  return esbuild
    .context({
      bundle: true,
      entryPoints: [`${name}/index.ts`],
      outfile: `dist/${name}.js`,
      keepNames: true,
      dropLabels: production ? ['DEV'] : undefined,
      legalComments: 'inline',
      banner: {
        js: `/**\n  * ${copyright}  */`,
      },
      plugins: [
        {
          name: 'build',
          setup(build) {
            build.onEnd((result) => {
              if (!result || result.errors.length === 0) console.log(`Successfully built ${name}`);
            });
          },
        },
      ],
      ...options,
    })
    .catch(() => process.exit(1));
}

const server = await getContext('server', {
  platform: 'node',
  target: ['node16'],
  format: 'cjs',
});

const client = await getContext('client', {
  platform: 'browser',
  target: ['es2021'],
  format: 'iife',
});

async function build() {
  const built = await Promise.all([server.rebuild(), client.rebuild()]);

  if (!built) return;

  await writeFile('.yarn.installed', new Date().toISOString());
  await writeFile(
    'fxmanifest.lua',
    `fx_version 'cerulean'
game 'gta5'

name '${pkg.name}'
author '${pkg.author}'
version '${pkg.version}'
license '${pkg.license}'
repository '${pkg.repository.url}'
description '${pkg.description}'

dependencies {
    '/server:7290',
    '/onesync',
}

files {
    'lib/init.lua',
    'lib/client/**.lua',
    'locales/*.json',
    'common/data/*.json',
}

client_script 'dist/client.js'
server_script 'dist/server.js'

`
  );
}

const tsc = spawn(`tsc --build ${production ? '' : '--watch --preserveWatchOutput'} && tsc-alias`, {
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true,
});

if (production) {
  tsc.on('close', async (code) => {
    if (code !== 0) return process.exit(code);

    await build();

    process.exit(0);
  });
}

tsc.stdout.on('data', async (data) => {
  const output = data.toString();
  process.stdout.write(output);

  if (output.includes('Found 0 errors.')) {
    await build();
  }
});
