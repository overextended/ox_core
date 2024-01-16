import esbuild from 'esbuild';
import { readFile, readFileSync, writeFileSync } from 'fs';

/** @type {import('esbuild').BuildOptions} */
const server = {
  platform: 'node',
  target: ['node16'],
  format: 'cjs',
};

/** @type {import('esbuild').BuildOptions} */
const client = {
  platform: 'browser',
  target: ['chrome93'],
  format: 'iife',
};

const production = process.argv.includes('--mode=production');
const buildCmd = production ? esbuild.build : esbuild.context;
const wordWrap = new RegExp(`.{1,65}\\s+|\\S+`, 'g');
const packageJson = JSON.parse(readFileSync('package.json', { encoding: 'utf8' }));
const copyright = readFileSync('README.md', { encoding: 'utf8' })
  .replace(/[\s\S]*?## Copyright/, '')
  .match(wordWrap)
  .join('\n  * ')
  .replace(/\n{2,}/g, '\n');

console.log(copyright.split('\n')[0]);

writeFileSync(
  'fxmanifest.lua',
  `fx_version 'cerulean'
game 'gta5'

name '${packageJson.name}'
author '${packageJson.author}'
version '${packageJson.version}'
license '${packageJson.license}'
repository '${packageJson.repository.url}'
description '${packageJson.description}'

dependencies {
    '/server:7290',
    '/onesync',
}

files {
    'lib/init.lua',
    'lib/client/**.lua',
    'imports/client.lua',
    'locales/*.json',
    'common/data/*.json',
}

client_script 'dist/client.js'
server_script 'dist/server.js'

`
);

for (const context of ['client', 'server']) {
  buildCmd({
    bundle: true,
    entryPoints: [`${context}/index.ts`],
    outfile: `dist/${context}.js`,
    keepNames: true,
    dropLabels: production ? ['DEV'] : undefined,
    legalComments: 'inline',
    banner: {
      js: `/**\n  * ${copyright}  */`,
    },
    plugins: production
      ? undefined
      : [
          {
            name: 'rebuild',
            setup(build) {
              const cb = (result) => {
                if (!result || result.errors.length === 0) console.log(`Successfully built ${context}`);
              };
              build.onEnd(cb);
            },
          },
        ],
    ...(context === 'client' ? client : server),
  })
    .then((build) => {
      if (production) return console.log(`Successfully built ${context}`);

      build.watch();
    })
    .catch(() => process.exit(1));
}
