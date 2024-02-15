declare type Dict<T> = { [key: string]: T };

declare interface NewCharacter {
  firstName: string;
  lastName: string;
  gender: string;
  date: number;
}

declare interface Character {
  charId: number;
  stateId: string;
  firstName: string;
  lastName: string;
  x?: number;
  y?: number;
  z?: number;
  heading?: number;
  lastPlayed?: string;
  health?: number;
  armour?: number;
  isNew?: boolean;
}

declare interface OxStatus {
  name: string;
  default: number;
  onTick: number;
}
