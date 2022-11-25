import { TopVehicleStats, VehicleData } from "./vehicle";

interface Ox {
  GetGroup: (name: string) => { name: string; label: string; grades: string[]; principal: string };
  GeneratePlate: () => Promise<string>;
  GetTopVehicleStats: (filter?: "land" | "air" | "sea") => TopVehicleStats;
  GetVehicleData: (filter?: string | string[] | { [key: string]: string | number }) => VehicleData;
  SaveAllPlayers: () => {};
}

export const Ox: Ox = exports.ox_core;

export * from "./player";
export * from "./vehicle";
