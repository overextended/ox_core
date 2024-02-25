import type { GetTopVehicleStats, GetVehicleData } from 'common/vehicles';

export type * from '../types';

export interface OxCommon {
  [key: string]: (...args: any[]) => any;
  GetTopVehicleStats: typeof GetTopVehicleStats;
  GetVehicleData: typeof GetVehicleData;
}

export const Ox = exports.ox_core as OxCommon;
