import type { PoolConfig } from 'mariadb';
import type { Dict } from 'types';

export function GetConfig(): PoolConfig {
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
}
