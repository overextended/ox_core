import { sleep } from '@overextended/ox_lib';
import { pool } from './pool';
import type { Dict } from 'types';
import type { PoolConnection, QueryOptions } from 'mariadb';

(Symbol as any).dispose ??= Symbol('Symbol.dispose');

export interface MySqlRow<T = string | number | boolean | Dict<any> | undefined> {
  [column: string]: T;
}

export interface OkPacket {
  affectedRows: number;
  insertId: number;
  warningStatus: any;
}

function getScalar<T>(resp: T[] | null) {
  if (resp && resp[0]) for (const key in resp[0]) return resp[0][key] as T;
  return null;
}

function getRow<T>(resp: T[] | null) {
  return resp ? resp[0] : null;
}

export class Connection {
  public transaction?: boolean;

  constructor(public connection: PoolConnection) {}

  async execute<T = MySqlRow[] & OkPacket>(query: string | QueryOptions, values?: any[]) {
    return (await this.connection.execute(query, values)) as T;
  }

  async query<T = MySqlRow[] & OkPacket>(query: string | QueryOptions, values?: any[]) {
    return (await this.connection.query(query, values)) as T;
  }

  async scalar<T>(query: string | QueryOptions, values?: any[]) {
    return getScalar(await this.execute<T[]>(query, values)) as T | null;
  }

  async row<T>(query: string | QueryOptions, values?: any[]) {
    return getRow(await this.execute<T[]>(query, values)) as T | null;
  }

  async insert(query: string | QueryOptions, values?: any[]) {
    return (await this.execute<OkPacket>(query, values))?.insertId;
  }

  async update(query: string | QueryOptions, values?: any[]) {
    return (await this.execute<OkPacket>(query, values))?.affectedRows;
  }

  batch(query: string | QueryOptions, values?: any[]) {
    return this.connection.batch(query, values);
  }

  beginTransaction() {
    this.transaction = true;
    return this.connection.beginTransaction();
  }

  rollback() {
    delete this.transaction;
    return this.connection.rollback();
  }

  commit() {
    return this.connection.commit();
  }

  [Symbol.dispose]() {
    if (this.transaction) this.commit();
    this.connection.release();
  }
}

export async function GetConnection() {
  while (!pool) await sleep(0);

  return new Connection(await pool.getConnection());
}

export const db = {
  async query<T>(query: string | QueryOptions, values?: any[]) {
    using conn = await GetConnection();
    return conn.query<T extends OkPacket ? OkPacket : T[]>(query, values);
  },
  async execute<T>(query: string | QueryOptions, values?: any[]) {
    using conn = await GetConnection();
    return conn.execute<T extends OkPacket ? OkPacket : T[]>(query, values);
  },
  async column<T>(query: string | QueryOptions, values?: any[]) {
    return db.scalar(await db.execute<T[]>(query, values)) as T | null;
  },
  async exists<T>(query: string | QueryOptions, values?: any[]) {
    return (db.scalar(await db.execute<T[]>(query, values)) as T) === 1;
  },
  async row<T>(query: string | QueryOptions, values?: any[]) {
    return db.single(await db.execute<T[]>(query, values)) as T | null;
  },
  async insert(query: string | QueryOptions, values?: any[]) {
    return (await db.execute<OkPacket>(query, values))?.insertId;
  },
  async update(query: string | QueryOptions, values?: any[]) {
    return (await db.execute<OkPacket>(query, values))?.affectedRows;
  },
  batch(query: string | QueryOptions, values?: any[]) {
    return pool.batch(query, values);
  },
  scalar<T>(resp: T[] | null) {
    if (resp && resp[0]) for (const key in resp[0]) return resp[0][key] as T;
    return null;
  },
  single<T>(resp: T[] | null) {
    return resp ? resp[0] : null;
  },
};
