//@ts-check

import { createBuilder, createFxmanifest } from '@overextended/fx-utils';
import { spawn } from 'child_process';

const watch = process.argv.includes('--watch');

function exec(command) {
  return new Promise((resolve) => {
    const child = spawn(command, { stdio: 'inherit', shell: true });

    child.on('exit', (code) => {
      resolve(code === 0);
    });
  });
}

if (!watch) {
  const tsc = await exec(`tsc --build ${watch ? '--watch --preserveWatchOutput' : ''} && tsc-alias`);

  if (!tsc) process.exit(0);
}

createBuilder(
  watch,
  {
    dropLabels: !watch ? ['DEV'] : undefined,
  },
  [
    {
      name: 'server',
      options: {
        platform: 'node',
        target: ['node22'],
        format: 'cjs',
        entryPoints: [`./server/index.ts`],
      },
    },
    {
      name: 'client',
      options: {
        platform: 'browser',
        target: ['es2021'],
        format: 'iife',
        entryPoints: [`./client/index.ts`],
      },
    },
  ],
  async (files) => {
    await createFxmanifest({
      client_scripts: [files.client],
      server_scripts: [files.server],
      files: ['lib/init.lua', 'lib/client/**.lua', 'locales/*.json', 'common/data/*.json'],
      dependencies: ['/server:12913', '/onesync'],
      metadata: { node_version: '22' }
    });
  }
);
