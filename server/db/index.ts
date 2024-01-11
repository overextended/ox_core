import { getConnection } from './pool';

(Symbol as any).dispose ??= Symbol('Symbol.dispose');

export interface MySqlRow<T = string | number | boolean | bigint | Dict<any> | void> {
  [column: string]: T;
}

export interface OkPacket {
  affectedRows: number;
  insertId: number | bigint;
  warningStatus: any;
}

export const db = {
  getConnection: getConnection,
  scalar<T>(resp: MySqlRow<T>[]): T | void {
    if (resp[0]) for (const key in resp[0]) return resp[0][key];
  },
  single<T>(resp: T[]): T | void {
    return resp[0];
  },
};
