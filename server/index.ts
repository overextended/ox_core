export * from '../common';
import './bridge';
import 'player';
import 'utils';
import 'accounts';
import 'vehicle';
import { versionCheck } from '@communityox/ox_lib/server';
import { DEBUG } from 'config';

if (!DEBUG) {
  versionCheck('communityox/ox_core');
}
