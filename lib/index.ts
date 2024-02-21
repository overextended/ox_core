import type { GetTopVehicleStats, GetVehicleData } from 'common/vehicles';

export interface OxCommon {
  [key: string]: (...args: any[]) => any;
  GetTopVehicleStats: typeof GetTopVehicleStats;
  GetVehicleData: typeof GetVehicleData;
}

export const OxCore = exports.ox_core as OxCommon;
