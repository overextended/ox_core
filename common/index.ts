import { checkDependency } from '@overextended/ox_lib/';
import type { OxGroupPermissions } from 'types';

if (!checkDependency('ox_lib', '3.24.0', true)) throw new Error(`Failed dependency check.`);

export function LoadDataFile(file: string) {
  return JSON.parse(LoadResourceFile('ox_core', `/common/data/${file}.json`));
}

export function GetGroupPermissions(groupName: string): OxGroupPermissions {
  return GlobalState[`group.${groupName}:permissions`] || {};
}

console.info = (...args: any[]) => console.log(`^3${args.join('\t')}^0`);

DEV: console.info(`Resource ${GetCurrentResourceName()} is running in development mode!`);

import './vehicles';
