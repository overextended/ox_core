export * from '../common';
import { PLATE_PATTERN } from 'config';
import 'player';
import 'spawn';
import 'death';
import 'vehicle';

for (let i = 0; i < GetNumberOfVehicleNumberPlates(); i++) {
  SetDefaultVehicleNumberPlateTextPattern(i, PLATE_PATTERN);
}
