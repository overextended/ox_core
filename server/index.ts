export * from '../common';
import './bridge';
import 'player';
import 'utils';
import 'accounts';
import 'vehicle';
import { versionCheck } from '@overextended/ox_lib/server';
import { DEBUG } from 'config';

if (!DEBUG) {
  versionCheck('overextended/ox_core');
}
