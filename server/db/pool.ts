import { createPool } from 'mariadb';
import { GetConfig } from './config';
import type { Pool } from 'mariadb';

export let pool: Pool;

setImmediate(async () => {
  const config = GetConfig();

  try {
    const dbPool = createPool(config);
    const version: string = (await dbPool.execute('SELECT VERSION() as version'))[0].version;
    const recommendedDb = `Install MariaDB 11.4 for the best experience.\n- https://mariadb.com/kb/en/changes-improvements-in-mariadb-11-4/`;

    if (!version.toLowerCase().match('mariadb'))
      return console.error(`MySQL ${version} is not supported. ${recommendedDb}`);

    const [major, minor] = version.split('.');

    if (+major < 11 || (+major === 11 && +minor < 4))
      return console.error(`${version} is not supported. ${recommendedDb}`);

    console.log(`${`^5[${version}]`} ^2Database server connection established!^0`);

    pool = dbPool;
  } catch (err) {
    console.log(
      `^3Unable to establish a connection to the database (${err.code})!\n^1Error ${err.errno}: ${err.message}^0`
    );

    if (config.password) config.password = '******';

    console.log(config);
  }
});
