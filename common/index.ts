console.info = (...args: any[]) => console.log(`^3${args.join('\t')}^0`);

DEV: console.info(`Resource ${GetCurrentResourceName()} is running in development mode!`);

export function Sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms, null));
}

export function GetRandomInt(min = 0, max = 9) {
  if (min > max) [min, max] = [max, min];

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function GetRandomChar() {
  return String.fromCharCode(GetRandomInt(65, 90));
}

export function GetRandomAlphanumeric() {
  return GetRandomInt(0, 1) === 1 ? GetRandomChar() : GetRandomInt();
}
