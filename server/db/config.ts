import type { PoolConfig } from 'mariadb';
import type { Dict } from 'types';

function splitOnce(str: string, separator: string): [string, string | undefined] {
  const index = str.indexOf(separator);
  return index === -1 ? [str, undefined] : [str.slice(0, index), str.slice(index + 1)];
}

function decodeUriComponent(str?: string) {
  if (!str) return str;

  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

export function GetConfig(): PoolConfig {
  const connectionString = GetConvar('mysql_connection_string', 'mysql://root@localhost').replace(
    'mysql://',
    'mariadb://',
  );

  function parseUri() {
    const splitMatchGroups = connectionString.match(
      new RegExp(
        '^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([\\w\\d\\-\\u0100-\\uffff.%]*)(?::([0-9]+))?)?([^?#]+)?(?:\\?([^#]*))?$',
      ),
    ) as RegExpMatchArray;

    if (!splitMatchGroups) throw new Error(`mysql_connection_string structure was invalid (${connectionString})`);

    const [user, password] = splitMatchGroups[2] ? splitOnce(splitMatchGroups[2], ':') : [];

    return {
      user: decodeUriComponent(user) || undefined,
      password: decodeUriComponent(password) || undefined,
      host: splitMatchGroups[3],
      port: Number.parseInt(splitMatchGroups[4]),
      database: splitMatchGroups[5]?.replace(/^\/+/, '') || 'overextended',
      ...(splitMatchGroups[6] &&
        splitMatchGroups[6].split('&').reduce<Dict<string>>((connectionInfo, parameter) => {
          const [key, value] = splitOnce(parameter, '=');
          if (key) connectionInfo[key] = value as string;
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
    connectionLimit: 5,
    acquireTimeout: 30000,
    ...options,
    namedPlaceholders: false,
    multipleStatements: true,
    dateStrings: true,
    insertIdAsNumber: true,
    decimalAsNumber: true,
    autoJsonMap: true,
    jsonStrings: false,
  };
}
