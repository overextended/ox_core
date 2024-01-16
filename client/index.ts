export * from '../common';
import { PLATE_PATTERN } from 'config';
import 'player/spawn';

for (let i = 0; i < GetNumberOfVehicleNumberPlates(); i++) {
  SetDefaultVehicleNumberPlateTextPattern(i, PLATE_PATTERN);
}

DEV: import(`../lib/client`);
