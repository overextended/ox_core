import { checkDependency } from '@overextended/ox_lib/';
import type { OxGroupPermissions } from 'types';

if (!checkDependency('ox_lib', '3.20.0', true)) throw new Error(`Failed dependency check.`);

export function LoadDataFile(file: string) {
  return JSON.parse(LoadResourceFile('ox_core', `/common/data/${file}.json`));
}

export function VectorFromBuffer({ buffer }: any) {
  const arr = [];

  for (let offset = 0; offset < buffer.length; offset += 4) arr.push(buffer.readFloatLE(offset));

  return arr;
}

export function GetGroupPermissions(groupName: string): OxGroupPermissions {
  return GlobalState[`group.${groupName}:permissions`] || {};
}

console.info = (...args: any[]) => console.log(`^3${args.join('\t')}^0`);

DEV: console.info(`Resource ${GetCurrentResourceName()} is running in development mode!`);

import './vehicles';

