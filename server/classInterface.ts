import { Dict } from 'types';

export class ClassInterface {
  protected static members: Dict<any>;
  protected static keys?: Dict<Dict<any>>;
  protected static callableMethods: Dict<true>;

  /** Exports several class methods and makes non-private methods callable from external resources. */
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

  /** Get a member of the class by its id. */
  static get(id: string | number) {
    return this.members[id];
  }

  /** Get all members of the class. */
  static getAll() {
    return this.members;
  }

  /** Adds a new member of the class to its registries. */
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

  /** Removes a member of the class from its registries. */
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
