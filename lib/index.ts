import type { GetTopVehicleStats, GetVehicleData, GetVehicleNetworkType } from 'common/vehicles';
import type { OxGroup } from 'types';

export type * from 'types';

export interface OxCommon {
  [key: string]: (...args: any[]) => any;
  GetTopVehicleStats: typeof GetTopVehicleStats;
  GetVehicleData: typeof GetVehicleData;
  GetVehicleNetworkType: typeof GetVehicleNetworkType;
}

export const Ox = exports.ox_core as OxCommon;

export function GetGroup(name: string): OxGroup {
  return GlobalState[`group.${name}`];
}
