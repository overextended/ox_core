const exp = exports.ox_core.CAccount;

export class CAccount {
  owner: number | string;

  constructor(data: any) {
    this.owner = data.owner;
  }

  get(key: string): any {
    return exp(this.owner, "get", key);
  }

  set(key: string, value: number) {
    exp(this.owner, "set", key, value);
  }

  add(key: string, value: number) {
    exp(this.owner, "add", key, value);
  }

  remove(key: string, value: number) {
    exp(this.owner, "remove", key, value);
  }
}

export function GetAccounts(owner: number | string) {
  return new CAccount({ owner: owner });
}
