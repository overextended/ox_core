export class ClassInterface {
  protected static members: Dict<any>;
  protected static keys?: Dict<Dict<any>>;
  protected static callableMethods: Dict<true>;

  static init() {
    const classMethods = Object.getOwnPropertyNames(this.prototype);

    if (classMethods) {
      this.callableMethods = {};

      classMethods.forEach((method) => {
        if (method !== 'constructor') this.callableMethods[method] = true;
      });
    }

    const name = this.name;
    const expName = this.name.replace('Ox', '');

    // e.g. exports.ox_core.GetPlayer
    exports(`Get${expName}`, (id: string) => {
      return this.members[id];
    });

    // e.g. exports.ox_core.GetPlayers
    exports(`Get${expName}s`, () => {
      return this.members;
    });

    // e.g. exports.ox_core.GetPlayerCalls
    exports(`Get${expName}Calls`, () => {
      return this.callableMethods;
    });

    // e.g. exports.ox_core.CallPlayer
    exports(`Call${expName}`, (id: string | number, method: string, ...args: any[]) => {
      const member = this.members[id];

      if (!member) return console.error(`cannot call method ${method} on ${name}<${id}> (invalid player)`);

      if (!this.callableMethods[method])
        return console.error(`cannot call method ${method} on ${name}<${id}> (method is not exported)`);

      if (!member[method])
        return console.error(`cannot call method ${method} on ${name}<${id}> (method does not exist)`);

      return member[method](...args);
    });

    DEV: console.info(`Instantiated ClassInterface<${name}> and exports`);

    return this;
  }

  static get(id: string | number) {
    return this.members[id];
  }

  static getAll() {
    return this.members;
  }

  static add(id: string | number, member: any) {
    if (this.members[id]) return false;

    this.members[id] = member;

    if (this.keys) {
      Object.entries(this.keys).forEach(([key, obj]) => {
        obj[member[key]] = member;
      });
    }

    return true;
  }

  static remove(id: string | number) {
    const member = this.members[id];

    if (!member) return false;

    if (this.keys) {
      Object.entries(this.keys).forEach(([key, obj]) => {
        if (member[key]) {
          delete obj[member[key]];
        }
      });
    }

    delete this.members[id];

    return true;
  }
}
