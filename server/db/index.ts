import { createPool, PoolConfig, Pool, PoolConnection, QueryOptions } from 'mariadb';
import { sleep } from '@overextended/ox_lib';
import type { Dict } from 'types';

(Symbol as any).dispose ??= Symbol('Symbol.dispose');

export interface MySqlRow<T = string | number | boolean | Dict<any> | undefined> {
  [column: string]: T;
}

export interface OkPacket {
  affectedRows: number;
  insertId: number;
  warningStatus: any;
}

export const db = {
  getConnection: getConnection,
  async query<T>(query: string, values?: any[]) {
    await awaitConnection();
    return pool.query<T extends OkPacket ? OkPacket : T[]>(query, values);
  },
  async execute<T>(query: string, values?: any[]) {
    await awaitConnection();
    return pool.execute<T extends OkPacket ? OkPacket : T[]>(query, values);
  },
  async column<T>(query: string, values?: any[]) {
    return db.scalar(await db.execute<T[]>(query, values)) as T | null;
  },
  async exists<T>(query: string, values?: any[]) {
    return (db.scalar(await db.execute<T[]>(query, values)) as T) === 1;
  },
  async row<T>(query: string, values?: any[]) {
    return db.single(await db.execute<T[]>(query, values)) as T | null;
  },
  async insert(query: string, values?: any[]) {
    return (await db.execute<OkPacket>(query, values))?.insertId;
  },
  async update(query: string, values?: any[]) {
    return (await db.execute<OkPacket>(query, values))?.affectedRows;
  },
  batch(query: string, values?: any[]) {
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

async function awaitConnection() {
  while (!isServerConnected) await sleep(0);
}

export let pool: Pool;
let isServerConnected = false;
const connectionConfig: PoolConfig = (() => {
  const connectionString = GetConvar('mysql_connection_string', 'mysql://root@localhost').replace(
    'mysql://',
    'mariadb://'
  );

  function parseUri() {
    const splitMatchGroups = connectionString.match(
      new RegExp(
        '^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([\\w\\d\\-\\u0100-\\uffff.%]*)(?::([0-9]+))?)?([^?#]+)?(?:\\?([^#]*))?$'
      )
    ) as RegExpMatchArray;

    if (!splitMatchGroups) throw new Error(`mysql_connection_string structure was invalid (${connectionString})`);

    const authTarget = splitMatchGroups[2] ? splitMatchGroups[2].split(':') : [];

    return {
      user: authTarget[0] || undefined,
      password: authTarget[1] || undefined,
      host: splitMatchGroups[3],
      port: parseInt(splitMatchGroups[4]),
      database: splitMatchGroups[5].replace(/^\/+/, ''),
      ...(splitMatchGroups[6] &&
        splitMatchGroups[6].split('&').reduce<Dict<string>>((connectionInfo, parameter) => {
          const [key, value] = parameter.split('=');
          connectionInfo[key] = value;
          return connectionInfo;
        }, {})),
    };
  }

  const options: any = connectionString.includes('mariadb://')
    ? parseUri()
    : connectionString
        .replace(/(?:host(?:name)|ip|server|data\s?source|addr(?:ess)?)=/gi, 'host=')
        .replace(/(?:user\s?(?:id|name)?|uid)=/gi, 'user=')
        .replace(/(?:pwd|pass)=/gi, 'password=')
        .replace(/(?:db)=/gi, 'database=')
        .split(';')
        .reduce((connectionInfo: any, parameter: any) => {
          const [key, value] = parameter.split('=');
          if (key) connectionInfo[key] = value;
          return connectionInfo;
        }, {});

  if (typeof options.ssl === 'string') {
    try {
      options.ssl = JSON.parse(options.ssl);
    } catch (err) {
      console.log(`^3Failed to parse ssl in configuration (${err})!^0`);
    }
  }

  return {
    connectTimeout: 60000,
    ...options,
    namedPlaceholders: false,
    connectionLimit: true,
    multipleStatements: true,
    dateStrings: true,
    insertIdAsNumber: true,
    decimalAsNumber: true,
    autoJsonMap: false,
  };
})();

class Connection {
  public transaction?: boolean;

  constructor(public connection: PoolConnection) {}

  async execute<T = MySqlRow[] & OkPacket>(query: string | QueryOptions, values?: any[]) {
    return (await this.connection.execute(query, values)) as T;
  }

  async query<T = MySqlRow[] & OkPacket>(query: string | QueryOptions, values?: any[]) {
    return (await this.connection.query(query, values)) as T;
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

export type DbConnection = InstanceType<typeof Connection>;

export async function getConnection() {
  while (!isServerConnected) {
    await sleep(0);
  }

  const connection = new Connection(await pool.getConnection());

  return connection;
}

setImmediate(async () => {
  try {
    pool = createPool(connectionConfig);

    // pool.on('release', () => {
    //   console.log('released conn');
    // });

    const version: string = (await pool.execute('SELECT VERSION() as version'))[0].version;

    if (!version.toLowerCase().match('mariadb'))
      return console.error(`ox_core is specifically designed for use with MariaDB. You are using ${version}.`);

    isServerConnected = true;
    console.log(`${`^5[${version}]`} ^2Database server connection established!^0`);
  } catch (err) {
    console.log(
      `^3Unable to establish a connection to the database (${err.code})!\n^1Error ${err.errno}: ${err.message}^0`
    );

    if (connectionConfig.password) connectionConfig.password = '******';

    console.log(connectionConfig);
  }
});
