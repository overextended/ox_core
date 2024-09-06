//@ts-check

import { createBuilder, createFxmanifest } from '@overextended/fx-utils';

const watch = process.argv.includes('--watch');

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
        target: ['node16'],
        format: 'cjs',
      },
    },
    {
      name: 'client',
      options: {
        platform: 'browser',
        target: ['es2021'],
        format: 'iife',
      },
    },
  ],
  async (files) => {
    await createFxmanifest({
      client_scripts: [files.client],
      server_scripts: [files.server],
      files: ['lib/init.lua', 'lib/client/**.lua', 'locales/*.json', 'common/data/*.json'],
      dependencies: ['/server:7290', '/onesync'],
    });
  }
);
