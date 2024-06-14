import { createPool } from 'mariadb';
import { GetConfig } from './config';
import type { Pool } from 'mariadb';

export let pool: Pool;

setImmediate(async () => {
  const config = GetConfig();

  try {
    pool = createPool(config);

    const version: string = (await pool.execute('SELECT VERSION() as version'))[0].version;

    if (!version.toLowerCase().match('mariadb'))
      return console.error(`ox_core is specifically designed for use with MariaDB. You are using ${version}.`);

    console.log(`${`^5[${version}]`} ^2Database server connection established!^0`);
  } catch (err) {
    console.log(
      `^3Unable to establish a connection to the database (${err.code})!\n^1Error ${err.errno}: ${err.message}^0`
    );

    if (config.password) config.password = '******';

    console.log(config);
  }
});
