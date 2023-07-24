import { TopVehicleStats, VehicleData } from "./vehicle";
import { PlayerIdentifiers } from "./player";

interface Ox {
  GetIdentifiers: (playerId: number) => PlayerIdentifiers;
  GetGroup: (name: string) => { name: string; label: string; grades: string[]; principal: string };
  GeneratePlate: () => Promise<string>;
  GenerateVin: (model: string) => Promise<string>;
  GenerateStateId: () => Promise<string>;
  GetTopVehicleStats: (filter?: "land" | "air" | "sea") => TopVehicleStats;
  GetVehicleData: (
    filter?: string | string[] | { [key: string]: string | number }
  ) => VehicleData | Record<string, VehicleData>;
  SaveAllPlayers: () => {};
  [key: string]: Function;
}

export const Ox: Ox = exports.ox_core;

export * from "./player";
export * from "./vehicle";
